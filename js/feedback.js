
(function () {
    'use strict';

    var ArcReady = window.ArcReady = window.ArcReady || {};

    // -- CONFIGURATION ----------------------------------------------------------
    // Replace this with your Google Apps Script Web App URL
    var GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxBGevl-eUASJW_kj84DOmf5IgvVUSYSwr5kTW_OwwrfIDS2-1ZxIUksl2DEcYZPMSB4Q/exec';

    // -- DOM ELEMENTS -----------------------------------------------------------
    var toggleBtn = null;
    var backdrop = null;
    var closeBtn = null;
    var form = null;
    var submitBtn = null;
    var statusMsg = null;

    function init() {
        createElements();
        setupEventListeners();
    }

    function createElements() {
        // Create the floating system container if it doesn't exist
        var container = document.getElementById('feedback-system');
        if (!container) {
            container = document.createElement('div');
            container.id = 'feedback-system';
            document.body.appendChild(container);
        }

        // Create the toggle button
        container.innerHTML = '<button id="feedback-toggle" title="Send Feedback">💬</button>';
        toggleBtn = document.getElementById('feedback-toggle');

        // Create the modal backdrop and modal
        backdrop = document.createElement('div');
        backdrop.className = 'feedback-backdrop';
        backdrop.id = 'feedback-modal-backdrop';
        backdrop.innerHTML = [
            '<div class="feedback-modal">',
            '  <div class="feedback-header">',
            '    <h3><span>📝</span> Send Feedback</h3>',
            '    <button class="feedback-close" id="feedback-close-btn">&times;</button>',
            '  </div>',
            '  <div class="feedback-body">',
            '    <p style="font-size:13px; color:#666; margin-bottom:16px;">Help us improve ArcReady! Report bugs, suggest features, or correct technical data.</p>',
            '    <form id="feedback-form">',
            '      <div class="feedback-form-group">',
            '        <label for="fb-type">Feedback Type</label>',
            '        <select id="fb-type" class="feedback-select" required>',
            '          <option value="Bug Report">🪲 Bug Report</option>',
            '          <option value="Content Correction">📋 Content Correction</option>',
            '          <option value="Suggestion">💡 Feature Suggestion</option>',
            '          <option value="General">✉️ General Feedback</option>',
            '        </select>',
            '      </div>',
            '      <div class="feedback-form-group">',
            '        <label for="fb-message">Message</label>',
            '        <textarea id="fb-message" class="feedback-textarea" placeholder="Describe the issue or suggestion in detail..." required></textarea>',
            '      </div>',
            '      <div id="fb-status" class="feedback-status"></div>',
            '    </form>',
            '  </div>',
            '  <div class="feedback-footer">',
            '    <button type="button" class="feedback-btn feedback-btn--cancel" id="feedback-cancel-btn">Cancel</button>',
            '    <button type="submit" form="feedback-form" class="feedback-btn feedback-btn--submit" id="feedback-submit-btn">Submit Feedback</button>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(backdrop);

        closeBtn = document.getElementById('feedback-close-btn');
        var cancelBtn = document.getElementById('feedback-cancel-btn');
        form = document.getElementById('feedback-form');
        submitBtn = document.getElementById('feedback-submit-btn');
        statusMsg = document.getElementById('fb-status');

        // Add cancel functionality
        if (cancelBtn) cancelBtn.addEventListener('click', closeFeedback);
    }

    function setupEventListeners() {
        if (toggleBtn) toggleBtn.addEventListener('click', openFeedback);
        if (closeBtn) closeBtn.addEventListener('click', closeFeedback);
        if (backdrop) backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) closeFeedback();
        });

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                submitFeedback();
            });
        }
    }

    function openFeedback() {
        backdrop.style.display = 'flex';
        document.getElementById('fb-message').focus();
        // Scroll lock
        document.body.style.overflow = 'hidden';
    }

    function closeFeedback() {
        backdrop.style.display = 'none';
        document.body.style.overflow = '';
        resetForm();
    }

    function resetForm() {
        form.reset();
        statusMsg.style.display = 'none';
        statusMsg.className = 'feedback-status';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
    }

    function getContext() {
        var activeTab = 'home';
        var tabs = ['home', 'safety', 'theory', 'lab', 'reference', 'progress'];
        for (var i = 0; i < tabs.length; i++) {
            var sec = document.getElementById('tab-' + tabs[i]);
            if (sec && sec.classList.contains('active')) {
                activeTab = tabs[i];
                break;
            }
        }

        return {
            tab: activeTab,
            standard: window.ArcReady.getStandardId ? window.ArcReady.getStandardId() : 'unknown',
            userName: localStorage.getItem('arcready_username') || 'Anonymous',
            userEmail: localStorage.getItem('arcready_email') || 'Not provided',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }

    function submitFeedback() {
        if (!GOOGLE_SHEETS_URL) {
            showStatus('Feedback saved locally (Dev Mode: Deployment required)', 'success');
            console.log('Feedback Data:', collectData());
            setTimeout(closeFeedback, 2000);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        var data = collectData();

        fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors sometimes for simple POST
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(function () {
                showStatus('Thank you! Your feedback has been sent.', 'success');
                setTimeout(closeFeedback, 2000);
            })
            .catch(function (err) {
                console.error('Feedback Error:', err);
                showStatus('Oops! Something went wrong. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Feedback';
            });
    }

    function collectData() {
        var context = getContext();
        return {
            type: document.getElementById('fb-type').value,
            message: document.getElementById('fb-message').value,
            name: document.getElementById('fb-name').value,
            email: document.getElementById('fb-email').value,
            tab: context.tab,
            standard: context.standard,
            userName: context.userName,
            userEmail: context.userEmail,
            userAgent: context.userAgent,
            timestamp: context.timestamp
        };
    }

    function showStatus(text, type) {
        statusMsg.textContent = text;
        statusMsg.className = 'feedback-status feedback-status--' + type;
        statusMsg.style.display = 'block';
    }

    // Start the system
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
