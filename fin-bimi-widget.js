/**
 * B!Mi Widget — Assistant KERN
 * Widget global flottant avec accès OpenAI
 * 
 * Usage: Inclure ce script + bimi-context.js dans n'importe quelle page KERN
 * <script src="bimi-context.js"></script>
 * <script src="bimi-widget.js"></script>
 */

(function() {
    'use strict';
    
    // =====================================================
    // CONFIGURATION
    // =====================================================
    const CONFIG = {
        MODEL: 'gpt-4o-mini',
        MAX_TOKENS: 500,
        TEMPERATURE: 0.7,
        API_URL: 'https://api.openai.com/v1/chat/completions',
        STORAGE_KEY: 'bimi_api_key',
        HISTORY_KEY: 'bimi_history'
    };
    
    // =====================================================
    // STATE
    // =====================================================
    let isOpen = false;
    let isLoading = false;
    let conversationHistory = [];
    
    // =====================================================
    // STYLES
    // =====================================================
    const STYLES = `
        #bimi-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            transition: all 0.3s ease;
        }
        
        #bimi-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(99, 102, 241, 0.6);
        }
        
        #bimi-fab.has-key {
            background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
            box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4);
        }
        
        #bimi-panel {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 380px;
            max-height: 500px;
            background: #12121a;
            border-radius: 16px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            z-index: 9998;
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        #bimi-panel.open {
            display: flex;
            animation: bimiSlideUp 0.3s ease;
        }
        
        @keyframes bimiSlideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        #bimi-header {
            padding: 16px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        #bimi-header h3 {
            margin: 0;
            color: #fff;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        #bimi-header h3 span {
            font-size: 1.3rem;
        }
        
        .bimi-header-actions {
            display: flex;
            gap: 8px;
        }
        
        .bimi-header-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #888;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        
        .bimi-header-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
        }
        
        #bimi-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 300px;
        }
        
        .bimi-message {
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 0.9rem;
            line-height: 1.5;
            max-width: 85%;
        }
        
        .bimi-message.assistant {
            background: rgba(99, 102, 241, 0.15);
            color: #e0e0e0;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }
        
        .bimi-message.user {
            background: rgba(74, 222, 128, 0.15);
            color: #e0e0e0;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        
        .bimi-message.error {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
        }
        
        .bimi-message code {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85em;
        }
        
        .bimi-message pre {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 8px 0;
        }
        
        .bimi-message pre code {
            background: none;
            padding: 0;
        }
        
        #bimi-input-area {
            padding: 12px 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 8px;
        }
        
        #bimi-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 10px 14px;
            color: #fff;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s;
        }
        
        #bimi-input:focus {
            border-color: #6366f1;
        }
        
        #bimi-input::placeholder {
            color: #666;
        }
        
        #bimi-send {
            background: #6366f1;
            border: none;
            color: #fff;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
        }
        
        #bimi-send:hover {
            background: #5558e3;
        }
        
        #bimi-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        #bimi-suggestions {
            padding: 12px 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .bimi-suggestion {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #888;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .bimi-suggestion:hover {
            background: rgba(99, 102, 241, 0.2);
            border-color: #6366f1;
            color: #fff;
        }
        
        #bimi-setup {
            padding: 20px;
            text-align: center;
        }
        
        #bimi-setup p {
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 16px;
        }
        
        #bimi-api-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            color: #fff;
            font-size: 0.9rem;
            margin-bottom: 12px;
            outline: none;
        }
        
        #bimi-save-key {
            background: #4ade80;
            border: none;
            color: #000;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            width: 100%;
        }
        
        .bimi-typing {
            display: flex;
            gap: 4px;
            padding: 8px 12px;
        }
        
        .bimi-typing span {
            width: 8px;
            height: 8px;
            background: #6366f1;
            border-radius: 50%;
            animation: bimiTyping 1.4s infinite;
        }
        
        .bimi-typing span:nth-child(2) { animation-delay: 0.2s; }
        .bimi-typing span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes bimiTyping {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-8px); opacity: 1; }
        }
        
        @media (max-width: 480px) {
            #bimi-panel {
                width: calc(100vw - 32px);
                right: 16px;
                bottom: 90px;
            }
        }
    `;
    
    // =====================================================
    // HELPERS
    // =====================================================
    
    function getApiKey() {
        return localStorage.getItem(CONFIG.STORAGE_KEY);
    }
    
    function setApiKey(key) {
        localStorage.setItem(CONFIG.STORAGE_KEY, key);
    }
    
    function clearApiKey() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
    
    function formatMessage(text) {
        // Basic markdown-like formatting
        return text
            .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }
    
    // =====================================================
    // API CALL
    // =====================================================
    
    async function callOpenAI(userMessage) {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('Clé API non configurée');
        }
        
        // Build messages array
        const messages = [
            {
                role: 'system',
                content: BIMI_CONTEXT + '\n\nRéponds de manière concise et utile. Utilise le français. Si tu montres du code, garde-le court.'
            },
            ...conversationHistory.slice(-6), // Keep last 6 messages for context
            {
                role: 'user',
                content: userMessage
            }
        ];
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: messages,
                max_tokens: CONFIG.MAX_TOKENS,
                temperature: CONFIG.TEMPERATURE
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('Clé API invalide. Vérifie ta clé OpenAI.');
            }
            throw new Error(error.error?.message || `Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    // =====================================================
    // UI
    // =====================================================
    
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = STYLES;
        document.head.appendChild(style);
    }
    
    function createWidget() {
        // FAB Button
        const fab = document.createElement('button');
        fab.id = 'bimi-fab';
        fab.innerHTML = '🤖';
        fab.title = 'B!Mi — Assistant KERN';
        fab.onclick = togglePanel;
        
        if (getApiKey()) {
            fab.classList.add('has-key');
        }
        
        // Panel
        const panel = document.createElement('div');
        panel.id = 'bimi-panel';
        panel.innerHTML = `
            <div id="bimi-header">
                <h3><span>🤖</span> B!Mi</h3>
                <div class="bimi-header-actions">
                    <button class="bimi-header-btn" onclick="BIMI.clearHistory()" title="Effacer l'historique">🗑️</button>
                    <button class="bimi-header-btn" onclick="BIMI.showSettings()" title="Paramètres">⚙️</button>
                    <button class="bimi-header-btn" onclick="BIMI.toggle()" title="Fermer">✕</button>
                </div>
            </div>
            <div id="bimi-content">
                ${getApiKey() ? getChatUI() : getSetupUI()}
            </div>
        `;
        
        document.body.appendChild(fab);
        document.body.appendChild(panel);
    }
    
    function getChatUI() {
        return `
            <div id="bimi-messages">
                <div class="bimi-message assistant">
                    Salut ! Je suis <strong>B!Mi</strong>, ton assistant KERN. 🤖<br><br>
                    Je connais toute la documentation. Pose-moi tes questions !
                </div>
            </div>
            <div id="bimi-suggestions">
                <span class="bimi-suggestion" onclick="BIMI.ask('Comment importer mes données ?')">Import données</span>
                <span class="bimi-suggestion" onclick="BIMI.ask('Structure d\\'un dossier ?')">Dossiers</span>
                <span class="bimi-suggestion" onclick="BIMI.ask('Clés localStorage ?')">localStorage</span>
                <span class="bimi-suggestion" onclick="BIMI.ask('Mon import plante, aide-moi')">Debug</span>
            </div>
            <div id="bimi-input-area">
                <input type="text" id="bimi-input" placeholder="Pose ta question..." onkeypress="if(event.key==='Enter')BIMI.send()">
                <button id="bimi-send" onclick="BIMI.send()">→</button>
            </div>
        `;
    }
    
    function getSetupUI() {
        return `
            <div id="bimi-setup">
                <p>Pour utiliser B!Mi, entre ta clé API OpenAI.<br>
                <small style="color:#666">Utilise GPT-4o-mini (~$0.001/requête)</small></p>
                <input type="password" id="bimi-api-input" placeholder="sk-...">
                <button id="bimi-save-key" onclick="BIMI.saveKey()">💾 Enregistrer</button>
                <p style="margin-top:16px;font-size:0.75rem;color:#666">
                    Ta clé reste en local.<br>
                    <a href="https://platform.openai.com/api-keys" target="_blank" style="color:#6366f1">Obtenir une clé →</a>
                </p>
            </div>
        `;
    }
    
    function togglePanel() {
        const panel = document.getElementById('bimi-panel');
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        
        if (isOpen) {
            const input = document.getElementById('bimi-input');
            if (input) setTimeout(() => input.focus(), 100);
        }
    }
    
    function addMessage(content, role) {
        const messages = document.getElementById('bimi-messages');
        if (!messages) return;
        
        const msg = document.createElement('div');
        msg.className = `bimi-message ${role}`;
        msg.innerHTML = formatMessage(content);
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        
        // Save to history
        conversationHistory.push({ role, content });
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
    }
    
    function showTyping() {
        const messages = document.getElementById('bimi-messages');
        if (!messages) return;
        
        const typing = document.createElement('div');
        typing.id = 'bimi-typing';
        typing.className = 'bimi-message assistant';
        typing.innerHTML = '<div class="bimi-typing"><span></span><span></span><span></span></div>';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
    }
    
    function hideTyping() {
        const typing = document.getElementById('bimi-typing');
        if (typing) typing.remove();
    }
    
    async function sendMessage(text) {
        if (!text || isLoading) return;
        
        const input = document.getElementById('bimi-input');
        const sendBtn = document.getElementById('bimi-send');
        
        if (input) input.value = '';
        if (sendBtn) sendBtn.disabled = true;
        isLoading = true;
        
        addMessage(text, 'user');
        showTyping();
        
        try {
            const response = await callOpenAI(text);
            hideTyping();
            addMessage(response, 'assistant');
        } catch (error) {
            hideTyping();
            addMessage(`❌ ${error.message}`, 'error');
        }
        
        isLoading = false;
        if (sendBtn) sendBtn.disabled = false;
        if (input) input.focus();
    }
    
    function saveApiKey() {
        const input = document.getElementById('bimi-api-input');
        if (!input || !input.value.trim()) return;
        
        const key = input.value.trim();
        if (!key.startsWith('sk-')) {
            alert('Clé invalide. Elle doit commencer par "sk-"');
            return;
        }
        
        setApiKey(key);
        
        // Update UI
        document.getElementById('bimi-content').innerHTML = getChatUI();
        document.getElementById('bimi-fab').classList.add('has-key');
    }
    
    function showSettings() {
        const content = document.getElementById('bimi-content');
        content.innerHTML = `
            <div id="bimi-setup">
                <p>Clé API actuelle : <code>sk-...${getApiKey()?.slice(-4) || '???'}</code></p>
                <button id="bimi-save-key" onclick="BIMI.removeKey()" style="background:#ef4444;color:#fff;margin-bottom:12px">
                    🗑️ Supprimer la clé
                </button>
                <button id="bimi-save-key" onclick="BIMI.backToChat()" style="background:#333;color:#fff">
                    ← Retour au chat
                </button>
            </div>
        `;
    }
    
    function removeKey() {
        if (confirm('Supprimer ta clé API ?')) {
            clearApiKey();
            document.getElementById('bimi-content').innerHTML = getSetupUI();
            document.getElementById('bimi-fab').classList.remove('has-key');
            conversationHistory = [];
        }
    }
    
    function backToChat() {
        document.getElementById('bimi-content').innerHTML = getChatUI();
    }
    
    function clearHistory() {
        conversationHistory = [];
        const messages = document.getElementById('bimi-messages');
        if (messages) {
            messages.innerHTML = `
                <div class="bimi-message assistant">
                    Historique effacé ! On repart à zéro. 🧹
                </div>
            `;
        }
    }
    
    // =====================================================
    // INIT
    // =====================================================
    
    function init() {
        // Check if BIMI_CONTEXT is loaded
        if (typeof BIMI_CONTEXT === 'undefined') {
            console.error('B!Mi: bimi-context.js doit être chargé avant bimi-widget.js');
            return;
        }
        
        injectStyles();
        createWidget();
        
        console.log('🤖 B!Mi ready');
    }
    
    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // =====================================================
    // PUBLIC API
    // =====================================================
    
    window.BIMI = {
        toggle: togglePanel,
        send: () => sendMessage(document.getElementById('bimi-input')?.value),
        ask: sendMessage,
        saveKey: saveApiKey,
        removeKey: removeKey,
        showSettings: showSettings,
        backToChat: backToChat,
        clearHistory: clearHistory
    };
    
})();
