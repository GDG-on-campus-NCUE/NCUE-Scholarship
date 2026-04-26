import { NextResponse } from 'next/server';
import { MetricServiceClient } from '@google-cloud/monitoring';
import { BigQuery } from '@google-cloud/bigquery';
import { getSystemConfig } from '@/lib/config';
import { verifyUserAuth, handleApiError } from '@/lib/apiMiddleware';

export async function GET(request) {
  try {
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/admin/system/usage'
    });
    
    if (!authCheck.success) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    
    const gcpKeyString = await getSystemConfig('GCP_SERVICE_ACCOUNT_JSON');
    if (!gcpKeyString) return NextResponse.json({ error: 'GCP Key not configured' }, { status: 400 });

    const credentials = JSON.parse(gcpKeyString);
    const projectId = credentials.project_id;
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');

    const authOptions = {
        credentials: { client_email: credentials.client_email, private_key: privateKey },
        projectId,
    };

    // 1. 獲取流量 (Cloud Monitoring)
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const monitoringClient = new MetricServiceClient(authOptions);
    const [timeSeries] = await monitoringClient.listTimeSeries({
      name: monitoringClient.projectPath(projectId),
      filter: `metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.labels.service="generativelanguage.googleapis.com"`,
      interval: {
        startTime: { seconds: Math.floor(startDate.getTime() / 1000) },
        endTime: { seconds: Math.min(Math.floor(endDate.getTime() / 1000), Math.floor(Date.now() / 1000)) },
      },
    });

    const dailyData = {};
    for (let i = 1; i <= endDate.getDate(); i++) {
        const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
        dailyData[dateStr] = { date: dateStr, count: 0, cost: 0 };
    }

    let totalRequests = 0;
    timeSeries.forEach(series => {
        series.points.forEach(point => {
            const date = new Date(point.interval.endTime.seconds * 1000).toISOString().split('T')[0];
            const value = parseInt(point.value.int64Value || 0);
            if (dailyData[date]) {
                dailyData[date].count += value;
                totalRequests += value;
            }
        });
    });

    // 2. 獲取金額 (BigQuery)
    let totalEstimatedCost = 0;
    let isRealBillingData = false;
    let billingTableId = await getSystemConfig('GCP_BILLING_TABLE_ID');
    
    // 預防性修正：移除可能被使用者誤加的引號或空格
    billingTableId = billingTableId?.trim().replace(/[`'"]/g, '');

    if (billingTableId && billingTableId.split('.').length >= 2) {
        try {
            // 如果 ID 只有兩段 (project.dataset)，這通常是錯誤的，BQ 需要三段
            if (billingTableId.split('.').length === 2) {
                console.warn('[Usage API] Warning: GCP_BILLING_TABLE_ID should be "project.dataset.table". Currently 2 segments.');
            }

            const bigquery = new BigQuery(authOptions);
            
            // 獲取設定中的位置 (Location)，若無則不指定讓 SDK 自行偵測或報錯更詳細
            const queryLocation = await getSystemConfig('GCP_BILLING_LOCATION') || null;

            const query = `
                SELECT 
                    DATE(usage_start_time) as usage_date,
                    SUM(cost) as raw_cost,
                    SUM((SELECT SUM(c.amount) FROM UNNEST(credits) c)) as total_credits
                FROM \`${billingTableId}\`
                WHERE FORMAT_TIMESTAMP('%Y-%m', usage_start_time) = @targetMonth
                AND (
                    service.description LIKE '%Gemini%' 
                    OR service.description LIKE '%Generative Language%' 
                    OR service.description LIKE '%Vertex AI%'
                    OR sku.description LIKE '%Gemini%'
                )
                GROUP BY usage_date
                ORDER BY usage_date ASC
            `;
            
            const [rows] = await bigquery.query({
                query,
                params: { targetMonth: selectedMonth },
                location: queryLocation // 支援指定地點
            });

            if (rows.length > 0) {
                isRealBillingData = true;
                rows.forEach(row => {
                    const dateStr = row.usage_date.value;
                    const netCost = row.raw_cost + (row.total_credits || 0);
                    // 確保 netCost 是數字且處理精度
                    const parsedCost = parseFloat(netCost) || 0;
                    if (dailyData[dateStr]) dailyData[dateStr].cost = parseFloat(parsedCost.toFixed(4));
                    totalEstimatedCost += parsedCost;
                });
            }
        } catch (bqError) {
            console.error('[Usage API] BigQuery Error:', bqError.message);
            // 如果是因為地點問題，在日誌中提示
            if (bqError.message.includes('location')) {
                console.warn('[Usage API] Tip: Try setting GCP_BILLING_LOCATION to your dataset region (e.g., "asia-east1").');
            }
        }
    }

    if (!isRealBillingData) {
        // 2026 更新：更精確的預估 (考慮 TWD 匯率)
        // 假設平均請求包含較長 context 或使用 Pro 模型
        // $0.005 USD (約 0.16 TWD) per request 是一個更安全的預估值
        const USD_TO_TWD = 32.5;
        const ESTIMATION_FACTOR_USD = 0.0056; // 根據使用者回饋之 $657/3594 換算約 $0.18 TWD
        const ESTIMATION_FACTOR_TWD = ESTIMATION_FACTOR_USD * USD_TO_TWD;
        
        Object.keys(dailyData).forEach(date => {
            dailyData[date].cost = parseFloat((dailyData[date].count * ESTIMATION_FACTOR_TWD).toFixed(4));
        });
        totalEstimatedCost = totalRequests * ESTIMATION_FACTOR_TWD;
    }

    return NextResponse.json({
        success: true,
        month: selectedMonth,
        usage: {
            total: totalRequests,
            chartData: Object.values(dailyData).sort((a,b) => a.date.localeCompare(b.date))
        },
        billing: {
            estimatedCost: totalEstimatedCost.toFixed(2),
            currency: 'TWD',
            isEstimated: !isRealBillingData
        }
    });

  } catch (error) {
    console.error('[Usage API] Global Error:', error);
    return handleApiError(error, '/api/admin/system/usage');
  }
}
