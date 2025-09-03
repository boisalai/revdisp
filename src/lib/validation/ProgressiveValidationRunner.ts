/**
 * Script de validation progressive pour comparer systématiquement notre calculateur
 * avec le calculateur officiel du ministère des Finances du Québec
 * 
 * Progression: 10 → 100 → 1000+ cas de test avec analyse des écarts
 * et recommandations pour corrections prioritaires
 */

import { HighVolumeValidator, HighVolumeConfig } from './HighVolumeValidator'
import { MassTestGenerator } from './MassTestGenerator'
import { ValidationEngine } from './ValidationEngine'
import { OfficialValidationEngine, OfficialValidationReport } from './OfficialValidationEngine'
import { HouseholdType, Household } from '../models'
import * as fs from 'fs'
import * as path from 'path'

export interface ProgressiveValidationConfig {
  /** Année fiscale pour la validation */
  taxYear: number
  /** Répertoire de base pour tous les rapports */
  baseOutputDir: string
  /** Activer le mode verbose pour plus de logs */
  verbose?: boolean
}

export interface ProgressiveValidationSummary {
  phases: {
    phase1_10cases: ProgressivePhaseResult
    phase2_100cases: ProgressivePhaseResult
    phase3_1000cases: ProgressivePhaseResult
  }
  overallAnalysis: {
    criticalPrograms: string[]
    recommendedFixes: string[]
    accuracyTrend: number[]
    totalCasesProcessed: number
  }
}

export interface ProgressivePhaseResult {
  casesCount: number
  accuracy: number
  worstPrograms: Array<{
    program: string
    averageError: number
    errorRate: number
  }>
  criticalIssues: string[]
  processingTime: number
}

export class ProgressiveValidationRunner {
  private config: ProgressiveValidationConfig
  private validationEngine: ValidationEngine
  private officialValidationEngine: OfficialValidationEngine

  constructor(config: ProgressiveValidationConfig) {
    this.config = config
    this.validationEngine = new ValidationEngine(config.taxYear)
    this.officialValidationEngine = new OfficialValidationEngine(config.taxYear)
  }

  /**
   * Lance la validation progressive avec le calculateur officiel (RECOMMANDÉ)
   */
  async runOfficialProgressiveValidation(): Promise<ProgressiveValidationSummary> {
    console.log('🚀 VALIDATION PROGRESSIVE CONTRE CALCULATEUR OFFICIEL')
    console.log('====================================================')
    console.log(`📅 Année fiscale: ${this.config.taxYear}`)
    console.log(`🐍 Utilisation du scraper Python/Selenium`)
    console.log(`📁 Répertoire de sortie: ${this.config.baseOutputDir}`)
    console.log()

    // Créer le répertoire de base
    if (!fs.existsSync(this.config.baseOutputDir)) {
      fs.mkdirSync(this.config.baseOutputDir, { recursive: true })
    }

    // Initialiser les moteurs de validation
    await this.officialValidationEngine.initialize()

    const phases: Record<string, ProgressivePhaseResult> = {}

    try {
      // Phase 1: 10 cas représentatifs avec validation officielle
      console.log('🎯 PHASE 1: VALIDATION OFFICIELLE INITIALE (10 cas)')
      console.log('=================================================')
      phases.phase1_10cases = await this.runOfficialPhase(10, 'phase1-10cases-official')

      // Phase 2: 25 cas diversifiés (limite raisonnable pour scraping)
      console.log()
      console.log('🎯 PHASE 2: VALIDATION OFFICIELLE ÉTENDUE (25 cas)')
      console.log('================================================')
      phases.phase2_100cases = await this.runOfficialPhase(25, 'phase2-25cases-official')

      // Phase 3: Validation ciblée sur les programmes problématiques
      console.log()
      console.log('🎯 PHASE 3: VALIDATION CIBLÉE (cas critiques)')
      console.log('===========================================')
      phases.phase3_1000cases = await this.runTargetedOfficialPhase(phases, 'phase3-targeted-official')

      // Analyse globale et recommandations
      const summary = this.generateProgressiveSummary(phases)

      // Sauvegarder le résumé final
      await this.saveProgressiveSummary(summary)

      console.log()
      console.log('✅ VALIDATION PROGRESSIVE OFFICIELLE TERMINÉE')
      console.log('============================================')
      this.printFinalSummary(summary)

      return summary

    } catch (error) {
      console.error('❌ Erreur lors de la validation progressive officielle:', error)
      throw error
    }
  }

  /**
   * Lance la validation progressive complète (ancienne méthode)
   */
  async runProgressiveValidation(): Promise<ProgressiveValidationSummary> {
    console.log('🚀 DÉMARRAGE DE LA VALIDATION PROGRESSIVE')
    console.log('========================================')
    console.log(`📅 Année fiscale: ${this.config.taxYear}`)
    console.log(`📁 Répertoire de sortie: ${this.config.baseOutputDir}`)
    console.log()

    // Créer le répertoire de base
    if (!fs.existsSync(this.config.baseOutputDir)) {
      fs.mkdirSync(this.config.baseOutputDir, { recursive: true })
    }

    // Initialiser les moteurs de validation
    await this.validationEngine.initialize()
    await this.officialValidationEngine.initialize()

    const phases: Record<string, ProgressivePhaseResult> = {}

    try {
      // Phase 1: 10 cas représentatifs
      console.log('🎯 PHASE 1: VALIDATION INITIALE (10 cas)')
      console.log('=======================================')
      phases.phase1_10cases = await this.runPhase(10, 'systematic', 'phase1-10cases')

      // Analyser les résultats de la phase 1
      if (phases.phase1_10cases.accuracy < 80) {
        console.log('⚠️  Précision insuffisante détectée. Analyse approfondie requise avant phase 2.')
        await this.generateDetailedAnalysis(phases.phase1_10cases, 'phase1-detailed-analysis')
      }

      // Phase 2: 100 cas diversifiés
      console.log()
      console.log('🎯 PHASE 2: VALIDATION ÉTENDUE (100 cas)')
      console.log('========================================')
      phases.phase2_100cases = await this.runPhase(100, 'grid', 'phase2-100cases')

      // Phase 3: 1000+ cas avec Monte Carlo
      console.log()
      console.log('🎯 PHASE 3: VALIDATION MASSIVE (1000+ cas)')
      console.log('==========================================')
      phases.phase3_1000cases = await this.runPhase(1000, 'monte_carlo', 'phase3-1000cases')

      // Analyse globale et recommandations
      const summary = this.generateProgressiveSummary(phases)

      // Sauvegarder le résumé final
      await this.saveProgressiveSummary(summary)

      console.log()
      console.log('✅ VALIDATION PROGRESSIVE TERMINÉE')
      console.log('==================================')
      this.printFinalSummary(summary)

      return summary

    } catch (error) {
      console.error('❌ Erreur lors de la validation progressive:', error)
      throw error
    }
  }

  /**
   * Exécute une phase de validation officielle
   */
  private async runOfficialPhase(
    casesCount: number,
    phaseName: string
  ): Promise<ProgressivePhaseResult> {
    const startTime = Date.now()
    const phaseDir = path.join(this.config.baseOutputDir, phaseName)

    console.log(`📊 Génération de ${casesCount} cas de test représentatifs...`)

    // Générer des ménages types représentatifs
    const households = this.generateRepresentativeHouseholds(casesCount)
    
    console.log(`🌐 Validation contre calculateur officiel (${households.length} cas)...`)
    
    // Valider contre le calculateur officiel
    const officialReport = await this.officialValidationEngine.validateAgainstOfficialCalculator(households)
    
    // Sauvegarder le rapport officiel
    if (!fs.existsSync(phaseDir)) {
      fs.mkdirSync(phaseDir, { recursive: true })
    }
    
    const reportPath = path.join(phaseDir, 'official-validation-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(officialReport, null, 2))
    console.log(`📊 Rapport officiel sauvé: ${reportPath}`)

    const processingTime = Date.now() - startTime

    // Convertir le rapport officiel vers le format ProgressivePhaseResult
    const phaseResult: ProgressivePhaseResult = {
      casesCount: households.length,
      accuracy: officialReport.summary.overallAccuracy,
      worstPrograms: this.convertToWorstPrograms(officialReport),
      criticalIssues: this.identifyOfficialCriticalIssues(officialReport),
      processingTime
    }

    console.log(`✅ Phase officielle terminée en ${(processingTime / 1000).toFixed(1)}s`)
    console.log(`📊 Précision globale: ${phaseResult.accuracy.toFixed(1)}%`)
    console.log(`⚠️ Programmes problématiques: ${phaseResult.worstPrograms.length}`)
    console.log(`🚨 Issues critiques: ${phaseResult.criticalIssues.length}`)

    return phaseResult
  }

  /**
   * Exécute une phase ciblée sur les programmes problématiques identifiés
   */
  private async runTargetedOfficialPhase(
    previousPhases: Record<string, ProgressivePhaseResult>,
    phaseName: string
  ): Promise<ProgressivePhaseResult> {
    const startTime = Date.now()
    
    // Identifier les programmes problématiques des phases précédentes
    const allWorstPrograms = [
      ...(previousPhases.phase1_10cases?.worstPrograms || []),
      ...(previousPhases.phase2_100cases?.worstPrograms || [])
    ]
    
    // Générer des cas spécifiquement pour tester ces programmes
    const targetedHouseholds = this.generateTargetedHouseholds(allWorstPrograms, 15)
    
    console.log(`🎯 Génération de ${targetedHouseholds.length} cas ciblés pour programmes problématiques`)
    const uniquePrograms = Array.from(new Set(allWorstPrograms.map(p => p.program)))
    console.log(`📋 Programmes ciblés: ${uniquePrograms.join(', ')}`)
    
    // Valider ces cas ciblés
    const officialReport = await this.officialValidationEngine.validateAgainstOfficialCalculator(targetedHouseholds)
    
    // Sauvegarder le rapport
    const phaseDir = path.join(this.config.baseOutputDir, phaseName)
    if (!fs.existsSync(phaseDir)) {
      fs.mkdirSync(phaseDir, { recursive: true })
    }
    
    const reportPath = path.join(phaseDir, 'targeted-validation-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(officialReport, null, 2))
    
    const processingTime = Date.now() - startTime

    const phaseResult: ProgressivePhaseResult = {
      casesCount: targetedHouseholds.length,
      accuracy: officialReport.summary.overallAccuracy,
      worstPrograms: this.convertToWorstPrograms(officialReport),
      criticalIssues: this.identifyOfficialCriticalIssues(officialReport),
      processingTime
    }

    console.log(`✅ Phase ciblée terminée en ${(processingTime / 1000).toFixed(1)}s`)
    console.log(`📊 Précision ciblée: ${phaseResult.accuracy.toFixed(1)}%`)

    return phaseResult
  }

  /**
   * Génère des ménages représentatifs pour la validation
   */
  private generateRepresentativeHouseholds(count: number): Household[] {
    const households: Household[] = []
    const generator = new MassTestGenerator({ taxYear: this.config.taxYear })
    
    // Distribution représentative du Québec
    const distribution = [
      { type: HouseholdType.SINGLE, ratio: 0.30 },
      { type: HouseholdType.COUPLE, ratio: 0.35 },
      { type: HouseholdType.SINGLE_PARENT, ratio: 0.15 },
      { type: HouseholdType.RETIRED_SINGLE, ratio: 0.10 },
      { type: HouseholdType.RETIRED_COUPLE, ratio: 0.10 }
    ]
    
    distribution.forEach(dist => {
      const typeCount = Math.round(count * dist.ratio)
      for (let i = 0; i < typeCount; i++) {
        const household = generator.generateHousehold(dist.type)
        households.push(household)
      }
    })
    
    return households.slice(0, count)
  }

  /**
   * Génère des cas ciblés pour tester des programmes spécifiques
   */
  private generateTargetedHouseholds(
    worstPrograms: Array<{ program: string, averageError: number }>, 
    count: number
  ): Household[] {
    const households: Household[] = []
    const generator = new MassTestGenerator({ taxYear: this.config.taxYear })
    
    // Générer des cas qui sollicitent les programmes problématiques
    const programTypes: { [program: string]: HouseholdType[] } = {
      'assuranceEmploi': [HouseholdType.SINGLE, HouseholdType.COUPLE, HouseholdType.SINGLE_PARENT],
      'rrq': [HouseholdType.SINGLE, HouseholdType.COUPLE],
      'rqap': [HouseholdType.SINGLE, HouseholdType.COUPLE, HouseholdType.SINGLE_PARENT],
      'creditSolidarite': [HouseholdType.SINGLE, HouseholdType.SINGLE_PARENT],
      'primeTravail': [HouseholdType.SINGLE, HouseholdType.COUPLE, HouseholdType.SINGLE_PARENT]
    }
    
    worstPrograms.forEach(wp => {
      const types = programTypes[wp.program] || [HouseholdType.SINGLE]
      types.forEach(type => {
        if (households.length < count) {
          const household = generator.generateHousehold(type)
          households.push(household)
        }
      })
    })
    
    // Compléter avec des cas variés si nécessaire
    while (households.length < count) {
      const household = generator.generateHousehold(HouseholdType.SINGLE)
      households.push(household)
    }
    
    return households.slice(0, count)
  }

  /**
   * Convertit l'analyse des programmes officiels vers le format WorstPrograms
   */
  private convertToWorstPrograms(officialReport: OfficialValidationReport): Array<{
    program: string
    averageError: number
    errorRate: number
  }> {
    return officialReport.programAnalysis
      .filter(p => p.averageAccuracy < 90 || p.criticalErrorCount > 0)
      .map(p => ({
        program: p.program.toLowerCase().replace(/[^a-z0-9]/g, ''),
        averageError: 100 - p.averageAccuracy,
        errorRate: p.testCount > 0 ? (p.criticalErrorCount / p.testCount) * 100 : 0
      }))
      .sort((a, b) => b.averageError - a.averageError)
  }

  /**
   * Identifie les issues critiques depuis le rapport officiel
   */
  private identifyOfficialCriticalIssues(officialReport: OfficialValidationReport): string[] {
    const issues: string[] = []

    // Analyser la performance globale
    if (officialReport.summary.overallAccuracy < 70) {
      issues.push('Précision globale critique (<70%) - révision majeure requise')
    }

    if (officialReport.summary.critical > officialReport.summary.totalTests * 0.3) {
      issues.push('Plus de 30% de cas critiques - problèmes systémiques détectés')
    }

    if (officialReport.summary.errors > 0) {
      issues.push(`${officialReport.summary.errors} erreurs de scraping - vérifier connectivité`)
    }

    // Analyser les programmes critiques
    const criticalPrograms = officialReport.programAnalysis.filter(p => 
      p.averageAccuracy < 80 || p.criticalErrorCount > 0
    )
    
    if (criticalPrograms.length > 0) {
      issues.push(`Programmes critiques détectés: ${criticalPrograms.map(p => p.program).join(', ')}`)
    }

    return issues
  }

  /**
   * Exécute une phase de validation avec un nombre de cas spécifique
   */
  private async runPhase(
    casesCount: number, 
    strategy: 'systematic' | 'random' | 'grid' | 'monte_carlo',
    phaseName: string
  ): Promise<ProgressivePhaseResult> {
    const startTime = Date.now()
    const phaseDir = path.join(this.config.baseOutputDir, phaseName)

    console.log(`📊 Génération de ${casesCount} cas de test (stratégie: ${strategy})...`)

    // Configuration pour cette phase
    const highVolumeConfig: HighVolumeConfig = {
      generator: {
        totalCases: casesCount,
        taxYear: this.config.taxYear,
        // Distribution représentative du Québec
        householdDistribution: {
          single: 30,
          couple: 35,
          singleParent: 15,
          retiredSingle: 10,
          retiredCouple: 10
        },
        incomeRanges: {
          min: 15000,
          max: 150000,
          step: 5000
        }
      },
      generationStrategy: { type: strategy },
      scraping: {
        parallelBrowsers: Math.min(4, Math.ceil(casesCount / 50)), // Ajuster selon le volume
        batchDelay: casesCount > 100 ? 2000 : 1000, // Plus de délai pour gros volumes
        batchSize: Math.min(20, Math.ceil(casesCount / 10)),
        headless: true,
        timeout: 30000,
        retries: 2
      },
      reporting: {
        outputDir: phaseDir,
        saveIntermediate: true,
        checkpointFrequency: Math.max(1, Math.floor(casesCount / 100))
      }
    }

    // Lancer la validation haute performance
    const validator = new HighVolumeValidator(highVolumeConfig)
    const validationReport = await validator.runHighVolumeValidation()

    const processingTime = Date.now() - startTime

    // Analyser les résultats de la phase
    const phaseResult: ProgressivePhaseResult = {
      casesCount,
      accuracy: validationReport.summary.averageAccuracy,
      worstPrograms: this.identifyWorstPrograms(validationReport),
      criticalIssues: this.identifyCriticalIssues(validationReport),
      processingTime
    }

    console.log(`✅ Phase terminée en ${(processingTime / 1000).toFixed(1)}s`)
    console.log(`📊 Précision globale: ${phaseResult.accuracy.toFixed(1)}%`)
    console.log(`⚠️  Programmes problématiques: ${phaseResult.worstPrograms.length}`)
    console.log(`🚨 Issues critiques: ${phaseResult.criticalIssues.length}`)

    return phaseResult
  }

  /**
   * Identifie les programmes avec les pires performances
   */
  private identifyWorstPrograms(validationReport: any): Array<{
    program: string
    averageError: number
    errorRate: number
  }> {
    // Analyser les différences par programme (à adapter selon la structure réelle du rapport)
    const programErrors: Record<string, { totalError: number, count: number, failures: number }> = {}

    // Simuler l'analyse - à ajuster avec la vraie structure des données
    const programNames = [
      'assuranceEmploi', 'rrq', 'rqap', 'fss', 'ramq',
      'impotRevenuQuebec', 'impotRevenuFederal',
      'creditSolidarite', 'primeTravail', 'allocationFamiliale',
      'allocationCanadienneEnfants', 'creditTPS'
    ]

    for (const program of programNames) {
      programErrors[program] = { totalError: 0, count: 0, failures: 0 }
    }

    // Retourner les 5 pires programmes
    return Object.entries(programErrors)
      .map(([program, stats]) => ({
        program,
        averageError: stats.count > 0 ? stats.totalError / stats.count : 0,
        errorRate: stats.count > 0 ? (stats.failures / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.averageError - a.averageError)
      .slice(0, 5)
  }

  /**
   * Identifie les issues critiques nécessitant correction immédiate
   */
  private identifyCriticalIssues(validationReport: any): string[] {
    const issues: string[] = []

    // Analyser les patterns d'erreurs critiques
    if (validationReport.summary.averageAccuracy < 70) {
      issues.push('Précision globale insuffisante (<70%) - révision majeure requise')
    }

    if (validationReport.summary.failed / validationReport.summary.totalTests > 0.3) {
      issues.push('Taux d\'échec élevé (>30%) - problèmes systémiques détectés')
    }

    // Ajouter d'autres analyses critiques selon les patterns détectés

    return issues
  }

  /**
   * Génère une analyse détaillée pour investigation approfondie
   */
  private async generateDetailedAnalysis(phaseResult: ProgressivePhaseResult, filename: string): Promise<void> {
    const analysis = {
      summary: phaseResult,
      detailedRecommendations: [
        '1. Vérifier les paramètres fiscaux pour l\'année ' + this.config.taxYear,
        '2. Valider les calculs des cotisations sociales (RRQ, AE, RQAP)',
        '3. Contrôler les seuils et taux d\'imposition',
        '4. Examiner la logique des crédits et allocations',
        '5. Tester les cas limites et transitions de paliers'
      ],
      nextSteps: [
        'Corriger les programmes identifiés comme problématiques',
        'Exécuter des tests unitaires ciblés',
        'Valider avec des cas de référence officiels',
        'Procéder à la phase suivante si précision >80%'
      ]
    }

    const analysisPath = path.join(this.config.baseOutputDir, `${filename}.json`)
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2))
    console.log(`📋 Analyse détaillée sauvée: ${analysisPath}`)
  }

  /**
   * Génère le résumé progressif complet
   */
  private generateProgressiveSummary(phases: Record<string, ProgressivePhaseResult>): ProgressiveValidationSummary {
    const accuracyTrend = [
      phases.phase1_10cases?.accuracy || 0,
      phases.phase2_100cases?.accuracy || 0,
      phases.phase3_1000cases?.accuracy || 0
    ]

    // Identifier les programmes critiques récurrents
    const allWorstPrograms = [
      ...(phases.phase1_10cases?.worstPrograms || []),
      ...(phases.phase2_100cases?.worstPrograms || []),
      ...(phases.phase3_1000cases?.worstPrograms || [])
    ]

    const programCounts = allWorstPrograms.reduce((acc, prog) => {
      acc[prog.program] = (acc[prog.program] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const criticalPrograms = Object.entries(programCounts)
      .filter(([, count]) => count >= 2) // Apparaît dans au moins 2 phases
      .map(([program]) => program)

    // Générer les recommandations basées sur les tendances
    const recommendedFixes = this.generateRecommendations(phases, criticalPrograms, accuracyTrend)

    return {
      phases: phases as any,
      overallAnalysis: {
        criticalPrograms,
        recommendedFixes,
        accuracyTrend,
        totalCasesProcessed: Object.values(phases).reduce((total, phase) => total + phase.casesCount, 0)
      }
    }
  }

  /**
   * Génère des recommandations intelligentes basées sur l'analyse
   */
  private generateRecommendations(
    phases: Record<string, ProgressivePhaseResult>,
    criticalPrograms: string[],
    accuracyTrend: number[]
  ): string[] {
    const recommendations: string[] = []

    // Analyser la tendance de précision
    if (accuracyTrend[2] < accuracyTrend[1] && accuracyTrend[1] < accuracyTrend[0]) {
      recommendations.push('🔴 URGENT: Précision en décroissance constante - révision architecturale nécessaire')
    } else if (accuracyTrend[2] > accuracyTrend[0]) {
      recommendations.push('✅ Tendance positive détectée - continuer l\'amélioration progressive')
    }

    // Recommandations par programme critique
    criticalPrograms.forEach(program => {
      switch (program) {
        case 'assuranceEmploi':
          recommendations.push('🔧 Corriger le calculateur d\'assurance-emploi: vérifier les seuils maximums et taux')
          break
        case 'rrq':
          recommendations.push('🔧 Ajuster les calculs RRQ: valider les cotisations de base et additionnelles')
          break
        case 'impotRevenuQuebec':
          recommendations.push('🔧 Réviser l\'impôt Québec: contrôler les paliers et crédits personnels')
          break
        case 'creditSolidarite':
          recommendations.push('🔧 Affiner le crédit de solidarité: examiner les seuils familiaux')
          break
        default:
          recommendations.push(`🔧 Analyser le programme ${program}: écarts systématiques détectés`)
      }
    })

    // Recommandations globales
    const overallAccuracy = accuracyTrend[accuracyTrend.length - 1]
    if (overallAccuracy < 85) {
      recommendations.push('📚 Organiser une revue complète avec les références officielles du MFQ')
      recommendations.push('🧪 Implémenter des tests unitaires pour chaque programme problématique')
    }

    if (overallAccuracy >= 95) {
      recommendations.push('🎉 Précision excellente - système prêt pour production!')
      recommendations.push('🔄 Planifier validation continue avec mise à jour automatique des paramètres')
    }

    return recommendations
  }

  /**
   * Sauvegarde le résumé progressif final
   */
  private async saveProgressiveSummary(summary: ProgressiveValidationSummary): Promise<void> {
    const summaryPath = path.join(this.config.baseOutputDir, 'progressive-validation-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

    // Générer aussi un rapport HTML lisible
    const htmlReport = this.generateHtmlReport(summary)
    const htmlPath = path.join(this.config.baseOutputDir, 'progressive-validation-report.html')
    fs.writeFileSync(htmlPath, htmlReport)

    console.log(`📊 Résumé progressif sauvé: ${summaryPath}`)
    console.log(`🌐 Rapport HTML généré: ${htmlPath}`)
  }

  /**
   * Génère un rapport HTML lisible
   */
  private generateHtmlReport(summary: ProgressiveValidationSummary): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Validation Progressive - RevDisp ${this.config.taxYear}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
        .phase { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0066cc; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #0066cc; }
        .metric-label { font-size: 0.9em; color: #666; }
        .critical { color: #cc0000; }
        .warning { color: #ff6600; }
        .success { color: #009900; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .programs-list { display: flex; flex-wrap: wrap; }
        .program-item { background: #ffebee; padding: 8px 12px; margin: 4px; border-radius: 4px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧮 Rapport de Validation Progressive</h1>
            <h2>Calculateur RevDisp - Année Fiscale ${this.config.taxYear}</h2>
            <p><strong>Total des cas traités:</strong> ${summary.overallAnalysis.totalCasesProcessed.toLocaleString()}</p>
        </div>

        <div class="phase">
            <h3>📊 Résumé des Phases</h3>
            <div class="metric">
                <div class="metric-value ${summary.phases.phase1_10cases.accuracy >= 80 ? 'success' : 'critical'}">${summary.phases.phase1_10cases.accuracy.toFixed(1)}%</div>
                <div class="metric-label">Phase 1 (10 cas)</div>
            </div>
            <div class="metric">
                <div class="metric-value ${summary.phases.phase2_100cases.accuracy >= 85 ? 'success' : 'warning'}">${summary.phases.phase2_100cases.accuracy.toFixed(1)}%</div>
                <div class="metric-label">Phase 2 (100 cas)</div>
            </div>
            <div class="metric">
                <div class="metric-value ${summary.phases.phase3_1000cases.accuracy >= 90 ? 'success' : 'warning'}">${summary.phases.phase3_1000cases.accuracy.toFixed(1)}%</div>
                <div class="metric-label">Phase 3 (1000+ cas)</div>
            </div>
        </div>

        <div class="phase">
            <h3>🚨 Programmes Critiques</h3>
            <div class="programs-list">
                ${summary.overallAnalysis.criticalPrograms.map(program => 
                  `<div class="program-item">${program}</div>`
                ).join('')}
            </div>
            ${summary.overallAnalysis.criticalPrograms.length === 0 ? 
              '<p class="success">✅ Aucun programme critique détecté - excellente performance!</p>' : ''
            }
        </div>

        <div class="recommendations">
            <h3>💡 Recommandations Prioritaires</h3>
            <ul>
                ${summary.overallAnalysis.recommendedFixes.map(fix => `<li>${fix}</li>`).join('')}
            </ul>
        </div>

        <div class="phase">
            <h3>📈 Tendance de Précision</h3>
            <p>Évolution: ${summary.overallAnalysis.accuracyTrend.map((acc, i) => 
              `Phase ${i+1}: ${acc.toFixed(1)}%`
            ).join(' → ')}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
            <p>Rapport généré le ${new Date().toLocaleString('fr-CA')} par RevDisp Validation System</p>
        </div>
    </div>
</body>
</html>
    `
  }

  /**
   * Affiche le résumé final dans la console
   */
  private printFinalSummary(summary: ProgressiveValidationSummary): void {
    console.log()
    console.log('📊 RÉSUMÉ FINAL DE LA VALIDATION PROGRESSIVE')
    console.log('==========================================')
    console.log()
    console.log(`📈 Évolution de la précision:`)
    console.log(`   Phase 1 (10 cas):    ${summary.phases.phase1_10cases.accuracy.toFixed(1)}%`)
    console.log(`   Phase 2 (100 cas):   ${summary.phases.phase2_100cases.accuracy.toFixed(1)}%`)
    console.log(`   Phase 3 (1000+ cas): ${summary.phases.phase3_1000cases.accuracy.toFixed(1)}%`)
    console.log()
    console.log(`🚨 Programmes nécessitant attention: ${summary.overallAnalysis.criticalPrograms.length}`)
    if (summary.overallAnalysis.criticalPrograms.length > 0) {
      summary.overallAnalysis.criticalPrograms.forEach(program => {
        console.log(`   • ${program}`)
      })
    }
    console.log()
    console.log(`💡 Recommandations principales:`)
    summary.overallAnalysis.recommendedFixes.slice(0, 3).forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec.replace(/🔧|🔴|✅|📚|🧪|🎉|🔄/g, '')}`)
    })
    console.log()
    const finalAccuracy = summary.overallAnalysis.accuracyTrend[summary.overallAnalysis.accuracyTrend.length - 1]
    if (finalAccuracy >= 95) {
      console.log('🎉 SUCCÈS: Système validé avec excellente précision!')
    } else if (finalAccuracy >= 85) {
      console.log('✅ ACCEPTABLE: Performance satisfaisante, améliorations possibles')
    } else {
      console.log('⚠️  ATTENTION: Corrections requises avant production')
    }
  }
}

/**
 * Fonction utilitaire pour lancer rapidement une validation progressive officielle (RECOMMANDÉ)
 */
export async function runQuickOfficialValidation(taxYear: number = 2024): Promise<void> {
  const config: ProgressiveValidationConfig = {
    taxYear,
    baseOutputDir: `./validation-reports/official-progressive-${taxYear}-${Date.now()}`,
    verbose: true
  }

  const runner = new ProgressiveValidationRunner(config)
  await runner.runOfficialProgressiveValidation()
}

/**
 * Fonction utilitaire pour lancer rapidement une validation progressive (ancienne méthode)
 */
export async function runQuickProgressiveValidation(taxYear: number = 2024): Promise<void> {
  const config: ProgressiveValidationConfig = {
    taxYear,
    baseOutputDir: `./validation-reports/progressive-${taxYear}-${Date.now()}`,
    verbose: true
  }

  const runner = new ProgressiveValidationRunner(config)
  await runner.runProgressiveValidation()
}