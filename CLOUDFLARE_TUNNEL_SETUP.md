# Cloudflare Tunnel 配置指南

## 1. 安装 Cloudflare Tunnel (cloudflared)

### macOS
```bash
brew install cloudflared
```

### Linux
```bash
# 下载并安装
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

## 2. 登录 Cloudflare
```bash
cloudflared tunnel login
```
这会打开浏览器，让你登录Cloudflare账户并授权。

## 3. 创建隧道
```bash
# 创建一个新的隧道
cloudflared tunnel create learning-system-backend

# 记录下隧道ID，会显示类似这样的信息：
# Tunnel credentials written to /Users/username/.cloudflared/xxx-xxx-xxx-xxx-xxx.json
```

## 4. 配置隧道
创建配置文件 `~/.cloudflared/config.yml`：

```yaml
tunnel: learning-system-backend  # 你的隧道名称
credentials-file: /Users/username/.cloudflared/xxx-xxx-xxx-xxx-xxx.json  # 替换为实际路径

ingress:
  # 将你的域名指向本地后端
  - hostname: api.yourdomain.com  # 替换为你的域名
    service: http://localhost:8080
  # 捕获所有其他请求
  - service: http_status:404
```

## 5. 设置DNS记录
在Cloudflare Dashboard中：
1. 进入你的域名管理
2. 添加CNAME记录：
   - Name: `api` (或你想要的子域名)
   - Target: `xxx-xxx-xxx-xxx-xxx.cfargotunnel.com` (替换为你的隧道ID)
   - Proxy status: Proxied (橙色云朵)

## 6. 启动隧道
```bash
# 启动隧道
cloudflared tunnel run learning-system-backend

# 或者作为服务运行
cloudflared service install
```

## 7. 更新项目配置

### 7.1 更新切换脚本
编辑 `smart-switch-backend.sh`，将 `CLOUDFLARE_TUNNEL_URL` 设置为你的实际URL：

```bash
# 将这行：
CLOUDFLARE_TUNNEL_URL="https://your-tunnel-name.your-domain.com"

# 改为你的实际URL，例如：
CLOUDFLARE_TUNNEL_URL="https://api.yourdomain.com"
```

### 7.2 使用Cloudflare后端
```bash
# 切换到Cloudflare Tunnel后端
./smart-switch-backend.sh cloudflare

# 或者让脚本自动检测
./smart-switch-backend.sh auto
```

## 8. 测试连接
```bash
# 测试API是否可访问
curl https://api.yourdomain.com/courses

# 如果成功，应该返回课程列表JSON数据
```

## 9. 生产环境配置

### 9.1 设置环境变量
```bash
# 在生产环境中设置
export REACT_APP_API_BASE_URL=https://api.yourdomain.com
```

### 9.2 GitHub Actions部署
如果使用GitHub Actions，在仓库的Secrets中添加：
- `REACT_APP_API_BASE_URL`: `https://api.yourdomain.com`

## 故障排除

### 常见问题
1. **隧道无法连接**
   - 检查本地后端是否在8080端口运行
   - 确认配置文件路径正确
   - 查看cloudflared日志：`cloudflared tunnel run learning-system-backend --loglevel debug`

2. **DNS解析问题**
   - 确认CNAME记录已正确设置
   - 等待DNS传播（可能需要几分钟）
   - 使用 `nslookup api.yourdomain.com` 检查DNS

3. **CORS错误**
   - 确保后端配置了正确的CORS设置
   - 检查后端是否允许来自你域名的请求

### 有用的命令
```bash
# 查看所有隧道
cloudflared tunnel list

# 查看隧道状态
cloudflared tunnel info learning-system-backend

# 删除隧道（如果需要）
cloudflared tunnel delete learning-system-backend
```

## 优势
- ✅ 无需公网IP
- ✅ 自动HTTPS
- ✅ 高可用性
- ✅ 免费使用
- ✅ 比ngrok更稳定（不会过期）
- ✅ 支持自定义域名