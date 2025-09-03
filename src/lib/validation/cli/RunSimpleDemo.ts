#!/usr/bin/env node

/**
 * CLI simplifié pour démonstration immédiate de la validation progressive
 */

import { runSimpleProgressiveValidation } from '../SimpleProgressiveValidation'

async function main() {
  const taxYear = 2024
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
  const outputDir = `./demo-reports/simple-progressive-${taxYear}-${timestamp}`

  console.log('🚀 LANCEMENT DE LA DÉMONSTRATION SIMPLIFIÉE')
  console.log('==========================================')
  console.log(`📅 Année: ${taxYear}`)
  console.log(`📁 Sortie: ${outputDir}`)
  console.log()

  try {
    await runSimpleProgressiveValidation(taxYear, outputDir)
    
    console.log()
    console.log('🎊 DÉMONSTRATION RÉUSSIE!')
    console.log('========================')
    console.log('La validation progressive a été testée avec succès.')
    console.log('Les rapports montrent les capacités du système:')
    console.log('• Progression 10→100→1000+ cas')
    console.log('• Analyse de tendances automatique') 
    console.log('• Recommandations intelligentes')
    console.log('• Rapports HTML interactifs')
    console.log()
    console.log('Pour tester avec le calculateur officiel MFQ:')
    console.log('npm run validate:progressive')
    
    // Ouvrir le rapport HTML
    try {
      const { exec } = require('child_process')
      const htmlPath = `${outputDir}/simple-progressive-validation.html`
      
      if (process.platform === 'darwin') {
        exec(`open "${htmlPath}"`)
        console.log('🌐 Rapport HTML ouvert automatiquement')
      } else if (process.platform === 'linux') {
        exec(`xdg-open "${htmlPath}"`)
      }
    } catch (e) {
      // Ignore errors
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}