/**
 * KERN-CORE.js v1.0
 * ==================
 * Bus de données central pour l'écosystème KERN
 * 
 * Ce fichier doit être importé dans TOUS les modules KERN
 * Il unifie: données, événements, profil agent, recherche
 * 
 * Usage:
 * <script src="kern-core.js"></script>
 * <script>
 *   KERN.ready(() => {
 *     // Module code here
 *     KERN.emit('dossier:created', dossierData);
 *   });
 * </script>
 */

(function(global) {
    'use strict';

    // =====================================================
    // CONFIGURATION
    // =====================================================
    const VERSION = '1.0.0';
    const STORAGE_PREFIX = 'kern_';
    
    // Storage keys
    const KEYS = {
        AGENT: 'kern_agent_profile',
        DOSSIERS: 'kern_dossiers',
        ENTITIES: 'kern_entities',
        CONTACTS: 'kern_network_contacts',
        NOTES: 'kern_knowledge',
        JOURNAL: 'kern_journal',
        MISSIONS: 'kern_missions',
        SETTINGS: 'kern_settings',
        ACTIVITY: 'kern_activity_log'
    };

    // XP rewards configuration
    const XP_REWARDS = {
        'dossier:created': 25,
        'dossier:updated': 5,
        'entity:created': 15,
        'entity:linked': 10,
        'contact:created': 20,
        'contact:linked': 10,
        'note:created': 15,
        'note:linked': 5,
        'mission:completed': 50,
        'mission:created': 10,
        'journal:entry': 10,
        'search:performed': 1,
        'daily:login': 25,
        'achievement:unlocked': 100
    };

    // Skills configuration
    const SKILLS = {
        investigation: { name: 'Investigation', icon: '🔍', color: '#6366f1' },
        network: { name: 'Réseau', icon: '🔗', color: '#22d3ee' },
        analysis: { name: 'Analyse', icon: '📊', color: '#a78bfa' },
        documentation: { name: 'Documentation', icon: '📝', color: '#4ade80' },
        fieldwork: { name: 'Terrain', icon: '🎯', color: '#fbbf24' },
        opsec: { name: 'OPSEC', icon: '🛡️', color: '#f87171' }
    };

    // Skill XP mapping (which actions train which skills)
    const SKILL_TRAINING = {
        'dossier:created': ['investigation', 'documentation'],
        'dossier:updated': ['documentation'],
        'entity:created': ['analysis'],
        'entity:linked': ['analysis', 'investigation'],
        'contact:created': ['network'],
        'contact:linked': ['network'],
        'note:created': ['documentation'],
        'note:linked': ['documentation', 'analysis'],
        'mission:completed': ['fieldwork'],
        'mission:created': ['investigation'],
        'journal:entry': ['documentation', 'opsec']
    };

    // Clearance levels
    const CLEARANCE_LEVELS = [
        { name: 'INITIÉ', minXP: 0, color: '#888888' },
        { name: 'AGENT', minXP: 500, color: '#4ade80' },
        { name: 'OPÉRATEUR', minXP: 2000, color: '#22d3ee' },
        { name: 'ANALYSTE', minXP: 5000, color: '#6366f1' },
        { name: 'COORDINATEUR', minXP: 10000, color: '#a78bfa' },
        { name: 'STRATÈGE', minXP: 25000, color: '#fbbf24' },
        { name: 'ARCHITECTE', minXP: 50000, color: '#f87171' },
        { name: 'MAÎTRE', minXP: 100000, color: '#ffffff' }
    ];

    // =====================================================
    // EVENT SYSTEM
    // =====================================================
    const eventListeners = {};

    function on(event, callback) {
        if (!eventListeners[event]) {
            eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
        return () => off(event, callback); // Return unsubscribe function
    }

    function off(event, callback) {
        if (eventListeners[event]) {
            eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
        }
    }

    function emit(event, data) {
        // Log activity
        logActivity(event, data);
        
        // Award XP if applicable
        if (XP_REWARDS[event]) {
            awardXP(XP_REWARDS[event], event);
        }
        
        // Train skills if applicable
        if (SKILL_TRAINING[event]) {
            SKILL_TRAINING[event].forEach(skill => {
                trainSkill(skill, Math.floor(XP_REWARDS[event] / 2) || 5);
            });
        }
        
        // Notify listeners
        if (eventListeners[event]) {
            eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`KERN: Error in event handler for ${event}:`, e);
                }
            });
        }
        
        // Also emit to wildcard listeners
        if (eventListeners['*']) {
            eventListeners['*'].forEach(callback => {
                try {
                    callback({ event, data });
                } catch (e) {
                    console.error('KERN: Error in wildcard handler:', e);
                }
            });
        }
    }

    // =====================================================
    // STORAGE LAYER
    // =====================================================
    function loadJSON(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (e) {
            console.error(`KERN: Error loading ${key}:`, e);
            return defaultValue;
        }
    }

    function saveJSON(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`KERN: Error saving ${key}:`, e);
            return false;
        }
    }

    // =====================================================
    // AGENT PROFILE
    // =====================================================
    function getDefaultAgent() {
        return {
            id: 'agent_' + Date.now(),
            codename: generateCodename(),
            created: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            
            // XP & Level
            xp: 0,
            level: 1,
            xpToNext: 100,
            
            // Clearance
            clearance: 0,
            clearanceName: 'INITIÉ',
            
            // Skills
            skills: {
                investigation: { xp: 0, level: 1 },
                network: { xp: 0, level: 1 },
                analysis: { xp: 0, level: 1 },
                documentation: { xp: 0, level: 1 },
                fieldwork: { xp: 0, level: 1 },
                opsec: { xp: 0, level: 1 }
            },
            
            // Stats
            stats: {
                dossiersCreated: 0,
                entitiesCreated: 0,
                contactsAdded: 0,
                notesWritten: 0,
                missionsCompleted: 0,
                linksDiscovered: 0,
                daysActive: 1,
                totalActions: 0
            },
            
            // Achievements
            achievements: [],
            
            // Settings
            settings: {
                theme: 'dark',
                notifications: true,
                soundEffects: true
            }
        };
    }

    function generateCodename() {
        const adjectives = ['SHADOW', 'SILENT', 'PHANTOM', 'GHOST', 'CIPHER', 'VECTOR', 'NEXUS', 'VERTEX', 'PRISM', 'RAVEN', 'STORM', 'FROST', 'BLAZE', 'ECHO', 'NOVA'];
        const nouns = ['WALKER', 'SEEKER', 'WATCHER', 'HUNTER', 'KEEPER', 'RUNNER', 'DRIFTER', 'FINDER', 'TRACER', 'WEAVER', 'BLADE', 'HAWK', 'WOLF', 'PHOENIX', 'TIGER'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 900) + 100;
        return `${adj}-${noun}-${num}`;
    }

    let agent = null;

    function loadAgent() {
        agent = loadJSON(KEYS.AGENT, null);
        
        if (!agent) {
            agent = getDefaultAgent();
            saveAgent();
        } else {
            // Check for daily login bonus
            checkDailyLogin();
        }
        
        return agent;
    }

    function saveAgent() {
        saveJSON(KEYS.AGENT, agent);
    }

    function checkDailyLogin() {
        const lastLogin = new Date(agent.lastLogin);
        const now = new Date();
        const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 1) {
            agent.stats.daysActive++;
            agent.lastLogin = now.toISOString();
            
            // Award daily login XP (without triggering event to avoid loop)
            const xpGain = XP_REWARDS['daily:login'];
            agent.xp += xpGain;
            checkLevelUp();
            
            saveAgent();
            
            // Notify
            setTimeout(() => {
                emit('notification', {
                    type: 'success',
                    title: 'Connexion quotidienne',
                    message: `+${xpGain} XP ! ${diffDays > 1 ? `Absent ${diffDays} jours` : 'Bienvenue !'}`
                });
            }, 1000);
        }
    }

    function awardXP(amount, reason = '') {
        if (!agent) loadAgent();
        
        agent.xp += amount;
        agent.stats.totalActions++;
        
        checkLevelUp();
        updateClearance();
        saveAgent();
        
        emit('xp:gained', { amount, reason, total: agent.xp, level: agent.level });
    }

    function checkLevelUp() {
        while (agent.xp >= agent.xpToNext) {
            agent.xp -= agent.xpToNext;
            agent.level++;
            agent.xpToNext = Math.floor(agent.xpToNext * 1.5);
            
            emit('level:up', { level: agent.level, xpToNext: agent.xpToNext });
            emit('notification', {
                type: 'levelup',
                title: `Niveau ${agent.level} !`,
                message: 'Votre influence grandit...'
            });
        }
    }

    function updateClearance() {
        const totalXP = calculateTotalXP();
        
        for (let i = CLEARANCE_LEVELS.length - 1; i >= 0; i--) {
            if (totalXP >= CLEARANCE_LEVELS[i].minXP) {
                if (agent.clearance !== i) {
                    const oldClearance = agent.clearance;
                    agent.clearance = i;
                    agent.clearanceName = CLEARANCE_LEVELS[i].name;
                    
                    if (i > oldClearance) {
                        emit('clearance:upgraded', { 
                            level: i, 
                            name: CLEARANCE_LEVELS[i].name,
                            color: CLEARANCE_LEVELS[i].color
                        });
                        emit('notification', {
                            type: 'clearance',
                            title: 'Clearance augmenté !',
                            message: `Nouveau niveau : ${CLEARANCE_LEVELS[i].name}`
                        });
                    }
                }
                break;
            }
        }
    }

    function calculateTotalXP() {
        // Total XP = current XP + all XP spent on previous levels
        let total = agent.xp;
        let xpPerLevel = 100;
        for (let i = 1; i < agent.level; i++) {
            total += xpPerLevel;
            xpPerLevel = Math.floor(xpPerLevel * 1.5);
        }
        return total;
    }

    function trainSkill(skillId, amount) {
        if (!agent) loadAgent();
        if (!agent.skills[skillId]) return;
        
        const skill = agent.skills[skillId];
        skill.xp += amount;
        
        // Check skill level up
        const xpNeeded = skill.level * 100;
        while (skill.xp >= xpNeeded) {
            skill.xp -= xpNeeded;
            skill.level++;
            
            emit('skill:levelup', { 
                skill: skillId, 
                level: skill.level,
                name: SKILLS[skillId].name
            });
        }
        
        saveAgent();
    }

    // =====================================================
    // DATA STORES
    // =====================================================
    const stores = {
        dossiers: [],
        entities: [],
        contacts: [],
        notes: [],
        journal: [],
        missions: []
    };

    function loadAllStores() {
        stores.dossiers = loadJSON(KEYS.DOSSIERS, []);
        stores.entities = loadJSON(KEYS.ENTITIES, []);
        stores.contacts = loadJSON(KEYS.CONTACTS, []);
        stores.notes = loadJSON(KEYS.NOTES, []);
        stores.journal = loadJSON(KEYS.JOURNAL, []);
        stores.missions = loadJSON(KEYS.MISSIONS, []);
    }

    // =====================================================
    // DOSSIERS API
    // =====================================================
    function createDossier(data) {
        const dossier = {
            id: 'dossier_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: 'active',
            ...data
        };
        
        stores.dossiers.push(dossier);
        saveJSON(KEYS.DOSSIERS, stores.dossiers);
        
        if (agent) agent.stats.dossiersCreated++;
        saveAgent();
        
        emit('dossier:created', dossier);
        return dossier;
    }

    function updateDossier(id, data) {
        const index = stores.dossiers.findIndex(d => d.id === id);
        if (index === -1) return null;
        
        stores.dossiers[index] = {
            ...stores.dossiers[index],
            ...data,
            updated: new Date().toISOString()
        };
        
        saveJSON(KEYS.DOSSIERS, stores.dossiers);
        emit('dossier:updated', stores.dossiers[index]);
        return stores.dossiers[index];
    }

    function getDossier(id) {
        return stores.dossiers.find(d => d.id === id);
    }

    function getAllDossiers() {
        return [...stores.dossiers];
    }

    function deleteDossier(id) {
        stores.dossiers = stores.dossiers.filter(d => d.id !== id);
        saveJSON(KEYS.DOSSIERS, stores.dossiers);
        emit('dossier:deleted', { id });
    }

    // =====================================================
    // ENTITIES API (for PANOPTICON)
    // =====================================================
    function createEntity(data) {
        const entity = {
            id: 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            links: [],
            ...data
        };
        
        stores.entities.push(entity);
        saveJSON(KEYS.ENTITIES, stores.entities);
        
        if (agent) agent.stats.entitiesCreated++;
        saveAgent();
        
        emit('entity:created', entity);
        return entity;
    }

    function linkEntities(id1, id2, relation = 'lié à') {
        const entity1 = stores.entities.find(e => e.id === id1);
        const entity2 = stores.entities.find(e => e.id === id2);
        
        if (!entity1 || !entity2) return false;
        
        // Add bidirectional link
        if (!entity1.links.find(l => l.target === id2)) {
            entity1.links.push({ target: id2, relation, created: new Date().toISOString() });
        }
        if (!entity2.links.find(l => l.target === id1)) {
            entity2.links.push({ target: id1, relation, created: new Date().toISOString() });
        }
        
        saveJSON(KEYS.ENTITIES, stores.entities);
        
        if (agent) agent.stats.linksDiscovered++;
        saveAgent();
        
        emit('entity:linked', { entity1: id1, entity2: id2, relation });
        return true;
    }

    function getEntity(id) {
        return stores.entities.find(e => e.id === id);
    }

    function getAllEntities() {
        return [...stores.entities];
    }

    // =====================================================
    // CONTACTS API
    // =====================================================
    function createContact(data) {
        const contact = {
            id: 'contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            connections: [],
            ...data
        };
        
        stores.contacts.push(contact);
        saveJSON(KEYS.CONTACTS, stores.contacts);
        
        if (agent) agent.stats.contactsAdded++;
        saveAgent();
        
        emit('contact:created', contact);
        return contact;
    }

    function linkContacts(id1, id2) {
        const contact1 = stores.contacts.find(c => c.id === id1);
        const contact2 = stores.contacts.find(c => c.id === id2);
        
        if (!contact1 || !contact2) return false;
        
        if (!contact1.connections.includes(id2)) {
            contact1.connections.push(id2);
        }
        if (!contact2.connections.includes(id1)) {
            contact2.connections.push(id1);
        }
        
        saveJSON(KEYS.CONTACTS, stores.contacts);
        emit('contact:linked', { contact1: id1, contact2: id2 });
        return true;
    }

    function getContact(id) {
        return stores.contacts.find(c => c.id === id);
    }

    function getAllContacts() {
        return [...stores.contacts];
    }

    // =====================================================
    // NOTES API
    // =====================================================
    function createNote(data) {
        const note = {
            id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            ...data
        };
        
        stores.notes.push(note);
        saveJSON(KEYS.NOTES, stores.notes);
        
        if (agent) agent.stats.notesWritten++;
        saveAgent();
        
        emit('note:created', note);
        return note;
    }

    function updateNote(id, data) {
        const index = stores.notes.findIndex(n => n.id === id);
        if (index === -1) return null;
        
        stores.notes[index] = {
            ...stores.notes[index],
            ...data,
            updated: new Date().toISOString()
        };
        
        saveJSON(KEYS.NOTES, stores.notes);
        emit('note:updated', stores.notes[index]);
        return stores.notes[index];
    }

    function getNote(id) {
        return stores.notes.find(n => n.id === id);
    }

    function getAllNotes() {
        return [...stores.notes];
    }

    // =====================================================
    // GLOBAL SEARCH
    // =====================================================
    function search(query, options = {}) {
        const q = query.toLowerCase().trim();
        if (!q) return { results: [], total: 0 };
        
        const results = [];
        const { types = ['dossiers', 'entities', 'contacts', 'notes'], limit = 50 } = options;
        
        // Search dossiers
        if (types.includes('dossiers')) {
            stores.dossiers.forEach(d => {
                const score = calculateSearchScore(q, [d.title, d.description, d.subject, ...(d.tags || [])]);
                if (score > 0) {
                    results.push({ type: 'dossier', item: d, score });
                }
            });
        }
        
        // Search entities
        if (types.includes('entities')) {
            stores.entities.forEach(e => {
                const score = calculateSearchScore(q, [e.name, e.type, e.description, ...(e.tags || [])]);
                if (score > 0) {
                    results.push({ type: 'entity', item: e, score });
                }
            });
        }
        
        // Search contacts
        if (types.includes('contacts')) {
            stores.contacts.forEach(c => {
                const fullName = `${c.firstName || ''} ${c.lastName || ''}`;
                const score = calculateSearchScore(q, [fullName, c.role, c.org, c.notes]);
                if (score > 0) {
                    results.push({ type: 'contact', item: c, score });
                }
            });
        }
        
        // Search notes
        if (types.includes('notes')) {
            stores.notes.forEach(n => {
                const score = calculateSearchScore(q, [n.title, n.content]);
                if (score > 0) {
                    results.push({ type: 'note', item: n, score });
                }
            });
        }
        
        // Sort by score and limit
        results.sort((a, b) => b.score - a.score);
        
        emit('search:performed', { query: q, resultsCount: results.length });
        
        return {
            results: results.slice(0, limit),
            total: results.length,
            query: q
        };
    }

    function calculateSearchScore(query, fields) {
        let score = 0;
        const queryWords = query.split(/\s+/);
        
        fields.forEach(field => {
            if (!field) return;
            const fieldLower = field.toLowerCase();
            
            // Exact match
            if (fieldLower === query) {
                score += 100;
            }
            // Starts with
            else if (fieldLower.startsWith(query)) {
                score += 50;
            }
            // Contains
            else if (fieldLower.includes(query)) {
                score += 25;
            }
            
            // Word matches
            queryWords.forEach(word => {
                if (word.length > 2 && fieldLower.includes(word)) {
                    score += 10;
                }
            });
        });
        
        return score;
    }

    // =====================================================
    // ACTIVITY LOG
    // =====================================================
    let activityLog = [];

    function loadActivityLog() {
        activityLog = loadJSON(KEYS.ACTIVITY, []);
    }

    function logActivity(event, data) {
        const entry = {
            event,
            data: typeof data === 'object' ? { ...data } : data,
            timestamp: new Date().toISOString()
        };
        
        activityLog.unshift(entry);
        
        // Keep only last 1000 entries
        if (activityLog.length > 1000) {
            activityLog = activityLog.slice(0, 1000);
        }
        
        saveJSON(KEYS.ACTIVITY, activityLog);
    }

    function getRecentActivity(limit = 50) {
        return activityLog.slice(0, limit);
    }

    // =====================================================
    // STATISTICS
    // =====================================================
    function getStats() {
        return {
            agent: agent ? {
                codename: agent.codename,
                level: agent.level,
                xp: agent.xp,
                xpToNext: agent.xpToNext,
                clearance: agent.clearanceName,
                clearanceLevel: agent.clearance,
                totalXP: calculateTotalXP(),
                skills: Object.entries(agent.skills).map(([id, data]) => ({
                    id,
                    ...SKILLS[id],
                    ...data
                })),
                stats: agent.stats
            } : null,
            
            data: {
                dossiers: stores.dossiers.length,
                entities: stores.entities.length,
                contacts: stores.contacts.length,
                notes: stores.notes.length,
                totalLinks: stores.entities.reduce((sum, e) => sum + e.links.length, 0) / 2,
                totalConnections: stores.contacts.reduce((sum, c) => sum + c.connections.length, 0) / 2
            },
            
            clearanceLevels: CLEARANCE_LEVELS,
            skills: SKILLS
        };
    }

    // =====================================================
    // EXPORT / IMPORT
    // =====================================================
    function exportAllData() {
        return {
            version: VERSION,
            exported: new Date().toISOString(),
            agent: agent,
            dossiers: stores.dossiers,
            entities: stores.entities,
            contacts: stores.contacts,
            notes: stores.notes,
            journal: stores.journal,
            missions: stores.missions,
            activity: activityLog.slice(0, 100)
        };
    }

    function importAllData(data) {
        if (!data || !data.version) {
            throw new Error('Invalid KERN export file');
        }
        
        // Backup current data
        const backup = exportAllData();
        
        try {
            if (data.agent) {
                agent = data.agent;
                saveAgent();
            }
            if (data.dossiers) {
                stores.dossiers = data.dossiers;
                saveJSON(KEYS.DOSSIERS, stores.dossiers);
            }
            if (data.entities) {
                stores.entities = data.entities;
                saveJSON(KEYS.ENTITIES, stores.entities);
            }
            if (data.contacts) {
                stores.contacts = data.contacts;
                saveJSON(KEYS.CONTACTS, stores.contacts);
            }
            if (data.notes) {
                stores.notes = data.notes;
                saveJSON(KEYS.NOTES, stores.notes);
            }
            
            emit('data:imported', { itemsCount: Object.keys(data).length });
            return true;
        } catch (e) {
            // Restore backup on error
            console.error('KERN: Import failed, restoring backup', e);
            importAllData(backup);
            throw e;
        }
    }

    // =====================================================
    // INITIALIZATION
    // =====================================================
    let initialized = false;
    const readyCallbacks = [];

    function init() {
        if (initialized) return;
        
        loadAgent();
        loadAllStores();
        loadActivityLog();
        
        initialized = true;
        
        // Execute ready callbacks
        readyCallbacks.forEach(cb => {
            try {
                cb();
            } catch (e) {
                console.error('KERN: Error in ready callback:', e);
            }
        });
        
        emit('kern:ready', { version: VERSION });
        console.log(`KERN Core v${VERSION} initialized`);
    }

    function ready(callback) {
        if (initialized) {
            callback();
        } else {
            readyCallbacks.push(callback);
        }
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
    global.KERN = {
        // Version
        version: VERSION,
        
        // Initialization
        ready,
        
        // Events
        on,
        off,
        emit,
        
        // Agent
        getAgent: () => agent,
        getStats,
        awardXP,
        trainSkill,
        
        // Dossiers
        createDossier,
        updateDossier,
        getDossier,
        getAllDossiers,
        deleteDossier,
        
        // Entities
        createEntity,
        linkEntities,
        getEntity,
        getAllEntities,
        
        // Contacts
        createContact,
        linkContacts,
        getContact,
        getAllContacts,
        
        // Notes
        createNote,
        updateNote,
        getNote,
        getAllNotes,
        
        // Search
        search,
        
        // Activity
        getRecentActivity,
        
        // Export/Import
        exportAllData,
        importAllData,
        
        // Constants
        SKILLS,
        CLEARANCE_LEVELS,
        XP_REWARDS
    };

})(typeof window !== 'undefined' ? window : global);
