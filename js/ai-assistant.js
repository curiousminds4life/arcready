/**
 * ArcReady AI Assistant - Client Logic
 * Handles the interaction with the AI proxy and managing AI responses.
 */

class ArcReadyAI {
    constructor() {
        this.container = document.getElementById('ai-assistant-container');
        this.messagesContainer = document.getElementById('ai-messages');
        this.input = document.getElementById('ai-query');
        this.sendBtn = document.getElementById('ai-send');
        this.toggle = document.getElementById('ai-toggle');
        this.isCollapsed = true;
        
        this.init();
    }

    init() {
        this.toggle.addEventListener('click', () => this.toggleCollapse());
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });

        // Add initial message
        this.addMessage('assistant', 'Hello! I am your ArcReady AI coach. How can I help you master electrical theory or safety today?');
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.container.classList.toggle('collapsed', this.isCollapsed);
        const icon = this.toggle.querySelector('.toggle-icon');
        icon.classList.toggle('fa-chevron-up', this.isCollapsed);
        icon.classList.toggle('fa-chevron-down', !this.isCollapsed);
    }

    async handleSendMessage() {
        const query = this.input.value.trim();
        if (!query) return;

        this.addMessage('user', query);
        this.input.value = '';
        
        // Show typing indicator
        const typingId = this.addTypingIndicator();

        try {
            const response = await this.fetchAIResponse(query);
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', response);
        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', 'Sorry, I encountered an error connecting to the neural core. Please try again.');
            console.error('AI Error:', error);
        }
    }

    addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${role}`;
        msgDiv.innerHTML = `<div class=\"text\">${this.formatText(text)}</div>`;
        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const indicator = document.createElement('div');
        indicator.id = id;
        indicator.className = 'ai-message assistant typing';
        indicator.innerHTML = '<div class=\"dots\"><span>.</span><span>.</span><span>.</span></div>';
        this.messagesContainer.appendChild(indicator);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return id;
    }

    removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    formatText(text) {
        // Simple markdown-ish formatting
        return text
            .replace(/\\n/g, '<br>')
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    async fetchAIResponse(query) {
        // In a real app, this would call ai-proxy.php
        // For development, we'll simulate or call the proxy if configured
        try {
            const response = await fetch('ai-proxy.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'chat',
                    query: query,
                    context: this.getAppContext()
                })
            });
            
            if (!response.ok) throw new Error('Proxy error');
            const data = await response.json();
            return data.response;
        } catch (e) {
            // Mock response if proxy fails/missing
            return \"I'm currently in offline mode, but I can tell you that Ohm's Law (E=IR) is fundamental to everything we do here. Try practicing in the Lab tab!\";
        }
    }

    getAppContext() {
        return {
            currentTab: document.querySelector('.nav-item.active').dataset.tab,
            standard: localStorage.getItem('arcready_standard') || 'workplace',
            progress: localStorage.getItem('arcready_progress') || '0'
        };
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    window.arcreadyAI = new ArcReadyAI();
});
