# GO LINE — DETERMINISM & ENGINE AUDIT REPORT

**Date**: 2025-01-04  
**System Version**: Current production  
**Audit Type**: Determinism verification and LLM leakage detection

---

## 1️⃣ VARIABLE UTILIZATION AUDIT

### Deterministic Variables (Engine Path)

| Variable | Defined | Weighted | Required/Optional | Status |
|----------|---------|----------|-------------------|--------|
| `activationTarget` | `goOutcomeEngine.ts:23` | 0.4 in intent alignment | Required | ✅ Used |
| `anxietySensitivity` | `goOutcomeEngine.ts:24` | 0.4 in intent alignment | Required | ✅ Used |
| `cognitiveEndurance` | `goOutcomeEngine.ts:25` | 0.2 in intent alignment | Required | ✅ Used |
| `overshootTolerance` | `goOutcomeEngine.ts:26` | Affects blend strategy selection | Required | ✅ Used |
| Terpene profiles | `goOutcomeEngine.ts:50-100` | Biphasic scoring | Required | ✅ Used |
| Cannabinoid ratios | `goOutcomeEngine.ts:278-287` | Anxiety risk calculation | Required | ✅ Used |
| Interaction penalties | `goOutcomeEngine.ts:250-257` | Non-additive stacking | Required | ✅ Used |

### Translation Layer Variables (LLM → Engine)

| Variable | Source | Translation | Status |
|----------|--------|-------------|--------|
| Priorities → Activation | `guidanceToIntent.ts:23-34` | Keyword matching → 0.35/0.55/0.75 | ⚠️ Fuzzy keyword matching |
| Avoidances → Anxiety | `guidanceToIntent.ts:36-40` | Keyword matching → 0.4/0.65 | ⚠️ Fuzzy keyword matching |
| Priorities → Endurance | `guidanceToIntent.ts:42-52` | Keyword matching → 0.3/0.5/0.7 | ⚠️ Fuzzy keyword matching |

**CRITICAL FINDING**: Translation layer uses keyword substring matching, not exact mapping. This introduces non-deterministic behavior if LLM generates synonyms or variations.

---

## 2️⃣ DECISION FLOW VERIFICATION

### Sample Input: "I like Gelato for pain relief but it makes me anxious. I want longer duration and balanced energy."

#### Path A: Deterministic Engine Path (Intended)

```
1. User Input → Conversation API (free-form text)
   └─> LLM generates conversational response (NOT recommendation)

2. User Input Summary → Resolution API
   └─> LLM generates StrategicGuidance JSON:
       {
         temporalProfile: "single-phase",
         dominantPriorities: ["pain relief", "longer duration", "balanced energy"],
         strictAvoidances: ["anxiety"],
         ...
       }

3. StrategicGuidance → translateGuidanceToIntent()
   └─> Keyword matching:
       - "pain relief" → (no direct mapping, inferred)
       - "anxiety" → anxietySensitivity = 0.65
       - "longer duration" → cognitiveEndurance = 0.7
       - "balanced energy" → activationTarget = 0.5

4. OutcomeIntent → resolveOutcome()
   └─> Scoring cascade:
       a. Score all cultivars: scoreCultivar(cultivar, intent)
          - Terpene biphasic scoring (optimal ranges)
          - Intent alignment (activation, anxiety, endurance)
          - Cannabinoid risk (THC vs anxiety sensitivity)
       
       b. Sort by score: scoredCultivars.sort()
       
       c. Try blend strategies:
          - Corrective blend: primary + CBD/CBG (anxiety reduction)
          - Compositional blend: 2-3 components (balance)
          - Single cultivar: ONLY if fit > 0.85 or no blend improves
       
       d. Select optimal: best blend fit > 0.4 → Optimal tier

5. Output: ResolutionTier[]
   └─> Structured data with components + percentages
```

**Decision Tree (Pseudocode)**:
```
IF anxietySensitivity > 0.5 AND primary.avgTHC > 20:
    TRY corrective blend (primary + CBD/CBG)
    IF fit > singleCultivar.fit + 0.05:
        RETURN corrective blend
    ELSE:
        RETURN single cultivar (if fit > 0.85)

IF multiple priorities conflict:
    TRY compositional blend (2-3 components)
    EVALUATE: blend fit vs single fit
    IF blend improves by > 0.05:
        RETURN compositional blend

IF single cultivar fit > 0.85:
    RETURN single cultivar (Simplified tier)
ELSE:
    RETURN blend (Optimal/Balanced tier)
```

#### Path B: Leakage Path (CRITICAL ISSUE)

```
1. User Input → Conversation API
   └─> LLM directly generates recommendation text:
       "I recommend Gelato 60%, Bubba Kush 30%, Cannatonic 10%..."
   
2. Frontend → parseBlendRecommendation()
   └─> Regex parsing of free text
   └─> NO engine involvement
   └─> NO deterministic scoring
   └─> NO variable utilization
   
3. Output: ParsedBlendResolution
   └─> Displayed in BlendResolutionPanel
   └─> BYPASSES ENTIRE ENGINE
```

**VERDICT**: Path B is a complete bypass. The conversation API can generate recommendations that never touch the deterministic engine.

---

## 3️⃣ LLM CONSTRAINT CHECK

### Conversation API (`app/api/conversation/route.ts`)

**Current Constraints (Prompt-Only)**:
- ❌ "Do NOT ask: 'Are you open to hybrids?'"
- ❌ "Do NOT explain cannabis basics"
- ❌ "Single-cultivar recommendations are provisional, never final"

**Enforcement**: NONE — These are prompts, not validation rules.

**Temperature**: 0.7 (moderate randomness)

**Response Validation**: NONE — Accepts any free-form text

**CRITICAL LEAKS**:

1. **Unbounded Question Generation** (Line 151):
   - LLM can ask unlimited follow-up questions
   - No hard limit on question count
   - No validation that questions are outcome-focused

2. **Free-Form Recommendation Output** (Line 186):
   - LLM can generate blend recommendations directly
   - No schema validation
   - No requirement to call engine
   - Response is plain text, not structured

3. **No Single-Cultivar Gate Enforcement** (Line 34-43):
   - Prompt says "provisional, never final" but no code enforces this
   - LLM can finalize single cultivar recommendations

4. **No Blend Requirement Enforcement** (Line 26-31):
   - Prompt says "blends are default" but no validation ensures this

### Resolution API (`app/api/resolution/route.ts`)

**Constraints**: STRONG — JSON schema validation
- ✅ Schema validation (Line 101-143)
- ✅ Temperature: 0.4 (lower randomness)
- ✅ Structured output required
- ⚠️ But: Still allows LLM to suggest strategies (Line 44)

**Verdict**: Resolution API is properly constrained. Conversation API is the leak.

---

## 4️⃣ BLEND JUSTIFICATION RULE ENFORCEMENT

### Engine Enforcement (`goOutcomeEngine.ts:811-852`)

**Rule**: Single cultivar only if:
- Fit > 0.85, OR
- Fit > 0.75 AND no blend improves by > 0.05

**Enforcement**: ✅ HARD-CODED LOGIC (Line 831-832)

```typescript
const singleIsOptimal = singleResult.compositionFit > 0.85 || 
                        (singleResult.compositionFit > 0.75 && 
                         singleResult.compositionFit >= bestBlendFit - 0.02);
```

**Tradeoff Evaluation**: ✅ Required (Line 842-849)

### Conversation API Enforcement

**Rule**: Single cultivar must be provisional with confirmation gate

**Enforcement**: ❌ NONE — Prompt-only, no validation

**Flagged Instances**: The conversation API can output:
- "I recommend Gelato" (single cultivar, no justification)
- "Try Gelato" (casual recommendation)
- "Gelato should work for you" (finalized without verification)

**VERDICT**: Engine enforces rules. Conversation API bypasses them entirely.

---

## 5️⃣ OUTPUT STRUCTURE VALIDATION

### Engine Output
- ✅ Structured: `OutcomeResult` interface
- ✅ Typed: `ResolutionTier[]` with `BlendComponent[]`
- ✅ Percentages: Numeric ratios (0-100)
- ✅ No prose: System notes only

### Conversation API Output
- ❌ Unstructured: Plain text string
- ❌ Free-form: Can include explanations, questions, recommendations
- ❌ No validation: Accepts any text
- ⚠️ Frontend parsing: `parseBlendRecommendation()` attempts to extract structure from prose

**CRITICAL ISSUE**: The conversation API generates prose that the frontend tries to parse. If parsing fails, the recommendation is lost or displayed as chat text. If parsing succeeds, it bypasses the engine.

**UI Rendering**: 
- Engine path → Renders `ResolvedBlend` component (structured)
- Conversation path → Renders parsed text in `BlendResolutionPanel` (non-deterministic)

**VERDICT**: Two separate output paths. Only one is deterministic.

---

## 6️⃣ FAILURE MODE IDENTIFICATION

### Failure Mode 1: Direct Recommendation in Conversation API

**Trigger**: LLM generates blend percentages in conversation response

**Impact**: 
- Bypasses entire engine
- No deterministic scoring
- No variable utilization
- No blend justification rules

**Guardrail Proposed**:
```typescript
// In conversation route.ts
// Detect if response contains percentages + strain names
const hasBlendRecommendation = /(\d+)\s*%.*?(Gelato|Bubba|...)/i.test(responseText);
if (hasBlendRecommendation) {
  // REJECT response, force user to use Resolution API
  return NextResponse.json({
    ok: false,
    error: 'BLEND_RECOMMENDATION_DETECTED',
    message: 'Please use the Resolution flow for blend recommendations.'
  });
}
```

### Failure Mode 2: Ambiguous User Input

**Trigger**: User provides vague input ("something good")

**Impact**:
- LLM infers intent without sufficient data
- Engine receives poorly calibrated variables
- Poor recommendation quality

**Current Handling**: Resolution API can request clarification (Line 49-66 in resolution route)

**Guardrail Proposed**:
```typescript
// Require minimum intent specificity
if (dominantPriorities.length === 0 && strictAvoidances.length === 0) {
  return {
    ok: false,
    error: 'INSUFFICIENT_SPECIFICITY',
    clarificationNeeded: [/* generic questions */]
  };
}
```

### Failure Mode 3: Overly Broad Prompts

**Trigger**: System prompt allows LLM wide latitude

**Impact**:
- LLM can interpret rules creatively
- Temperature 0.7 allows variation
- No hard boundaries

**Guardrail Proposed**:
- Reduce temperature to 0.3 for conversation API
- Add strict response format validation
- Require structured fields even in conversation

### Failure Mode 4: Unbounded Follow-Up Questions

**Trigger**: LLM keeps asking questions without resolving

**Impact**:
- User never gets recommendation
- Conversation loops indefinitely

**Current Handling**: Frontend closes axes after 2 user messages (Line 886)

**Guardrail Proposed**:
```typescript
// Hard limit on conversation turns
if (conversation.filter(m => m.role === 'assistant').length > 5) {
  // Force resolution
  setAxesClosed(true);
  triggerResolution();
}
```

### Failure Mode 5: Translation Layer Keyword Mismatch

**Trigger**: LLM generates priorities with synonyms not in keyword list

**Impact**:
- `translateGuidanceToIntent()` doesn't match keywords
- Default values used (0.5)
- Loss of user intent

**Example**:
- User wants "uplifting" → LLM generates "uplifting" → No keyword match → activationTarget = 0.5 (wrong)

**Guardrail Proposed**:
- Expand keyword lists
- Use semantic similarity (embeddings) instead of substring matching
- Log unmatched keywords for analysis

---

## 7️⃣ FINAL VERDICT

### Is the system deterministic?

**PARTIALLY — WITH CRITICAL LEAKS**

**Deterministic Components**:
1. ✅ `resolveOutcome()` — Fully deterministic scoring and blend generation
2. ✅ `translateGuidanceToIntent()` — Deterministic keyword-to-number mapping
3. ✅ Blend selection logic — Hard-coded rules and thresholds
4. ✅ Single-cultivar justification — Enforced with numeric thresholds

**Non-Deterministic Leaks**:
1. ❌ **Conversation API can generate recommendations directly**
   - Bypasses engine entirely
   - No variable utilization
   - No rule enforcement
   - Prose-based output

2. ⚠️ **Translation layer uses fuzzy keyword matching**
   - Substring matching, not exact
   - Can miss synonyms
   - Defaults to 0.5 if no match

3. ⚠️ **LLM has wide latitude in prompt interpretation**
   - Temperature 0.7 allows variation
   - No hard validation of constraints
   - Can ask unbounded questions

4. ⚠️ **Frontend parsing is fallible**
   - Regex parsing of prose
   - Can fail silently
   - No validation that parsed data is correct

### Binary Assessment

**QUESTION**: Is the current system behaving as a deterministic outcome engine with an LLM interface?

**ANSWER**: **NO**

**Reasoning**:
- The conversation API path allows the LLM to act as a conversational assistant generating recommendations
- The deterministic engine exists but can be completely bypassed
- Two parallel paths: one deterministic (engine), one non-deterministic (conversation API)
- No enforcement that recommendations must go through the engine

### Recommended Fixes (Priority Order)

1. **CRITICAL**: Block blend recommendations in conversation API
   - Detect percentages + strain names
   - Reject response or route to resolution flow

2. **HIGH**: Remove free-form recommendation output from conversation API
   - Conversation API should ONLY ask questions or clarify
   - NEVER generate blend recommendations

3. **HIGH**: Enforce single-path architecture
   - All recommendations MUST go through `resolveOutcome()`
   - Conversation API should only output clarification questions

4. **MEDIUM**: Improve translation layer
   - Use semantic matching instead of keywords
   - Log unmatched terms for expansion

5. **MEDIUM**: Add response validation
   - Verify conversation API doesn't output recommendations
   - Enforce question format for clarifications

---

**AUDIT CONCLUSION**: The deterministic engine is well-implemented, but the conversation API creates a parallel non-deterministic path that can completely bypass it. The system is hybrid, not deterministic.

