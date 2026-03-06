
/**
 * ArcReady - progress.js
 * Reads localStorage, renders certification status, exam history, weak areas
 */
(function () {
  'use strict';

  var ArcReady = window.ArcReady = window.ArcReady || {};

  function el(id) { return document.getElementById(id); }

  function render() {
    var safetyCert = localStorage.getItem('arcready_safety_certified') === 'true';
    var theoryCert = localStorage.getItem('arcready_theory_certified') === 'true';
    var safetyHist = getHistory('safety');
    var theoryHist = getHistory('theory');
    var safetyBest = localStorage.getItem('arcready_safety_best') || '--';
    var theoryBest = localStorage.getItem('arcready_theory_best') || '--';

    /* --- Safety Cert Card --- */
    var ssEl = el('progress-safety-status');
    var sc   = el('progress-safety-card');
    if (ssEl) {
      if (safetyCert) {
        ssEl.textContent = 'CERTIFIED';
        ssEl.className   = 'pcc-status pcc-status--pass';
      } else if (safetyHist.length > 0) {
        ssEl.textContent = 'Not Passed';
        ssEl.className   = 'pcc-status pcc-status--fail';
      } else {
        ssEl.textContent = 'Not Started';
        ssEl.className   = 'pcc-status pcc-status--none';
      }
    }
    if (sc) sc.classList.toggle('progress-cert-card--certified', safetyCert);

    /* --- Theory Cert Card --- */
    var tsEl = el('progress-theory-status');
    var tc   = el('progress-theory-card');
    if (tsEl) {
      if (theoryCert) {
        tsEl.textContent = 'CERTIFIED';
        tsEl.className   = 'pcc-status pcc-status--pass';
      } else if (!safetyCert) {
        tsEl.textContent = 'Locked';
        tsEl.className   = 'pcc-status pcc-status--none';
      } else if (theoryHist.length > 0) {
        tsEl.textContent = 'Not Passed';
        tsEl.className   = 'pcc-status pcc-status--fail';
      } else {
        tsEl.textContent = 'Not Started';
        tsEl.className   = 'pcc-status pcc-status--none';
      }
    }
    if (tc) tc.classList.toggle('progress-cert-card--certified', theoryCert);

    /* --- Stats --- */
    var sbEl = el('progress-safety-best');
    var tbEl = el('progress-theory-best');
    var saEl = el('progress-safety-attempts');
    var taEl = el('progress-theory-attempts');
    if (sbEl) sbEl.textContent = safetyBest !== '--' ? safetyBest + '%' : '--';
    if (tbEl) tbEl.textContent = theoryBest !== '--' ? theoryBest + '%' : '--';
    if (saEl) saEl.textContent = safetyHist.length;
    if (taEl) taEl.textContent = theoryHist.length;

    /* --- Exam History Table --- */
    renderHistory(safetyHist, theoryHist);

    /* --- Weak Areas --- */
    renderWeakAreas(safetyHist, theoryHist);
  }

  function renderHistory(safetyHist, theoryHist) {
    var tbody = el('exam-history-tbody');
    if (!tbody) return;

    var all = [];
    safetyHist.forEach(function(a) {
      all.push({ date: a.date, section: 'Safety', score: a.score, total: a.total, pct: a.pct, passed: a.passed });
    });
    theoryHist.forEach(function(a) {
      all.push({ date: a.date, section: 'Theory', score: a.score, total: a.total, pct: a.pct, passed: a.passed });
    });
    all.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    if (all.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No certification exams taken yet.</td></tr>';
      return;
    }

    tbody.innerHTML = all.map(function(a) {
      var d  = new Date(a.date);
      var ds = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var passCell = a.passed
        ? '<span class="result-pass">PASS</span>'
        : '<span class="result-fail">FAIL</span>';
      return '<tr>' +
        '<td>' + ds + '</td>' +
        '<td>' + a.section + '</td>' +
        '<td>Certify</td>' +
        '<td>' + a.score + '/' + a.total + ' (' + a.pct + '%)</td>' +
        '<td>' + passCell + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderWeakAreas(safetyHist, theoryHist) {
    var weakEl = el('weak-areas-list');
    if (!weakEl) return;

    var topicAccum = {};
    var allHist = safetyHist.concat(theoryHist);
    allHist.forEach(function(attempt) {
      if (!attempt.topicBreakdown) return;
      Object.keys(attempt.topicBreakdown).forEach(function(topic) {
        var t = attempt.topicBreakdown[topic];
        if (!topicAccum[topic]) topicAccum[topic] = { correct: 0, total: 0 };
        topicAccum[topic].correct += t.correct;
        topicAccum[topic].total   += t.total;
      });
    });

    var topics = Object.keys(topicAccum);
    var weakTopics = topics.filter(function(t) {
      var d = topicAccum[t];
      return d.total > 0 && (d.correct / d.total) < 0.80;
    }).sort(function(a, b) {
      return (topicAccum[a].correct / topicAccum[a].total) -
             (topicAccum[b].correct / topicAccum[b].total);
    });

    if (topics.length === 0) {
      weakEl.innerHTML = '<p class="empty-state">No exam data yet. Take a certification exam to see your weak areas.</p>';
      return;
    }
    if (weakTopics.length === 0) {
      weakEl.innerHTML = '<p class="empty-state">All topics are at 80% or above. Great work!</p>';
      return;
    }

    weakEl.innerHTML = weakTopics.map(function(topic) {
      var d   = topicAccum[topic];
      var pct = Math.round((d.correct / d.total) * 100);
      var cls = pct < 60 ? 'weak-pct--danger' : 'weak-pct--warn';
      return '<div class="weak-topic-row">' +
        '<span class="weak-topic-name">' + escHtml(topic) + '</span>' +
        '<div class="weak-topic-bar-wrap">' +
        '<div class="weak-topic-bar" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<span class="weak-topic-pct ' + cls + '">' + pct + '%</span>' +
        '</div>';
    }).join('');

    // AI: run weak area coach
    if (window.ArcReady && ArcReady.AI && ArcReady.AI.runWeakAreaCoach) {
      var allHist = getHistory('safety').concat(getHistory('theory'));
      var combined = {};
      allHist.forEach(function(a) {
        if (!a.topicBreakdown) return;
        Object.keys(a.topicBreakdown).forEach(function(t) {
          if (!combined[t]) combined[t] = { correct: 0, total: 0 };
          combined[t].correct += a.topicBreakdown[t].correct;
          combined[t].total   += a.topicBreakdown[t].total;
        });
      });
      if (Object.keys(combined).length > 0) {
        ArcReady.AI.runWeakAreaCoach(combined, 'All Sections');
      }
    }
  }

  function getHistory(section) {
    try { return JSON.parse(localStorage.getItem('arcready_' + section + '_history') || '[]'); }
    catch (e) { return []; }
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  ArcReady.Progress = { render: render };

}());

function getStandardLabel() {
  var id = localStorage.getItem('arcready_standard') || 'workplace';
  return id === 'nfpa' ? 'NFPA 70E 2024' : 'Workplace Standards';
}
