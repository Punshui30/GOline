# Architecture Analysis - GO Line Calculator

## Current Backend Inference Path

**Flow:** Frontend → Netlify Function → LLM (Ollama/OpenAI) → Frontend → Client-side processing

1. **User submits text** in `app/page.tsx` (line 302)
2. **Frontend calls:** `fetch('/.netlify/functions/intent', ...)` 
   - This is a **Netlify Function**, NOT a Next.js API route
   - No Next.js API routes exist (`app/api/` directory doesn't exist)
3. **Netlify Function** (`netlify/functions/intent.ts`) handles the request
4. **Function calls LLM** (Ollama or OpenAI) based on `LLM_PROVIDER` env var
5. **Function returns** `StrategicGuidance` JSON to frontend
6. **Frontend processes** the response client-side:
   - Calls `translateGuidanceToIntent()` (in `lib/guidanceToIntent.ts`)
   - Calls `resolveOutcome()` (in `lib/goOutcomeEngine.ts`)
   - Both run in the browser, not on the server

## LLM Inference Location

**Currently implemented:**
- **Netlify Function** (`netlify/functions/intent.ts`, lines 257-373)
- **Two providers supported:**
  - **Ollama** (local): `http://127.0.0.1:11434/api/chat` (lines 257-307)
  - **OpenAI** (external API): `gpt-4o-mini` (lines 308-373)
- **Provider selection:** Controlled by `LLM_PROVIDER` env var (default: 'openai')

**Not implemented:**
- Netlify AI Gateway (not used)
- Next.js API routes (none exist)

## Files and Responsibilities

### Intent Analysis & LLM Calling
**File:** `netlify/functions/intent.ts`
- **Handler function:** `export const handler: Handler = async (event, context) => { ... }` (line 154)
- **LLM calling:** Lines 257-307 (Ollama) and 308-373 (OpenAI)
- **JSON response:** Returns `{ ok: true, guidance: StrategicGuidance }` or `{ ok: false, error: ... }` (line 450)

### Returning JSON to Frontend
**File:** `netlify/functions/intent.ts`
- Returns HTTP response with JSON body (lines 450-453)
- Headers include CORS: `'Access-Control-Allow-Origin': '*'`

### Client-side Processing (After LLM Response)
**File:** `app/page.tsx`
- Receives `StrategicGuidance` from function (line 327)
- Calls `translateGuidanceToIntent()` (line 368) - converts strategy to numeric constraints
- Calls `resolveOutcome()` (line 373) - deterministic engine runs in browser

**Supporting files:**
- `lib/strategicGuidance.ts` - TypeScript interface definitions
- `lib/guidanceToIntent.ts` - Translation layer (strategic → numeric)
- `lib/goOutcomeEngine.ts` - Deterministic outcome resolution engine

## Environment Variables

### Required for Ollama (Local)
- `LLM_PROVIDER=ollama` (required to use Ollama, defaults to 'openai' if not set)
- `OLLAMA_BASE_URL` (optional, defaults to `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (optional, defaults to `llama3.2`)

### Required for OpenAI
- `OPEN_AI_KEY` OR `OPENAI_API_KEY` (either name accepted, line 310)
- `LLM_PROVIDER` should NOT be set (or set to 'openai') to use OpenAI

### Current Issues
- **Naming inconsistency:** Function checks both `OPEN_AI_KEY` and `OPENAI_API_KEY` (line 310)
- **Netlify environment:** Has `OPEN_AI_KEY` set (from terminal output), which defaults to OpenAI
- **Local `.env` file:** Has `LLM_PROVIDER=ollama` but netlify dev may not be reading it correctly

## Why 404 During Local Development?

**Root Cause:** Netlify dev is not serving the function at `/.netlify/functions/intent`

**Possible reasons:**
1. **Function not being detected:** Netlify dev may not be scanning/loading functions from `netlify/functions/`
2. **Build/bundling issue:** Functions might not be compiling/bundling correctly
3. **Configuration issue:** `netlify.toml` has `functions = "netlify/functions"` but netlify dev might need additional config
4. **Next.js dev mode conflict:** Using Next.js dev mode (not static export) might interfere with function serving
5. **Port/routing issue:** Netlify dev proxy might not be routing function requests correctly

**Evidence:**
- Function file exists: `netlify/functions/intent.ts` ✓
- Handler is exported correctly: `export const handler: Handler` ✓
- `netlify.toml` specifies functions directory ✓
- But requests to `/.netlify/functions/intent` return 404 ✗

## Changes Required for Ollama-First, Fully Local, No Netlify Functions

### Option 1: Next.js API Route (Recommended for Local Dev)

**Changes needed:**

1. **Create Next.js API route:**
   - Create `app/api/intent/route.ts` (Next.js App Router API route)
   - Move LLM calling logic from `netlify/functions/intent.ts` to this route
   - Use Next.js `NextRequest`/`NextResponse` instead of Netlify Handler

2. **Update frontend:**
   - Change `fetch('/.netlify/functions/intent', ...)` to `fetch('/api/intent', ...)` in `app/page.tsx`

3. **Environment variables:**
   - Next.js automatically reads `.env.local` file
   - Set `LLM_PROVIDER=ollama` in `.env.local`
   - Remove dependency on Netlify function environment variables

4. **Benefits:**
   - Works with `npm run dev` (standard Next.js dev server)
   - No need for `netlify dev` for local development
   - Faster iteration (no function bundling)
   - Still works in production if deployed to Netlify (API routes work)

5. **Trade-offs:**
   - Need to maintain two code paths (API route for local, Function for production)
   - OR: Use API route in both local and production (Netlify supports Next.js API routes)

### Option 2: Keep Netlify Functions but Fix Local Dev

**Changes needed:**

1. **Fix netlify dev function serving:**
   - Investigate why functions aren't being served
   - May need to check netlify dev logs for function loading errors
   - Possibly need to rebuild functions or fix bundling

2. **Ensure environment variables loaded:**
   - Verify `.env.local` is being read by netlify dev
   - May need to use `netlify dev --env-file .env.local` explicitly

3. **Keep existing architecture:**
   - Functions work in production
   - Just need to fix local development

### Option 3: Hybrid Approach

**Changes needed:**

1. **Use Next.js API route for local dev:**
   - Create `app/api/intent/route.ts` for local development
   - Use `npm run dev` for local (simpler, faster)

2. **Keep Netlify Function for production:**
   - Keep `netlify/functions/intent.ts` for production deployment
   - Frontend can detect environment and call appropriate endpoint
   - OR: Use Netlify's Next.js runtime which supports API routes natively

## Current Architecture Summary

**Strengths:**
- Clean separation: LLM inference in serverless function, deterministic processing client-side
- Supports multiple LLM providers (Ollama, OpenAI)
- Strategic guidance → Intent translation → Outcome resolution pipeline is well-designed

**Weaknesses:**
- Netlify Functions don't work in local dev (404 issue)
- Dependency on Netlify dev for local development (complex, slow)
- Environment variable handling inconsistent (checks two names for OpenAI key)
- No Next.js API routes (could simplify local dev)

**Recommendation:**
Implement Next.js API route (`app/api/intent/route.ts`) for local development. This would:
- Allow using `npm run dev` (standard Next.js dev server)
- Eliminate need for `netlify dev` locally
- Make Ollama-first setup straightforward (just set env vars in `.env.local`)
- Still work in production (Netlify supports Next.js API routes natively)








