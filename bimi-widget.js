/**
 * B!Mi Widget v2 — Assistant KERN
 * 
 * Architecture à deux niveaux :
 * 1. FAQ offline (gratuit, instantané)
 * 2. OpenAI (optionnel, si FAQ ne trouve pas)
 * 
 * Usage:
 * <script src="bimi-faq.js"></script>
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
        STORAGE_KEY: 'bimi_api_key'
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
        
        #bimi-panel {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 400px;
            max-height: 550px;
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
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        #bimi-header {
            padding: 14px 16px;
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
        
        .bimi-mode-badge {
            font-size: 0.65rem;
            padding: 2px 8px;
            border-radius: 10px;
            background: rgba(99, 102, 241, 0.3);
            color: #a5b4fc;
        }
        
        .bimi-mode-badge.ai {
            background: rgba(74, 222, 128, 0.3);
            color: #86efac;
        }
        
        .bimi-header-actions {
            display: flex;
            gap: 6px;
        }
        
        .bimi-header-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #888;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
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
            max-height: 350px;
        }
        
        .bimi-message {
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 0.88rem;
            line-height: 1.6;
            max-width: 90%;
        }
        
        .bimi-message.assistant {
            background: rgba(99, 102, 241, 0.12);
            color: #e0e0e0;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }
        
        .bimi-message.assistant.ai {
            background: rgba(74, 222, 128, 0.12);
            border-left: 3px solid #4ade80;
        }
        
        .bimi-message.user {
            background: rgba(255, 255, 255, 0.08);
            color: #e0e0e0;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        
        .bimi-message.system {
            background: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
            font-size: 0.8rem;
            text-align: center;
            align-self: center;
            padding: 8px 16px;
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
            font-size: 0.8em;
        }
        
        .bimi-message pre code {
            background: none;
            padding: 0;
        }
        
        .bimi-message strong {
            color: #fff;
        }
        
        .bimi-message table {
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 0.8em;
            width: 100%;
        }
        
        .bimi-message th, .bimi-message td {
            border: 1px solid rgba(255,255,255,0.1);
            padding: 4px 8px;
            text-align: left;
        }
        
        .bimi-message th {
            background: rgba(0,0,0,0.2);
        }
        
        .bimi-escalate {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .bimi-escalate-btn {
            background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
            border: none;
            color: #000;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 600;
            width: 100%;
        }
        
        .bimi-escalate-btn:hover {
            opacity: 0.9;
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
            color: #555;
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
            padding: 10px 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .bimi-suggestion {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #888;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.72rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .bimi-suggestion:hover {
            background: rgba(99, 102, 241, 0.2);
            border-color: #6366f1;
            color: #fff;
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
                max-height: 70vh;
            }
        }
    `;
    
    // =====================================================
    // HELPERS
    // =====================================================
    
    function getApiKey() {
        return localStorage.getItem(CONFIG.STORAGE_KEY);
    }
    
    function hasApiKey() {
        return !!getApiKey();
    }
    
    function formatMessage(text) {
        return text
            .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }
    
    // =====================================================
    // OPENAI API
    // =====================================================
    
    async function callOpenAI(userMessage) {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error('Clé API non configurée');
        
        const messages = [
            {
                role: 'system',
                content: (typeof BIMI_CONTEXT !== 'undefined' ? BIMI_CONTEXT : '') + 
                    '\n\nRéponds de manière concise et utile en français. Tu es B!Mi, assistant KERN.'
            },
            ...conversationHistory.slice(-4),
            { role: 'user', content: userMessage }
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
            if (response.status === 401) throw new Error('Clé API invalide');
            if (response.status === 429) throw new Error('Limite de requêtes atteinte');
            throw new Error(`Erreur API: ${response.status}`);
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
        const fab = document.createElement('button');
        fab.id = 'bimi-fab';
        fab.innerHTML = '🤖';
        fab.title = 'B!Mi — Assistant KERN';
        fab.onclick = togglePanel;
        
        const panel = document.createElement('div');
        panel.id = 'bimi-panel';
        panel.innerHTML = `
            <div id="bimi-header">
                <h3>
                    <span>🤖</span> B!Mi
                    <span class="bimi-mode-badge" id="bimi-mode">FAQ</span>
                </h3>
                <div class="bimi-header-actions">
                    <button class="bimi-header-btn" onclick="BIMI.clearChat()" title="Nouveau chat">🗑️</button>
                    <button class="bimi-header-btn" onclick="window.open('bimi-config.html')" title="Config OpenAI">⚙️</button>
                    <button class="bimi-header-btn" onclick="BIMI.toggle()" title="Fermer">✕</button>
                </div>
            </div>
            <div id="bimi-messages">
                <div class="bimi-message assistant">
                    Salut ! Je suis <strong>B!Mi</strong>, ton assistant KERN. 🤖<br><br>
                    Je connais la doc par cœur. Pose ta question !
                </div>
            </div>
            <div id="bimi-suggestions">
                <span class="bimi-suggestion" onclick="BIMI.ask('C\\'est quoi KERN ?')">C'est quoi KERN ?</span>
                <span class="bimi-suggestion" onclick="BIMI.ask('Comment importer mes données ?')">Import données</span>
                <span class="bimi-suggestion" onclick="BIMI.ask('Mon import plante')">Debug import</span>
                <span class="bimi-suggestion" onclick="BIMI.ask('Clés localStorage')">localStorage</span>
            </div>
            <div id="bimi-input-area">
                <input type="text" id="bimi-input" placeholder="Pose ta question..." onkeypress="if(event.key==='Enter')BIMI.send()">
                <button id="bimi-send" onclick="BIMI.send()">→</button>
            </div>
        `;
        
        document.body.appendChild(fab);
        document.body.appendChild(panel);
    }
    
    function togglePanel() {
        const panel = document.getElementById('bimi-panel');
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        if (isOpen) {
            setTimeout(() => document.getElementById('bimi-input')?.focus(), 100);
        }
    }
    
    function addMessage(content, type, isAI = false) {
        const messages = document.getElementById('bimi-messages');
        if (!messages) return;
        
        const msg = document.createElement('div');
        msg.className = `bimi-message ${type}` + (isAI ? ' ai' : '');
        msg.innerHTML = formatMessage(content);
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }
    
    function addEscalateOption(query) {
        if (!hasApiKey()) return;
        
        const messages = document.getElementById('bimi-messages');
        const lastMsg = messages.lastElementChild;
        
        const escalate = document.createElement('div');
        escalate.className = 'bimi-escalate';
        escalate.innerHTML = `
            <button class="bimi-escalate-btn" onclick="BIMI.askAI('${query.replace(/'/g, "\\'")}')">
                🧠 Demander à l'IA (OpenAI)
            </button>
        `;
        lastMsg.appendChild(escalate);
    }
    
    function showTyping() {
        const messages = document.getElementById('bimi-messages');
        const typing = document.createElement('div');
        typing.id = 'bimi-typing';
        typing.className = 'bimi-message assistant';
        typing.innerHTML = '<div class="bimi-typing"><span></span><span></span><span></span></div>';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
    }
    
    function hideTyping() {
        document.getElementById('bimi-typing')?.remove();
    }
    
    function updateModeBadge(mode) {
        const badge = document.getElementById('bimi-mode');
        if (badge) {
            badge.textContent = mode;
            badge.className = 'bimi-mode-badge' + (mode === 'AI' ? ' ai' : '');
        }
    }
    
    // =====================================================
    // MESSAGE HANDLING
    // =====================================================
    
    async function handleMessage(text) {
        if (!text || isLoading) return;
        
        document.getElementById('bimi-input').value = '';
        addMessage(text, 'user');
        
        // Try FAQ first
        const faqResult = typeof searchFAQ === 'function' ? searchFAQ(text) : { found: false };
        
        if (faqResult.found) {
            updateModeBadge('FAQ');
            addMessage(faqResult.answer, 'assistant');
            if (hasApiKey()) addEscalateOption(text);
        } else {
            let notFoundMsg = "🤔 Je n'ai pas trouvé de réponse précise dans ma base.";
            
            if (faqResult.suggestions?.length) {
                notFoundMsg += "\n\n**Essaye plutôt :**\n• " + faqResult.suggestions.join('\n• ');
            }
            
            if (hasApiKey()) {
                notFoundMsg += "\n\n💡 Clique ci-dessous pour une réponse IA.";
            } else {
                notFoundMsg += "\n\n💡 Configure OpenAI (⚙️) pour des réponses avancées.";
            }
            
            addMessage(notFoundMsg, 'assistant');
            if (hasApiKey()) addEscalateOption(text);
        }
        
        conversationHistory.push({ role: 'user', content: text });
    }
    
    async function askAI(text) {
        if (!text || isLoading || !hasApiKey()) return;
        
        document.getElementById('bimi-send').disabled = true;
        isLoading = true;
        
        updateModeBadge('AI');
        showTyping();
        
        try {
            const response = await callOpenAI(text);
            hideTyping();
            addMessage(response, 'assistant', true);
            conversationHistory.push({ role: 'assistant', content: response });
        } catch (error) {
            hideTyping();
            addMessage(`❌ ${error.message}`, 'system');
        }
        
        isLoading = false;
        document.getElementById('bimi-send').disabled = false;
    }
    
    function clearChat() {
        conversationHistory = [];
        const messages = document.getElementById('bimi-messages');
        if (messages) {
            messages.innerHTML = `
                <div class="bimi-message assistant">
                    Chat effacé ! 🧹 Pose ta question !
                </div>
            `;
        }
        updateModeBadge('FAQ');
    }
    
    // =====================================================
    // INIT
    // =====================================================
    
    function init() {
        injectStyles();
        createWidget();
        console.log('🤖 B!Mi v2 ready (FAQ-first)');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.BIMI = {
        toggle: togglePanel,
        send: () => handleMessage(document.getElementById('bimi-input')?.value),
        ask: handleMessage,
        askAI: askAI,
        clearChat: clearChat
    };
    
})();
