# Remote Ollama Setup Checklist

## Prerequisites
- [ ] VPS/Cloud server with SSH access
- [ ] Domain name (optional, but recommended)
- [ ] Netlify account and site

## Step-by-Step Setup

### Phase 1: Set Up Remote Ollama Server

1. **Choose a Server Provider:**
   - DigitalOcean ($6/month droplet)
   - AWS EC2 (free tier available)
   - Linode ($5/month)
   - Any VPS with Ubuntu/Debian

2. **SSH into Server:**
   ```bash
   ssh user@your-server-ip
   ```

3. **Install Ollama:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

4. **Start Ollama:**
   ```bash
   sudo systemctl enable ollama
   sudo systemctl start ollama
   ```

5. **Pull Model:**
   ```bash
   ollama pull llama3.2
   ```

6. **Test Locally (on server):**
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Phase 2: Expose Ollama (Choose One Method)

#### Option A: Direct HTTP (Quick Test - NOT for Production)
⚠️ **Only for testing, not secure for production**

```bash
# Allow port through firewall
sudo ufw allow 11434/tcp

# Make Ollama listen on all interfaces
export OLLAMA_HOST=0.0.0.0:11434
sudo systemctl restart ollama
```

Your URL: `http://YOUR-SERVER-IP:11434`

#### Option B: Nginx Reverse Proxy with HTTPS (Recommended)

1. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Create config** `/etc/nginx/sites-available/ollama`:
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

3. **Enable and get HTTPS:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d your-domain.com
   ```

Your URL: `https://your-domain.com/api`

4. **Test from your local machine:**
   ```bash
   curl https://your-domain.com/api/api/tags
   ```

### Phase 3: Configure Netlify Environment Variables

**Option 1: Using Netlify Dashboard (Easiest)**

1. Go to: https://app.netlify.com
2. Select site: `go-line-outcomes`
3. **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add these three:
   - `LLM_PROVIDER` = `ollama`
   - `OLLAMA_BASE_URL` = `https://your-domain.com/api` (or `http://YOUR-IP:11434`)
   - `OLLAMA_MODEL` = `llama3.2`
6. Click **Save**

**Option 2: Using PowerShell Script**

```powershell
cd C:\Users\simmo\Desktop\go-line-calculator
.\configure-netlify-env.ps1 -OllamaUrl "https://your-domain.com/api"
```

**Option 3: Using Netlify CLI Manually**

```bash
cd C:\Users\simmo\Desktop\go-line-calculator
netlify login
netlify link
netlify env:set LLM_PROVIDER ollama
netlify env:set OLLAMA_BASE_URL https://your-domain.com/api
netlify env:set OLLAMA_MODEL llama3.2
netlify env:list  # Verify
```

### Phase 4: Redeploy

**Option A: Netlify Dashboard**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

**Option B: Netlify CLI**
```bash
netlify deploy --prod
```

**Option C: Git Push** (if auto-deploy is enabled)
```bash
git commit --allow-empty -m "Trigger deployment"
git push
```

### Phase 5: Verify

1. **Check Function Logs:**
   - Netlify Dashboard → **Functions** → `intent`
   - Look for: `[INTENT] LLM Provider: ollama`
   - Should see successful Ollama responses

2. **Test the App:**
   - Visit: https://go-line-outcomes.netlify.app
   - Enter a test query
   - Should work without errors

## Quick Reference

**Server Commands:**
```bash
# Start Ollama
sudo systemctl start ollama

# Stop Ollama
sudo systemctl stop ollama

# Status
sudo systemctl status ollama

# Logs
journalctl -u ollama -f

# List models
ollama list

# Test locally
curl http://localhost:11434/api/tags
```

**Netlify Commands:**
```bash
# Login
netlify login

# Link site
netlify link

# Set env var
netlify env:set KEY value

# List env vars
netlify env:list

# Deploy
netlify deploy --prod

# View logs
netlify functions:log
```

## Troubleshooting

### Can't Connect to Ollama Server
- Check firewall: `sudo ufw status`
- Verify Ollama is running: `sudo systemctl status ollama`
- Test from server: `curl http://localhost:11434/api/tags`
- Test from local machine: `curl http://YOUR-IP:11434/api/tags`

### 500 Error in Netlify Functions
- Check Netlify function logs
- Verify environment variables are set correctly
- Test Ollama URL directly: `curl https://your-domain.com/api/api/tags`
- Check for CORS issues (shouldn't be a problem with Netlify functions)

### Model Not Found
- Verify model is pulled: `ollama list` (on server)
- Check `OLLAMA_MODEL` matches exactly (case-sensitive)

## Need Help?

- See `REMOTE_OLLAMA_SETUP.md` for detailed instructions
- Check Netlify function logs for specific errors
- Verify Ollama server logs: `journalctl -u ollama -f`





