#!/usr/bin/env node

/**
 * Script pour validation automatisée de l'assurance-emploi
 * contre le calculateur officiel du ministère des Finances
 * 
 * Usage: npm run validate:ei:automated
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🤖 Validation automatisée de l\'assurance-emploi')
console.log('Comparaison avec le calculateur officiel du ministère des Finances')
console.log('='.repeat(70))
console.log('')

console.log('⚠️  ATTENTION: Ce script va ouvrir un navigateur et interagir')
console.log('   avec le site web officiel. Assurez-vous d\'avoir:')
console.log('   - Une connexion internet stable')
console.log('   - Suffisamment de RAM pour Puppeteer')
console.log('   - Le temps nécessaire (environ 2-3 minutes)')
console.log('')

// Vérifier si l'utilisateur veut continuer
if (process.argv.includes('--confirm') || process.env.CI) {
  console.log('🚀 Démarrage de la validation automatisée...\n')
} else {
  console.log('Pour lancer la validation, utilisez:')
  console.log('npm run validate:ei:automated -- --confirm')
  console.log('')
  console.log('Ou pour voir le navigateur en action (mode debug):')
  console.log('NODE_ENV=development npm run validate:ei:automated -- --confirm')
  process.exit(0)
}

try {
  // Compile et exécute les tests TypeScript
  const validationFile = path.join(__dirname, '../src/lib/validation/AutomatedEmploymentInsuranceValidation.ts')
  
  console.log('📦 Compilation et exécution des tests automatisés...')
  console.log('(Cela peut prendre quelques minutes la première fois)\n')
  
  const output = execSync(`npx tsx "${validationFile}"`, { 
    encoding: 'utf8',
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' // Afficher la sortie en temps réel
  })
  
  console.log('\n✅ Validation automatisée terminée avec succès!')
  
} catch (error) {
  console.error('\n❌ Erreur lors de la validation automatisée:')
  if (error.status !== undefined) {
    console.error(`Code de sortie: ${error.status}`)
  }
  
  if (error.stderr) {
    console.error('Erreur détaillée:', error.stderr)
  }
  
  console.error('\n💡 Conseils de dépannage:')
  console.error('1. Vérifiez votre connexion internet')
  console.error('2. Assurez-vous que le site officiel est accessible')
  console.error('3. Essayez en mode debug: NODE_ENV=development npm run validate:ei:automated -- --confirm')
  console.error('4. Vérifiez les logs pour des captures d\'écran de debug')
  
  process.exit(1)
}