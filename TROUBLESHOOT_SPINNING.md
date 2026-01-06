# Page Spinning / Won't Load - Troubleshooting

## Common Causes

1. **Next.js Still Compiling (Most Likely)**
   - First time can take 30-60 seconds
   - Check Netlify dev terminal for compilation progress
   - Look for: "Compiled successfully" or errors

2. **JavaScript Error**
   - Open browser console (F12)
   - Look for red error messages
   - Check the "Console" tab

3. **Build Error**
   - Check Netlify dev terminal window
   - Look for TypeScript/compilation errors
   - Fix any import errors

## Quick Fixes

### Try Hard Refresh
```
Ctrl + Shift + R  (or Ctrl + F5)
```
This clears cache and forces a fresh reload.

### Check Browser Console
1. Press F12
2. Go to "Console" tab
3. Look for red errors
4. Share the error message

### Check Netlify Dev Terminal
1. Look at the terminal running `netlify dev`
2. Check for:
   - "Compiled successfully" ✅
   - Any error messages ❌
   - Still compiling... ⏳

### Wait for Compilation
If it's the first time loading:
- **Wait 30-60 seconds** for Next.js to compile
- Watch the Netlify dev terminal for progress
- Should eventually show "Compiled successfully"

## What to Look For

**In Browser Console (F12):**
- Module not found errors
- Import errors
- Syntax errors
- Runtime errors

**In Netlify Dev Terminal:**
- TypeScript compilation errors
- Missing file errors
- Import path errors
- Build failures

## If Still Spinning After 60 Seconds

1. Check browser console (F12) for errors
2. Check Netlify dev terminal for errors
3. Try hard refresh (Ctrl+Shift+R)
4. Share the error messages you see








