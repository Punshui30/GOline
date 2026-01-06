# ⚠️ CRITICAL: You're Using the Wrong Server

## The Problem

You're seeing **port 56988** in your browser, which means you're using:
- ❌ `npm run dev` (Next.js dev server)
- ❌ This does NOT serve Netlify functions
- ❌ That's why you get 404 errors

## The Solution

You MUST use:
- ✅ `netlify dev` (Netlify development server)
- ✅ This runs on port **8888**
- ✅ This DOES serve Netlify functions

## Steps to Fix

### Step 1: Stop the Wrong Server

**Find and stop the Next.js dev server:**

1. Look for a terminal window showing Next.js output
2. Press `Ctrl+C` in that terminal to stop it
3. OR kill all Node processes:
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

### Step 2: Start Netlify Dev

**In a terminal, run:**

```bash
cd C:\Users\simmo\Desktop\go-line-calculator
netlify dev
```

**Wait for:**
```
Server now ready on http://localhost:8888
```

### Step 3: Open the Correct URL

**Open in browser:**
```
http://localhost:8888
```

**NOT:** `localhost:56988` ❌
**YES:** `localhost:8888` ✅

### Step 4: Verify Ollama is Running

**In a separate terminal:**
```bash
ollama serve
```

Keep this running!

## How to Tell Which Server You're Using

- **Next.js dev (`npm run dev`):**
  - Port: 3000, 56988, or random port
  - ❌ Functions return 404
  - ❌ Won't work for Netlify functions

- **Netlify dev (`netlify dev`):**
  - Port: **8888** (always)
  - ✅ Functions work correctly
  - ✅ This is what you need

## Quick Checklist

- [ ] Stopped `npm run dev` / Next.js dev server
- [ ] Started `netlify dev` (port 8888)
- [ ] Started `ollama serve` (separate terminal)
- [ ] Opened `http://localhost:8888` in browser
- [ ] No 404 errors
- [ ] Functions work correctly

## Still See 404?

1. Verify you're on port **8888** (check URL bar)
2. Check Netlify dev terminal for errors
3. Make sure `netlify dev` actually started successfully
4. Look for "Server now ready on http://localhost:8888" message








