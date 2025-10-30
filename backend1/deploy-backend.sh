#!/bin/bash

# 后端部署脚本
echo "开始部署后端应用到Azure..."

# 清理并构建
echo "清理并构建项目..."
mvn clean package -DskipTests

# 检查JAR文件是否存在
if [ ! -f "target/quiz-backend-mvp-1.0.0.jar" ]; then
    echo "错误: JAR文件不存在，构建失败"
    exit 1
fi

# 部署到Azure
echo "部署到Azure App Service..."
az webapp deploy \
  --resource-group quiz-app-rg \
  --name quiz-backend-app \
  --src-path target/quiz-backend-mvp-1.0.0.jar \
  --type jar

echo "后端部署完成！"
echo "访问地址: https://quiz-backend-app.azurewebsites.net"