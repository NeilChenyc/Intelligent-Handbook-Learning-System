#!/bin/bash

# 前端部署脚本
echo "开始部署前端应用到Azure..."

# 安装依赖
echo "安装依赖..."
npm install

# 构建生产版本
echo "构建生产版本..."
npm run build

# 部署到Azure
echo "部署到Azure App Service..."
az webapp deploy \
  --resource-group quiz-app-rg \
  --name quiz-frontend-app \
  --src-path build \
  --type static

echo "前端部署完成！"
echo "访问地址: https://quiz-frontend-app.azurewebsites.net"