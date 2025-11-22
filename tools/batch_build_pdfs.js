/*
  Batch-build PDFs for all summary files in REPORTS_DIR.
  Usage: REPORTS_DIR=/path/to/ai_summary_reports node tools/batch_build_pdfs.js
  Output: REPORTS_DIR/pdfs/<id>.pdf
*/

const path = require('path');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');

const APP_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = process.env.REPORTS_DIR || path.join(APP_ROOT, 'ai_summary_reports');
const OUT_DIR = path.join(REPORTS_DIR, 'pdfs');

async function listFiles() {
  try {
    const files = await fs.readdir(REPORTS_DIR);
    return files
      .filter(f => ['.md', '.markdown', '.txt', '.json', '.pdf'].includes(path.extname(f).toLowerCase()))
      .map(f => ({ filename: f, path: path.join(REPORTS_DIR, f) }));
  } catch (e) {
    console.error('listFiles error:', e);
    return [];
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function fileToHtml(fp, ext) {
  const txt = await fs.readFile(fp, 'utf8').catch(() => '');
  if (ext === '.json') {
    try {
      const j = JSON.parse(txt);
      return `<!doctype html><html><head><meta charset="utf-8"></head><body><pre>${escapeHtml(JSON.stringify(j, null, 2))}</pre></body></html>`;
    } catch (e) {
      // fallback to plain text
    }
  }
  if (ext === '.md' || ext === '.markdown') {
    const MarkdownIt = require('markdown-it');
    const md = new MarkdownIt({ html: false, linkify: true });
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111}
      h1{font-size:22px} h2{font-size:18px} pre{background:#f6f6f6;padding:12px;border-radius:6px}
      </style></head><body>${md.render(txt)}</body></html>`;
  }
  // fallback for txt and others
  const html = txt.split(/\r?\n/).map(l => `<p>${escapeHtml(l)}</p>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;padding:28px}</style></head><body>${html}</body></html>`;
}

(async () => {
  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const files = await listFiles();
    if (!files.length) {
      console.log('No files found in', REPORTS_DIR);
      process.exit(0);
    }

    console.log(`Found ${files.length} file(s) to process...`);
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    try {
      for (const f of files) {
        const ext = path.extname(f.filename).toLowerCase();
        const id = path.basename(f.filename, ext).replace(/\s+/g, '_').toLowerCase();

        console.log(`Processing: ${f.filename} -> ${id}.pdf`);
        const html = await fileToHtml(f.path, ext);
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const outPath = path.join(OUT_DIR, id + '.pdf');
        await page.pdf({
          path: outPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' }
        });
        await page.close();
        console.log('✓ Built', outPath);
      }
      console.log(`\n✓ Completed! Generated ${files.length} PDF(s) in ${OUT_DIR}`);
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
