# Quick Start Guide

## The Problem
Production (`go-line-outcomes.netlify.app`) is failing because:
- It's trying to use OpenAI (default)
- OpenAI has quota issues
- Returns `LLM_UNAVAILABLE` error

## Solution: Test Locally First

### Step 1: Start Ollama
Open a **NEW terminal window** and run:
```bash
ollama serve
```
Keep this running. You should see: `Ollama is running on http://127.0.0.1:11434`

### Step 2: Start Netlify Dev
In your **main terminal**, run:
```bash
cd C:\Users\simmo\Desktop\go-line-calculator
netlify dev
```

Wait for: `Server now ready on http://localhost:8888`

### Step 3: Test
1. Open browser: http://localhost:8888
2. Enter text: "I want creativity but no anxiety and pain relief"
3. Click "Analyze Intent"
4. Check browser console (F12) for logs

## If Local Works, Then Fix Production

### Option A: Use Remote Ollama Server
If you have a remote Ollama instance:

1. Go to Netlify Dashboard → Your Site → Environment Variables
2. Add:
   - `LLM_PROVIDER` = `ollama`
   - `OLLAMA_BASE_URL` = `https://your-ollama-server.com` (NOT localhost!)
   - `OLLAMA_MODEL` = `llama3.2`
3. Redeploy

### Option B: Restore OpenAI Quota
1. Fix OpenAI billing/quota
2. Ensure `OPENAI_API_KEY` is set in Netlify environment variables
3. Redeploy

### Option C: Keep Testing Locally
Just use `netlify dev` for now until production is configured.

## Current Status
- ✅ Code supports both OpenAI and Ollama
- ✅ Local `.env` configured for Ollama
- ❌ Production still using OpenAI (needs env vars set)







