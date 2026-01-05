# Ollama Setup for GO Line Calculator

## Overview

The GO Line Calculator supports both OpenAI and Ollama as LLM providers. For local development with Ollama, use the following configuration.

## Prerequisites

1. **Install Ollama**: Download and install from https://ollama.ai
2. **Pull a model**: `ollama pull llama3.2` (or another model)
3. **Start Ollama**: Ollama runs on `http://127.0.0.1:11434` by default

## Environment Variables

### For Netlify Dev (Local Testing)

Create a `.env` file in the project root or set environment variables:

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

### For Netlify Production

Set these in Netlify Dashboard → Site Settings → Environment Variables:

- `LLM_PROVIDER=ollama` (if using Ollama)
- `OLLAMA_BASE_URL=<your-ollama-instance-url>` (for remote Ollama)
- `OLLAMA_MODEL=llama3.2` (or your preferred model)

**Note**: For production, you'll need Ollama running on a publicly accessible server or use OpenAI instead.

## Running Locally with Netlify Dev

1. Ensure Ollama is running: `ollama serve`
2. Set environment variables (`.env` file or export)
3. Start Netlify Dev: `netlify dev`

The function will automatically use Ollama when `LLM_PROVIDER=ollama` is set.

## Provider Switching

The function checks `LLM_PROVIDER` environment variable:
- `openai` (default) → Uses OpenAI API
- `ollama` → Uses Ollama API

If `LLM_PROVIDER` is not set or is `openai`, it defaults to OpenAI and requires `OPEN_AI_KEY` or `OPENAI_API_KEY`.

If `LLM_PROVIDER=ollama`, it uses Ollama and:
- Requires `OLLAMA_BASE_URL` (defaults to `http://127.0.0.1:11434`)
- Requires `OLLAMA_MODEL` (defaults to `llama3.2`)
- OpenAI keys are not required

## Testing

Test the function locally:

```bash
# Start Ollama
ollama serve

# In another terminal, set environment and start Netlify Dev
export LLM_PROVIDER=ollama
netlify dev

# The frontend will be available at http://localhost:8888
# Functions will call Ollama at http://127.0.0.1:11434
```

## Current Deployment Status

**The current production deployment uses OpenAI only** (default behavior when `LLM_PROVIDER` is not set).

To use Ollama in production:
1. Set `LLM_PROVIDER=ollama` in Netlify environment variables
2. Set `OLLAMA_BASE_URL` to your Ollama instance URL
3. Set `OLLAMA_MODEL` to your preferred model
4. Redeploy

For local testing, set `LLM_PROVIDER=ollama` and run `netlify dev`.









