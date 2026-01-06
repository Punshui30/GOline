# Case Study Asset Map
## GO LINE — Guided Outcomes™ System

### Total Visual Assets: 19

**Critical Assets:** 3 (Hero logo, Outcome icon system, Packaging concepts)
**Decorative Assets:** 16 (Color swatches, diagram elements, container variations)

---

## HERO SECTION

### 1. Animated GO Logo
- **Section:** Hero / Header
- **Placement:** Inline, centered on mobile, left-aligned on desktop
- **Aspect Ratio:** Landscape (360x140 viewBox, ~2.57:1)
- **Dimensions:** ~96px height (mobile), ~128px height (desktop), auto width
- **Purpose:** Primary brand mark, animated entry
- **Source:** `/public/brand/go-animated.svg`
- **Type:** SVG with CSS animations
- **Critical:** Yes

---

## VISUAL IDENTITY SECTION

### 2. GO System Logo (Static)
- **Section:** Visual Identity / Logo System
- **Placement:** Inline, within dark background container
- **Aspect Ratio:** Square (120x120 viewBox)
- **Dimensions:** ~80px x 80px (mobile), ~96px x 96px (desktop)
- **Purpose:** Brand mark demonstration
- **Source:** Inline SVG in `GOSystemLogo.tsx`
- **Type:** SVG component
- **Critical:** No (illustrative)

### 3-7. Color Swatches (5 items)
- **Section:** Visual Identity / Logo System
- **Placement:** Grid items (2 columns mobile, 3 columns desktop)
- **Aspect Ratio:** Landscape (full width x 64px height)
- **Dimensions:** Variable width, 64px height
- **Purpose:** Color palette demonstration
- **Source:** CSS background-color in `VisualIdentity.tsx`
- **Colors:** 
  - #6B7D7D (GO RELAX)
  - #4A5C6B (GO STUDY)
  - #7B6B8C (GO BRAINSTORM)
  - #8C7B5A (GO MOVE)
  - #5A6B7D (GO SLEEP)
- **Type:** CSS-generated rectangles
- **Critical:** No (decorative)

### 8-12. Outcome Icons (5 items)
- **Section:** Visual Identity / Outcome Icon System
- **Placement:** Grid items (3 columns mobile, 5 columns desktop)
- **Aspect Ratio:** Square (100x100 viewBox)
- **Dimensions:** ~96px x 96px (mobile), ~112px x 112px (desktop)
- **Purpose:** Outcome identification system
- **Source:** Inline SVG components in `OutcomeIcons.tsx`
- **Icons:**
  - RelaxIcon (orange leaf shapes)
  - StudyIcon (teal horizontal lines)
  - BrainstormIcon (lime green diamond)
  - MoveIcon (orange-red upward arrow)
  - SleepIcon (purple downward arrow)
- **Type:** SVG components
- **Critical:** Yes

---

## GO LINE BRAND SECTION

### 13-17. Outcome Icons (5 items - duplicate display)
- **Section:** GO LINE Brand / Outcome Icons
- **Placement:** Grid items (3 columns mobile, 5 columns desktop)
- **Aspect Ratio:** Square (100x100 viewBox)
- **Dimensions:** ~96px x 96px (mobile), ~112px x 112px (desktop)
- **Purpose:** Outcome identification system (repeated for context)
- **Source:** Same as items 8-12
- **Type:** SVG components
- **Critical:** No (duplicate display)

---

## CROSS-FORMAT APPLICATION SECTION

### 18-19. Hash/Rosin Glass Jars (2 items)
- **Section:** Cross-Format Application / Hash Rosin Presentation
- **Placement:** Side-by-side grid (1 column mobile, 2 columns desktop)
- **Aspect Ratio:** Portrait (200x280 viewBox, ~0.71:1)
- **Dimensions:** ~max 320px width, auto height
- **Purpose:** Product packaging mockup
- **Source:** Inline SVG in `HashRosinPresentation.tsx`
- **Variants:**
  - METHOD 7 jar
  - METHOD 18 jar
- **Type:** SVG illustrations
- **Critical:** Yes

### 20-21. Pre-Roll Architecture Diagrams (2 items)
- **Section:** Cross-Format Application / Pre-Roll Format Concepts
- **Placement:** Stacked vertical layout
- **Aspect Ratio:** Landscape (400x120 viewBox, ~3.33:1)
- **Dimensions:** Full width container, ~120px height
- **Purpose:** Product architecture visualization
- **Source:** Inline SVG in `PreRollDiagram.tsx`
- **Variants:**
  - Split-Spectrum Format diagram
  - Full-Spectrum Format diagram
- **Type:** SVG technical illustrations
- **Critical:** No (explanatory)

### 22-26. Cylindrical Containers (5 items)
- **Section:** Cross-Format Application / Outcome-Specific Container Concepts
- **Placement:** Horizontal flex wrap, centered
- **Aspect Ratio:** Portrait (120x200 viewBox, ~0.6:1)
- **Dimensions:** ~96px x 160px (mobile), ~112px x 192px (desktop)
- **Purpose:** Outcome-specific packaging mockup
- **Source:** Inline SVG in `CylindricalContainers.tsx`
- **Variants:**
  - GO RELAX container (orange)
  - GO STUDY container (teal)
  - GO MOVE container (orange-red)
  - GO SLEEP container (purple)
  - GO BRAINSTORM container (lime green)
- **Type:** SVG illustrations
- **Critical:** Yes

---

## NOTES

**Critical Assets (3 categories):**
- Hero animated logo (primary brand mark)
- Outcome icon system (product differentiation)
- Packaging concepts (product visualization)

**Decorative Assets:**
- Color swatches (design system reference)
- Static logo variant (illustrative)
- Pre-roll diagrams (explanatory)
- Duplicate icon displays (contextual)

**Asset Generation:**
- All assets are inline SVG components or CSS-generated
- No external image files required
- All dimensions are responsive via viewBox and CSS classes
- Color values are defined in component code











