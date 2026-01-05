# Refactoring Summary - Ollama-First Local Development

## Files Changed or Added

### Added
- **`app/api/intent/route.ts`** - New Next.js API route handler
  - Contains Ollama-only inference logic
  - Preserves exact StrategicGuidance schema and validation
  - No fallbacks, mocks, or OpenAI code
  - Returns same JSON structure as before

### Modified
- **`app/page.tsx`** (line 302)
  - Changed: `fetch('/.netlify/functions/intent', ...)` 
  - To: `fetch('/api/intent', ...)`
  - All other logic unchanged

### Unchanged (Preserved)
- `lib/strategicGuidance.ts` - Schema definitions (unchanged)
- `lib/guidanceToIntent.ts` - Translation logic (unchanged)
- `lib/goOutcomeEngine.ts` - Deterministic engine (unchanged)
- `netlify/functions/intent.ts` - Left in place but not used locally

## Request Flow

### New Flow (Local Development)
1. **UI** (`app/page.tsx`): User enters text, clicks "Analyze Intent"
2. **Frontend** calls: `POST /api/intent` with `{ text: "..." }`
3. **Next.js API Route** (`app/api/intent/route.ts`):
   - Validates input
   - Calls Ollama at `http://127.0.0.1:11434/api/chat` (or `OLLAMA_BASE_URL`)
   - Uses model from `OLLAMA_MODEL` env var (default: `llama3.2`)
   - Parses and validates response against StrategicGuidance schema
   - Returns `{ ok: true, guidance: StrategicGuidance }` or error JSON
4. **Frontend** receives StrategicGuidance:
   - Calls `translateGuidanceToIntent()` (client-side)
   - Calls `resolveOutcome()` (client-side)
   - Displays results

### Error Handling
- All errors return valid JSON with `{ ok: false, error: "...", message: "..." }`
- No silent failures or fallbacks
- If Ollama unavailable: Returns 500 with `LLM_UNAVAILABLE` error
- If invalid response: Returns 500 with `INVALID_RESPONSE` or `INVALID_GUIDANCE` error

## Local Development Commands

### Required Setup
1. **Start Ollama:**
   ```bash
   ollama serve
   ```
   (Keep this running in a separate terminal)

2. **Ensure model is available:**
   ```bash
   ollama pull llama3.2
   ```
   (Or whatever model you set in `OLLAMA_MODEL`)

3. **Set environment variables** (create `.env.local` if needed):
   ```
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   ```
   (These are optional - defaults work if Ollama is running locally)

4. **Start Next.js dev server:**
   ```bash
   npm run dev
   ```
   (Or `pnpm run dev` if using pnpm)

5. **Open browser:**
   ```
   http://localhost:3000
   ```
   (Or whatever port Next.js assigns)

### What's NOT Needed
- ❌ `netlify dev` (not required for local development)
- ❌ Netlify Functions (not used locally)
- ❌ OpenAI API keys (not used)
- ❌ `LLM_PROVIDER` env var (not needed - always uses Ollama)

## Architecture Changes

### Before
- Frontend → Netlify Function → Ollama/OpenAI → Frontend
- Required `netlify dev` for local development
- Functions returned 404 in local dev

### After
- Frontend → Next.js API Route → Ollama → Frontend
- Uses standard `npm run dev` (Next.js dev server)
- No Netlify Functions needed locally
- Ollama-only (no provider switching)

## Environment Variables

### Required for Local Dev
- None (uses defaults if Ollama is at `http://127.0.0.1:11434`)

### Optional (can set in `.env.local`)
- `OLLAMA_BASE_URL` (default: `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default: `llama3.2`)

### Not Used Locally
- `LLM_PROVIDER` (not checked - always Ollama)
- `OPEN_AI_KEY` / `OPENAI_API_KEY` (not used)
- Any Netlify-specific env vars

## Testing

1. Start Ollama: `ollama serve`
2. Start Next.js: `npm run dev`
3. Open `http://localhost:3000`
4. Enter text and click "Analyze Intent"
5. Should work with Ollama!

If Ollama is not running, you'll get a clear JSON error (no fallbacks).








