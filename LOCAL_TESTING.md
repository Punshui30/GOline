# Local Testing - Quick Start

## Current Status

✅ Netlify dev server is starting in the background
⚠️ **Ollama must be running separately**

## Step 1: Start Ollama (Required)

Open a **new terminal window** and run:

```bash
ollama serve
```

Ollama will start on `http://127.0.0.1:11434`

**Verify Ollama is running:**
```bash
ollama list
```

If you don't have the `llama3.2` model yet:
```bash
ollama pull llama3.2
```

## Step 2: Access the Application

Once Netlify dev finishes starting (usually 10-30 seconds), the app will be available at:

**Frontend:** http://localhost:8888

The Netlify functions will automatically use Ollama when `LLM_PROVIDER=ollama` is set (already configured in `.env`).

## Step 3: Test the Intent Function

1. Open http://localhost:8888 in your browser
2. Enter a test query like: "I want to feel energized and focused, but avoid anxiety"
3. Click "Analyze Intent"
4. Check the browser console and Netlify dev terminal for logs

## Expected Logs

In the Netlify dev terminal, you should see:
- `[INTENT] Function invoked`
- `[INTENT] LLM Provider: ollama`
- `[INTENT] Using Ollama: { baseUrl: 'http://127.0.0.1:11434', model: 'llama3.2' }`
- `[INTENT] Ollama response received, length: XXX`

## Troubleshooting

**If you see "Ollama API error":**
- Make sure `ollama serve` is running in a separate terminal
- Check that Ollama is accessible: `curl http://127.0.0.1:11434/api/tags` (or test in browser)

**If the function uses OpenAI instead of Ollama:**
- Check that `.env` file exists and contains `LLM_PROVIDER=ollama`
- Restart Netlify dev after creating/modifying `.env`

**To stop Netlify dev:**
- Press `Ctrl+C` in the terminal where it's running
- Or kill the Node processes if needed









