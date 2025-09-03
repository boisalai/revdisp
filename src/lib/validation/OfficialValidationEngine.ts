/**
 * Moteur de validation qui compare nos calculs avec le calculateur officiel
 * en utilisant le scraper Python/Selenium qui fonctionne correctement
 */

import { RevenuDisponibleCalculator, CalculationResults } from '../MainCalculator'
import { Household } from '../models'
import { PythonOfficialCalculatorScraper, PythonOfficialCalculatorResult, PythonValidationComparer } from './PythonOfficialCalculatorScraper'
import Decimal from 'decimal.js'

export interface OfficialValidationResult {
  testCase: OfficialTestCase
  ourResults: CalculationResults | null
  officialResults: PythonOfficialCalculatorResult | null
  comparisons: ProgramComparison[]
  overallAccuracy: number
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical' | 'error'
  errorMessage?: string
}

export interface OfficialTestCase {
  id: string
  description: string
  household: Household
  priority: 'high' | 'medium' | 'low'
}

export interface ProgramComparison {
  programName: string
  ourValue: number
  officialValue: number | undefined
  difference: number
  percentageError: number
  status: 'match' | 'minor_diff' | 'major_diff' | 'critical_diff' | 'no_official_data'
  tolerance: number
}

export interface OfficialValidationReport {
  summary: {
    totalTests: number
    excellent: number
    good: number
    needsImprovement: number
    critical: number
    errors: number
    overallAccuracy: number
  }
  programAnalysis: Array<{
    program: string
    averageAccuracy: number
    testCount: number
    criticalErrorCount: number
    recommendedAction: string
  }>
  worstCases: OfficialValidationResult[]
  recommendations: string[]
  timestamp: Date
}

export class OfficialValidationEngine {
  private calculator: RevenuDisponibleCalculator
  private scraper: PythonOfficialCalculatorScraper

  constructor(taxYear: number = 2024) {
    this.calculator = new RevenuDisponibleCalculator(taxYear)
    this.scraper = new PythonOfficialCalculatorScraper({ timeout: 60000 })
  }

  async initialize(): Promise<void> {
    await this.calculator.initialize()
  }

  /**
   * Valide un ensemble de ménages contre le calculateur officiel
   */
  async validateAgainstOfficialCalculator(households: Household[]): Promise<OfficialValidationReport> {
    console.log(`🔍 Validation contre calculateur officiel (${households.length} cas)`)
    
    const testCases: OfficialTestCase[] = households.map((household, index) => ({
      id: `test_${index + 1}`,
      description: this.generateTestDescription(household),
      household,
      priority: this.determinePriority(household)
    }))

    const results: OfficialValidationResult[] = []

    // Traiter chaque cas de test
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      console.log(`📊 Test ${i + 1}/${testCases.length}: ${testCase.description}`)
      
      const result = await this.runOfficialValidationTest(testCase)
      results.push(result)
      
      // Afficher le résultat immédiatement
      this.logTestResult(result, i + 1)
      
      // Délai entre les tests pour éviter de surcharger le serveur officiel
      if (i < testCases.length - 1) {
        await this.delay(2000)
      }
    }

    return this.generateOfficialReport(results)
  }

  /**
   * Exécute un test de validation contre le calculateur officiel
   */
  async runOfficialValidationTest(testCase: OfficialTestCase): Promise<OfficialValidationResult> {
    try {
      // Calculer nos résultats
      const ourResults = await this.calculator.calculate(testCase.household)
      
      // Scraper les résultats officiels
      const officialResults = await this.scraper.scrapeOfficialCalculator(testCase.household)
      
      if (!officialResults.success) {
        return {
          testCase,
          ourResults,
          officialResults,
          comparisons: [],
          overallAccuracy: 0,
          status: 'error',
          errorMessage: officialResults.error || 'Échec du scraping officiel'
        }
      }

      // Comparer programme par programme
      const comparisons = this.compareAllPrograms(ourResults, officialResults)
      const overallAccuracy = this.calculateOverallAccuracy(comparisons)
      const status = this.determineOverallStatus(overallAccuracy, comparisons)

      return {
        testCase,
        ourResults,
        officialResults,
        comparisons,
        overallAccuracy,
        status
      }

    } catch (error) {
      console.error(`❌ Erreur validation test ${testCase.id}:`, error)
      return {
        testCase,
        ourResults: null,
        officialResults: null,
        comparisons: [],
        overallAccuracy: 0,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  /**
   * Compare tous les programmes entre nos résultats et les résultats officiels
   */
  private compareAllPrograms(
    ourResults: CalculationResults, 
    officialResults: PythonOfficialCalculatorResult
  ): ProgramComparison[] {
    const comparisons: ProgramComparison[] = []

    // Revenu disponible total
    if (officialResults.revenu_disponible !== undefined) {
      const comparison = this.createComparison(
        'Revenu disponible',
        ourResults.revenu_disponible.toNumber(),
        officialResults.revenu_disponible,
        10.0 // Tolérance plus élevée pour le total
      )
      comparisons.push(comparison)
    }

    // Cotisations
    const cotisationComparisons = [
      {
        name: 'Assurance-emploi',
        ourValue: ourResults.cotisations.assurance_emploi?.toNumber() || 0,
        officialValue: officialResults.ae_total,
        tolerance: 1.0
      },
      {
        name: 'RRQ',
        ourValue: ourResults.cotisations.rrq?.toNumber() || 0,
        officialValue: officialResults.rrq_total,
        tolerance: 1.0
      },
      {
        name: 'RQAP',
        ourValue: ourResults.cotisations.rqap?.toNumber() || 0,
        officialValue: officialResults.rqap_total,
        tolerance: 1.0
      },
      {
        name: 'FSS',
        ourValue: ourResults.cotisations.fss?.toNumber() || 0,
        officialValue: officialResults.fss,
        tolerance: 1.0
      },
      {
        name: 'RAMQ',
        ourValue: ourResults.cotisations.ramq?.toNumber() || 0,
        officialValue: officialResults.ramq,
        tolerance: 1.0
      }
    ]

    cotisationComparisons.forEach(comp => {
      if (comp.officialValue !== undefined) {
        const comparison = this.createComparison(comp.name, comp.ourValue, comp.officialValue, comp.tolerance)
        comparisons.push(comparison)
      }
    })

    // Impôts (commentés pour l'instant car pas encore dans CalculationResults)
    // if (officialResults.qc_impot_total !== undefined && ourResults.impots?.quebec) {
    //   const comparison = this.createComparison(
    //     'Impôt Québec',
    //     ourResults.impots.quebec.toNumber(),
    //     officialResults.qc_impot_total,
    //     5.0
    //   )
    //   comparisons.push(comparison)
    // }

    // if (officialResults.ca_impot_total !== undefined && ourResults.impots?.federal) {
    //   const comparison = this.createComparison(
    //     'Impôt fédéral',
    //     ourResults.impots.federal.toNumber(),
    //     officialResults.ca_impot_total,
    //     5.0
    //   )
    //   comparisons.push(comparison)
    // }

    // Crédits et allocations (commentés pour l'instant car pas encore dans CalculationResults)
    // const creditComparisons = [
    //   {
    //     name: 'Crédit solidarité',
    //     ourValue: ourResults.credits?.solidarite?.toNumber() || 0,
    //     officialValue: officialResults.qc_solidarite,
    //     tolerance: 1.0
    //   },
    //   {
    //     name: 'Crédit TPS',
    //     ourValue: ourResults.credits?.tps?.toNumber() || 0,
    //     officialValue: officialResults.ca_tps,
    //     tolerance: 1.0
    //   },
    //   {
    //     name: 'Prime travail',
    //     ourValue: ourResults.credits?.prime_travail?.toNumber() || 0,
    //     officialValue: officialResults.qc_prime_travail,
    //     tolerance: 1.0
    //   }
    // ]

    // creditComparisons.forEach(comp => {
    //   if (comp.officialValue !== undefined && (comp.ourValue > 0 || comp.officialValue > 0)) {
    //     const comparison = this.createComparison(comp.name, comp.ourValue, comp.officialValue, comp.tolerance)
    //     comparisons.push(comparison)
    //   }
    // })

    return comparisons
  }

  /**
   * Crée une comparaison pour un programme spécifique
   */
  private createComparison(
    programName: string,
    ourValue: number,
    officialValue: number,
    tolerance: number
  ): ProgramComparison {
    const difference = Math.abs(ourValue - officialValue)
    const percentageError = officialValue !== 0 
      ? (difference / Math.abs(officialValue)) * 100 
      : (ourValue !== 0 ? 100 : 0)

    let status: ProgramComparison['status']
    if (difference <= tolerance) {
      status = 'match'
    } else if (percentageError <= 5) {
      status = 'minor_diff'
    } else if (percentageError <= 15) {
      status = 'major_diff'
    } else {
      status = 'critical_diff'
    }

    return {
      programName,
      ourValue,
      officialValue,
      difference,
      percentageError,
      status,
      tolerance
    }
  }

  /**
   * Calcule la précision globale
   */
  private calculateOverallAccuracy(comparisons: ProgramComparison[]): number {
    if (comparisons.length === 0) return 0

    const accuracies = comparisons.map(comp => {
      if (comp.status === 'match') return 100
      if (comp.status === 'minor_diff') return Math.max(95 - comp.percentageError, 0)
      if (comp.status === 'major_diff') return Math.max(85 - comp.percentageError, 0)
      if (comp.status === 'critical_diff') return Math.max(50 - comp.percentageError, 0)
      return 0 // no_official_data
    })

    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
  }

  /**
   * Détermine le statut global du test
   */
  private determineOverallStatus(
    accuracy: number,
    comparisons: ProgramComparison[]
  ): OfficialValidationResult['status'] {
    const hasCritical = comparisons.some(c => c.status === 'critical_diff')
    const hasMajor = comparisons.some(c => c.status === 'major_diff')

    if (hasCritical || accuracy < 70) return 'critical'
    if (hasMajor || accuracy < 85) return 'needs_improvement'
    if (accuracy < 95) return 'good'
    return 'excellent'
  }

  /**
   * Génère une description du cas de test
   */
  private generateTestDescription(household: Household): string {
    const type = household.householdType.replace(/_/g, ' ')
    const age = household.primaryPerson.age
    const income = household.primaryPerson.isRetired 
      ? household.primaryPerson.grossRetirementIncome
      : household.primaryPerson.grossWorkIncome
    
    let desc = `${type}, ${age} ans, ${income}$`
    
    if (household.spouse) {
      const spouseIncome = household.spouse.isRetired 
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
      desc += ` + conjoint ${household.spouse.age} ans, ${spouseIncome}$`
    }
    
    if (household.numChildren > 0) {
      desc += `, ${household.numChildren} enfant${household.numChildren > 1 ? 's' : ''}`
    }

    return desc
  }

  /**
   * Détermine la priorité du test
   */
  private determinePriority(household: Household): 'high' | 'medium' | 'low' {
    // Cas prioritaires: revenus typiques, situations courantes
    const income = household.primaryPerson.isRetired 
      ? household.primaryPerson.grossRetirementIncome.toNumber()
      : household.primaryPerson.grossWorkIncome.toNumber()

    if (income >= 15000 && income <= 80000) return 'high'
    if (income >= 80000 && income <= 120000) return 'medium'
    return 'low'
  }

  /**
   * Affiche le résultat d'un test
   */
  private logTestResult(result: OfficialValidationResult, testNumber: number): void {
    const statusIcon = {
      'excellent': '🟢',
      'good': '🟡', 
      'needs_improvement': '🟠',
      'critical': '🔴',
      'error': '❌'
    }[result.status]

    console.log(`   ${statusIcon} Test ${testNumber}: ${result.overallAccuracy.toFixed(1)}% précision`)
    
    if (result.status === 'error') {
      console.log(`      ❌ ${result.errorMessage}`)
    } else if (result.comparisons.length > 0) {
      const criticalIssues = result.comparisons.filter(c => c.status === 'critical_diff')
      if (criticalIssues.length > 0) {
        console.log(`      🚨 Issues critiques: ${criticalIssues.map(c => c.programName).join(', ')}`)
      }
    }
  }

  /**
   * Génère le rapport de validation officiel
   */
  private generateOfficialReport(results: OfficialValidationResult[]): OfficialValidationReport {
    const summary = {
      totalTests: results.length,
      excellent: results.filter(r => r.status === 'excellent').length,
      good: results.filter(r => r.status === 'good').length,
      needsImprovement: results.filter(r => r.status === 'needs_improvement').length,
      critical: results.filter(r => r.status === 'critical').length,
      errors: results.filter(r => r.status === 'error').length,
      overallAccuracy: results
        .filter(r => r.status !== 'error')
        .reduce((sum, r) => sum + r.overallAccuracy, 0) / 
        Math.max(results.filter(r => r.status !== 'error').length, 1)
    }

    // Analyser les programmes
    const programStats = new Map<string, { accuracies: number[], criticalCount: number }>()
    
    results.forEach(result => {
      result.comparisons.forEach(comp => {
        if (!programStats.has(comp.programName)) {
          programStats.set(comp.programName, { accuracies: [], criticalCount: 0 })
        }
        const stats = programStats.get(comp.programName)!
        
        if (comp.status !== 'no_official_data') {
          stats.accuracies.push(100 - comp.percentageError)
        }
        if (comp.status === 'critical_diff') {
          stats.criticalCount++
        }
      })
    })

    const programAnalysis = Array.from(programStats.entries()).map(([program, stats]) => ({
      program,
      averageAccuracy: stats.accuracies.length > 0 
        ? stats.accuracies.reduce((sum, acc) => sum + acc, 0) / stats.accuracies.length
        : 0,
      testCount: stats.accuracies.length,
      criticalErrorCount: stats.criticalCount,
      recommendedAction: this.getRecommendedAction(stats.accuracies, stats.criticalCount)
    }))

    // Identifier les pires cas
    const worstCases = results
      .filter(r => r.status !== 'error')
      .sort((a, b) => a.overallAccuracy - b.overallAccuracy)
      .slice(0, 5)

    // Générer les recommandations
    const recommendations = this.generateOfficialRecommendations(results, programAnalysis, summary)

    return {
      summary,
      programAnalysis,
      worstCases,
      recommendations,
      timestamp: new Date()
    }
  }

  /**
   * Détermine l'action recommandée pour un programme
   */
  private getRecommendedAction(accuracies: number[], criticalCount: number): string {
    if (accuracies.length === 0) return 'Aucune donnée officielle disponible'
    
    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    
    if (criticalCount > 0 || avgAccuracy < 85) return 'Correction urgente requise'
    if (avgAccuracy < 95) return 'Amélioration recommandée'
    return 'Performance satisfaisante'
  }

  /**
   * Génère les recommandations du rapport
   */
  private generateOfficialRecommendations(
    results: OfficialValidationResult[],
    programAnalysis: OfficialValidationReport['programAnalysis'],
    summary: OfficialValidationReport['summary']
  ): string[] {
    const recommendations: string[] = []

    // Recommandations basées sur la performance globale
    if (summary.overallAccuracy >= 95) {
      recommendations.push('🎉 Excellente précision! Le calculateur est prêt pour la production')
    } else if (summary.overallAccuracy >= 85) {
      recommendations.push('✅ Performance satisfaisante, quelques ajustements mineurs recommandés')
    } else if (summary.overallAccuracy >= 70) {
      recommendations.push('⚠️ Améliorations nécessaires avant déploiement en production')
    } else {
      recommendations.push('🔴 Révision majeure requise - précision insuffisante')
    }

    // Recommandations par programme critique
    const criticalPrograms = programAnalysis.filter(p => p.criticalErrorCount > 0 || p.averageAccuracy < 85)
    criticalPrograms.forEach(program => {
      recommendations.push(`🔧 Corriger ${program.program}: ${program.criticalErrorCount} erreurs critiques, précision ${program.averageAccuracy.toFixed(1)}%`)
    })

    // Recommandations basées sur les patterns d'erreurs
    if (summary.errors > 0) {
      recommendations.push(`🚨 Résoudre ${summary.errors} erreurs de scraping - vérifier la connectivité`)
    }

    if (summary.critical > summary.totalTests * 0.2) {
      recommendations.push('📊 Plus de 20% de cas critiques - révision systémique nécessaire')
    }

    return recommendations
  }

  /**
   * Délai utilitaire
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Affiche un rapport formaté
   */
  printOfficialReport(report: OfficialValidationReport): void {
    console.log('\n' + '='.repeat(80))
    console.log('🏛️  RAPPORT DE VALIDATION - CALCULATEUR OFFICIEL DU QUÉBEC')
    console.log('='.repeat(80))
    
    console.log('\n📊 RÉSUMÉ GLOBAL:')
    console.log(`   Tests totaux: ${report.summary.totalTests}`)
    console.log(`   🟢 Excellents: ${report.summary.excellent}`)
    console.log(`   🟡 Bons: ${report.summary.good}`)
    console.log(`   🟠 À améliorer: ${report.summary.needsImprovement}`)
    console.log(`   🔴 Critiques: ${report.summary.critical}`)
    console.log(`   ❌ Erreurs: ${report.summary.errors}`)
    console.log(`   🎯 Précision moyenne: ${report.summary.overallAccuracy.toFixed(1)}%`)

    console.log('\n📋 ANALYSE PAR PROGRAMME:')
    report.programAnalysis
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
      .forEach(prog => {
        const icon = prog.averageAccuracy >= 95 ? '✅' : prog.averageAccuracy >= 85 ? '⚠️' : '🔴'
        console.log(`   ${icon} ${prog.program}: ${prog.averageAccuracy.toFixed(1)}% (${prog.testCount} tests)`)
        if (prog.criticalErrorCount > 0) {
          console.log(`      🚨 ${prog.criticalErrorCount} erreurs critiques - ${prog.recommendedAction}`)
        }
      })

    if (report.worstCases.length > 0) {
      console.log('\n⚠️ PIRES CAS:')
      report.worstCases.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.testCase.description}`)
        console.log(`      Précision: ${result.overallAccuracy.toFixed(1)}%`)
      })
    }

    console.log('\n💡 RECOMMANDATIONS:')
    report.recommendations.forEach(rec => {
      console.log(`   ${rec}`)
    })

    console.log(`\n⏰ Rapport généré le: ${report.timestamp.toLocaleString('fr-CA')}`)
    console.log('='.repeat(80))
  }
}