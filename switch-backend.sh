#!/bin/bash

# 后端切换脚本
# 使用方法: ./switch-backend.sh [local|azure]

if [ "$1" = "local" ]; then
    echo "切换到本地后端..."
    cat > .env.local << EOF
# 本地开发环境配置
# 使用本地后端
REACT_APP_API_BASE_URL=http://localhost:8080

# 如果要切换到Azure后端，请注释掉上面的行，取消注释下面的行：
# REACT_APP_API_BASE_URL=https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net
EOF
    echo "✅ 已切换到本地后端 (http://localhost:8080)"
    
elif [ "$1" = "azure" ]; then
    echo "切换到Azure后端..."
    cat > .env.local << EOF
# 本地开发环境配置
# 使用Azure后端
REACT_APP_API_BASE_URL=https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net

# 如果要切换到本地后端，请注释掉上面的行，取消注释下面的行：
# REACT_APP_API_BASE_URL=http://localhost:8080
EOF
    echo "✅ 已切换到Azure后端 (https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net)"
    
else
    echo "使用方法:"
    echo "  ./switch-backend.sh local   # 切换到本地后端"
    echo "  ./switch-backend.sh azure   # 切换到Azure后端"
    echo ""
    echo "当前配置:"
    if [ -f ".env.local" ]; then
        grep "REACT_APP_API_BASE_URL" .env.local | grep -v "^#"
    else
        echo "  未找到 .env.local 文件"
    fi
fi