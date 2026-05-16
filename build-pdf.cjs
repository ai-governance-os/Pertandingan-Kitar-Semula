// Build USER_GUIDE.html from USER_GUIDE.md with friendly print-friendly CSS.
// Then call Chrome headless to render USER_GUIDE.pdf.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const md = fs.readFileSync(path.join(HERE, 'USER_GUIDE.md'), 'utf8');

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function inline(s) {
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

const lines = md.split(/\r?\n/);
let html = '';
let i = 0;
let para = [];
function flushPara() {
  if (!para.length) return;
  html += `<p>${inline(para.join('<br>'))}</p>\n`;
  para = [];
}

while (i < lines.length) {
  const line = lines[i];

  if (/^```/.test(line)) {
    flushPara();
    i++;
    let code = '';
    while (i < lines.length && !/^```/.test(lines[i])) {
      code += lines[i] + '\n';
      i++;
    }
    i++;
    html += `<pre><code>${escapeHtml(code)}</code></pre>\n`;
    continue;
  }

  const h = line.match(/^(#{1,6})\s+(.+)$/);
  if (h) {
    flushPara();
    html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>\n`;
    i++; continue;
  }

  if (/^---\s*$/.test(line)) {
    flushPara();
    html += '<hr>\n';
    i++; continue;
  }

  if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|\s*[:-]/.test(lines[i+1])) {
    flushPara();
    const header = line.trim().slice(1, -1).split('|').map(s => s.trim());
    i += 2;
    const rows = [];
    while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
      rows.push(lines[i].trim().slice(1, -1).split('|').map(s => s.trim()));
      i++;
    }
    html += '<table><thead><tr>' + header.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
    rows.forEach(r => {
      html += '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>\n';
    continue;
  }

  if (/^>\s?/.test(line)) {
    flushPara();
    let block = '';
    while (i < lines.length && /^>\s?/.test(lines[i])) {
      block += lines[i].replace(/^>\s?/, '') + '<br>';
      i++;
    }
    html += `<blockquote>${inline(block)}</blockquote>\n`;
    continue;
  }

  if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
    flushPara();
    const ordered = /^\s*\d+\.\s+/.test(line);
    const tag = ordered ? 'ol' : 'ul';
    html += `<${tag}>`;
    while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
      const item = lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, '');
      html += `<li>${inline(item)}</li>`;
      i++;
    }
    html += `</${tag}>\n`;
    continue;
  }

  if (line.trim() === '') { flushPara(); i++; continue; }
  para.push(line);
  i++;
}
flushPara();

const css = `
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
    color: #1A1830;
    max-width: 760px;
    margin: 0 auto;
    padding: 24px;
    font-size: 13px;
  }
  h1 { font-size: 26px; color: #167B72; border-bottom: 3px solid #2EC4B6; padding-bottom: 8px; margin-top: 28px; }
  h2 { font-size: 20px; color: #167B72; margin-top: 24px; border-bottom: 2px solid rgba(46,196,182,.4); padding-bottom: 4px; }
  h3 { font-size: 16px; color: #C8341A; margin-top: 18px; }
  h4 { font-size: 14px; color: #6B4500; margin-top: 14px; }
  p { margin: 8px 0; }
  ul, ol { margin: 6px 0 6px 22px; padding: 0; }
  li { margin: 3px 0; }
  blockquote {
    margin: 10px 0; padding: 10px 14px;
    background: rgba(46,196,182,.08);
    border-left: 4px solid #2EC4B6;
    border-radius: 6px;
    color: #4A4763;
  }
  code {
    background: #FFF1DA;
    padding: 1px 6px;
    border-radius: 4px;
    font-family: "Consolas", "Cascadia Code", monospace;
    font-size: 12px;
    color: #6B2410;
  }
  pre {
    background: #FFF8EE;
    border-left: 4px solid #FFC93C;
    padding: 12px 14px;
    border-radius: 8px;
    overflow-x: auto;
    page-break-inside: avoid;
    margin: 10px 0;
  }
  pre code { background: transparent; padding: 0; color: #1A1830; font-size: 11.5px; line-height: 1.5; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 12px;
    page-break-inside: avoid;
  }
  th, td { padding: 6px 10px; border: 1px solid #D6D6DA; vertical-align: top; text-align: left; }
  th { background: #2EC4B6; color: white; font-weight: 700; }
  tr:nth-child(even) td { background: #F8FAF9; }
  hr { border: 0; border-top: 1px dashed #C68B00; margin: 22px 0; }
  a { color: #167B72; text-decoration: none; }
  b, strong { color: #1A1830; font-weight: 700; }

  h1, h2 { page-break-after: avoid; }
  table, pre, blockquote { page-break-inside: avoid; }
`;

const out = `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8">
<title>环保小兵 · 使用指南</title>
<style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;

const htmlPath = path.join(HERE, 'USER_GUIDE.html');
const pdfPath = path.join(HERE, 'USER_GUIDE.pdf');
fs.writeFileSync(htmlPath, out, 'utf8');
console.log('Wrote ' + htmlPath + ' (' + out.length + ' bytes)');

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const chrome = chromeCandidates.find(p => fs.existsSync(p));
if (!chrome) {
  console.error('No Chrome/Edge found. Open USER_GUIDE.html manually and print to PDF.');
  process.exit(2);
}
console.log('Using browser: ' + chrome);

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
try {
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--print-to-pdf=' + pdfPath,
    '--print-to-pdf-no-header',
    '--virtual-time-budget=5000',
    fileUrl,
  ], { stdio: 'inherit' });
  console.log('Wrote ' + pdfPath);
} catch (e) {
  console.error('Chrome print failed:', e.message);
  process.exit(3);
}
