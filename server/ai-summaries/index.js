/*
  Minimal Express server to:
   - list summary JSON files in REPORTS_DIR
   - serve HTML preview
   - return generated PDF per track using Puppeteer
*/

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fssync = require('fs');
const cors = require('cors');
const MarkdownIt = require('markdown-it');
const pdfParse = require('pdf-parse');
const puppeteer = require('puppeteer');

const APP_ROOT = path.resolve(__dirname, "../..");
// Check for reports in multiple locations: env var, reports/, or ai_summary_reports/
const REPORTS_DIR = process.env.REPORTS_DIR || 
  (fssync.existsSync(path.join(APP_ROOT, 'reports')) 
    ? path.join(APP_ROOT, 'reports')
    : path.join(APP_ROOT, 'ai_summary_reports'));
const PORT = process.env.PORT || 8001;
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const app = express();
app.use(cors());
app.use(express.json());

// Extract track ID from filename
// Handles patterns like: indianapolis_race_analysis.md -> indianapolis
// or barber_motorsports_race_analysis.md -> barber
function extractTrackId(filename) {
  const basename = path.basename(filename, path.extname(filename)).toLowerCase();
  // Known track IDs
  const trackIds = ['sebring', 'road_america', 'cota', 'sonoma', 'vir', 'barber', 'indianapolis'];
  
  // Try to find a track ID at the start of the filename
  for (const trackId of trackIds) {
    if (basename.startsWith(trackId + '_') || basename === trackId) {
      return trackId;
    }
  }
  
  // Fallback: use the original logic but try to extract first word
  // For filenames like "indianapolis_race_analysis", extract "indianapolis"
  const parts = basename.split('_');
  if (parts.length > 0) {
    const firstPart = parts[0];
    // If first part matches a known track ID, use it
    if (trackIds.includes(firstPart)) {
      return firstPart;
    }
  }
  
  // Final fallback: return the full basename
  return basename.replace(/\s+/g, '_');
}

// list files
async function listReports() {
  try {
    const files = await fs.readdir(REPORTS_DIR);
    const out = [];
    for (const f of files) {
      const p = path.join(REPORTS_DIR, f);
      const stat = await fs.stat(p);
      if (!stat.isFile()) continue;
      const ext = path.extname(f).toLowerCase();
      const id = extractTrackId(f);
      out.push({ id, filename: f, ext, path: p });
    }
    return out;
  } catch (e) {
    console.error('listReports error', e);
    return [];
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

async function reportToHtml(entry) {
  const ext = entry.ext;
  const fp = entry.path;
  if (ext === '.md' || ext === '.markdown') {
    const txt = await fs.readFile(fp, 'utf8');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
      body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111}
      h1{font-size:22px} h2{font-size:18px} pre{background:#f6f6f6;padding:12px;border-radius:6px}
      .meta{color:#666;font-size:13px;margin-bottom:12px}
      .section{margin-bottom:18px}
      </style></head><body>${md.render(txt)}</body></html>`;
  } else if (ext === '.txt' || ext === '.json') {
    const txt = await fs.readFile(fp, 'utf8');
    // if JSON, pretty-print
    if (ext === '.json') {
      try { const j = JSON.parse(txt); return `<!doctype html><html><body><pre>${escapeHtml(JSON.stringify(j,null,2))}</pre></body></html>`; } catch(e){}
    }
    const html = txt.split(/\r?\n/).map(l=>`<p>${escapeHtml(l)}</p>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  } else if (ext === '.pdf') {
    // fallback: extract text
    const buf = await fs.readFile(fp);
    const data = await pdfParse(buf);
    const text = data.text || '';
    const html = text.split(/\r?\n/).map(l=>`<p>${escapeHtml(l)}</p>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  } else {
    const txt = await fs.readFile(fp,'utf8').catch(()=> '');
    return `<!doctype html><html><body><pre>${escapeHtml(txt)}</pre></body></html>`;
  }
}

// list route
app.get('/api/reports', async (req, res) => {
  const list = await listReports();
  res.json(list.map(l=>({ id: l.id, filename: l.filename, ext: l.ext })));
});

// Helper to find report by ID (supports both track ID and full filename ID)
function findReportById(list, id) {
  // First try exact match
  let entry = list.find(l => l.id === id);
  if (entry) return entry;
  
  // Try to find by filename (for backward compatibility)
  entry = list.find(l => {
    const basename = path.basename(l.filename, l.ext).toLowerCase().replace(/\s+/g, '_');
    return basename === id || basename.startsWith(id + '_') || id.startsWith(basename + '_');
  });
  return entry;
}

// raw file route for direct download/view
app.get('/api/reports/:id/raw', async (req,res)=>{
  const id = req.params.id;
  const list = await listReports();
  const entry = findReportById(list, id);
  if (!entry) return res.status(404).send('Not found');
  res.sendFile(entry.path);
});

// html preview
app.get('/api/reports/:id/html', async (req,res)=>{
  const id = req.params.id;
  const list = await listReports();
  const entry = findReportById(list, id);
  if (!entry) return res.status(404).send('Not found');
  const html = await reportToHtml(entry);
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.send(html);
});

// pdf generation on request
app.get('/api/reports/:id/pdf', async (req,res)=>{
  const id = req.params.id;
  const list = await listReports();
  const entry = findReportById(list, id);
  if (!entry) return res.status(404).json({error:'not found'});
  const html = await reportToHtml(entry);
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' }
    });
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${entry.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error('pdf error', e);
    res.status(500).json({ error: 'pdf generation failed', details: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Legacy endpoints for backward compatibility
app.get("/api/ai-summaries", async (req, res) => {
  const list = await listReports();
  res.json(list.map(l => ({ track_id: l.id, filename: l.filename, ext: l.ext })));
});

app.get("/api/ai-summaries/:track/raw", async (req, res) => {
  const { track } = req.params;
  const list = await listReports();
  const match = findReportById(list, track);
  if (!match) return res.status(404).json({ error: "not found" });
  res.sendFile(match.path);
});

app.get("/api/ai-summaries/:track/html", async (req, res) => {
  const { track } = req.params;
  const list = await listReports();
  const entry = findReportById(list, track);
  if (!entry) return res.status(404).send("Not found");
  const html = await reportToHtml(entry);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/api/ai-summaries/:track/pdf", async (req, res) => {
  const { track } = req.params;
  const list = await listReports();
  const entry = findReportById(list, track);
  if (!entry) return res.status(404).json({ error: "not found" });
  const html = await reportToHtml(entry);
  let browser;
  try {
    browser = await puppeteer.launch({ args: ["--no-sandbox","--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" }
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${entry.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error("PDF generation error:", e);
    res.status(500).json({ error: "pdf generation failed", details: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, ()=> console.log('AI Summaries server listening on', PORT, 'REPORTS_DIR=', REPORTS_DIR));
