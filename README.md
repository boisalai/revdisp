# Calculateur du revenu disponible - Québec

Un calculateur moderne des impôts, cotisations et transferts au Québec, reproduisant la fonctionnalité du [calculateur officiel du ministère des Finances du Québec](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp) avec une interface utilisateur moderne et conforme au GOV.UK Design System.

## 🚀 Démonstration

[Voir la démonstration en direct](https://yourusername.github.io/revdisp/)

## ✨ Fonctionnalités

- **Interface moderne** construite avec Next.js et stylée selon le GOV.UK Design System
- **Calculs précis** basés sur les paramètres fiscaux officiels 2024
- **Support bilingue** complet (français/anglais)
- **Validation automatisée** avec 15+ cas de test vs calculateur officiel
- **Tableau de résultats détaillé** reproduisant le format gouvernemental
- **Types de ménages supportés** :
  - Personne vivant seule
  - Famille monoparentale  
  - Couple
  - Retraité vivant seul
  - Couple de retraités
- **Gestion intelligente des enfants** (seulement pour couples et familles monoparentales)

## 🛠️ Technologies

- **Frontend** : Next.js 14, React, TypeScript
- **Styles** : Tailwind CSS + GOV.UK Design System
- **Calculs** : Decimal.js pour la précision monétaire
- **Validation** : Système automatisé avec moteur de comparaison
- **i18n** : Support bilingue intégré (FR/EN)
- **Déploiement** : GitHub Pages (export statique)

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/yourusername/revdisp.git
cd revdisp

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3001](http://localhost:3001) dans votre navigateur.

## 🏗️ Architecture

### Structure du projet
```
src/
├── app/                     # Pages Next.js (App Router)
│   ├── page.tsx            # Page principale
│   └── validation/         # Page de validation
├── lib/
│   ├── core/               # Infrastructure de base
│   │   ├── BaseCalculator.ts # Classe abstraite pour calculateurs
│   │   ├── factory.ts      # Factory pattern pour création
│   │   └── exceptions.ts   # Gestion d'erreurs
│   ├── config/             # Gestion de configuration
│   │   └── ConfigManager.ts # Chargement des paramètres fiscaux
│   ├── calculators/        # Calculateurs spécialisés
│   │   ├── QppCalculator.ts # RRQ/QPP
│   │   ├── EmploymentInsuranceCalculator.ts # AE
│   │   ├── RqapCalculator.ts # RQAP
│   │   ├── FssCalculator.ts # FSS
│   │   └── RamqCalculator.ts # RAMQ
│   ├── validation/         # Système de validation
│   │   ├── ValidationTestCases.ts # 15+ cas de test
│   │   ├── ValidationEngine.ts # Moteur de comparaison
│   │   └── ValidationRunner.ts # Script CLI
│   ├── i18n/              # Internationalisation
│   │   └── translations.ts # Traductions FR/EN
│   ├── models/            # Modèles de données
│   │   └── index.ts       # Person, Household, HouseholdType
│   └── MainCalculator.ts  # Coordinateur principal
└── components/
    ├── GovUKCalculator.tsx    # Interface principale (GOV.UK style)
    ├── ValidationDashboard.tsx # Tableau de bord validation
    └── Slider.tsx            # Composant slider personnalisé
```

### Calculateurs implémentés
- ✅ **RRQ/QPP** : Régime de rentes du Québec / Canada Pension Plan
- ✅ **Assurance-emploi (AE)** : Cotisations fédérales 
- ✅ **RQAP** : Régime québécois d'assurance parentale
- ✅ **FSS** : Fonds des services de santé
- ✅ **RAMQ** : Régime d'assurance médicaments du Québec
- 🔄 **Impôts QC** : Impôt sur le revenu du Québec (en développement)
- 🔄 **Impôts CA** : Impôt sur le revenu fédéral (en développement)
- 🔄 **Crédits/Transferts** : Crédits d'impôt et prestations (en développement)

## 📋 Scripts disponibles

```bash
# Développement
npm run dev          # Serveur de développement (port 3001)
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification du code

# Validation automatisée
npm run validate     # Exécuter tous les tests de validation
npm run validate:watch # Mode surveillance (re-exécute à chaque changement)

# Export statique
npm run export       # Génère les fichiers statiques pour GitHub Pages
```

## 🔧 Configuration

Les paramètres fiscaux sont externalisés dans `public/config/`:
- `2023.json` : Paramètres pour l'année 2023
- `2024.json` : Paramètres pour l'année 2024

## 📊 Système de validation automatisé

Le projet inclut un système complet de validation des résultats contre le calculateur officiel du ministère des Finances :

### 🎯 Fonctionnalités de validation

- **15+ cas de test prédéfinis** couvrant tous les types de ménages
- **Détection automatique des écarts** avec classification par sévérité
- **Rapport détaillé** identifiant les pires cas et différences critiques  
- **Interface web** à `http://localhost:3001/validation`
- **Recommandations intelligentes** pour prioriser les corrections

### 🚀 Utilisation

```bash
# Validation complète en ligne de commande
npm run validate

# Interface web interactive
npm run dev
# Puis aller sur http://localhost:3001/validation
```

### 📊 Types de validation

- **Cotisations** : RRQ, AE, RQAP, FSS, RAMQ ✅
- **Impôts provinciaux/fédéraux** : En développement 🔄  
- **Crédits et transferts** : En développement 🔄

### 🎯 Seuils de validation

- **✅ SUCCÈS** : <5% d'écart global
- **⚠️ ÉCHEC** : >5% d'écart ou >100$ de différence
- **🚨 CRITIQUE** : >20% d'écart ou >500$ de différence

## 🌟 Captures d'écran

### Interface principale
- Interface moderne avec GOV.UK Design System
- Support bilingue complet (FR/EN)
- Sliders interactifs pour revenus et âges
- Dropdown pour nombre d'enfants
- Gestion intelligente par type de ménage

### Tableau de résultats détaillé
- Format reproduisant le calculateur officiel
- Sections : Régime fiscal QC/CA, Cotisations
- Calculs en temps réel avec précision monétaire

### Dashboard de validation  
- Résumé des tests (succès/échecs/erreurs)
- Identification des pires cas par écart
- Liste des différences critiques
- Recommandations d'amélioration

## 🚀 Déploiement

Le projet est configuré pour GitHub Pages avec export statique :

```bash
npm run export        # Génère le dossier 'out/'
# Puis déployer le contenu de 'out/' sur GitHub Pages
```

## 🤝 Contribution

Les contributions sont les bienvenues ! 

### Priorités actuelles :
1. **Implémenter les calculateurs d'impôts QC/CA**
2. **Ajouter les crédits d'impôt et transferts**  
3. **Améliorer la précision des cotisations existantes**
4. **Étendre les cas de test de validation**

Voir le fichier [CLAUDE.md](CLAUDE.md) pour les détails techniques.

## 📄 Licence

MIT

## 🙏 Remerciements

- Basé sur les spécifications fiscales officielles du ministère des Finances du Québec
- Design inspiré du GOV.UK Design System pour l'accessibilité et l'utilisabilité
- Validation continue contre le calculateur gouvernemental officiel