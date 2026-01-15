# 系統維護與自動化規劃 (System Maintenance & Automation Plan)

## 原始需求
> 幫我撰寫一個能夠定期備份 SUPABASE 資料庫以及所有公告附檔的腳本，並每天凌晨 3. 會自動關機，於開機後會自動重啟前後端服務

---

## 1. 系統環境分析 (System Environment)
- **作業系統**: Linux
- **專案路徑**: `/var/www/html/NCUE-Scholarship`
- **資料庫**: Supabase (PostgreSQL)
  - 自架版 (Self-hosted)，Docker Container 名稱預設為 `supabase-db`。
- **行程管理**: PM2
- **執行權限分析**:
  - **Docker**: 一般使用者若無 `docker` 群組權限，執行 `docker` 指令會失敗 (Permission denied)。
  - **重啟**: `/sbin/reboot` 需要 Root 權限。
  - **結論**: **為了達成「自動執行且不需輸入密碼」，必須將排程設定在 Root 使用者的 Crontab 中**。

## 2. 功能模組規劃 (Modules)

### 2.1 資料備份 (Data Backup)
- **腳本位置**: `scripts/daily_backup.sh`
- **執行身分**: Root (透過 Crontab)
- **功能**:
  - 自動讀取 `.env` 環境變數。
  - `docker exec` 備份資料庫 (Root 執行無需密碼)。
  - `tar` 備份 `attachments`。
  - 自動清理 7 天前舊檔。

### 2.2 定期自動重啟 (Scheduled Reboot)
- **實作方式**: Root Crontab
- **指令**: `/sbin/reboot`
- **時間**: `0 3 * * *` (每天 03:00)

### 2.3 開機自動重啟服務 (Auto-Restart on Boot)
- **實作方式**: PM2 Startup Hook
- **狀態**: 已完成 (`pm2 startup` 指令已生成 systemd 設定)。

## 3. 執行步驟 (Action Plan)

### 第一階段：腳本撰寫 (Scripting) - 已完成
- [x] **建立備份目錄**: `backups/`。
- [x] **撰寫 `scripts/daily_backup.sh`**: 包含 DB 與檔案備份、自動清理。
- [x] **Git 設定**: `/backups/` 已加入 `.gitignore`。
- [x] **腳本權限**: 已賦予 `chmod +x`。

### 第二階段：排程設定 (Scheduling) - 待執行
**關鍵步驟**: 必須設定 **Root** 的 Crontab，而非當前使用者的。

1. **開啟 Root Crontab 編輯模式**:
   ```bash
   sudo crontab -e
   ```
2. **新增以下兩行排程**:
   ```cron
   # 每天 02:30 執行備份
   30 2 * * * /var/www/html/NCUE-Scholarship/scripts/daily_backup.sh >> /var/www/html/NCUE-Scholarship/backups/cron_backup.log 2>&1

   # 每天 03:00 自動重啟
   0 3 * * * /sbin/reboot
   ```
   *(注意：請確認腳本路徑是否絕對正確)*

### 第三階段：服務守護配置 (Service Setup) - 已完成
- [x] **建置專案**: `npm run build`
- [x] **啟動服務**: `npm run pm2:start`
- [x] **設定自啟**: `pm2 save` && `pm2 startup`

## 4. 常見問題與解決 (FAQ)

### Q: 為什麼執行腳本時會出現 `Permission denied`？
**A**: 因為您目前的使用者 `mingchen4865` 沒有執行 Docker 的權限。
- **解決方案 A (推薦)**: 使用 Root Crontab 自動執行 (如上述規劃)，這樣完全不需要密碼。
- **解決方案 B (僅供手動測試)**: 將使用者加入 docker 群組：`sudo usermod -aG docker $USER`，然後重新登入。

### Q: 如何確認排程是否生效？
**A**:
1. 檢查 log 檔：`tail -f /var/www/html/NCUE-Scholarship/backups/cron_backup.log`
2. 檢查 Crontab 列表：`sudo crontab -l`
