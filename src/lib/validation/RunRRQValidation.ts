/**
 * Script pour valider les calculs RRQ avec le calculateur officiel MFQ
 */

import { rrqValidationTests, runRrqValidationTest } from './RrqValidationTests'

interface ValidationReport {
  timestamp: string
  summary: {
    total: number
    passed: number
    warnings: number
    failed: number
  }
  results: Array<{
    testId: string
    taxYear: number
    expected: number
    actual: number
    difference: number
    percentageDifference: number
    status: 'PASS' | 'WARN' | 'FAIL'
    threshold: number
  }>
}

export async function runAllRrqValidation(): Promise<ValidationReport> {
  console.log('🚀 Démarrage validation RRQ avec calculateur MFQ...\n')
  
  const results = []
  let passed = 0
  let warnings = 0
  let failed = 0
  
  for (const test of rrqValidationTests) {
    console.log(`⏳ Test: ${test.description}`)
    
    const result = await runRrqValidationTest(test)
    results.push(result)
    
    // Afficher le résultat
    const statusIcon = result.status === 'PASS' ? '✅' : 
                      result.status === 'WARN' ? '⚠️' : '❌'
    
    console.log(`${statusIcon} ${result.status} - Attendu: ${result.expected}$, Obtenu: ${result.actual}$, Écart: ${result.difference.toFixed(2)}$`)
    
    // Compter les statuts
    if (result.status === 'PASS') passed++
    else if (result.status === 'WARN') warnings++
    else failed++
    
    console.log('')
  }
  
  // Afficher le résumé
  console.log('📊 RÉSUMÉ VALIDATION RRQ:')
  console.log(`Total tests: ${results.length}`)
  console.log(`✅ Réussites: ${passed}`)
  console.log(`⚠️ Avertissements: ${warnings}`)
  console.log(`❌ Échecs: ${failed}`)
  
  if (failed === 0 && warnings === 0) {
    console.log('\n🎉 EXCELLENT! Tous les tests RRQ sont alignés avec le calculateur MFQ!')
  } else if (failed === 0) {
    console.log('\n👍 BIEN! Tous les tests RRQ passent, quelques avertissements mineurs.')
  } else {
    console.log('\n⚠️ ATTENTION! Certains tests RRQ échouent. Vérification nécessaire.')
  }
  
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      warnings,
      failed
    },
    results
  }
  
  return report
}

// Exécution standalone si appelé directement
if (require.main === module) {
  runAllRrqValidation()
    .then(report => {
      // Écrire le rapport en fichier JSON
      const fs = require('fs')
      const path = require('path')
      
      const reportPath = path.join(process.cwd(), 'rrq-validation-report.json')
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
      
      console.log(`\n📄 Rapport détaillé sauvé: ${reportPath}`)
    })
    .catch(error => {
      console.error('❌ Erreur validation RRQ:', error)
      process.exit(1)
    })
}