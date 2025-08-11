/**
 * Test simple du scraper - Version Node.js
 */

// Configuration ESM pour Next.js
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

async function testScraper() {
  try {
    console.log('🧪 Test du scraper - Version Node.js simple')
    console.log('='.repeat(50))
    
    // Import dynamique des modules Next.js
    const { CorrectOfficialCalculatorScraper } = await import('./src/lib/validation/CorrectOfficialCalculatorScraper.js')
    const { CalculatorFactory } = await import('./src/lib/core/factory.js')
    const { Person, Household, HouseholdType } = await import('./src/lib/models/index.js')
    
    // Import des calculators pour enregistrement
    await import('./src/lib/calculators/index.js')
    
    const scraper = new CorrectOfficialCalculatorScraper({
      headless: false,
      timeout: 60000
    })
    
    await scraper.initialize()
    
    try {
      // Test simple : personne seule, 50k$, 35 ans
      const household = new Household({
        householdType: HouseholdType.SINGLE,
        primaryPerson: new Person({
          age: 35,
          grossWorkIncome: 50000,
          grossRetirementIncome: 0,
          selfEmployedIncome: 0,
          isRetired: false
        }),
        numChildren: 0
      })
      
      console.log('\n📊 Test : personne seule, 50k$, 35 ans')
      
      // Notre calcul
      const calculator2024 = await CalculatorFactory.createCalculator('employment_insurance', 2024)
      const calculator2025 = await CalculatorFactory.createCalculator('employment_insurance', 2025)
      
      const our2024 = calculator2024.calculateDetailed(household.primaryPerson)
      const our2025 = calculator2025.calculateDetailed(household.primaryPerson)
      
      console.log(`🔢 Notre calcul:`)
      console.log(`   2024: ${our2024.employee.toFixed(2)}$ (employé)`)
      console.log(`   2025: ${our2025.employee.toFixed(2)}$ (employé)`)
      
      // Scraper le site officiel
      console.log('\n🌐 Scraping du site officiel...')
      const officialResult = await scraper.scrapeOfficialCalculator(household)
      
      if (officialResult.success) {
        console.log('\n✅ Résultats officiels obtenus:')
        console.log(`   AE 2024: ${officialResult.assurance_emploi_2024}$`)
        console.log(`   AE 2025: ${officialResult.assurance_emploi_2025}$`)
        
        // Comparaison
        const diff2024 = Math.abs(our2024.employee.toNumber() - (officialResult.assurance_emploi_2024 || 0))
        const diff2025 = Math.abs(our2025.employee.toNumber() - (officialResult.assurance_emploi_2025 || 0))
        
        console.log('\n🔍 Comparaison:')
        console.log(`   2024: écart de ${diff2024.toFixed(2)}$`)
        console.log(`   2025: écart de ${diff2025.toFixed(2)}$`)
        
        if (diff2024 <= 2 && diff2025 <= 2) {
          console.log('\n🎉 VALIDATION RÉUSSIE! (écarts < 2$)')
        } else {
          console.log('\n⚠️  Écarts détectés.')
        }
        
      } else {
        console.log('\n❌ Échec du scraping:', officialResult.error)
      }
      
    } finally {
      await scraper.cleanup()
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testScraper()
}