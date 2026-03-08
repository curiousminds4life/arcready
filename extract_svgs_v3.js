const fs = require('fs');

// We can just execute the JS file in a minimal context to get the object
const jsCode = fs.readFileSync('js/svg-circuits.js', 'utf8');

// Fake the window object so the script doesn't crash
const sandbox = {
  window: { ArcReady: {} }
};

// Evaluate the script within our context
const vm = require('vm');
vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

const circuits = sandbox.window.ArcReady.SVGCircuits;

if (circuits['circuit-a']) {
  fs.writeFileSync('/Users/apont/.gemini/antigravity/brain/48f808a5-0f74-46e3-bffb-d423a588d8cb/3phasecircuit_new.svg', circuits['circuit-a'].svg);
  console.log('Extracted circuit-a SVG, length:', circuits['circuit-a'].svg.length);
}

if (circuits['circuit-b']) {
  fs.writeFileSync('/Users/apont/.gemini/antigravity/brain/48f808a5-0f74-46e3-bffb-d423a588d8cb/AC_Circuit_new.svg', circuits['circuit-b'].svg);
  console.log('Extracted circuit-b SVG, length:', circuits['circuit-b'].svg.length);
}
