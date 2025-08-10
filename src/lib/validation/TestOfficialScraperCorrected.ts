/**
 * Test corrigé du scraper - avec revenus au maximum assurable
 */

import { CorrectOfficialCalculatorScraper, OfficialValidationComparer } from './CorrectOfficialCalculatorScraper'
import { EmploymentInsuranceCalculator } from '../calculators/EmploymentInsuranceCalculator'
import { CalculatorFactory } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'

// Import des calculators
import '../calculators'

export class CorrectedOfficialScraperTester {
  
  static async runCorrectedTests(): Promise<void> {
    console.log('🧪 Test scraper officiel - Cas corrigés')
    console.log('='.repeat(50))
    
    const scraper = new CorrectOfficialCalculatorScraper({
      headless: false,
      timeout: 60000
    })
    
    await scraper.initialize()
    
    try {
      // Test 1: Revenu normal (50k) - devrait donner notre calcul, pas le maximum
      await this.testCase(scraper, 'Test 1: Revenu normal 50k', {
        income: 50000,
        age: 35,
        expectedAE2024: 50000 * 0.0132, // 660.00$
        expectedAE2025: 50000 * 0.0131  // 655.00$
      })
      
      // Test 2: Revenu au maximum assurable 2024
      await this.testCase(scraper, 'Test 2: Maximum assurable 2024', {
        income: 63200, // Maximum 2024
        age: 40,
        expectedAE2024: 834.24, // Maximum officiel 2024
        expectedAE2025: 828.32  // 63200 * 1.31%
      })
      
      // Test 3: Revenu au maximum assurable 2025
      await this.testCase(scraper, 'Test 3: Maximum assurable 2025', {
        income: 65700, // Maximum 2025
        age: 45,
        expectedAE2024: 867.24, // 65700 * 1.32%
        expectedAE2025: 860.67  // Maximum officiel 2025
      })
      
      // Test 4: Revenu très élevé - devrait plafonner aux maximums
      await this.testCase(scraper, 'Test 4: Revenu élevé 100k', {
        income: 100000,
        age: 50,
        expectedAE2024: 834.24, // Plafonné
        expectedAE2025: 860.67  // Plafonné
      })
      
    } finally {
      await scraper.cleanup()
    }
  }
  
  private static async testCase(
    scraper: CorrectOfficialCalculatorScraper,
    testName: string,
    params: { income: number, age: number, expectedAE2024: number, expectedAE2025: number }
  ): Promise<void> {
    console.log(`\n${testName}`)
    console.log('-'.repeat(40))
    
    // Créer le ménage de test
    const household = new Household({
      householdType: HouseholdType.SINGLE,
      primaryPerson: new Person({
        age: params.age,
        grossWorkIncome: params.income,
        grossRetirementIncome: 0,
        selfEmployedIncome: 0,
        isRetired: false
      }),
      numChildren: 0
    })
    
    console.log(`📊 Données: ${params.income}$, ${params.age} ans`)
    
    // Notre calcul
    const calculator2024 = await CalculatorFactory.createCalculator('employment_insurance', 2024) as EmploymentInsuranceCalculator
    const calculator2025 = await CalculatorFactory.createCalculator('employment_insurance', 2025) as EmploymentInsuranceCalculator
    
    const our2024 = calculator2024.calculateDetailed(household.primaryPerson)
    const our2025 = calculator2025.calculateDetailed(household.primaryPerson)
    
    console.log(`🔢 Notre calcul:`)
    console.log(`   2024: ${our2024.employee.toFixed(2)}$ (attendu: ${params.expectedAE2024.toFixed(2)}$)`)
    console.log(`   2025: ${our2025.employee.toFixed(2)}$ (attendu: ${params.expectedAE2025.toFixed(2)}$)`)
    
    // Vérifier que notre propre calcul est correct avant de scraper
    const ourError2024 = Math.abs(our2024.employee.toNumber() - params.expectedAE2024)
    const ourError2025 = Math.abs(our2025.employee.toNumber() - params.expectedAE2025)
    
    if (ourError2024 > 0.01 || ourError2025 > 0.01) {
      console.log(`❌ Notre propre calcul est incorrect!`)
      console.log(`   Écart 2024: ${ourError2024.toFixed(2)}$`)
      console.log(`   Écart 2025: ${ourError2025.toFixed(2)}$`)
      return
    }
    
    console.log(`✅ Notre calcul interne est correct`)
    
    // Scraper le site officiel
    console.log(`🌐 Scraping...`)
    const officialResult = await scraper.scrapeOfficialCalculator(household)
    
    if (officialResult.success) {
      console.log(`📊 Site officiel:`)
      console.log(`   2024: ${officialResult.assurance_emploi_2024}$ (arrondi)`)
      console.log(`   2025: ${officialResult.assurance_emploi_2025}$ (arrondi)`)
      
      // Comparaison avec tolérance pour l'arrondissement au dollar
      const officialError2024 = officialResult.assurance_emploi_2024 
        ? Math.abs(our2024.employee.toNumber() - officialResult.assurance_emploi_2024)
        : 999
        
      const officialError2025 = officialResult.assurance_emploi_2025
        ? Math.abs(our2025.employee.toNumber() - officialResult.assurance_emploi_2025) 
        : 999
      
      const tolerance = 1.0 // 1$ de tolérance pour arrondissement
      
      if (officialError2024 <= tolerance && officialError2025 <= tolerance) {
        console.log(`🎉 VALIDATION RÉUSSIE (écarts < ${tolerance}$)`)
      } else {
        console.log(`⚠️  Écarts détectés:`)
        console.log(`   2024: ${officialError2024.toFixed(2)}$ d'écart`)
        console.log(`   2025: ${officialError2025.toFixed(2)}$ d'écart`)
      }
      
    } else {
      console.log(`❌ Échec du scraping: ${officialResult.error}`)
    }
    
    // Délai entre les tests
    await this.delay(3000)
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Runner CLI
if (require.main === module) {
  (async () => {
    try {
      await CorrectedOfficialScraperTester.runCorrectedTests()
      console.log('\n✅ Tous les tests terminés')
    } catch (error) {
      console.error('\n❌ Erreur critique:', error)
      process.exit(1)
    }
  })()
}