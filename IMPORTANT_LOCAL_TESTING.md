# ⚠️ IMPORTANT: Local Testing Requirements

## The Problem You Just Hit

**404 Error for `/.netlify/functions/intent`** means Netlify functions aren't being served.

This happens when you use **`npm run dev`** (Next.js dev server) instead of **`netlify dev`**.

## ✅ Correct Setup (REQUIRED)

You need **TWO separate terminals**:

### Terminal 1: Ollama Server
```bash
ollama serve
```
Keep this running. Ollama must be running before Netlify dev starts.

### Terminal 2: Netlify Dev
```bash
cd C:\Users\simmo\Desktop\go-line-calculator
netlify dev
```

**DO NOT use:**
- ❌ `npm run dev`
- ❌ `pnpm run dev`
- ❌ `next dev`

**Only use:**
- ✅ `netlify dev`

## Why This Matters

- **`npm run dev`** = Next.js dev server (port 3000 or random)
  - ❌ Does NOT serve Netlify functions
  - ❌ Functions will return 404

- **`netlify dev`** = Netlify development server (port 8888)
  - ✅ Serves Netlify functions at `/.netlify/functions/*`
  - ✅ Reads `.env` file for Ollama config
  - ✅ Proxies to Next.js for frontend

## Quick Start (Correct Way)

1. **Terminal 1:** Start Ollama
   ```bash
   ollama serve
   ```

2. **Terminal 2:** Start Netlify dev
   ```bash
   cd C:\Users\simmo\Desktop\go-line-calculator
   netlify dev
   ```

3. **Wait for:** `Server now ready on http://localhost:8888`

4. **Open browser:** http://localhost:8888 (NOT port 60082 or 3000)

5. **Test:** Enter text and click "Analyze Intent"

## How to Tell Which Server is Running

- **Netlify dev:** URL is `http://localhost:8888`
- **Next.js dev:** URL is `http://localhost:3000` (or random port like 60082)

If you see a port other than 8888, you're using the wrong server!

## Expected Logs (Netlify Dev)

When you click "Analyze Intent", you should see in the Netlify dev terminal:

```
[INTENT] Function invoked
[INTENT] LLM Provider: ollama
[INTENT] Using Ollama: { baseUrl: 'http://127.0.0.1:11434', model: 'llama3.2' }
[INTENT] Ollama response received, length: XXX
```

If you see 404 errors instead, you're using the wrong dev server.

## Troubleshooting

**Still seeing 404?**
1. Make sure you stopped `npm run dev` / `next dev`
2. Kill all Node processes: `Get-Process node | Stop-Process`
3. Start fresh with `netlify dev`

**Port already in use?**
- Netlify dev uses port 8888
- If something else is using it, stop that process first

**Functions still not working?**
- Verify `.env` file exists with `LLM_PROVIDER=ollama`
- Check Netlify dev terminal for startup errors
- Ensure Ollama is running in Terminal 1





