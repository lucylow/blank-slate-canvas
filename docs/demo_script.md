# PitWall A.I. Demo Script (3 minutes)

This script guides judges and evaluators through the key features of PitWall A.I.

## 0:00 - 0:30 — Landing Page & Value Proposition

**What to show:**
- Hero section with headline: "PitWall A.I. — Real-time race strategy & tire intelligence for the GR Cup"
- Subheadline: "Predict tire loss, recommend pit windows, and get explainable radio-ready guidance — live."
- Three key benefit bullets:
  1. Real-time tire predictions (per-sector) → Laps-until-cliff
  2. Pit-window optimizer with "what-if" simulator (SC / traffic)
  3. Driver fingerprinting + actionable coaching alerts
- Two CTAs: "Run Demo" and "Watch 3-min Video"

**What to say:**
> "PitWall A.I. is a real-time analytics platform built for the Toyota GR Cup. It combines live telemetry, predictive AI models, and intuitive visualization to give racing teams the competitive edge."

**Action:** Click "Run Demo" button

---

## 0:30 - 1:30 — Dashboard Overview & Live Telemetry

**What to show:**
- Main dashboard with live telemetry stream
- Track map showing real-time car position
- Driver list with performance metrics
- Telemetry charts (speed, tire pressure, temperature)

**What to say:**
> "The dashboard streams live telemetry data via WebSocket. You can see real-time tire pressures, temperatures, and performance metrics updating every 80 milliseconds. The track map shows the car's current position, and the driver list displays key performance indicators."

**Action:** Point to live updating metrics, highlight the WebSocket connection indicator

---

## 1:30 - 2:30 — Tire Predictions & Explainable AI

**What to show:**
- Tire prediction cards showing:
  - Predicted loss per lap (e.g., +0.28 s/lap)
  - Laps until 0.5s loss (e.g., 2 laps)
  - Confidence score (e.g., 87%)
- Click "Explain" button on any prediction
- Explain modal showing top-3 evidence points:
  1. "High tire_stress in S2 (braking zone)"
  2. "Rising race temperature last 3 laps"
  3. "Driver brake bias changed -> increased rear slip"
- Sector-by-sector breakdown (S1/S2/S3)

**What to say:**
> "Our AI models predict tire degradation with high confidence. Each prediction includes an explanation showing the top three evidence points. This transparency is crucial for pit wall engineers who need to trust and understand the recommendations. Notice the sector breakdown — S2 shows higher degradation due to heavy braking zones."

**Action:** Click "Explain" on a prediction, scroll through evidence points

---

## 2:30 - 3:00 — Strategy Console & Pit Window Optimization

**What to show:**
- Strategy console with pit window recommendations
- "What-if" simulator showing Safety Car scenarios
- Multi-driver comparison view
- Gap analysis and overtaking opportunities

**What to say:**
> "The strategy console optimizes pit windows based on tire predictions, traffic, and Safety Car scenarios. Engineers can run 'what-if' simulations to compare different strategies. The system also provides gap analysis and identifies overtaking opportunities."

**Action:** Toggle between different strategy scenarios, show multi-driver view

---

## Key Points to Emphasize

1. **Real-time Performance**: Live WebSocket streaming with <100ms latency
2. **Explainable AI**: Every prediction includes evidence and confidence scores
3. **Actionable Insights**: Recommendations are radio-ready for pit wall communication
4. **Track-Specific Models**: Trained on data from all 7 GR Cup tracks
5. **Production-Ready**: Includes health checks, error handling, and scalable architecture

---

## Technical Highlights for Judges

- **Backend**: Node.js + Express with WebSocket support
- **Frontend**: React + TypeScript + Tailwind CSS
- **API**: RESTful endpoints with `/predict_tire/:track/:chassis`
- **Real-time**: WebSocket streaming at 80ms intervals
- **Accessibility**: ARIA labels, keyboard navigation, focus states
- **Performance**: Lazy loading, optimized bundle size

---

## Demo Checklist

- [ ] Landing page loads with hero section
- [ ] "Run Demo" button navigates to dashboard
- [ ] WebSocket connection established (check browser console)
- [ ] Telemetry data streaming and updating
- [ ] "Explain" button opens modal with evidence
- [ ] Strategy console displays recommendations
- [ ] All CTAs have proper focus states
- [ ] Mobile responsive (test on mobile viewport)

---

**Total Runtime**: ~3 minutes  
**Target Audience**: Hackathon judges, racing engineers, product evaluators


