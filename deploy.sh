#!/bin/bash

# 遇到錯誤時立即停止執行
set -e

# 1. 專案編譯
npm run build

# 2. 停止目前的 PM2 程序
pm2 stop NCUE-Scholarship || true
pm2 delete NCUE-Scholarship || true

# 3. 啟動新程序
pm2 start npm --name "NCUE-Scholarship" -- run start

# 4. 儲存 PM2 列表以便重開機自動啟動
pm2 save

echo "部署完成！"