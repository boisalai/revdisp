/**
 * Système de validation en continu avec suivi des progrès
 * Permet de valider automatiquement et de suivre l'évolution de la précision
 */

import { HighVolumeValidator, HighVolumeConfig } from './HighVolumeValidator'
import { AdvancedReportingEngine, AdvancedAnalysis } from './AdvancedReporting'
import { ValidationResult, ValidationReport } from './ValidationEngine'
import * as fs from 'fs'
import * as path from 'path'
import { EventEmitter } from 'events'

export interface ContinuousValidationConfig {
  /** Configuration de validation haute performance */
  highVolumeConfig: HighVolumeConfig
  /** Fréquence de validation (en ms) */
  validationInterval: number
  /** Conditions de déclenchement automatique */
  triggers: {
    /** Déclencher sur changement de code */
    onCodeChange: boolean
    /** Déclencher à intervalle fixe */
    onSchedule: boolean
    /** Déclencher sur seuil de régression */
    onRegressionThreshold: number // % de baisse d'accuracy
  }
  /** Configuration du suivi de progrès */
  progressTracking: {
    /** Historique à conserver (nombre de runs) */
    historyLength: number
    /** Métriques à suivre */
    trackedMetrics: string[]
    /** Alertes */
    alerts: {
      accuracyThreshold: number
      regressionThreshold: number
      errorThreshold: number
    }
  }
}

export interface ValidationRun {
  id: string
  timestamp: Date
  trigger: 'manual' | 'scheduled' | 'code_change' | 'regression'
  config: HighVolumeConfig
  results: ValidationResult[]
  report: ValidationReport
  advancedAnalysis: AdvancedAnalysis
  metrics: ValidationMetrics
  duration: number
  status: 'success' | 'failed' | 'partial'
}

export interface ValidationMetrics {
  totalCases: number
  accuracy: number
  successRate: number
  averageError: number
  regressionFromLast?: number
  improvementAreas: string[]
  criticalIssues: string[]
}

export interface ProgressSnapshot {
  timestamp: Date
  runId: string
  accuracy: number
  successRate: number
  componentScores: Record<string, number>
  trends: {
    accuracy: 'improving' | 'stable' | 'declining'
    errorRate: 'improving' | 'stable' | 'declining'
  }
}

export class ContinuousValidationSystem extends EventEmitter {
  private config: ContinuousValidationConfig
  private validator: HighVolumeValidator
  private isRunning = false
  private intervalId?: NodeJS.Timeout
  private runHistory: ValidationRun[] = []
  private progressHistory: ProgressSnapshot[] = []
  private lastRunMetrics?: ValidationMetrics

  constructor(config: ContinuousValidationConfig) {
    super()
    this.config = config
    this.validator = new HighVolumeValidator(config.highVolumeConfig)
    this.loadHistoryFromDisk()
  }

  /**
   * Démarre le système de validation en continu
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Le système de validation est déjà en cours d\'exécution')
      return
    }

    console.log('🚀 Démarrage du système de validation en continu...')
    this.isRunning = true

    // Validation initiale
    await this.runValidation('manual')

    // Configuration de la validation programmée
    if (this.config.triggers.onSchedule) {
      this.intervalId = setInterval(async () => {
        await this.runValidation('scheduled')
      }, this.config.validationInterval)
    }

    // TODO: Configuration de l'écoute des changements de code
    if (this.config.triggers.onCodeChange) {
      this.setupCodeChangeWatcher()
    }

    this.emit('started')
    console.log('✅ Système de validation en continu démarré')
  }

  /**
   * Arrête le système de validation en continu
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return

    console.log('🛑 Arrêt du système de validation en continu...')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    // Sauvegarder l'historique
    await this.saveHistoryToDisk()

    this.emit('stopped')
    console.log('✅ Système de validation en continu arrêté')
  }

  /**
   * Lance une validation manuelle
   */
  async runValidation(
    trigger: 'manual' | 'scheduled' | 'code_change' | 'regression' = 'manual'
  ): Promise<ValidationRun> {
    const runId = `validation-${Date.now()}`
    const startTime = Date.now()

    console.log(`🔄 Démarrage de la validation ${runId} (trigger: ${trigger})`)
    this.emit('validation_started', { runId, trigger })

    try {
      // Exécuter la validation haute performance
      const report = await this.validator.runHighVolumeValidation()
      
      // Générer l'analyse avancée
      const results = this.extractResultsFromReport(report)
      const advancedAnalysis = AdvancedReportingEngine.generateAdvancedAnalysis(results)
      
      // Calculer les métriques
      const metrics = this.calculateMetrics(results, report)
      
      // Détecter les régressions
      const hasRegression = this.detectRegression(metrics)
      
      // Créer le run
      const validationRun: ValidationRun = {
        id: runId,
        timestamp: new Date(),
        trigger,
        config: this.config.highVolumeConfig,
        results,
        report,
        advancedAnalysis,
        metrics,
        duration: Date.now() - startTime,
        status: 'success'
      }

      // Ajouter à l'historique
      this.addRunToHistory(validationRun)
      
      // Créer un snapshot de progrès
      this.createProgressSnapshot(validationRun)
      
      // Sauvegarder les résultats
      await this.saveValidationRun(validationRun)
      
      // Vérifier les alertes
      await this.checkAlerts(validationRun)
      
      // Déclencher une validation de régression si nécessaire
      if (hasRegression && trigger !== 'regression') {
        console.log('⚠️  Régression détectée, déclenchement d\'une validation de régression...')
        setTimeout(() => this.runValidation('regression'), 5000)
      }

      this.emit('validation_completed', validationRun)
      console.log(`✅ Validation ${runId} terminée avec succès`)
      
      return validationRun

    } catch (error) {
      const failedRun: ValidationRun = {
        id: runId,
        timestamp: new Date(),
        trigger,
        config: this.config.highVolumeConfig,
        results: [],
        report: { summary: { totalTests: 0, passed: 0, failed: 0, errors: 0, averageAccuracy: 0 }, worstCases: [], criticalDifferences: [], recommendations: [] },
        advancedAnalysis: {} as AdvancedAnalysis,
        metrics: { totalCases: 0, accuracy: 0, successRate: 0, averageError: 0, improvementAreas: [], criticalIssues: [] },
        duration: Date.now() - startTime,
        status: 'failed'
      }

      this.emit('validation_failed', { runId, error })
      console.error(`❌ Validation ${runId} échouée:`, error)
      
      return failedRun
    }
  }

  /**
   * Extrait les résultats du rapport de validation
   */
  private extractResultsFromReport(report: ValidationReport): ValidationResult[] {
    // Cette méthode dépend de l'implémentation du rapport
    // Pour l'instant, retourner un tableau vide
    // TODO: Implémenter l'extraction des résultats détaillés
    return []
  }

  /**
   * Calcule les métriques de validation
   */
  private calculateMetrics(results: ValidationResult[], report: ValidationReport): ValidationMetrics {
    const totalCases = report.summary.totalTests
    const accuracy = report.summary.averageAccuracy
    const successRate = (report.summary.passed / totalCases) * 100
    
    // Calculer l'erreur moyenne
    const averageError = results.length > 0
      ? results.reduce((sum, result) => sum + result.totalAbsoluteDifference, 0) / results.length
      : 0

    // Calculer la régression par rapport au dernier run
    const regressionFromLast = this.lastRunMetrics
      ? accuracy - this.lastRunMetrics.accuracy
      : undefined

    // Identifier les domaines d'amélioration
    const improvementAreas = report.criticalDifferences
      .slice(0, 5)
      .map(diff => diff.field)

    // Identifier les problèmes critiques
    const criticalIssues = report.recommendations
      .filter(rec => rec.includes('critique') || rec.includes('urgent'))
      .slice(0, 3)

    const metrics: ValidationMetrics = {
      totalCases,
      accuracy,
      successRate,
      averageError,
      regressionFromLast,
      improvementAreas,
      criticalIssues
    }

    this.lastRunMetrics = metrics
    return metrics
  }

  /**
   * Détecte les régressions de performance
   */
  private detectRegression(metrics: ValidationMetrics): boolean {
    if (!metrics.regressionFromLast) return false
    
    const regressionThreshold = this.config.triggers.onRegressionThreshold
    return metrics.regressionFromLast < -regressionThreshold
  }

  /**
   * Ajoute un run à l'historique
   */
  private addRunToHistory(run: ValidationRun): void {
    this.runHistory.push(run)
    
    // Limiter la taille de l'historique
    if (this.runHistory.length > this.config.progressTracking.historyLength) {
      this.runHistory = this.runHistory.slice(-this.config.progressTracking.historyLength)
    }
  }

  /**
   * Crée un snapshot de progrès
   */
  private createProgressSnapshot(run: ValidationRun): void {
    const componentScores: Record<string, number> = {}
    
    // Extraire les scores par composant
    run.advancedAnalysis.calculatorAnalysis?.components.forEach(component => {
      componentScores[component.name] = component.accuracy
    })

    // Calculer les tendances
    const trends = this.calculateTrends(run.metrics)

    const snapshot: ProgressSnapshot = {
      timestamp: run.timestamp,
      runId: run.id,
      accuracy: run.metrics.accuracy,
      successRate: run.metrics.successRate,
      componentScores,
      trends
    }

    this.progressHistory.push(snapshot)
    
    // Limiter la taille de l'historique de progrès
    if (this.progressHistory.length > this.config.progressTracking.historyLength) {
      this.progressHistory = this.progressHistory.slice(-this.config.progressTracking.historyLength)
    }
  }

  /**
   * Calcule les tendances de progrès
   */
  private calculateTrends(currentMetrics: ValidationMetrics): {
    accuracy: 'improving' | 'stable' | 'declining'
    errorRate: 'improving' | 'stable' | 'declining'
  } {
    if (this.progressHistory.length < 2) {
      return { accuracy: 'stable', errorRate: 'stable' }
    }

    const recentSnapshots = this.progressHistory.slice(-3)
    const accuracyTrend = this.calculateTrend(recentSnapshots.map(s => s.accuracy))
    const errorRateTrend = this.calculateTrend(recentSnapshots.map(s => 100 - s.successRate))

    return {
      accuracy: accuracyTrend,
      errorRate: errorRateTrend
    }
  }

  /**
   * Calcule la tendance d'une série de valeurs
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const difference = secondAvg - firstAvg
    
    if (Math.abs(difference) < 0.5) return 'stable'
    return difference > 0 ? 'improving' : 'declining'
  }

  /**
   * Sauvegarde un run de validation
   */
  private async saveValidationRun(run: ValidationRun): Promise<void> {
    const outputDir = this.config.highVolumeConfig.reporting.outputDir
    const runDir = path.join(outputDir, 'continuous-validation', run.id)
    
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true })
    }

    // Sauvegarder le run complet
    fs.writeFileSync(
      path.join(runDir, 'validation-run.json'),
      JSON.stringify(run, null, 2)
    )

    // Sauvegarder l'analyse avancée
    AdvancedReportingEngine.saveAdvancedAnalysis(
      run.advancedAnalysis,
      path.join(runDir, 'advanced-analysis.json')
    )

    // Générer le rapport HTML
    AdvancedReportingEngine.generateHTMLReport(
      run.advancedAnalysis,
      path.join(runDir, 'report.html')
    )

    console.log(`💾 Run de validation sauvé: ${runDir}`)
  }

  /**
   * Vérifie les alertes et notifie si nécessaire
   */
  private async checkAlerts(run: ValidationRun): Promise<void> {
    const alerts = this.config.progressTracking.alerts
    const metrics = run.metrics

    // Alerte sur la précision
    if (metrics.accuracy < alerts.accuracyThreshold) {
      this.emit('alert', {
        type: 'accuracy',
        severity: 'high',
        message: `Précision faible: ${metrics.accuracy.toFixed(1)}% (seuil: ${alerts.accuracyThreshold}%)`,
        runId: run.id
      })
    }

    // Alerte sur la régression
    if (metrics.regressionFromLast && Math.abs(metrics.regressionFromLast) > alerts.regressionThreshold) {
      this.emit('alert', {
        type: 'regression',
        severity: metrics.regressionFromLast < 0 ? 'high' : 'info',
        message: `Changement significatif: ${metrics.regressionFromLast > 0 ? '+' : ''}${metrics.regressionFromLast.toFixed(1)}%`,
        runId: run.id
      })
    }

    // Alerte sur les erreurs
    const errorRate = (run.report.summary.errors / run.report.summary.totalTests) * 100
    if (errorRate > alerts.errorThreshold) {
      this.emit('alert', {
        type: 'errors',
        severity: 'medium',
        message: `Taux d'erreur élevé: ${errorRate.toFixed(1)}% (seuil: ${alerts.errorThreshold}%)`,
        runId: run.id
      })
    }
  }

  /**
   * Configuration de l'écoute des changements de code
   */
  private setupCodeChangeWatcher(): void {
    // TODO: Implémenter avec fs.watch ou chokidar
    console.log('🔍 Configuration de l\'écoute des changements de code...')
    // Pour l'instant, juste un placeholder
  }

  /**
   * Charge l'historique depuis le disque
   */
  private loadHistoryFromDisk(): void {
    const historyPath = path.join(
      this.config.highVolumeConfig.reporting.outputDir,
      'continuous-validation',
      'history.json'
    )

    try {
      if (fs.existsSync(historyPath)) {
        const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
        this.runHistory = historyData.runs || []
        this.progressHistory = historyData.progress || []
        console.log(`📂 Historique chargé: ${this.runHistory.length} runs, ${this.progressHistory.length} snapshots`)
      }
    } catch (error) {
      console.warn('⚠️  Impossible de charger l\'historique:', error)
    }
  }

  /**
   * Sauvegarde l'historique sur le disque
   */
  private async saveHistoryToDisk(): Promise<void> {
    const historyPath = path.join(
      this.config.highVolumeConfig.reporting.outputDir,
      'continuous-validation',
      'history.json'
    )

    const historyDir = path.dirname(historyPath)
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true })
    }

    const historyData = {
      runs: this.runHistory,
      progress: this.progressHistory,
      lastUpdate: new Date()
    }

    fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2))
    console.log(`💾 Historique sauvé: ${historyPath}`)
  }

  /**
   * Obtient les statistiques de progrès
   */
  getProgressStats(): {
    totalRuns: number
    averageAccuracy: number
    trend: 'improving' | 'stable' | 'declining'
    lastRunMetrics?: ValidationMetrics
    recentIssues: string[]
  } {
    if (this.runHistory.length === 0) {
      return {
        totalRuns: 0,
        averageAccuracy: 0,
        trend: 'stable',
        recentIssues: []
      }
    }

    const accuracies = this.runHistory.map(run => run.metrics.accuracy)
    const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    const trend = this.calculateTrend(accuracies)

    // Collecter les problèmes récents
    const recentIssues = this.runHistory
      .slice(-3)
      .flatMap(run => run.metrics.criticalIssues)
      .filter((issue, index, array) => array.indexOf(issue) === index) // Dédupliquer

    return {
      totalRuns: this.runHistory.length,
      averageAccuracy,
      trend,
      lastRunMetrics: this.lastRunMetrics,
      recentIssues
    }
  }

  /**
   * Génère un rapport de progrès
   */
  generateProgressReport(): string {
    const stats = this.getProgressStats()
    
    let report = `
📊 RAPPORT DE PROGRÈS - VALIDATION CONTINUE
${'='.repeat(60)}

📈 Statistiques Générales:
   • Nombre total de validations: ${stats.totalRuns}
   • Précision moyenne: ${stats.averageAccuracy.toFixed(1)}%
   • Tendance: ${stats.trend === 'improving' ? '📈 En amélioration' : stats.trend === 'declining' ? '📉 En déclin' : '➡️  Stable'}

`

    if (stats.lastRunMetrics) {
      report += `
🎯 Dernière Validation:
   • Précision: ${stats.lastRunMetrics.accuracy.toFixed(1)}%
   • Taux de succès: ${stats.lastRunMetrics.successRate.toFixed(1)}%
   • Erreur moyenne: ${stats.lastRunMetrics.averageError.toFixed(0)}$
   • Régression: ${stats.lastRunMetrics.regressionFromLast ? (stats.lastRunMetrics.regressionFromLast > 0 ? '+' : '') + stats.lastRunMetrics.regressionFromLast.toFixed(1) + '%' : 'N/A'}

`
    }

    if (stats.recentIssues.length > 0) {
      report += `
⚠️  Problèmes Récents:
${stats.recentIssues.map(issue => `   • ${issue}`).join('\n')}

`
    }

    if (this.progressHistory.length > 1) {
      const latest = this.progressHistory[this.progressHistory.length - 1]
      report += `
🔧 Scores par Composant (dernier run):
${Object.entries(latest.componentScores)
  .map(([component, score]) => `   • ${component}: ${score.toFixed(1)}%`)
  .join('\n')}
`
    }

    return report
  }
}