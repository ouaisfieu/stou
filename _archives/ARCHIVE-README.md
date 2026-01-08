# 📦 KERN — Modules Archivés

> **Ces modules ont été remplacés par des versions améliorées et unifiées.**  
> Ils sont conservés à titre de référence historique.

---

## Pourquoi archiver ?

Lors de l'unification KERN v2.0, plusieurs modules faisaient **doublon** ou ont été **fusionnés** dans des versions plus complètes. Plutôt que de les supprimer, nous les avons archivés pour :

1. **Conserver l'historique** du développement
2. **Permettre la récupération** de code ou fonctionnalités spécifiques
3. **Documenter l'évolution** du projet

---

## 📋 Liste des Modules Archivés

### 1. 00-citadel-command.html (54 KB)

| Attribut | Valeur |
|----------|--------|
| **Remplacé par** | `00-kern-nexus.html` |
| **Raison** | Dashboard dupliqué |
| **Date d'archivage** | Janvier 2026 |

**Description originale :**  
Premier prototype de centre de commandement avec interface "bunker militaire". Design très sombre avec terminologie tactique (CITADEL, COMMAND, etc.).

**Pourquoi archivé :**  
- Interface trop complexe et intimidante
- Fonctionnalités dupliquées avec NEXUS-HQ
- Pas d'intégration KERN-CORE
- Remplacé par KERN::NEXUS qui unifie les deux approches

**Ce qui a été conservé dans KERN::NEXUS :**
- Concept de "centre de commandement"
- Stats en temps réel
- Navigation par modules

---

### 2. 00-nexus-hq.html (37 KB)

| Attribut | Valeur |
|----------|--------|
| **Remplacé par** | `00-kern-nexus.html` |
| **Raison** | Fusion avec Citadel Command |
| **Date d'archivage** | Janvier 2026 |

**Description originale :**  
Version alternative du dashboard avec design plus épuré, orienté "QG" (Quartier Général). Interface plus accessible que Citadel.

**Pourquoi archivé :**  
- Redondant avec 00-citadel-command.html
- Pas d'intégration KERN-CORE
- Manquait de fonctionnalités avancées
- Fusionné dans KERN::NEXUS

**Ce qui a été conservé dans KERN::NEXUS :**
- Design plus accessible
- Structure de navigation claire
- Concept de hub central

---

### 3. 04-network-map.html (43 KB)

| Attribut | Valeur |
|----------|--------|
| **Remplacé par** | `17-contact-network.html` |
| **Raison** | Version obsolète du réseau |
| **Date d'archivage** | Janvier 2026 |

**Description originale :**  
Première version de la cartographie réseau avec visualisation basique des contacts et connexions.

**Pourquoi archivé :**  
- Visualisation D3.js limitée (pas de force-directed graph)
- Pas de gestion de la force des liens
- Pas d'intégration KERN-CORE
- Interface moins intuitive
- Remplacé par KERN::NETWORK avec graphe radial interactif

**Ce qui a été conservé dans KERN::NETWORK :**
- Concept de visualisation réseau
- Catégorisation des contacts
- Export des données

**Améliorations dans KERN::NETWORK :**
- Graphe radial D3.js interactif
- Force des liens (1-5)
- Tags et recherche
- Intégration XP automatique
- Design moderne

---

### 4. 07-dashboard.html (43 KB)

| Attribut | Valeur |
|----------|--------|
| **Remplacé par** | `00-kern-nexus.html` |
| **Raison** | Troisième dashboard redondant |
| **Date d'archivage** | Janvier 2026 |

**Description originale :**  
Dashboard généraliste avec widgets configurables. Tentative de créer un tableau de bord personnalisable.

**Pourquoi archivé :**  
- Troisième tentative de dashboard (après Citadel et NEXUS-HQ)
- Widgets pas assez intégrés avec les autres modules
- Pas d'intégration KERN-CORE
- Complexité inutile
- Consolidé dans KERN::NEXUS

**Ce qui a été conservé dans KERN::NEXUS :**
- Concept de widgets/cartes statistiques
- Activité récente
- Accès rapide aux modules

---

## 📊 Récapitulatif

| Module archivé | Taille | Remplacé par | Gain |
|----------------|--------|--------------|------|
| 00-citadel-command.html | 54 KB | 00-kern-nexus.html | Unifié |
| 00-nexus-hq.html | 37 KB | 00-kern-nexus.html | Unifié |
| 04-network-map.html | 43 KB | 17-contact-network.html | Amélioré |
| 07-dashboard.html | 43 KB | 00-kern-nexus.html | Unifié |
| **TOTAL** | **177 KB** | — | — |

---

## 🔄 Migration

Si vous aviez des données dans ces anciens modules :

### Données localStorage concernées

```
Ancien module              Ancienne clé           Nouvelle clé
─────────────              ────────────           ────────────
04-network-map.html        networkContacts        kern_network_contacts
                           networkLinks           (intégré dans contacts)
```

### Script de migration (si nécessaire)

```javascript
// Migrer les anciens contacts vers le nouveau format
const oldContacts = localStorage.getItem('networkContacts');
if (oldContacts && !localStorage.getItem('kern_network_contacts')) {
    const contacts = JSON.parse(oldContacts);
    // Adapter le format si nécessaire
    localStorage.setItem('kern_network_contacts', JSON.stringify(contacts));
    console.log('Migration effectuée !');
}
```

---

## ⚠️ Note importante

**Ces fichiers ne sont plus maintenus.** Ils peuvent contenir :
- Des bugs non corrigés
- Des failles de sécurité
- Des incompatibilités avec les navigateurs récents
- Du code non optimisé

**Utilisez les versions actuelles** dans le dossier principal `/outils/`.

---

## 📁 Structure

```
outils/
├── _archive/                          ← Vous êtes ici
│   ├── 00-citadel-command.html       (54 KB) → 00-kern-nexus
│   ├── 00-nexus-hq.html              (37 KB) → 00-kern-nexus
│   ├── 04-network-map.html           (43 KB) → 17-contact-network
│   ├── 07-dashboard.html             (43 KB) → 00-kern-nexus
│   └── ARCHIVE-README.md             (ce fichier)
│
├── 00-kern-nexus.html                 ✅ Dashboard unifié actuel
├── 17-contact-network.html            ✅ Réseau de contacts actuel
└── ...
```

---

<div align="center">

*Ces modules font partie de l'histoire de KERN.*  
*Merci de respecter le travail accompli.* 💚

</div>
