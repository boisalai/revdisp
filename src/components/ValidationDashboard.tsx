'use client'

import { useState, useEffect } from 'react'
import { ValidationEngine, ValidationReport } from '../lib/validation/ValidationEngine'

export default function ValidationDashboard() {
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runValidation = async () => {
    setIsRunning(true)
    setError(null)
    
    try {
      const engine = new ValidationEngine(2024)
      await engine.initialize()
      
      const validationReport = await engine.runFullValidation()
      setReport(validationReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-govuk-green'
      case 'fail': return 'text-govuk-red'
      case 'error': return 'text-govuk-red'
      default: return 'text-govuk-black'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-govuk-red font-bold'
      case 'major': return 'text-govuk-red'
      case 'minor': return 'text-govuk-dark-grey'
      default: return 'text-govuk-black'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="govuk-heading-xl">Tableau de bord de validation</h1>
        <p className="govuk-body text-govuk-dark-grey">
          Validation automatisée du calculateur de revenu disponible vs calculateur officiel du ministère des Finances
        </p>
      </div>

      {/* Contrôles */}
      <div className="mb-6">
        <button
          onClick={runValidation}
          disabled={isRunning}
          className="govuk-button govuk-button--start"
        >
          {isRunning ? '⏳ Validation en cours...' : '🚀 Lancer la validation'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-govuk-red text-white border-l-4 border-govuk-red">
          <p className="govuk-body text-white">❌ Erreur: {error}</p>
        </div>
      )}

      {/* Rapport */}
      {report && (
        <div className="space-y-6">
          {/* Résumé */}
          <div className="bg-white border border-govuk-mid-grey p-4">
            <h2 className="govuk-heading-l mb-4">📊 Résumé</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-govuk-black">{report.summary.totalTests}</div>
                <div className="text-sm text-govuk-dark-grey">Tests totaux</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-govuk-green">{report.summary.passed}</div>
                <div className="text-sm text-govuk-dark-grey">Réussis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-govuk-red">{report.summary.failed}</div>
                <div className="text-sm text-govuk-dark-grey">Échoués</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-govuk-red">{report.summary.errors}</div>
                <div className="text-sm text-govuk-dark-grey">Erreurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-govuk-blue">{report.summary.averageAccuracy.toFixed(1)}%</div>
                <div className="text-sm text-govuk-dark-grey">Précision moy.</div>
              </div>
            </div>
          </div>

          {/* Pires cas */}
          {report.worstCases.length > 0 && (
            <div className="bg-white border border-govuk-mid-grey p-4">
              <h2 className="govuk-heading-l mb-4">⚠️ Pires cas (plus gros écarts)</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-govuk-black">
                      <th className="text-left py-2 px-3 text-sm font-bold">Cas de test</th>
                      <th className="text-left py-2 px-3 text-sm font-bold">Priorité</th>
                      <th className="text-right py-2 px-3 text-sm font-bold">Écart absolu</th>
                      <th className="text-right py-2 px-3 text-sm font-bold">Écart %</th>
                      <th className="text-center py-2 px-3 text-sm font-bold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.worstCases.slice(0, 10).map((result, index) => (
                      <tr key={index} className="border-b border-govuk-mid-grey">
                        <td className="py-2 px-3 text-sm">{result.testCase.description}</td>
                        <td className="py-2 px-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded ${
                            result.testCase.priority === 'high' 
                              ? 'bg-govuk-red text-white' 
                              : result.testCase.priority === 'medium' 
                                ? 'bg-govuk-yellow text-govuk-black' 
                                : 'bg-govuk-light-grey text-govuk-black'
                          }`}>
                            {result.testCase.priority}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-mono">
                          {result.totalAbsoluteDifference.toFixed(0)}$
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-mono">
                          {result.totalPercentageDifference.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-sm text-center">
                          <span className={getStatusColor(result.status)}>
                            {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '🚫'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Différences critiques */}
          {report.criticalDifferences.length > 0 && (
            <div className="bg-white border border-govuk-mid-grey p-4">
              <h2 className="govuk-heading-l mb-4">🚨 Différences critiques</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-govuk-black">
                      <th className="text-left py-2 px-3 text-sm font-bold">Champ</th>
                      <th className="text-right py-2 px-3 text-sm font-bold">Attendu</th>
                      <th className="text-right py-2 px-3 text-sm font-bold">Obtenu</th>
                      <th className="text-right py-2 px-3 text-sm font-bold">Écart</th>
                      <th className="text-center py-2 px-3 text-sm font-bold">Sévérité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.criticalDifferences.slice(0, 15).map((diff, index) => (
                      <tr key={index} className="border-b border-govuk-mid-grey">
                        <td className="py-2 px-3 text-sm font-medium">{diff.field}</td>
                        <td className="py-2 px-3 text-sm text-right font-mono">{diff.expected.toFixed(0)}$</td>
                        <td className="py-2 px-3 text-sm text-right font-mono">{diff.actual.toFixed(0)}$</td>
                        <td className="py-2 px-3 text-sm text-right font-mono">
                          {diff.absoluteDifference.toFixed(0)}$ ({diff.percentageDifference.toFixed(1)}%)
                        </td>
                        <td className="py-2 px-3 text-sm text-center">
                          <span className={getSeverityColor(diff.severity)}>
                            {diff.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommandations */}
          <div className="bg-white border border-govuk-mid-grey p-4">
            <h2 className="govuk-heading-l mb-4">💡 Recommandations</h2>
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="text-sm flex items-start space-x-2">
                  <span className="text-govuk-blue">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="bg-govuk-light-grey border-l-4 border-govuk-blue p-4">
            <h3 className="govuk-heading-m mb-2">🎯 Prochaines étapes</h3>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Corriger les différences critiques</strong> identifiées ci-dessus</p>
              <p>2. <strong>Implémenter les calculateurs manquants</strong> (impôts, crédits, allocations)</p>
              <p>3. <strong>Re-valider avec les cas prioritaires</strong> après corrections</p>
              <p>4. <strong>Étendre la validation</strong> avec plus de cas limites</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}