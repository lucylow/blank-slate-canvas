// server/ai-summaries/index.js
// Lightweight Express server to list ai_summary_reports, convert text/markdown -> HTML and render PDF with Puppeteer

const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const fssync = require("fs");
const cors = require("cors");
const MarkdownIt = require("markdown-it");
const pdfParse = require("pdf-parse"); // used to extract text from PDF if needed
const puppeteer = require("puppeteer");

const APP_ROOT = path.resolve(__dirname, "../..");
const REPORTS_DIR = path.join(APP_ROOT, "ai_summary_reports"); // repo path
const PORT = process.env.PORT || 8001;

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

const app = express();
app.use(cors());
app.use(express.json());

// Helper: detect files and map to "tracks"
async function listReports() {
  try {
    const files = await fs.readdir(REPORTS_DIR);
    const entries = [];
    for (const f of files) {
      const fp = path.join(REPORTS_DIR, f);
      const stat = await fs.stat(fp);
      if (!stat.isFile()) continue;
      const ext = path.extname(f).toLowerCase();
      // derive a track_id from filename (strip extension)
      const track_id = path.basename(f, ext).replace(/\s+/g, "_").toLowerCase();
      entries.push({ filename: f, ext, path: fp, track_id });
    }
    return entries;
  } catch (e) {
    console.error("listReports error:", e);
    return [];
  }
}

// GET /api/ai-summaries -> list
app.get("/api/ai-summaries", async (req, res) => {
  const list = await listReports();
  res.json(list.map(l => ({ track_id: l.track_id, filename: l.filename, ext: l.ext })));
});

// GET /api/ai-summaries/:track/raw -> serve file (for direct download/view)
app.get("/api/ai-summaries/:track/raw", async (req, res) => {
  const { track } = req.params;
  const list = await listReports();
  const match = list.find(l => l.track_id === track);
  if (!match) return res.status(404).json({ error: "not found" });
  res.sendFile(match.path);
});

// Helper: convert a report file (txt/md/pdf) into HTML string
async function reportToHtml(reportEntry) {
  const ext = reportEntry.ext;
  const fp = reportEntry.path;
  if (ext === ".md" || ext === ".markdown") {
    const txt = await fs.readFile(fp, "utf8");
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family: Arial, Helvetica, sans-serif; margin:28px; color:#111}
      h1{font-size:20px} h2{font-size:16px} pre{background:#f2f2f2;padding:12px;border-radius:6px;}
      .meta{color:#666;font-size:12px;margin-bottom:12px}
      .section{margin-bottom:18px}
      </style></head><body>${md.render(txt)}</body></html>`;
  } else if (ext === ".txt") {
    const txt = await fs.readFile(fp, "utf8");
    // simple plain text to HTML
    const html = txt.split("\n").map(l => `<p>${escapeHtml(l)}</p>`).join("\n");
    return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family: Arial; margin:28px}</style></head><body>${html}</body></html>`;
  } else if (ext === ".pdf") {
    // Extract text from PDF as fallback
    const buf = await fs.readFile(fp);
    const data = await pdfParse(buf);
    const text = data.text || "";
    const html = text.split("\n").map(l => `<p>${escapeHtml(l)}</p>`).join("\n");
    return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family: Arial; margin:28px}</style></head><body>${html}</body></html>`;
  } else {
    // unknown: try to return as plain text
    const txt = await fs.readFile(fp, "utf8").catch(()=>"");
    return `<!doctype html><html><body><pre>${escapeHtml(txt)}</pre></body></html>`;
  }
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" })[c]);
}

// GET /api/ai-summaries/:track/html -> returns HTML content
app.get("/api/ai-summaries/:track/html", async (req, res) => {
  const { track } = req.params;
  const list = await listReports();
  const entry = list.find(l => l.track_id === track);
  if (!entry) return res.status(404).send("Not found");
  const html = await reportToHtml(entry);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// GET /api/ai-summaries/:track/pdf -> returns generated PDF
app.get("/api/ai-summaries/:track/pdf", async (req, res) => {
  const { track } = req.params;
  const list = await listReports();
  const entry = list.find(l => l.track_id === track);
  if (!entry) return res.status(404).json({ error: "not found" });
  const html = await reportToHtml(entry);

  // Launch puppeteer, render HTML to PDF
  let browser;
  try {
    browser = await puppeteer.launch({ args: ["--no-sandbox","--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    // set HTML content
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "16mm", right: "16mm" }
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${entry.track_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error("PDF generation error:", e);
    res.status(500).json({ error: "pdf generation failed", details: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Serve a static convenience page for dev testing (optional)
app.get("/", (req, res) => {
  res.send(`<html><body><h3>AI Summaries server</h3><p>Use /api/ai-summaries to list.</p></body></html>`);
});

app.listen(PORT, () => {
  console.log(`AI Summaries server listening on http://localhost:${PORT}`);
});
