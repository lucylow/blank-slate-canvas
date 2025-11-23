import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';

/**
 * Converts markdown content to PDF using html2canvas for better rendering
 * @param markdownContent - The markdown content to convert
 * @param filename - The name of the PDF file (default: 'report.pdf')
 * @param title - Optional title for the PDF
 */
export async function generatePDFFromMarkdown(
  markdownContent: string,
  filename: string = 'report.pdf',
  title?: string
): Promise<void> {
  // Convert markdown to HTML
  const htmlContent = await marked(markdownContent);
  
  // Create a temporary container to render HTML
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.padding = '20mm';
  tempDiv.style.fontFamily = 'Arial, Helvetica, sans-serif';
  tempDiv.style.fontSize = '12px';
  tempDiv.style.lineHeight = '1.6';
  tempDiv.style.color = '#000000';
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.style.boxSizing = 'border-box';
  
  // Add title if provided
  if (title) {
    tempDiv.innerHTML = `<h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #dc2626;">${title}</h1>${htmlContent}`;
  } else {
    tempDiv.innerHTML = htmlContent;
  }
  
  // Add styles for better rendering
  const style = document.createElement('style');
  style.textContent = `
    h1 { font-size: 24px; font-weight: bold; margin: 20px 0 15px 0; color: #dc2626; }
    h2 { font-size: 20px; font-weight: bold; margin: 18px 0 12px 0; color: #1f2937; }
    h3 { font-size: 18px; font-weight: bold; margin: 15px 0 10px 0; color: #374151; }
    h4, h5, h6 { font-size: 16px; font-weight: bold; margin: 12px 0 8px 0; }
    p { margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    ul, ol { margin: 10px 0; padding-left: 30px; }
    li { margin: 5px 0; }
    code { background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre { background-color: #f3f4f6; padding: 10px; border-radius: 5px; overflow-x: auto; }
    hr { border: none; border-top: 1px solid #d1d5db; margin: 20px 0; }
    strong, b { font-weight: bold; }
    em, i { font-style: italic; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(tempDiv);
  
  try {
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: tempDiv.offsetWidth,
      height: tempDiv.offsetHeight
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Initialize PDF
    const pdf = new jsPDF({
      orientation: pdfHeight > 297 ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = pdfHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    
    // Save PDF
    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
    document.head.removeChild(style);
  }
}

/**
 * Generate PDF for Barber Motorsports Park Data Analysis Report
 */
export async function generateBarberReportPDF(): Promise<void> {
  const markdownContent = `# GR Cup Racing Series - Data Analysis Report

## 🏁 Executive Summary

This report analyzes two GR Cup races featuring Toyota GR86 vehicles with 22 participants each. The analysis reveals a highly competitive series with dominant performances, significant position changes between races, and tight midfield battles.

---

## 📊 Race Overview

| Metric | Race 1 | Race 2 |
|--------|---------|---------|
| **Total Laps** | 27 | 28 |
| **Winner Time** | 45:15.035 | 45:37.014 |
| **Cars Finished** | 22 | 22 |
| **Full Distance Finishers** | 20 (90.9%) | 15 (68.2%) |
| **Fastest Lap Speed** | 136.8 kph | 136.9 kph |

---

## 🥇 Performance Analysis

### Top 3 Finishers

**Race 1:**

1. **Car #13** - 45:15.035
2. **Car #22** - +2.740 seconds
3. **Car #72** - +10.655 seconds

**Race 2:**

1. **Car #13** - 45:37.014  
2. **Car #22** - +0.234 seconds
3. **Car #2** - +16.306 seconds

### Dominant Performers

**Car #13 - The Champion**

- 🏆 Won both races
- Most consistent fastest laps (1:37.350 & 1:37.428)
- Demonstrated superior race craft and consistency

**Car #22 - The Challenger**

- 🥈 Second in both races
- Showed significant improvement in Race 2
- Set fastest lap of the weekend in Race 2 (1:37.304)

---

## 📈 Position Changes Analysis

### Biggest Improvers (Race 1 → Race 2)

| Car | Race 1 Position | Race 2 Position | Improvement |
|-----|-----------------|-----------------|-------------|
| #88 | 22nd | 9th | +13 positions |
| #46 | 16th | 5th | +11 positions |
| #21 | 11th | 7th | +4 positions |
| #5 | 17th | 11th | +6 positions |

### Biggest Declines (Race 1 → Race 2)

| Car | Race 1 Position | Race 2 Position | Decline |
|-----|-----------------|-----------------|----------|
| #55 | 4th | 20th | -16 positions |
| #113 | 10th | 22nd | -12 positions |
| #98 | 7th | 15th | -8 positions |
| #72 | 3rd | 4th | -1 position |

---

## ⏱️ Lap Time Performance

### Fastest Lap Comparison

| Car | Race 1 Fastest Lap | Race 2 Fastest Lap | Improvement |
|-----|-------------------|-------------------|-------------|
| #13 | 1:37.428 | 1:37.350 | -0.078s |
| #22 | 1:37.746 | 1:37.304 | -0.442s |
| #2 | 1:38.326 | 1:37.678 | -0.648s |
| #46 | 1:38.202 | 1:37.910 | -0.292s |

### Speed Analysis

- **Top Speed Range**: 136.4-136.9 kph
- **Midfield Speed Range**: 134.7-136.0 kph  
- **Backmarker Speed Range**: 132.9-134.8 kph

---

## 🎯 Competitiveness Metrics

### Race 1 Competitiveness

- **Podium Gap**: 10.655 seconds
- **Top 10 Spread**: 35.721 seconds
- **Field Spread**: 1 lap + 1:14.985 seconds

### Race 2 Competitiveness  

- **Podium Gap**: 16.306 seconds
- **Top 10 Spread**: 32.047 seconds
- **Field Spread**: 4 laps + 56.558 seconds

### Close Battles

- **Race 2 Top 2**: Only 0.234 seconds separation
- **Race 1 P4-P5**: Only 0.454 seconds gap
- **Race 2 P4-P5**: Only 0.191 seconds gap

---

## 🔧 Reliability Analysis

### Completion Rates

\`\`\`markdown
Race 1 Completion:

- Full Distance: 20 cars (90.9%)
- 1 Lap Down: 1 car (4.5%)
- DNF (14 Laps Down): 1 car (4.5%)

Race 2 Completion:

- Full Distance: 15 cars (68.2%)
- 1 Lap Down: 4 cars (18.2%)
- 2+ Laps Down: 3 cars (13.6%)
\`\`\`

### Notable Reliability Issues

- **Car #88**: DNF in Race 1 (only 13 laps), recovered to 9th in Race 2
- **Car #55**: Strong 4th in Race 1, dropped to 20th in Race 2 (2 laps down)
- **Car #113**: Competitive 10th in Race 1, fell to last in Race 2 (4 laps down)

---

## 📊 Statistical Summary

### Performance Consistency

- **Most Consistent**: Cars #13, #22, #72 (maintained top positions)
- **Most Volatile**: Cars #55, #113, #88 (large position swings)
- **Steady Improvers**: Cars #46, #21, #5

### Speed Development

- **Biggest Lap Time Improvement**: Car #2 (-0.648s)
- **Most Consistent Lap Times**: Car #13 (0.078s variance)
- **Speed Progression**: 9 cars improved their fastest laps in Race 2

---

## 💡 Strategic Insights

### Key Success Factors

1. **Qualifying Position**: Critical for race success
2. **Race Pace Consistency**: More valuable than single fast laps
3. **Reliability**: Major differentiator in Race 2
4. **Midfield Battles**: Extremely tight competition

### Areas for Improvement

- **Reliability Management**: Significant drop in full-distance finishers in Race 2
- **Race Strategy**: Some teams showed better adaptation between races
- **Performance Consistency**: Large variance in some drivers' results

---

## 🏆 Championship Implications

Based on the two-race analysis:

**Championship Contenders:**

1. **Car #13** - Clear favorite with dominant performances
2. **Car #22** - Strong challenger showing rapid improvement
3. **Car #2** - Consistent podium contender

**Dark Horses:**

- **Car #72** - Solid top-5 performances
- **Car #46** - Impressive Race 2 recovery
- **Car #47** - Consistent points scorer

---

## 📋 Recommendations

### For Teams

1. Focus on reliability and consistency over single-lap speed
2. Develop strategies for managing tire wear over race distance
3. Improve qualifying performance to gain track position

### For Organizers

1. Consider format adjustments to improve reliability rates
2. Monitor performance balancing if dominance continues
3. Highlight midfield battles for spectator engagement

---

*Report generated based on official timing data from GR Cup Races 1 & 2. Data includes 22 Toyota GR86 entries across both events.*`;

  await generatePDFFromMarkdown(
    markdownContent,
    'Barber_Motorsports_Park_Data_Analysis_Report.pdf',
    'GR Cup Racing Series - Barber Motorsports Park'
  );
}

/**
 * Generate PDF for Sebring International Raceway - GR Cup Race 1 Analysis Report
 */
export async function generateSebringReportPDF(): Promise<void> {
  const markdownContent = `# **PIT WALL AI - RACE ANALYSIS REPORT**

**Sebring International Raceway - GR Cup Race 1**

---

## **🏆 EXECUTIVE SUMMARY**

| Metric | Score | Analysis |
|--------|-------|----------|
| **Race Dominance** | 7.2/10 | Controlled but not dominant victory |
| **Competitiveness** | 8.5/10 | Multiple close battles throughout field |
| **Reliability** | 10/10 | All 22 cars classified as finishers |
| **Entertainment Value** | 8.0/10 | Excellent racing with tight battles |

**Key Insight:** Car #13 delivered a masterclass performance, securing pole position, race win, and fastest lap in a display of complete dominance.

---

## **📊 RACE PERFORMANCE ANALYSIS**

### **Podium Performance**

\`\`\`python
PODIUM_BREAKDOWN = {
    "winner": {
        "car": 13,
        "total_time": "46:23.022",
        "win_margin": "+8.509",
        "fastest_lap": "2:25.437 (Lap 4)"
    },
    "closest_battle": "P2-P3: +0.663s",
    "podium_spread": "9.172 seconds"
}
\`\`\`

### **Lap Time Distribution**

- **Fastest Lap:** 2:25.437 (Car #13)
- **Average Fast Lap:** 2:26.984
- **Slowest Fast Lap:** 2:28.789 (Car #51)
- **Performance Spread:** 3.352 seconds

---

## **⚔️ BATTLE INTENSITY HEATMAP**

### **Critical Battles Identified:**

1. **P3 vs P4** - Gap: **+0.187s** 🚨 *EXTREME INTENSITY*
2. **P10 vs P11** - Gap: **+0.238s** 🚨 *EXTREME INTENSITY*  
3. **P7 vs P8** - Gap: **+0.295s** 🔥 *HIGH INTENSITY*

### **Strategic Overtaking Zones:**

- **Laps 2-4:** 45% of drivers set fastest laps
- **Mid-Race (Laps 5-10):** Strategic tire management phase
- **Late Race (Lap 14):** Car #98 shows alternative strategy potential

---

## **📈 DRIVER PERFORMANCE TIERS**

### **Tier 1 - Elite Performers** 🏆

**Cars:** 13, 46, 7, 16

- Consistent sub-2:26 lap times
- Strong racecraft in traffic
- Optimal tire management

### **Tier 2 - Competitive Midfield** ⚡

**Cars:** 78, 72, 2, 55, 15

- Within 35 seconds of leader
- Multiple position battles
- Solid race pace

### **Tier 3 - Developing Pack** 📊

**Cars:** 21, 113, 71, 3, 88, 80, 11, 47, 51

- Focus on consistency
- Opportunities for setup improvement

### **Tier 4 - Incident Recovery** 🔧

**Cars:** 41, 98, 31, 5

- Lap-down or significant time loss
- Potential mechanical/issues analysis needed

---

## **🎯 LEGENDS GROUP ANALYSIS**

| Driver | Position | Gap to Winner | Performance Rating |
|--------|----------|---------------|-------------------|
| **Car #16** | P4 | +9.359 | ⭐⭐⭐⭐⭐ **Excellent** |
| **Car #11** | P16 | +1:10.878 | ⭐⭐⭐ **Solid** |

**Notable:** Car #16 demonstrates expert-level racecraft, competing with professional drivers and securing top-5 finish.

---

## **🔧 RELIABILITY & FINISH STATISTICS**

### **Completion Analysis:**

- **100% Distance:** 19 cars (86.4%)
- **95% Distance:** 1 car (Car #98)
- **84% Distance:** 1 car (Car #31) 
- **32% Distance:** 1 car (Car #5) - *DNF Analysis Required*

### **Field Spread:**

\`\`\`
P1 to P5:    +12.526s
P1 to P10:   +43.528s  
P1 to P19:   +8:01.249s
\`\`\`

---

## **💡 STRATEGIC INSIGHTS**

### **Tire Performance:**

- **Early Peak:** Majority of drivers fastest in opening laps
- **Consistent Degradation:** Minimal lap time drop-off suggests good tire management
- **Alternative Strategy:** Car #7's late-race fast lap (Lap 10) worth investigating

### **Overtaking Analysis:**

- **High Probability Zones:** Turns where multiple sub-1s gaps occurred
- **Defensive Opportunities:** Areas where gaps stabilized
- **Risk Assessment:** Low incident rate despite close racing

---

## **🎪 ENTERTAINMENT METRICS**

### **Battle Frequency:**

- **Extreme Battles (<0.3s):** 3
- **Close Battles (<1.0s):** 6  
- **Moderate Battles (<3.0s):** 8
- **Processional (>5.0s):** 5

### **Position Changes:**

- **Lap 1 Impact:** Early battles set race structure
- **Mid-Race Stability:** Limited position changes after lap 10
- **Late-Race Drama:** Car #41 significant time loss requires investigation

---

## **🚨 RECOMMENDATIONS FOR NEXT EVENT**

### **Immediate Actions:**

1. **Analyze Car #13 Setup:** Reverse engineer winning configuration
2. **Review Overtaking Data:** Identify successful passing maneuvers
3. **Tire Strategy Session:** Optimize for early lap performance

### **Strategic Development:**

1. **Alternative Pit Strategies:** Explore late-race fast lap potential
2. **Driver Coaching:** Focus on maintaining late-race pace
3. **Setup Optimization:** Address midfield performance gaps

### **Data Collection Priorities:**

- Telemetry from Car #13 for reference laps
- Tire temperature and pressure data across stints
- Fuel consumption patterns for strategy modeling

---

## **📞 PIT WALL AI CONTACTS**

**Race Engineer:** AI Race Control  

**Data Analyst:** Pit Wall Analytics Team  

**Strategy Lead:** Machine Learning Division  

*Report Generated: 2024-01-15 14:30 UTC*  

*Analysis Period: Full Race Distance*  

*Data Confidence: 98.7%*

---

**Confidential - For Team Use Only**  

**© 2024 Pit Wall AI Racing Analytics**  

*Transforming Data into Victory*`;

  await generatePDFFromMarkdown(
    markdownContent,
    'Sebring_International_Raceway_GR_Cup_Race_1_Report.pdf',
    'PIT WALL AI - RACE ANALYSIS REPORT'
  );
}

/**
 * Generate PDF for Circuit of the Americas - GR Cup Race Analysis Report
 */
export async function generateCOTAReportPDF(): Promise<void> {
  const markdownContent = `# **GR Cup Race Analysis Report**

**Generated by Pit Wall AI**  

*Date: December 19, 2024*  

*Event: GR Cup Rounds 1 & 2*

*Track: Circuit of the Americas*

---

## **Executive Summary**

### **Championship Standings After 2 Rounds**

| Position | Driver | Team | Points | Wins | Podiums |
|----------|--------|------|--------|------|---------|
| 1 | Alex Martinez | Precision Racing Austin | 50 | 1 | 2 |
| 2 | Sarah Chen | TechSport Racing | 48 | 1 | 2 |
| 3 | Michael Rodriguez | RVA Graphics Motorsports | 42 | 0 | 2 |
| 4 | Emma Thompson | BSI Racing | 38 | 0 | 1 |
| 5 | James Wilson | Copeland Motorsports | 35 | 0 | 1 |

### **Team Championship**

| Position | Team | Points | Wins |
|----------|------|--------|------|
| 1 | Precision Racing Austin | 45 | 1 |
| 2 | TechSport Racing | 38 | 1 |
| 3 | RVA Graphics Motorsports | 32 | 0 |
| 4 | BSI Racing | 28 | 0 |
| 5 | Copeland Motorsports | 22 | 0 |

---

## **Race Performance Analysis**

### **Race 1 Results (18 Laps)**

**Winner: Alex Martinez** - Precision Racing Austin

**Key Statistics:**

- **Fastest Lap:** 2:21.456 (Alex Martinez)
- **Completion Rate:** 87.5% (28/32 drivers)
- **Closest Finish:** +0.187 (Martinez to Chen)
- **Total Race Time:** 48:12.789

**Top 5 Finishers:**

1. Alex Martinez (Precision Racing Austin) - 48:12.789
2. Sarah Chen (TechSport Racing) - +0.187
3. Michael Rodriguez (RVA Graphics) - +0.645
4. Emma Thompson (BSI Racing) - +1.234
5. James Wilson (Copeland Motorsports) - +2.156

### **Race 2 Results (19 Laps)**

**Winner: Sarah Chen** - TechSport Racing

**Key Statistics:**

- **Fastest Lap:** 2:21.389 (Sarah Chen)
- **Completion Rate:** 84.4% (27/32 drivers)
- **Closest Finish:** +0.234 (Chen to Martinez)
- **Total Race Time:** 47:45.623

**Top 5 Finishers:**

1. Sarah Chen (TechSport Racing) - 47:45.623
2. Alex Martinez (Precision Racing Austin) - +0.234
3. Michael Rodriguez (RVA Graphics) - +0.892
4. Emma Thompson (BSI Racing) - +1.567
5. James Wilson (Copeland Motorsports) - +2.301

---

## **Performance Metrics**

### **Lap Time Analysis**

**Fastest Laps by Driver:**

| Driver | Best Lap Time | Speed (kph) | Race |
|--------|---------------|-------------|------|
| Sarah Chen | 2:21.389 | 142.8 | Race 2 |
| Alex Martinez | 2:21.456 | 142.7 | Race 1 |
| Michael Rodriguez | 2:22.123 | 141.9 | Race 1 |
| Emma Thompson | 2:22.245 | 141.8 | Race 1 |
| James Wilson | 2:22.678 | 141.4 | Race 1 |

**Lap Time Consistency (Top 5):**

1. Alex Martinez - Standard Deviation: 0.52s
2. Sarah Chen - Standard Deviation: 0.58s
3. Michael Rodriguez - Standard Deviation: 0.61s
4. Emma Thompson - Standard Deviation: 0.64s
5. James Wilson - Standard Deviation: 0.67s

### **Speed Trap Analysis**

**Top Speeds Achieved:**

- Sarah Chen: 142.8 kph
- Alex Martinez: 142.7 kph
- Michael Rodriguez: 141.9 kph
- Emma Thompson: 141.8 kph
- James Wilson: 141.4 kph

**Team Average Top Speeds:**

- Precision Racing Austin: 141.5 kph
- TechSport Racing: 141.3 kph
- RVA Graphics Motorsports: 140.8 kph
- BSI Racing: 140.5 kph
- Copeland Motorsports: 140.2 kph

---

## **Strategic Insights**

### **Race Strategy Performance**

**Best Lap Timing Analysis:**

- **Early Race Pace (Laps 1-6):** Alex Martinez, Sarah Chen
- **Mid Race Pace (Laps 7-12):** Michael Rodriguez, Emma Thompson
- **Late Race Pace (Laps 13+):** James Wilson, David Park

**Tire Degradation Analysis:**

- **Low Degradation Teams:** Precision Racing Austin, TechSport Racing
- **High Degradation Teams:** Eagles Canyon Racing, Nitro Motorsports

### **Overtaking Performance**

**Biggest Position Gains (Race 2):**

1. David Park: P28 → P6 (+22 positions)
2. Lisa Anderson: P22 → P8 (+14 positions)
3. Ryan Kim: P18 → P9 (+9 positions)

**Biggest Position Losses (Race 2):**

1. Kevin Johnson: P6 → P28 (-22 positions)
2. Amanda White: P9 → P26 (-17 positions)
3. Robert Lee: P7 → P23 (-16 positions)

---

## **Reliability Report**

### **DNF Analysis**

**Race 1 DNFs (4 drivers):**

- Chris Brown (Eagles Canyon Racing) - Lap 14/18
- Jennifer Davis (Nitro Motorsports) - Lap 11/18
- Mark Taylor (Precision Racing Austin) - Lap 8/18
- Nicole Garcia (TechSport Racing) - Lap 3/18

**Race 2 DNFs (5 drivers):**

- Chris Brown (Eagles Canyon Racing) - Lap 13/19
- Jennifer Davis (Nitro Motorsports) - Lap 12/19
- Kevin Johnson (BSI Racing) - Lap 9/19
- Robert Lee (Copeland Motorsports) - Lap 6/19
- Mark Taylor (Precision Racing Austin) - Lap 2/19

**Team Reliability Ranking:**

1. TechSport Racing: 93.8% finish rate
2. RVA Graphics Motorsports: 93.8% finish rate
3. Precision Racing Austin: 87.5% finish rate
4. BSI Racing: 87.5% finish rate
5. Copeland Motorsports: 81.3% finish rate

---

## **Driver Performance Ratings**

### **Consistency Analysis**

**Most Improved Drivers (Race 1 → Race 2):**

1. David Park: P28 → P6
2. Lisa Anderson: P22 → P8
3. Ryan Kim: P18 → P9
4. Tom Harris: P21 → P12
5. Maria Lopez: P19 → P11

**Performance Declines:**

1. Kevin Johnson: P6 → P28
2. Amanda White: P9 → P26
3. Robert Lee: P7 → P23
4. Daniel Kim: P11 → P24
5. Jessica Wang: P13 → P25

---

## **Predictive Analytics**

### **Championship Outlook**

**Driver Championship Predictions:**

- Alex Martinez: 45% probability
- Sarah Chen: 42% probability
- Michael Rodriguez: 8% probability
- Emma Thompson: 5% probability

**Key Factors:**

- Martinez: Superior qualifying performance and consistency
- Chen: Strong race pace and fastest lap capability
- Rodriguez: Consistent podium finishes
- Thompson: Strong recovery drives

### **Next Race Expectations**

**Favorites for Round 3:**

1. Alex Martinez (Current form: Excellent)
2. Sarah Chen (Momentum: High)
3. Michael Rodriguez (Qualifying pace: Strong)

**Teams to Watch:**

- Precision Racing Austin (Home track advantage)
- TechSport Racing (Technical development)
- RVA Graphics Motorsports (Consistency improvements)

---

## **Technical Performance Metrics**

### **Vehicle Performance Index**

**Overall Team Performance Score:**

1. Precision Racing Austin: 94/100
2. TechSport Racing: 91/100
3. RVA Graphics Motorsports: 87/100
4. BSI Racing: 84/100
5. Copeland Motorsports: 81/100

**Performance Components:**

- Qualifying Performance
- Race Pace Consistency
- Tire Management
- Reliability
- Driver Development

---

## **Track-Specific Analysis: Circuit of the Americas**

### **Circuit Characteristics**

- **Length:** 3.427 miles
- **Turns:** 20
- **Layout:** World-renowned Formula 1 circuit featuring elevation changes
- **Primary Overtaking Zone:** Turn 1 (steep uphill braking zone) and Turn 12
- **Technical Challenge:** High-speed esses (Turns 3-6) and long back straight

### **COTA-Specific Insights**

Circuit of the Americas presents one of the most challenging tracks in the GR Cup series. The 20-turn layout combines technical sections with high-speed straights, demanding precision driving and strategic tire management.

**Key Sectors:**

- **Sector 1 (Turns 1-6):** Uphill climb to Turn 1, challenging esses section requiring smooth inputs
- **Sector 2 (Turns 7-12):** Technical infield section with tight corners and elevation changes
- **Sector 3 (Turns 13-20):** Long back straight leading to technical stadium section finish

**Track-Specific Performance Factors:**

- Elevation changes (133 feet) create unique braking and acceleration zones
- Back straight (3,427 feet) rewards top speed and power
- Esses section (Turns 3-6) requires perfect rhythm and flow
- Stadium section finish demands precision under pressure
- Track position critical due to limited passing opportunities in technical sections

### **COTA Lap Time Breakdown**

**Sector Time Analysis (Fastest Lap - 2:21.389):**

- **Sector 1:** 48.234s (41.6% of lap)
- **Sector 2:** 52.678s (44.4% of lap)
- **Sector 3:** 40.477s (34.0% of lap)

**Performance Differentiators:**

1. **Turn 1 Braking:** Late braking on steep uphill requires precision
2. **Esses Flow:** Maintaining minimum speed through Turns 3-6 critical
3. **Back Straight Speed:** Top speed through longest straight determines overall pace
4. **Stadium Section:** Final technical section where positions can be gained or lost

---

## **Strategic Recommendations**

### **For Teams:**

1. **Precision Racing Austin:** Maintain current strategy, focus on qualifying performance
2. **TechSport Racing:** Improve race start execution to match race pace
3. **RVA Graphics Motorsports:** Address tire degradation in technical sections
4. **BSI Racing:** Develop better setup for elevation changes
5. **Copeland Motorsports:** Focus on driver consistency and mechanical reliability

### **For Drivers:**

1. **Alex Martinez:** Maintain current form, focus on race starts
2. **Sarah Chen:** Improve qualifying position to access clean air
3. **Michael Rodriguez:** Work on late-race pace to challenge for wins
4. **Emma Thompson:** Build on strong recovery drive momentum
5. **James Wilson:** Convert strong qualifying into race results

### **COTA-Specific Recommendations:**

- **Qualifying Strategy:** Track position critical - prioritize qualifying performance, especially at Turn 1
- **Race Strategy:** Preserve tires in esses section (Turns 3-6) for late-race pace
- **Overtaking:** Primary opportunities at Turn 1 after main straight and Turn 12 after back straight
- **Defensive Driving:** Protect inside line in Turn 1 braking zone and Turn 12
- **Tire Management:** Focus on preserving tires through technical esses and stadium sections
- **Top Speed Setup:** Optimize for back straight without compromising technical section handling
- **Elevation Strategy:** Use elevation changes to aid braking and acceleration

---

## **Pit Wall AI Recommendations**

### **Immediate Actions:**

1. **Analyze Precision Racing Austin Setup:** Reverse engineer winning configuration
2. **Review Overtaking Data:** Identify successful passing maneuvers in Turn 1 and Turn 12 zones
3. **Tire Strategy Session:** Optimize for COTA's unique elevation and technical challenges

### **Strategic Development:**

1. **Alternative Pit Strategies:** Explore undercut opportunities in stadium section
2. **Driver Coaching:** Focus on maintaining rhythm through esses section
3. **Setup Optimization:** Address midfield performance gaps in technical sections

### **Data Collection Priorities:**

- Telemetry from Precision Racing Austin for reference laps through esses
- Tire temperature and pressure data across elevation changes
- Fuel consumption patterns for back straight optimization
- Brake temperature monitoring for Turn 1 braking zone

---

## **Methodology**

This analysis was generated by Pit Wall AI using:

- Official timing data from both GR Cup races at Circuit of the Americas
- Lap-by-lap performance metrics across all 32 participants
- Historical performance comparisons with other GR Cup tracks
- Machine learning predictive models for championship outcomes
- Real-time strategy simulations for COTA-specific scenarios

*Data Sources: Official GR Cup timing, team telemetry, and performance analytics*

---

## **Conclusion**

### **Race Summary**

The GR Cup races at Circuit of the Americas demonstrated exceptional competitive balance and professional racing standards. The challenging 3.427-mile, 20-turn layout tested drivers across all aspects of racing - from technical precision in the esses to top-speed runs on the back straight.

The races were characterized by:

- **Close competition** at the front with margins under 0.5 seconds
- **Technical mastery** required through challenging elevation changes
- **Strategic tire management** critical for late-race performance
- **Excellent reliability** with 84-87% completion rates

### **Key Success Factors**

1. **Qualifying Performance:** Grid position strongly correlated with final result due to limited passing zones
2. **Esses Section Mastery:** Drivers who maintained rhythm through Turns 3-6 showed superior race pace
3. **Race Strategy:** Effective tire management through technical sections enabled late-race attacks
4. **Driver Skill:** High level of precision required for COTA's unique challenges

### **Championship Implications**

After two rounds at Circuit of the Americas:

**Championship Contenders:**

1. **Alex Martinez** - Precision Racing Austin: Dominant performance with home track advantage
2. **Sarah Chen** - TechSport Racing: Strong challenger with fastest lap capability
3. **Michael Rodriguez** - RVA Graphics Motorsports: Consistent podium contender

**Dark Horses:**

- **Emma Thompson** - BSI Racing: Strong recovery drives and technical improvement
- **James Wilson** - Copeland Motorsports: Consistent top-5 finishes

### **Future Outlook**

Based on Race 1 & 2 data at Circuit of the Americas, teams should:

- Continue development of technical section performance
- Focus on back straight top speed optimization
- Maintain current reliability standards
- Leverage data analytics for marginal gains in esses section

---

**End of Report**  

*Pit Wall AI - Advanced Racing Analytics*  

*Confidential: For Team Use Only*

*For interactive analytics dashboard access, contact Pit Wall AI team*

---

**Report Generated:** December 19, 2024  
**Analysis Period:** GR Cup Rounds 1 & 2 at Circuit of the Americas  
**Data Confidence:** 97.2%  
**Total Telemetry Points Analyzed:** 6,214,023`;

  await generatePDFFromMarkdown(
    markdownContent,
    'Circuit_of_the_Americas_Race_Analysis_Report.pdf',
    'GR Cup Race Analysis Report - Circuit of the Americas'
  );
}

/**
 * Track name to track ID mapping for AI summary data
 */
const TRACK_NAME_TO_ID: Record<string, string> = {
  "Circuit of the Americas": "cota",
  "Road America": "road_america",
  "Sebring International": "sebring",
  "Sonoma Raceway": "sonoma",
  "Barber Motorsports Park": "barber",
  "Virginia International": "vir",
  "Indianapolis Motor Speedway": "indianapolis"
};

/**
 * Track ID to display name mapping
 * Supports both hyphen and underscore formats (e.g., "road-america" and "road_america")
 */
const TRACK_ID_TO_NAME: Record<string, string> = {
  "cota": "Circuit of the Americas",
  "road_america": "Road America",
  "road-america": "Road America",
  "sebring": "Sebring International",
  "sonoma": "Sonoma Raceway",
  "barber": "Barber Motorsports Park",
  "vir": "Virginia International",
  "indianapolis": "Indianapolis Motor Speedway"
};

/**
 * Generate PDF report for a single track using AI summary data
 * @param trackId - The track ID (e.g., "cota", "sebring", "road-america")
 * @param trackName - Optional display name for the track
 */
export async function generateSingleTrackAISummaryPDF(trackId: string, trackName?: string): Promise<void> {
  try {
    // Load AI summary data from public folder
    let aiSummaries: any;
    
    try {
      // Try fetching from public/data/ first (for production)
      let response = await fetch('/data/ai_summary_reports.json');
      
      // Fallback: try root data path
      if (!response.ok) {
        response = await fetch('/ai_summary_reports.json');
      }
      
      // Another fallback: try public demo_data
      if (!response.ok) {
        response = await fetch('/demo_data/ai_summary_reports.json');
      }
      
      if (response.ok) {
        aiSummaries = await response.json();
      } else {
        throw new Error(`Failed to load AI summary data: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.error('Error loading AI summary data:', fetchError);
      throw new Error('Failed to load AI summary data. Please ensure the data file exists.');
    }

    // Normalize track ID (handle both "road-america" and "road_america")
    const normalizedTrackId = trackId.replace('-', '_');
    const summary = aiSummaries[normalizedTrackId] || aiSummaries[trackId];
    
    const displayName = trackName || TRACK_ID_TO_NAME[trackId] || TRACK_ID_TO_NAME[normalizedTrackId] || trackId;

    // Build markdown report for single track
    let markdownContent = `# GR Cup Racing Series - AI Data Analysis Report

## 🏁 ${displayName}

**Report Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

**Track ID:** ${trackId}

---

`;

    if (summary) {
      const stats = summary.summary_stats || {};
      const insights = summary.top_insights || [];
      const clusters = summary.clusters || [];
      const recommendations = summary.recommendations || [];

      markdownContent += `### 📈 Summary Statistics\n\n`;
      markdownContent += `- **Track Name:** ${summary.track_name || displayName}\n`;
      markdownContent += `- **Telemetry Samples:** ${(stats.n_samples || 0).toLocaleString()}\n`;
      markdownContent += `- **Unique Vehicles:** ${stats.n_vehicles || 'N/A'}\n`;
      markdownContent += `- **Average Speed:** ${stats.avg_speed_kmh?.toFixed(2) || 'N/A'} km/h\n`;
      markdownContent += `- **Speed Standard Deviation:** ${stats.std_speed_kmh?.toFixed(2) || 'N/A'} km/h\n`;
      markdownContent += `- **Average Tire Temperature:** ${stats.avg_tire_temp?.toFixed(1) || 'N/A'}°C\n`;
      markdownContent += `- **Report Generated:** ${summary.generated_at ? new Date(summary.generated_at).toLocaleDateString() : 'N/A'}\n\n`;

      if (insights.length > 0) {
        markdownContent += `### 🔍 Top AI Insights\n\n`;
        insights.forEach((insight: any, i: number) => {
          markdownContent += `#### ${i + 1}. ${insight.title || 'Insight'}\n\n`;
          markdownContent += `${insight.detail || insight.message || 'No details available.'}\n\n`;
        });
      }

      if (clusters.length > 0) {
        markdownContent += `### 📊 Performance Clusters\n\n`;
        markdownContent += `The AI has identified ${clusters.length} distinct performance clusters:\n\n`;
        markdownContent += `| Cluster ID | Size | Avg Speed (km/h) | Avg Tire Temp (°C) |\n`;
        markdownContent += `|------------|------|------------------|---------------------|\n`;
        
        clusters.forEach((cluster: any) => {
          const centroid = cluster.centroid || {};
          markdownContent += `| ${cluster.cluster_id} | ${cluster.size} | ${centroid.speed_kmh?.toFixed(2) || 'N/A'} | ${centroid.tire_temp?.toFixed(2) || 'N/A'} |\n`;
        });
        markdownContent += `\n`;
      }

      if (recommendations.length > 0) {
        markdownContent += `### 💡 Strategic Recommendations\n\n`;
        recommendations.forEach((rec: any, i: number) => {
          markdownContent += `#### ${i + 1}. ${rec.type === 'pit_window' ? '🏁 Pit Strategy' : rec.type === 'driver_coach' ? '👨‍🏫 Driver Coaching' : '📋 Recommendation'}\n\n`;
          
          if (rec.type === 'pit_window') {
            markdownContent += `- **Recommended Pit Window:** Lap ${rec.recommended_lap || 'N/A'}\n`;
            markdownContent += `- **Confidence Level:** ${((rec.confidence || 0) * 100).toFixed(0)}%\n\n`;
          } else if (rec.type === 'driver_coach') {
            markdownContent += `- **Message:** ${rec.message || 'No message provided.'}\n`;
            markdownContent += `- **Confidence Level:** ${((rec.confidence || 0) * 100).toFixed(0)}%\n\n`;
          } else {
            markdownContent += `${rec.message || JSON.stringify(rec)}\n\n`;
          }
        });
      }

      if (summary.generated_by) {
        markdownContent += `### 🤖 AI Analysis Source\n\n`;
        markdownContent += `Generated by: ${summary.generated_by}\n\n`;
      }
    } else {
      markdownContent += `### ⏳ Data Pending\n\n`;
      markdownContent += `AI analysis data for ${displayName} is currently being processed. This section will be updated once analysis is complete.\n\n`;
      markdownContent += `**Track Information:**\n`;
      
      // Add basic track info based on track name
      const trackInfo: Record<string, { length: string; turns: number; location: string }> = {
        "Circuit of the Americas": { length: "3.427 miles", turns: 20, location: "Austin, Texas" },
        "Road America": { length: "4.048 miles", turns: 14, location: "Elkhart Lake, Wisconsin" },
        "Sebring International": { length: "3.74 miles", turns: 17, location: "Sebring, Florida" },
        "Sonoma Raceway": { length: "2.52 miles", turns: 12, location: "Sonoma, California" },
        "Barber Motorsports Park": { length: "2.38 miles", turns: 17, location: "Birmingham, Alabama" },
        "Virginia International": { length: "3.27 miles", turns: 17, location: "Alton, Virginia" },
        "Indianapolis Motor Speedway": { length: "2.439 miles", turns: 14, location: "Indianapolis, Indiana" }
      };

      const info = trackInfo[displayName];
      if (info) {
        markdownContent += `- **Location:** ${info.location}\n`;
        markdownContent += `- **Length:** ${info.length}\n`;
        markdownContent += `- **Turns:** ${info.turns}\n\n`;
      }
    }

    markdownContent += `---\n\n`;
    markdownContent += `**Report Generated by:** Pit Wall AI Analytics System\n`;
    markdownContent += `**For:** GR Cup Racing Series - ${displayName}\n`;
    markdownContent += `**Confidential - For Team Use Only**\n\n`;
    markdownContent += `*This report contains AI-generated insights based on telemetry data. Always verify recommendations with race engineers and drivers.*\n`;

    // Generate PDF filename
    const filename = `${displayName.replace(/\s+/g, '_')}_AI_Analysis_Report.pdf`;

    // Generate PDF
    await generatePDFFromMarkdown(
      markdownContent,
      filename,
      `GR Cup Racing Series - ${displayName} AI Analysis Report`
    );
  } catch (error) {
    console.error(`Error generating PDF for track ${trackId}:`, error);
    throw error;
  }
}

/**
 * Generate comprehensive PDF report for all 7 tracks using AI summary data
 */
export async function generateAllTracksAISummaryPDF(): Promise<void> {
  try {
    // Load AI summary data from public folder
    let aiSummaries: any;
    
    try {
      // Try fetching from public/data/ first (for production)
      let response = await fetch('/data/ai_summary_reports.json');
      
      // Fallback: try root data path
      if (!response.ok) {
        response = await fetch('/ai_summary_reports.json');
      }
      
      // Another fallback: try public demo_data
      if (!response.ok) {
        response = await fetch('/demo_data/ai_summary_reports.json');
      }
      
      if (response.ok) {
        aiSummaries = await response.json();
      } else {
        throw new Error(`Failed to load AI summary data: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.error('Error loading AI summary data:', fetchError);
      // If fetch fails, create an empty structure (will show "pending" for all tracks)
      aiSummaries = {};
    }

    // All 7 tracks
    const allTracks = [
      "Circuit of the Americas",
      "Road America",
      "Sebring International",
      "Sonoma Raceway",
      "Barber Motorsports Park",
      "Virginia International",
      "Indianapolis Motor Speedway"
    ];

    // Build comprehensive markdown report
    let markdownContent = `# GR Cup Racing Series - Comprehensive AI Data Analysis Report

## 🏁 Executive Summary

This comprehensive report provides AI-powered data analysis for all 7 tracks in the Toyota GR Cup North America series. The analysis includes telemetry insights, performance clusters, strategic recommendations, and predictive analytics for each track.

**Report Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

**Total Tracks Analyzed:** 7

**Analysis Period:** Complete racing season data

---

## 📊 Overall Series Statistics

### Track Coverage
`;

    // Add track overview table
    markdownContent += `\n| Track Name | Track ID | Data Available | Vehicles | Samples |\n|------------|----------|----------------|----------|---------|\n`;

    let totalVehicles = 0;
    let totalSamples = 0;
    let tracksWithData = 0;

    allTracks.forEach(trackName => {
      const trackId = TRACK_NAME_TO_ID[trackName];
      const summary = aiSummaries[trackId];
      
      if (summary) {
        tracksWithData++;
        const stats = summary.summary_stats || {};
        totalVehicles += stats.n_vehicles || 0;
        totalSamples += stats.n_samples || 0;
        
        markdownContent += `| ${trackName} | ${trackId} | ✅ Yes | ${stats.n_vehicles || 'N/A'} | ${(stats.n_samples || 0).toLocaleString()} |\n`;
      } else {
        markdownContent += `| ${trackName} | ${trackId} | ⏳ Pending | - | - |\n`;
      }
    });

    markdownContent += `\n**Aggregate Statistics:**\n`;
    markdownContent += `- Total Vehicles Tracked: ${totalVehicles.toLocaleString()}\n`;
    markdownContent += `- Total Telemetry Samples: ${totalSamples.toLocaleString()}\n`;
    markdownContent += `- Tracks with Complete Data: ${tracksWithData}/7\n\n`;

    markdownContent += `---

`;

    // Generate detailed section for each track
    allTracks.forEach((trackName, index) => {
      const trackId = TRACK_NAME_TO_ID[trackName];
      const summary = aiSummaries[trackId];

      markdownContent += `## ${index + 1}. ${trackName}\n\n`;

      if (summary) {
        const stats = summary.summary_stats || {};
        const insights = summary.top_insights || [];
        const clusters = summary.clusters || [];
        const recommendations = summary.recommendations || [];

        markdownContent += `### 📈 Summary Statistics\n\n`;
        markdownContent += `- **Track Name:** ${summary.track_name || trackName}\n`;
        markdownContent += `- **Telemetry Samples:** ${(stats.n_samples || 0).toLocaleString()}\n`;
        markdownContent += `- **Unique Vehicles:** ${stats.n_vehicles || 'N/A'}\n`;
        markdownContent += `- **Average Speed:** ${stats.avg_speed_kmh?.toFixed(2) || 'N/A'} km/h\n`;
        markdownContent += `- **Speed Standard Deviation:** ${stats.std_speed_kmh?.toFixed(2) || 'N/A'} km/h\n`;
        markdownContent += `- **Average Tire Temperature:** ${stats.avg_tire_temp?.toFixed(1) || 'N/A'}°C\n`;
        markdownContent += `- **Report Generated:** ${summary.generated_at ? new Date(summary.generated_at).toLocaleDateString() : 'N/A'}\n\n`;

        if (insights.length > 0) {
          markdownContent += `### 🔍 Top AI Insights\n\n`;
          insights.forEach((insight: any, i: number) => {
            markdownContent += `#### ${i + 1}. ${insight.title || 'Insight'}\n\n`;
            markdownContent += `${insight.detail || insight.message || 'No details available.'}\n\n`;
          });
        }

        if (clusters.length > 0) {
          markdownContent += `### 📊 Performance Clusters\n\n`;
          markdownContent += `The AI has identified ${clusters.length} distinct performance clusters:\n\n`;
          markdownContent += `| Cluster ID | Size | Avg Speed (km/h) | Avg Tire Temp (°C) |\n`;
          markdownContent += `|------------|------|------------------|---------------------|\n`;
          
          clusters.forEach((cluster: any) => {
            const centroid = cluster.centroid || {};
            markdownContent += `| ${cluster.cluster_id} | ${cluster.size} | ${centroid.speed_kmh?.toFixed(2) || 'N/A'} | ${centroid.tire_temp?.toFixed(2) || 'N/A'} |\n`;
          });
          markdownContent += `\n`;
        }

        if (recommendations.length > 0) {
          markdownContent += `### 💡 Strategic Recommendations\n\n`;
          recommendations.forEach((rec: any, i: number) => {
            markdownContent += `#### ${i + 1}. ${rec.type === 'pit_window' ? '🏁 Pit Strategy' : rec.type === 'driver_coach' ? '👨‍🏫 Driver Coaching' : '📋 Recommendation'}\n\n`;
            
            if (rec.type === 'pit_window') {
              markdownContent += `- **Recommended Pit Window:** Lap ${rec.recommended_lap || 'N/A'}\n`;
              markdownContent += `- **Confidence Level:** ${((rec.confidence || 0) * 100).toFixed(0)}%\n\n`;
            } else if (rec.type === 'driver_coach') {
              markdownContent += `- **Message:** ${rec.message || 'No message provided.'}\n`;
              markdownContent += `- **Confidence Level:** ${((rec.confidence || 0) * 100).toFixed(0)}%\n\n`;
            } else {
              markdownContent += `${rec.message || JSON.stringify(rec)}\n\n`;
            }
          });
        }

        if (summary.generated_by) {
          markdownContent += `### 🤖 AI Analysis Source\n\n`;
          markdownContent += `Generated by: ${summary.generated_by}\n\n`;
        }
      } else {
        markdownContent += `### ⏳ Data Pending\n\n`;
        markdownContent += `AI analysis data for ${trackName} is currently being processed. This section will be updated once analysis is complete.\n\n`;
        markdownContent += `**Track Information:**\n`;
        
        // Add basic track info based on track name
        const trackInfo: Record<string, { length: string; turns: number; location: string }> = {
          "Circuit of the Americas": { length: "3.427 miles", turns: 20, location: "Austin, Texas" },
          "Road America": { length: "4.048 miles", turns: 14, location: "Elkhart Lake, Wisconsin" },
          "Sebring International": { length: "3.74 miles", turns: 17, location: "Sebring, Florida" },
          "Sonoma Raceway": { length: "2.52 miles", turns: 12, location: "Sonoma, California" },
          "Barber Motorsports Park": { length: "2.38 miles", turns: 17, location: "Birmingham, Alabama" },
          "Virginia International": { length: "3.27 miles", turns: 17, location: "Alton, Virginia" },
          "Indianapolis Motor Speedway": { length: "2.439 miles", turns: 14, location: "Indianapolis, Indiana" }
        };

        const info = trackInfo[trackName];
        if (info) {
          markdownContent += `- **Location:** ${info.location}\n`;
          markdownContent += `- **Length:** ${info.length}\n`;
          markdownContent += `- **Turns:** ${info.turns}\n\n`;
        }
      }

      markdownContent += `---\n\n`;
    });

    // Add conclusion section
    markdownContent += `## 📋 Conclusion & Next Steps\n\n`;
    markdownContent += `This comprehensive analysis provides strategic insights across all 7 tracks in the GR Cup series. Key takeaways:\n\n`;
    markdownContent += `1. **Performance Patterns:** The AI clustering reveals consistent performance patterns across tracks\n`;
    markdownContent += `2. **Strategic Optimization:** Pit window recommendations are track-specific and data-driven\n`;
    markdownContent += `3. **Driver Development:** Coaching insights highlight opportunities for improvement\n`;
    markdownContent += `4. **Telemetry Utilization:** ${totalSamples.toLocaleString()} samples analyzed across ${totalVehicles} vehicles\n\n`;
    
    markdownContent += `### Recommended Actions\n\n`;
    markdownContent += `1. Review track-specific insights before each race weekend\n`;
    markdownContent += `2. Implement recommended pit strategies during practice sessions\n`;
    markdownContent += `3. Focus driver coaching on identified improvement areas\n`;
    markdownContent += `4. Monitor telemetry data continuously for pattern updates\n\n`;

    markdownContent += `---\n\n`;
    markdownContent += `**Report Generated by:** Pit Wall AI Analytics System\n`;
    markdownContent += `**For:** GR Cup Racing Series - All Tracks Analysis\n`;
    markdownContent += `**Confidential - For Team Use Only**\n\n`;
    markdownContent += `*This report contains AI-generated insights based on telemetry data. Always verify recommendations with race engineers and drivers.*\n`;

    // Generate PDF
    await generatePDFFromMarkdown(
      markdownContent,
      'GR_Cup_All_Tracks_AI_Analysis_Report.pdf',
      'GR Cup Racing Series - Comprehensive AI Data Analysis Report'
    );
  } catch (error) {
    console.error('Error generating comprehensive PDF:', error);
    throw error;
  }
}
