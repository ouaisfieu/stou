/**
 * KERN-CORE.js v2.0
 * ==================
 * Bus de données central pour l'écosystème KERN
 * 
 * CHANGELOG v2.0:
 * - Validation automatique des données
 * - Import centralisé avec correction des clés legacy
 * - Complétion des structures manquantes
 * - Meilleure gestion des erreurs
 * 
 * Usage:
 * <script src="kern-core.js"></script>
 * <script>
 *   KERN.ready(() => {
 *     // Module code here
 *   });
 * </script>
 */

(function(global) {
    'use strict';

    // =====================================================
    // CONFIGURATION
    // =====================================================
    const VERSION = '2.0.0';
    const SCHEMA_VERSION = '2.0';
    
    // Storage keys - SOURCE DE VÉRITÉ
    const KEYS = {
        AGENT: 'kern_agent_profile',
        DOSSIERS: 'kern_dossiers',
        ENTITIES: 'kern_entities',
        CONTACTS: 'kern_network_contacts',
        NOTES: 'kern_knowledge',
        JOURNAL: 'kern_journal',
        MISSIONS: 'kern_missions',
        PARTNERS: 'kern_partners',
        PROTOCOLE: 'kern_protocole',
        SETTINGS: 'kern_settings',
        ACTIVITY: 'kern_activity_log'
    };
    
    // Mapping des clés legacy vers les bonnes clés
    const LEGACY_KEY_MAP = {
        'kern_agent': 'kern_agent_profile',
        'kern_contacts': 'kern_network_contacts',
        'kern_notes': 'kern_knowledge'
    };

    // =====================================================
    // DEFAULT VALUES - SOURCE DE VÉRITÉ
    // =====================================================
    
    const DEFAULTS = {
        agent: {
            codename: "AGENT-001",
            level: 1,
            xp: 0,
            xpToNext: 1000,
            clearance: 0,
            clearanceName: "INITIÉ",
            streak: 0,
            lastLogin: new Date().toISOString().slice(0, 10),
            skills: {
                investigation: { level: 1, xp: 0 },
                network: { level: 1, xp: 0 },
                analysis: { level: 1, xp: 0 },
                documentation: { level: 1, xp: 0 },
                fieldwork: { level: 1, xp: 0 },
                opsec: { level: 1, xp: 0 }
            },
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
            achievements: [],
            settings: {
                theme: "dark",
                notifications: true,
                soundEffects: true
            }
        },
        
        dossier: {
            title: "Nouveau dossier",
            description: "",
            status: "active",
            priority: "medium",
            tags: [],
            timeline: [],
            evidence: [],
            linkedEntities: [],
            linkedContacts: []
        },
        
        entity: {
            name: "Nouvelle entité",
            type: "other",
            subtype: "",
            emoji: "❓",
            description: "",
            tags: [],
            links: []
        },
        
        contact: {
            firstName: "Nouveau",
            lastName: "Contact",
            emoji: "👤",
            organization: "",
            role: "",
            category: "other",
            strength: 3,
            email: "",
            phone: "",
            location: "",
            notes: "",
            tags: [],
            lastContact: "",
            connections: []
        },
        
        note: {
            title: "Nouvelle note",
            content: "",
            tags: [],
            linkedNotes: []
        },
        
        mission: {
            name: "Nouvelle mission",
            emoji: "🎯",
            description: "",
            difficulty: "medium",
            xpReward: 100,
            status: "active",
            requirements: [],
            completedReqs: []
        },
        
        journalEntry: {
            content: "",
            tags: []
        },
        
        partner: {
            name: "Nouveau partenaire",
            emoji: "🤝",
            tagline: "",
            sector: "",
            revenue: 0,
            tier: "free",
            status: "prospect",
            website: "",
            description: "",
            email: "",
            phone: "",
            address: "",
            products: []
        }
    };
    
    // Entity emojis par type
    const ENTITY_EMOJIS = {
        person: "👤",
        organization: "🏛️",
        company: "🏢",
        media: "📰",
        institution: "🏦",
        event: "📅",
        document: "📄",
        location: "📍",
        other: "❓"
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

    // Skill XP mapping
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
    // VALIDATION & COMPLETION
    // =====================================================
    
    /**
     * Complète un objet avec les valeurs par défaut
     */
    function complete(obj, defaults) {
        if (!obj) return JSON.parse(JSON.stringify(defaults));
        
        const result = { ...obj };
        
        for (const key in defaults) {
            if (result[key] === undefined || result[key] === null) {
                result[key] = Array.isArray(defaults[key]) 
                    ? [...defaults[key]] 
                    : (typeof defaults[key] === 'object' && defaults[key] !== null)
                        ? JSON.parse(JSON.stringify(defaults[key]))
                        : defaults[key];
            } else if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key]) && typeof result[key] === 'object') {
                result[key] = complete(result[key], defaults[key]);
            }
        }
        
        return result;
    }
    
    /**
     * Valide et complète un agent
     */
    function validateAgent(agent) {
        if (!agent) return JSON.parse(JSON.stringify(DEFAULTS.agent));
        
        const validated = complete(agent, DEFAULTS.agent);
        
        // S'assurer que skills a toutes les compétences
        for (const skillId in DEFAULTS.agent.skills) {
            if (!validated.skills[skillId]) {
                validated.skills[skillId] = { ...DEFAULTS.agent.skills[skillId] };
            }
        }
        
        // S'assurer que stats a tous les compteurs
        for (const statKey in DEFAULTS.agent.stats) {
            if (validated.stats[statKey] === undefined) {
                validated.stats[statKey] = DEFAULTS.agent.stats[statKey];
            }
        }
        
        return validated;
    }
    
    /**
     * Valide et complète une entité
     */
    function validateEntity(entity) {
        if (!entity) return null;
        
        const validated = complete(entity, DEFAULTS.entity);
        
        if (!Array.isArray(validated.links)) {
            validated.links = [];
        }
        
        if (!validated.emoji || validated.emoji === "❓") {
            validated.emoji = ENTITY_EMOJIS[validated.type] || "❓";
        }
        
        return validated;
    }
    
    /**
     * Valide et complète un contact
     */
    function validateContact(contact) {
        if (!contact) return null;
        
        const validated = complete(contact, DEFAULTS.contact);
        
        if (!Array.isArray(validated.connections)) {
            validated.connections = [];
        }
        
        return validated;
    }
    
    function validateDossier(dossier) {
        if (!dossier) return null;
        return complete(dossier, DEFAULTS.dossier);
    }
    
    function validateNote(note) {
        if (!note) return null;
        return complete(note, DEFAULTS.note);
    }
    
    function validateMission(mission) {
        if (!mission) return null;
        return complete(mission, DEFAULTS.mission);
    }

    // =====================================================
    // EVENT SYSTEM
    // =====================================================
    const eventListeners = {};

    function on(event, callback) {
        if (!eventListeners[event]) {
            eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
        return () => off(event, callback);
    }

    function off(event, callback) {
        if (eventListeners[event]) {
            eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
        }
    }

    function emit(event, data) {
        if (eventListeners[event]) {
            eventListeners[event].forEach(cb => {
                try { cb(data); } catch (e) { console.error(`KERN event error [${event}]:`, e); }
            });
        }
        if (eventListeners['*']) {
            eventListeners['*'].forEach(cb => {
                try { cb(event, data); } catch (e) { console.error('KERN wildcard error:', e); }
            });
        }
    }

    // =====================================================
    // STORAGE
    // =====================================================
    function loadJSON(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            return JSON.parse(item);
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
    let agent = null;

    function loadAgent() {
        let rawAgent = loadJSON(KEYS.AGENT, null);
        
        // Essayer l'ancienne clé
        if (!rawAgent) {
            rawAgent = loadJSON('kern_agent', null);
            if (rawAgent) {
                localStorage.removeItem('kern_agent');
            }
        }
        
        agent = validateAgent(rawAgent);
        saveAgent();
        
        if (rawAgent) {
            checkDailyLogin();
        }
        
        return agent;
    }

    function saveAgent() {
        saveJSON(KEYS.AGENT, agent);
    }

    function checkDailyLogin() {
        if (!agent.lastLogin) {
            agent.lastLogin = new Date().toISOString().slice(0, 10);
            return;
        }
        
        const lastLogin = new Date(agent.lastLogin);
        const now = new Date();
        const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 1) {
            agent.stats.daysActive++;
            agent.lastLogin = now.toISOString().slice(0, 10);
            
            const xpGain = XP_REWARDS['daily:login'];
            agent.xp += xpGain;
            checkLevelUp();
            saveAgent();
            
            setTimeout(() => {
                emit('notification', {
                    type: 'success',
                    title: 'Connexion quotidienne',
                    message: `+${xpGain} XP !`
                });
            }, 1000);
        }
    }

    function addXP(amount, reason = '') {
        if (!agent) return;
        
        agent.xp += amount;
        agent.stats.totalActions++;
        checkLevelUp();
        saveAgent();
        
        emit('xp:gained', { amount, reason, total: agent.xp, level: agent.level });
        logActivity('xp', `+${amount} XP: ${reason}`);
    }

    function checkLevelUp() {
        while (agent.xp >= agent.xpToNext) {
            agent.xp -= agent.xpToNext;
            agent.level++;
            agent.xpToNext = Math.floor(agent.xpToNext * 1.5);
            
            emit('level:up', { level: agent.level, xpToNext: agent.xpToNext });
            emit('notification', { type: 'success', title: `Niveau ${agent.level} !`, message: 'Félicitations !' });
        }
        
        const totalXP = calculateTotalXP();
        for (let i = CLEARANCE_LEVELS.length - 1; i >= 0; i--) {
            if (totalXP >= CLEARANCE_LEVELS[i].minXP) {
                if (agent.clearance !== i) {
                    agent.clearance = i;
                    agent.clearanceName = CLEARANCE_LEVELS[i].name;
                }
                break;
            }
        }
    }

    function calculateTotalXP() {
        let total = agent.xp;
        let xpNeeded = 1000;
        for (let i = 1; i < agent.level; i++) {
            total += xpNeeded;
            xpNeeded = Math.floor(xpNeeded * 1.5);
        }
        return total;
    }

    function addSkillXP(skillId, amount) {
        if (!agent.skills[skillId]) return;
        
        const skill = agent.skills[skillId];
        skill.xp += amount;
        
        while (skill.xp >= skill.level * 100) {
            skill.xp -= skill.level * 100;
            skill.level++;
            emit('skill:up', { skillId, level: skill.level });
        }
        
        saveAgent();
    }

    function trainSkills(eventType) {
        const skills = SKILL_TRAINING[eventType];
        if (skills) skills.forEach(s => addSkillXP(s, 10));
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
        stores.entities = loadJSON(KEYS.ENTITIES, []).map(validateEntity).filter(Boolean);
        stores.contacts = loadJSON(KEYS.CONTACTS, []).map(validateContact).filter(Boolean);
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
            ...DEFAULTS.dossier,
            ...data
        };
        
        stores.dossiers.push(dossier);
        saveJSON(KEYS.DOSSIERS, stores.dossiers);
        
        if (agent) agent.stats.dossiersCreated++;
        saveAgent();
        
        addXP(XP_REWARDS['dossier:created'], 'Dossier créé');
        trainSkills('dossier:created');
        emit('dossier:created', dossier);
        logActivity('dossier', `Dossier créé: ${dossier.title}`);
        
        return dossier;
    }

    function updateDossier(id, data) {
        const index = stores.dossiers.findIndex(d => d.id === id);
        if (index === -1) return null;
        
        stores.dossiers[index] = { ...stores.dossiers[index], ...data, updated: new Date().toISOString() };
        saveJSON(KEYS.DOSSIERS, stores.dossiers);
        addXP(XP_REWARDS['dossier:updated'], 'Dossier mis à jour');
        emit('dossier:updated', stores.dossiers[index]);
        
        return stores.dossiers[index];
    }

    function getAllDossiers() { return [...stores.dossiers]; }
    function deleteDossier(id) {
        stores.dossiers = stores.dossiers.filter(d => d.id !== id);
        saveJSON(KEYS.DOSSIERS, stores.dossiers);
        emit('dossier:deleted', { id });
    }

    // =====================================================
    // ENTITIES API
    // =====================================================
    function createEntity(data) {
        const entity = validateEntity({
            id: 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            ...data
        });
        
        stores.entities.push(entity);
        saveJSON(KEYS.ENTITIES, stores.entities);
        
        if (agent) agent.stats.entitiesCreated++;
        saveAgent();
        
        addXP(XP_REWARDS['entity:created'], 'Entité créée');
        trainSkills('entity:created');
        emit('entity:created', entity);
        logActivity('entity', `Entité créée: ${entity.name}`);
        
        return entity;
    }

    function linkEntities(sourceId, targetId, linkType, label) {
        const source = stores.entities.find(e => e.id === sourceId);
        const target = stores.entities.find(e => e.id === targetId);
        if (!source || !target) return false;
        
        if (!source.links) source.links = [];
        if (!target.links) target.links = [];
        
        source.links.push({ targetId, type: linkType, label });
        target.links.push({ targetId: sourceId, type: linkType, label: `← ${label}` });
        
        saveJSON(KEYS.ENTITIES, stores.entities);
        if (agent) agent.stats.linksDiscovered++;
        saveAgent();
        
        addXP(XP_REWARDS['entity:linked'], 'Lien découvert');
        trainSkills('entity:linked');
        emit('entity:linked', { sourceId, targetId, linkType });
        
        return true;
    }

    function getAllEntities() { return [...stores.entities]; }

    // =====================================================
    // CONTACTS API
    // =====================================================
    function createContact(data) {
        const contact = validateContact({
            id: 'contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...data
        });
        
        stores.contacts.push(contact);
        saveJSON(KEYS.CONTACTS, stores.contacts);
        
        if (agent) agent.stats.contactsAdded++;
        saveAgent();
        
        addXP(XP_REWARDS['contact:created'], 'Contact ajouté');
        trainSkills('contact:created');
        emit('contact:created', contact);
        logActivity('contact', `Contact ajouté: ${contact.firstName} ${contact.lastName}`);
        
        return contact;
    }

    function linkContacts(sourceId, targetId) {
        const source = stores.contacts.find(c => c.id === sourceId);
        const target = stores.contacts.find(c => c.id === targetId);
        if (!source || !target) return false;
        
        if (!source.connections) source.connections = [];
        if (!target.connections) target.connections = [];
        
        if (!source.connections.includes(targetId)) source.connections.push(targetId);
        if (!target.connections.includes(sourceId)) target.connections.push(sourceId);
        
        saveJSON(KEYS.CONTACTS, stores.contacts);
        addXP(XP_REWARDS['contact:linked'], 'Contacts liés');
        trainSkills('contact:linked');
        emit('contact:linked', { sourceId, targetId });
        
        return true;
    }

    function getAllContacts() { return [...stores.contacts]; }

    // =====================================================
    // NOTES API
    // =====================================================
    function createNote(data) {
        const note = {
            id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            ...DEFAULTS.note,
            ...data
        };
        
        stores.notes.push(note);
        saveJSON(KEYS.NOTES, stores.notes);
        
        if (agent) agent.stats.notesWritten++;
        saveAgent();
        
        addXP(XP_REWARDS['note:created'], 'Note créée');
        trainSkills('note:created');
        emit('note:created', note);
        logActivity('note', `Note créée: ${note.title}`);
        
        return note;
    }

    function getAllNotes() { return [...stores.notes]; }
    
    function getNote(id) {
        return stores.notes.find(n => n.id === id) || null;
    }
    
    function updateNote(id, data) {
        const index = stores.notes.findIndex(n => n.id === id);
        if (index === -1) return null;
        stores.notes[index] = { ...stores.notes[index], ...data, updated: new Date().toISOString() };
        saveJSON(KEYS.NOTES, stores.notes);
        emit('note:updated', stores.notes[index]);
        return stores.notes[index];
    }
    
    function getDossier(id) {
        return stores.dossiers.find(d => d.id === id) || null;
    }
    
    function getEntity(id) {
        return stores.entities.find(e => e.id === id) || null;
    }
    
    function getContact(id) {
        return stores.contacts.find(c => c.id === id) || null;
    }

    // =====================================================
    // MISSIONS API
    // =====================================================
    function createMission(data) {
        const mission = {
            id: 'mission_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            ...DEFAULTS.mission,
            ...data
        };
        
        stores.missions.push(mission);
        saveJSON(KEYS.MISSIONS, stores.missions);
        addXP(XP_REWARDS['mission:created'], 'Mission créée');
        emit('mission:created', mission);
        
        return mission;
    }

    function completeMission(id) {
        const mission = stores.missions.find(m => m.id === id);
        if (!mission || mission.status === 'completed') return null;
        
        mission.status = 'completed';
        saveJSON(KEYS.MISSIONS, stores.missions);
        
        if (agent) agent.stats.missionsCompleted++;
        saveAgent();
        
        addXP(mission.xpReward || XP_REWARDS['mission:completed'], 'Mission accomplie');
        trainSkills('mission:completed');
        emit('mission:completed', mission);
        
        return mission;
    }

    function getAllMissions() { return [...stores.missions]; }

    // =====================================================
    // JOURNAL API
    // =====================================================
    function addJournalEntry(content, tags = []) {
        const entry = {
            id: 'journal_' + Date.now(),
            content,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        stores.journal.push(entry);
        saveJSON(KEYS.JOURNAL, stores.journal);
        addXP(XP_REWARDS['journal:entry'], 'Entrée de journal');
        trainSkills('journal:entry');
        emit('journal:entry', entry);
        
        return entry;
    }

    function getAllJournalEntries() { return [...stores.journal]; }

    // =====================================================
    // ACTIVITY LOG
    // =====================================================
    let activityLog = [];

    function loadActivityLog() {
        activityLog = loadJSON(KEYS.ACTIVITY, []);
    }

    function logActivity(type, message, metadata = {}) {
        const entry = { id: Date.now(), type, message, timestamp: new Date().toISOString(), ...metadata };
        activityLog.unshift(entry);
        activityLog = activityLog.slice(0, 100);
        saveJSON(KEYS.ACTIVITY, activityLog);
        emit('activity:logged', entry);
    }

    function getActivityLog(limit = 20) { return activityLog.slice(0, limit); }

    // =====================================================
    // STATS
    // =====================================================
    function getStats() {
        return {
            agent: agent ? {
                codename: agent.codename,
                level: agent.level,
                xp: agent.xp,
                xpToNext: agent.xpToNext,
                clearance: agent.clearanceName || 'INITIÉ',
                clearanceLevel: agent.clearance || 0,
                totalXP: calculateTotalXP(),
                skills: Object.entries(agent.skills || {}).map(([id, data]) => ({
                    id, ...(SKILLS[id] || {}), ...data
                })),
                stats: agent.stats || DEFAULTS.agent.stats
            } : null,
            
            data: {
                dossiers: stores.dossiers.length,
                entities: stores.entities.length,
                contacts: stores.contacts.length,
                notes: stores.notes.length,
                missions: stores.missions.length,
                journal: stores.journal.length,
                totalLinks: stores.entities.reduce((sum, e) => sum + (e.links ? e.links.length : 0), 0) / 2,
                totalConnections: stores.contacts.reduce((sum, c) => sum + (c.connections ? c.connections.length : 0), 0) / 2
            },
            
            clearanceLevels: CLEARANCE_LEVELS,
            skills: SKILLS
        };
    }

    // =====================================================
    // IMPORT / EXPORT (CENTRALISÉ)
    // =====================================================
    
    function exportAllData() {
        return {
            _meta: { version: SCHEMA_VERSION, exported: new Date().toISOString(), source: 'KERN' },
            kern_agent_profile: agent,
            kern_dossiers: stores.dossiers,
            kern_entities: stores.entities,
            kern_network_contacts: stores.contacts,
            kern_knowledge: stores.notes,
            kern_missions: stores.missions,
            kern_journal: stores.journal,
            kern_partners: loadJSON(KEYS.PARTNERS, []),
            kern_protocole: loadJSON(KEYS.PROTOCOLE, null)
        };
    }
    
    /**
     * IMPORT CENTRALISÉ - Utilisez cette fonction pour tout import
     */
    function importData(data, options = {}) {
        const report = { success: true, imported: [], errors: [], warnings: [] };
        
        if (!data || typeof data !== 'object') {
            report.success = false;
            report.errors.push('Données invalides');
            return report;
        }
        
        const backup = exportAllData();
        
        try {
            // Normaliser les clés legacy
            const normalized = {};
            for (const key in data) {
                if (key === '_meta') continue;
                const normalizedKey = LEGACY_KEY_MAP[key] || key;
                normalized[normalizedKey] = data[key];
                if (LEGACY_KEY_MAP[key]) {
                    report.warnings.push(`Clé "${key}" → "${normalizedKey}"`);
                }
            }
            
            // Agent
            if (normalized.kern_agent_profile) {
                agent = validateAgent(normalized.kern_agent_profile);
                saveAgent();
                report.imported.push('kern_agent_profile');
            }
            
            // Dossiers
            if (normalized.kern_dossiers) {
                stores.dossiers = normalized.kern_dossiers.map(validateDossier).filter(Boolean);
                saveJSON(KEYS.DOSSIERS, stores.dossiers);
                report.imported.push(`kern_dossiers (${stores.dossiers.length})`);
            }
            
            // Entités
            if (normalized.kern_entities) {
                stores.entities = normalized.kern_entities.map(validateEntity).filter(Boolean);
                saveJSON(KEYS.ENTITIES, stores.entities);
                report.imported.push(`kern_entities (${stores.entities.length})`);
            }
            
            // Contacts
            if (normalized.kern_network_contacts) {
                stores.contacts = normalized.kern_network_contacts.map(validateContact).filter(Boolean);
                saveJSON(KEYS.CONTACTS, stores.contacts);
                report.imported.push(`kern_network_contacts (${stores.contacts.length})`);
            }
            
            // Notes
            if (normalized.kern_knowledge) {
                stores.notes = normalized.kern_knowledge;
                saveJSON(KEYS.NOTES, stores.notes);
                report.imported.push(`kern_knowledge (${stores.notes.length})`);
            }
            
            // Missions
            if (normalized.kern_missions) {
                stores.missions = normalized.kern_missions;
                saveJSON(KEYS.MISSIONS, stores.missions);
                report.imported.push(`kern_missions (${stores.missions.length})`);
            }
            
            // Journal
            if (normalized.kern_journal) {
                stores.journal = normalized.kern_journal;
                saveJSON(KEYS.JOURNAL, stores.journal);
                report.imported.push(`kern_journal (${stores.journal.length})`);
            }
            
            // Partners
            if (normalized.kern_partners) {
                saveJSON(KEYS.PARTNERS, normalized.kern_partners);
                report.imported.push(`kern_partners (${normalized.kern_partners.length})`);
            }
            
            // Protocole
            if (normalized.kern_protocole) {
                saveJSON(KEYS.PROTOCOLE, normalized.kern_protocole);
                report.imported.push('kern_protocole');
            }
            
            emit('data:imported', report);
            
        } catch (e) {
            console.error('KERN Import error:', e);
            report.success = false;
            report.errors.push(e.message);
            
            if (options.rollbackOnError !== false) {
                try {
                    importData(backup, { rollbackOnError: false });
                    report.warnings.push('Backup restauré');
                } catch (e2) {
                    report.errors.push('Échec restauration: ' + e2.message);
                }
            }
        }
        
        return report;
    }
    
    function clearAllData() {
        Object.values(KEYS).forEach(key => localStorage.removeItem(key));
        Object.keys(LEGACY_KEY_MAP).forEach(key => localStorage.removeItem(key));
        
        agent = validateAgent(null);
        saveAgent();
        
        stores.dossiers = [];
        stores.entities = [];
        stores.contacts = [];
        stores.notes = [];
        stores.journal = [];
        stores.missions = [];
        
        emit('data:cleared');
    }

    // =====================================================
    // SEARCH
    // =====================================================
    function search(query) {
        const q = query.toLowerCase().trim();
        if (!q) return [];
        
        const results = [];
        
        stores.dossiers.forEach(d => {
            if (d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)) {
                results.push({ type: 'dossier', item: d, match: d.title });
            }
        });
        
        stores.entities.forEach(e => {
            if (e.name.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)) {
                results.push({ type: 'entity', item: e, match: e.name });
            }
        });
        
        stores.contacts.forEach(c => {
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            if (fullName.includes(q) || (c.organization || '').toLowerCase().includes(q)) {
                results.push({ type: 'contact', item: c, match: `${c.firstName} ${c.lastName}` });
            }
        });
        
        stores.notes.forEach(n => {
            if ((n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)) {
                results.push({ type: 'note', item: n, match: n.title });
            }
        });
        
        addXP(XP_REWARDS['search:performed'], 'Recherche');
        
        return results;
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
        
        readyCallbacks.forEach(cb => {
            try { cb(); } catch (e) { console.error('KERN ready callback error:', e); }
        });
        
        emit('kern:ready', { version: VERSION });
        console.log(`KERN Core v${VERSION} initialized`);
    }

    function ready(callback) {
        if (initialized) callback();
        else readyCallbacks.push(callback);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // =====================================================
    // PUBLIC API
    // =====================================================
    global.KERN = {
        VERSION, SCHEMA_VERSION, KEYS, DEFAULTS, CLEARANCE_LEVELS, SKILLS,
        on, off, emit,
        getAgent: () => agent, getStats, addXP,
        awardXP: addXP,  // Alias
        trainSkill: addSkillXP,  // Alias
        createDossier, updateDossier, getAllDossiers, deleteDossier, getDossier,
        createEntity, linkEntities, getAllEntities, getEntity,
        createContact, linkContacts, getAllContacts, getContact,
        createNote, getAllNotes, getNote, updateNote,
        createMission, completeMission, getAllMissions,
        addJournalEntry, getAllJournalEntries,
        logActivity, getActivityLog,
        getRecentActivity: getActivityLog,  // Alias
        exportAllData, importData, clearAllData,
        importAllData: importData,  // Alias
        search, ready
    };

})(window);
