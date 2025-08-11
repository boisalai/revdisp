/**
 * Runner simple pour les tests du scraper
 */

const { spawn } = require('child_process')

console.log('🧪 Lancement du test du scraper...')
console.log('='.repeat(50))

const args = [
  '--experimental-specifier-resolution=node',
  '--loader', 'ts-node/esm',
  'src/lib/validation/TestOfficialScraper.ts'
]

const nodeProcess = spawn('node', args, {
  stdio: 'inherit',
  cwd: process.cwd()
})

nodeProcess.on('error', (error) => {
  console.error('❌ Erreur de lancement:', error)
  process.exit(1)
})

nodeProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Test terminé avec succès')
  } else {
    console.log(`\n❌ Test terminé avec le code: ${code}`)
  }
  process.exit(code)
})