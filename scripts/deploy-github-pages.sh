#!/bin/bash

# Script de déploiement automatique sur GitHub Pages
# Usage: ./scripts/deploy-github-pages.sh [nom-du-repo]

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DÉPLOIEMENT GITHUB PAGES - CALCULATEUR QUÉBEC${NC}"
echo "=================================================="

# Déterminer le nom du repo
if [ -n "$1" ]; then
    REPO_NAME="/$1"
    echo -e "${GREEN}✅ Nom du repo: $1${NC}"
else
    # Extraire le nom du repo depuis git remote
    REPO_URL=$(git config --get remote.origin.url 2>/dev/null || echo "")
    if [[ $REPO_URL =~ /([^/]+)\.git$ ]]; then
        REPO_NAME="/${BASH_REMATCH[1]}"
        echo -e "${GREEN}✅ Nom du repo détecté: ${BASH_REMATCH[1]}${NC}"
    else
        echo -e "${RED}❌ Impossible de détecter le nom du repo${NC}"
        echo -e "${BLUE}💡 Usage: $0 [nom-du-repo]${NC}"
        exit 1
    fi
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé${NC}"
    echo -e "${BLUE}💡 Lancez ce script depuis la racine du projet${NC}"
    exit 1
fi

# Vérifier que Next.js est configuré
if [ ! -f "next.config.js" ]; then
    echo -e "${RED}❌ Erreur: next.config.js non trouvé${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installation des dépendances...${NC}"
npm install

echo -e "${BLUE}🔧 Build de production avec REPO_NAME=$REPO_NAME...${NC}"
export NODE_ENV=production
export REPO_NAME=$REPO_NAME
npm run build

echo -e "${BLUE}📤 Export statique...${NC}"
npm run export

echo -e "${BLUE}📋 Vérification du contenu exporté...${NC}"
if [ ! -d "out" ]; then
    echo -e "${RED}❌ Erreur: Dossier 'out' non créé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Export réussi! Contenu du dossier 'out':${NC}"
ls -la out/

echo -e "${BLUE}🌐 Ajout du fichier .nojekyll...${NC}"
touch out/.nojekyll

echo -e "${GREEN}🎉 SUCCÈS! Votre site est prêt pour GitHub Pages${NC}"
echo "=================================================="
echo -e "${BLUE}📝 PROCHAINES ÉTAPES:${NC}"
echo "1. Commitez tous les changements:"
echo "   git add -A"
echo "   git commit -m 'feat: Deploy Quebec tax calculator to GitHub Pages'"
echo ""
echo "2. Poussez vers GitHub:"
echo "   git push -u origin main"
echo ""
echo "3. Dans les Settings du repo GitHub:"
echo "   - Allez dans 'Pages'"
echo "   - Source: 'Deploy from a branch'"
echo "   - Branch: 'gh-pages'"
echo "   - Folder: '/ (root)'"
echo ""
echo "4. Ou utilisez GitHub Actions (recommandé):"
echo "   - Le workflow est déjà configuré dans .github/workflows/deploy.yml"
echo ""
echo -e "${GREEN}🌍 URL finale: https://VOTRE-USERNAME.github.io$(echo $REPO_NAME)/${NC}"
echo "=================================================="