# Local Development Setup - Ollama-First

## Quick Start

### 1. Start Ollama
```bash
ollama serve
```
Keep this running in a separate terminal.

### 2. Ensure Model is Available
```bash
ollama pull llama3.2
```
(Or whatever model you want to use)

### 3. Start Next.js Dev Server
```bash
cd C:\Users\simmo\Desktop\go-line-calculator
npm run dev
```
(Or `pnpm run dev` if using pnpm)

### 4. Open Browser
```
http://localhost:3000
```
(Or whatever port Next.js assigns)

## Environment Variables (Optional)

Create `.env.local` if you want to customize:

```
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

**Defaults work if Ollama is running locally on port 11434.**

## What Changed

- ✅ LLM inference moved to Next.js API route (`app/api/intent/route.ts`)
- ✅ Frontend now calls `/api/intent` instead of `/.netlify/functions/intent`
- ✅ Ollama-only (no OpenAI, no fallbacks)
- ✅ No Netlify Functions needed for local dev
- ✅ Use standard `npm run dev` (no `netlify dev` required)

## Testing

1. Start Ollama: `ollama serve`
2. Start Next.js: `npm run dev`
3. Open `http://localhost:3000`
4. Enter text and click "Analyze Intent"
5. Should work! ✅

If Ollama is not running, you'll get a clear JSON error (no fallbacks).








