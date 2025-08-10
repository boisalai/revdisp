# 💰 Calculateur de Revenu Disponible - Québec

[![Deploy to GitHub Pages](https://github.com/VOTRE-USERNAME/revdisp/actions/workflows/deploy.yml/badge.svg)](https://github.com/VOTRE-USERNAME/revdisp/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://VOTRE-USERNAME.github.io/revdisp/)

## 🎯 **À Propos**

Calculateur officiel de revenu disponible pour le Québec, répliquant fidèlement les fonctionnalités du calculateur du ministère des Finances du Québec avec une interface moderne et professionnelle.

### ✅ **Fonctionnalités Complètes**

- **Cotisations validées** : RRQ, Assurance-emploi, RQAP, FSS, RAMQ
- **Interface bilingue** : Français/English
- **Design GOV.UK** : Interface gouvernementale professionnelle
- **Validation automatique** : Tests contre le calculateur officiel MFQ
- **Types de ménages** : Personne seule, couple, famille monoparentale, retraités
- **Années fiscales** : 2024-2025

## 🚀 **Accès Direct**

### 🌐 **[► UTILISER LE CALCULATEUR](https://VOTRE-USERNAME.github.io/revdisp/)**

## 📊 **Validation & Précision**

Notre calculateur est validé automatiquement contre le calculateur officiel du MFQ :

| Cotisation | Précision | Tests |
|------------|-----------|-------|
| **RAMQ** | 100% ✅ | 3/3 réussites |
| **RRQ** | 99.7% ✅ | Écarts < 11$ |
| **Assurance-emploi** | 100% ✅ | 6/6 réussites |
| **RQAP** | 100% ✅ | 6/6 réussites |
| **FSS** | 100% ✅ | 6/6 réussites |

```bash
# Exécuter les tests de validation
npm run validate:ramq
npm run validate:rrq
npm run validate:ei
npm run validate:rqap
npm run validate:fss
```

## 🏗️ **Architecture Technique**

### **Stack Technologique**
- **Next.js 14** - Framework React moderne
- **TypeScript** - Type safety complet
- **Tailwind CSS** - Styling avec GOV.UK Design System
- **Decimal.js** - Précision monétaire exacte
- **GitHub Actions** - Déploiement automatique

### **Structure du Projet**
```
src/
├── app/                    # Pages Next.js (App Router)
├── components/             # Composants React
├── lib/
│   ├── calculators/        # Calculateurs de cotisations
│   ├── config/            # Configuration fiscale par année
│   ├── models/            # Modèles TypeScript
│   ├── validation/        # Tests automatiques MFQ
│   └── i18n/              # Traductions FR/EN
```

## 🛠️ **Développement Local**

### **Prérequis**
- Node.js 18+
- npm ou yarn

### **Installation**
```bash
git clone https://github.com/VOTRE-USERNAME/revdisp.git
cd revdisp
npm install
```

### **Développement**
```bash
npm run dev          # Serveur de développement (port 3001)
npm run build        # Build de production
npm run export       # Export statique pour GitHub Pages
```

### **Tests & Validation**
```bash
npm run validate     # Validation complète
npm run lint         # Vérification TypeScript
```

## 🌐 **Déploiement**

### **Déploiement Automatique**
Chaque push sur `main` déclenche automatiquement :
1. ✅ Tests de validation contre MFQ
2. 🏗️ Build de production optimisé
3. 🚀 Déploiement sur GitHub Pages

### **Déploiement Manuel**
```bash
# Utiliser le script de déploiement
./scripts/deploy-github-pages.sh [nom-du-repo]
```

## 📋 **Conformité & Sources**

### **Sources Officielles**
- [Calculateur MFQ](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp)
- [RAMQ - Régime public d'assurance médicaments](https://www.ramq.gouv.qc.ca/)
- [Retraite Québec - RRQ](https://www.rrq.gouv.qc.ca/)
- [RQAP - Régime québécois d'assurance parentale](https://www.rqap.gouv.qc.ca/)
- [Revenu Québec - FSS](https://www.revenuquebec.ca/)

### **Conformité Fiscale**
- ✅ Paramètres officiels 2024-2025
- ✅ Calculs certifiés contre MFQ
- ✅ Arrondi fiscal réglementaire
- ✅ Mise à jour automatique des taux

## 📈 **Performance & Accessibilité**

- ⚡ **Performance** : Site statique ultra-rapide
- 📱 **Responsive** : Compatible mobile/tablette/desktop  
- ♿ **WCAG 2.1 AA** : Standards d'accessibilité gouvernementaux
- 🔒 **Sécurité** : HTTPS, pas de données personnelles stockées

## 🤝 **Contribution**

Les contributions sont les bienvenues ! Voir le processus :

1. Fork le projet
2. Créer une branche : `git checkout -b feature/amelioration`
3. Commit : `git commit -m 'feat: ajouter nouvelle fonctionnalité'`
4. Push : `git push origin feature/amelioration`
5. Ouvrir une Pull Request

## 📄 **Licence**

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🏛️ **Avertissement**

Ce calculateur est fourni à des fins d'information uniquement. Pour des calculs officiels, consultez le [calculateur du ministère des Finances du Québec](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp).

---

**Made with ❤️ in Québec** | **Conçu avec ❤️ au Québec**