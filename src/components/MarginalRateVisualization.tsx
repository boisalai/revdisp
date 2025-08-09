'use client'

import React, { useState } from 'react'
import { Streamgraph } from './Streamgraph'
import { useStreamgraphData } from '../hooks/useStreamgraphData'
import { HouseholdType } from '../lib/models'

interface MarginalRateVisualizationProps {
  taxYear: number
  language: 'fr' | 'en'
  householdType: 'single' | 'couple' | 'single_parent' | 'retiree'
  className?: string
}

const HOUSEHOLD_TYPE_MAPPING = {
  [HouseholdType.SINGLE]: 'single' as const,
  [HouseholdType.COUPLE]: 'couple' as const,
  [HouseholdType.SINGLE_PARENT]: 'single_parent' as const,
  [HouseholdType.RETIRED_SINGLE]: 'retiree' as const,
  [HouseholdType.RETIRED_COUPLE]: 'retiree' as const
}

const HOUSEHOLD_LABELS = {
  fr: {
    single: 'Célibataire',
    couple: 'Couple',
    single_parent: 'Parent monoparental',
    retiree: 'Retraité'
  },
  en: {
    single: 'Single',
    couple: 'Couple',
    single_parent: 'Single Parent',
    retiree: 'Retiree'
  }
}

export const MarginalRateVisualization: React.FC<MarginalRateVisualizationProps> = ({
  taxYear,
  language,
  householdType,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data, loading, error } = useStreamgraphData({
    taxYear,
    householdType,
    incomeStep: 2000,
    maxIncome: 200000,
    enabled: isExpanded
  })

  const translations = {
    fr: {
      title: 'Visualisation des taux marginaux d\'imposition',
      description: 'Ce graphique montre la contribution de chaque impôt et cotisation au taux marginal d\'imposition pour différents niveaux de revenu.',
      householdType: 'Type de ménage',
      showVisualization: 'Afficher la visualisation',
      hideVisualization: 'Masquer la visualisation',
      loading: 'Calcul en cours...',
      error: 'Erreur lors du calcul des données'
    },
    en: {
      title: 'Marginal Tax Rate Visualization',
      description: 'This chart shows the contribution of each tax and contribution to the marginal tax rate across different income levels.',
      householdType: 'Household Type',
      showVisualization: 'Show Visualization',
      hideVisualization: 'Hide Visualization',
      loading: 'Calculating...',
      error: 'Error calculating data'
    }
  }

  const t = translations[language]

  return (
    <div className={`govuk-panel ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="govuk-heading-m mb-0">{t.title}</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="govuk-button govuk-button--secondary"
        >
          {isExpanded ? t.hideVisualization : t.showVisualization}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            {t.description}
          </p>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-govuk-blue"></div>
                <span className="govuk-body">{t.loading}</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {t.error}: {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Streamgraph Visualization */}
          {!loading && !error && data.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Streamgraph
                data={data}
                width={800}
                height={450}
                language={language}
                className="w-full"
              />
              
              <div className="mt-4 text-sm text-govuk-secondary-text">
                <p>
                  {language === 'fr' 
                    ? `Données calculées pour ${HOUSEHOLD_LABELS[language][householdType].toLowerCase()} - Année fiscale ${taxYear}`
                    : `Data calculated for ${HOUSEHOLD_LABELS[language][householdType].toLowerCase()} - Tax year ${taxYear}`
                  }
                </p>
                <p>
                  {language === 'fr'
                    ? 'Passez la souris sur les zones colorées pour voir les détails de chaque composante.'
                    : 'Hover over colored areas to see details for each component.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}