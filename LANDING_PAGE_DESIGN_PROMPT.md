# 🏁 PitWall A.I. Landing Page — Ultra-Detailed Design Prompt

## MASTER PROMPT FOR DESIGN SYSTEM

You are creating a championship-tier SaaS landing page for PitWall A.I.—a real-time race strategy AI platform. The design must convey:

- **Speed & Precision** (like pit wall decision-making)
- **Enterprise Professionalism** (trust for racing teams)
- **Technical Sophistication** (impressive to engineers & sponsors)
- **Accessibility** (clear value for all stakeholders: engineers, drivers, sponsors)

The page should feel like a high-performance cockpit dashboard meets sleek SaaS homepage—every element optimized for impact, clarity, and conversion.

---

## DESIGN SYSTEM FOUNDATION

### Color Palette (Racing Heritage + Modern Tech)

**Primary Colors:**
- **Toyota Red**: `#EB0A1E` (hero CTAs, accents, trust signal)
- **Deep Navy**: `#0A1A3E` (backgrounds, text, stability)
- **Bright Cyan**: `#00D9FF` (highlights, real-time indicators, energy)
- **Matte Black**: `#0F0F0F` (dark mode base, premium feel)

**Accent Colors:**
- **Success Green**: `#10B981` (positive metrics, "pit now" recommendations)
- **Warning Orange**: `#F59E0B` (caution flags, anomalies, risk)
- **Alert Red**: `#EF4444` (urgent decisions, cliff warnings)
- **Neutral Gray**: `#6B7280` (secondary text, borders, spacing)

**Gradient Schemes:**
- **Hero Gradient**: Deep Navy → Cyan (left to right) + slight purple accent
- **Card Gradient**: Subtle: Dark Navy → Very Dark Cyan (top-left to bottom-right)
- **Accent Gradient**: Orange → Red (used for "pit window optimizer" section)

**Usage Rules:**
- Toyota Red: Only for CTAs, section dividers, critical alerts
- Cyan: Data visualization, real-time indicators, interactive elements
- Navy: All backgrounds, primary text
- Gradients: Used sparingly for impact (hero, major sections, CTAs)

---

### TYPOGRAPHY SYSTEM

**Font Choices (Google Fonts + System Fallback)**

**Headlines (Primary):**
- Font: Inter (Google Fonts) weight 700-900
- Scale:
  - H1 (Hero): 56px (desktop), 32px (mobile), line-height: 1.2
  - H2 (Section Headers): 40px (desktop), 24px (mobile), line-height: 1.3
  - H3 (Subsections): 28px (desktop), 20px (mobile), line-height: 1.4
- Letter Spacing: -0.5px (headlines only, tighter feel)
- Color: White (#FFFFFF) or Deep Navy (#0A1A3E) depending on background

**Body Text (Secondary):**
- Font: Inter (Google Fonts) weight 400-500
- Sizes:
  - Large Body: 18px, line-height: 1.6 (intro paragraphs, value props)
  - Standard Body: 16px, line-height: 1.6 (main copy)
  - Small Body: 14px, line-height: 1.5 (captions, fine print)
  - Tiny: 12px, line-height: 1.5 (metadata, labels)
- Color: Neutral Gray (#6B7280) or Light Gray (#D1D5DB) on dark backgrounds
- Font Weight: 400 for paragraphs, 500 for emphasized terms

**Data/Metrics (Monospace):**
- Font: JetBrains Mono or Courier Prime (monospace, technical feel)
- Size: 14px-18px depending on context
- Weight: 600 (bold for emphasis)
- Color: Bright Cyan (#00D9FF) for active metrics, Orange (#F59E0B) for warnings
- Use Case: Tire wear % values, lap times, race positions, pit window intervals

**CTA Text:**
- Font: Inter weight 600
- Size: 16px
- Letter Spacing: 0.5px (wider, premium feel)
- Text Transform: Uppercase for primary CTAs (not secondary)

---

### Spacing & Layout Rules

**Vertical Rhythm:**
- Use 8px baseline grid (all spacing: 8px, 16px, 24px, 32px, 48px, 64px, 96px)
- Section padding: 96px (desktop), 64px (tablet), 48px (mobile) top/bottom
- Component padding: 24px-32px internal
- Gap between elements: 16px-24px

**Horizontal Layout:**
- Max-width container: 1400px (comfortable for data visualization)
- Left/right margin: 40px (desktop), 24px (tablet), 16px (mobile)
- Grid system: 12-column (Tailwind default)
- Component widths: Full-width (containers), 1/2, 1/3, 1/4 (grid children)

---

### VISUAL HIERARCHY & EMPHASIS

**Section Structure (Top to Bottom)**

1. Hero Section (60vh, immersive)
2. Problem Statement (30vh, contrasting color)
3. Solution Overview (40vh, three-column showcase)
4. Features Deep Dive (60vh, alternating left-right)
5. Performance Metrics (40vh, data-driven)
6. Technical Architecture (50vh, visual diagram)
7. Use Cases & Impact (45vh, testimonials + results)
8. Call-to-Action (30vh, bold conversion)
9. Footer (20vh, navigation + legal)

**Visual Emphasis Techniques**

- **Focal Points:**
  - Use Bright Cyan (#00D9FF) for interactive elements (hover states, focus indicators)
  - Toyota Red (#EB0A1E) for primary CTAs ("Get Early Access", "Request Demo")
  - Drop shadows: `0 20px 25px rgba(0, 0, 0, 0.3)` on cards/buttons (subtle depth)
  - Border highlights: 2px Cyan border on hover (interactive feedback)

- **Motion & Animation:**
  - Entrance: Fade-in + subtle slide-up (200ms ease-out) for sections on scroll
  - Hover: Button → 2px cyan glow, slight scale-up (1.02x), 150ms transition
  - Metrics: Numbers count-up animation (2s duration) when scrolled into view
  - Charts: Draw animation (1.5s) from left to right
  - Avoid: Flash animations, over-spinning wheels; keep it professional

---

## SECTION-BY-SECTION DESIGN SPECS

### SECTION 1: HERO (Full-Screen Immersive)

**Layout:**
- Background: Deep Navy (#0A1A3E) with subtle animated gradient (Navy → Cyan, very subtle movement)
- Split layout: 50% text (left), 50% visual (right)
- Height: 100vh (or 90vh with navbar)

**Left Content:**
- **Headline**: "Real-Time Race Strategy AI for Championship Teams"
  - Size: 56px, weight 800, white, line-height 1.2
- **Subheadline**: "Predict tire wear with 95%+ accuracy. Optimize pit windows. Win races."
  - Size: 18px, weight 500, gray (#6B7280)
- **Spacing**: 24px between headline and subheadline

**CTAs (Stacked Horizontal):**
- **Primary**: "Get Early Access" button
  - Background: Toyota Red (#EB0A1E)
  - Padding: 16px 40px
  - Font: Inter 600, 16px, uppercase, white
  - Border: 2px solid transparent
  - Hover: Cyan glow (`box-shadow: 0 0 30px rgba(0, 217, 255, 0.5)`), background darkens to #C8081A
- **Secondary**: "Watch Demo" button
  - Background: Transparent
  - Border: 2px solid Cyan (#00D9FF)
  - Color: Cyan
  - Hover: Fill background with Cyan (inverted text black), smooth 150ms transition

**Right Visual:**
- Hero Animation: Animated dashboard mockup (wireframe style, semi-transparent)
- Show pit wall dashboard with:
  - Tire wear gauges (FL, FR, RL, RR) with animated fill (0-100%)
  - Live telemetry line chart (speed over time, animated line drawing)
  - "PIT WINDOW" indicator pulsing Cyan
  - Strategy recommendation cards sliding in
- Use SVG or animated PNG for clean look
- Opacity: 0.9 (slight transparency so background gradient shows)
- Animation: Continuous subtle movement (zoom 1.0 → 1.02x, 3s loop)

**Accent Details:**
- Small badge top-left: "⚡ Trusted by racing teams" (14px gray text)
- Scroll indicator bottom: Animated down arrow (pulsing, Cyan color)

---

### SECTION 2: PROBLEM STATEMENT (Dark + High Contrast)

**Layout:**
- Background: Matte Black (#0F0F0F) with subtle grid overlay (optional, 1px Cyan lines, 80px grid, 5% opacity)
- Single column, centered
- Height: 30vh
- Padding: 96px vertical, 40px horizontal

**Content:**
- **Headline**: "The Pit Wall Challenge"
- **Subheading** (60-char): "Manual pit window calculations. Reactive tire management. Missed opportunities."

**Three Problem Cards (Horizontal row):**
- Layout: 3-column grid with 24px gap
- Each card:
  - Background: Linear gradient (Dark Navy → Very Dark Cyan, subtle)
  - Border: 1px solid Cyan (#00D9FF), 20% opacity
  - Border-radius: 12px
  - Padding: 32px
  - Content: Icon (60×60px, Cyan), headline (18px), description (14px gray)

**Card 1**: "⏱️ Slow Decisions"
- Text: "Manual analysis takes 20+ minutes. Pit wall has <30 seconds."

**Card 2**: "🎯 Guesswork Strategy"
- Text: "Rule-based heuristics miss optimal pit windows. Cost: 3-5 positions/race."

**Card 3**: "👤 Limited Coaching"
- Text: "Subjective feedback. No continuous driver performance analysis."

**Animation:**
- Cards fade-in on scroll (200ms staggered, 100ms delay between each)
- Hover: Border brightens to full Cyan, shadow increases

---

### SECTION 3: SOLUTION OVERVIEW (Hero Features)

**Layout:**
- Background: Deep Navy (#0A1A3E)
- Headline: "How PitWall A.I. Changes Everything"
- 3-column feature showcase with animated interaction

**Three Feature Blocks:**
- Layout: 3-column grid, 32px gap
- Each block height: 400px
- Each contains: Icon (80×80px), headline, description, CTA link

**Feature 1: "Real-Time Tire Prediction"**
- Icon: Animated tire icon (Cyan, subtle pulsing)
- Headline: "95%+ Accurate Tire Wear Forecasting"
- Description: "ML models predict tire cliff with <30 seconds notice. No more guesswork."
- Metric badge: "Confidence: 92%" (Cyan badge, top-right corner)
- Interactive detail: On hover, show mini chart (simplified tire wear curve)

**Feature 2: "Smart Pit Strategy"**
- Icon: Animated pit window icon (green→orange gradient)
- Headline: "Optimal Pit Windows in Real-Time"
- Description: "Monte Carlo simulation evaluates 10,000 scenarios instantly. Maximizes race position."
- Metric badge: "10,000 iterations/strategy" (Cyan badge)
- Interactive: On hover, show 3-strategy comparison (text: "Undercut +2.1 pos", "Overcut -1 pos", etc.)

**Feature 3: "AI Driver Coaching"**
- Icon: Animated driver profile icon (head silhouette, Cyan)
- Headline: "Continuous Performance Analysis"
- Description: "AI fingerprints each driver. Generates actionable coaching in real-time."
- Metric badge: "89% coaching accuracy" (Cyan badge)
- Interactive: On hover, show coaching example ("Brake 20m earlier → -0.15s/lap")

---

### SECTION 4: FEATURES DEEP DIVE (Detailed Technical)

**Layout:**
- Background: Alternating Navy/Black (section 1: Navy, section 2: Black, etc.)
- Alternating left-right text/visual layout
- Each feature: 50vh tall

**Feature A: "Tire Degradation Intelligence"**
- Left: Text content
  - Headline: "Know Exactly When Tires Will Fail"
  - Copy: "PitWall analyzes cumulative G-forces, braking events, and tire age to predict degradation within ±0.8 laps."
  - Bullet points (16px, gray):
    - • Physics-informed hybrid ML model
    - • Per-tire predictions (FL, FR, RL, RR)
    - • Confidence intervals for pit window uncertainty
    - • Track-specific calibration
  - CTA link: "Technical Details →" (Cyan text, underline on hover)
- Right: Visual (Animated chart)
  - Tire wear curve: X-axis (laps 1-20), Y-axis (tire wear 0-100%)
  - 4 line graphs (one per tire color: cyan, blue, green, orange)
  - Animated "cliff" marker (red dashed vertical line, pulsing)
  - Tooltip: Shows exact lap number when cliff occurs
  - Animation: Lines draw from left-to-right on scroll-into-view (1.5s)

**Feature B: "Monte Carlo Strategy Simulation"**
- Left: Visual (Strategy comparison cards)
  - 3 cards side-by-side, each showing:
    - • Strategy name ("UNDERCUT", "OVERCUT", "TWO-STOP")
    - • Win probability (68%, 24%, 8%)
    - • Position delta (+2.1, +0.5, -0.5)
    - • Risk meter (green/yellow/red bar)
  - Animation: Cards slide-in on scroll, numbers count-up
- Right: Text content
  - Headline: "Simulate Any Strategy in Seconds"
  - Copy: "Real-time Monte Carlo engine evaluates multiple pit strategies, factoring in traffic, safety cars, and competitor timing."
  - Features:
    - • 10,000 scenario simulations per strategy
    - • Live race state adaptation
    - • Risk-reward tradeoff visualization
  - Quote callout (18px italic, Cyan left border):
    - "We gained 2 positions per race using PitWall's recommendations." — Race Engineer, GR Cup Team

**Feature C: "Driver Fingerprinting"**
- Left: Text
  - Headline: "Objective Coaching, Real-Time Insights"
  - Copy: "AI analyzes braking, cornering, and throttle patterns to identify driver strengths and improvement areas."
  - Coaching example box (background: Dark Cyan, border-left: 4px Cyan):
    - ⚠ Stress Index: HIGH (85 BPM)
    - 💡 Brake 20m earlier in turn 3 → -0.15s/lap
    - ✅ Throttle smoothing (baseline)
  - Predictive impact badge: "Expected gain: -0.35s/lap"
- Right: Visual (Driver profile card)
  - Radar chart: 6-axis (Braking Consistency, Cornering, Throttle, Risk, Speed, Stability)
  - Each axis: filled to different levels (e.g., Braking 85%, Cornering 92%, Throttle 78%)
  - Center: Driver name + lap time improvement trend
  - Animation: Radar lines fade-in on scroll, pulsing gently

---

### SECTION 5: PERFORMANCE METRICS (Data-Heavy)

**Layout:**
- Background: Deep Navy (#0A1A3E) with cyan grid (light overlay)
- Headline: "Built for Speed & Accuracy"
- Subtitle: "Championship-tier performance benchmarks"

**Metrics Grid (4×3, staggered layout):**
- 12 metric cards, each 250px × 180px
- Card template:
  - Background: Linear gradient (Navy → Dark Cyan)
  - Border: 1px solid Cyan, 30% opacity
  - Padding: 24px
  - Content: Metric name (14px small-caps), value (48px bold cyan), unit (14px gray)
  - Animation: Fade-in + count-up number on scroll (2s duration, easing function: easeOut)

**Metrics:**
1. Inference Latency: "5ms" (subheading: "P50 response time")
2. Tire Wear Accuracy: "95.2%" (subheading: "R² prediction accuracy")
3. Telemetry Throughput: "10k+" (subheading: "data points/second")
4. Pit Recommendations: "<30s" (subheading: "decision time")
5. Driver Coaching Match: "89%" (subheading: "accuracy vs. engineers")
6. Strategy Win Prob.: "68%" (subheading: "avg recommendation")
7. Model Confidence: "92.1%" (subheading: "average confidence")
8. WebSocket Latency: "67ms" (subheading: "P50 broadcast")
9. Concurrent Clients: "1000+" (subheading: "supported users")
10. Uptime Target: "99.9%" (subheading: "SLA reliability")
11. Feature Extraction: "20-dim" (subheading: "engineered features")
12. System Scaling: "Linear" (subheading: "horizontal scaling")

**Bottom CTA:**
- Text: "View Full Technical Specs" (underlined cyan link)
- Link target: /technical-specifications or downloadable PDF

---

### SECTION 6: TECHNICAL ARCHITECTURE (Visual Diagram)

**Layout:**
- Background: Matte Black (#0F0F0F)
- Headline: "Enterprise-Grade Architecture"
- Subheading: "High-throughput, low-latency real-time processing"

**Architecture Diagram (Interactive SVG):**
- Flowchart showing: Telemetry Input → Processing Pipeline → ML Models → WebSocket Broadcast → Dashboard
- Each stage represented as a box/node (Navy background, Cyan border)
- Arrows between nodes (Cyan, animated dashes moving left-to-right, loop animation)
- Hover states: On hover over a node, show tooltip (description + latency stats)

**Key Components Highlighted:**
- 📊 Telemetry Ingestion: "10k pts/sec UDP/HTTP"
- 🔄 Redis Streams: "Event-driven messaging"
- 🤖 ML Pipeline: "ONNX Runtime <5ms"
- 📡 WebSocket: "Sub-100ms broadcast"
- 📈 Dashboard: "Real-time visualization"

**Side Panel (Right, 30% width):**
- Tech stack list (vertical):
  - Frontend: React 18, Vite, TailwindCSS
  - Backend: FastAPI, Python, Redis
  - ML: ONNX, XGBoost, LightGBM
  - Infrastructure: Docker, Kubernetes
- Each item: 14px gray text, indented
- Optional: Small icons next to each tech (React logo, Python snake, etc.)

---

### SECTION 7: USE CASES & TESTIMONIALS

**Layout:**
- Background: Navy with 45° diagonal stripe pattern (Cyan stripes, 2% opacity, 80px spacing)
- Headline: "Real Impact on Real Races"

**Three-Column Case Study Layout:**

**Case 1: "Position Gains"**
- Visual: Large green +2.1 number (72px, bold, green gradient)
- Headline: "Average positions gained per race"
- Description: "Using PitWall's pit window recommendations, teams avoid sub-optimal timing."
- Bottom detail: "5-race pilot program, GR Cup 2025"

**Case 2: "Tire Management"**
- Visual: Large metric: "-0.35s" (72px, red→orange gradient)
- Headline: "Lap time improvement via driver coaching"
- Description: "AI-driven coaching identified and corrected specific braking/throttle issues."
- Bottom detail: "Top 3 drivers, consistency improvement 15%"

**Case 3: "Decision Speed"**
- Visual: Large metric: "-90%" (72px, cyan)
- Headline: "Faster pit window recommendations"
- Description: "From 20+ minute post-race analysis to <30 second live recommendations."
- Bottom detail: "Real-time adaptation during caution flags"

**Testimonials (Below case studies):**
- Carousel with 3 testimonials (swipeable on mobile)
- Each testimonial card:
  - Background: Light Dark Cyan with 1px Cyan border
  - Quote (16px italic): "PitWall A.I. eliminated guesswork from our pit strategy. We won 3 races we would've lost." — John Smith, GR Cup Race Engineer
  - Author info: Name, title, team
  - Avatar: 40×40px circle image (placeholder: initials or team logo)
  - Rating: 5 ⭐ (Cyan stars)
- Animation: On scroll to section, cards fade-in + slide-in from left

---

### SECTION 8: FINAL CTA (Conversion-Focused)

**Layout:**
- Background: Linear gradient (Dark Navy → Toyota Red, 45° angle)
- Full-width, 30vh tall
- Centered text overlay

**Content:**
- **Headline**: "Join Championship-Tier Teams Using PitWall A.I."
- **Subheading**: "Get early access. Real-time analytics for your race strategy."
- **Two CTAs (side-by-side):**
  - Primary: "Get Early Access" (white text, black background, hover: red/cyan glow)
  - Secondary: "Schedule Demo" (transparent bg, cyan border, cyan text)
- **Email signup (optional)**: Text input + "Send" button

**Visual Accent (Right side):**
- Animated checkmark (Cyan, 120px, subtle scaling loop)

---

### SECTION 9: FOOTER (Professional, Scannable)

**Layout:**
- Background: Matte Black (#0F0F0F)
- 4-column footer layout + bottom bar

**Columns:**
- **Product**
  - Features
  - Pricing
  - Roadmap
  - API Docs
- **Developers**
  - GitHub
  - Documentation
  - Community
  - Support
- **Company**
  - About
  - Blog
  - Press
  - Careers
- **Legal & Social**
  - Privacy Policy
  - Terms of Service
  - Twitter / LinkedIn
  - Email signup

**Bottom Bar:**
- Copyright: "© 2025 PitWall A.I. All rights reserved."
- Links alignment: Left-aligned copyright, right-aligned social icons
- Social icons: Twitter, LinkedIn, GitHub (Cyan on hover)
- Divider line: 1px Cyan, 20% opacity

---

## INTERACTIVE ELEMENTS & ANIMATIONS

### Button Interactions

**Primary Button Hover:**
- Background color shift (Toyota Red → darker red)
- Glow effect: `box-shadow: 0 0 30px rgba(235, 10, 30, 0.6)`
- Slight lift: `transform: translateY(-3px)`
- Cursor: pointer with custom cursor (optional)
- Transition: 150ms ease-out

**Secondary Button Hover:**
- Border brightens to full Cyan
- Text color brightens
- Background fills with subtle Cyan (5% opacity)
- Transition: 150ms ease-out

### Scroll Animations

- **Fade-in + Slide-up**: Elements fade-in (opacity 0 → 1) while sliding up 20px on scroll-into-view
  - Duration: 200ms ease-out
  - Stagger: 50ms delay between sequential elements
- **Number Count-up**: Metrics count from 0 to final value when scrolled into view
  - Duration: 2s
  - Easing: easeOutCubic
  - Format: Maintain decimal places (e.g., 95.2%, not 95.2)
- **Chart Draw**: Line graphs/charts animate from left-to-right when scrolled into view
  - Duration: 1.5s
  - Uses SVG stroke-dasharray animation for smooth line drawing

### Hover Effects

**Card Hover:**
- Scale: 1.02x (slight zoom)
- Shadow: Increase shadow depth (from `0 10px 20px rgba(0,0,0,0.2)` to `0 20px 40px rgba(0,0,0,0.4)`)
- Border: Brighten border color by 50%
- Transition: 100ms ease-out

**Link Hover:**
- Text color: Change to Cyan
- Underline: Animate from 0% width to 100% (left-to-right)
- Duration: 100ms

---

## RESPONSIVE DESIGN (Mobile-First)

### Breakpoints

- **Mobile**: 320px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px+

### Mobile Adjustments

- Hero: Stack text and visual vertically, full-width
- Features: 1-column grid (instead of 3-column)
- Metrics: 2×6 grid (instead of 4×3)
- Typography: Reduce headline sizes by 50% (56px → 32px, 40px → 24px)
- Spacing: Reduce padding/margins by 30% (96px → 64px, 32px → 24px)
- CTAs: Full-width buttons (instead of fixed width)
- Touch targets: Ensure all clickable elements ≥ 44px × 44px (WCAG standard)

### Tablet Adjustments

- Features: 2-column grid (instead of 3-column)
- Metrics: 3×4 grid (instead of 4×3)
- Footer: 2-column layout (instead of 4-column)
- Typography: Moderate size reductions (10-20%)

---

## ACCESSIBILITY & INCLUSIVITY

### Color Contrast

- Ensure all text ≥ 4.5:1 contrast ratio (WCAG AA standard)
- Test with WebAIM contrast checker
- Avoid red/green only differentiation (colorblind-friendly palette)

### Keyboard Navigation

- All buttons, links, and form inputs accessible via Tab key
- Focus indicators: 2px Cyan outline (high contrast)
- Tab order: Logical left-to-right, top-to-bottom flow
- Keyboard shortcuts: Optional (e.g., Esc closes modals, Enter submits forms)

### Screen Reader Support

- Semantic HTML: Use `<button>`, `<a>`, `<section>`, `<article>`, etc.
- ARIA labels: Add aria-label to icon-only buttons
- Alt text: All images/charts have descriptive alt text
- Skip link: "Skip to main content" link at top of page

### Motion & Animation

- Respect `prefers-reduced-motion` CSS media query
- If enabled, disable all animations (keep static, no motion)
- Test with accessibility validator (axe, WAVE, etc.)

---

## PERFORMANCE OPTIMIZATION

### Image & Media

- Use WebP format (with JPEG fallback) for images
- Compress to <100KB per image (lazy-load below fold)
- SVG for icons, animated diagrams (scalable, small file size)
- Videos: Self-hosted or CDN-delivered (not embedded YouTube for speed)

### Code Splitting & Lazy Loading

- Hero section: Render immediately (critical)
- Below-fold sections: Lazy-load on scroll or via Intersection Observer
- Heavy components (charts, modals): Code-split and load on-demand

### Font Loading

- Use `font-display: swap` (shows system font immediately, swaps to custom when loaded)
- Preload critical fonts: `<link rel="preload" as="font" href="inter.woff2">`
- Limit font weights/styles (e.g., 400 + 600 + 800 only)

### Build & Deployment

- Minify & bundle CSS/JS (Vite handles automatically)
- Enable Gzip compression (server-side)
- Cache static assets (30-day expiry)
- Use CDN for global distribution (CloudFlare, Akamai, etc.)

---

## FINAL CHECKLIST FOR DESIGNER/DEVELOPER

✅ Color palette applied consistently (Toyota Red, Navy, Cyan, Gray)  
✅ Typography hierarchy clear (H1 56px, H2 40px, body 16px)  
✅ All interactive elements have hover states (150ms transition)  
✅ Animations are smooth and purposeful (no flash, 200-1500ms durations)  
✅ Mobile layout tested on iPhone SE, iPad, and desktop (1440p)  
✅ Images compressed (<100KB each), WebP format  
✅ Accessibility checked (4.5:1 contrast, keyboard nav, screen reader compatible)  
✅ Performance optimized (Lighthouse >90, <3s load time, 100KB initial JS)  
✅ All sections have clear CTAs and next steps  
✅ Footer includes legal links, social, newsletter signup  
✅ Testimonials and social proof prominently displayed  
✅ Technical credibility established (specs, benchmarks, architecture diagrams)

---

**THIS IS YOUR MASTER PROMPT. Copy-paste into your design/dev brief and execute.**

