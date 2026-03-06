import re

def render_mode(section, mode):
    return f"""
        <!-- {mode.capitalize()} Mode -->
        <div id="{section}-{mode}-exam" style="display:none;" class="exam-panel">
            <div class="exam-header">
                <div id="{section}-{mode}-counter" class="exam-counter"></div>
                <div id="{section}-{mode}-timer" class="exam-timer"></div>
                <button id="{section}-{mode}-flag" class="btn btn-outline flag-btn" onclick="window.ArcReady.TestEngine.toggleFlag('{section}','{mode}')" style="display:{'none' if mode=='study' else 'inline-block'}">&#x1F6A9; Flag</button>
            </div>
            <div class="progress-bar"><div id="{section}-{mode}-progress" class="progress-fill" style="width:0%"></div></div>
            <div id="{section}-{mode}-topic-badge" class="topic-badge"></div>
            <h3 id="{section}-{mode}-question" class="question-text"></h3>
            <div id="{section}-{mode}-img-wrap" style="display:none;" class="question-image"><img id="{section}-{mode}-img" src="" alt="Context"/></div>
            <div id="{section}-{mode}-options" class="options-container"></div>
            <div id="{section}-{mode}-explanation" class="explanation-box" style="display:none;"></div>
            
            <div class="exam-actions">
                <button id="{section}-{mode}-prev" class="btn btn-secondary" style="display:{'none' if mode=='study' or mode=='certify' else 'inline-block'}" onclick="window.ArcReady.TestEngine.prevQuestion('{section}','{mode}')">&#x2190; Prev</button>
                <button id="{section}-{mode}-next" class="btn btn-primary" onclick="window.ArcReady.TestEngine.nextQuestion('{section}','{mode}')">Next &#x2192;</button>
                <button id="{section}-{mode}-submit" class="btn btn-danger" style="display:{'none' if mode=='study' else 'inline-block'}" onclick="window.ArcReady.TestEngine.submitExam('{section}','{mode}')">Submit Exam</button>
            </div>
        </div>
        <div id="{section}-{mode}-results" style="display:none;" class="results-panel"></div>
    """

def get_section(section):
    return f"""
        <section id="tab-{section}" class="tab-section">
            <div class="section-header">
                <h2>{section.capitalize()} Section</h2>
                <div id="standards-selector-container"></div>
            </div>
            
            <div id="{section}-start-screen" class="start-screen">
                <select id="{section}-study-topic" class="form-input" style="width: auto; margin-right: 10px;">
                    <option value="all">All Topics</option>
                </select>
                <button class="btn btn-primary" onclick="window.ArcReady.TestEngine.startStudy('{section}')">Start Study Mode</button>
                <button class="btn btn-secondary" onclick="window.ArcReady.TestEngine.startPractice('{section}')">Practice Exam</button>
                <button class="btn btn-danger" onclick="window.ArcReady.TestEngine.startCertify('{section}')">Certification Exam</button>
            </div>

            <div id="{section}-practice-start-screen" style="display:none;" class="start-screen"></div>
            <div id="{section}-certify-start-screen" style="display:none;" class="start-screen"></div>
            
            <!-- Checkpoint UI (Used for Safety Certify) -->
            <div id="{section}-checkpoint-bar" class="checkpoint-bar"></div>

            <div id="{section}-study-area">
                {render_mode(section, 'study')}
            </div>
            {render_mode(section, 'practice')}
            {render_mode(section, 'certify')}
        </section>
    """

reference_html = """
        <section id="tab-reference" class="tab-section">
            <h2>Reference Material</h2>
            <div class="reference-grid">
                <div class="reference-card" tabindex="0" onclick="window.ArcReady.showRef('symbols')">
                    <h3>Symbols Glossary</h3>
                    <p>Electrical & schematic symbols</p>
                </div>
                <div class="reference-card" tabindex="0" onclick="window.ArcReady.showRef('ohms')">
                    <h3>Ohm's Law Calculator</h3>
                    <p>Calculate V, I, R, P</p>
                </div>
                <div class="reference-card" tabindex="0" onclick="window.ArcReady.showRef('standards')">
                    <h3>Standards Details</h3>
                    <p>NFPA / Workplace rules</p>
                </div>
            </div>
            <div id="ref-panel" style="display:none;" class="ref-panel">
                <button class="btn btn-secondary" onclick="document.getElementById('ref-panel').style.display='none'">Close</button>
                <h3 id="ref-title"></h3>
                <div id="ref-body"></div>
            </div>
        </section>
"""

progress_html = """
        <section id="tab-progress" class="tab-section">
            <h2>My Progress</h2>
            <div class="progress-grid">
                <div id="progress-safety-card" class="progress-cert-card">
                    <h3>Safety Certification</h3>
                    <div id="progress-safety-status" class="pcc-status">Not Started</div>
                    <div style="margin-top: 10px;">Best Score: <span id="progress-safety-best">--</span></div>
                    <div>Attempts: <span id="progress-safety-attempts">0</span></div>
                </div>
                <div id="progress-theory-card" class="progress-cert-card">
                    <h3>Theory Certification</h3>
                    <div id="progress-theory-status" class="pcc-status">Locked</div>
                    <div style="margin-top: 10px;">Best Score: <span id="progress-theory-best">--</span></div>
                    <div>Attempts: <span id="progress-theory-attempts">0</span></div>
                </div>
            </div>
            
            <div class="history-section" style="margin-top: 30px;">
                <h3>Exam History</h3>
                <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead><tr style="border-bottom: 2px solid #ccc; text-align: left;"><th style="padding: 8px;">Date</th><th style="padding: 8px;">Section</th><th style="padding: 8px;">Type</th><th style="padding: 8px;">Score</th><th style="padding: 8px;">Result</th></tr></thead>
                    <tbody id="exam-history-tbody"></tbody>
                </table>
            </div>

            <div class="weak-areas-section" style="margin-top: 30px;">
                <h3>Weak Areas (Below 80%)</h3>
                <div id="weak-areas-list"></div>
            </div>
            
            <div id="ai-coach-section" style="display:none; margin-top: 30px;" class="ai-coach-panel">
                <h3><span class="ai-badge">🤖 AI</span> Study Coach</h3>
                <div id="ai-coach-loading" style="display:none;"><span class="ai-loading-dots"><span>.</span><span>.</span><span>.</span></span> Generating study plan...</div>
                <div id="ai-coach-card" style="display:none;"></div>
                <button id="ai-coach-regenerate" class="btn btn-outline" style="display:none; margin-top: 10px;">Regenerate Plan</button>
            </div>
        </section>
    """

with open('index.html', 'r') as f:
    html = f.read()

# Strip out the existing sections for Safety, Theory, Reference, Progress
html = re.sub(r'<section id="tab-safety".*?</section>', get_section("safety"), html, flags=re.DOTALL)
html = re.sub(r'<section id="tab-theory".*?</section>', get_section("theory"), html, flags=re.DOTALL)
html = re.sub(r'<section id="tab-reference".*?</section>', reference_html, html, flags=re.DOTALL)
html = re.sub(r'<section id="tab-progress".*?</section>', progress_html, html, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(html)
print("index.html patched correctly.")
