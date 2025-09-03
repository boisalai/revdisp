#!/usr/bin/env node

/**
 * CLI pour démonstration de validation progressive avec données simulées
 * Permet de tester le système sans dépendre du scraping externe
 */

import { MockValidationRunner } from '../MockValidationRunner'
import * as path from 'path'

interface CLIArgs {
  year?: number
  output?: string
  verbose?: boolean
  help?: boolean
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2)
  const parsed: CLIArgs = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--year':
      case '-y':
        parsed.year = parseInt(args[++i])
        break
      case '--output':
      case '-o':
        parsed.output = args[++i]
        break
      case '--verbose':
      case '-v':
        parsed.verbose = true
        break
      case '--help':
      case '-h':
        parsed.help = true
        break
    }
  }

  return parsed
}

function printUsage() {
  console.log(`
🧮 DÉMONSTRATION - Validation Progressive RevDisp
===============================================

Cette version de démonstration utilise des données de référence simulées
pour montrer le fonctionnement du système de validation progressive
sans dépendre du scraping externe du calculateur officiel MFQ.

Usage:
  npm run validate:progressive:demo [options]
  npx tsx src/lib/validation/cli/RunMockProgressiveValidation.ts [options]

Options:
  -y, --year <YEAR>      Année fiscale (défaut: 2024)
  -o, --output <DIR>     Répertoire de sortie (défaut: ./demo-reports/progressive-<timestamp>)
  -v, --verbose          Mode verbose
  -h, --help             Afficher cette aide

Exemples:
  npm run validate:progressive:demo
  npm run validate:progressive:demo -- --year 2025 --verbose

Fonctionnalités démontrées:
  ✅ Validation progressive 10→100→1000 cas
  ✅ Analyse de tendances et détection de régression
  ✅ Identification des programmes problématiques
  ✅ Recommandations intelligentes de correction
  ✅ Rapports HTML interactifs avec métriques colorées
  ✅ Système complet de classification des erreurs

Note: Cette démonstration utilise des estimations réalistes basées sur
      les paramètres fiscaux réels, mais ne scrape pas le site officiel.
`)
}

async function main() {
  const args = parseArgs()

  if (args.help) {
    printUsage()
    process.exit(0)
  }

  // Configuration
  const taxYear = args.year ?? 2024
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
  const outputDir = args.output ?? `./demo-reports/progressive-${taxYear}-${timestamp}`

  console.log('🧪 DÉMONSTRATION - VALIDATION PROGRESSIVE')
  console.log('========================================')
  console.log(`📅 Année fiscale: ${taxYear}`)
  console.log(`📁 Rapports: ${path.resolve(outputDir)}`)
  console.log(`🔍 Mode: ${args.verbose ? 'Verbose' : 'Standard'}`)
  console.log()
  console.log('⚠️  IMPORTANTE: Cette démonstration utilise des données simulées')
  console.log('    pour montrer les capacités du système sans scraping externe.')
  console.log()

  try {
    const runner = new MockValidationRunner(taxYear)
    await runner.initialize()

    const startTime = Date.now()
    const results = await runner.runProgressiveValidation(outputDir)
    const totalTime = (Date.now() - startTime) / 1000

    console.log()
    console.log('🎊 DÉMONSTRATION TERMINÉE AVEC SUCCÈS!')
    console.log('====================================')
    console.log(`⏱️  Temps total: ${totalTime.toFixed(1)}s`)
    console.log(`📊 Cas traités: ${results.overallAnalysis.totalCasesProcessed}`)
    
    const finalAccuracy = results.overallAnalysis.accuracyTrend[results.overallAnalysis.accuracyTrend.length - 1]
    console.log(`🎯 Précision finale: ${finalAccuracy.toFixed(1)}%`)
    
    console.log()
    console.log('📁 Fichiers générés:')
    console.log(`   🌐 ${outputDir}/progressive-validation-report.html`)
    console.log(`   📋 ${outputDir}/progressive-validation-summary.json`)
    console.log(`   📂 ${outputDir}/phase*/ (rapports détaillés par phase)`)
    console.log()
    console.log('💡 PROCHAINES ÉTAPES:')
    console.log('1. Ouvrir le rapport HTML pour voir les métriques visuelles')
    console.log('2. Examiner les programmes identifiés comme critiques')  
    console.log('3. Appliquer les recommandations de correction suggérées')
    console.log('4. Une fois les corrections faites, utiliser le vrai système:')
    console.log('   npm run validate:progressive')
    console.log()
    console.log('📖 Documentation complète: VALIDATION-SYSTEM.md')
    
    // Ouvrir le rapport HTML automatiquement si possible
    try {
      const { exec } = require('child_process')
      const htmlPath = path.join(outputDir, 'progressive-validation-report.html')
      
      if (process.platform === 'darwin') {
        exec(`open "${htmlPath}"`)
        console.log('🌐 Rapport HTML ouvert automatiquement')
      } else if (process.platform === 'linux') {
        exec(`xdg-open "${htmlPath}"`)
        console.log('🌐 Rapport HTML ouvert automatiquement')
      }
    } catch (error) {
      // Ignore les erreurs d'ouverture automatique
    }

    if (finalAccuracy >= 95) {
      console.log('🎉 SUCCÈS COMPLET: Calculateur validé avec excellence!')
      process.exit(0)
    } else if (finalAccuracy >= 85) {
      console.log('✅ SUCCÈS ACCEPTABLE: Performance satisfaisante')
      process.exit(0)
    } else {
      console.log('⚠️  ATTENTION REQUISE: Précision insuffisante pour production')
      process.exit(1)
    }

  } catch (error) {
    console.error()
    console.error('❌ ERREUR LORS DE LA DÉMONSTRATION:')
    console.error('================================')
    
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`)
      if (args.verbose && error.stack) {
        console.error(`Stack: ${error.stack}`)
      }
    } else {
      console.error('Erreur inconnue:', error)
    }
    
    console.error()
    console.error('🔧 Cette erreur peut être due à:')
    console.error('1. Problème dans les calculs de notre système')
    console.error('2. Configuration incorrecte des paramètres fiscaux')
    console.error('3. Erreur de logique dans le code de démonstration')
    
    process.exit(1)
  }
}

// Point d'entrée
if (require.main === module) {
  main().catch(console.error)
}

export { main as runMockProgressiveValidation }