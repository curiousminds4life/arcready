const fs = require('fs');
const jsCode = fs.readFileSync('js/svg-circuits.js', 'utf8');

// Match everything between svg: " and "}, or "}}
const circuitAMatch = jsCode.match(/'circuit-a':[\s\S]*?svg:\s*"(.*?)",?\s*(?:}|')/);
const circuitBMatch = jsCode.match(/'circuit-b':[\s\S]*?svg:\s*"(.*?)",?\s*(?:}|')/);

function unescapeString(str) {
  return str.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\u00d8/g, 'Ø').replace(/\\u2014/g, '—').replace(/\\u209c/g, 'ₜ').replace(/\\u2081/g, '₁').replace(/\\u2082/g, '₂').replace(/\\u2083/g, '₃').replace(/\\u2084/g, '₄').replace(/\\u2192/g, '→');
}

if (circuitAMatch) {
  let cleaned = unescapeString(circuitAMatch[1]);
  fs.writeFileSync('/Users/apont/.gemini/antigravity/brain/48f808a5-0f74-46e3-bffb-d423a588d8cb/3phasecircuit_new.svg', cleaned);
  console.log('Extracted circuit-a SVG, length:', cleaned.length);
}
if (circuitBMatch) {
  let cleaned = unescapeString(circuitBMatch[1]);
  fs.writeFileSync('/Users/apont/.gemini/antigravity/brain/48f808a5-0f74-46e3-bffb-d423a588d8cb/AC_Circuit_new.svg', cleaned);
  console.log('Extracted circuit-b SVG, length:', cleaned.length);
}
