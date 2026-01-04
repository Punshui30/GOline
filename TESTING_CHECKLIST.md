# Local Testing Checklist

## ✅ Pre-Flight Checks

- [x] Ollama installed and accessible
- [x] llama3.2:3b model available (or llama3.2)
- [x] .env file configured with Ollama settings
- [x] Netlify CLI installed
- [x] Site linked to Netlify

## 🚀 Testing Steps

### Step 1: Start Ollama Server
**Open a NEW terminal window** and run:
```bash
ollama serve
```
Keep this running. You should see Ollama starting on `http://127.0.0.1:11434`

**Verify it's working:**
- Open browser: http://127.0.0.1:11434/api/tags
- Should see JSON list of models
- Or run: `curl http://127.0.0.1:11434/api/tags`

### Step 2: Netlify Dev is Starting
Netlify dev is starting in the background. Wait for:
```
Server now ready on http://localhost:8888
```

### Step 3: Test the Application

1. **Open browser:** http://localhost:8888

2. **Test the intent function:**
   - Enter text: "I want creativity but no anxiety and pain relief"
   - Click "Analyze Intent"
   - Watch browser console (F12) for logs

3. **Check Netlify Dev terminal for:**
   - `[INTENT] Function invoked`
   - `[INTENT] LLM Provider: ollama`
   - `[INTENT] Using Ollama: { baseUrl: 'http://127.0.0.1:11434', model: 'llama3.2' }`
   - `[INTENT] Ollama response received, length: XXX`

### Step 4: Verify Success

**Success indicators:**
- ✅ No "LLM_UNAVAILABLE" error
- ✅ Strategic guidance returned (priorities, avoidances, strategies)
- ✅ Clarification questions appear (if needed)
- ✅ Can proceed to "Lock & Resolve"
- ✅ Outcome resolution works

**If you see errors:**
- Check Netlify dev terminal logs
- Check browser console (F12)
- Verify Ollama is running: `ollama list` in new terminal
- Test Ollama directly: http://127.0.0.1:11434/api/tags

## 🔍 Expected Behavior

### Phase 1: FREE (Initial Input)
- Text input box
- "Analyze Intent" button
- After clicking, should receive `StrategicGuidance`

### Phase 2: GUIDED (If Clarifications Needed)
- Clarification questions (radio buttons)
- "Assumptions We're Making" panel
- Shows: priorities, avoidances, tradeoffs, strategies
- "Lock & Resolve" button

### Phase 3: LOCKED (Resolution)
- Outcome resolution displayed
- Tiers (Optimal, Balanced, Simplified)
- "Why This Was Chosen" and "Tradeoffs" sections
- Chemotype recommendations

## 🐛 Common Issues

### "Ollama API error" or Connection Refused
**Fix:** Start Ollama in a separate terminal:
```bash
ollama serve
```

### Function Still Uses OpenAI
**Fix:** 
1. Check `.env` file contains `LLM_PROVIDER=ollama`
2. Restart Netlify dev (Ctrl+C, then `netlify dev` again)

### Model Not Found
**Fix:** Your model is `llama3.2:3b` which should work. If issues:
- The .env specifies `llama3.2` - Ollama should handle this
- Or update .env to `OLLAMA_MODEL=llama3.2:3b`

### 500 Error
**Check:**
- Netlify dev terminal for detailed error logs
- Browser console for error details
- Ollama server is running and accessible

## 📝 Test Queries to Try

1. **Simple:** "I want to feel energized and focused"
2. **Complex:** "I want creativity but no anxiety and pain relief"
3. **Multi-phase:** "Energized in the morning, relaxed at night"
4. **Specific:** "I need pain relief but stay alert"

## Next Steps After Successful Local Test

Once local testing works:
1. ✅ Verify all features work
2. ✅ Check function logs are clean
3. ✅ Test edge cases
4. 📋 Then proceed to remote server setup (see `REMOTE_OLLAMA_SETUP.md`)




