# HOUSE OF JEWELUX — PRODUCTION DEPLOYMENT GUIDE

## 1. Vercel Serverless Deployment

The project includes pre-configured `vercel.json` routing:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/server.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

To deploy to Vercel:
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy directly
vercel --prod
```

---

## 2. Linux VPS / Docker Deployment (PM2 + NGINX)

```bash
# 1. Clone repository
git clone https://github.com/yuvrajsoni95555/house-of-jewelux.git
cd house-of-jewelux

# 2. Install dependencies
npm ci --only=production

# 3. Start process under PM2
pm2 start server.js --name "house-of-jewelux"

# 4. Save PM2 state
pm2 save
pm2 startup
```

---

## 3. NGINX Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name houseofjewelux.com www.houseofjewelux.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name houseofjewelux.com www.houseofjewelux.com;

    ssl_certificate /etc/letsencrypt/live/houseofjewelux.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/houseofjewelux.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
```
