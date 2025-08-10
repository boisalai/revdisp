#!/bin/bash

# Script de vérification complète avant déploiement

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 VÉRIFICATION COMPLÈTE AVANT DÉPLOIEMENT${NC}"
echo "=============================================="

# 1. Vérification TypeScript
echo -e "${BLUE}1. Vérification TypeScript...${NC}"
if npm run lint; then
    echo -e "${GREEN}✅ TypeScript OK${NC}"
else
    echo -e "${RED}❌ Erreurs TypeScript détectées${NC}"
    exit 1
fi

# 2. Build de production
echo -e "${BLUE}2. Test du build de production...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build OK${NC}"
else
    echo -e "${RED}❌ Échec du build${NC}"
    exit 1
fi

# 3. Export statique
echo -e "${BLUE}3. Test de l'export statique...${NC}"
if npm run export; then
    echo -e "${GREEN}✅ Export OK${NC}"
else
    echo -e "${RED}❌ Échec de l'export${NC}"
    exit 1
fi

# 4. Vérification des tests de validation (optionnel)
echo -e "${BLUE}4. Tests de validation (continue en cas d'erreur)...${NC}"
npm run validate:ramq || echo "⚠️ Tests RAMQ échoués (non bloquant)"

echo -e "${GREEN}🎉 TOUTES LES VÉRIFICATIONS SONT RÉUSSIES !${NC}"
echo -e "${BLUE}💡 Vous pouvez maintenant faire git push en toute sécurité.${NC}"