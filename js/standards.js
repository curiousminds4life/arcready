(function () {
  'use strict';
  var STORAGE_KEY = 'arcready_standard';
  var DEFAULT_STD = 'workplace';
  window.ArcReady = window.ArcReady || {};

  function loadProfiles() {
    fetch('data/standards-profiles.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        window.ArcReady.standardsProfiles = data;
        injectSelector();
        renderAll();
        updateBadge();
      })
      .catch(function (e) { console.error('ArcReady standards load error:', e); });
  }

  function getStandardId() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_STD;
  }

  function getStandard() {
    var p = window.ArcReady.standardsProfiles;
    if (!p) return null;
    return p[getStandardId()] || p[DEFAULT_STD];
  }

  function setStandard(id) {
    if (id !== 'workplace' && id !== 'nfpa') return;
    localStorage.setItem(STORAGE_KEY, id);
    updateBadge();
    updateSelectorButtons();
    renderAll();
    document.dispatchEvent(new CustomEvent('standardChanged', { detail: { standardId: id } }));
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function injectSelector() {
    var containers = document.querySelectorAll('.standards-selector-container');
    if (!containers.length) return;
    var p = getStandard();
    var desc = p ? (p.description || '') : '';
    var aid = getStandardId();
    var workplaceCls = 'standard-card standard-picker-card' + (aid === 'workplace' ? ' standard-card--active' : '');
    var nfpaCls = 'standard-card standard-picker-card' + (aid === 'nfpa' ? ' standard-card--active' : '');
    var html = [
      '<div class="standard-panel section-card">',
      '<div class="section-card-header" style="margin-bottom: 15px;">',
      '<span class="section-card-icon">📋</span>',
      '<h3 class="section-card-title" style="margin: 0; font-size: 1.1rem;">STUDY STANDARD</h3>',
      '</div>',
      '<p class="section-card-desc" style="margin-bottom: 20px;">Choose which standard to study and certify under.</p>',
      '<div style="display: flex; gap: 15px; margin-bottom: 20px;">',
      '<div class="' + workplaceCls + '" data-std="workplace">',
      '<h4 style="margin: 0 0 5px 0; color: inherit;">Workplace Standards</h4>',
      '<p style="margin: 0; font-size: 0.9rem; color: var(--gray-text); opacity: 0.9;">Facility Safety Procedures</p>',
      '</div>',
      '<div class="' + nfpaCls + '" data-std="nfpa">',
      '<h4 style="margin: 0 0 5px 0; color: inherit;">NFPA 70E 2024</h4>',
      '<p style="margin: 0; font-size: 0.9rem; color: var(--gray-text); opacity: 0.9;">National Standard</p>',
      '</div>',
      '</div>',
      '<div class="standard-desc std-description" style="padding-left: 10px; border-left: 3px solid #CC0000; font-size: 0.95rem; color: #444;">',
      esc(desc),
      '</div>',
      '</div>'
    ].join('');
    containers.forEach(function (c) {
      c.innerHTML = html;
      c.querySelectorAll('[data-std]').forEach(function (btn) {
        btn.addEventListener('click', function () { setStandard(btn.getAttribute('data-std')); });
      });
    });
  }

  function updateBadge() {
    var badge = document.getElementById('std-badge');
    if (!badge) return;
    var aid = getStandardId();
    badge.className = 'std-badge ' + (aid === 'nfpa' ? 'nfpa' : 'workplace');
    badge.textContent = aid === 'nfpa' ? 'NFPA 70E 2024' : 'Workplace Standards';
  }

  function updateSelectorButtons() {
    var aid = getStandardId();
    document.querySelectorAll('[data-std="workplace"]').forEach(function (el) {
      el.className = 'standard-card standard-picker-card' + (aid === 'workplace' ? ' standard-card--active' : '');
    });
    document.querySelectorAll('[data-std="nfpa"]').forEach(function (el) {
      el.className = 'standard-card standard-picker-card' + (aid === 'nfpa' ? ' standard-card--active' : '');
    });
    var descText = '';
    var p = getStandard();
    if (p) descText = p.description || '';
    document.querySelectorAll('.std-description').forEach(function (el) {
      el.textContent = descText;
    });
  }

  function renderPPETable() {
    var el = document.getElementById('ppe-categories-table');
    if (!el) return;
    var p = getStandard();
    if (!p || !p.ppe_categories) return;
    var rows = p.ppe_categories.map(function (cat) {
      var cls = cat.prohibited ? ' class="prohibited-row"' : '';
      return '<tr' + cls + '><td><strong>' + esc(cat.level) + '</strong></td><td>' + esc(cat.energy) + '</td><td>' + esc(cat.description) + '</td><td>' + esc(cat.source) + '</td></tr>';
    }).join('');
    el.innerHTML = '<table><thead><tr><th>' + esc(p.ppe_term) + '</th><th>Incident Energy</th><th>PPE Required</th><th>Source</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderBoundaryTable() {
    var el = document.getElementById('approach-boundaries-table');
    if (!el) return;
    var p = getStandard();
    if (!p || !p.boundaries) return;
    var rows = p.boundaries.map(function (b) {
      return '<tr><td><strong>' + esc(b.name) + '</strong></td><td>' + esc(b.definition) + '</td><td>' + esc(b.source) + '</td></tr>';
    }).join('');
    var note = p.boundary_note ? '<div class="boundary-note">&#9888; ' + esc(p.boundary_note) + '</div>' : '';
    el.innerHTML = '<table><thead><tr><th>Boundary</th><th>Definition</th><th>Source</th></tr></thead><tbody>' + rows + '</tbody></table>' + note;
  }

  function renderLOTOSteps() {
    var el = document.getElementById('loto-steps-container');
    if (!el) return;
    var p = getStandard();
    if (!p || !p.loto_steps) return;
    var steps = p.loto_steps.map(function (s) {
      return '<div class="loto-step"><div class="step-num">' + s.step + '</div><div class="step-content"><h4>' + esc(s.title) + '</h4><p>' + esc(s.detail) + '</p></div></div>';
    }).join('');
    el.innerHTML = '<h4>' + esc(p.loto_full_name) + '</h4><p class="citation">Source: ' + esc(p.loto_source) + '</p>' + steps;
  }

  function renderComplexLoto() {
    var el = document.getElementById('complex-loto-container');
    if (!el) return;
    var p = getStandard();
    if (!p || !p.complex_loto_model) return;
    var m = p.complex_loto_model;
    var lvls = m.levels.map(function (l) {
      return '<div class="loto-level"><strong>' + esc(l.level) + '</strong><span>' + esc(l.description) + '</span></div>';
    }).join('');
    el.innerHTML = '<h4>' + esc(m.name) + '</h4><p>' + esc(m.description) + '</p><div class="loto-levels">' + lvls + '</div>';
  }

  function renderQualifiedPerson() {
    var el = document.getElementById('qualified-person-def');
    if (!el) return;
    var p = getStandard();
    if (!p) return;
    el.innerHTML = '<strong>' + esc(p.qualified_person_term) + '</strong>: ' + esc(p.qualified_person_def) + ' <em>(' + esc(p.qualified_person_source) + ')</em>';
  }

  function renderCitations() {
    var p = getStandard();
    if (!p) return;
    var map = {
      // BUG 7 FIX: was 'category_source' which doesn't exist; correct key is 'label_source'
      'ppe_source': p.label_source || '',
      'loto_source': p.loto_source || '',
      'hierarchy_source': p.hierarchy_source || '',
      'permit_source': p.permit_source || '',
      'label_source': p.label_source || '',
      'glove_test': (p.glove_test_interval || '') + ' -- ' + (p.glove_test_source || ''),
      'arc_flash_review': (p.arc_flash_review || '') + ' -- ' + (p.arc_flash_review_source || ''),
      'ppe_term': p.ppe_term || '',
      'ppe_term_full': p.ppe_term_full || '',
      'qualified_person_term': p.qualified_person_term || '',
      'loto_name': p.loto_name || '',
      'lock_spec': (p.lock_spec || '') + ' (' + (p.lock_source || '') + ')'
    };
    Object.keys(map).forEach(function (key) {
      document.querySelectorAll('[data-citation="' + key + '"]').forEach(function (el) {
        el.textContent = map[key];
      });
    });
  }

  function renderAll() {
    renderPPETable();
    renderBoundaryTable();
    renderLOTOSteps();
    renderComplexLoto();
    renderQualifiedPerson();
    renderCitations();
    updateSelectorButtons();
  }

  window.ArcReady.getStandard = getStandard;
  window.ArcReady.getStandardId = getStandardId;
  window.ArcReady.setStandard = setStandard;
  window.ArcReady.renderAll = renderAll;
  window.ArcReady.renderPPETable = renderPPETable;
  window.ArcReady.renderBoundaryTable = renderBoundaryTable;
  window.ArcReady.renderLOTOSteps = renderLOTOSteps;
  window.ArcReady.renderComplexLoto = renderComplexLoto;
  window.ArcReady.renderQualifiedPerson = renderQualifiedPerson;
  window.ArcReady.renderCitations = renderCitations;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { loadProfiles(); updateBadge(); });
  } else {
    loadProfiles();
    updateBadge();
  }
}());
