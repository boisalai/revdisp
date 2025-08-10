/**
 * Validation automatisée de l'assurance-emploi contre le calculateur officiel
 * 
 * Compare automatiquement nos calculs avec les résultats officiels
 * du ministère des Finances du Québec
 */

import { OfficialCalculatorScraper, OfficialValidationComparer, OfficialCalculatorResult } from './OfficialCalculatorScraper'
import { EmploymentInsuranceCalculator } from '../calculators/EmploymentInsuranceCalculator'
import { CalculatorFactory } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'

// Import des calculators pour l'enregistrement
import '../calculators'

export interface AutomatedValidationCase {
  description: string
  year: number
  household: {
    householdType: HouseholdType
    primaryPerson: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
      isRetired: boolean
    }
    spouse?: {
      age: number
      grossWorkIncome: number
      grossRetirementIncome: number
      isRetired: boolean
    }
    numChildren: number
  }
}

export interface AutomatedValidationResult {
  case: AutomatedValidationCase
  ourResult: {
    employee: number
    employer: number
    total: number
  }
  officialResult: OfficialCalculatorResult
  comparison: {
    matches: boolean
    differences: Array<{ field: string, our: number, official: number, diff: number }>
    summary: string
  }
  success: boolean
  error?: string
}

/**
 * Cas de test pour validation automatisée
 */
export const AUTOMATED_VALIDATION_CASES: AutomatedValidationCase[] = [
  {
    description: "2024 - Personne seule, revenu médian",
    year: 2024,
    household: {
      householdType: HouseholdType.SINGLE,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 50000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 0
    }
  },
  
  {
    description: "2024 - Personne seule, salaire minimum temps plein",
    year: 2024,
    household: {
      householdType: HouseholdType.SINGLE,
      primaryPerson: {
        age: 25,
        grossWorkIncome: 30000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 0
    }
  },
  
  {
    description: "2024 - Couple, revenus moyens",
    year: 2024,
    household: {
      householdType: HouseholdType.COUPLE,
      primaryPerson: {
        age: 40,
        grossWorkIncome: 60000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      spouse: {
        age: 38,
        grossWorkIncome: 45000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 0
    }
  },
  
  {
    description: "2024 - Famille monoparentale avec enfant",
    year: 2024,
    household: {
      householdType: HouseholdType.SINGLE_PARENT,
      primaryPerson: {
        age: 32,
        grossWorkIncome: 55000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 1
    }
  },
  
  {
    description: "2025 - Personne seule, revenu médian (nouveaux taux)",
    year: 2025,
    household: {
      householdType: HouseholdType.SINGLE,
      primaryPerson: {
        age: 35,
        grossWorkIncome: 50000,
        grossRetirementIncome: 0,
        isRetired: false
      },
      numChildren: 0
    }
  },
  
  {
    description: "2024 - Retraité vivant seul (exemption AE)",
    year: 2024,
    household: {
      householdType: HouseholdType.RETIRED_SINGLE,
      primaryPerson: {
        age: 67,
        grossWorkIncome: 0,
        grossRetirementIncome: 25000,
        isRetired: true
      },
      numChildren: 0
    }
  }
]

/**
 * Validateur automatisé pour l'assurance-emploi
 */
export class AutomatedEmploymentInsuranceValidator {
  private scraper: OfficialCalculatorScraper
  
  constructor(options: { headless?: boolean, timeout?: number } = {}) {
    this.scraper = new OfficialCalculatorScraper(options)
  }
  
  /**
   * Exécute tous les tests de validation automatisée
   */
  async runAllTests(): Promise<{
    passed: number
    failed: number
    results: AutomatedValidationResult[]
    summary: string
  }> {
    console.log('🤖 Démarrage de la validation automatisée...')
    
    await this.scraper.initialize()
    
    const results: AutomatedValidationResult[] = []
    let passed = 0
    let failed = 0
    
    try {
      for (const testCase of AUTOMATED_VALIDATION_CASES) {
        console.log(`\n🧪 Test: ${testCase.description}`)
        
        try {
          const result = await this.runSingleTest(testCase)
          results.push(result)
          
          if (result.success) {
            passed++
            console.log(`✅ ${result.comparison.summary}`)
          } else {
            failed++
            console.log(`❌ ${result.comparison.summary}`)
            if (result.error) {
              console.log(`   Erreur: ${result.error}`)
            }
          }
          
          // Délai entre les tests pour ne pas surcharger le serveur
          await this.delay(2000)
          
        } catch (error) {
          failed++
          const errorResult: AutomatedValidationResult = {
            case: testCase,
            ourResult: { employee: 0, employer: 0, total: 0 },
            officialResult: {
              annee_fiscale: testCase.year,
              situation_familiale: 'error',
              timestamp: new Date()
            },
            comparison: {
              matches: false,
              differences: [],
              summary: `Erreur lors du test: ${error}`
            },
            success: false,
            error: String(error)
          }
          results.push(errorResult)
          console.log(`❌ Erreur: ${error}`)
        }
      }
      
    } finally {
      await this.scraper.cleanup()
    }
    
    const summary = `Tests automatisés terminés: ${passed} réussis, ${failed} échoués`
    console.log(`\n📊 ${summary}`)
    
    return { passed, failed, results, summary }
  }
  
  /**
   * Exécute un test de validation individuel
   */
  async runSingleTest(testCase: AutomatedValidationCase): Promise<AutomatedValidationResult> {
    // 1. Calculer avec notre implémentation
    const calculator = await CalculatorFactory.createCalculator('employment_insurance', testCase.year) as EmploymentInsuranceCalculator
    
    const household = this.createHouseholdFromTestCase(testCase)
    const ourResult = calculator.calculateDetailed(household.primaryPerson)
    
    // Si conjoint, ajouter ses cotisations
    let totalOurResult = {
      employee: ourResult.employee.toNumber(),
      employer: ourResult.employer.toNumber(),
      total: ourResult.total.toNumber()
    }
    
    if (household.spouse) {
      const spouseResult = calculator.calculateDetailed(household.spouse)
      totalOurResult.employee += spouseResult.employee.toNumber()
      totalOurResult.employer += spouseResult.employer.toNumber()
      totalOurResult.total += spouseResult.total.toNumber()
    }
    
    // 2. Scraper le calculateur officiel
    const officialResult = await this.scraper.scrapeOfficialCalculator(household, testCase.year)
    
    // 3. Comparer les résultats
    const comparison = OfficialValidationComparer.compareEmploymentInsurance(
      totalOurResult,
      officialResult,
      1.0 // Tolérance de 1$ pour les arrondissements
    )
    
    return {
      case: testCase,
      ourResult: totalOurResult,
      officialResult,
      comparison,
      success: comparison.matches
    }
  }
  
  /**
   * Crée un objet Household à partir d'un cas de test
   */
  private createHouseholdFromTestCase(testCase: AutomatedValidationCase): Household {
    const primaryPerson = new Person({
      age: testCase.household.primaryPerson.age,
      grossWorkIncome: testCase.household.primaryPerson.grossWorkIncome,
      grossRetirementIncome: testCase.household.primaryPerson.grossRetirementIncome,
      selfEmployedIncome: 0,
      isRetired: testCase.household.primaryPerson.isRetired
    })
    
    let spouse: Person | undefined
    if (testCase.household.spouse) {
      spouse = new Person({
        age: testCase.household.spouse.age,
        grossWorkIncome: testCase.household.spouse.grossWorkIncome,
        grossRetirementIncome: testCase.household.spouse.grossRetirementIncome,
        selfEmployedIncome: 0,
        isRetired: testCase.household.spouse.isRetired
      })
    }
    
    return new Household({
      householdType: testCase.household.householdType,
      primaryPerson,
      spouse,
      numChildren: testCase.household.numChildren
    })
  }
  
  /**
   * Génère un rapport détaillé des résultats
   */
  generateDetailedReport(results: AutomatedValidationResult[]): string {
    const report = []
    
    report.push('📊 RAPPORT DE VALIDATION AUTOMATISÉE - ASSURANCE-EMPLOI')
    report.push('=' .repeat(60))
    report.push(`Date: ${new Date().toLocaleString('fr-CA')}`)
    report.push(`Nombre de tests: ${results.length}`)
    
    const passed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    report.push(`Réussis: ${passed}`)
    report.push(`Échoués: ${failed}`)
    report.push(`Taux de réussite: ${((passed / results.length) * 100).toFixed(1)}%`)
    report.push('')
    
    // Détails par test
    results.forEach((result, index) => {
      report.push(`${index + 1}. ${result.case.description}`)
      report.push(`   Status: ${result.success ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`)
      
      if (result.success) {
        report.push(`   Notre total AE: ${result.ourResult.total.toFixed(2)}$`)
        report.push(`   Total officiel: ${result.officialResult.assurance_emploi_total?.toFixed(2) || 'N/A'}$`)
      } else {
        report.push(`   ${result.comparison.summary}`)
        if (result.comparison.differences.length > 0) {
          result.comparison.differences.forEach(diff => {
            report.push(`     - ${diff.field}: Notre=${diff.our}$, Officiel=${diff.official}$, Écart=${diff.diff.toFixed(2)}$`)
          })
        }
        if (result.error) {
          report.push(`   Erreur: ${result.error}`)
        }
      }
      report.push('')
    })
    
    return report.join('\n')
  }
  
  /**
   * Délai utilitaire
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Runner CLI pour les tests automatisés
 */
if (require.main === module) {
  (async () => {
    console.log('🤖 Validation automatisée - Assurance-emploi vs Calculateur officiel')
    console.log('='.repeat(70))
    
    const validator = new AutomatedEmploymentInsuranceValidator({
      headless: process.env.NODE_ENV === 'production', // Mode visible en dev
      timeout: 60000 // 1 minute de timeout
    })
    
    try {
      const results = await validator.runAllTests()
      
      // Générer et afficher le rapport détaillé
      const report = validator.generateDetailedReport(results.results)
      console.log('\n' + report)
      
      // Sauvegarder le rapport
      const fs = require('fs')
      const reportPath = `automated-validation-report-${Date.now()}.txt`
      fs.writeFileSync(reportPath, report)
      console.log(`\n💾 Rapport sauvegardé: ${reportPath}`)
      
      // Code de sortie
      process.exit(results.failed > 0 ? 1 : 0)
      
    } catch (error) {
      console.error('❌ Erreur critique lors de la validation automatisée:', error)
      process.exit(1)
    }
  })()
}