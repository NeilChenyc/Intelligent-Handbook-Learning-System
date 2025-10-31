#!/bin/bash

# 智能后端切换脚本
# 使用方法: ./smart-switch-backend.sh [local|devtunnel|auto]

# 获取devtunnel进程ID
get_devtunnel_pid() {
    pgrep -f "devtunnel host.*8080" | head -1
}

# 检查devtunnel是否正在运行
is_devtunnel_running() {
    local pid=$(get_devtunnel_pid)
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# 启动devtunnel并获取URL
start_devtunnel() {
    echo "🚀 启动Azure Dev Tunnel..."
    
    # 检查是否已经在运行
    if is_devtunnel_running; then
        echo "✅ Azure Dev Tunnel已在运行"
        return 0
    fi
    
    # 启动devtunnel（后台运行）
    nohup devtunnel host -p 8080 --allow-anonymous > devtunnel.log 2>&1 &
    local devtunnel_pid=$!
    
    echo "⏳ 等待Azure Dev Tunnel启动..."
    sleep 5
    
    # 检查进程是否还在运行
    if ! kill -0 "$devtunnel_pid" 2>/dev/null; then
        echo "❌ Azure Dev Tunnel启动失败"
        echo "📋 日志内容:"
        cat devtunnel.log
        return 1
    fi
    
    echo "✅ Azure Dev Tunnel已启动 (PID: $devtunnel_pid)"
    return 0
}

# 获取devtunnel的URL
get_devtunnel_url() {
    if [ -f "devtunnel.log" ]; then
        # 优先提取带端口号的URL（格式：https://xxx-8080.aue.devtunnels.ms）
        local url=$(grep -o 'https://[^[:space:]]*-8080\.aue\.devtunnels\.ms' devtunnel.log | head -1)
        if [ -n "$url" ]; then
            echo "$url"
            return 0
        fi
        
        # 如果没有找到带端口号的，再尝试通用格式
        url=$(grep -o 'https://[^[:space:]]*\.devtunnels\.ms' devtunnel.log | head -1)
        if [ -n "$url" ]; then
            echo "$url"
            return 0
        fi
    fi
    
    # 如果无法从日志获取，尝试使用默认URL并测试
    local default_url="https://347gq9pf-8080.aue.devtunnels.ms"
    if curl -s "$default_url/courses" >/dev/null 2>&1; then
        echo "$default_url"
        return 0
    fi
    
    return 1
}

# 停止devtunnel
stop_devtunnel() {
    local pid=$(get_devtunnel_pid)
    if [ -n "$pid" ]; then
        echo "🛑 停止Azure Dev Tunnel (PID: $pid)..."
        kill "$pid" 2>/dev/null
        sleep 2
        
        # 确保进程已停止
        if kill -0 "$pid" 2>/dev/null; then
            echo "⚠️  强制停止Azure Dev Tunnel..."
            kill -9 "$pid" 2>/dev/null
        fi
        echo "✅ Azure Dev Tunnel已停止"
        return 0
    else
        echo "ℹ️  Azure Dev Tunnel未运行"
        return 1
    fi
}

# 检查本地后端是否运行
check_local_backend() {
    curl -s http://localhost:8080/courses >/dev/null 2>&1
    return $?
}

# 检查Azure Dev Tunnel是否可用
check_devtunnel() {
    local url=$(get_devtunnel_url)
    if [ -n "$url" ]; then
        curl -s "$url/courses" >/dev/null 2>&1
        return $?
    fi
    return 1
}

if [ "$1" = "local" ]; then
    echo "🏠 切换到本地后端模式..."
    
    # 停止devtunnel
    stop_devtunnel
    
    # 检查本地后端
    if check_local_backend; then
        echo "✅ 检测到本地后端正在运行"
    else
        echo "⚠️  警告: 本地后端可能未运行 (端口 8080)"
        echo "💡 请确保后端服务正在运行: mvn spring-boot:run"
    fi
    
    # 配置前端URL
    cat > .env.local << EOF
# 本地开发环境配置
# 使用本地后端
REACT_APP_API_BASE_URL=http://localhost:8080
EOF
    echo "✅ 已切换到本地后端 (http://localhost:8080)"
    
elif [ "$1" = "devtunnel" ]; then
    echo "🌐 切换到Azure Dev Tunnel模式..."
    
    # 启动devtunnel
    if ! start_devtunnel; then
        echo "❌ 无法启动Azure Dev Tunnel"
        exit 1
    fi
    
    # 获取URL
    echo "🔍 获取Azure Dev Tunnel URL..."
    sleep 3  # 额外等待确保URL可用
    
    tunnel_url=$(get_devtunnel_url)
    if [ -z "$tunnel_url" ]; then
        echo "❌ 无法获取Azure Dev Tunnel URL"
        echo "📋 请检查devtunnel.log文件"
        exit 1
    fi
    
    echo "🔗 Azure Dev Tunnel URL: $tunnel_url"
    
    # 测试连接
    echo "🧪 测试连接..."
    if ! curl -s "$tunnel_url/courses" >/dev/null 2>&1; then
        echo "⚠️  警告: 无法连接到后端服务，请确保后端正在运行"
    else
        echo "✅ 连接测试成功"
    fi
    
    # 配置前端URL
    cat > .env.local << EOF
# 本地开发环境配置
# 使用Azure Dev Tunnel后端
REACT_APP_API_BASE_URL=$tunnel_url
EOF
    echo "✅ 已配置前端URL: $tunnel_url"
    
    # 运行构建和部署
    echo "🚀 开始构建前端..."
    if npm run build; then
        echo "✅ 前端构建成功!"
        echo "🚀 开始部署前端..."
        if npm run deploy; then
            echo "✅ 前端部署成功!"
            echo "🌐 访问地址: https://NeilChenyc.github.io/Intelligent-Handbook-Learning-System"
        else
            echo "❌ 前端部署失败"
            exit 1
        fi
    else
        echo "❌ 前端构建失败"
        exit 1
    fi

elif [ "$1" = "auto" ]; then
    echo "🤖 自动检测最佳后端..."
    
    if check_local_backend; then
        echo "✅ 检测到本地后端，切换到本地模式"
        $0 local
    elif is_devtunnel_running && check_devtunnel; then
        echo "✅ 检测到Azure Dev Tunnel，切换到Azure Dev Tunnel模式"
        $0 devtunnel
    else
        echo "⚠️  本地后端和Azure Dev Tunnel都未运行，默认切换到本地模式"
        $0 local
    fi
    
else
    echo "🚀 智能后端切换脚本"
    echo ""
    echo "使用方法:"
    echo "  ./smart-switch-backend.sh local      # 切换到本地后端 + 停止devtunnel"
    echo "  ./smart-switch-backend.sh devtunnel  # 启动devtunnel + 配置前端 + 部署"
    echo "  ./smart-switch-backend.sh auto       # 自动选择最佳后端"
    echo ""
    echo "当前状态:"
    
    # 检查各种后端状态
    if check_local_backend; then
        echo "  🟢 本地后端: 运行中 (http://localhost:8080)"
    else
        echo "  🔴 本地后端: 未运行"
    fi
    
    if is_devtunnel_running; then
        tunnel_url=$(get_devtunnel_url)
        if [ -n "$tunnel_url" ] && check_devtunnel; then
            echo "  🟢 Azure Dev Tunnel: 运行中 ($tunnel_url)"
        else
            echo "  🟡 Azure Dev Tunnel: 进程运行中但URL不可用"
        fi
    else
        echo "  🔴 Azure Dev Tunnel: 未运行"
    fi
    
    echo ""
    echo "当前配置:"
    if [ -f ".env.local" ]; then
        grep "REACT_APP_API_BASE_URL" .env.local | grep -v "^#"
    else
        echo "  未找到 .env.local 文件"
    fi
    echo ""
    echo "💡 功能说明:"
    echo "  • devtunnel模式: 自动启动隧道 → 配置URL → 部署到GitHub Pages"
    echo "  • local模式: 停止隧道 → 配置本地URL"
    echo "  • auto模式: 智能检测并选择最佳后端"
    echo ""
    echo "📋 日志文件: devtunnel.log"
fi