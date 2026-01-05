# GO Line Calculator - Deployment Guide

## Current Status

✅ **Ollama support is fully implemented** in the codebase
✅ **Local `.env` file created** for local testing
✅ **Code is ready for deployment**

## Local Testing with Ollama

### Prerequisites
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama: `ollama serve` (runs on `http://127.0.0.1:11434` by default)

### Run Local Development
```bash
cd C:\Users\simmo\Desktop\go-line-calculator
netlify dev
```

The `.env` file is already configured with:
- `LLM_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `OLLAMA_MODEL=llama3.2`

The frontend will be available at `http://localhost:8888` and functions will call Ollama locally.

## Production Deployment with Ollama

### Option 1: Remote Ollama Instance

If you have a remote Ollama server:

1. **Set Netlify Environment Variables** (Netlify Dashboard → Site Settings → Environment Variables):
   - `LLM_PROVIDER` = `ollama`
   - `OLLAMA_BASE_URL` = `https://your-ollama-server.com` (or your remote URL)
   - `OLLAMA_MODEL` = `llama3.2` (or your preferred model)

2. **Redeploy**:
   ```bash
   netlify deploy --prod
   ```
   Or trigger a new deployment from the Netlify dashboard.

### Option 2: Continue Using OpenAI

If OpenAI quota is restored:

1. **Remove or don't set** `LLM_PROVIDER` (defaults to OpenAI)
2. **Ensure** `OPEN_AI_KEY` or `OPENAI_API_KEY` is set in Netlify environment variables
3. **Redeploy**

## Verification

After deployment, check the Netlify function logs to confirm:
- `[INTENT] LLM Provider: ollama` (or `openai`)
- Successful LLM responses
- No API errors

## Current Configuration

- **Local**: Uses Ollama (via `.env` file)
- **Production**: Currently uses OpenAI (default when `LLM_PROVIDER` is not set)

To switch production to Ollama, set the environment variables listed above and redeploy.








