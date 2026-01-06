# EXPLICIT ANSWERS TO CLARIFICATION LOGIC QUESTIONS

## Intent & Clarification Logic

### 1. Where in the code is the decision made to ask a follow-up question?
**Answer:** `app/page.tsx`, lines 890-916, in `handleAnalyze()` function
- Decision point: `const needsClarification = shouldClarify(confidence) && filteredQuestions.length > 0;`
- If true: `setPhase('GUIDED')` (line 907)
- If false: `handleLock(guidanceData.guidance, {})` (line 915)

### 2. Is that decision gated by any confidence score, completeness check, or boolean?
**Answer:** YES - gated by:
- `shouldClarify(confidence)` - checks if `confidence.overall < 0.70` OR if critical axes (energy + anxiety) are both < 0.8
- `filteredQuestions.length > 0` - checks if any questions remain after filtering
- Both must be true for clarification to trigger
- **File:** `lib/intentConfidence.ts`, function `shouldClarify()` (lines 172-182)

### 3. Is there any code path where a follow-up question is asked unconditionally?
**Answer:** NO - All paths are gated:
- Line 899: `needsClarification = shouldClarify(confidence) && filteredQuestions.length > 0`
- Line 901: `if (needsClarification)` - conditional check
- **However:** If LLM returns `clarificationNeeded` array, it's filtered but not completely blocked if confidence is high

### 4. Does the system currently ever skip follow-up questions and proceed directly to resolution?
**Answer:** YES - Line 915: `handleLock(guidanceData.guidance, {})` is called when `needsClarification === false`
- This happens when confidence is high OR all questions are filtered out

## Constraint Confidence

### 5. After parsing user input, where is intent completeness or confidence calculated?
**Answer:** `app/page.tsx`, line 891: `const confidence = computeIntentConfidence(guidanceData.guidance);`
- Function: `lib/intentConfidence.ts`, `computeIntentConfidence()` (lines 23-108)
- Called immediately after receiving guidance from API

### 6. Is there a threshold (numeric or boolean) that blocks clarification when intent is complete?
**Answer:** YES - Hard threshold: `CLARIFICATION_THRESHOLD = 0.70`
- **File:** `lib/intentConfidence.ts`, line 18
- **Function:** `shouldClarify()` checks: `confidence.overall < CLARIFICATION_THRESHOLD`
- **CRITICAL RULE:** If `energy >= 0.8 && anxiety >= 0.8`, returns `false` regardless (lines 175-178)

### 7. Is that threshold currently hardcoded, stubbed, or bypassed?
**Answer:** HARDCODED - `const CLARIFICATION_THRESHOLD = 0.70;` (line 18)
- Not stubbed, not bypassed
- Enforced in `shouldClarify()` function

## Execution Order

### 8. What is the exact execution order after user submits input?
**Answer:** 
1. User submits → `handleAnalyze()` called (line ~830)
2. API call to `/api/intent` (line ~850)
3. Receive `guidanceData.guidance` (line 887)
4. **Compute confidence** (line 891)
5. **Filter redundant questions** (lines 894-896)
6. **Check if clarification needed** (line 899)
7. **IF needsClarification:**
   - Set phase to 'GUIDED' (line 907)
   - Show questions UI (lines 1315-1330)
8. **ELSE:**
   - Call `handleLock()` directly (line 915)
   - `handleLock()` → `translateGuidanceToIntent()` → `resolveOutcome()` (lines 927-936)

### 9. Is resolution ever attempted before clarification?
**Answer:** YES - Line 915: `handleLock()` is called directly when `needsClarification === false`
- Resolution happens BEFORE clarification if confidence is high enough

## Inventory Filtering

### 10. How many cultivars are in the demo inventory before filtering?
**Answer:** Total `canonicalChemotypes` array length
- **File:** `data/canonicalChemotypes.ts`
- **Count:** ~34 cultivars (based on grep results showing 28+ entries)
- **NOT LOGGED** - need to add logging

### 11. How many cultivars remain after applying constraints?
**Answer:** Logged in `lib/goOutcomeEngine.ts`:
- Line 1394: `console.log('[RESOLVER] Eligible cultivars after filtering → ${eligibleCultivars.length}');`
- Line 1521: Same log for multi-phase path
- **Filter:** `canonicalChemotypes.filter(cv => !isNonPsychoactive(cv) || cv.id.includes('cbd') || cv.id.includes('cbg'))`
- This filter is VERY permissive - only excludes non-psychoactive cultivars (except CBD/CBG)

### 12. Where is this count logged or surfaced in the UI?
**Answer:** 
- **Logged:** `lib/goOutcomeEngine.ts` lines 1394, 1521 (dev-only)
- **NOT surfaced in UI** - only console logs

## Invalid Resolution Trigger

### 13. What exact condition triggers the "Unable to Resolve Blend" state?
**Answer:** Multiple conditions in `lib/goOutcomeEngine.ts`:
- `validateBlendComposition()` returns failure (lines ~1150-1200)
- Conditions:
  - Insufficient distinct cultivars (< 2 for blends, < 3 for stacks)
  - Duplicate cultivars across roles
  - Percentage sum != 100%
  - Any component < 5% or > 85% (unless single cultivar)
- **File:** `components/ResolutionPanel.tsx`, line 518: `if (blend.failure)` renders `InvalidResolutionState`

### 14. Is that condition evaluated before or after clarification logic?
**Answer:** AFTER clarification logic
- Resolution happens in `handleLock()` (line 936: `resolveOutcome()`)
- Failure check happens in `handleLock()` (line 940: `if (resolvedOutcome.failure)`)
- Clarification happens BEFORE `handleLock()` is called (lines 890-916)

## Buttons & State

### 15. Do the buttons (Adjust constraints / Change inventory / Allow single-cultivar) mutate state?
**Answer:** PARTIALLY:
- **Adjust constraints:** YES - `handleAdjustConstraints()` scrolls to controls, highlights them (lines 419-424)
- **Change inventory:** NO - `handleChangeInventory()` only shows alert (line 429)
- **Allow single-cultivar:** PARTIAL - Sets `allowSingleCultivar` flag and calls `onAdjust()` (lines 432-445)
- **File:** `components/ResolutionPanel.tsx`, lines 419-445

### 16. Are they wired to handlers or are they placeholders?
**Answer:** WIRED to handlers:
- All three buttons have `onClick` handlers
- `handleAdjustConstraints`, `handleChangeInventory`, `handleAllowSingleCultivar`
- But `handleChangeInventory` is just an alert placeholder

## Legacy Chat Logic

### 17. Is there any remaining conversational loop, message queue, or "assistant reply" system still active?
**Answer:** YES - Found in `app/page.tsx`:
- Line 628: `const [conversation, setConversation] = useState<...>`
- Line 764: `handleConversation()` function
- Line 1243: `onClick={() => axesClosed ? handleAnalyze() : handleConversation(userInput)}`
- **BUT:** Comment on line 1254 says "Chat-style rendering is DISABLED"
- **ISSUE:** Logic still exists, may be called conditionally

### 18. Is any follow-up text generated by a legacy LLM prompt rather than deterministic logic?
**Answer:** YES - `handleConversation()` calls `/api/conversation` (line 776)
- This is separate from the intent/guidance flow
- May be called when `axesClosed === false` (line 1243)

## CRITICAL FINDINGS

1. **Clarification gate EXISTS and is enforced** - but may not be strict enough
2. **Resolution CAN happen before clarification** - this is correct behavior
3. **Legacy chat logic STILL EXISTS** - may be interfering
4. **Inventory filtering is permissive** - unlikely to cause single-cultivar issues
5. **Buttons are partially functional** - Change inventory is placeholder

## NEXT STEPS

Add logging to verify:
- Confidence scores
- Filtered question counts
- Whether clarification path or direct resolution path is taken
- Whether legacy conversation handler is being called

