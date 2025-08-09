'use client'

import React, { useState } from 'react'
import { CalculationResults } from '../lib/MainCalculator'
import Decimal from 'decimal.js'

interface DetailedResultsProps {
  results: CalculationResults
  language: 'fr' | 'en'
  formatCurrency: (value: number) => string
}

interface ProgramDetail {
  name: string
  description: string
  formula: string
  currentValue: number
  parameters: { label: string; value: string }[]
}

const PROGRAM_DETAILS = {
  fr: {
    revenu_disponible: {
      name: 'Revenu disponible',
      description: 'Le montant d\'argent qu\'une personne ou une famille a à sa disposition après avoir payé ses impôts et reçu ses transferts gouvernementaux.',
      formula: 'Revenu brut + Transferts - Impôts - Cotisations',
      parameters: [
        { label: 'Composantes', value: 'Revenus de travail, pensions, prestations' },
        { label: 'Déductions', value: 'Impôts fédéraux et provinciaux, cotisations sociales' }
      ]
    },
    impot_quebec: {
      name: 'Impôt sur le revenu du Québec',
      description: 'Impôt prélevé par le gouvernement du Québec sur le revenu des particuliers résidant dans la province.',
      formula: 'Revenu imposable × Taux marginal - Crédits d\'impôt',
      parameters: [
        { label: 'Taux 2024', value: '12% à 25.75%' },
        { label: 'Exemption de base', value: '18 056 $' }
      ]
    },
    impot_federal: {
      name: 'Impôt sur le revenu fédéral',
      description: 'Impôt prélevé par le gouvernement du Canada sur le revenu des particuliers résidant au Canada.',
      formula: 'Revenu imposable × Taux marginal - Crédits d\'impôt',
      parameters: [
        { label: 'Taux 2024', value: '15% à 33%' },
        { label: 'Exemption de base', value: '15 705 $' }
      ]
    },
    rrq: {
      name: 'Régime de rentes du Québec (RRQ)',
      description: 'Régime public d\'assurance qui offre une protection financière de base lors de la retraite, du décès ou en cas d\'invalidité.',
      formula: '(Revenus - 3 500 $) × 5.4% + contribution additionnelle',
      parameters: [
        { label: 'Taux de base 2024', value: '5.4%' },
        { label: 'Exemption de base', value: '3 500 $' },
        { label: 'Maximum assurable', value: '68 500 $' },
        { label: 'Cotisation max', value: '3 510 $' }
      ]
    },
    assurance_emploi: {
      name: 'Assurance-emploi (AE)',
      description: 'Programme qui offre une aide financière temporaire aux travailleurs canadiens qui perdent leur emploi sans en être responsables.',
      formula: 'Revenus assurables × 1.27%',
      parameters: [
        { label: 'Taux 2024', value: '1.27%' },
        { label: 'Maximum assurable', value: '63 300 $' },
        { label: 'Cotisation max', value: '804 $' }
      ]
    },
    rqap: {
      name: 'Régime québécois d\'assurance parentale (RQAP)',
      description: 'Régime qui offre des prestations de maternité, de paternité, parentales et d\'adoption aux parents québécois.',
      formula: 'Revenus assurables × 0.494%',
      parameters: [
        { label: 'Taux 2024', value: '0.494%' },
        { label: 'Maximum assurable', value: '94 000 $' },
        { label: 'Cotisation max', value: '464 $' }
      ]
    },
    fss: {
      name: 'Fonds des services de santé (FSS)',
      description: 'Contribution obligatoire des retraités de 65 ans et plus pour financer les services de santé au Québec.',
      formula: 'Contribution progressive selon le revenu',
      parameters: [
        { label: 'Seuil d\'exemption', value: '16 780 $' },
        { label: 'Taux', value: '1%' },
        { label: 'Contribution max', value: '1 000 $' }
      ]
    },
    ramq: {
      name: 'Régime d\'assurance médicaments du Québec',
      description: 'Régime qui assure l\'accès aux médicaments d\'ordonnance pour les personnes qui ne sont pas couvertes par un régime privé.',
      formula: 'Contribution selon le revenu familial net',
      parameters: [
        { label: 'Seuil d\'exemption (célibataire)', value: '18 910 $' },
        { label: 'Seuil d\'exemption (couple)', value: '30 640 $' },
        { label: 'Contribution max', value: '720 $' }
      ]
    },
    allocation_famille: {
      name: 'Allocation famille',
      description: 'Aide financière versée mensuellement aux familles pour les aider à assumer une partie des coûts liés à l\'éducation de leurs enfants.',
      formula: 'Montant de base - réduction selon le revenu',
      parameters: [
        { label: 'Montant de base (0-6 ans)', value: '2 781 $' },
        { label: 'Montant de base (7-17 ans)', value: '1 393 $' },
        { label: 'Seuil de réduction', value: '53 305 $' }
      ]
    }
  },
  en: {
    revenu_disponible: {
      name: 'Disposable Income',
      description: 'The amount of money available to an individual or family after paying taxes and receiving government transfers.',
      formula: 'Gross Income + Transfers - Taxes - Contributions',
      parameters: [
        { label: 'Components', value: 'Employment income, pensions, benefits' },
        { label: 'Deductions', value: 'Federal and provincial taxes, social contributions' }
      ]
    },
    impot_quebec: {
      name: 'Quebec Income Tax',
      description: 'Tax levied by the Quebec government on the income of individuals residing in the province.',
      formula: 'Taxable Income × Marginal Rate - Tax Credits',
      parameters: [
        { label: '2024 Rates', value: '12% to 25.75%' },
        { label: 'Basic Exemption', value: '$18,056' }
      ]
    },
    impot_federal: {
      name: 'Federal Income Tax',
      description: 'Tax levied by the Canadian government on the income of individuals residing in Canada.',
      formula: 'Taxable Income × Marginal Rate - Tax Credits',
      parameters: [
        { label: '2024 Rates', value: '15% to 33%' },
        { label: 'Basic Exemption', value: '$15,705' }
      ]
    },
    rrq: {
      name: 'Quebec Pension Plan (QPP)',
      description: 'Public insurance plan that provides basic financial protection upon retirement, death or in case of disability.',
      formula: '(Income - $3,500) × 5.4% + additional contribution',
      parameters: [
        { label: '2024 Base Rate', value: '5.4%' },
        { label: 'Basic Exemption', value: '$3,500' },
        { label: 'Maximum Insurable', value: '$68,500' },
        { label: 'Maximum Contribution', value: '$3,510' }
      ]
    },
    assurance_emploi: {
      name: 'Employment Insurance (EI)',
      description: 'Program that provides temporary financial assistance to Canadian workers who lose their jobs through no fault of their own.',
      formula: 'Insurable Earnings × 1.27%',
      parameters: [
        { label: '2024 Rate', value: '1.27%' },
        { label: 'Maximum Insurable', value: '$63,300' },
        { label: 'Maximum Contribution', value: '$804' }
      ]
    },
    rqap: {
      name: 'Quebec Parental Insurance Plan (QPIP)',
      description: 'Plan that provides maternity, paternity, parental and adoption benefits to Quebec parents.',
      formula: 'Insurable Earnings × 0.494%',
      parameters: [
        { label: '2024 Rate', value: '0.494%' },
        { label: 'Maximum Insurable', value: '$94,000' },
        { label: 'Maximum Contribution', value: '$464' }
      ]
    },
    fss: {
      name: 'Health Services Fund (HSF)',
      description: 'Mandatory contribution from retirees aged 65 and over to fund health services in Quebec.',
      formula: 'Progressive contribution based on income',
      parameters: [
        { label: 'Exemption Threshold', value: '$16,780' },
        { label: 'Rate', value: '1%' },
        { label: 'Maximum Contribution', value: '$1,000' }
      ]
    },
    ramq: {
      name: 'Quebec Prescription Drug Insurance Plan',
      description: 'Plan that ensures access to prescription drugs for people not covered by a private plan.',
      formula: 'Contribution based on net family income',
      parameters: [
        { label: 'Exemption Threshold (single)', value: '$18,910' },
        { label: 'Exemption Threshold (couple)', value: '$30,640' },
        { label: 'Maximum Contribution', value: '$720' }
      ]
    },
    allocation_famille: {
      name: 'Family Allowance',
      description: 'Monthly financial assistance paid to families to help them cover part of the costs related to raising their children.',
      formula: 'Base amount - reduction based on income',
      parameters: [
        { label: 'Base Amount (0-6 years)', value: '$2,781' },
        { label: 'Base Amount (7-17 years)', value: '$1,393' },
        { label: 'Reduction Threshold', value: '$53,305' }
      ]
    }
  }
}

export default function DetailedResults({ results, language, formatCurrency }: DetailedResultsProps) {
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  const programs = PROGRAM_DETAILS[language]
  const currentProgram = hoveredProgram ? programs[hoveredProgram as keyof typeof programs] : null

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey)
    } else {
      newExpanded.add(sectionKey)
    }
    setExpandedSections(newExpanded)
  }
  
  const isSectionExpanded = (sectionKey: string) => expandedSections.has(sectionKey)

  const getValueForProgram = (programKey: string): number => {
    switch (programKey) {
      case 'revenu_disponible':
        return 50000 - (results.cotisations.total instanceof Decimal ? results.cotisations.total.toNumber() : 0)
      case 'rrq':
        return results.cotisations.rrq instanceof Decimal ? -results.cotisations.rrq.toNumber() : 0
      case 'assurance_emploi':
        return results.cotisations.assurance_emploi instanceof Decimal ? -results.cotisations.assurance_emploi.toNumber() : 0
      default:
        return 0
    }
  }

  // Define sections with their items
  const sections = [
    {
      key: 'revenu_disponible',
      label: language === 'fr' ? 'Revenu disponible' : 'Disposable Income',
      value: getValueForProgram('revenu_disponible'),
      items: [],
      standalone: true
    },
    {
      key: 'quebec_section',
      label: language === 'fr' ? 'Régime fiscal du Québec' : 'Quebec Tax System',
      value: 0,
      items: [
        { key: 'impot_quebec', label: language === 'fr' ? 'Impôt sur le revenu des particuliers' : 'Personal Income Tax', value: 0 },
        { key: 'aide_sociale', label: language === 'fr' ? 'Aide sociale' : 'Social Assistance', value: 0 },
        { key: 'allocation_famille', label: language === 'fr' ? 'Allocation famille' : 'Family Allowance', value: 0 },
        { key: 'fournitures_scolaires', label: language === 'fr' ? 'Supplément pour l\'achat de fournitures scolaires' : 'School Supply Supplement', value: 0 },
        { key: 'prime_travail', label: language === 'fr' ? 'Prime au travail' : 'Work Premium', value: 0 },
        { key: 'credit_solidarite', label: language === 'fr' ? 'Crédit pour la solidarité' : 'Solidarity Tax Credit', value: 0 },
        { key: 'credit_garde', label: language === 'fr' ? 'Crédit d\'impôt pour frais de garde d\'enfants' : 'Child Care Tax Credit', value: 0 },
        { key: 'allocation_logement', label: language === 'fr' ? 'Allocation-logement' : 'Housing Allowance', value: 0 },
        { key: 'credit_medical', label: language === 'fr' ? 'Crédit d\'impôt remboursable pour frais médicaux' : 'Medical Expense Tax Credit', value: 0 },
        { key: 'soutien_aines', label: language === 'fr' ? 'Montant pour le soutien des aînés' : 'Amount for Support of Seniors', value: 0 }
      ]
    },
    {
      key: 'federal_section',
      label: language === 'fr' ? 'Régime fiscal fédéral' : 'Federal Tax System',
      value: 0,
      items: [
        { key: 'impot_federal', label: language === 'fr' ? 'Impôt sur le revenu des particuliers' : 'Personal Income Tax', value: 0 },
        { key: 'allocation_enfants', label: language === 'fr' ? 'Allocation canadienne pour enfants' : 'Canada Child Benefit', value: 0 },
        { key: 'credit_tps', label: language === 'fr' ? 'Crédit pour la TPS' : 'GST Credit', value: 0 },
        { key: 'allocation_travailleurs', label: language === 'fr' ? 'Allocation canadienne pour les travailleurs' : 'Canada Workers Benefit', value: 0 },
        { key: 'securite_vieillesse', label: language === 'fr' ? 'Programme de la Sécurité de la vieillesse' : 'Old Age Security Program', value: 0 },
        { key: 'supplement_medical', label: language === 'fr' ? 'Supplément remboursable pour frais médicaux' : 'Medical Expense Supplement', value: 0 }
      ]
    },
    {
      key: 'cotisations_section',
      label: language === 'fr' ? 'Cotisations' : 'Contributions',
      value: 0,
      items: [
        { key: 'assurance_emploi', label: language === 'fr' ? 'Assurance-emploi' : 'Employment Insurance', value: getValueForProgram('assurance_emploi') },
        { key: 'rqap', label: language === 'fr' ? 'Régime québécois d\'assurance parentale' : 'Quebec Parental Insurance Plan', value: 0 },
        { key: 'rrq', label: language === 'fr' ? 'Régime de rentes du Québec' : 'Quebec Pension Plan', value: getValueForProgram('rrq') },
        { key: 'fss', label: language === 'fr' ? 'Fonds des services de santé' : 'Health Services Fund', value: 0 },
        { key: 'ramq', label: language === 'fr' ? 'Régime d\'assurance médicaments du Québec' : 'Quebec Prescription Drug Insurance Plan', value: 0 }
      ]
    },
    {
      key: 'frais_garde',
      label: language === 'fr' ? 'Frais de garde' : 'Childcare Expenses',
      value: 0,
      items: [],
      standalone: true
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
      {/* Première colonne - Tableau des résultats */}
      <div>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {sections.map((section, sectionIndex) => (
                <React.Fragment key={section.key}>
                  {/* Section Header */}
                  <tr
                    className={`
                      ${section.standalone ? 'bg-gray-50' : 'bg-gray-50 cursor-pointer hover:bg-gray-100'} 
                      ${sectionIndex > 0 ? 'border-t border-gray-200' : ''}
                      transition-colors
                    `}
                    onClick={() => !section.standalone && toggleSection(section.key)}
                  >
                    <td className="px-4 py-2 text-gray-900 font-bold">
                      {section.standalone ? (
                        section.label
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>{section.label}</span>
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${isSectionExpanded(section.key) ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 font-bold">
                      {section.key === 'revenu_disponible' ? (
                        <span className="text-gray-900 font-bold">{formatCurrency(section.value)}</span>
                      ) : (
                        !section.standalone && formatCurrency(section.value)
                      )}
                    </td>
                  </tr>
                  
                  {/* Section Items (only show if expanded or standalone) */}
                  {(section.standalone || isSectionExpanded(section.key)) && section.items.map((item) => (
                    <tr
                      key={item.key}
                      className="hover:bg-blue-50 border-t border-gray-200 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredProgram(item.key)}
                      onMouseLeave={() => setHoveredProgram(null)}
                    >
                      <td className="px-4 py-2 text-gray-900 pl-8">
                        {item.label}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {formatCurrency(item.value)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deuxième colonne - Détails du programme survolé */}
      <div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[400px]">
          {currentProgram ? (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-blue-600">{currentProgram.name}</h4>
              
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">
                  {language === 'fr' ? 'Description' : 'Description'}
                </h5>
                <p className="text-gray-700 leading-relaxed">{currentProgram.description}</p>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">
                  {language === 'fr' ? 'Formule de calcul' : 'Calculation Formula'}
                </h5>
                <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono block">
                  {currentProgram.formula}
                </code>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">
                  {language === 'fr' ? 'Paramètres' : 'Parameters'}
                </h5>
                <div className="space-y-2">
                  {currentProgram.parameters.map((param, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{param.label}:</span>
                      <span className="font-medium">{param.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">👆</div>
                <p>{language === 'fr' ? 
                  'Survolez un élément du tableau pour voir ses détails' : 
                  'Hover over a table item to see its details'
                }</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}