import { RevenuDisponibleCalculator, CalculationResults } from '../MainCalculator'
import { Household } from '../models'
import { ValidationTestCase, validationTestCases, edgeCaseTestCases } from './ValidationTestCases'
import Decimal from 'decimal.js'

export interface ValidationResult {
  testCase: ValidationTestCase
  ourResults: CalculationResults | null
  expectedResults: ValidationTestCase['expectedResults']
  differences: ValidationDifference[]
  totalAbsoluteDifference: number
  totalPercentageDifference: number
  status: 'pass' | 'fail' | 'error'
  errorMessage?: string
}

export interface ValidationDifference {
  field: string
  expected: number
  actual: number
  absoluteDifference: number
  percentageDifference: number
  severity: 'critical' | 'major' | 'minor'
}

export interface ValidationReport {
  summary: {
    totalTests: number
    passed: number
    failed: number
    errors: number
    averageAccuracy: number
  }
  worstCases: ValidationResult[]
  criticalDifferences: ValidationDifference[]
  recommendations: string[]
}

export class ValidationEngine {
  private calculator: RevenuDisponibleCalculator

  constructor(taxYear: number = 2024) {
    this.calculator = new RevenuDisponibleCalculator(taxYear)
  }

  async initialize(): Promise<void> {
    await this.calculator.initialize()
  }

  /**
   * Exécute tous les cas de test de validation
   */
  async runFullValidation(): Promise<ValidationReport> {
    console.log('🔍 Démarrage de la validation complète...')
    
    const allTestCases = [...validationTestCases, ...edgeCaseTestCases]
    const results: ValidationResult[] = []

    // Exécuter chaque cas de test
    for (const testCase of allTestCases) {
      console.log(`📊 Test: ${testCase.description}`)
      const result = await this.runSingleTest(testCase)
      results.push(result)
      
      if (result.status === 'error') {
        console.error(`❌ Erreur: ${result.errorMessage}`)
      } else if (result.status === 'fail') {
        console.warn(`⚠️  Écart important: ${result.totalPercentageDifference.toFixed(1)}%`)
      } else {
        console.log(`✅ Succès: ${result.totalPercentageDifference.toFixed(1)}% d'écart`)
      }
    }

    return this.generateReport(results)
  }

  /**
   * Exécute un seul cas de test
   */
  async runSingleTest(testCase: ValidationTestCase): Promise<ValidationResult> {
    try {
      // Créer le ménage pour le test
      const household = new Household({
        householdType: testCase.input.householdType,
        primaryPerson: {
          age: testCase.input.primaryPerson.age,
          grossWorkIncome: testCase.input.primaryPerson.grossWorkIncome,
          grossRetirementIncome: testCase.input.primaryPerson.grossRetirementIncome,
          isRetired: testCase.input.primaryPerson.grossRetirementIncome > 0
        },
        spouse: testCase.input.spouse ? {
          age: testCase.input.spouse.age,
          grossWorkIncome: testCase.input.spouse.grossWorkIncome,
          grossRetirementIncome: testCase.input.spouse.grossRetirementIncome,
          isRetired: testCase.input.spouse.grossRetirementIncome > 0
        } : undefined,
        numChildren: testCase.input.numChildren
      })

      // Calculer nos résultats
      const ourResults = await this.calculator.calculate(household)
      
      // Comparer avec les résultats attendus
      const differences = this.calculateDifferences(testCase.expectedResults, ourResults)
      const totalAbsoluteDifference = differences.reduce((sum, diff) => sum + diff.absoluteDifference, 0)
      const totalPercentageDifference = this.calculateOverallPercentageDifference(differences)
      
      const status = this.determineStatus(differences, totalPercentageDifference)

      return {
        testCase,
        ourResults,
        expectedResults: testCase.expectedResults,
        differences,
        totalAbsoluteDifference,
        totalPercentageDifference,
        status
      }
    } catch (error) {
      return {
        testCase,
        ourResults: null,
        expectedResults: testCase.expectedResults,
        differences: [],
        totalAbsoluteDifference: 0,
        totalPercentageDifference: 0,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  /**
   * Calcule les différences entre résultats attendus et actuels
   */
  private calculateDifferences(
    expected: ValidationTestCase['expectedResults'],
    actual: CalculationResults
  ): ValidationDifference[] {
    const differences: ValidationDifference[] = []

    // Comparer les cotisations (seuls éléments actuellement implémentés)
    const cotisationsComparison = [
      { field: 'assuranceEmploi', expected: expected.assuranceEmploi, actual: actual.cotisations.assurance_emploi },
      { field: 'rqap', expected: expected.rqap, actual: actual.cotisations.rqap },
      { field: 'rrq', expected: expected.rrq, actual: actual.cotisations.rrq },
      { field: 'fss', expected: expected.fss, actual: actual.cotisations.fss },
      { field: 'ramq', expected: expected.ramq, actual: actual.cotisations.ramq },
      { field: 'totalCotisations', expected: expected.totalCotisations, actual: actual.cotisations.total }
    ]

    for (const comparison of cotisationsComparison) {
      const actualValue = comparison.actual instanceof Decimal ? comparison.actual.toNumber() : (comparison.actual || 0)
      const absoluteDifference = Math.abs(comparison.expected - actualValue)
      const percentageDifference = comparison.expected > 0 
        ? (absoluteDifference / comparison.expected) * 100 
        : actualValue > 0 ? 100 : 0

      if (absoluteDifference > 0.01) { // Seuil de 1 cent
        differences.push({
          field: comparison.field,
          expected: comparison.expected,
          actual: actualValue,
          absoluteDifference,
          percentageDifference,
          severity: this.determineSeverity(absoluteDifference, percentageDifference)
        })
      }
    }

    // TODO: Ajouter comparaisons pour impôts, crédits, etc. quand implémentés
    
    return differences
  }

  /**
   * Détermine la sévérité d'une différence
   */
  private determineSeverity(absoluteDiff: number, percentageDiff: number): 'critical' | 'major' | 'minor' {
    if (absoluteDiff > 500 || percentageDiff > 20) return 'critical'
    if (absoluteDiff > 100 || percentageDiff > 10) return 'major'
    return 'minor'
  }

  /**
   * Calcule le pourcentage d'écart global
   */
  private calculateOverallPercentageDifference(differences: ValidationDifference[]): number {
    if (differences.length === 0) return 0
    const avgPercentage = differences.reduce((sum, diff) => sum + diff.percentageDifference, 0) / differences.length
    return avgPercentage
  }

  /**
   * Détermine le statut du test
   */
  private determineStatus(differences: ValidationDifference[], overallPercentage: number): 'pass' | 'fail' {
    const hasCritical = differences.some(diff => diff.severity === 'critical')
    const hasMajor = differences.some(diff => diff.severity === 'major')
    
    if (hasCritical || overallPercentage > 15) return 'fail'
    if (hasMajor || overallPercentage > 5) return 'fail'
    return 'pass'
  }

  /**
   * Génère le rapport de validation
   */
  private generateReport(results: ValidationResult[]): ValidationReport {
    const summary = {
      totalTests: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      errors: results.filter(r => r.status === 'error').length,
      averageAccuracy: results
        .filter(r => r.status !== 'error')
        .reduce((sum, r) => sum + (100 - r.totalPercentageDifference), 0) / 
        results.filter(r => r.status !== 'error').length
    }

    // Identifier les pires cas (plus gros écarts)
    const worstCases = results
      .filter(r => r.status !== 'error')
      .sort((a, b) => b.totalAbsoluteDifference - a.totalAbsoluteDifference)
      .slice(0, 10)

    // Collecter toutes les différences critiques
    const criticalDifferences = results
      .flatMap(r => r.differences)
      .filter(d => d.severity === 'critical')
      .sort((a, b) => b.absoluteDifference - a.absoluteDifference)

    // Générer des recommandations
    const recommendations = this.generateRecommendations(results, criticalDifferences)

    return {
      summary,
      worstCases,
      criticalDifferences,
      recommendations
    }
  }

  /**
   * Génère des recommandations d'amélioration
   */
  private generateRecommendations(
    results: ValidationResult[], 
    criticalDifferences: ValidationDifference[]
  ): string[] {
    const recommendations: string[] = []

    // Analyser les patterns d'erreurs
    const errorsByField = new Map<string, number>()
    criticalDifferences.forEach(diff => {
      errorsByField.set(diff.field, (errorsByField.get(diff.field) || 0) + 1)
    })

    // Recommandations basées sur les champs problématiques
    if ((errorsByField.get('rrq') || 0) > 2) {
      recommendations.push('🔧 Vérifier le calcul RRQ/QPP - plusieurs écarts critiques détectés')
    }
    
    if ((errorsByField.get('assuranceEmploi') || 0) > 2) {
      recommendations.push('🔧 Réviser le calcul d\'assurance-emploi - formule possiblement incorrecte')
    }

    if ((errorsByField.get('fss') || 0) > 2) {
      recommendations.push('🔧 Ajuster le calcul FSS - seuils ou taux possiblement erronés')
    }

    // Recommandations générales
    const failRate = results.filter(r => r.status === 'fail').length / results.length
    if (failRate > 0.3) {
      recommendations.push('⚠️  Taux d\'échec élevé (>30%) - révision majeure nécessaire')
    }

    const avgAccuracy = results
      .filter(r => r.status !== 'error')
      .reduce((sum, r) => sum + (100 - r.totalPercentageDifference), 0) / 
      results.filter(r => r.status !== 'error').length

    if (avgAccuracy < 90) {
      recommendations.push('📊 Précision moyenne <90% - vérifier les paramètres fiscaux 2024')
    }

    // Prioriser les corrections
    recommendations.push('🎯 Prioriser les corrections sur les cas marqués "high priority"')
    recommendations.push('📋 Implémenter les calculateurs d\'impôts manquants pour validation complète')

    return recommendations
  }

  /**
   * Affiche un rapport de validation formaté
   */
  printReport(report: ValidationReport): void {
    console.log('\n' + '='.repeat(80))
    console.log('📊 RAPPORT DE VALIDATION - CALCULATEUR DE REVENU DISPONIBLE')
    console.log('='.repeat(80))
    
    console.log('\n📈 RÉSUMÉ:')
    console.log(`   Tests exécutés: ${report.summary.totalTests}`)
    console.log(`   ✅ Réussis: ${report.summary.passed}`)
    console.log(`   ❌ Échoués: ${report.summary.failed}`)
    console.log(`   🚫 Erreurs: ${report.summary.errors}`)
    console.log(`   🎯 Précision moyenne: ${report.summary.averageAccuracy.toFixed(1)}%`)

    if (report.worstCases.length > 0) {
      console.log('\n⚠️  PIRES CAS (plus gros écarts):')
      report.worstCases.slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.testCase.description}`)
        console.log(`      Écart: ${result.totalAbsoluteDifference.toFixed(0)}$ (${result.totalPercentageDifference.toFixed(1)}%)`)
      })
    }

    if (report.criticalDifferences.length > 0) {
      console.log('\n🚨 DIFFÉRENCES CRITIQUES:')
      report.criticalDifferences.slice(0, 10).forEach((diff, index) => {
        console.log(`   ${index + 1}. ${diff.field}: attendu ${diff.expected}$, obtenu ${diff.actual}$ (écart: ${diff.absoluteDifference.toFixed(0)}$)`)
      })
    }

    console.log('\n💡 RECOMMANDATIONS:')
    report.recommendations.forEach(rec => {
      console.log(`   ${rec}`)
    })

    console.log('\n' + '='.repeat(80))
  }
}