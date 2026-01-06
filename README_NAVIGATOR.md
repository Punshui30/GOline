# Navigator Local - Benefits Navigator MVP

A local-first Next.js web app that helps people navigate benefits systems using Ollama LLM for natural language understanding.

## Features

- **Two-step LLM pipeline**: Normalizes messy speech (slang, fragments, typos) → Routes to deterministic playbooks
- **Deterministic flow**: State machine ensures no dead ends - every input results in a question, action card, or fallback
- **Kiosk safety**: Auto-lock after 2 minutes inactivity, auto-reset after 15 minutes, zero data retention by default
- **Calm, respectful UI**: Designed for users who may be stressed, hungry, or unfamiliar with technology
- **Local-first**: Runs entirely on localhost with Ollama - no external APIs required

## Prerequisites

1. **Ollama installed and running**
   - Download from [ollama.ai](https://ollama.ai)
   - Install and ensure it's running: `ollama serve`

2. **Pull a model** (choose one):

   ```bash
   ollama pull llama3.1:8b-instruct
   # OR
   ollama pull qwen2.5:7b-instruct
   ```

## Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

3. Create `.env.local` with your Ollama settings (or it will use qwen2.5:7b-instruct by default):

   ```
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=qwen2.5:7b-instruct
   ```

   Note: The app defaults to `qwen2.5:7b-instruct` if no `.env.local` file exists (this model is already installed on your system).

4. Start the development server:

   ```bash
   pnpm run dev
   ```

5. Navigate to:
   - Entry page: <http://localhost:3000/navigator>
   - Chat page: <http://localhost:3000/chat>

## Architecture

### Two-Step LLM Pipeline

1. **Normalizer**: Converts raw user input (slang, profanity, fragments, typos) into clean, structured case notes
2. **Router**: Uses normalized text + signals to route to deterministic playbooks

This approach works better than asking the LLM to "have a conversation" - it focuses on extraction and interpretation rather than generation.

### Flow Engine

- **Session**: Tracks conversation state, inactivity, clarify count
- **Case**: Tracks route, facts, questions, step index
- **State Machine**: Ensures deterministic flow (idle → collecting → clarifying → presenting)

### Playbooks

Deterministic markdown templates that render into ActionCards:

- `lib/data/playbooks/*.md` - Templates
- `lib/data/routes/*.json` - Route definitions with questions

### Safety Features

- **Auto-lock**: After 2 minutes of inactivity
- **Auto-reset**: Sessions expire after 15 minutes
- **No localStorage**: Conversation data only in server memory
- **Kiosk overlay**: Full-screen lock with "Continue" or "Start Over" options

## Project Structure

```
app/
  navigator/page.tsx          # Entry page: "What's wrong right now?"
  chat/
    page.tsx                  # Main chat interface
    components/
      MessageList.tsx         # Chat message display
      ChatComposer.tsx        # Input field
      ActionCard.tsx          # Action card rendering
      KioskLockOverlay.tsx    # Inactivity lock overlay
  api/
    route/route.ts            # Testing endpoint for normalize+route
    respond/route.ts          # Main endpoint: process user input
    session/reset/route.ts    # Reset session
    session/check/route.ts    # Check if session is locked

lib/
  flow/
    types.ts                  # Core types
    stateMachine.ts           # State machine logic
    router.ts                 # Route resolution
    clarify.ts                # Clarification logic
    render.ts                 # Playbook rendering
    cache.ts                  # In-memory session cache
  llm/
    index.ts                  # LLM adapter (two-step pipeline)
    ollama.ts                 # Ollama client
    prompts.ts                # Prompts with few-shot examples
    schema.ts                 # Zod schemas for validation
  data/
    routes/                   # Route definitions (JSON)
    playbooks/                # Playbook templates (Markdown)
    resources/                # Local resource data

tests/
  flow.test.ts                # Unit tests for flow logic
  normalizer.test.ts          # Test corpus for normalizer
```

## Testing

Run tests:

```bash
pnpm test
```

The test corpus includes 100+ messy utterances to measure:

- Route accuracy
- Confidence distribution
- Clarify mode frequency (target: <20-30%)

## UI/UX Principles

The interface is designed to be:

- **Calm and respectful**: No flashy colors, no emojis, professional tone
- **Accessible**: High contrast, large tap targets, works without sound/voice
- **Mobile-first**: Works on phones, tablets, library computers
- **One action per screen**: No clutter, clear focus
- **Trustworthy**: Feels like a banking/healthcare portal, not a chatbot

## Model Recommendations

Not all Ollama models handle colloquial English equally well. Test with:

1. **llama3.1:8b-instruct** - Good balance of quality and speed
2. **qwen2.5:7b-instruct** - Often very good at messy text + JSON
3. **llama3.1:70b-instruct** - Best quality but requires more resources

Choose based on your clarify rate on the test corpus. Target: <20-30% clarify rate.

## Development Notes

### Adding New Routes

1. Create route definition: `lib/data/routes/NEW_ROUTE.json`
2. Create playbook template: `lib/data/playbooks/NEW_ROUTE.md`
3. Update prompts.ts with route in AVAILABLE ROUTES list
4. Add few-shot examples if needed

### JSON Repair

The LLM adapter includes automatic JSON repair:

1. Try parse JSON
2. If fail → repair prompt once
3. If fail again → fallback (normalizer: minimal result, router: META_UNKNOWN)

### Few-Shot Examples

The normalizer prompt includes 25+ examples covering:

- Slang and urban speech
- Typos and voice-to-text artifacts
- Profanity (preserved intent, not tone)
- Immigrant ESL patterns
- Run-on sentences

Add more examples to improve recognition of specific patterns you see in real usage.

## License

MIT
