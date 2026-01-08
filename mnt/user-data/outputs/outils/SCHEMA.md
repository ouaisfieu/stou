# KERN DATA SCHEMA v2.0

## ⚠️ RÈGLE ABSOLUE

**Ce document est la source de vérité.** Tout code qui manipule les données KERN doit respecter ce schéma. Aucune exception.

---

## 📦 CLÉS LOCALSTORAGE

| Clé | Type | Obligatoire | Description |
|-----|------|-------------|-------------|
| `kern_agent_profile` | Object | ✅ OUI | Profil de l'agent |
| `kern_dossiers` | Array | Non | Dossiers d'investigation |
| `kern_entities` | Array | Non | Entités (personnes, orgs, etc.) |
| `kern_network_contacts` | Array | Non | Contacts du réseau |
| `kern_knowledge` | Array | Non | Notes/connaissances |
| `kern_missions` | Array | Non | Missions |
| `kern_journal` | Array | Non | Entrées de journal |
| `kern_partners` | Array | Non | Partenaires |
| `kern_protocole` | Object | Non | Données Protocole Insurrection |
| `kern_activity_log` | Array | Non | Log d'activité (géré auto) |
| `kern_settings` | Object | Non | Paramètres (géré auto) |

### ❌ CLÉS INTERDITES (legacy)

Ces clés ne doivent JAMAIS être utilisées :
- `kern_agent` → utiliser `kern_agent_profile`
- `kern_contacts` → utiliser `kern_network_contacts`
- `kern_notes` → utiliser `kern_knowledge`

---

## 👤 AGENT PROFILE

**Clé:** `kern_agent_profile`

```typescript
interface AgentProfile {
  // === IDENTITÉ (requis) ===
  codename: string;           // Ex: "GANDALF-PRIME"
  
  // === PROGRESSION (requis) ===
  level: number;              // Min: 1
  xp: number;                 // Min: 0
  xpToNext: number;           // XP requis pour niveau suivant
  clearance: number;          // 0-7 (index dans CLEARANCE_LEVELS)
  
  // === ACTIVITÉ ===
  streak: number;             // Jours consécutifs (default: 0)
  lastLogin: string;          // ISO date "YYYY-MM-DD"
  
  // === SKILLS (requis) ===
  skills: {
    investigation: SkillData;
    network: SkillData;
    analysis: SkillData;
    documentation: SkillData;
    fieldwork: SkillData;
    opsec: SkillData;
  };
  
  // === STATS (requis) ===
  stats: AgentStats;
  
  // === ACHIEVEMENTS (requis, peut être vide) ===
  achievements: string[];
  
  // === SETTINGS (requis) ===
  settings: AgentSettings;
}

interface SkillData {
  level: number;              // Min: 1
  xp: number;                 // Min: 0
}

interface AgentStats {
  dossiersCreated: number;
  entitiesCreated: number;
  contactsAdded: number;
  notesWritten: number;
  missionsCompleted: number;
  linksDiscovered: number;
  daysActive: number;
  totalActions: number;
}

interface AgentSettings {
  theme: "dark" | "light";
  notifications: boolean;
  soundEffects: boolean;
}
```

### Valeurs par défaut

```javascript
const DEFAULT_AGENT = {
  codename: "AGENT-001",
  level: 1,
  xp: 0,
  xpToNext: 1000,
  clearance: 0,
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
};
```

---

## 📁 DOSSIERS

**Clé:** `kern_dossiers`

```typescript
interface Dossier {
  // === IDENTITÉ (requis) ===
  id: string;                 // Format: "dossier_{timestamp}_{random}"
  title: string;
  
  // === MÉTADONNÉES ===
  created: string;            // ISO datetime
  updated: string;            // ISO datetime
  description: string;        // Default: ""
  status: "active" | "completed" | "archived";  // Default: "active"
  priority: "critical" | "high" | "medium" | "low";  // Default: "medium"
  tags: string[];             // Default: []
  
  // === TIMELINE ===
  timeline: TimelineEvent[];  // Default: []
  
  // === PREUVES ===
  evidence: Evidence[];       // Default: []
  
  // === LIENS ===
  linkedEntities: string[];   // IDs d'entités. Default: []
  linkedContacts: string[];   // IDs de contacts. Default: []
}

interface TimelineEvent {
  date: string;               // "YYYY-MM-DD"
  event: string;              // Description
  type: "discovery" | "breakthrough" | "intel" | "critical" | "meeting" | "incident" | "start" | "end";
}

interface Evidence {
  id: string;
  type: "document" | "artifact" | "testimony" | "data" | "image" | "link";
  title: string;
  source: string;             // Default: ""
  reliability: number;        // 1-5
}
```

### Valeurs par défaut

```javascript
const DEFAULT_DOSSIER = {
  id: null,                   // Généré automatiquement
  title: "Nouveau dossier",
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  description: "",
  status: "active",
  priority: "medium",
  tags: [],
  timeline: [],
  evidence: [],
  linkedEntities: [],
  linkedContacts: []
};
```

---

## 🕸️ ENTITÉS

**Clé:** `kern_entities`

```typescript
interface Entity {
  // === IDENTITÉ (requis) ===
  id: string;                 // Format: "entity_{timestamp}_{random}"
  name: string;
  type: EntityType;
  
  // === MÉTADONNÉES ===
  subtype: string;            // Default: ""
  emoji: string;              // Default: selon type
  description: string;        // Default: ""
  tags: string[];             // Default: []
  created: string;            // ISO datetime
  
  // === LIENS (requis, peut être vide) ===
  links: EntityLink[];
}

type EntityType = 
  | "person" 
  | "organization" 
  | "company" 
  | "media" 
  | "institution" 
  | "event" 
  | "document" 
  | "location" 
  | "other";

interface EntityLink {
  targetId: string;           // ID de l'entité cible
  type: string;               // Type de relation (libre)
  label: string;              // Label affiché
}
```

### Emojis par défaut selon type

```javascript
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
```

---

## 👥 CONTACTS

**Clé:** `kern_network_contacts`

```typescript
interface Contact {
  // === IDENTITÉ (requis) ===
  id: string;                 // Format: "contact_{timestamp}_{random}"
  firstName: string;
  lastName: string;
  
  // === MÉTADONNÉES ===
  emoji: string;              // Default: "👤"
  organization: string;       // Default: ""
  role: string;               // Default: ""
  category: ContactCategory;  // Default: "other"
  strength: number;           // 1-5, Default: 3
  
  // === COORDONNÉES ===
  email: string;              // Default: ""
  phone: string;              // Default: ""
  location: string;           // Default: ""
  
  // === NOTES ===
  notes: string;              // Default: ""
  tags: string[];             // Default: []
  lastContact: string;        // "YYYY-MM-DD" ou ""
  
  // === CONNEXIONS (requis, peut être vide) ===
  connections: string[];      // IDs d'autres contacts
}

type ContactCategory = 
  | "ally" 
  | "source" 
  | "professional" 
  | "official" 
  | "media" 
  | "academic" 
  | "other";
```

---

## 🧠 KNOWLEDGE (Notes)

**Clé:** `kern_knowledge`

```typescript
interface Note {
  // === IDENTITÉ (requis) ===
  id: string;                 // Format: "note_{timestamp}_{random}"
  title: string;
  
  // === CONTENU ===
  content: string;            // Markdown supporté. Default: ""
  tags: string[];             // Default: []
  
  // === DATES ===
  created: string;            // ISO datetime
  updated: string;            // ISO datetime
  
  // === LIENS ===
  linkedNotes: string[];      // IDs d'autres notes. Default: []
}
```

---

## 🎯 MISSIONS

**Clé:** `kern_missions`

```typescript
interface Mission {
  // === IDENTITÉ (requis) ===
  id: string;                 // Format: "mission_{timestamp}_{random}"
  name: string;
  
  // === MÉTADONNÉES ===
  emoji: string;              // Default: "🎯"
  description: string;        // Default: ""
  difficulty: "easy" | "medium" | "hard" | "expert";  // Default: "medium"
  xpReward: number;           // Default: 100
  status: "active" | "completed";  // Default: "active"
  created: string;            // ISO datetime
  
  // === OBJECTIFS (requis) ===
  requirements: string[];     // Liste des objectifs
  completedReqs: number[];    // Indices des objectifs complétés. Default: []
}
```

---

## 📓 JOURNAL

**Clé:** `kern_journal`

```typescript
interface JournalEntry {
  // === IDENTITÉ (requis) ===
  id: string;                 // Format: "journal_{timestamp}_{random}"
  
  // === CONTENU ===
  content: string;            // Markdown supporté
  tags: string[];             // Default: []
  
  // === DATES ===
  createdAt: string;          // ISO datetime
  updatedAt: string;          // ISO datetime
}
```

---

## 🤝 PARTNERS

**Clé:** `kern_partners`

```typescript
interface Partner {
  // === IDENTITÉ (requis) ===
  id: string;                 // Format: "partner_{random}"
  name: string;
  
  // === MÉTADONNÉES ===
  emoji: string;              // Default: "🤝"
  tagline: string;            // Default: ""
  sector: string;             // Default: ""
  revenue: number;            // CA en euros. Default: 0
  tier: "free" | "silver" | "gold" | "platinum" | "diamond";  // Default: "free"
  status: "prospect" | "negotiation" | "active" | "premium";  // Default: "prospect"
  
  // === COORDONNÉES ===
  website: string;            // Default: ""
  description: string;        // Default: ""
  email: string;              // Default: ""
  phone: string;              // Default: ""
  address: string;            // Default: ""
  
  // === PRODUITS ===
  products: Product[];        // Default: []
}

interface Product {
  name: string;
  icon: string;
  price: string;
  description: string;
}
```

---

## ⚡ PROTOCOLE

**Clé:** `kern_protocole`

```typescript
interface Protocole {
  missions: ProtocoleMission[];
  flashcards: Flashcard[];
  [key: string]: any;         // Données spécifiques (ex: colruyt)
}

interface ProtocoleMission {
  id: string;
  type: "tutorial" | "campaign";
  name: string;
  target: string;
  objective: string;
  difficulty: number;         // 0-100
  xp: number;
  phases?: Phase[];           // Pour type "tutorial"
  levels?: Level[];           // Pour type "campaign"
}

interface Flashcard {
  q: string;
  a: string;
  category?: string;
}
```

---

## 🔄 IMPORT/EXPORT

### Format d'export

```javascript
{
  "_meta": {
    "version": "2.0",
    "exported": "2026-01-06T12:00:00.000Z",
    "source": "KERN"
  },
  "kern_agent_profile": { ... },
  "kern_dossiers": [ ... ],
  "kern_entities": [ ... ],
  "kern_network_contacts": [ ... ],
  "kern_knowledge": [ ... ],
  "kern_missions": [ ... ],
  "kern_journal": [ ... ],
  "kern_partners": [ ... ],
  "kern_protocole": { ... }
}
```

### Règles d'import

1. **Correction automatique des clés legacy**
   - `kern_agent` → `kern_agent_profile`

2. **Complétion des structures manquantes**
   - Agent sans `stats` → ajouter stats par défaut
   - Agent sans `achievements` → ajouter `[]`
   - Agent sans `settings` → ajouter settings par défaut
   - Entity sans `links` → ajouter `[]`
   - Contact sans `connections` → ajouter `[]`

3. **Validation**
   - JSON valide
   - Types corrects
   - IDs uniques

---

## 🧪 VALIDATION

### Fonction de validation

```javascript
function validate(key, data) {
  const validators = {
    kern_agent_profile: validateAgent,
    kern_dossiers: (d) => d.every(validateDossier),
    kern_entities: (d) => d.every(validateEntity),
    kern_network_contacts: (d) => d.every(validateContact),
    kern_knowledge: (d) => d.every(validateNote),
    kern_missions: (d) => d.every(validateMission),
    kern_journal: (d) => d.every(validateJournalEntry),
    kern_partners: (d) => d.every(validatePartner),
    kern_protocole: validateProtocole
  };
  
  return validators[key] ? validators[key](data) : true;
}
```

---

## 📋 CHECKLIST AVANT MODIFICATION

Avant de modifier ce schéma :

- [ ] Tous les modules impactés sont identifiés
- [ ] Migration des données existantes prévue
- [ ] Tests mis à jour
- [ ] Documentation mise à jour
- [ ] Version incrémentée

---

**Version:** 2.0  
**Date:** 2026-01-06  
**Statut:** DÉFINITIF
