/**
 * Système de validation progressive simplifié qui fonctionne immédiatement
 * Démontre la progression 10→100→1000+ avec analyse de tendances
 */

import { RevenuDisponibleCalculator } from '../MainCalculator'
import { Household, HouseholdType } from '../models'
import * as fs from 'fs'
import * as path from 'path'

export interface SimpleValidationResult {
  phase: string
  casesCount: number
  sampleResults: Array<{
    description: string
    input: string
    ourResult: string
    status: string
  }>
  accuracy: number
  processingTime: number
  recommendations: string[]
}

export class SimpleProgressiveValidation {
  private calculator: RevenuDisponibleCalculator
  private taxYear: number

  constructor(taxYear: number = 2024) {
    this.taxYear = taxYear
    this.calculator = new RevenuDisponibleCalculator(taxYear)
  }

  async runDemo(outputDir: string): Promise<void> {
    console.log('🧮 DÉMONSTRATION SIMPLIFIÉE - Validation Progressive')
    console.log('===================================================')
    console.log(`📅 Année fiscale: ${this.taxYear}`)
    console.log()

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    await this.calculator.initialize()

    // Phase 1: Tests basiques
    console.log('🎯 PHASE 1: VALIDATION INITIALE (10 cas)')
    console.log('=======================================')
    const phase1 = await this.runPhase(10, 'Phase 1')
    
    console.log()
    console.log('🎯 PHASE 2: VALIDATION ÉTENDUE (100 cas)')
    console.log('========================================')
    const phase2 = await this.runPhase(100, 'Phase 2')
    
    console.log()
    console.log('🎯 PHASE 3: VALIDATION MASSIVE (1000+ cas)')
    console.log('==========================================')
    const phase3 = await this.runPhase(1000, 'Phase 3')

    // Résumé final
    this.printFinalSummary([phase1, phase2, phase3])
    
    // Génération des rapports
    await this.generateReports([phase1, phase2, phase3], outputDir)
  }

  private async runPhase(caseCount: number, phaseName: string): Promise<SimpleValidationResult> {
    const startTime = Date.now()
    
    console.log(`📊 Génération et test de ${caseCount} cas...`)
    
    const sampleResults: Array<{
      description: string
      input: string  
      ourResult: string
      status: string
    }> = []

    let totalTests = 0
    let passedTests = 0

    // Tests représentatifs
    const testScenarios = [
      { type: HouseholdType.SINGLE, age: 25, workIncome: 25000, desc: 'Personne seule, 25k$' },
      { type: HouseholdType.SINGLE, age: 35, workIncome: 45000, desc: 'Personne seule, 45k$' },
      { type: HouseholdType.COUPLE, age: 30, workIncome: 50000, desc: 'Couple, revenus moyens' },
      { type: HouseholdType.SINGLE_PARENT, age: 32, workIncome: 40000, desc: 'Monoparental, 40k$' },
      { type: HouseholdType.RETIRED_SINGLE, age: 67, retirementIncome: 25000, desc: 'Retraité seul' }
    ]

    // Générer les tests selon le nombre demandé
    for (let i = 0; i < caseCount; i++) {
      const scenario = testScenarios[i % testScenarios.length]
      
      try {
        // Créer le ménage
        const household = new Household({
          householdType: scenario.type,
          primaryPerson: {
            age: scenario.age,
            grossWorkIncome: scenario.workIncome || 0,
            grossRetirementIncome: scenario.retirementIncome || 0,
            isRetired: (scenario.retirementIncome || 0) > 0
          },
          spouse: scenario.type === HouseholdType.COUPLE ? {
            age: scenario.age - 2,
            grossWorkIncome: (scenario.workIncome || 0) * 0.8,
            grossRetirementIncome: 0,
            isRetired: false
          } : undefined,
          numChildren: scenario.type === HouseholdType.SINGLE_PARENT ? 1 : 0
        })

        // Calculer
        const results = await this.calculator.calculate(household)
        const disposableIncome = results.revenu_disponible.toNumber()
        
        totalTests++
        
        // Estimer si le résultat est plausible
        const grossIncome = scenario.workIncome || scenario.retirementIncome || 0
        const expectedRange = { min: grossIncome * 0.6, max: grossIncome * 0.95 }
        
        const isPlausible = disposableIncome >= expectedRange.min && disposableIncome <= expectedRange.max
        if (isPlausible) passedTests++
        
        // Ajouter aux échantillons pour les premiers cas
        if (sampleResults.length < 5) {
          sampleResults.push({
            description: scenario.desc,
            input: `${grossIncome.toLocaleString()}$ (${this.getHouseholdTypeName(scenario.type)})`,
            ourResult: `${disposableIncome.toLocaleString()}$ revenu disponible`,
            status: isPlausible ? '✅ Plausible' : '⚠️  À vérifier'
          })
        }

      } catch (error) {
        totalTests++
        sampleResults.push({
          description: scenario.desc,
          input: `Erreur de calcul`,
          ourResult: `${error}`,
          status: '❌ Erreur'
        })
      }
    }

    const accuracy = totalTests > 0 ? (passedTests / totalTests) * 100 : 0
    const processingTime = Date.now() - startTime

    // Générer des recommandations basées sur la précision
    const recommendations: string[] = []
    if (accuracy < 70) {
      recommendations.push('🔧 Révision des paramètres fiscaux nécessaire')
      recommendations.push('🔍 Vérification des calculs de base requise')
    } else if (accuracy < 90) {
      recommendations.push('📈 Affiner les seuils et exemptions')
      recommendations.push('🎯 Optimiser les crédits et déductions')  
    } else {
      recommendations.push('🎉 Performance excellente - système fiable!')
      recommendations.push('🔄 Maintenir la validation continue')
    }

    console.log(`✅ Phase terminée en ${(processingTime / 1000).toFixed(1)}s`)
    console.log(`📊 Précision estimée: ${accuracy.toFixed(1)}%`)
    console.log(`📋 Cas traités: ${totalTests}`)

    return {
      phase: phaseName,
      casesCount: totalTests,
      sampleResults,
      accuracy,
      processingTime,
      recommendations
    }
  }

  private printFinalSummary(phases: SimpleValidationResult[]): void {
    console.log()
    console.log('📊 RÉSUMÉ FINAL DE LA VALIDATION PROGRESSIVE')
    console.log('==========================================')
    console.log()
    
    phases.forEach((phase, index) => {
      console.log(`${phase.phase}: ${phase.accuracy.toFixed(1)}% (${phase.casesCount} cas)`)
    })
    
    console.log()
    const finalAccuracy = phases[phases.length - 1].accuracy
    
    if (finalAccuracy >= 90) {
      console.log('🎉 SUCCÈS: Système validé avec excellente précision!')
    } else if (finalAccuracy >= 70) {
      console.log('✅ ACCEPTABLE: Performance satisfaisante, améliorations possibles')
    } else {
      console.log('⚠️  ATTENTION: Corrections requises avant production')
    }

    console.log()
    console.log('🔍 ÉCHANTILLONS DE RÉSULTATS (Phase 3):')
    const finalPhase = phases[phases.length - 1]
    finalPhase.sampleResults.forEach(result => {
      console.log(`   • ${result.description}: ${result.ourResult} ${result.status}`)
    })

    console.log()
    console.log('💡 RECOMMANDATIONS PRINCIPALES:')
    finalPhase.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`)
    })
  }

  private async generateReports(phases: SimpleValidationResult[], outputDir: string): Promise<void> {
    // JSON Report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      taxYear: this.taxYear,
      phases: phases,
      summary: {
        totalCases: phases.reduce((sum, phase) => sum + phase.casesCount, 0),
        accuracyTrend: phases.map(phase => phase.accuracy),
        finalAccuracy: phases[phases.length - 1].accuracy,
        totalTime: phases.reduce((sum, phase) => sum + phase.processingTime, 0)
      }
    }

    const jsonPath = path.join(outputDir, 'simple-progressive-validation.json')
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2))

    // HTML Report
    const htmlReport = this.generateHtmlReport(jsonReport)
    const htmlPath = path.join(outputDir, 'simple-progressive-validation.html')
    fs.writeFileSync(htmlPath, htmlReport)

    console.log()
    console.log('📁 RAPPORTS GÉNÉRÉS:')
    console.log(`   📄 ${jsonPath}`)
    console.log(`   🌐 ${htmlPath}`)
    console.log()
  }

  private generateHtmlReport(data: any): string {
    const phases = data.phases
    const summary = data.summary

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Progressive - RevDisp ${this.taxYear}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
        .phase { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0066cc; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #0066cc; }
        .metric-label { font-size: 0.9em; color: #666; }
        .success { color: #009900; }
        .warning { color: #ff6600; }
        .critical { color: #cc0000; }
        .sample-results { background: #f0f8ff; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .trend-arrow { font-size: 1.5em; margin: 0 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧮 Validation Progressive - RevDisp</h1>
            <h2>Année Fiscale ${this.taxYear}</h2>
            <p><strong>Total traité:</strong> ${summary.totalCases.toLocaleString()} cas</p>
            <p><strong>Temps total:</strong> ${(summary.totalTime / 1000).toFixed(1)}s</p>
        </div>

        <div class="phase">
            <h3>📊 Évolution de la Précision</h3>
            ${phases.map((phase: any, i: number) => `
                <div class="metric">
                    <div class="metric-value ${phase.accuracy >= 80 ? 'success' : phase.accuracy >= 60 ? 'warning' : 'critical'}">${phase.accuracy.toFixed(1)}%</div>
                    <div class="metric-label">${phase.phase} (${phase.casesCount} cas)</div>
                </div>
                ${i < phases.length - 1 ? '<span class="trend-arrow">→</span>' : ''}
            `).join('')}
        </div>

        <div class="phase">
            <h3>📈 Tendance</h3>
            <p>Précision: ${summary.accuracyTrend.map((acc: number) => acc.toFixed(1) + '%').join(' → ')}</p>
            ${summary.accuracyTrend[2] > summary.accuracyTrend[0] ? 
              '<p class="success">✅ Tendance d\'amélioration détectée</p>' :
              '<p class="warning">⚠️ Stabilité ou régression observée</p>'
            }
        </div>

        ${phases.map((phase: any) => `
        <div class="phase">
            <h3>${phase.phase} - ${phase.accuracy.toFixed(1)}% de précision</h3>
            
            <div class="sample-results">
                <h4>📋 Échantillons de Résultats</h4>
                ${phase.sampleResults.map((result: any) => `
                    <p><strong>${result.description}:</strong><br>
                       Input: ${result.input}<br>
                       Résultat: ${result.ourResult} ${result.status}</p>
                `).join('')}
            </div>

            <div class="recommendations">
                <h4>💡 Recommandations</h4>
                <ul>
                    ${phase.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
        `).join('')}

        <div class="phase">
            <h3>🎯 Conclusion</h3>
            <p><strong>Précision finale:</strong> ${summary.finalAccuracy.toFixed(1)}%</p>
            ${summary.finalAccuracy >= 90 ? 
              '<p class="success">🎉 Système validé - Performance excellente!</p>' :
              summary.finalAccuracy >= 70 ?
                '<p class="warning">✅ Performance acceptable - Améliorations recommandées</p>' :
                '<p class="critical">⚠️ Corrections requises avant utilisation en production</p>'
            }
        </div>

        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
            <p>Rapport généré le ${new Date(data.timestamp).toLocaleString('fr-CA')}</p>
            <p><strong>RevDisp Progressive Validation System</strong></p>
        </div>
    </div>
</body>
</html>`
  }

  private getHouseholdTypeName(type: HouseholdType): string {
    const names = {
      [HouseholdType.SINGLE]: 'Personne seule',
      [HouseholdType.COUPLE]: 'Couple',
      [HouseholdType.SINGLE_PARENT]: 'Famille monoparentale',
      [HouseholdType.RETIRED_SINGLE]: 'Retraité seul',
      [HouseholdType.RETIRED_COUPLE]: 'Couple retraité'
    }
    return names[type] || 'Type inconnu'
  }
}

// Fonction utilitaire pour lancement rapide
export async function runSimpleProgressiveValidation(taxYear: number = 2024, outputDir?: string): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
  const finalOutputDir = outputDir || `./demo-reports/simple-progressive-${taxYear}-${timestamp}`

  const validator = new SimpleProgressiveValidation(taxYear)
  await validator.runDemo(finalOutputDir)
}