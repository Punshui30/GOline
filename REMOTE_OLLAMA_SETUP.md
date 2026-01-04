# Remote Ollama Server Setup Guide

## Overview
This guide will help you set up a remote Ollama server accessible from Netlify functions, and configure the Netlify environment variables.

## Prerequisites
- A VPS or cloud server (DigitalOcean, AWS EC2, Linode, etc.)
- SSH access to your server
- Domain name (optional, but recommended for HTTPS)

## Step 1: Set Up Ollama on Remote Server

### Option A: Quick Setup (Ubuntu/Debian)

1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Ollama:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

3. **Start Ollama service:**
   ```bash
   sudo systemctl enable ollama
   sudo systemctl start ollama
   ```

4. **Pull the model:**
   ```bash
   ollama pull llama3.2
   ```

5. **Verify it's running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Should return a JSON list of available models.

### Option B: Docker Setup (Recommended for Production)

1. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Run Ollama in Docker:**
   ```bash
   docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama --restart always ollama/ollama
   ```

3. **Pull the model:**
   ```bash
   docker exec -it ollama ollama pull llama3.2
   ```

## Step 2: Configure Remote Access

### Security Considerations
⚠️ **WARNING:** Exposing Ollama directly to the internet is a security risk. Consider these options:

### Option A: Basic HTTP (Development/Testing Only)
⚠️ Not recommended for production without additional security.

1. **Allow port 11434 through firewall:**
   ```bash
   sudo ufw allow 11434/tcp
   ```

2. **Make Ollama listen on all interfaces:**
   Edit `/etc/systemd/system/ollama.service` or use environment variable:
   ```bash
   OLLAMA_HOST=0.0.0.0:11434 ollama serve
   ```

3. **Test from your local machine:**
   ```bash
   curl http://YOUR-SERVER-IP:11434/api/tags
   ```

### Option B: Nginx Reverse Proxy with HTTPS (Recommended)

1. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Create Nginx config** (`/etc/nginx/sites-available/ollama`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://127.0.0.1:11434;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Set up HTTPS with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

5. **Your Ollama URL will be:** `https://your-domain.com/api`

### Option C: Authentication/API Key (Most Secure)

For production, consider adding authentication. Options:
- Cloudflare Access
- Nginx with basic auth
- Custom API key middleware

## Step 3: Configure Netlify Environment Variables

### Method 1: Netlify Dashboard (Easiest)

1. Go to: https://app.netlify.com
2. Select your site: `go-line-outcomes`
3. Navigate to: **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add these three variables:

   | Key | Value |
   |-----|-------|
   | `LLM_PROVIDER` | `ollama` |
   | `OLLAMA_BASE_URL` | `https://your-domain.com/api` (or `http://YOUR-IP:11434` if no domain) |
   | `OLLAMA_MODEL` | `llama3.2` |

6. Click **Save**

### Method 2: Netlify CLI (Alternative)

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Link your site** (if not already linked):
   ```bash
   cd C:\Users\simmo\Desktop\go-line-calculator
   netlify link
   ```

4. **Set environment variables:**
   ```bash
   netlify env:set LLM_PROVIDER ollama
   netlify env:set OLLAMA_BASE_URL https://your-domain.com/api
   netlify env:set OLLAMA_MODEL llama3.2
   ```

5. **Verify:**
   ```bash
   netlify env:list
   ```

## Step 4: Redeploy

After setting environment variables, trigger a new deployment:

### Option A: Netlify Dashboard
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

### Option B: Netlify CLI
```bash
cd C:\Users\simmo\Desktop\go-line-calculator
netlify deploy --prod
```

### Option C: Git Push
If your site auto-deploys from Git:
```bash
git commit --allow-empty -m "Trigger deployment with new env vars"
git push
```

## Step 5: Test and Verify

1. **Check Netlify Function Logs:**
   - Go to Netlify Dashboard → **Functions** tab
   - Click on `intent` function
   - View logs for: `[INTENT] LLM Provider: ollama`
   - Should see: `[INTENT] Using Ollama: { baseUrl: '...', model: 'llama3.2' }`

2. **Test the Application:**
   - Visit: https://go-line-outcomes.netlify.app
   - Enter a test query
   - Should work without `LLM_UNAVAILABLE` error

## Troubleshooting

### Connection Refused
- Check firewall rules: `sudo ufw status`
- Verify Ollama is running: `sudo systemctl status ollama`
- Test locally on server: `curl http://localhost:11434/api/tags`

### 500 Error from Netlify
- Check Netlify function logs for specific error
- Verify environment variables are set correctly
- Test Ollama URL directly: `curl https://your-domain.com/api/api/tags`

### CORS Issues
- Ollama doesn't set CORS headers by default
- Use Nginx reverse proxy to add CORS headers if needed
- Netlify functions are server-side, so CORS shouldn't be an issue

### Model Not Found
- Verify model is pulled: `ollama list` (on server)
- Check `OLLAMA_MODEL` matches exactly (case-sensitive)

## Quick Reference

**Server Commands:**
```bash
# Start Ollama
sudo systemctl start ollama

# Stop Ollama
sudo systemctl stop ollama

# Check status
sudo systemctl status ollama

# View logs
journalctl -u ollama -f

# List models
ollama list
```

**Netlify CLI Commands:**
```bash
# List env vars
netlify env:list

# Set env var
netlify env:set KEY value

# Delete env var
netlify env:unset KEY

# Open site
netlify open
```

## Next Steps

Once configured:
1. ✅ Test production deployment
2. ✅ Monitor function logs for errors
3. ✅ Consider adding rate limiting
4. ✅ Set up monitoring/alerting
5. ✅ Document your server setup for future reference




