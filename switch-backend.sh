#!/bin/bash

# 后端切换脚本
# 使用方法: ./switch-backend.sh [local|azure|ngrok]

if [ "$1" = "local" ]; then
    echo "切换到本地后端..."
    cat > .env.local << EOF
# 本地开发环境配置
# 使用本地后端
REACT_APP_API_BASE_URL=http://localhost:8080

# 其他选项:
# REACT_APP_API_BASE_URL=https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net  # Azure后端
# REACT_APP_API_BASE_URL=https://6a1e297be2e0.ngrok-free.app  # ngrok后端
EOF
    echo "✅ 已切换到本地后端 (http://localhost:8080)"
    
elif [ "$1" = "azure" ]; then
    echo "切换到Azure后端..."
    cat > .env.local << EOF
# 本地开发环境配置
# 使用Azure后端
REACT_APP_API_BASE_URL=https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net

# 其他选项:
# REACT_APP_API_BASE_URL=http://localhost:8080  # 本地后端
# REACT_APP_API_BASE_URL=https://6a1e297be2e0.ngrok-free.app  # ngrok后端
EOF
    echo "✅ 已切换到Azure后端 (https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net)"

elif [ "$1" = "ngrok" ]; then
    echo "切换到ngrok后端..."
    cat > .env.local << EOF
# 本地开发环境配置
# 使用ngrok后端
REACT_APP_API_BASE_URL=https://6a1e297be2e0.ngrok-free.app

# 其他选项:
# REACT_APP_API_BASE_URL=http://localhost:8080  # 本地后端
# REACT_APP_API_BASE_URL=https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net  # Azure后端
EOF
    echo "✅ 已切换到ngrok后端 (https://6a1e297be2e0.ngrok-free.app)"
    
else
    echo "使用方法:"
    echo "  ./switch-backend.sh local   # 切换到本地后端 (http://localhost:8080)"
    echo "  ./switch-backend.sh azure   # 切换到Azure后端"
    echo "  ./switch-backend.sh ngrok   # 切换到ngrok后端"
    echo ""
    echo "当前配置:"
    if [ -f ".env.local" ]; then
        grep "REACT_APP_API_BASE_URL" .env.local | grep -v "^#"
    else
        echo "  未找到 .env.local 文件"
    fi
fi