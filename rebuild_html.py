#!/usr/bin/env python3
import os
import re

def rebuild_html():
    \"\"\"Rebuilds index.html with dynamic components and the latest UI enhancements.\"\"\"
    
    # Path to the base template and output file
    # In this case, we'll just define the structural components here
    
    html_content = \"\"\"<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>ArcReady | Electrical Safety & Theory Training</title>
    <link rel=\"stylesheet\" href=\"css/main.css\">
    <link rel=\"stylesheet\" href=\"css/ai.css\">
    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">
    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>
    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap\" rel=\"stylesheet\">
    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">
</head>
<body>
    <!-- Floating Logo -->
    <div id=\"floating-logo-container\">
        <div class=\"logo-glow\"></div>
        <svg id=\"floating-logo\" viewBox=\"0 0 100 100\">
            <circle cx=\"50\" cy=\"50\" r=\"45\" fill=\"none\" stroke=\"var(--accent-primary)\" stroke-width=\"2\" />
            <path d=\"M50 15 L50 85 M15 50 L85 50\" stroke=\"var(--accent-primary)\" stroke-width=\"1\" opacity=\"0.3\" />
            <path d=\"M30 30 L70 70 M70 30 L30 70\" stroke=\"var(--accent-primary)\" stroke-width=\"1\" opacity=\"0.3\" />
            <path d=\"M50 25 L65 50 L50 75 L35 50 Z\" fill=\"var(--accent-primary)\">
                <animate attributeName=\"opacity\" values=\"0.5;1;0.5\" dur=\"3s\" repeatCount=\"indefinite\" />
            </path>
            <circle cx=\"50\" cy=\"50\" r=\"8\" fill=\"#fff\" />
        </svg>
    </div>

    <!-- Main Navigation -->
    <nav class=\"main-nav\">
        <div class=\"nav-container\">
            <div class=\"nav-logo\">
                <span class=\"logo-text\">Arc<span class=\"accent\">Ready</span></span>
            </div>
            <div class=\"nav-links\">
                <a href=\"#\" class=\"nav-item active\" data-tab=\"home\"><i class=\"fas fa-home\"></i> Home</a>
                <a href=\"#\" class=\"nav-item\" data-tab=\"theory\"><i class=\"fas fa-book\"></i> Theory</a>
                <a href=\"#\" class=\"nav-item\" data-tab=\"safety\"><i class=\"fas fa-shield-halved\"></i> Safety</a>
                <a href=\"#\" class=\"nav-item\" data-tab=\"lab\"><i class=\"fas fa-flask\"></i> Lab</a>
                <a href=\"#\" class=\"nav-item\" data-tab=\"history\"><i class=\"fas fa-history\"></i> History</a>
            </div>
            <div class=\"nav-controls\">
                <div class=\"standard-toggle\" id=\"standard-toggle\">
                    <span class=\"standard-label\" id=\"standard-display\">Workplace</span>
                    <i class=\"fas fa-chevron-down\"></i>
                </div>
            </div>
        </div>
    </nav>

    <!-- App Content Wrapper -->
    <main class=\"app-container\">
        <!-- Home / Dashboard Tab -->
        <section id=\"tab-home\" class=\"tab-content active\">
            <div class=\"hero-section\">
                <h1>Master Electrical <span class=\"accent\">Excellence</span></h1>
                <p>Advanced certification prep and virtual laboratory for industrial electrical professionals.</p>
                <div class=\"hero-stats\">
                    <div class=\"stat-pill\">
                        <span class=\"stat-label\">Overall Progress</span>
                        <div class=\"stat-bar-container\">
                            <div class=\"stat-bar\" id=\"overall-progress-bar\" style=\"width: 0%\"></div>
                        </div>
                        <span class=\"stat-value\" id=\"overall-progress-text\">0%</span>
                    </div>
                </div>
            </div>

            <!-- Quick Access Dashboard Cards -->
            <div class=\"dashboard-grid\">
                <div class=\"dashboard-card action-card\" data-action=\"start-safety\">
                    <div class=\"card-icon\"><i class=\"fas fa-shield-virus\"></i></div>
                    <div class=\"card-info\">
                        <h3>Safety Certification</h3>
                        <p>Complete safety modules and earn your digital badge.</p>
                    </div>
                    <div class=\"card-arrow\"><i class=\"fas fa-arrow-right\"></i></div>
                </div>

                <div class=\"dashboard-card action-card\" data-action=\"start-theory\">
                    <div class=\"card-icon\"><i class=\"fas fa-lightbulb\"></i></div>
                    <div class=\"card-info\">
                        <h3>Electrical Theory</h3>
                        <p>Master Ohm's Law, three-phase power, and schematics.</p>
                    </div>
                    <div class=\"card-arrow\"><i class=\"fas fa-arrow-right\"></i></div>
                </div>

                <div class=\"dashboard-card action-card\" data-action=\"open-lab\">
                    <div class=\"card-icon\"><i class=\"fas fa-microscope\"></i></div>
                    <div class=\"card-info\">
                        <h3>Virtual Lab</h3>
                        <p>Practice troubleshooting on interactive SVG schematics.</p>
                    </div>
                    <div class=\"card-arrow\"><i class=\"fas fa-arrow-right\"></i></div>
                </div>

                <div class=\"dashboard-card action-card\" data-action=\"ai-coach\">
                    <div class=\"card-icon\"><i class=\"fas fa-robot\"></i></div>
                    <div class=\"card-info\">
                        <h3>Weak Area Coach</h3>
                        <p>Let AI analyze your performance and suggest focus areas.</p>
                    </div>
                    <div class=\"card-arrow\"><i class=\"fas fa-arrow-right\"></i></div>
                </div>
            </div>
        </section>

        <!-- Theory Tab -->
        <section id=\"tab-theory\" class=\"tab-content\">
            <div class=\"tab-header\">
                <h2>Electrical Theory</h2>
                <div class=\"mode-selector\">
                    <button class=\"mode-btn active\" data-mode=\"study\">Study</button>
                    <button class=\"mode-btn\" data-mode=\"practice\">Practice</button>
                    <button class=\"mode-btn\" data-mode=\"exam\">Exam</button>
                </div>
            </div>
            <div id=\"theory-viewport\" class=\"test-viewport\">
                <!-- Content injected by JS -->
            </div>
        </section>

        <!-- Safety Tab -->
        <section id=\"tab-safety\" class=\"tab-content\">
            <div class=\"tab-header\">
                <h2>Safety Standards</h2>
                <div class=\"mode-selector\">
                    <button class=\"mode-btn active\" data-mode=\"study\">Study</button>
                    <button class=\"mode-btn\" data-mode=\"practice\">Practice</button>
                    <button class=\"mode-btn\" data-mode=\"exam\">Exam</button>
                </div>
            </div>
            <div id=\"safety-viewport\" class=\"test-viewport\">
                <!-- Content injected by JS -->
            </div>
        </section>

        <!-- Lab Tab -->
        <section id=\"tab-lab\" class=\"tab-content\">
            <div class=\"lab-layout\">
                <div class=\"lab-sidebar\">
                    <h3>Component Library</h3>
                    <div class=\"component-list\" id=\"lab-components\">
                        <!-- Categorized list of components -->
                    </div>
                </div>
                <div class=\"lab-main\">
                    <div class=\"lab-controls\">
                        <button id=\"lab-reset\"><i class=\"fas fa-undo\"></i> Reset</button>
                        <button id=\"lab-multimeter\"><i class=\"fas fa-vial\"></i> Multimeter</button>
                    </div>
                    <div id=\"lab-canvas\" class=\"schematic-container\">
                        <!-- SVG schematics injected here -->
                    </div>
                </div>
            </div>
        </section>

        <!-- History Tab -->
        <section id=\"tab-history\" class=\"tab-content\">
            <h2>Performance Analytics</h2>
            <div id=\"history-viewport\">
                <!-- Performance charts and logs -->
            </div>
        </section>
    </main>

    <!-- AI Overlay / Assistant -->
    <div id=\"ai-assistant-container\" class=\"collapsed\">
        <div class=\"ai-header\" id=\"ai-toggle\">
            <div class=\"ai-avatar\">
                <i class=\"fas fa-brain\"></i>
            </div>
            <div class=\"ai-title\">
                <span class=\"ai-name\">ArcReady AI</span>
                <span class=\"ai-status\">Online</span>
            </div>
            <i class=\"fas fa-chevron-up toggle-icon\"></i>
        </div>
        <div class=\"ai-body\">
            <div id=\"ai-messages\"></div>
            <div class=\"ai-input-area\">
                <input type=\"text\" id=\"ai-query\" placeholder=\"Ask about electrical theory or safety...\">
                <button id=\"ai-send\"><i class=\"fas fa-paper-plane\"></i></button>
            </div>
        </div>
    </div>

    <!-- Multi-Standard Modal -->
    <div id=\"standard-modal\" class=\"modal-overlay\">
        <div class=\"modal-content\">
            <h3>Select Professional Standard</h3>
            <p>Switching standards will update terminology and specific code requirements.</p>
            <div class=\"standard-options\">
                <div class=\"standard-card active\" data-std=\"workplace\">
                    <h4>Workplace Safety</h4>
                    <p>Internal corporate electrical safety manual (ESM).</p>
                    <div class=\"std-badge\">HRC System</div>
                </div>
                <div class=\"standard-card\" data-std=\"nfpa\">
                    <h4>NFPA 70E (2024)</h4>
                    <p>National consensus standard for electrical safety.</p>
                    <div class=\"std-badge\">PPE Categories</div>
                </div>
            </div>
            <button class=\"modal-close\">Confirm</button>
        </div>
    </div>

    <!-- Scripts -->
    <script src=\"js/standards.js\"></script>
    <script src=\"js/progress.js\"></script>
    <script src=\"js/test-engine.js\"></script>
    <script src=\"js/lab.js\"></script>
    <script src=\"js/svg-circuits.js\"></script>
    <script src=\"js/ai-assistant.js\"></script>
    <script src=\"js/app.js\"></script>
</body>
</html>
\"\"\"

    with open(\"index.html\", \"w\") as f:
        f.write(html_content)
    
    print(\"Successfully rebuilt index.html with latest components.\")

if __name__ == \"__main__\":
    rebuild_html()
