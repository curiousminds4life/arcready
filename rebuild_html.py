import re

base_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <base href="/arcready/">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ArcReady - Electrical Safety Training</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/ai.css">
</head>
<body>
    <nav class="top-nav">
        <div class="nav-inner">
            <div class="nav-brand">
                <span class="brand-icon">⚡</span>
                <span class="brand-name">ArcReady</span>
            </div>
            <div class="nav-tabs" id="tab-nav">
                <button data-tab="home" class="nav-tab active"><span class="tab-icon">🏠</span> Home</button>
                <button data-tab="safety" class="nav-tab"><span class="tab-icon">🛡️</span> Safety</button>
                <button data-tab="theory" class="nav-tab"><span class="tab-icon">📖</span> Theory</button>
                <button data-tab="lab" class="nav-tab"><span class="tab-icon">🧪</span> Lab</button>
                <button data-tab="reference" class="nav-tab"><span class="tab-icon">📚</span> Reference</button>
                <button data-tab="progress" class="nav-tab"><span class="tab-icon">📈</span> My Progress</button>
            </div>
        </div>
    </nav>

    <main class="main-content">
        <div class="container">
            <!-- Home Tab -->
            <section id="tab-home" class="tab-section active">
                <div class="hero">
                    <div class="hero-inner">
                        <div class="hero-text">
                            <h1 class="hero-title">Welcome to ArcReady</h1>
                            <p class="hero-subtitle">Your electrical safety training platform.</p>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Safety Tab -->
            <section id="tab-safety" class="tab-section"></section>
            
            <!-- Theory Tab -->
            <section id="tab-theory" class="tab-section"></section>
            
            <!-- Lab Tab -->
            <section id="tab-lab" class="tab-section">
                <div class="tab-header tab-header--yellow">
                    <h1 class="tab-title">Virtual Lab</h1>
                    <p class="tab-subtitle">Interactive fault diagnosis and troubleshooting simulator</p>
                </div>

                <div class="circuit-selector">
                    <select id="circuit-select" class="form-input" style="width: auto;">
                        <option value="circuit-a">Circuit A - 3-Phase Motor Control</option>
                        <option value="circuit-b">Circuit B - 120VAC Parallel</option>
                    </select>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 id="circuit-title" class="section-title" style="margin: 0; border: none; padding: 0;">Circuit A - 480V 3-Phase Motor Control</h2>
                    <span id="current-fault-badge" class="result-badge result-badge--pass">Normal Operation</span>
                </div>

                <div class="lab-workspace">
                    <div class="circuit-panel">
                        <div class="circuit-panel-header">
                            <div class="circuit-panel-title">Schematic</div>
                            <div class="mode-controls">
                                <div class="lab-mode-toggle">
                                    <button id="btn-mode-guided" class="lab-mode-btn lab-mode-btn--active" data-lab-mode="guided">Guided Mode</button>
                                    <button id="btn-mode-challenge" class="lab-mode-btn" data-lab-mode="challenge">Challenge Mode</button>
                                </div>
                            </div>
                        </div>
                        <div class="circuit-display">
                            <div class="circuit-svg-container" id="circuit-svg-container" style="width: 100%;"></div>
                        </div>
                        <div class="probe-instructions">
                            <div class="probe-status">
                                <div class="probe-indicator"><span class="probe-dot probe-dot--red"></span> RED PROBE</div>
                                <div class="probe-indicator"><span class="probe-dot probe-dot--black"></span> BLACK PROBE</div>
                            </div>
                            <p class="probe-hint" id="lab-instruction-text">Select a circuit to begin. Click test points to place probes.</p>
                        </div>
                    </div>

                    <div class="multimeter-sidebar">
                        <div class="multimeter">
                            <div class="multimeter-brand">FLUK 117</div>
                            <div class="multimeter-display">
                                <div id="multimeter-reading" class="multimeter-reading">0.0</div>
                                <div id="multimeter-unit" class="multimeter-unit">V AC</div>
                            </div>
                            <div class="multimeter-leads">
                                <div class="lead lead--red">RED: <span id="probe-red-value">--</span></div>
                                <div class="lead lead--black">COM: <span id="probe-black-value">--</span></div>
                            </div>
                            <button id="probe-reset" class="btn multimeter-clear">Reset Probes</button>
                        </div>

                        <div class="fault-panel" id="fault-controls">
                            <div class="fault-panel-title">Instructor Controls</div>
                            <div class="fault-list">
                                <button data-fault="normal" class="fault-btn fault-btn--active">Normal</button>
                                <button data-fault="f1-blown" class="fault-btn">F1 Blown</button>
                                <button data-fault="f2-blown" class="fault-btn">F2 Blown</button>
                                <button data-fault="f3-blown" class="fault-btn">F3 Blown</button>
                                <button data-fault="ms-open" class="fault-btn">MS Open</button>
                                <button data-fault="ol-tripped" class="fault-btn">OL Tripped</button>
                            </div>
                        </div>

                        <div id="challenge-panel" class="fault-panel" style="display: none;">
                            <div class="fault-panel-title">Challenge Tasks</div>
                            <div class="challenge-stats" style="margin-bottom: 12px; font-size: 13px;">
                                <span id="challenge-probes-left" class="text-blue font-mono font-bold">8 probes left</span>
                                <span style="margin: 0 5px; color: #ccc;">|</span>
                                <span id="challenge-score" class="text-charcoal font-bold">Score: 0</span>
                            </div>
                            <select id="challenge-fault-select" class="form-input" style="width: 100%; margin-bottom: 12px; font-size: 12px; padding: 6px;">
                                <option value="">-- Diagnosis --</option>
                                <option value="f1-blown">F1 Blown</option>
                                <option value="f2-blown">F2 Blown</option>
                                <option value="f3-blown">F3 Blown</option>
                                <option value="ms-open">Motor Starter Open</option>
                                <option value="ol-tripped">Overload Tripped</option>
                            </select>
                            <button id="challenge-submit" class="btn btn-primary" style="width: 100%;">Submit Diagnosis</button>
                            <div id="challenge-result" style="margin-top: 10px; font-size: 13px;"></div>
                            <button id="challenge-restart" class="btn btn-outline" style="display: none; width: 100%; margin-top: 10px;">Restart Challenge</button>
                        </div>
                        
                        <div class="reading-history-panel" style="margin-top: 20px; background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px;">
                            <h3 style="margin-top: 0; font-size: 14px; color: #333; margin-bottom: 10px;">Reading History</h3>
                            <button id="clear-history" class="btn btn-outline" style="margin-bottom: 10px; font-size: 11px; padding: 4px 8px;">Clear History</button>
                            <div id="reading-history" class="reading-history" style="max-height: 200px; overflow-y: auto; font-size: 12px;"></div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Reference Tab -->
            <section id="tab-reference" class="tab-section"></section>
            
            <!-- Progress Tab -->
            <section id="tab-progress" class="tab-section"></section>
        </div>
    </main>
    
    <!-- Scripts (MUST load in correct order) -->
    <script src="js/standards.js"></script>
    <script src="js/svg-circuits.js"></script>
    <script src="js/ai-assistant.js"></script>
    <script src="js/test-engine.js"></script>
    <script src="js/reference.js"></script>
    <script src="js/progress.js"></script>
    <script src="js/app.js"></script>
    <script src="js/lab.js"></script>
</body>
</html>
"""

def render_mode(section, mode):
    display_style = 'style="display:none;"' if mode != 'study' else ''
    return f"""
        <!-- {mode.capitalize()} Mode -->
        <div id="{section}-{mode}-exam" {display_style} class="exam-panel" style="margin-top: 20px;">
            <div class="exam-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div id="{section}-{mode}-counter" class="exam-counter font-bold text-charcoal"></div>
                <div id="{section}-{mode}-timer" class="exam-timer font-mono text-red"></div>
                <button id="{section}-{mode}-flag" class="btn btn-outline flag-btn" onclick="window.ArcReady.TestEngine.toggleFlag('{section}','{mode}')" style="display:{'none' if mode=='study' else 'inline-block'}">&#x1F6A9; Flag</button>
            </div>
            <div class="progress-bar" style="margin-bottom: 20px;"><div id="{section}-{mode}-progress" class="progress-fill" style="width:0%"></div></div>
            <div id="{section}-{mode}-topic-badge" class="topic-badge" style="margin-bottom: 15px;"></div>
            <h3 id="{section}-{mode}-question" class="question-text" style="margin-bottom: 15px;"></h3>
            <div id="{section}-{mode}-img-wrap" style="display:none;" class="question-image"><img id="{section}-{mode}-img" src="" alt="Context" style="max-width:100%; height:auto;"/></div>
            <div id="{section}-{mode}-options" class="options-container" style="display: flex; flex-direction: column; gap: 10px;"></div>
            <div id="{section}-{mode}-explanation" class="explanation-box" style="display:none; margin-top: 15px; padding: 15px; background: #eef8ff; border-left: 4px solid #0056b3;"></div>
            
            <div class="exam-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                <button id="{section}-{mode}-prev" class="btn btn-secondary" style="display:{'none' if mode=='study' or mode=='certify' else 'inline-block'}" onclick="window.ArcReady.TestEngine.prevQuestion('{section}','{mode}')">&#x2190; Prev</button>
                <button id="{section}-{mode}-next" class="btn btn-primary" onclick="window.ArcReady.TestEngine.nextQuestion('{section}','{mode}')">Next &#x2192;</button>
                <button id="{section}-{mode}-submit" class="btn btn-danger" style="display:{'none' if mode=='study' else 'inline-block'}" onclick="window.ArcReady.TestEngine.submitExam('{section}','{mode}')">Submit Exam</button>
            </div>
        </div>
        <div id="{section}-{mode}-results" style="display:none;" class="results-panel" style="margin-top: 20px;"></div>
    """

def get_section(section):
    color = "red" if section == "safety" else "blue"
    desc = "NFPA 70E compliant electrical safety training." if section == "safety" else "Electrical theory and circuit fundamentals."
    return f"""
        <section id="tab-{section}" class="tab-section">
            <div class="tab-header tab-header--{color}">
                <h1 class="tab-title">{section.capitalize()} Section</h1>
                <p class="tab-subtitle">{desc}</p>
            </div>
            <div id="standards-selector-container" style="margin-bottom: 20px;"></div>
            
            <!-- Standard Selection -->
            <div class="standard-panel" style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 1.2rem; margin-right: 10px;">📋</span>
                    <h3 style="margin: 0; font-size: 1.1rem;">STUDY STANDARD</h3>
                </div>
                <p style="margin: 0 0 15px 0; color: #555;">Choose which standard to study and certify under.</p>
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div class="standard-card standard-card--active" data-standard="workplace" style="flex: 1; padding: 15px; border: 2px solid #CC0000; border-radius: 6px; cursor: pointer; background: #fdfdfd;">
                        <h4 style="margin: 0 0 5px 0; color: #CC0000;">Workplace Standards</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: #666;">Facility Safety Procedures</p>
                    </div>
                    <div class="standard-card" data-standard="nfpa" style="flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #eaeaea;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">NFPA 70E 2024</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: #666;">National Standard</p>
                    </div>
                </div>
                <div class="standard-desc" style="padding-left: 10px; border-left: 3px solid #CC0000; font-size: 0.95rem; color: #444;">
                    Uses enhanced workplace safety procedures including facility-specific LOTO protocols, hazardous energy control, and PPE requirements aligned with industrial facility standards.
                </div>
            </div>

            <!-- Mode Toggles (Tabs inside Section) -->
            <div class="mode-toggles" id="{section}-mode-toggle" style="margin-bottom: 20px; display: flex; gap: 10px;">
                <button class="mode-btn mode-btn--active btn btn-primary" data-section="{section}" data-mode="study">Study Mode</button>
                <button class="mode-btn btn btn-secondary" data-section="{section}" data-mode="practice">Practice Exam</button>
                <button class="mode-btn btn btn-secondary" data-section="{section}" data-mode="certify">Certification Exam</button>
            </div>

            <!-- Checkpoint UI (Used for Safety Certify) -->
            <div id="{section}-checkpoint-bar" class="checkpoint-bar" style="margin-bottom: 20px;"></div>

            <!-- Study Panel -->
            <div id="{section}-study" class="mode-content mode-content--active">
                <div id="{section}-study-start-screen" class="start-screen" style="margin-bottom: 20px;">
                    <select id="{section}-study-topic" class="form-input" style="width: auto; margin-right: 10px; display: inline-block;">
                        <option value="all">All Topics</option>
                    </select>
                    <button id="{section}-study-start" class="btn btn-primary">Start Study Mode</button>
                </div>
                <div id="{section}-study-area" style="display:none;">
                    {render_mode(section, 'study')}
                </div>
            </div>

            <!-- Practice Panel -->
            <div id="{section}-practice" class="mode-content">
                <div id="{section}-practice-start-screen" class="start-screen" style="margin-bottom: 20px;">
                    <button id="{section}-practice-begin" class="btn btn-secondary">Start Practice Exam</button>
                </div>
                {render_mode(section, 'practice')}
            </div>

            <!-- Certify Panel -->
            <div id="{section}-certify" class="mode-content">
                <div id="{section}-certify-start-screen" class="start-screen" style="margin-bottom: 20px;">
                    <button id="{section}-certify-begin" class="btn btn-danger">Start Certification Exam</button>
                </div>
                {render_mode(section, 'certify')}
            </div>

            <div id="{section}-results" style="display:none;" class="results-panel">
                <h2 id="{section}-results-title"></h2>
                <div id="{section}-results-score"></div>
                <div id="{section}-results-details"></div>
                <button class="btn btn-primary" onclick="window.location.reload()">Return to Dashboard</button>
            </div>
        </section>
    """

reference_html = """
        <section id="tab-reference" class="tab-section">
            <div class="tab-header tab-header--charcoal">
                <h1 class="tab-title">Reference Material</h1>
                <p class="tab-subtitle">Electrical formulas, symbols, and quick reference materials.</p>
            </div>
            <div class="reference-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                <div class="reference-card ref-open-btn" data-ref="symbols" tabindex="0" style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; cursor: pointer;">
                    <h3 style="margin-top: 0;">Symbols Glossary</h3>
                    <p>Electrical & schematic symbols</p>
                </div>
                <div class="reference-card ref-open-btn" data-ref="ohms" tabindex="0" style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; cursor: pointer;">
                    <h3 style="margin-top: 0;">Ohm's Law Calculator</h3>
                    <p>Calculate V, I, R, P</p>
                </div>
                <div class="reference-card ref-open-btn" data-ref="standards" tabindex="0" style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; cursor: pointer;">
                    <h3 style="margin-top: 0;">Standards Details</h3>
                    <p>NFPA / Workplace rules</p>
                </div>
            </div>
            <div id="ref-content-panel" style="display:none; margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-top: 4px solid #333; border-radius: 8px;" class="ref-panel">
                <button id="ref-close-btn" class="btn btn-secondary" style="float: right;">Close</button>
                <h3 id="ref-content-title" style="margin-top: 0;"></h3>
                <div id="ref-content-body"></div>
            </div>
        </section>
"""

progress_html = """
        <section id="tab-progress" class="tab-section">
            <div class="tab-header tab-header--charcoal">
                <h1 class="tab-title">My Progress</h1>
                <p class="tab-subtitle">Track your learning journey and certification status.</p>
            </div>
            
            <div class="progress-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                <div id="progress-safety-card" class="progress-cert-card" style="padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #cc0000;">Safety Certification</h3>
                    <div id="progress-safety-status" class="pcc-status" style="font-weight: bold; margin-bottom: 10px;">Not Started</div>
                    <div style="font-size: 14px;">Best Score: <span id="progress-safety-best">--</span></div>
                    <div style="font-size: 14px;">Attempts: <span id="progress-safety-attempts">0</span></div>
                </div>
                <div id="progress-theory-card" class="progress-cert-card" style="padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #0056b3;">Theory Certification</h3>
                    <div id="progress-theory-status" class="pcc-status" style="font-weight: bold; margin-bottom: 10px;">Locked</div>
                    <div style="font-size: 14px;">Best Score: <span id="progress-theory-best">--</span></div>
                    <div style="font-size: 14px;">Attempts: <span id="progress-theory-attempts">0</span></div>
                </div>
            </div>
            
            <div class="history-section" style="margin-top: 40px;">
                <h3 style="border-bottom: 2px solid #ccc; padding-bottom: 5px;">Exam History</h3>
                <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 15px; text-align: left; font-size: 14px;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Date</th>
                            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Section</th>
                            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Type</th>
                            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Score</th>
                            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Result</th>
                        </tr>
                    </thead>
                    <tbody id="exam-history-tbody"></tbody>
                </table>
            </div>

            <div class="weak-areas-section" style="margin-top: 40px;">
                <h3 style="border-bottom: 2px solid #ccc; padding-bottom: 5px;">Weak Areas (Below 80%)</h3>
                <div id="weak-areas-list" style="margin-top: 15px;"></div>
            </div>
            
            <!-- Removed Coach section since no coach JS is provided or working properly -->
        </section>
"""

ai_chat_html = """
    <!-- Floating AI Study Assistant -->
    <div id="ai-chat-bubble" class="ai-chat-bubble">
        <button id="ai-chat-toggle" class="ai-chat-toggle">&#x1F916;</button>
        <div id="ai-chat-panel" class="ai-chat-panel">
            <div id="ai-chat-header" class="ai-chat-header">ArcReady AI Assistant</div>
            <div id="ai-chat-messages" class="ai-chat-messages"></div>
            <div id="ai-chat-limit-banner" class="ai-limit-banner" style="display:none;"></div>
            <div id="ai-chat-input-row" class="ai-chat-input-row">
                <input type="text" id="ai-chat-input" placeholder="Ask a question..." />
                <button id="ai-chat-send" class="btn btn-primary">Send</button>
            </div>
        </div>
    </div>
"""

# Assemble full HTML
html = base_html.replace('<section id="tab-safety" class="tab-section"></section>', get_section("safety"))
html = html.replace('<section id="tab-theory" class="tab-section"></section>', get_section("theory"))
html = html.replace('<section id="tab-reference" class="tab-section"></section>', reference_html)
html = html.replace('<section id="tab-progress" class="tab-section"></section>', progress_html)
html = html.replace('</body>', ai_chat_html + '\n</body>')

with open('index.html', 'w') as f:
    f.write(html)
print("index.html fully rebuilt.")
