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
