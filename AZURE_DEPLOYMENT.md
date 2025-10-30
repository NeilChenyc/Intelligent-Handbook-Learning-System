# Azure云部署指南

## 📋 部署概览

本项目包含前端React应用和后端Spring Boot应用，完整部署到Azure云平台。

### 架构组件
- **前端**: React 18 + Tailwind CSS
- **后端**: Spring Boot 3.2 + Java 17
- **数据库**: Azure Database for PostgreSQL
- **AI服务**: OpenAI API集成

## 🚀 快速部署步骤

### 1. 准备工作

#### 安装Azure CLI
```bash
# macOS
brew install azure-cli

# 登录Azure
az login
```

#### 设置环境变量
```bash
export RESOURCE_GROUP="quiz-app-rg"
export LOCATION="East Asia"
export DB_SERVER="quiz-app-db-server"
export DB_NAME="quizdb"
export DB_USER="quizadmin"
export DB_PASSWORD="YourSecurePassword123!"
export BACKEND_APP="quiz-backend-app"
export FRONTEND_APP="quiz-frontend-app"
```

### 2. 创建Azure资源

#### 创建资源组
```bash
az group create --name $RESOURCE_GROUP --location "$LOCATION"
```

#### 创建PostgreSQL数据库
```bash
# 创建PostgreSQL服务器
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --location "$LOCATION" \
  --admin-user $DB_USER \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14

# 创建数据库
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --database-name $DB_NAME

# 配置防火墙
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### 创建App Service计划
```bash
az appservice plan create \
  --name quiz-app-plan \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux
```

### 3. 部署后端应用

#### 创建后端Web应用
```bash
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan quiz-app-plan \
  --name $BACKEND_APP \
  --runtime "JAVA:17-java17"
```

#### 配置应用设置
```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings \
    AZURE_POSTGRESQL_HOST="$DB_SERVER.postgres.database.azure.com" \
    AZURE_POSTGRESQL_DATABASE="$DB_NAME" \
    AZURE_POSTGRESQL_USERNAME="$DB_USER" \
    AZURE_POSTGRESQL_PASSWORD="$DB_PASSWORD" \
    OPENAI_API_KEY="your-openai-api-key" \
    SPRING_PROFILES_ACTIVE="azure" \
    FRONTEND_URL="https://$FRONTEND_APP.azurewebsites.net"
```

#### 构建并部署
```bash
cd backend1
chmod +x deploy-backend.sh
./deploy-backend.sh
```

### 4. 部署前端应用

#### 创建前端Web应用
```bash
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan quiz-app-plan \
  --name $FRONTEND_APP \
  --runtime "NODE:18-lts"
```

#### 配置前端环境变量
```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --settings \
    REACT_APP_API_BASE_URL="https://$BACKEND_APP.azurewebsites.net" \
    REACT_APP_ENVIRONMENT="production" \
    GENERATE_SOURCEMAP="false"
```

#### 构建并部署
```bash
cd ..  # 回到项目根目录
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

## 🔧 配置详情

### 数据库迁移
由于你当前使用Supabase，需要迁移数据：

1. **导出Supabase数据**
```bash
# 使用pg_dump导出数据
pg_dump "your-supabase-connection-string" > backup.sql
```

2. **导入到Azure PostgreSQL**
```bash
# 导入数据到Azure
psql "host=$DB_SERVER.postgres.database.azure.com port=5432 dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=require" < backup.sql
```

### 环境变量配置

#### 后端环境变量
- `AZURE_POSTGRESQL_HOST`: PostgreSQL服务器地址
- `AZURE_POSTGRESQL_DATABASE`: 数据库名称
- `AZURE_POSTGRESQL_USERNAME`: 数据库用户名
- `AZURE_POSTGRESQL_PASSWORD`: 数据库密码
- `OPENAI_API_KEY`: OpenAI API密钥
- `SPRING_PROFILES_ACTIVE`: 激活的Spring配置文件

#### 前端环境变量
- `REACT_APP_API_BASE_URL`: 后端API地址
- `REACT_APP_ENVIRONMENT`: 运行环境
- `GENERATE_SOURCEMAP`: 是否生成源码映射

## 🔄 CI/CD自动化部署

### GitHub Actions设置

1. **创建Azure服务主体**
```bash
az ad sp create-for-rbac --name "quiz-app-github" --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth
```

2. **在GitHub仓库中设置Secrets**
- `AZURE_CREDENTIALS`: 上一步生成的JSON

3. **推送代码触发自动部署**
```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

## 📊 监控和日志

### 查看应用日志
```bash
# 后端日志
az webapp log tail --resource-group $RESOURCE_GROUP --name $BACKEND_APP

# 前端日志
az webapp log tail --resource-group $RESOURCE_GROUP --name $FRONTEND_APP
```

### 应用监控
```bash
# 启用Application Insights
az monitor app-insights component create \
  --app quiz-app-insights \
  --location "$LOCATION" \
  --resource-group $RESOURCE_GROUP
```

## 🌐 访问地址

部署完成后，应用访问地址：
- **前端**: https://quiz-frontend-app.azurewebsites.net
- **后端API**: https://quiz-backend-app.azurewebsites.net
- **数据库**: quiz-app-db-server.postgres.database.azure.com

## 🔒 安全配置

### SSL证书
Azure App Service自动提供SSL证书，支持HTTPS访问。

### 自定义域名（可选）
```bash
# 添加自定义域名
az webapp config hostname add \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $FRONTEND_APP \
  --hostname yourdomain.com
```

## 💰 成本优化

### 推荐配置
- **App Service**: B1 Basic (适合小型应用)
- **PostgreSQL**: Burstable B1ms (适合开发/测试)
- **存储**: 标准存储

### 成本估算
- App Service Plan B1: ~$13/月
- PostgreSQL B1ms: ~$12/月
- 总计: ~$25/月

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查防火墙规则
   - 验证连接字符串
   - 确认SSL设置

2. **CORS错误**
   - 检查后端CORS配置
   - 验证前端API地址

3. **构建失败**
   - 检查Java版本 (需要17)
   - 验证Maven依赖
   - 检查Node.js版本 (需要18+)

### 日志查看
```bash
# 实时查看日志
az webapp log tail --resource-group $RESOURCE_GROUP --name $BACKEND_APP

# 下载日志文件
az webapp log download --resource-group $RESOURCE_GROUP --name $BACKEND_APP
```

## 📞 支持

如遇到问题，请检查：
1. Azure门户中的应用状态
2. 应用日志和错误信息
3. 网络连接和DNS解析
4. 环境变量配置

---

**注意**: 请确保在部署前备份所有重要数据，并在测试环境中验证部署流程。