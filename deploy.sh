#!/bin/bash

# --- 自動化部署腳本 for NCUE-Scholarship ---
# 1. 停止並刪除舊的 PM2 process
# 2. 執行 npm run build 重新建置專案
# 3. 使用 ecosystem.config.js 啟動新的 PM2 process
# 4. 保存 PM2 設定，以便開機時自動重啟

# 如果任何指令失敗，則立即停止腳本
set -e

# 定義 PM2 的應用程式名稱（與 ecosystem.config.js 中的 name 相同）
APP_NAME="NCUE-Scholarship"

echo "--- [Deployment] Starting deployment for $APP_NAME... ---"

# 停止並刪除舊的 process（加上 '|| true' 可防止在 process 不存在時報錯中斷）
echo "--- [Deployment] Step 1: Stopping and deleting old PM2 process..."
pm2 stop "$APP_NAME" || true
pm2 delete "$APP_NAME" || true
echo "--- [Deployment] Old process stopped and deleted."

# 重新建置 Next.js 應用
echo "--- [Deployment] Step 2: Building Next.js application (npm run build)..."
npm run build
echo "--- [Deployment] Build completed."

# 使用 ecosystem.config.js 啟動新應用
echo "--- [Deployment] Step 3: Starting new application process with PM2..."
pm2 start ecosystem.config.js
echo "--- [Deployment] New process started."

# 儲存 PM2 設定
echo "--- [Deployment] Step 4: Saving PM2 process list..."
pm2 save
echo "--- [Deployment] PM2 list saved."

echo ""
echo "--- [Deployment] Deployment finished successfully! ---"
echo "--- Use 'pm2 logs $APP_NAME' to monitor the application. ---"
