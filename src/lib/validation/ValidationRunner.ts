#!/usr/bin/env node

import { ValidationEngine } from './ValidationEngine'

/**
 * Script pour exécuter la validation complète
 * Usage: npx tsx src/lib/validation/ValidationRunner.ts
 */
async function runValidation() {
  console.log('🚀 Initialisation du moteur de validation...')
  
  const engine = new ValidationEngine(2024)
  await engine.initialize()
  
  console.log('⚡ Exécution de la validation complète...')
  const report = await engine.runFullValidation()
  
  // Afficher le rapport
  engine.printReport(report)
  
  // Sauvegarder le rapport détaillé
  const fs = await import('fs')
  const path = await import('path')
  
  const reportPath = path.join(process.cwd(), 'validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log(`\n💾 Rapport détaillé sauvegardé: ${reportPath}`)
  
  // Code de sortie basé sur les résultats
  const successRate = report.summary.passed / report.summary.totalTests
  if (successRate < 0.8) {
    console.log(`\n❌ Taux de succès insuffisant: ${(successRate * 100).toFixed(1)}%`)
    process.exit(1)
  } else {
    console.log(`\n✅ Validation terminée avec succès: ${(successRate * 100).toFixed(1)}% de réussite`)
    process.exit(0)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runValidation().catch(error => {
    console.error('💥 Erreur lors de la validation:', error)
    process.exit(1)
  })
}

export { runValidation }