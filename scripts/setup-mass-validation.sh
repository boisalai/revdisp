#!/bin/bash

# Script de configuration pour le système de validation massive
# Usage: ./scripts/setup-mass-validation.sh

set -e

echo "🚀 Configuration du système de validation massive"
echo "=================================================="

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+ d'abord."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18+ requis. Version actuelle: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
else
    echo "✅ Dépendances déjà installées"
fi

# Vérifier que commander est installé
if ! npm list commander &> /dev/null; then
    echo "📦 Installation de commander..."
    npm install --save-dev commander
fi

# Créer les répertoires nécessaires
echo "📁 Création des répertoires de rapports..."
mkdir -p reports/mass-validation
mkdir -p reports/continuous-validation
mkdir -p reports/analysis

echo "✅ Répertoires créés"

# Test rapide du CLI
echo "🧪 Test du CLI de validation..."
if npm run validate:mass -- --help > /dev/null 2>&1; then
    echo "✅ CLI de validation fonctionnel"
else
    echo "❌ Problème avec le CLI de validation"
    echo "Vérifiez que tous les fichiers TypeScript sont correctement compilés"
    exit 1
fi

# Vérifier Puppeteer
echo "🌐 Vérification de Puppeteer..."
if npm list puppeteer &> /dev/null; then
    echo "✅ Puppeteer installé"
    
    # Test d'initialisation de navigateur
    cat > test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    await browser.close();
    console.log('✅ Puppeteer fonctionne correctement');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur Puppeteer:', error.message);
    process.exit(1);
  }
})();
EOF
    
    node test-puppeteer.js
    rm test-puppeteer.js
else
    echo "❌ Puppeteer non installé"
    exit 1
fi

echo ""
echo "🎉 Configuration terminée avec succès!"
echo ""
echo "📋 Commandes disponibles:"
echo "  npm run validate:generate          # Générer des cas de test"
echo "  npm run validate:high-volume       # Validation haute performance"
echo "  npm run validate:continuous        # Validation continue"
echo "  npm run validate:status            # Statut de la validation"
echo "  npm run validate:analyze           # Analyser un rapport"
echo ""
echo "🚀 Exemples d'utilisation:"
echo ""
echo "# Générer 1000 cas de test avec stratégie Monte Carlo"
echo "npm run validate:generate -- -n 1000 -s monte_carlo"
echo ""
echo "# Validation haute performance avec 3 navigateurs parallèles"
echo "npm run validate:high-volume -- -n 500 -p 3 -b 25"
echo ""
echo "# Démarrer la validation continue (toutes les 30 minutes)"
echo "npm run validate:continuous -- -i 30 -n 250"
echo ""
echo "Pour plus d'aide: npm run validate:mass -- --help"