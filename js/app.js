/**
 * ArcReady — app.js
 * Tab navigation, mode toggles, reference panel, user form, Ohm's calculator
 */
(function () {
  'use strict';

  var ArcReady = window.ArcReady = window.ArcReady || {};

  /* ============================================================
     TAB NAVIGATION
     ============================================================ */
  var tabButtons = document.querySelectorAll('.nav-tab');
  var tabSections = document.querySelectorAll('.tab-section');

  function showTab(tabName) {
    tabButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    tabSections.forEach(function (sec) {
      sec.classList.toggle('active', sec.id === 'tab-' + tabName);
    });
    window.scrollTo(0, 0);
    if (tabName === 'progress' && ArcReady.Progress) ArcReady.Progress.render();
  }

  ArcReady.showTab = showTab;

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { showTab(btn.getAttribute('data-tab')); });
  });

  /* ============================================================
     DATA-ACTION BUTTONS
     ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    if (action === 'goto-safety') showTab('safety');
    if (action === 'goto-theory') showTab('theory');
  });

  /* ============================================================
     MODE TOGGLE BUTTONS (Study / Practice / Certify)
     ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.mode-btn');
    if (!btn) return;
    var section = btn.getAttribute('data-section');
    var mode = btn.getAttribute('data-mode');
    if (!section || !mode) return;
    activateMode(section, mode);
  });

  function activateMode(section, mode) {
    var toggleGroup = document.getElementById(section + '-mode-toggle');
    if (toggleGroup) {
      toggleGroup.querySelectorAll('.mode-btn').forEach(function (b) {
        b.classList.toggle('mode-btn--active', b.getAttribute('data-mode') === mode);
      });
    }
    ['study', 'practice', 'certify'].forEach(function (m) {
      var panel = document.getElementById(section + '-' + m);
      if (panel) panel.classList.toggle('mode-content--active', m === mode);
    });
  }

  /* ============================================================
     USER INFO FORM
     ============================================================ */
  var userForm = document.getElementById('user-info-form');
  var nameInput = document.getElementById('user-name');
  var emailInput = document.getElementById('user-email');

  if (nameInput) nameInput.value = localStorage.getItem('arcready_username') || '';
  if (emailInput) emailInput.value = localStorage.getItem('arcready_email') || '';

  if (userForm) {
    userForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (nameInput) localStorage.setItem('arcready_username', nameInput.value.trim());
      if (emailInput) localStorage.setItem('arcready_email', emailInput.value.trim());
      if (ArcReady.TestEngine) ArcReady.TestEngine.toast('Progress info saved!', 'success');
    });
  }

  /* ============================================================
     REFERENCE PANEL
     ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.ref-open-btn');
    if (!btn) return;
    var refKey = btn.getAttribute('data-ref');
    openRef(refKey);
  });

  var refCloseBtn = document.getElementById('ref-close-btn');
  if (refCloseBtn) refCloseBtn.addEventListener('click', function () {
    var panel = document.getElementById('ref-content-panel');
    if (panel) panel.style.display = 'none';
  });

  function openRef(key) {
    var panel = document.getElementById('ref-content-panel');
    var titleEl = document.getElementById('ref-content-title');
    var bodyEl = document.getElementById('ref-content-body');
    if (!panel || !bodyEl) return;
    var ref = refData[key];
    if (!ref) return;
    if (titleEl) titleEl.textContent = ref.title;
    bodyEl.innerHTML = typeof ref.body === 'function' ? ref.body() : ref.body;
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Hook: render symbol glossary if needed
    if (key === 'symbols' && ArcReady.renderSymbolGlossary) {
      var symContainer = document.getElementById('ref-symbol-glossary-body');
      if (symContainer) ArcReady.renderSymbolGlossary(symContainer);
    }
  }

  /* ============================================================
     OHM'S LAW CALCULATOR
     ============================================================ */
  ArcReady.calcOhms = function () {
    var E = parseFloat(document.getElementById('ohms-e').value);
    var I = parseFloat(document.getElementById('ohms-i').value);
    var R = parseFloat(document.getElementById('ohms-r').value);
    var P = parseFloat(document.getElementById('ohms-p').value);
    var res = document.getElementById('ohms-result');
    var results = [];
    var eKnown = !isNaN(E), iKnown = !isNaN(I), rKnown = !isNaN(R), pKnown = !isNaN(P);
    if (eKnown && iKnown) { results.push('R = E/I = ' + (E / I).toFixed(4) + ' Ω'); results.push('P = E×I = ' + (E * I).toFixed(4) + ' W'); }
    if (eKnown && rKnown) { results.push('I = E/R = ' + (E / R).toFixed(4) + ' A'); results.push('P = E²/R = ' + (E * E / R).toFixed(4) + ' W'); }
    if (iKnown && rKnown) { results.push('E = I×R = ' + (I * R).toFixed(4) + ' V'); results.push('P = I²×R = ' + (I * I * R).toFixed(4) + ' W'); }
    if (pKnown && iKnown) { results.push('E = P/I = ' + (P / I).toFixed(4) + ' V'); results.push('R = P/I² = ' + (P / (I * I)).toFixed(4) + ' Ω'); }
    if (pKnown && eKnown) { results.push('I = P/E = ' + (P / E).toFixed(4) + ' A'); results.push('R = E²/P = ' + (E * E / P).toFixed(4) + ' Ω'); }
    if (pKnown && rKnown) { results.push('I = √(P/R) = ' + Math.sqrt(P / R).toFixed(4) + ' A'); results.push('E = √(P×R) = ' + Math.sqrt(P * R).toFixed(4) + ' V'); }
    if (res) res.innerHTML = results.length ? '<ul>' + results.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul>' : '<p class="ref-note">Enter at least two values.</p>';
  };

  ArcReady.filterSymbols = function () {
    var q = (document.getElementById('sym-search').value || '').toLowerCase();
    document.querySelectorAll('#symbol-table tbody tr').forEach(function (row) {
      row.style.display = row.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
    });
  };

  /* ============================================================
     REFERENCE DATA
     ============================================================ */
  var refData = {

    ohms: {
      title: "Ohm's Law & Power Calculator",
      body: function () {
        return '<div class="ohms-calc">' +
          '<p>Enter any <strong>two</strong> known values to calculate the rest.</p>' +
          '<div class="ohms-grid">' +
          '<div class="ohms-field"><label>Voltage E (V)</label><input type="number" id="ohms-e" class="form-input" placeholder="Volts" /></div>' +
          '<div class="ohms-field"><label>Current I (A)</label><input type="number" id="ohms-i" class="form-input" placeholder="Amps" /></div>' +
          '<div class="ohms-field"><label>Resistance R (Ω)</label><input type="number" id="ohms-r" class="form-input" placeholder="Ohms" /></div>' +
          '<div class="ohms-field"><label>Power P (W)</label><input type="number" id="ohms-p" class="form-input" placeholder="Watts" /></div>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="ArcReady.calcOhms()">Calculate</button>' +
          '<div id="ohms-result" class="ohms-result"></div>' +
          '<div class="ohms-formulas"><h4>Key Formulas</h4><ul>' +
          '<li>E = I × R</li><li>I = E / R</li><li>R = E / I</li>' +
          '<li>P = I × E</li><li>P = I² × R</li><li>P = E² / R</li>' +
          '</ul></div></div>';
      }
    },


    boundaries: {
      title: 'NFPA 70E Approach Boundaries',
      body: '<div class="ref-table-wrap"><p>Approach boundaries define how close unqualified and qualified persons may approach energized equipment.</p>' +
        '<table class="ref-table"><thead><tr><th>Boundary</th><th>Who It Applies To</th><th>Rule</th></tr></thead><tbody>' +
        '<tr><td><strong>Limited</strong></td><td>Qualified persons only beyond this point</td><td>Unqualified persons must be escorted by a qualified person</td></tr>' +
        '<tr><td><strong>Restricted</strong></td><td>Qualified persons with PPE</td><td>Increased risk of shock; PPE required, deliberate movement only</td></tr>' +
        '<tr><td><strong>Prohibited (Shock)</strong></td><td>Qualified persons — inadvertent contact possible</td><td>Direct contact or contact with conductive object prohibited without insulation</td></tr>' +
        '<tr><td><strong>Arc Flash Protection</strong></td><td>Anyone working on or near energized equipment</td><td>Must wear arc-rated PPE rated for the incident energy at this distance</td></tr>' +
        '</tbody></table>' +
        '<p class="ref-note">Exact distances depend on system voltage. Always consult the equipment arc flash label and NFPA 70E Table 130.4(D).</p></div>'
    },

    hrc: {
      title: 'HRC / Arc Flash PPE Categories',
      body: '<div class="ref-table-wrap">' +
        '<table class="ref-table"><thead><tr><th>Category</th><th>Incident Energy</th><th>Minimum Arc Rating</th><th>Required PPE</th></tr></thead><tbody>' +
        '<tr class="hrc-0"><td><strong>Category 0</strong></td><td>&lt; 1.2 cal/cm²</td><td>N/A</td><td>Non-melting, flammable clothing; safety glasses; hearing protection</td></tr>' +
        '<tr class="hrc-1"><td><strong>Category 1</strong></td><td>1.2 – 4 cal/cm²</td><td>4 cal/cm²</td><td>Arc-rated shirt &amp; pants or coverall; face shield; leather gloves; hard hat</td></tr>' +
        '<tr class="hrc-2"><td><strong>Category 2</strong></td><td>4 – 8 cal/cm²</td><td>8 cal/cm²</td><td>Arc-rated shirt &amp; pants; arc flash suit; balaclava; rubber insulating gloves; hard hat</td></tr>' +
        '<tr class="hrc-3"><td><strong>Category 3</strong></td><td>8 – 25 cal/cm²</td><td>25 cal/cm²</td><td>Arc flash suit (full body); arc-rated gloves; leather protectors; hard hat Class E</td></tr>' +
        '<tr class="hrc-4"><td><strong>Category 4</strong></td><td>25 – 40 cal/cm²</td><td>40 cal/cm²</td><td>Heaviest arc flash suit; multi-layer system; Class E hard hat; voltage-rated gloves</td></tr>' +
        '<tr class="hrc-prohibited"><td><strong>PROHIBITED</strong></td><td>&gt; 40 cal/cm²</td><td>—</td><td>De-energize before work. Energized work PROHIBITED at this level.</td></tr>' +
        '</tbody></table>' +
        '<p class="ref-note">Source: Workplace Safety Standards. All arc-rated clothing must comply with ASTM F-1506. Rubber gloves tested per ASTM D120.</p></div>'
    },

    loto: {
      title: 'LOTOTO — 8-Step Lockout/Tagout/Tryout Procedure',
      body: '<div class="loto-steps">' +
        '<p>Source: Workplace Safety Standards Hazardous Energy Control Program (HECP)</p>' +
        '<ol class="loto-list">' +
        '<li><strong>Identify all energy sources</strong> — electrical, hydraulic, pneumatic, thermal, gravitational, stored/residual</li>' +
        '<li><strong>Notify affected employees</strong> — inform all personnel in the area that equipment will be shut down</li>' +
        '<li><strong>Shut down equipment</strong> — use normal stopping procedure; bring to complete stop</li>' +
        '<li><strong>Isolate all energy sources</strong> — open disconnects, close valves, block gravity-fed parts</li>' +
        '<li><strong>Apply lockout/tagout devices</strong> — RED Master Lock or American Lock only; one key per associate; laminated tag with name &amp; date</li>' +
        '<li><strong>Release or restrain stored energy</strong> — bleed pressure, discharge capacitors, block suspended parts, ground conductors</li>' +
        '<li><strong>Verify isolation (Tryout)</strong> — attempt to start equipment using normal start controls to confirm zero energy state</li>' +
        '<li><strong>Perform the work</strong> — only now is it safe to work on the equipment</li>' +
        '</ol>' +
        '<div class="loto-notes">' +
        '<h4>Key Rules</h4>' +
        '<ul>' +
        '<li>All locks must be RED (Master Lock or American Lock only)</li>' +
        '<li>Each associate uses their own lock — never share keys</li>' +
        '<li>Tags must be laminated and show name + date</li>' +
        '<li>Authorized Associates require Machine Safety Awareness training every 2 years</li>' +
        '</ul></div>' +
        '<button class="btn btn-outline-red" onclick="window.print()">\uD83D\uDDA8\uFE0F Print Checklist</button>' +
        '</div>'
    },

    formulas: {
      title: 'Electrical Formula Sheet',
      body: '<div class="formula-sheet">' +
        '<div class="formula-group">' +
        '<h4>Ohm’s Law</h4>' +
        '<ul><li>E = I × R</li><li>I = E / R</li><li>R = E / I</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Power</h4>' +
        '<ul><li>P = I × E</li><li>P = I² × R</li><li>P = E² / R</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Series Circuits</h4>' +
        '<ul><li>Rₜ = R₁ + R₂ + R₃ + ...</li><li>I is same throughout</li><li>Eₜ = E₁ + E₂ + E₃ (KVL)</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Parallel Circuits</h4>' +
        '<ul><li>1/Rₜ = 1/R₁ + 1/R₂ + 1/R₃</li><li>E is same across each branch</li><li>Iₜ = I₁ + I₂ + I₃</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>AC Theory</h4>' +
        '<ul><li>f = 1/T (frequency = 1/period)</li><li>Vᵣᵜᵠ = Vₚₑₐₖ / √2 ≈ 0.707 × Vₚₑₐₖ</li>' +
        '<li>Xₗ = 2πfL (inductive reactance)</li><li>Xᴄ = 1/(2πfC) (capacitive reactance)</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Transformers</h4>' +
        '<ul><li>V₁/V₂ = N₁/N₂ (turns ratio)</li><li>Step-up: N₂ > N₁</li><li>Step-down: N₂ < N₁</li>' +
        '<li>Example: 4:1 ratio, 480V primary → 120V secondary</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>3-Phase Systems</h4>' +
        '<ul><li>Wye: Vₗᵢₙₑ = √3 × Vₚₕₐₛₑ ≈ 1.732 × Vₚₕₐₛₑ</li>' +
        '<li>Delta: Vₗᵢₙₑ = Vₚₕₐₛₑ</li>' +
        '<li>Example: 208V Wye → phase voltage = 208/1.732 ≈ 120V</li></ul>' +
        '</div>' +
        '<button class="btn btn-outline-red" onclick="window.print()">\uD83D\uDDA8\uFE0F Print Formula Sheet</button>' +
        '</div>'
    }
    ,

    symbols: {
      title: 'Electrical Symbol Glossary',
      body: function () {
        return '<div id="ref-symbol-glossary-body" style="min-height:200px;"><div style="color:#999;font-style:italic;padding:24px;">Loading symbols...</div></div>';
      }
    }
  };

  /* ============================================================
     INITIAL STATE
     ============================================================ */
  // Show home tab by default (already handled by CSS active class in HTML)
  // Progress bar will be updated by TestEngine after banks load

}());

// Dual-standard: re-render dynamic content on standard change
document.addEventListener('standardChanged', function () {
  if (window.ArcReady && window.ArcReady.renderAll) window.ArcReady.renderAll();
});
