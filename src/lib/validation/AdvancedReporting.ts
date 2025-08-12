/**
 * Système de rapport avancé pour l'analyse des écarts et la prioritisation
 * Fournit des insights détaillés pour guider le développement
 */

import { ValidationResult, ValidationDifference, ValidationReport } from './ValidationEngine'
import { ValidationTestCase } from './ValidationTestCases'
import { HouseholdType } from '../models'
import * as fs from 'fs'
import * as path from 'path'

export interface AdvancedAnalysis {
  /** Analyse des patterns d'erreurs */
  errorPatterns: ErrorPatternAnalysis
  /** Segmentation par type de ménage */
  householdSegmentation: HouseholdSegmentAnalysis
  /** Analyse des plages de revenus */
  incomeRangeAnalysis: IncomeRangeAnalysis
  /** Analyse des calculateurs individuels */
  calculatorAnalysis: CalculatorComponentAnalysis
  /** Priorités de développement */
  developmentPriorities: DevelopmentPriority[]
  /** Statistiques avancées */
  advancedStats: AdvancedStatistics
  /** Recommendations détaillées */
  detailedRecommendations: DetailedRecommendation[]
}

export interface ErrorPatternAnalysis {
  /** Champs avec le plus d'erreurs */
  mostProblematicFields: Array<{
    field: string
    errorCount: number
    averageError: number
    maxError: number
    errorRate: number
  }>
  /** Corrélations entre erreurs */
  errorCorrelations: Array<{
    field1: string
    field2: string
    correlationCoefficient: number
  }>
  /** Patterns par sévérité */
  severityPatterns: {
    critical: { count: number, fields: string[] }
    major: { count: number, fields: string[] }
    minor: { count: number, fields: string[] }
  }
}

export interface HouseholdSegmentAnalysis {
  segments: Array<{
    householdType: HouseholdType
    totalCases: number
    successRate: number
    averageAccuracy: number
    problematicFields: string[]
    recommendations: string[]
  }>
}

export interface IncomeRangeAnalysis {
  ranges: Array<{
    min: number
    max: number
    caseCount: number
    successRate: number
    averageAccuracy: number
    problematicFields: string[]
    commonIssues: string[]
  }>
}

export interface CalculatorComponentAnalysis {
  components: Array<{
    name: string
    accuracy: number
    reliability: number
    errorCount: number
    averageError: number
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
    recommendations: string[]
  }>
}

export interface DevelopmentPriority {
  rank: number
  component: string
  issue: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  roi: number // Return on Investment score
  affectedCases: number
  potentialImprovement: number
  description: string
  suggestedActions: string[]
}

export interface AdvancedStatistics {
  /** Distribution des erreurs */
  errorDistribution: {
    mean: number
    median: number
    standardDeviation: number
    percentiles: { p25: number, p50: number, p75: number, p90: number, p95: number }
  }
  /** Tendances temporelles si applicable */
  trends?: {
    improvementRate: number
    regressionAreas: string[]
  }
  /** Métriques de performance */
  performance: {
    averageProcessingTime: number
    successfulScrapingRate: number
    dataQualityScore: number
  }
}

export interface DetailedRecommendation {
  category: 'algorithm' | 'data' | 'validation' | 'architecture'
  priority: 'immediate' | 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: string
  implementationComplexity: 'low' | 'medium' | 'high'
  estimatedTimeToImplement: string
  prerequisites: string[]
  successCriteria: string[]
}

export class AdvancedReportingEngine {
  /**
   * Génère une analyse avancée complète
   */
  static generateAdvancedAnalysis(results: ValidationResult[]): AdvancedAnalysis {
    console.log('📊 Génération de l\'analyse avancée...')

    const errorPatterns = this.analyzeErrorPatterns(results)
    const householdSegmentation = this.analyzeHouseholdSegments(results)
    const incomeRangeAnalysis = this.analyzeIncomeRanges(results)
    const calculatorAnalysis = this.analyzeCalculatorComponents(results)
    const developmentPriorities = this.calculateDevelopmentPriorities(results, errorPatterns, calculatorAnalysis)
    const advancedStats = this.calculateAdvancedStatistics(results)
    const detailedRecommendations = this.generateDetailedRecommendations(
      errorPatterns, householdSegmentation, calculatorAnalysis, developmentPriorities
    )

    return {
      errorPatterns,
      householdSegmentation,
      incomeRangeAnalysis,
      calculatorAnalysis,
      developmentPriorities,
      advancedStats,
      detailedRecommendations
    }
  }

  /**
   * Analyse les patterns d'erreurs
   */
  private static analyzeErrorPatterns(results: ValidationResult[]): ErrorPatternAnalysis {
    const fieldErrors = new Map<string, number[]>()
    const fieldErrorCounts = new Map<string, number>()
    
    // Collecter toutes les erreurs par champ
    results.forEach(result => {
      result.differences.forEach(diff => {
        if (!fieldErrors.has(diff.field)) {
          fieldErrors.set(diff.field, [])
          fieldErrorCounts.set(diff.field, 0)
        }
        fieldErrors.get(diff.field)!.push(diff.absoluteDifference)
        fieldErrorCounts.set(diff.field, fieldErrorCounts.get(diff.field)! + 1)
      })
    })

    // Calculer les statistiques par champ
    const mostProblematicFields = Array.from(fieldErrors.entries())
      .map(([field, errors]) => ({
        field,
        errorCount: errors.length,
        averageError: errors.reduce((sum, err) => sum + err, 0) / errors.length,
        maxError: Math.max(...errors),
        errorRate: errors.length / results.length
      }))
      .sort((a, b) => b.errorCount - a.errorCount)

    // Analyser la sévérité
    const severityPatterns = {
      critical: { count: 0, fields: [] as string[] },
      major: { count: 0, fields: [] as string[] },
      minor: { count: 0, fields: [] as string[] }
    }

    results.forEach(result => {
      result.differences.forEach(diff => {
        severityPatterns[diff.severity].count++
        if (!severityPatterns[diff.severity].fields.includes(diff.field)) {
          severityPatterns[diff.severity].fields.push(diff.field)
        }
      })
    })

    // TODO: Calculer les corrélations entre erreurs
    const errorCorrelations = this.calculateErrorCorrelations(results)

    return {
      mostProblematicFields,
      errorCorrelations,
      severityPatterns
    }
  }

  /**
   * Calcule les corrélations entre erreurs de différents champs
   */
  private static calculateErrorCorrelations(results: ValidationResult[]): Array<{
    field1: string, field2: string, correlationCoefficient: number
  }> {
    // Simplification: retourner un tableau vide pour l'instant
    // L'implémentation complète nécessiterait une analyse statistique plus poussée
    return []
  }

  /**
   * Analyse par segment de ménage
   */
  private static analyzeHouseholdSegments(results: ValidationResult[]): HouseholdSegmentAnalysis {
    const segments = new Map<HouseholdType, ValidationResult[]>()
    
    // Grouper par type de ménage
    results.forEach(result => {
      const type = result.testCase.input.householdType
      if (!segments.has(type)) {
        segments.set(type, [])
      }
      segments.get(type)!.push(result)
    })

    const segmentAnalysis = Array.from(segments.entries()).map(([householdType, segmentResults]) => {
      const successRate = segmentResults.filter(r => r.status === 'pass').length / segmentResults.length
      const averageAccuracy = segmentResults
        .filter(r => r.status !== 'error')
        .reduce((sum, r) => sum + (100 - r.totalPercentageDifference), 0) / 
        segmentResults.filter(r => r.status !== 'error').length

      // Identifier les champs problématiques pour ce segment
      const fieldErrorCounts = new Map<string, number>()
      segmentResults.forEach(result => {
        result.differences.forEach(diff => {
          fieldErrorCounts.set(diff.field, (fieldErrorCounts.get(diff.field) || 0) + 1)
        })
      })

      const problematicFields = Array.from(fieldErrorCounts.entries())
        .filter(([, count]) => count > segmentResults.length * 0.1) // Plus de 10% d'erreurs
        .map(([field]) => field)

      const recommendations = this.generateSegmentRecommendations(householdType, problematicFields, successRate)

      return {
        householdType,
        totalCases: segmentResults.length,
        successRate,
        averageAccuracy: averageAccuracy || 0,
        problematicFields,
        recommendations
      }
    })

    return { segments: segmentAnalysis }
  }

  /**
   * Génère des recommandations spécifiques par segment
   */
  private static generateSegmentRecommendations(
    householdType: HouseholdType, 
    problematicFields: string[], 
    successRate: number
  ): string[] {
    const recommendations: string[] = []

    if (successRate < 0.7) {
      recommendations.push(`Révision urgente nécessaire pour ${householdType} (taux de succès: ${(successRate * 100).toFixed(1)}%)`)
    }

    if (problematicFields.includes('rrq')) {
      recommendations.push('Vérifier le calcul RRQ pour ce type de ménage')
    }

    if (problematicFields.includes('assuranceEmploi')) {
      recommendations.push('Réviser la logique d\'assurance-emploi pour ce segment')
    }

    if (householdType === HouseholdType.RETIRED_SINGLE || householdType === HouseholdType.RETIRED_COUPLE) {
      recommendations.push('Attention particulière aux règles spécifiques aux retraités')
    }

    return recommendations
  }

  /**
   * Analyse par plage de revenus
   */
  private static analyzeIncomeRanges(results: ValidationResult[]): IncomeRangeAnalysis {
    // Définir les plages de revenus
    const ranges = [
      { min: 0, max: 25000 },
      { min: 25000, max: 50000 },
      { min: 50000, max: 75000 },
      { min: 75000, max: 100000 },
      { min: 100000, max: 150000 },
      { min: 150000, max: Infinity }
    ]

    const rangeAnalysis = ranges.map(range => {
      const rangeResults = results.filter(result => {
        const totalIncome = result.testCase.input.primaryPerson.grossWorkIncome + 
                           result.testCase.input.primaryPerson.grossRetirementIncome +
                           (result.testCase.input.spouse ? 
                            result.testCase.input.spouse.grossWorkIncome + result.testCase.input.spouse.grossRetirementIncome : 0)
        return totalIncome >= range.min && totalIncome < range.max
      })

      if (rangeResults.length === 0) {
        return {
          min: range.min,
          max: range.max,
          caseCount: 0,
          successRate: 0,
          averageAccuracy: 0,
          problematicFields: [],
          commonIssues: []
        }
      }

      const successRate = rangeResults.filter(r => r.status === 'pass').length / rangeResults.length
      const averageAccuracy = rangeResults
        .filter(r => r.status !== 'error')
        .reduce((sum, r) => sum + (100 - r.totalPercentageDifference), 0) / 
        rangeResults.filter(r => r.status !== 'error').length

      // Identifier les champs problématiques
      const fieldErrorCounts = new Map<string, number>()
      rangeResults.forEach(result => {
        result.differences.forEach(diff => {
          fieldErrorCounts.set(diff.field, (fieldErrorCounts.get(diff.field) || 0) + 1)
        })
      })

      const problematicFields = Array.from(fieldErrorCounts.entries())
        .filter(([, count]) => count > rangeResults.length * 0.15)
        .map(([field]) => field)

      const commonIssues = this.identifyCommonIssues(rangeResults, range)

      return {
        min: range.min,
        max: range.max,
        caseCount: rangeResults.length,
        successRate,
        averageAccuracy: averageAccuracy || 0,
        problematicFields,
        commonIssues
      }
    })

    return { ranges: rangeAnalysis }
  }

  /**
   * Identifie les problèmes communs dans une plage de revenus
   */
  private static identifyCommonIssues(results: ValidationResult[], range: { min: number, max: number }): string[] {
    const issues: string[] = []
    
    if (range.min >= 100000) {
      issues.push('Possible problème avec les hauts revenus et les plafonds de cotisation')
    }
    
    if (range.max <= 25000) {
      issues.push('Vérifier les seuils d\'exemption et les crédits pour faibles revenus')
    }

    return issues
  }

  /**
   * Analyse des composants calculateurs
   */
  private static analyzeCalculatorComponents(results: ValidationResult[]): CalculatorComponentAnalysis {
    const components = [
      { name: 'RRQ/QPP', field: 'rrq' },
      { name: 'Assurance-emploi', field: 'assuranceEmploi' },
      { name: 'RQAP', field: 'rqap' },
      { name: 'FSS', field: 'fss' },
      { name: 'RAMQ', field: 'ramq' }
    ]

    const componentAnalysis = components.map(component => {
      const componentErrors = results.flatMap(result => 
        result.differences.filter(diff => diff.field === component.field)
      )

      const totalCases = results.length
      const errorCount = componentErrors.length
      const accuracy = ((totalCases - errorCount) / totalCases) * 100
      const reliability = (results.filter(r => r.status !== 'error').length / totalCases) * 100
      const averageError = componentErrors.length > 0 
        ? componentErrors.reduce((sum, err) => sum + err.absoluteDifference, 0) / componentErrors.length
        : 0

      let status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
      if (accuracy >= 95) status = 'excellent'
      else if (accuracy >= 85) status = 'good'
      else if (accuracy >= 70) status = 'needs_improvement'
      else status = 'critical'

      const recommendations = this.generateComponentRecommendations(component.name, status, averageError)

      return {
        name: component.name,
        accuracy,
        reliability,
        errorCount,
        averageError,
        status,
        recommendations
      }
    })

    return { components: componentAnalysis }
  }

  /**
   * Génère des recommandations pour un composant spécifique
   */
  private static generateComponentRecommendations(
    componentName: string, 
    status: string, 
    averageError: number
  ): string[] {
    const recommendations: string[] = []

    if (status === 'critical') {
      recommendations.push(`${componentName}: Révision complète urgente nécessaire`)
      recommendations.push(`${componentName}: Vérifier les paramètres fiscaux et les formules de calcul`)
    } else if (status === 'needs_improvement') {
      recommendations.push(`${componentName}: Amélioration des calculs requise`)
      if (averageError > 100) {
        recommendations.push(`${componentName}: Erreur moyenne élevée (${averageError.toFixed(0)}$) - vérifier les seuils`)
      }
    }

    return recommendations
  }

  /**
   * Calcule les priorités de développement
   */
  private static calculateDevelopmentPriorities(
    results: ValidationResult[],
    errorPatterns: ErrorPatternAnalysis,
    calculatorAnalysis: CalculatorComponentAnalysis
  ): DevelopmentPriority[] {
    const priorities: DevelopmentPriority[] = []

    // Analyser chaque composant problématique
    calculatorAnalysis.components.forEach((component, index) => {
      if (component.status === 'critical' || component.status === 'needs_improvement') {
        const affectedCases = component.errorCount
        const potentialImprovement = (100 - component.accuracy) * affectedCases
        
        // Calculer le ROI (Return on Investment)
        let effort: 'low' | 'medium' | 'high'
        if (component.name === 'RAMQ') effort = 'high' // Plus complexe
        else if (component.name === 'RRQ/QPP') effort = 'medium'
        else effort = 'low'

        const effortScore = effort === 'low' ? 1 : effort === 'medium' ? 2 : 3
        const roi = potentialImprovement / effortScore

        priorities.push({
          rank: 0, // Sera calculé après tri
          component: component.name,
          issue: this.describeComponentIssue(component),
          impact: component.status === 'critical' ? 'high' : 'medium',
          effort,
          roi,
          affectedCases,
          potentialImprovement,
          description: `${component.name} présente une précision de ${component.accuracy.toFixed(1)}% avec ${component.errorCount} erreurs`,
          suggestedActions: component.recommendations
        })
      }
    })

    // Trier par ROI et assigner les rangs
    priorities.sort((a, b) => b.roi - a.roi)
    priorities.forEach((priority, index) => {
      priority.rank = index + 1
    })

    return priorities.slice(0, 10) // Top 10 priorités
  }

  /**
   * Décrit le problème principal d'un composant
   */
  private static describeComponentIssue(component: any): string {
    if (component.accuracy < 70) return 'Précision critique - révision complète nécessaire'
    if (component.averageError > 200) return 'Erreurs importantes - paramètres possiblement incorrects'
    if (component.errorCount > 50) return 'Nombreuses erreurs - logique de calcul à revoir'
    return 'Améliorations mineures nécessaires'
  }

  /**
   * Calcule les statistiques avancées
   */
  private static calculateAdvancedStatistics(results: ValidationResult[]): AdvancedStatistics {
    const errors = results.flatMap(r => r.differences.map(d => d.absoluteDifference))
    
    const errorDistribution = {
      mean: errors.length > 0 ? errors.reduce((sum, err) => sum + err, 0) / errors.length : 0,
      median: this.calculateMedian(errors),
      standardDeviation: this.calculateStandardDeviation(errors),
      percentiles: this.calculatePercentiles(errors)
    }

    const successfulScrapingRate = results.filter(r => r.status !== 'error').length / results.length
    const dataQualityScore = (successfulScrapingRate + (results.filter(r => r.status === 'pass').length / results.length)) / 2

    return {
      errorDistribution,
      performance: {
        averageProcessingTime: 0, // À implémenter avec des mesures temporelles
        successfulScrapingRate,
        dataQualityScore
      }
    }
  }

  /**
   * Génère des recommandations détaillées
   */
  private static generateDetailedRecommendations(
    errorPatterns: ErrorPatternAnalysis,
    householdSegmentation: HouseholdSegmentAnalysis,
    calculatorAnalysis: CalculatorComponentAnalysis,
    developmentPriorities: DevelopmentPriority[]
  ): DetailedRecommendation[] {
    const recommendations: DetailedRecommendation[] = []

    // Recommandations basées sur les priorités de développement
    developmentPriorities.slice(0, 5).forEach(priority => {
      recommendations.push({
        category: 'algorithm',
        priority: priority.impact === 'high' ? 'immediate' : 'high',
        title: `Améliorer le calculateur ${priority.component}`,
        description: priority.description,
        expectedImpact: `Amélioration potentielle de ${priority.potentialImprovement.toFixed(0)} points sur ${priority.affectedCases} cas`,
        implementationComplexity: priority.effort,
        estimatedTimeToImplement: this.estimateImplementationTime(priority.effort),
        prerequisites: [`Accès aux paramètres fiscaux ${priority.component}`, 'Tests unitaires existants'],
        successCriteria: [`Précision > 95% pour ${priority.component}`, 'Aucune erreur critique résiduelle']
      })
    })

    // Recommandations pour les segments problématiques
    householdSegmentation.segments
      .filter(segment => segment.successRate < 0.8)
      .forEach(segment => {
        recommendations.push({
          category: 'data',
          priority: segment.successRate < 0.5 ? 'immediate' : 'high',
          title: `Améliorer la validation pour ${segment.householdType}`,
          description: `Ce segment présente un taux de succès de ${(segment.successRate * 100).toFixed(1)}%`,
          expectedImpact: `Amélioration pour ${segment.totalCases} cas de test`,
          implementationComplexity: 'medium',
          estimatedTimeToImplement: '1-2 semaines',
          prerequisites: ['Données de test spécifiques au segment', 'Compréhension des règles métier'],
          successCriteria: ['Taux de succès > 90% pour ce segment']
        })
      })

    return recommendations
  }

  /**
   * Estime le temps d'implémentation
   */
  private static estimateImplementationTime(effort: 'low' | 'medium' | 'high'): string {
    const timeEstimates = {
      low: '2-5 jours',
      medium: '1-2 semaines',
      high: '3-4 semaines'
    }
    return timeEstimates[effort]
  }

  /**
   * Méthodes utilitaires pour les statistiques
   */
  private static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  private static calculatePercentiles(values: number[]) {
    if (values.length === 0) return { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 }
    const sorted = [...values].sort((a, b) => a - b)
    
    const percentile = (p: number) => {
      const index = Math.ceil(sorted.length * p / 100) - 1
      return sorted[Math.max(0, index)]
    }

    return {
      p25: percentile(25),
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
      p95: percentile(95)
    }
  }

  /**
   * Sauvegarde l'analyse avancée dans un fichier
   */
  static saveAdvancedAnalysis(analysis: AdvancedAnalysis, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2))
    console.log(`📊 Analyse avancée sauvegardée: ${outputPath}`)
  }

  /**
   * Génère un rapport HTML lisible
   */
  static generateHTMLReport(analysis: AdvancedAnalysis, outputPath: string): void {
    const html = this.createHTMLReport(analysis)
    fs.writeFileSync(outputPath, html)
    console.log(`📄 Rapport HTML généré: ${outputPath}`)
  }

  /**
   * Crée le contenu HTML du rapport
   */
  private static createHTMLReport(analysis: AdvancedAnalysis): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Validation Avancé - Calculateur de Revenu Disponible</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #2c3e50; }
        .priority-high { color: #e74c3c; font-weight: bold; }
        .priority-medium { color: #f39c12; }
        .priority-low { color: #27ae60; }
        .status-excellent { color: #27ae60; }
        .status-good { color: #f39c12; }
        .status-needs_improvement { color: #e67e22; }
        .status-critical { color: #e74c3c; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #ecf0f1; border-radius: 8px; }
        .recommendation { background: #e8f6f3; border-left: 4px solid #16a085; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Rapport de Validation Avancé</h1>
        <p><strong>Généré le:</strong> ${new Date().toLocaleString('fr-CA')}</p>
        
        <h2>🎯 Priorités de Développement</h2>
        <table>
            <thead>
                <tr>
                    <th>Rang</th>
                    <th>Composant</th>
                    <th>Impact</th>
                    <th>ROI</th>
                    <th>Cas Affectés</th>
                    <th>Actions Suggérées</th>
                </tr>
            </thead>
            <tbody>
                ${analysis.developmentPriorities.map(priority => `
                <tr>
                    <td>${priority.rank}</td>
                    <td>${priority.component}</td>
                    <td class="priority-${priority.impact}">${priority.impact.toUpperCase()}</td>
                    <td>${priority.roi.toFixed(1)}</td>
                    <td>${priority.affectedCases}</td>
                    <td>${priority.suggestedActions.slice(0, 2).join('; ')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>🔧 Analyse des Composants</h2>
        <table>
            <thead>
                <tr>
                    <th>Composant</th>
                    <th>Précision</th>
                    <th>Statut</th>
                    <th>Erreurs</th>
                    <th>Erreur Moyenne</th>
                </tr>
            </thead>
            <tbody>
                ${analysis.calculatorAnalysis.components.map(component => `
                <tr>
                    <td>${component.name}</td>
                    <td>${component.accuracy.toFixed(1)}%</td>
                    <td class="status-${component.status}">${component.status.replace('_', ' ').toUpperCase()}</td>
                    <td>${component.errorCount}</td>
                    <td>${component.averageError.toFixed(0)}$</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>📈 Statistiques Avancées</h2>
        <div>
            <div class="metric">
                <strong>Erreur Moyenne:</strong> ${analysis.advancedStats.errorDistribution.mean.toFixed(2)}$
            </div>
            <div class="metric">
                <strong>Médiane:</strong> ${analysis.advancedStats.errorDistribution.median.toFixed(2)}$
            </div>
            <div class="metric">
                <strong>Écart-type:</strong> ${analysis.advancedStats.errorDistribution.standardDeviation.toFixed(2)}$
            </div>
            <div class="metric">
                <strong>Qualité des Données:</strong> ${(analysis.advancedStats.performance.dataQualityScore * 100).toFixed(1)}%
            </div>
        </div>

        <h2>💡 Recommandations Détaillées</h2>
        ${analysis.detailedRecommendations.map(rec => `
        <div class="recommendation">
            <h3 class="priority-${rec.priority}">${rec.title}</h3>
            <p><strong>Catégorie:</strong> ${rec.category} | <strong>Priorité:</strong> ${rec.priority}</p>
            <p>${rec.description}</p>
            <p><strong>Impact Attendu:</strong> ${rec.expectedImpact}</p>
            <p><strong>Complexité:</strong> ${rec.implementationComplexity} | <strong>Temps Estimé:</strong> ${rec.estimatedTimeToImplement}</p>
        </div>
        `).join('')}
    </div>
</body>
</html>
    `
  }
}