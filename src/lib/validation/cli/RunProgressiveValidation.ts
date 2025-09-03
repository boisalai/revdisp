#!/usr/bin/env node

/**
 * CLI pour lancer la validation progressive
 * 
 * Usage:
 * npm run validate:progressive
 * npm run validate:progressive -- --year 2024 --output ./reports
 * npx tsx src/lib/validation/cli/RunProgressiveValidation.ts --year 2025
 */

import { ProgressiveValidationRunner, ProgressiveValidationConfig } from '../ProgressiveValidationRunner'
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
🧮 Validation Progressive - Calculateur RevDisp
===============================================

Valide notre calculateur contre le calculateur officiel du MFQ
en progressant de 10 → 100 → 1000+ cas de test.

Usage:
  npm run validate:progressive [options]
  npx tsx src/lib/validation/cli/RunProgressiveValidation.ts [options]

Options:
  -y, --year <YEAR>      Année fiscale (défaut: 2024)
  -o, --output <DIR>     Répertoire de sortie (défaut: ./validation-reports/progressive-<timestamp>)
  -v, --verbose          Mode verbose
  -h, --help             Afficher cette aide

Exemples:
  npm run validate:progressive
  npm run validate:progressive -- --year 2025 --output ./my-reports
  npm run validate:progressive -- --verbose

Phases de validation:
  1. Phase 1: 10 cas représentatifs (validation rapide)
  2. Phase 2: 100 cas diversifiés (validation étendue)  
  3. Phase 3: 1000+ cas Monte Carlo (validation massive)

Sortie:
  - progressive-validation-summary.json (données brutes)
  - progressive-validation-report.html (rapport visuel)
  - Rapports détaillés par phase
  - Recommandations de corrections prioritaires
`)
}

async function main() {
  const args = parseArgs()

  if (args.help) {
    printUsage()
    process.exit(0)
  }

  // Configuration par défaut
  const taxYear = args.year ?? 2024
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
  const baseOutputDir = args.output ?? `./validation-reports/progressive-${taxYear}-${timestamp}`

  console.log('🚀 LANCEMENT DE LA VALIDATION PROGRESSIVE')
  console.log('=========================================')
  console.log(`📅 Année fiscale: ${taxYear}`)
  console.log(`📁 Rapports: ${path.resolve(baseOutputDir)}`)
  console.log(`🔍 Mode: ${args.verbose ? 'Verbose' : 'Standard'}`)
  console.log()

  // Vérifier les prérequis
  console.log('🔧 Vérification des prérequis...')
  
  // Vérifier que les modules nécessaires sont disponibles
  try {
    await import('puppeteer')
    console.log('✅ Puppeteer disponible')
  } catch (error) {
    console.error('❌ Puppeteer non installé. Installez avec: npm install puppeteer')
    process.exit(1)
  }

  try {
    const config: ProgressiveValidationConfig = {
      taxYear,
      baseOutputDir,
      verbose: args.verbose ?? false
    }

    const runner = new ProgressiveValidationRunner(config)
    const startTime = Date.now()

    const results = await runner.runProgressiveValidation()

    const totalTime = (Date.now() - startTime) / 1000
    console.log()
    console.log('🎊 VALIDATION PROGRESSIVE TERMINÉE AVEC SUCCÈS!')
    console.log('==============================================')
    console.log(`⏱️  Temps total: ${totalTime.toFixed(1)}s`)
    console.log(`📊 Cas traités: ${results.overallAnalysis.totalCasesProcessed}`)
    
    const finalAccuracy = results.overallAnalysis.accuracyTrend[results.overallAnalysis.accuracyTrend.length - 1]
    console.log(`🎯 Précision finale: ${finalAccuracy.toFixed(1)}%`)
    
    console.log()
    console.log('📁 Fichiers générés:')
    console.log(`   📄 ${baseOutputDir}/progressive-validation-report.html`)
    console.log(`   📋 ${baseOutputDir}/progressive-validation-summary.json`)
    console.log(`   📂 ${baseOutputDir}/phase*/ (rapports détaillés par phase)`)
    console.log()
    
    if (finalAccuracy >= 95) {
      console.log('🎉 SUCCÈS COMPLET: Calculateur validé avec excellence!')
      process.exit(0)
    } else if (finalAccuracy >= 85) {
      console.log('✅ SUCCÈS ACCEPTABLE: Performance satisfaisante')
      console.log('💡 Consultez les recommandations pour améliorer la précision')
      process.exit(0)
    } else {
      console.log('⚠️  ATTENTION REQUISE: Précision insuffisante')
      console.log('🔧 Corrections nécessaires avant utilisation en production')
      console.log(`📋 Consultez ${baseOutputDir}/progressive-validation-report.html`)
      process.exit(1)
    }

  } catch (error) {
    console.error()
    console.error('❌ ERREUR LORS DE LA VALIDATION:')
    console.error('===============================')
    
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`)
      if (args.verbose && error.stack) {
        console.error(`Stack: ${error.stack}`)
      }
    } else {
      console.error('Erreur inconnue:', error)
    }
    
    console.error()
    console.error('🔧 Actions suggérées:')
    console.error('1. Vérifiez votre connexion internet')
    console.error('2. Assurez-vous que le calculateur officiel du MFQ est accessible')
    console.error('3. Relancez avec --verbose pour plus de détails')
    console.error('4. Consultez les logs dans le répertoire de sortie')
    
    process.exit(1)
  }
}

// Point d'entrée
if (require.main === module) {
  main().catch(console.error)
}

export { main as runProgressiveValidationCLI }