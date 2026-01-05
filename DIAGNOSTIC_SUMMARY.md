# Next.js Build Error Diagnostic Summary

## Error Message
```
./app/page.tsx
Error: 
  x Unexpected token `main`. Expected jsx identifier
     ,-[C:\Users\simmo\Desktop\go-line-calculator\app\page.tsx:984:1]
 984|   };
 985| 
 986|   return (
 987|     <main className="min-h-screen w-full go-bg-primary text-white">
     :      ^^^^
 988|       <div className="pt-16 pb-20">
```

**TypeScript Compiler Output:**
```
app/page.tsx(1395,12): error TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
app/page.tsx(1588,9): error TS17002: Expected corresponding JSX closing tag for 'main'.
app/page.tsx(1589,5): error TS1005: ')' expected.
app/page.tsx(1590,3): error TS1109: Expression expected.
```

## Problem Description
The Next.js build fails because the parser thinks the component function `GOLineCalculator()` ends at line 984, but the `return` statement is at line 986. The parser is treating the JSX starting at line 987 as being outside the component function.

## Component Function Structure
- **Function starts:** Line 602: `export default function GOLineCalculator() {`
- **Function should end:** Line 1591: `}`
- **Error location:** Line 984-987, where parser thinks function ends

## Key Code Context

**Around line 984 (where error occurs):**
```typescript
  // Convert NamedResolutionResult to ResolvedBlend format
  const convertToResolvedBlend = (named: NamedResolutionResult): ResolvedBlend => {
    // Map role from "primary" | "corrective" | "supporting" to "foundation" | "modulator" | "accent"
    const mapRole = (role: string): CultivarRole => {
      if (role === 'primary') return 'foundation';
      if (role === 'corrective') return 'modulator';
      return 'accent';
    };
    
    const cultivars: ResolvedCultivar[] = named.primaryBlend.map(strain => ({
      name: strain.strainName,
      percentage: strain.percentage,
      role: mapRole(strain.role),
    }));
    
    return {
      cultivars,
      stack: named.stack,
    };
  };  // Line 984 - function closes here

  return (  // Line 986 - return statement (parser thinks we're outside function)
    <main className="min-h-screen w-full go-bg-primary text-white">
```

**Around line 1395 (TypeScript error):**
- There's a `)}` closing brace that TypeScript thinks is unexpected
- This is around the resolution UI code

## Brace Count Analysis
- Total braces in file: 369 open, 369 close (balanced)
- From line 602 (component start) to line 984: 85 open, 84 close (1 more open than close)
- This suggests the component function should still be open at line 984

## What We've Tried
1. Counted braces - they appear balanced overall
2. Checked individual functions for missing closing braces
3. Verified arrow functions are properly closed
4. Checked try-catch blocks
5. Removed/added closing braces at end of file (no effect)

## File Information
- File: `app/page.tsx`
- Next.js version: 14.2.35
- Build command: `pnpm build`
- Total file length: ~1593 lines

## Request
Please help identify:
1. Where the missing closing brace is, OR
2. If there's a syntax error causing the parser to misinterpret the structure
3. Why the parser thinks the component function ends at line 984 when the return statement is at line 986


