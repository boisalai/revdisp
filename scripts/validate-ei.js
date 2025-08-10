#!/usr/bin/env node

/**
 * Script pour valider l'implémentation de l'assurance-emploi
 * 
 * Usage: npm run validate:ei
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Validation de l\'assurance-emploi')
console.log('===================================\n')

try {
  // Compile et exécute les tests TypeScript
  const validationFile = path.join(__dirname, '../src/lib/validation/EmploymentInsuranceValidation.ts')
  
  console.log('Compilation et exécution des tests...\n')
  
  const output = execSync(`npx tsx "${validationFile}"`, { 
    encoding: 'utf8',
    cwd: path.join(__dirname, '..')
  })
  
  console.log(output)
} catch (error) {
  console.error('❌ Erreur lors de l\'exécution des tests:')
  console.error(error.stdout || error.message)
  process.exit(1)
}