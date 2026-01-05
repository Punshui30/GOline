# ⚠️ LLM_UNAVAILABLE Error - Fix

## The Problem

You're getting `LLM_UNAVAILABLE` error because **Ollama is not running**.

The function is trying to connect to Ollama at `http://127.0.0.1:11434` but can't reach it.

## The Solution

**Ollama MUST be running in a separate terminal before the function can work.**

### Steps:

1. **Open a NEW terminal/PowerShell window**
   - Don't close the Netlify dev terminal!
   - This is a separate window just for Ollama

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Keep that terminal open**
   - Ollama must stay running
   - You should see: `Ollama is running on http://127.0.0.1:11434`

4. **Test Ollama is working:**
   - Open browser: http://127.0.0.1:11434/api/tags
   - Should see JSON list of models

5. **Try your app again:**
   - Go back to http://localhost:8888
   - Enter text and click "Analyze Intent"
   - Should work now!

## What You Need Running

You need **TWO terminals/windows**:

1. **Terminal 1: Netlify dev**
   ```bash
   netlify dev
   ```
   - Shows: "Server now ready on http://localhost:8888"
   - Keep this running

2. **Terminal 2: Ollama**
   ```bash
   ollama serve
   ```
   - Shows: "Ollama is running on http://127.0.0.1:11434"
   - Keep this running

## Verify Ollama is Running

Check Task Manager for "ollama" processes, or run:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*ollama*"}
```

Should show at least one "ollama" process.

## Still Not Working?

1. Check Netlify dev terminal for `[INTENT]` error logs
2. Verify Ollama is accessible: http://127.0.0.1:11434/api/tags
3. Make sure `.env` file has `LLM_PROVIDER=ollama`








