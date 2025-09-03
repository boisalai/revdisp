#!/bin/bash

# Script de démonstration pour la validation progressive
# Montre les capacités du nouveau système de validation 10→100→1000+ cas

echo "🧮 DÉMONSTRATION - Validation Progressive RevDisp"
echo "==============================================="
echo ""
echo "Ce script démontre le nouveau système de validation progressive qui"
echo "compare notre calculateur avec le calculateur officiel du MFQ en"  
echo "progressant de 10 → 100 → 1000+ cas de test automatiquement."
echo ""

# Vérifier les prérequis
echo "🔧 Vérification des prérequis..."
echo ""

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trouvé. Installez Node.js 18+ pour continuer."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version trop ancienne ($NODE_VERSION). Version 18+ requise."
    exit 1
fi

echo "✅ Node.js $(node --version)"

# NPM et packages
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Puppeteer
if [ ! -d "node_modules/puppeteer" ]; then
    echo "📦 Installation de Puppeteer pour le scraping..."
    npm install puppeteer
fi

echo "✅ Dépendances installées"

# Vérifier la connexion internet
echo ""
echo "🌐 Vérification de la connexion au calculateur officiel MFQ..."
if curl -s --head "https://www.finances.gouv.qc.ca" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Calculateur officiel accessible"
else
    echo "⚠️  Calculateur officiel non accessible - la validation peut échouer"
    echo "   Vérifiez votre connexion internet et réessayez plus tard"
fi

echo ""
echo "🎯 CHOIX DU MODE DE DÉMONSTRATION"
echo "================================"
echo ""
echo "Sélectionnez le niveau de démonstration:"
echo "1) 🚀 RAPIDE    - 10 cas seulement (2-3 minutes)"
echo "2) 📊 STANDARD  - Validation progressive complète (15-20 minutes)"  
echo "3) 🔍 DÉTAILLÉ  - Avec analyse verbose et rapports (20-30 minutes)"
echo "4) ℹ️  AIDE     - Voir toutes les options disponibles"
echo ""

read -p "Votre choix (1-4): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "🚀 MODE RAPIDE - Validation de 10 cas représentatifs"
        echo "==================================================="
        echo ""
        echo "Cette démonstration exécute seulement la Phase 1 (10 cas)"
        echo "pour montrer rapidement le fonctionnement du système."
        echo ""
        
        # Créer configuration temporaire pour mode rapide
        TEMP_DIR="./demo-progressive-$(date +%s)"
        mkdir -p "$TEMP_DIR"
        
        echo "📁 Répertoire: $TEMP_DIR"
        echo ""
        
        # Lancer seulement 10 cas avec la stratégie systematique
        echo "⏳ Lancement de la validation..."
        npx tsx src/lib/validation/cli/RunProgressiveValidation.ts \
            --year 2024 \
            --output "$TEMP_DIR" \
            --verbose
        
        VALIDATION_EXIT_CODE=$?
        ;;
        
    2)
        echo ""
        echo "📊 MODE STANDARD - Validation Progressive Complète"
        echo "================================================="
        echo ""
        echo "Cette démonstration exécute les 3 phases complètes:"
        echo "• Phase 1: 10 cas représentatifs"
        echo "• Phase 2: 100 cas diversifiés"  
        echo "• Phase 3: 1000+ cas Monte Carlo"
        echo ""
        echo "⏱️  Temps estimé: 15-20 minutes"
        echo ""
        
        read -p "Continuer? (y/N): " CONFIRM
        if [[ $CONFIRM =~ ^[Yy]$ ]]; then
            TEMP_DIR="./demo-progressive-full-$(date +%s)"
            mkdir -p "$TEMP_DIR"
            
            echo "📁 Répertoire: $TEMP_DIR"
            echo ""
            echo "⏳ Lancement de la validation progressive complète..."
            
            npx tsx src/lib/validation/cli/RunProgressiveValidation.ts \
                --year 2024 \
                --output "$TEMP_DIR"
            
            VALIDATION_EXIT_CODE=$?
        else
            echo "Démonstration annulée."
            exit 0
        fi
        ;;
        
    3)
        echo ""
        echo "🔍 MODE DÉTAILLÉ - Validation avec Analyse Complète"
        echo "=================================================="
        echo ""
        echo "Cette démonstration inclut:"
        echo "• Validation progressive complète (3 phases)"
        echo "• Logs détaillés en temps réel"
        echo "• Rapport HTML interactif"
        echo "• Analyse approfondie des écarts"
        echo ""
        echo "⏱️  Temps estimé: 20-30 minutes"
        echo ""
        
        read -p "Continuer? (y/N): " CONFIRM
        if [[ $CONFIRM =~ ^[Yy]$ ]]; then
            TEMP_DIR="./demo-progressive-detailed-$(date +%s)"
            mkdir -p "$TEMP_DIR"
            
            echo "📁 Répertoire: $TEMP_DIR"
            echo ""
            echo "⏳ Lancement de la validation progressive détaillée..."
            
            npx tsx src/lib/validation/cli/RunProgressiveValidation.ts \
                --year 2024 \
                --output "$TEMP_DIR" \
                --verbose
            
            VALIDATION_EXIT_CODE=$?
            
            # Ouvrir le rapport HTML automatiquement si disponible
            if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
                HTML_REPORT="$TEMP_DIR/progressive-validation-report.html"
                if [ -f "$HTML_REPORT" ]; then
                    echo ""
                    echo "🌐 Ouverture du rapport HTML..."
                    if command -v open &> /dev/null; then
                        open "$HTML_REPORT"  # macOS
                    elif command -v xdg-open &> /dev/null; then
                        xdg-open "$HTML_REPORT"  # Linux
                    fi
                fi
            fi
        else
            echo "Démonstration annulée."
            exit 0
        fi
        ;;
        
    4)
        echo ""
        echo "ℹ️  AIDE - Options Disponibles"
        echo "============================="
        echo ""
        echo "Commandes directes disponibles:"
        echo ""
        echo "• npm run validate:progressive"
        echo "  → Validation progressive standard 2024"
        echo ""
        echo "• npm run validate:progressive:2025" 
        echo "  → Validation pour année spécifique"
        echo ""
        echo "• npm run validate:progressive -- --help"
        echo "  → Aide complète avec toutes les options"
        echo ""
        echo "• npm run validate:progressive -- --year 2024 --verbose"
        echo "  → Validation avec logs détaillés"
        echo ""
        echo "Autres systèmes de validation:"
        echo ""
        echo "• npm run validate:high-volume -- -n 1000"
        echo "  → Validation haute performance directe"
        echo ""
        echo "• npm run validate:generate -- -n 500 -s monte_carlo"
        echo "  → Génération de cas de test seulement"
        echo ""
        echo "Consultez VALIDATION-SYSTEM.md pour la documentation complète."
        exit 0
        ;;
        
    *)
        echo "❌ Choix invalide. Relancez le script et choisissez 1, 2, 3 ou 4."
        exit 1
        ;;
esac

# Analyse des résultats
echo ""
echo "📋 ANALYSE DES RÉSULTATS"
echo "======================="
echo ""

if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo "✅ VALIDATION RÉUSSIE!"
    echo ""
    echo "📁 Fichiers générés dans: $TEMP_DIR"
    echo ""
    
    # Lister les fichiers créés
    if [ -d "$TEMP_DIR" ]; then
        echo "📄 Rapports disponibles:"
        find "$TEMP_DIR" -name "*.json" -o -name "*.html" | while read file; do
            echo "   • $(basename "$file")"
        done
        echo ""
        
        # Montrer le résumé s'il existe
        SUMMARY_FILE="$TEMP_DIR/progressive-validation-summary.json"
        if [ -f "$SUMMARY_FILE" ]; then
            echo "📊 Résumé rapide:"
            if command -v jq &> /dev/null; then
                echo "   Précision finale: $(jq -r '.overallAnalysis.accuracyTrend[-1]' "$SUMMARY_FILE")%"
                echo "   Cas traités: $(jq -r '.overallAnalysis.totalCasesProcessed' "$SUMMARY_FILE")"
                echo "   Programmes critiques: $(jq -r '.overallAnalysis.criticalPrograms | length' "$SUMMARY_FILE")"
            else
                echo "   (Installez 'jq' pour voir le résumé JSON)"
            fi
            echo ""
        fi
    fi
    
    echo "🎯 PROCHAINES ÉTAPES RECOMMANDÉES:"
    echo ""
    echo "1. Examiner le rapport HTML pour l'analyse visuelle"
    echo "2. Identifier les programmes nécessitant correction"  
    echo "3. Appliquer les recommandations prioritaires"
    echo "4. Relancer la validation après corrections"
    echo ""
    echo "📖 Documentation complète: VALIDATION-SYSTEM.md"
    echo "🔧 Code source: src/lib/validation/"
    
else
    echo "❌ VALIDATION ÉCHOUÉE (Code: $VALIDATION_EXIT_CODE)"
    echo ""
    echo "🔍 SOLUTIONS POSSIBLES:"
    echo ""
    echo "1. Vérifiez votre connexion Internet"
    echo "2. Vérifiez que le calculateur MFQ est accessible"
    echo "3. Réessayez avec moins de parallélisme:"
    echo "   npm run validate:progressive -- --verbose"
    echo "4. Consultez les logs d'erreur dans: $TEMP_DIR"
    echo ""
    echo "📞 Pour plus d'aide, consultez VALIDATION-SYSTEM.md"
fi

echo ""
echo "🧮 Démonstration terminée."
echo ""

exit $VALIDATION_EXIT_CODE