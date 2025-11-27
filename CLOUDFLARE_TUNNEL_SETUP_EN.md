# Cloudflare Tunnel Configuration Guide

## 1. Install Cloudflare Tunnel (cloudflared)

### macOS
```bash
brew install cloudflared
```

### Linux
```bash
# Download and install
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

## 2. Login to Cloudflare
```bash
cloudflared tunnel login
```
This will open a browser for you to login to your Cloudflare account and authorize.

## 3. Create Tunnel
```bash
# Create a new tunnel
cloudflared tunnel create learning-system-backend

# Note down the tunnel ID, it will display information like:
# Tunnel credentials written to /Users/username/.cloudflared/xxx-xxx-xxx-xxx-xxx.json
```

## 4. Configure Tunnel
Create configuration file `~/.cloudflared/config.yml`:

```yaml
tunnel: learning-system-backend  # Your tunnel name
credentials-file: /Users/username/.cloudflared/xxx-xxx-xxx-xxx-xxx.json  # Replace with actual path

ingress:
  # Point your domain to local backend
  - hostname: api.yourdomain.com  # Replace with your domain
    service: http://localhost:8080
  # Catch all other requests
  - service: http_status:404
```

## 5. Setup DNS Records
In Cloudflare Dashboard:
1. Go to your domain management
2. Add CNAME record:
   - Name: `api` (or your desired subdomain)
   - Target: `xxx-xxx-xxx-xxx-xxx.cfargotunnel.com` (replace with your tunnel ID)
   - Proxy status: Proxied (orange cloud)

## 6. Start Tunnel
```bash
# Start tunnel
cloudflared tunnel run learning-system-backend

# Or run as a service
cloudflared service install
```

## 7. Update Project Configuration

### 7.1 Update Switch Script
Edit `smart-switch-backend.sh`, set `CLOUDFLARE_TUNNEL_URL` to your actual URL:

```bash
# Change this line:
CLOUDFLARE_TUNNEL_URL="https://your-tunnel-name.your-domain.com"

# To your actual URL, for example:
CLOUDFLARE_TUNNEL_URL="https://api.yourdomain.com"
```

### 7.2 Use Cloudflare Backend
```bash
# Switch to Cloudflare Tunnel backend
./smart-switch-backend.sh cloudflare

# Or let the script auto-detect
./smart-switch-backend.sh auto
```

## 8. Test Connection
```bash
# Test if API is accessible
curl https://api.yourdomain.com/courses

# If successful, should return course list JSON data
```

## 9. Production Environment Configuration

### 9.1 Set Environment Variables
```bash
# Set in production environment
export REACT_APP_API_BASE_URL=https://api.yourdomain.com
```

### 9.2 GitHub Actions Deployment
If using GitHub Actions, add to repository Secrets:
- `REACT_APP_API_BASE_URL`: `https://api.yourdomain.com`

## Troubleshooting

### Common Issues
1. **Tunnel Cannot Connect**
   - Check if local backend is running on port 8080
   - Confirm configuration file path is correct
   - View cloudflared logs: `cloudflared tunnel run learning-system-backend --loglevel debug`

2. **DNS Resolution Issues**
   - Confirm CNAME record is set correctly
   - Wait for DNS propagation (may take a few minutes)
   - Use `nslookup api.yourdomain.com` to check DNS

3. **CORS Errors**
   - Ensure backend has correct CORS configuration
   - Check if backend allows requests from your domain

### Useful Commands
```bash
# View all tunnels
cloudflared tunnel list

# View tunnel status
cloudflared tunnel info learning-system-backend

# Delete tunnel (if needed)
cloudflared tunnel delete learning-system-backend
```

## Advantages
- ✅ No public IP required
- ✅ Automatic HTTPS
- ✅ High availability
- ✅ Free to use
- ✅ More stable than ngrok (doesn't expire)
- ✅ Supports custom domains