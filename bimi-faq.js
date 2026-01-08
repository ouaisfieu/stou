/**
 * B!Mi FAQ — Base de connaissances offline
 * Répond aux questions courantes sans API
 */

const BIMI_FAQ = [
    // ==========================================
    // GÉNÉRAL
    // ==========================================
    {
        keywords: ['kern', 'quoi', 'cest', 'c\'est', 'what', 'présente', 'explique'],
        question: "C'est quoi KERN ?",
        answer: `**KERN** est un système d'investigation et de gestion de connaissances gamifié.

Il permet de :
- 📁 Gérer des **dossiers** d'investigation
- 🕸️ Mapper des **entités** et leurs relations (PANOPTICON)
- 👥 Gérer un réseau de **contacts**
- 🧠 Prendre des **notes** interconnectées
- 🎯 Suivre des **missions** avec récompenses XP
- 📓 Tenir un **journal**

Toutes les données sont stockées localement dans ton navigateur (localStorage).`
    },
    
    // ==========================================
    // IMPORT / EXPORT
    // ==========================================
    {
        keywords: ['import', 'importer', 'données', 'json', 'charger'],
        question: "Comment importer mes données ?",
        answer: `Pour importer des données dans KERN :

1. Va sur **import.html**
2. Glisse ton fichier JSON ou clique pour sélectionner
3. Vérifie l'aperçu
4. Clique **"✅ Importer"**

💡 **Astuce** : KERN corrige automatiquement les problèmes courants (clés legacy, structures manquantes).

Si tu as des erreurs, utilise **debug.html** pour voir l'état du localStorage.`
    },
    {
        keywords: ['export', 'exporter', 'sauvegarder', 'backup', 'sauvegarde'],
        question: "Comment exporter mes données ?",
        answer: `Pour exporter tes données KERN :

**Méthode 1 : Via l'interface**
Dans NEXUS, cherche le bouton d'export.

**Méthode 2 : Via la console (F12)**
\`\`\`javascript
const data = KERN.exportAllData();
const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'kern-backup.json';
a.click();
\`\`\`

Le fichier contiendra toutes tes données : agent, dossiers, entités, contacts, notes, etc.`
    },
    {
        keywords: ['plante', 'crash', 'erreur', 'marche pas', 'bug', 'bloqué', 'bloque'],
        question: "Mon import plante / KERN ne marche pas",
        answer: `**Problèmes courants et solutions :**

**1. Erreur "Cannot read properties of undefined (reading 'dossiersCreated')"**
→ L'agent n'a pas la propriété \`stats\`
→ **Solution** : Utilise \`import.html\` qui corrige automatiquement

**2. Données non visibles après import**
→ Mauvaise clé localStorage
→ **Vérifier** : \`kern_agent_profile\` (pas \`kern_agent\`)

**3. Écran de bienvenue en boucle**
→ Le code cherchait \`stats.dossiers\` au lieu de \`stats.data.dossiers\`
→ **Solution** : Mettre à jour \`kern-core.js\` et \`00-kern-nexus.html\`

**Debug** : Ouvre \`debug.html\` pour voir l'état exact du localStorage.`
    },
    
    // ==========================================
    // STRUCTURE AGENT
    // ==========================================
    {
        keywords: ['agent', 'profil', 'profile', 'structure', 'obligatoire'],
        question: "Quelle est la structure de l'agent ?",
        answer: `L'agent est **OBLIGATOIRE**. Sans lui, KERN plante.

**Clé localStorage** : \`kern_agent_profile\`

**Propriétés obligatoires** :
- \`codename\` : Nom de code
- \`level\`, \`xp\`, \`xpToNext\` : Progression
- \`skills\` : 6 compétences (investigation, network, analysis, documentation, fieldwork, opsec)
- \`stats\` : Compteurs (dossiersCreated, entitiesCreated, etc.)
- \`achievements\` : Tableau (peut être vide \`[]\`)
- \`settings\` : Préférences (theme, notifications, soundEffects)

⚠️ Si \`stats\` manque → erreur "Cannot read 'dossiersCreated'"`
    },
    {
        keywords: ['stats', 'dossiersCreated', 'undefined', 'cannot read'],
        question: "Erreur 'Cannot read properties of undefined'",
        answer: `Cette erreur signifie que l'objet \`stats\` manque dans ton profil agent.

**Cause** : Ton fichier JSON a un agent incomplet :
\`\`\`json
{
  "kern_agent_profile": {
    "codename": "MON-AGENT",
    "level": 5
    // ❌ stats manquant !
  }
}
\`\`\`

**Solution** :
1. Va sur \`import.html\`
2. Importe ton fichier
3. KERN ajoutera automatiquement \`stats\`, \`achievements\`, \`settings\`

Ou ajoute manuellement :
\`\`\`json
"stats": {
  "dossiersCreated": 0,
  "entitiesCreated": 0,
  "contactsAdded": 0,
  "notesWritten": 0,
  "missionsCompleted": 0,
  "linksDiscovered": 0,
  "daysActive": 1,
  "totalActions": 0
}
\`\`\``
    },
    
    // ==========================================
    // CLÉS LOCALSTORAGE
    // ==========================================
    {
        keywords: ['clé', 'clés', 'cle', 'cles', 'localstorage', 'storage', 'key', 'keys'],
        question: "Quelles sont les clés localStorage ?",
        answer: `**Clés officielles KERN** :

| Clé | Type | Description |
|-----|------|-------------|
| \`kern_agent_profile\` | Object | Profil agent (OBLIGATOIRE) |
| \`kern_dossiers\` | Array | Dossiers |
| \`kern_entities\` | Array | Entités |
| \`kern_network_contacts\` | Array | Contacts |
| \`kern_knowledge\` | Array | Notes |
| \`kern_missions\` | Array | Missions |
| \`kern_journal\` | Array | Journal |
| \`kern_partners\` | Array | Partenaires |
| \`kern_protocole\` | Object | Protocole Insurrection |

**⚠️ Clés legacy (à éviter)** :
- \`kern_agent\` → utiliser \`kern_agent_profile\`
- \`kern_contacts\` → utiliser \`kern_network_contacts\`
- \`kern_notes\` → utiliser \`kern_knowledge\``
    },
    {
        keywords: ['kern_agent', 'legacy', 'ancienne', 'ancien', 'migration'],
        question: "Différence kern_agent vs kern_agent_profile ?",
        answer: `**\`kern_agent\`** est une clé **legacy** (ancienne).

**Utilise toujours \`kern_agent_profile\`**.

Si ton fichier JSON contient \`kern_agent\`, KERN.importData() le corrige automatiquement :
\`\`\`
kern_agent → kern_agent_profile
\`\`\`

C'est la cause #1 des problèmes d'import !`
    },
    
    // ==========================================
    // DOSSIERS
    // ==========================================
    {
        keywords: ['dossier', 'dossiers', 'créer', 'creer', 'nouveau'],
        question: "Comment créer un dossier ?",
        answer: `**Via l'interface** :
1. Va sur NEXUS ou la page Dossiers
2. Clique "Nouveau dossier"
3. Remplis le titre, description, priorité

**Via JavaScript** :
\`\`\`javascript
KERN.createDossier({
  title: "Mon dossier",
  description: "Description...",
  priority: "high", // critical, high, medium, low
  tags: ["tag1", "tag2"]
});
\`\`\`

**Structure d'un dossier** :
- \`id\` : Généré automatiquement
- \`title\` : Titre (obligatoire)
- \`status\` : active, completed, archived
- \`priority\` : critical, high, medium, low
- \`timeline\` : Événements chronologiques
- \`evidence\` : Preuves
- \`linkedEntities\`, \`linkedContacts\` : Liens`
    },
    
    // ==========================================
    // ENTITÉS
    // ==========================================
    {
        keywords: ['entité', 'entite', 'entités', 'entites', 'entity', 'panopticon'],
        question: "Comment fonctionnent les entités ?",
        answer: `Les **entités** représentent des personnes, organisations, lieux, etc.

**Clé localStorage** : \`kern_entities\`

**Types disponibles** :
- \`person\` 👤
- \`organization\` 🏛️
- \`company\` 🏢
- \`media\` 📰
- \`institution\` 🏦
- \`event\` 📅
- \`document\` 📄
- \`location\` 📍
- \`other\` ❓

**Créer une entité** :
\`\`\`javascript
KERN.createEntity({
  name: "Nom",
  type: "organization",
  description: "Description..."
});
\`\`\`

**Lier deux entités** :
\`\`\`javascript
KERN.linkEntities(sourceId, targetId, "controls", "Contrôle");
\`\`\`

⚠️ Chaque entité doit avoir un array \`links\` (même vide).`
    },
    {
        keywords: ['links', 'lien', 'liens', 'relation', 'relations', 'connexion'],
        question: "Comment fonctionnent les liens entre entités ?",
        answer: `Les entités peuvent être liées entre elles.

**Structure d'un lien** :
\`\`\`json
{
  "links": [
    {
      "targetId": "entity_xxx",
      "type": "controls",
      "label": "Contrôle"
    }
  ]
}
\`\`\`

**Types de liens courants** :
- \`controls\` / \`controlled_by\`
- \`owns\` / \`owned_by\`
- \`works_with\` / \`partner\`
- \`opposes\` / \`enemy\`
- \`employs\` / \`employed_by\`

**Via JavaScript** :
\`\`\`javascript
KERN.linkEntities(sourceId, targetId, "controls", "Contrôle");
\`\`\`

⚠️ \`links\` doit TOUJOURS être un array, même vide.`
    },
    
    // ==========================================
    // CONTACTS
    // ==========================================
    {
        keywords: ['contact', 'contacts', 'réseau', 'reseau', 'network'],
        question: "Comment fonctionnent les contacts ?",
        answer: `Les **contacts** représentent ton réseau de personnes.

**Clé localStorage** : \`kern_network_contacts\`

**Catégories** :
- \`ally\` 🤝 Allié
- \`source\` 🎭 Source d'info
- \`professional\` 💼 Pro
- \`official\` 🏛️ Officiel
- \`media\` 📰 Journaliste
- \`academic\` 🎓 Académique
- \`other\` 👤 Autre

**Créer un contact** :
\`\`\`javascript
KERN.createContact({
  firstName: "Jean",
  lastName: "Dupont",
  organization: "Acme Corp",
  category: "professional",
  strength: 4 // 1-5
});
\`\`\`

⚠️ Chaque contact doit avoir un array \`connections\` (même vide).`
    },
    
    // ==========================================
    // API JAVASCRIPT
    // ==========================================
    {
        keywords: ['api', 'javascript', 'js', 'fonction', 'fonctions', 'méthode', 'methode'],
        question: "Quelles sont les fonctions KERN disponibles ?",
        answer: `**Principales fonctions de l'API KERN** :

**Agent**
- \`KERN.getAgent()\` - Profil agent
- \`KERN.getStats()\` - Stats complètes
- \`KERN.addXP(amount, reason)\`

**Dossiers**
- \`KERN.createDossier(data)\`
- \`KERN.updateDossier(id, data)\`
- \`KERN.getAllDossiers()\`
- \`KERN.getDossier(id)\`
- \`KERN.deleteDossier(id)\`

**Entités**
- \`KERN.createEntity(data)\`
- \`KERN.getAllEntities()\`
- \`KERN.linkEntities(src, target, type, label)\`

**Contacts**
- \`KERN.createContact(data)\`
- \`KERN.getAllContacts()\`
- \`KERN.linkContacts(src, target)\`

**Import/Export**
- \`KERN.exportAllData()\`
- \`KERN.importData(json)\` ← Utilisez celle-ci !
- \`KERN.clearAllData()\`

**Événements**
- \`KERN.on('event', callback)\`
- \`KERN.emit('event', data)\``
    },
    {
        keywords: ['ready', 'initialisation', 'init', 'démarrage', 'demarrage'],
        question: "Comment initialiser KERN ?",
        answer: `KERN s'initialise automatiquement au chargement de la page.

Pour exécuter du code quand KERN est prêt :
\`\`\`javascript
KERN.ready(() => {
  console.log('KERN est prêt !');
  const agent = KERN.getAgent();
  const stats = KERN.getStats();
});
\`\`\`

**Important** : Toujours utiliser \`KERN.ready()\` pour s'assurer que les données sont chargées.`
    },
    
    // ==========================================
    // PAGES
    // ==========================================
    {
        keywords: ['page', 'pages', 'url', 'navigation', 'accès', 'acces'],
        question: "Quelles sont les pages KERN ?",
        answer: `**Pages principales** :

| Page | URL | Description |
|------|-----|-------------|
| Accueil | \`index.html\` | Point d'entrée |
| NEXUS | \`00-kern-nexus.html\` | Dashboard principal |
| Import | \`import.html\` | Importer des données |
| Debug | \`debug.html\` | Voir le localStorage |
| Tests | \`test.html\` | Tests automatisés |
| Wiki | \`wiki-data.html\` | Documentation formats |
| B!Mi Config | \`bimi-config.html\` | Config assistant |

**Modules** :
- Dossiers, PANOPTICON, Contacts, Knowledge, Missions, Journal...`
    },
    
    // ==========================================
    // DEBUG
    // ==========================================
    {
        keywords: ['debug', 'debugger', 'console', 'voir', 'vérifier', 'verifier', 'état', 'etat'],
        question: "Comment débugger KERN ?",
        answer: `**Outils de debug** :

**1. Page debug.html**
Affiche l'état complet du localStorage KERN.

**2. Console du navigateur (F12)**
\`\`\`javascript
// Voir toutes les clés KERN
Object.keys(localStorage).filter(k => k.startsWith('kern_'));

// Voir l'agent
JSON.parse(localStorage.getItem('kern_agent_profile'));

// Voir les stats
KERN.getStats();

// Tout effacer
KERN.clearAllData();
\`\`\`

**3. Page test.html**
Lance les tests automatisés pour vérifier que KERN fonctionne.

**4. Valider un JSON**
Avant d'importer, valide sur jsonlint.com`
    },
    {
        keywords: ['effacer', 'supprimer', 'reset', 'vider', 'clear', 'nettoyer'],
        question: "Comment effacer toutes les données ?",
        answer: `**Via l'interface** :
1. Va sur \`import.html\` ou \`debug.html\`
2. Clique **"🗑️ Effacer"**

**Via JavaScript** :
\`\`\`javascript
KERN.clearAllData();
\`\`\`

**Via console** :
\`\`\`javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('kern_'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
\`\`\`

⚠️ Cette action est irréversible ! Exporte d'abord tes données.`
    },
    
    // ==========================================
    // B!Mi
    // ==========================================
    {
        keywords: ['bimi', 'b!mi', 'assistant', 'aide', 'help', 'toi', 'qui es'],
        question: "Qui est B!Mi ?",
        answer: `Je suis **B!Mi**, l'assistant virtuel de KERN ! 🤖

**Mode FAQ** (actuel) :
- Répond aux questions courantes
- Gratuit, instantané, offline
- Basé sur la documentation embarquée

**Mode OpenAI** (optionnel) :
- Conversation plus naturelle
- Peut répondre à des questions complexes
- Nécessite une clé API OpenAI
- Configure sur \`bimi-config.html\`

Je suis là pour t'aider à comprendre et utiliser KERN !`
    }
];

/**
 * Recherche une réponse dans la FAQ
 * @param {string} query - La question de l'utilisateur
 * @returns {object|null} - La réponse ou null si pas trouvé
 */
function searchFAQ(query) {
    const normalizedQuery = query.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, ' ') // Remove special chars
        .split(/\s+/)
        .filter(w => w.length > 2); // Keep words > 2 chars
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const item of BIMI_FAQ) {
        let score = 0;
        
        for (const keyword of item.keywords) {
            const normalizedKeyword = keyword.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            for (const word of normalizedQuery) {
                if (normalizedKeyword.includes(word) || word.includes(normalizedKeyword)) {
                    score += 2;
                }
                // Partial match
                if (normalizedKeyword.startsWith(word) || word.startsWith(normalizedKeyword)) {
                    score += 1;
                }
            }
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    }
    
    // Threshold: need at least 2 points to consider it a match
    if (bestScore >= 2) {
        return {
            found: true,
            score: bestScore,
            question: bestMatch.question,
            answer: bestMatch.answer
        };
    }
    
    return {
        found: false,
        score: 0,
        suggestions: getRandomSuggestions(3)
    };
}

/**
 * Retourne des suggestions aléatoires
 */
function getRandomSuggestions(count) {
    const shuffled = [...BIMI_FAQ].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(item => item.question);
}

/**
 * Retourne toutes les questions disponibles
 */
function getAllQuestions() {
    return BIMI_FAQ.map(item => item.question);
}

// Export
if (typeof window !== 'undefined') {
    window.BIMI_FAQ = BIMI_FAQ;
    window.searchFAQ = searchFAQ;
    window.getAllQuestions = getAllQuestions;
}
