/**
 * Test du scraper corrigé avec un cas simple
 */

import { CorrectOfficialCalculatorScraper, OfficialValidationComparer } from './CorrectOfficialCalculatorScraper'
import { EmploymentInsuranceCalculator } from '../calculators/EmploymentInsuranceCalculator'
import { CalculatorFactory } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'

// Import des calculators
import '../calculators'

export class OfficialScraperTester {
  
  static async runSimpleTest(): Promise<void> {
    console.log('🧪 Test du scraper officiel - Cas simple')
    console.log('='.repeat(50))
    
    const scraper = new CorrectOfficialCalculatorScraper({
      headless: false, // Mode visible pour observer
      timeout: 60000
    })
    
    try {
      await scraper.initialize()
      
      // Cas de test simple : personne seule, 50k$, 35 ans
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
      
      console.log('\n📊 Données du test:')
      console.log(`   Type: Personne seule`)
      console.log(`   Âge: 35 ans`) 
      console.log(`   Revenu: 50 000$`)
      console.log(`   Enfants: 0`)
      
      // 1. Calculer avec notre implémentation
      console.log('\n🔢 Calcul avec notre implémentation...')
      
      const calculator2024 = await CalculatorFactory.createCalculator('employment_insurance', 2024) as EmploymentInsuranceCalculator
      const calculator2025 = await CalculatorFactory.createCalculator('employment_insurance', 2025) as EmploymentInsuranceCalculator
      
      const our2024 = calculator2024.calculateDetailed(household.primaryPerson)
      const our2025 = calculator2025.calculateDetailed(household.primaryPerson)
      
      console.log(`   Notre AE 2024: ${our2024.employee.toNumber()}$ (employé)`)
      console.log(`   Notre AE 2025: ${our2025.employee.toNumber()}$ (employé)`)
      
      // 2. Scraper le site officiel
      console.log('\n🌐 Scraping du calculateur officiel...')
      console.log('   (Cela peut prendre 30-60 secondes)')
      
      const officialResult = await scraper.scrapeOfficialCalculator(household)
      
      if (officialResult.success) {
        console.log('\n✅ Résultats officiels obtenus:')
        console.log(`   AE 2024: ${officialResult.assurance_emploi_2024}$`)
        console.log(`   AE 2025: ${officialResult.assurance_emploi_2025}$`)
        console.log(`   RRQ 2024: ${officialResult.rrq_2024}$`)
        console.log(`   RRQ 2025: ${officialResult.rrq_2025}$`)
        
        // 3. Comparaison
        console.log('\n🔍 Comparaison des résultats:')
        
        const comparison2024 = OfficialValidationComparer.compareEmploymentInsurance(
          { employee: our2024.employee.toNumber(), total: our2024.total.toNumber() },
          officialResult,
          2024,
          2.0 // Tolérance de 2$
        )
        
        const comparison2025 = OfficialValidationComparer.compareEmploymentInsurance(
          { employee: our2025.employee.toNumber(), total: our2025.total.toNumber() },
          officialResult,
          2025,
          2.0 // Tolérance de 2$
        )
        
        console.log(`   2024: ${comparison2024.summary}`)
        console.log(`   2025: ${comparison2025.summary}`)
        
        if (comparison2024.matches && comparison2025.matches) {
          console.log('\n🎉 VALIDATION RÉUSSIE! Notre calculateur est conforme au site officiel.')
        } else {
          console.log('\n⚠️  Écarts détectés. Vérification nécessaire.')
          
          if (!comparison2024.matches) {
            comparison2024.differences.forEach(diff => {
              console.log(`     2024 ${diff.field}: Notre=${diff.our}$, Officiel=${diff.official}$, Écart=${diff.diff.toFixed(2)}$`)
            })
          }
          
          if (!comparison2025.matches) {
            comparison2025.differences.forEach(diff => {
              console.log(`     2025 ${diff.field}: Notre=${diff.our}$, Officiel=${diff.official}$, Écart=${diff.diff.toFixed(2)}$`)
            })
          }
        }
        
      } else {
        console.log('\n❌ Échec du scraping:')
        console.log(`   Erreur: ${officialResult.error}`)
        console.log('   Vérifiez la capture d\'écran de debug générée.')
      }
      
    } catch (error) {
      console.error('\n❌ Erreur durant le test:', error)
    } finally {
      await scraper.cleanup()
    }
  }
}

// Runner CLI
if (require.main === module) {
  (async () => {
    try {
      await OfficialScraperTester.runSimpleTest()
      console.log('\n✅ Test terminé')
    } catch (error) {
      console.error('\n❌ Erreur critique:', error)
      process.exit(1)
    }
  })()
}