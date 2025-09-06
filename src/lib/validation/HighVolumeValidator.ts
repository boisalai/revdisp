/**
 * Système de validation haute performance pour traiter des milliers de cas
 * Optimisé pour parallélisation et gestion de grands volumes
 */

import { PythonOfficialCalculatorScraper, PythonOfficialCalculatorResult } from './PythonOfficialCalculatorScraper'
import { MassTestGenerator, GeneratorConfig, GenerationStrategy } from './MassTestGenerator'
import { ValidationEngine, ValidationResult, ValidationReport } from './ValidationEngine'
import { ValidationTestCase } from './ValidationTestCases'
import { Household } from '../models'
import * as fs from 'fs'
import * as path from 'path'

export interface HighVolumeConfig {
  /** Configuration du générateur de cas */
  generator: Partial<GeneratorConfig>
  /** Stratégie de génération */
  generationStrategy: GenerationStrategy
  /** Options de scraping */
  scraping: {
    /** Timeout pour chaque cas (ms) */
    timeout: number
    /** Mode headless */
    headless: boolean
    /** Nombre de navigateurs parallèles */
    parallelBrowsers: number
    /** Délai entre les batches (ms) */
    batchDelay: number
    /** Taille des batches */
    batchSize: number
    /** Reprendre depuis un checkpoint */
    resumeFromCheckpoint?: string
  }
  /** Configuration des rapports */
  reporting: {
    /** Répertoire de sortie des rapports */
    outputDir: string
    /** Sauvegarder les résultats intermédiaires */
    saveIntermediate: boolean
    /** Fréquence des checkpoints */
    checkpointFrequency: number
  }
}

export interface ValidationProgress {
  total: number
  processed: number
  successful: number
  failed: number
  errors: number
  startTime: Date
  estimatedEndTime?: Date
  currentBatch: number
  totalBatches: number
}

export interface ValidationCheckpoint {
  timestamp: Date
  progress: ValidationProgress
  processedCases: string[]
  pendingCases: ValidationTestCase[]
  results: ValidationResult[]
}

export class HighVolumeValidator {
  private config: HighVolumeConfig
  private scrapers: PythonOfficialCalculatorScraper[] = []
  private generator: MassTestGenerator
  private engine: ValidationEngine
  private progress: ValidationProgress
  
  constructor(config: HighVolumeConfig) {
    this.config = config
    this.generator = new MassTestGenerator(config.generator, config.generationStrategy)
    this.engine = new ValidationEngine(config.generator.taxYear || 2024)
    
    this.progress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: 0,
      startTime: new Date(),
      currentBatch: 0,
      totalBatches: 0
    }
  }

  /**
   * Lance la validation haute performance
   */
  async runHighVolumeValidation(): Promise<ValidationReport> {
    console.log('🚀 Démarrage de la validation haute performance...')
    console.log(`📊 Configuration: ${this.config.generator.totalCases || 1000} cas, ${this.config.scraping.parallelBrowsers} navigateurs parallèles`)

    try {
      // 1. Initialisation
      await this.initialize()

      // 2. Génération des cas de test
      const testCases = await this.generateOrResumeTestCases()

      // 3. Traitement par batches parallèles
      const results = await this.processCasesInParallel(testCases)

      // 4. Génération du rapport final
      const report = await this.generateFinalReport(results)

      // 5. Nettoyage
      await this.cleanup()

      console.log(`✅ Validation terminée: ${results.length} cas traités`)
      return report

    } catch (error) {
      console.error('❌ Erreur lors de la validation haute performance:', error)
      await this.cleanup()
      throw error
    }
  }

  /**
   * Initialise les ressources nécessaires
   */
  private async initialize(): Promise<void> {
    console.log('⚙️  Initialisation des ressources...')

    // Créer le répertoire de sortie
    if (!fs.existsSync(this.config.reporting.outputDir)) {
      fs.mkdirSync(this.config.reporting.outputDir, { recursive: true })
    }

    // Initialiser le moteur de validation
    await this.engine.initialize()

    // Initialiser les scrapers parallèles
    console.log(`🌐 Initialisation de ${this.config.scraping.parallelBrowsers} navigateurs...`)
    for (let i = 0; i < this.config.scraping.parallelBrowsers; i++) {
      const scraper = new PythonOfficialCalculatorScraper({
        timeout: this.config.scraping.timeout
      })
      this.scrapers.push(scraper)
    }

    console.log('✅ Initialisation terminée')
  }

  /**
   * Génère les cas de test ou reprend depuis un checkpoint
   */
  private async generateOrResumeTestCases(): Promise<ValidationTestCase[]> {
    // Vérifier s'il faut reprendre depuis un checkpoint
    if (this.config.scraping.resumeFromCheckpoint) {
      console.log(`🔄 Reprise depuis le checkpoint: ${this.config.scraping.resumeFromCheckpoint}`)
      return this.loadFromCheckpoint()
    }

    // Générer de nouveaux cas
    console.log('🏭 Génération des cas de test...')
    const testCases = await this.generator.generateMassTestCases()
    
    this.progress.total = testCases.length
    this.progress.totalBatches = Math.ceil(testCases.length / this.config.scraping.batchSize)

    return testCases
  }

  /**
   * Traite les cas en parallèle par batches
   */
  private async processCasesInParallel(testCases: ValidationTestCase[]): Promise<ValidationResult[]> {
    console.log(`🔄 Traitement de ${testCases.length} cas par batches de ${this.config.scraping.batchSize}...`)
    
    const allResults: ValidationResult[] = []
    const batches = this.createBatches(testCases, this.config.scraping.batchSize)
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      this.progress.currentBatch = batchIndex + 1
      
      console.log(`📦 Batch ${batchIndex + 1}/${batches.length} (${batch.length} cas)`)
      
      // Traiter le batch en parallèle
      const batchResults = await this.processBatchInParallel(batch)
      allResults.push(...batchResults)
      
      // Mettre à jour les statistiques
      this.updateProgress(batchResults)
      
      // Sauvegarder un checkpoint
      if (batchIndex % this.config.reporting.checkpointFrequency === 0) {
        await this.saveCheckpoint(testCases.slice((batchIndex + 1) * this.config.scraping.batchSize), allResults)
      }
      
      // Sauvegarder les résultats intermédiaires
      if (this.config.reporting.saveIntermediate) {
        await this.saveIntermediateResults(allResults, batchIndex)
      }
      
      // Délai entre les batches pour éviter la surcharge
      if (batchIndex < batches.length - 1) {
        await this.delay(this.config.scraping.batchDelay)
      }
      
      // Afficher les statistiques
      this.printProgress()
    }
    
    return allResults
  }

  /**
   * Traite un batch en utilisant tous les scrapers parallèles
   */
  private async processBatchInParallel(batch: ValidationTestCase[]): Promise<ValidationResult[]> {
    const workers: Promise<ValidationResult[]>[] = []
    const casesPerWorker = Math.ceil(batch.length / this.scrapers.length)
    
    // Distribuer les cas entre les workers
    for (let i = 0; i < this.scrapers.length; i++) {
      const startIndex = i * casesPerWorker
      const endIndex = Math.min(startIndex + casesPerWorker, batch.length)
      const workerCases = batch.slice(startIndex, endIndex)
      
      if (workerCases.length > 0) {
        workers.push(this.processWorkerCases(this.scrapers[i], workerCases, i))
      }
    }
    
    // Attendre que tous les workers terminent
    const workerResults = await Promise.all(workers)
    
    // Combiner les résultats
    return workerResults.flat()
  }

  /**
   * Traite les cas assignés à un worker spécifique
   */
  private async processWorkerCases(
    scraper: PythonOfficialCalculatorScraper, 
    cases: ValidationTestCase[],
    workerId: number
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    for (const testCase of cases) {
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

        // Scraper le calculateur officiel
        const officialResult = await scraper.scrapeOfficialCalculator(household)
        
        // Mettre à jour les résultats attendus avec les données réelles
        const updatedTestCase = this.updateTestCaseWithOfficialResults(testCase, officialResult)
        
        // Calculer nos résultats et comparer
        const validationResult = await this.engine.runSingleTest(updatedTestCase)
        results.push(validationResult)
        
        console.log(`✅ Worker ${workerId}: ${testCase.id} - ${validationResult.status}`)
        
      } catch (error) {
        // Créer un résultat d'erreur
        const errorResult: ValidationResult = {
          testCase,
          ourResults: null,
          expectedResults: testCase.expectedResults,
          differences: [],
          totalAbsoluteDifference: 0,
          totalPercentageDifference: 0,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
        }
        results.push(errorResult)
        console.error(`❌ Worker ${workerId}: ${testCase.id} - Erreur: ${errorResult.errorMessage}`)
      }
    }
    
    return results
  }

  /**
   * Met à jour un cas de test avec les résultats officiels du scraping
   */
  private updateTestCaseWithOfficialResults(
    testCase: ValidationTestCase, 
    officialResult: PythonOfficialCalculatorResult
  ): ValidationTestCase {
    const updatedExpectedResults = { ...testCase.expectedResults }
    
    // Mettre à jour avec les valeurs réelles du calculateur officiel
    if (officialResult.ae_total !== undefined) {
      updatedExpectedResults.assuranceEmploi = officialResult.ae_total
    }
    if (officialResult.rrq_total !== undefined) {
      updatedExpectedResults.rrq = officialResult.rrq_total
    }
    if (officialResult.rqap_total !== undefined) {
      updatedExpectedResults.rqap = officialResult.rqap_total
    }
    if (officialResult.revenu_disponible !== undefined) {
      updatedExpectedResults.revenu_disponible = officialResult.revenu_disponible
    }
    
    return {
      ...testCase,
      expectedResults: updatedExpectedResults
    }
  }

  /**
   * Met à jour les statistiques de progression
   */
  private updateProgress(results: ValidationResult[]): void {
    this.progress.processed += results.length
    this.progress.successful += results.filter(r => r.status === 'pass').length
    this.progress.failed += results.filter(r => r.status === 'fail').length
    this.progress.errors += results.filter(r => r.status === 'error').length
    
    // Estimer le temps de fin
    const elapsed = Date.now() - this.progress.startTime.getTime()
    const averageTimePerCase = elapsed / this.progress.processed
    const remaining = this.progress.total - this.progress.processed
    this.progress.estimatedEndTime = new Date(Date.now() + remaining * averageTimePerCase)
  }

  /**
   * Affiche les statistiques de progression
   */
  private printProgress(): void {
    const percentage = (this.progress.processed / this.progress.total * 100).toFixed(1)
    const successRate = (this.progress.successful / this.progress.processed * 100).toFixed(1)
    
    console.log(`📊 Progression: ${this.progress.processed}/${this.progress.total} (${percentage}%)`)
    console.log(`✅ Taux de succès: ${successRate}% | ❌ Échecs: ${this.progress.failed} | 🚫 Erreurs: ${this.progress.errors}`)
    
    if (this.progress.estimatedEndTime) {
      const eta = this.progress.estimatedEndTime.toLocaleTimeString()
      console.log(`⏱️  ETA: ${eta}`)
    }
    console.log('─'.repeat(60))
  }

  /**
   * Sauvegarde un checkpoint pour reprendre plus tard
   */
  private async saveCheckpoint(pendingCases: ValidationTestCase[], results: ValidationResult[]): Promise<void> {
    const checkpoint: ValidationCheckpoint = {
      timestamp: new Date(),
      progress: { ...this.progress },
      processedCases: results.map(r => r.testCase.id),
      pendingCases,
      results
    }
    
    const checkpointPath = path.join(this.config.reporting.outputDir, `checkpoint-${Date.now()}.json`)
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2))
    
    console.log(`💾 Checkpoint sauvé: ${checkpointPath}`)
  }

  /**
   * Charge depuis un checkpoint
   */
  private loadFromCheckpoint(): ValidationTestCase[] {
    const checkpointData = fs.readFileSync(this.config.scraping.resumeFromCheckpoint!, 'utf-8')
    const checkpoint: ValidationCheckpoint = JSON.parse(checkpointData)
    
    this.progress = checkpoint.progress
    console.log(`📂 Checkpoint chargé: ${checkpoint.pendingCases.length} cas restants`)
    
    return checkpoint.pendingCases
  }

  /**
   * Sauvegarde les résultats intermédiaires
   */
  private async saveIntermediateResults(results: ValidationResult[], batchIndex: number): Promise<void> {
    const filename = `intermediate-results-batch-${batchIndex + 1}.json`
    const filepath = path.join(this.config.reporting.outputDir, filename)
    
    const summary = {
      batchIndex: batchIndex + 1,
      totalResults: results.length,
      timestamp: new Date(),
      results
    }
    
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2))
  }

  /**
   * Génère le rapport final complet
   */
  private async generateFinalReport(results: ValidationResult[]): Promise<ValidationReport> {
    console.log('📋 Génération du rapport final...')
    
    // Utiliser le moteur de validation pour générer le rapport
    const report = this.engine['generateReport'](results) // Méthode privée, accès direct
    
    // Ajouter des statistiques spécifiques à la validation haute performance
    const extendedReport = {
      ...report,
      highVolumeStats: {
        totalProcessingTime: Date.now() - this.progress.startTime.getTime(),
        averageTimePerCase: (Date.now() - this.progress.startTime.getTime()) / results.length,
        parallelBrowsersUsed: this.config.scraping.parallelBrowsers,
        batchSize: this.config.scraping.batchSize,
        generationStrategy: this.config.generationStrategy.type
      }
    }
    
    // Sauvegarder le rapport final
    const reportPath = path.join(this.config.reporting.outputDir, 'high-volume-validation-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(extendedReport, null, 2))
    
    console.log(`📊 Rapport final sauvé: ${reportPath}`)
    return report
  }

  /**
   * Divise les cas en batches
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Délai utilitaire
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Nettoyage des ressources
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Nettoyage des ressources...')
    
    // Les scrapers Python n'ont pas de méthode cleanup - ils sont stateless
    this.scrapers = []
    
    console.log('✅ Nettoyage terminé')
  }
}