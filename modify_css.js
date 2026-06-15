const fs = require('fs');

// 1. Update client/src/index.css
let indexCss = fs.readFileSync('client/src/index.css', 'utf8');

// Remove LIGHT MODE section
indexCss = indexCss.replace(/\/\* =+ \r?\n\s*☀️ LIGHT MODE[^]*?\/\* =+ \r?\n\s*🌙 MIDNIGHT FOCUS/m, '/* ===================================================\r\n   🌙 MIDNIGHT FOCUS — DARK MODE THEME (DEFAULT)\r\n   =================================================== */\n');

// Change body.dark to body
indexCss = indexCss.replace(/body\.dark/g, 'body');

fs.writeFileSync('client/src/index.css', indexCss);
console.log('Updated index.css');

// 2. Update css/style.css
let styleCss = fs.readFileSync('css/style.css', 'utf8');

// Rename body.dark to body
styleCss = styleCss.replace(/body\.dark/g, 'body');

// Also inject the multiple dark modes into style.css right after :root
const multipleThemes = `
.theme-ocean {
  --dm-bg: #0f172a;
  --dm-surface: rgba(30,41,59,0.85);
  --dm-surface-2: rgba(30,41,59,0.9);
  --dm-border: rgba(56,189,248,0.25);
  --dm-primary: #38bdf8;
  --dm-primary-glow: rgba(56,189,248,0.35);
  --dm-text: #f8fafc;
  --dm-text-mid: #cbd5e1;
  --dm-text-soft: #94a3b8;
}

.theme-forest {
  --dm-bg: #052e16;
  --dm-surface: rgba(6,78,59,0.85);
  --dm-surface-2: rgba(6,78,59,0.9);
  --dm-border: rgba(52,211,153,0.25);
  --dm-primary: #34d399;
  --dm-primary-glow: rgba(52,211,153,0.35);
  --dm-text: #f0fdf4;
  --dm-text-mid: #a7f3d0;
  --dm-text-soft: #6ee7b7;
}

.theme-sunset {
  --dm-bg: #450a0a;
  --dm-surface: rgba(127,29,29,0.85);
  --dm-surface-2: rgba(127,29,29,0.9);
  --dm-border: rgba(251,146,60,0.25);
  --dm-primary: #fb923c;
  --dm-primary-glow: rgba(251,146,60,0.35);
  --dm-text: #fef2f2;
  --dm-text-mid: #ffedd5;
  --dm-text-soft: #fdba74;
}
`;

styleCss = styleCss.replace(/(:root\s*\{[^}]+\})/, '$1' + multipleThemes);

fs.writeFileSync('css/style.css', styleCss);
console.log('Updated style.css');
