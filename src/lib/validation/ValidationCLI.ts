#!/usr/bin/env node

/**
 * Interface CLI pour le système de validation massive et continue
 */

import { Command } from 'commander'
import { MassTestGenerator, GeneratorConfig, GenerationStrategy } from './MassTestGenerator'
import { HighVolumeValidator, HighVolumeConfig } from './HighVolumeValidator'
import { ContinuousValidationSystem, ContinuousValidationConfig } from './ContinuousValidationSystem'
import { AdvancedReportingEngine } from './AdvancedReporting'
import * as fs from 'fs'
import * as path from 'path'

const program = new Command()

program
  .name('validation-cli')
  .description('CLI pour la validation massive du calculateur de revenu disponible')
  .version('1.0.0')

/**
 * Commande pour générer des cas de test en masse
 */
program
  .command('generate')
  .description('Génère des cas de test en masse')
  .option('-n, --count <number>', 'Nombre de cas à générer', '1000')
  .option('-s, --strategy <type>', 'Stratégie de génération (systematic|random|grid|monte_carlo)', 'systematic')
  .option('-y, --year <number>', 'Année fiscale', '2024')
  .option('-o, --output <path>', 'Fichier de sortie', './generated-test-cases.json')
  .action(async (options) => {
    try {
      console.log('🏭 Génération de cas de test en masse...')
      
      const config: Partial<GeneratorConfig> = {
        totalCases: parseInt(options.count),
        taxYear: parseInt(options.year)
      }
      
      const strategy: GenerationStrategy = { type: options.strategy as any }
      const generator = new MassTestGenerator(config, strategy)
      
      const testCases = await generator.generateMassTestCases()
      
      // Sauvegarder les cas générés
      fs.writeFileSync(options.output, JSON.stringify(testCases, null, 2))
      
      console.log(`✅ ${testCases.length} cas générés et sauvés dans ${options.output}`)
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error)
      process.exit(1)
    }
  })

/**
 * Commande pour lancer une validation haute performance
 */
program
  .command('validate')
  .description('Lance une validation haute performance')
  .option('-n, --count <number>', 'Nombre de cas à valider', '1000')
  .option('-p, --parallel <number>', 'Nombre de navigateurs parallèles', '3')
  .option('-b, --batch-size <number>', 'Taille des batches', '50')
  .option('-s, --strategy <type>', 'Stratégie de génération', 'systematic')
  .option('-o, --output <path>', 'Répertoire de sortie', './reports')
  .option('--resume <path>', 'Reprendre depuis un checkpoint')
  .action(async (options) => {
    try {
      console.log('🚀 Démarrage de la validation haute performance...')
      
      const config: HighVolumeConfig = {
        generator: {
          totalCases: parseInt(options.count),
          taxYear: 2024
        },
        generationStrategy: { type: options.strategy as any },
        scraping: {
          parallelBrowsers: parseInt(options.parallel),
          batchSize: parseInt(options.batchSize),
          batchDelay: 2000,
          resumeFromCheckpoint: options.resume,
          headless: true,
          timeout: 30000
        },
        reporting: {
          outputDir: options.output,
          saveIntermediate: true,
          checkpointFrequency: 5
        }
      }
      
      const validator = new HighVolumeValidator(config)
      const report = await validator.runHighVolumeValidation()
      
      console.log('📊 Génération de l\'analyse avancée...')
      const analysis = AdvancedReportingEngine.generateAdvancedAnalysis([])
      
      // Sauvegarder l'analyse
      const analysisPath = path.join(options.output, 'advanced-analysis.json')
      AdvancedReportingEngine.saveAdvancedAnalysis(analysis, analysisPath)
      
      // Générer le rapport HTML
      const htmlPath = path.join(options.output, 'validation-report.html')
      AdvancedReportingEngine.generateHTMLReport(analysis, htmlPath)
      
      console.log(`✅ Validation terminée. Rapports disponibles dans ${options.output}`)
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error)
      process.exit(1)
    }
  })

/**
 * Commande pour démarrer la validation continue
 */
program
  .command('continuous')
  .description('Démarre le système de validation continue')
  .option('-i, --interval <number>', 'Intervalle entre validations (minutes)', '60')
  .option('-n, --count <number>', 'Nombre de cas par validation', '500')
  .option('-o, --output <path>', 'Répertoire de sortie', './continuous-reports')
  .option('--accuracy-threshold <number>', 'Seuil d\'alerte précision (%)', '85')
  .option('--regression-threshold <number>', 'Seuil d\'alerte régression (%)', '5')
  .action(async (options) => {
    try {
      console.log('🔄 Démarrage du système de validation continue...')
      
      const config: ContinuousValidationConfig = {
        highVolumeConfig: {
          generator: {
            totalCases: parseInt(options.count),
            taxYear: 2024
          },
          generationStrategy: { type: 'random' },
          scraping: {
            parallelBrowsers: 2,
            batchSize: 25,
            batchDelay: 1000,
            headless: true,
            timeout: 30000
          },
          reporting: {
            outputDir: options.output,
            saveIntermediate: true,
            checkpointFrequency: 3
          }
        },
        validationInterval: parseInt(options.interval) * 60 * 1000, // Convertir en ms
        triggers: {
          onCodeChange: false, // TODO: implémenter
          onSchedule: true,
          onRegressionThreshold: parseFloat(options.regressionThreshold)
        },
        progressTracking: {
          historyLength: 50,
          trackedMetrics: ['accuracy', 'successRate', 'averageError'],
          alerts: {
            accuracyThreshold: parseFloat(options.accuracyThreshold),
            regressionThreshold: parseFloat(options.regressionThreshold),
            errorThreshold: 10
          }
        }
      }
      
      const system = new ContinuousValidationSystem(config)
      
      // Configurer les listeners d'événements
      system.on('validation_started', (data) => {
        console.log(`🔄 Validation démarrée: ${data.runId}`)
      })
      
      system.on('validation_completed', (run) => {
        console.log(`✅ Validation terminée: ${run.id}`)
        console.log(`   📊 Précision: ${run.metrics.accuracy.toFixed(1)}%`)
        console.log(`   📈 Taux de succès: ${run.metrics.successRate.toFixed(1)}%`)
        if (run.metrics.regressionFromLast) {
          const change = run.metrics.regressionFromLast > 0 ? '+' : ''
          console.log(`   🔄 Changement: ${change}${run.metrics.regressionFromLast.toFixed(1)}%`)
        }
      })
      
      system.on('alert', (alert) => {
        console.log(`🚨 ALERTE [${alert.type}]: ${alert.message}`)
      })
      
      // Gestion des signaux pour arrêt propre
      process.on('SIGINT', async () => {
        console.log('\n🛑 Arrêt demandé...')
        await system.stop()
        process.exit(0)
      })
      
      // Démarrer le système
      await system.start()
      
      // Afficher le statut initial
      console.log('\n📊 Statut du système:')
      console.log(system.generateProgressReport())
      
      // Maintenir le processus actif
      console.log('🔄 Système actif. Appuyez sur Ctrl+C pour arrêter.')
      await new Promise(() => {}) // Maintenir le processus
      
    } catch (error) {
      console.error('❌ Erreur dans la validation continue:', error)
      process.exit(1)
    }
  })

/**
 * Commande pour afficher le statut du système de validation continue
 */
program
  .command('status')
  .description('Affiche le statut de la validation continue')
  .option('-o, --output <path>', 'Répertoire des rapports', './continuous-reports')
  .action(async (options) => {
    try {
      const historyPath = path.join(options.output, 'continuous-validation', 'history.json')
      
      if (!fs.existsSync(historyPath)) {
        console.log('ℹ️  Aucun historique de validation continue trouvé')
        return
      }
      
      const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
      const runs = historyData.runs || []
      const progress = historyData.progress || []
      
      if (runs.length === 0) {
        console.log('ℹ️  Aucun run de validation trouvé')
        return
      }
      
      const lastRun = runs[runs.length - 1]
      const successfulRuns = runs.filter((r: any) => r.status === 'success')
      const averageAccuracy = successfulRuns.reduce((sum: number, r: any) => sum + r.metrics.accuracy, 0) / successfulRuns.length
      
      console.log('📊 STATUT DE LA VALIDATION CONTINUE')
      console.log('='.repeat(50))
      console.log(`🏃 Nombre total de runs: ${runs.length}`)
      console.log(`✅ Runs réussis: ${successfulRuns.length}`)
      console.log(`📈 Précision moyenne: ${averageAccuracy.toFixed(1)}%`)
      console.log(`🕒 Dernier run: ${new Date(lastRun.timestamp).toLocaleString('fr-CA')}`)
      console.log(`🎯 Précision du dernier run: ${lastRun.metrics.accuracy.toFixed(1)}%`)
      
      if (lastRun.metrics.regressionFromLast) {
        const change = lastRun.metrics.regressionFromLast > 0 ? '+' : ''
        console.log(`📊 Changement depuis le run précédent: ${change}${lastRun.metrics.regressionFromLast.toFixed(1)}%`)
      }
      
      if (progress.length > 1) {
        const recentProgress = progress.slice(-5)
        console.log('\n📈 Progrès récent (5 derniers snapshots):')
        recentProgress.forEach((snapshot: any) => {
          console.log(`   ${new Date(snapshot.timestamp).toLocaleDateString('fr-CA')}: ${snapshot.accuracy.toFixed(1)}%`)
        })
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du statut:', error)
      process.exit(1)
    }
  })

/**
 * Commande pour analyser un rapport de validation existant
 */
program
  .command('analyze')
  .description('Analyse un rapport de validation existant')
  .option('-f, --file <path>', 'Fichier de rapport JSON à analyser', './validation-report.json')
  .option('-o, --output <path>', 'Répertoire de sortie pour l\'analyse', './analysis')
  .action(async (options) => {
    try {
      if (!fs.existsSync(options.file)) {
        console.error(`❌ Fichier non trouvé: ${options.file}`)
        process.exit(1)
      }
      
      console.log(`📊 Analyse du rapport: ${options.file}`)
      
      // Charger le rapport
      const reportData = JSON.parse(fs.readFileSync(options.file, 'utf-8'))
      
      // TODO: Extraire les résultats du rapport selon son format
      const results: any[] = [] // Placeholder
      
      // Générer l'analyse avancée
      const analysis = AdvancedReportingEngine.generateAdvancedAnalysis(results)
      
      // Créer le répertoire de sortie
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true })
      }
      
      // Sauvegarder l'analyse
      AdvancedReportingEngine.saveAdvancedAnalysis(
        analysis,
        path.join(options.output, 'advanced-analysis.json')
      )
      
      // Générer le rapport HTML
      AdvancedReportingEngine.generateHTMLReport(
        analysis,
        path.join(options.output, 'analysis-report.html')
      )
      
      console.log(`✅ Analyse terminée. Résultats dans ${options.output}`)
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', error)
      process.exit(1)
    }
  })

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejection non gérée:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non gérée:', error)
  process.exit(1)
})

// Parser les arguments de la ligne de commande
program.parse(process.argv)

export { program }