# Troubleshooting Guide

## Quick Diagnostics

### 1. Check if Netlify Dev Starts
```bash
cd C:\Users\simmo\Desktop\go-line-calculator
netlify dev
```

**Expected:** Server starts on `http://localhost:8888`

**If it fails:** Check for error messages

### 2. Check if Ollama is Running
```bash
ollama list
```

**Expected:** List of available models

**If it fails:** Run `ollama serve` in a separate terminal

### 3. Check Environment Variables
```bash
# In PowerShell
Get-Content .env
```

**Expected:**
```
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

### 4. Test Function Directly
Once Netlify dev is running, test the function:
```bash
curl -X POST http://localhost:8888/.netlify/functions/intent -H "Content-Type: application/json" -d '{"text":"test"}'
```

Or in browser: `http://localhost:8888/.netlify/functions/intent` (won't work for POST, but confirms function exists)

## Common Issues

### Issue 1: "Cannot find module" or Build Errors
**Solution:** Reinstall dependencies
```bash
npm install
# or
pnpm install
```

### Issue 2: Port Already in Use
**Solution:** Kill existing processes
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

### Issue 3: Function Returns 404
**Solution:** Ensure `netlify dev` (not `npm run dev`) is running
- `npm run dev` = Next.js dev server (no functions)
- `netlify dev` = Netlify dev server (includes functions)

### Issue 4: Ollama Connection Error
**Solution:** 
1. Ensure Ollama is running: `ollama serve`
2. Test Ollama directly: `curl http://127.0.0.1:11434/api/tags`
3. Verify model exists: `ollama list` (should include llama3.2)

### Issue 5: Browser Shows Error
Check browser console (F12) for:
- Network errors (404, 500, CORS)
- JavaScript errors
- Function call failures

## Step-by-Step Fresh Start

1. **Stop everything:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
   ```

2. **Start Ollama (new terminal):**
   ```bash
   ollama serve
   ```

3. **Start Netlify Dev (main terminal):**
   ```bash
   cd C:\Users\simmo\Desktop\go-line-calculator
   netlify dev
   ```

4. **Wait for startup** (should see "Server now ready on http://localhost:8888")

5. **Open browser:** http://localhost:8888

6. **Test:** Enter text, click "Analyze Intent", check console for logs

## What Error Are You Seeing?

Please provide:
- ❌ Error message (from terminal or browser console)
- ❌ What happens when you try to use it?
- ❌ Does Netlify dev start successfully?
- ❌ Can you access http://localhost:8888?








