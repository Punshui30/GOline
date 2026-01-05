# Implementation Notes: Conversational vs Resolution LLM Separation

## Requirements
1. Conversational LLM: Runs continuously, asks questions, summarizes, NO numeric intent/recommendations
2. Resolution LLM: Triggered only when axes closed, receives structured state (not raw chat)
3. Conversation memory: Structured state, not raw chat history

## Current State
- `app/page.tsx` uses `handleAnalyze` which calls `/api/intent` (resolution-style LLM)
- Need to refactor to use `/api/conversation` for ongoing interaction
- Need to track resolved axes and trigger `/api/resolution` only when all axes closed

## Implementation Plan
1. Add conversation messages state (for display)
2. Add structured intent summary state (built from conversation)
3. Add resolved axes tracking
4. Replace handleAnalyze to use /api/conversation
5. When axes closed, call /api/resolution with structured summary
6. Build structured summary from conversation (not pass raw messages)






