#!/bin/bash

# Script d'exemple pour démontrer le système de validation massive
# Usage: ./scripts/example-mass-validation.sh

set -e

echo "🎯 EXEMPLE DE VALIDATION MASSIVE"
echo "================================="
echo ""

# Configuration
REPORT_DIR="./reports/example-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"

echo "📂 Répertoire de rapports: $REPORT_DIR"
echo ""

# 1. Générer des cas de test d'exemple
echo "🏭 ÉTAPE 1: Génération de 100 cas de test d'exemple"
echo "---------------------------------------------------"
npm run validate:generate -- \
  --count 100 \
  --strategy systematic \
  --year 2024 \
  --output "$REPORT_DIR/test-cases.json"

echo "✅ Cas de test générés dans $REPORT_DIR/test-cases.json"
echo ""

# 2. Validation haute performance (exemple léger)
echo "⚡ ÉTAPE 2: Validation haute performance (mode démo)"
echo "----------------------------------------------------"
echo "⚠️  ATTENTION: Cet exemple utilise le calculateur officiel réel"
echo "   - Durée estimée: 5-10 minutes pour 20 cas"
echo "   - Nécessite une connexion Internet stable"
echo ""

read -p "Continuer avec la validation réelle? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Démarrage de la validation..."
    npm run validate:high-volume -- \
      --count 20 \
      --parallel 2 \
      --batch-size 5 \
      --strategy random \
      --output "$REPORT_DIR"
    
    echo "✅ Validation terminée"
    echo ""
    
    # 3. Analyse des résultats
    echo "📊 ÉTAPE 3: Analyse des résultats"
    echo "---------------------------------"
    
    if [ -f "$REPORT_DIR/high-volume-validation-report.json" ]; then
        npm run validate:analyze -- \
          --file "$REPORT_DIR/high-volume-validation-report.json" \
          --output "$REPORT_DIR/analysis"
        
        echo "✅ Analyse terminée"
        echo ""
        echo "📄 RAPPORTS GÉNÉRÉS:"
        echo "  • Rapport de validation: $REPORT_DIR/high-volume-validation-report.json"
        echo "  • Analyse avancée: $REPORT_DIR/analysis/advanced-analysis.json"
        echo "  • Rapport HTML: $REPORT_DIR/analysis/analysis-report.html"
        echo ""
        echo "🌐 Pour voir le rapport HTML:"
        echo "  open $REPORT_DIR/analysis/analysis-report.html"
        
    else
        echo "❌ Fichier de rapport non trouvé"
    fi
    
else
    echo "⏭️  Validation réelle ignorée (mode démo seulement)"
    echo ""
    echo "📋 DÉMONSTRATION DU CLI:"
    echo ""
    
    # Afficher l'aide du CLI
    echo "🔧 Aide du CLI principal:"
    npm run validate:mass -- --help
    echo ""
    
    echo "🔧 Aide pour la génération:"
    npm run validate:generate -- --help
    echo ""
    
    echo "🔧 Aide pour la validation haute performance:"
    npm run validate:high-volume -- --help
    echo ""
fi

echo "📊 RÉSUMÉ DE L'EXEMPLE"
echo "======================"
echo "✅ Cas de test générés: $REPORT_DIR/test-cases.json"
echo "📂 Répertoire de rapports: $REPORT_DIR"
echo ""

if [ -f "$REPORT_DIR/test-cases.json" ]; then
    TEST_COUNT=$(jq length "$REPORT_DIR/test-cases.json")
    echo "📈 Nombre de cas générés: $TEST_COUNT"
    
    # Afficher un échantillon des cas générés
    echo ""
    echo "📋 Échantillon des cas générés:"
    jq -r '.[0:3] | .[] | "  • \(.description) - \(.input.primaryPerson.grossWorkIncome)$ + \(.input.spouse.grossWorkIncome // 0)$"' "$REPORT_DIR/test-cases.json"
    echo "  ... et $(($TEST_COUNT - 3)) autres cas"
fi

echo ""
echo "🚀 PROCHAINES ÉTAPES:"
echo ""
echo "1. Pour une validation complète (1000+ cas):"
echo "   npm run validate:high-volume -- -n 1000 -p 5 -o ./reports/full-validation"
echo ""
echo "2. Pour démarrer la validation continue:"
echo "   npm run validate:continuous -- -i 60 -n 500"
echo ""
echo "3. Pour vérifier le statut de la validation continue:"
echo "   npm run validate:status"
echo ""
echo "📖 Voir CLAUDE.md pour la documentation complète"