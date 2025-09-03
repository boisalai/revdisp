#!/usr/bin/env node
/**
 * Script CLI pour tester le nouveau système de validation officielle
 * avec le scraper Python/Selenium
 */

import { runQuickOfficialValidation } from '../ProgressiveValidationRunner'

async function main() {
  const args = process.argv.slice(2)
  const taxYear = args.length > 0 ? parseInt(args[0]) : 2024

  console.log('🚀 LANCEMENT DE LA VALIDATION OFFICIELLE')
  console.log('=======================================')
  console.log(`📅 Année fiscale: ${taxYear}`)
  console.log('🐍 Utilisation du scraper Python/Selenium fonctionnel')
  console.log()

  try {
    await runQuickOfficialValidation(taxYear)
    console.log()
    console.log('✅ VALIDATION OFFICIELLE TERMINÉE AVEC SUCCÈS!')
    console.log('Les rapports détaillés sont disponibles dans validation-reports/')
    process.exit(0)
  } catch (error) {
    console.error('❌ ERREUR lors de la validation officielle:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}