'use client'

import React, { useState } from 'react'
import { CalculationResults } from '../lib/MainCalculator'
import { Household } from '../lib/models'
import Decimal from 'decimal.js'

interface DetailedResultsProps {
  results: CalculationResults
  household?: Household
  taxYear?: number
  language: 'fr' | 'en'
  formatCurrency: (value: number) => string
}

interface ProgramDetail {
  name: string
  description: string
  formula: string
  currentValue: number
  parameters: { label: string; value: string; isReference?: boolean }[]
}

const PROGRAM_DETAILS = (taxYear: number = 2024) => ({
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
    ramq: (() => {
      const params2024 = {
        exemptionSingle: 19790,
        exemptionCouple: 32080,
        maxContribution: 737.50
      }
      const params2025 = {
        exemptionSingle: 19790,
        exemptionCouple: 32080,
        maxContribution: 744
      }
      const params = taxYear === 2025 ? params2025 : params2024
      
      return {
        name: 'Régime d\'assurance médicaments du Québec',
        description: 'Régime qui assure l\'accès aux médicaments d\'ordonnance pour les personnes qui ne sont pas couvertes par un régime privé.',
        formula: 'Première tranche: (Revenu - seuil) × taux de base, puis: excédent × taux additionnel',
        parameters: [
          { label: 'Seuil d\'exemption (célibataire)', value: `${params.exemptionSingle.toLocaleString()} $ (${taxYear})` },
          { label: 'Seuil d\'exemption (couple)', value: `${params.exemptionCouple.toLocaleString()} $ (${taxYear})` },
          { label: 'Première tranche', value: '5 000 $ × 7,47% (célibataire)' },
          { label: 'Tranche additionnelle', value: 'Excédent × 11,22% (célibataire)' },
          { label: 'Taux couple (base)', value: '3,75% sur première tranche' },
          { label: 'Taux couple (additionnel)', value: '5,62% sur excédent' },
          { label: 'Contribution max', value: `${params.maxContribution.toFixed(2).replace('.', ',')} $ (${taxYear})` }
        ]
      }
    })(),
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
    ramq: (() => {
      const params2024 = {
        exemptionSingle: 19790,
        exemptionCouple: 32080,
        maxContribution: 737.50
      }
      const params2025 = {
        exemptionSingle: 19790,
        exemptionCouple: 32080,
        maxContribution: 744
      }
      const params = taxYear === 2025 ? params2025 : params2024
      
      return {
        name: 'Quebec Prescription Drug Insurance Plan',
        description: 'Plan that ensures access to prescription drugs for people not covered by a private plan.',
        formula: 'First bracket: (Income - threshold) × base rate, then: excess × additional rate',
        parameters: [
          { label: 'Exemption Threshold (single)', value: `$${params.exemptionSingle.toLocaleString()} (${taxYear})` },
          { label: 'Exemption Threshold (couple)', value: `$${params.exemptionCouple.toLocaleString()} (${taxYear})` },
          { label: 'First bracket', value: '$5,000 × 7.47% (single)' },
          { label: 'Additional bracket', value: 'Excess × 11.22% (single)' },
          { label: 'Couple rate (base)', value: '3.75% on first bracket' },
          { label: 'Couple rate (additional)', value: '5.62% on excess' },
          { label: 'Maximum Contribution', value: `$${params.maxContribution.toFixed(2)} (${taxYear})` }
        ]
      }
    })(),
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
})

export default function DetailedResults({ results, household, taxYear = 2024, language, formatCurrency }: DetailedResultsProps) {
  
  // Fonction de formatage des montants selon la langue
  const formatAmount = (amount: number): string => {
    if (language === 'fr') {
      // Format français : espace des milliers, virgule décimale, $ après
      return amount.toLocaleString('fr-CA', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).replace(/\s/g, ' ') + ' $'
    } else {
      // Format anglais : virgule des milliers, point décimal, $ avant
      return '$' + amount.toLocaleString('en-CA', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    }
  }

  // Fonction de formatage des pourcentages selon la langue
  const formatPercent = (rate: number): string => {
    const percent = rate * 100
    if (language === 'fr') {
      // Format français : virgule décimale
      return percent.toLocaleString('fr-CA', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) + ' %'
    } else {
      // Format anglais : point décimal
      return percent.toLocaleString('en-CA', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) + ' %'
    }
  }
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null)
  const [pinnedProgram, setPinnedProgram] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  const programs = PROGRAM_DETAILS(taxYear)[language]
  
  // Génère les détails dynamiques du RRQ basés sur les données réelles
  const getRRQDetails = (): ProgramDetail | null => {
    if (!household) return null
    
    // Paramètres officiels selon l'année
    const params2024 = { 
      basicExemption: 3500, 
      maxPensionable: 68500,
      totalRate: 0.064 // 6.40% (5.40% base + 1.00% supplémentaire)
    }
    const params2025 = { 
      basicExemption: 3500, 
      maxPensionable: 71300,
      totalRate: 0.064 // 6.40% (5.40% base + 1.00% supplémentaire)
    }
    const params = taxYear === 2025 ? params2025 : params2024

    // Fonction pour calculer les détails d'une personne
    const calculatePersonDetails = (person: any, label: string) => {
      const workIncome = person.grossWorkIncome
      const workIncomeNum = typeof workIncome === 'number' ? workIncome : workIncome.toNumber()
      const isRetired = person.isRetired || person.age >= 65
      
      if (workIncomeNum <= 0 || isRetired) {
        return {
          steps: [
            { label: `${label} - ${language === 'fr' ? 'Aucune cotisation (retraité ou sans revenu)' : 'No contribution (retired or no income)'}`, value: formatAmount(0) }
          ],
          contribution: 0
        }
      }

      const steps = []

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Revenu de travail déclaré' : 'Declared work income'}`, 
        value: formatAmount(workIncomeNum)
      })

      if (workIncomeNum <= params.basicExemption) {
        steps.push({
          label: `${label} - ${language === 'fr' ? 'Revenu sous l\'exemption de base' : 'Income below basic exemption'}`,
          value: formatAmount(0)
        })
        return { steps, contribution: 0 }
      }

      // Calcul simplifié RRQ : (Revenu - Exemption) × 6.40%
      const pensionableEarnings = Math.min(workIncomeNum, params.maxPensionable) - params.basicExemption
      const totalContribution = pensionableEarnings * params.totalRate
      const isAtMax = workIncomeNum >= params.maxPensionable

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Exemption de base' : 'Basic exemption'}`, 
        value: formatAmount(params.basicExemption)
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Maximum des gains ouvrant droit à pension (' + taxYear + ')' : 'Maximum pensionable earnings (' + taxYear + ')'}`, 
        value: formatAmount(params.maxPensionable)
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Gains ouvrant droit à pension' : 'Pensionable earnings'}`,
        value: formatAmount(pensionableEarnings) + (isAtMax ? (language === 'fr' ? ' (plafonné)' : ' (capped)') : '')
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Taux employé RRQ (' + taxYear + ')' : 'RRQ employee rate (' + taxYear + ')'}`, 
        value: formatPercent(params.totalRate) + (language === 'fr' ? ' (5,40% + 1,00%)' : ' (5.40% + 1.00%)')
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Cotisation RRQ' : 'RRQ contribution'}`,
        value: formatAmount(totalContribution)
      })

      return { steps, contribution: totalContribution }
    }

    // Calculer pour la personne principale
    const adult1Label = language === 'fr' ? 'Adulte 1' : 'Adult 1'
    const person1Details = calculatePersonDetails(household.primaryPerson, adult1Label)
    
    let calculationSteps = [...person1Details.steps]
    let totalContribution = person1Details.contribution

    // Si c'est un couple, calculer pour le conjoint aussi
    if (household.spouse) {
      const adult2Label = language === 'fr' ? 'Adulte 2' : 'Adult 2' 
      const person2Details = calculatePersonDetails(household.spouse, adult2Label)
      
      calculationSteps.push(...person2Details.steps)
      totalContribution += person2Details.contribution
      
      // Ajouter le total
      calculationSteps.push({
        label: language === 'fr' ? 'Total cotisations RRQ pour le couple' : 'Total QPP contributions for couple',
        value: formatAmount(totalContribution)
      })
    }

    // Ajouter des références web
    const webReferences = language === 'fr' ? [
      {
        title: 'Régie des rentes du Québec - Cotisations au RRQ',
        url: 'https://www.rrq.gouv.qc.ca/fr/programmes/regime_rentes/cotisations/Pages/cotisations.aspx'
      },
      {
        title: 'Revenu Québec - Cotisations au RRQ pour les employeurs',
        url: 'https://www.revenuquebec.ca/fr/entreprises/retenues-et-cotisations-de-lemployeur/calculer-les-retenues-et-les-cotisations/cotisations-au-regime-de-rentes-du-quebec/'
      },
      {
        title: 'Gouvernement du Canada - Prestations du RRQ/RPC',
        url: 'https://www.canada.ca/fr/services/prestations/pensionspubliques/rpc.html'
      }
    ] : [
      {
        title: 'Régie des rentes du Québec - QPP contributions',
        url: 'https://www.rrq.gouv.qc.ca/en/programmes/regime_rentes/cotisations/Pages/cotisations.aspx'
      },
      {
        title: 'Revenu Québec - QPP contributions for employers',
        url: 'https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/quebec-pension-plan-contributions/'
      },
      {
        title: 'Government of Canada - QPP/CPP benefits',
        url: 'https://www.canada.ca/en/services/benefits/publicpensions/cpp.html'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))
    
    return {
      name: language === 'fr' ? 'Régime de rentes du Québec (RRQ)' : 'Quebec Pension Plan (QPP)',
      description: language === 'fr' 
        ? 'Régime public d\'assurance qui offre une protection financière de base lors de la retraite, du décès ou en cas d\'invalidité. Cotisation obligatoire sur les revenus d\'emploi au-dessus de l\'exemption de base.'
        : 'Public insurance plan that provides basic financial protection upon retirement, death or in case of disability. Mandatory contribution on employment income above the basic exemption.',
      formula: '',
      currentValue: totalContribution,
      parameters: calculationSteps
    }
  }

  // Génère les détails dynamiques du RQAP basés sur les données réelles
  const getRQAPDetails = (): ProgramDetail | null => {
    if (!household) return null
    
    // Paramètres officiels selon l'année
    const params2024 = { 
      employeeRate: 0.00494, // 0.494%
      maxInsurable: 94000,
      minEarnings: 2000
    }
    const params2025 = { 
      employeeRate: 0.00494, // 0.494%
      maxInsurable: 98000,
      minEarnings: 2000
    }
    const params = taxYear === 2025 ? params2025 : params2024

    // Fonction pour calculer les détails d'une personne
    const calculatePersonDetails = (person: any, label: string) => {
      const workIncome = person.grossWorkIncome
      const workIncomeNum = typeof workIncome === 'number' ? workIncome : workIncome.toNumber()
      const isRetired = person.isRetired || person.age >= 65
      
      if (workIncomeNum <= 0 || isRetired || workIncomeNum < params.minEarnings) {
        const reason = isRetired 
          ? (language === 'fr' ? 'Aucune cotisation (retraité)' : 'No contribution (retired)')
          : workIncomeNum < params.minEarnings
          ? (language === 'fr' ? 'Revenu sous le minimum requis' : 'Income below minimum required')
          : (language === 'fr' ? 'Aucun revenu de travail' : 'No work income')
        
        return {
          steps: [
            { label: `${label} - ${reason}`, value: formatAmount(0) }
          ],
          contribution: 0
        }
      }

      const steps = []
      
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Revenu de travail déclaré' : 'Declared work income'}`, 
        value: formatAmount(workIncomeNum)
      })

      // Calcul RQAP : Revenu assurable × 0.494%
      const insurableEarnings = Math.min(workIncomeNum, params.maxInsurable)
      const contribution = insurableEarnings * params.employeeRate
      const isAtMax = workIncomeNum >= params.maxInsurable

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Minimum de rémunération' : 'Minimum remuneration'}`, 
        value: formatAmount(params.minEarnings)
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Maximum de la rémunération assurable (' + taxYear + ')' : 'Maximum insurable remuneration (' + taxYear + ')'}`, 
        value: formatAmount(params.maxInsurable)
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Rémunération assurable' : 'Insurable remuneration'}`,
        value: formatAmount(insurableEarnings) + (isAtMax ? (language === 'fr' ? ' (plafonnée)' : ' (capped)') : '')
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Taux employé RQAP (' + taxYear + ')' : 'QPIP employee rate (' + taxYear + ')'}`, 
        value: formatPercent(params.employeeRate)
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Cotisation RQAP' : 'QPIP contribution'}`,
        value: formatAmount(contribution)
      })

      return { steps, contribution }
    }

    // Calculer pour la personne principale
    const adult1Label = language === 'fr' ? 'Adulte 1' : 'Adult 1'
    const person1Details = calculatePersonDetails(household.primaryPerson, adult1Label)
    
    let calculationSteps = [...person1Details.steps]
    let totalContribution = person1Details.contribution

    // Si c'est un couple, calculer pour le conjoint aussi
    if (household.spouse) {
      const adult2Label = language === 'fr' ? 'Adulte 2' : 'Adult 2' 
      const person2Details = calculatePersonDetails(household.spouse, adult2Label)
      
      calculationSteps.push(...person2Details.steps)
      totalContribution += person2Details.contribution
      
      // Ajouter le total
      calculationSteps.push({
        label: language === 'fr' ? 'Total cotisations RQAP pour le couple' : 'Total QPIP contributions for couple',
        value: formatAmount(totalContribution)
      })
    }

    // Ajouter des références web
    const webReferences = language === 'fr' ? [
      {
        title: 'Revenu Québec - Régime québécois d\'assurance parentale',
        url: 'https://www.revenuquebec.ca/fr/entreprises/retenues-et-cotisations-de-lemployeur/calculer-les-retenues-et-les-cotisations/cotisations-au-regime-quebecois-dassurance-parentale/'
      },
      {
        title: 'Conseil de gestion de l\'assurance parentale - RQAP',
        url: 'https://www.cgap.gouv.qc.ca/publications/rapports-annuels/'
      },
      {
        title: 'Gouvernement du Québec - Assurance parentale',
        url: 'https://www.quebec.ca/famille-et-soutien-aux-personnes/aide-financiere/regime-quebecois-assurance-parentale'
      }
    ] : [
      {
        title: 'Revenu Québec - Quebec parental insurance plan',
        url: 'https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/quebec-parental-insurance-plan-contributions/'
      },
      {
        title: 'Conseil de gestion de l\'assurance parentale - QPIP',
        url: 'https://www.cgap.gouv.qc.ca/publications/rapports-annuels/'
      },
      {
        title: 'Government of Quebec - Parental insurance',
        url: 'https://www.quebec.ca/en/family-and-support-for-individuals/financial-assistance/quebec-parental-insurance-plan'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))
    
    return {
      name: language === 'fr' ? 'Régime québécois d\'assurance parentale (RQAP)' : 'Quebec Parental Insurance Plan (QPIP)',
      description: language === 'fr' 
        ? 'Régime qui offre des prestations de maternité, de paternité, parentales et d\'adoption aux parents québécois. Cotisation obligatoire pour tous les travailleurs du Québec.'
        : 'Plan that provides maternity, paternity, parental and adoption benefits to Quebec parents. Mandatory contribution for all Quebec workers.',
      formula: '',
      currentValue: totalContribution,
      parameters: calculationSteps
    }
  }

  // Génère les détails dynamiques du FSS basés sur les données réelles
  const getFSSDetails = (): ProgramDetail | null => {
    if (!household) return null
    
    // Structure FSS officielle par paliers
    const structure2024 = {
      tier1: { min: 0, max: 17630, description: 'Aucune cotisation' },
      tier2: { min: 17630, max: 32630, description: '1% de l\'excédent' },
      tier3: { min: 32630, max: 61315, description: '150$ fixe' },
      tier4: { min: 61315, max: 146315, description: '150$ + 1% de l\'excédent au-dessus de 61 315$' },
      tier5: { min: 146315, max: Infinity, description: '1 000$ fixe' }
    }
    
    const structure2025 = {
      tier1: { min: 0, max: 17500, description: 'Aucune cotisation' },
      tier2: { min: 17500, max: 32500, description: '1% de l\'excédent' },
      tier3: { min: 32500, max: 61000, description: '150$ fixe' },
      tier4: { min: 61000, max: 145000, description: '150$ + 1% de l\'excédent au-dessus de 61 000$' },
      tier5: { min: 145000, max: Infinity, description: '1 000$ fixe' }
    }
    const structure = taxYear === 2025 ? structure2025 : structure2024

    // Fonction pour calculer les détails d'une personne
    const calculatePersonDetails = (person: any, label: string) => {
      const retirementIncome = person.grossRetirementIncome
      const retirementIncomeNum = typeof retirementIncome === 'number' ? retirementIncome : retirementIncome.toNumber()
      const isRetired = person.isRetired || person.age >= 65
      const age = person.age
      
      if (!isRetired || age < 65) {
        return {
          steps: [
            { label: `${label} - ${language === 'fr' ? 'Non applicable (moins de 65 ans)' : 'Not applicable (under 65 years)'}`, value: formatAmount(0) }
          ],
          contribution: 0
        }
      }

      if (retirementIncomeNum <= 0) {
        return {
          steps: [
            { label: `${label} - ${language === 'fr' ? 'Aucune cotisation (sans revenu de retraite)' : 'No contribution (no retirement income)'}`, value: formatAmount(0) }
          ],
          contribution: 0
        }
      }

      const steps = []
      
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Âge' : 'Age'}`, 
        value: `${age} ${language === 'fr' ? 'ans' : 'years'}`
      })
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Revenu de retraite déclaré' : 'Declared retirement income'}`, 
        value: formatAmount(retirementIncomeNum)
      })

      // Détecter le palier et calculer la contribution
      let contribution = 0
      let tierUsed = ''

      // Identifier le palier et calculer
      for (const [tierKey, tier] of Object.entries(structure)) {
        if (retirementIncomeNum >= tier.min && retirementIncomeNum <= tier.max) {
          tierUsed = tierKey
          
          steps.push({ 
            label: `${label} - ${language === 'fr' ? 'Palier applicable' : 'Applicable tier'}`, 
            value: `${formatAmount(tier.min)} - ${tier.max === Infinity ? '∞' : formatAmount(tier.max)}`
          })
          steps.push({ 
            label: `${label} - ${language === 'fr' ? 'Méthode de calcul' : 'Calculation method'}`, 
            value: language === 'fr' ? tier.description : tier.description // TODO: traduire si nécessaire
          })

          // Calculs selon le palier
          if (tierKey === 'tier1') {
            contribution = 0
          } else if (tierKey === 'tier2') {
            const excess = retirementIncomeNum - tier.min
            contribution = excess * 0.01
            steps.push({ 
              label: `${label} - ${language === 'fr' ? 'Revenu excédentaire' : 'Excess income'}`, 
              value: formatAmount(excess)
            })
            steps.push({ 
              label: `${label} - ${language === 'fr' ? 'Taux appliqué' : 'Applied rate'}`, 
              value: formatPercent(0.01)
            })
          } else if (tierKey === 'tier3') {
            contribution = 150
          } else if (tierKey === 'tier4') {
            const excess = retirementIncomeNum - tier.min
            contribution = 150 + (excess * 0.01)
            steps.push({ 
              label: `${label} - ${language === 'fr' ? 'Contribution de base' : 'Base contribution'}`, 
              value: formatAmount(150)
            })
            steps.push({ 
              label: `${label} - ${language === 'fr' ? 'Revenu excédentaire au-dessus de ' + formatAmount(tier.min) : 'Excess income above ' + formatAmount(tier.min)}`, 
              value: formatAmount(excess)
            })
            steps.push({ 
              label: `${label} - ${language === 'fr' ? 'Taux sur excédent' : 'Rate on excess'}`, 
              value: formatPercent(0.01)
            })
            steps.push({ 
              label: `${label} - ${language === 'fr' ? 'Contribution sur excédent' : 'Contribution on excess'}`, 
              value: formatAmount(excess * 0.01)
            })
          } else if (tierKey === 'tier5') {
            contribution = 1000
          }
          break
        }
      }

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Cotisation FSS' : 'FSS contribution'}`, 
        value: formatAmount(contribution)
      })

      return { steps, contribution }
    }

    // Calculer pour la personne principale
    const adult1Label = language === 'fr' ? 'Adulte 1' : 'Adult 1'
    const person1Details = calculatePersonDetails(household.primaryPerson, adult1Label)
    
    let calculationSteps = [...person1Details.steps]
    let totalContribution = person1Details.contribution

    // Si c'est un couple, calculer pour le conjoint aussi
    if (household.spouse) {
      const adult2Label = language === 'fr' ? 'Adulte 2' : 'Adult 2' 
      const person2Details = calculatePersonDetails(household.spouse, adult2Label)
      
      calculationSteps.push(...person2Details.steps)
      totalContribution += person2Details.contribution
      
      // Ajouter le total
      calculationSteps.push({
        label: language === 'fr' ? 'Total cotisations FSS pour le couple' : 'Total FSS contributions for couple',
        value: formatAmount(totalContribution)
      })
    }

    // Ajouter des références web
    const webReferences = language === 'fr' ? [
      {
        title: 'Guide Mesures Fiscales Sherbrooke - Cotisation au FSS par un particulier',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisation-fonds-services-sante-particulier/'
      },
      {
        title: 'Raymond Chabot Grant Thornton - Fonds des services de santé Québec',
        url: 'https://www.rcgt.com/fr/planiguide/modules/module-12-programmes-et-charges-sociales/fonds-des-services-de-sante-quebec/'
      },
      {
        title: 'Ministère des Finances du Québec - Paramètres du régime d\'impôt 2025',
        url: 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTFR_RegimeImpot2025.pdf'
      },
      {
        title: 'Revenu Québec - Cotisations des particuliers au FSS (Ligne 446)',
        url: 'https://www.revenuquebec.ca/fr/citoyens/declaration-de-revenus/produire-votre-declaration-de-revenus/comment-remplir-votre-declaration/aide-ligne-par-ligne/400-a-447-impot-sur-le-revenu-et-cotisations/ligne-446/'
      }
    ] : [
      {
        title: 'Tax Measures Guide Sherbrooke - Individual FSS contribution',
        url: 'https://cffp.recherche.usherbrooke.ca/en/tools-resources/tax-measures-guide/individual-health-services-fund-contribution/'
      },
      {
        title: 'Raymond Chabot Grant Thornton - Quebec Health Services Fund',
        url: 'https://www.rcgt.com/fr/planiguide/modules/module-12-programmes-et-charges-sociales/fonds-des-services-de-sante-quebec/'
      },
      {
        title: 'Quebec Ministry of Finance - 2025 Tax Regime Parameters',
        url: 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTFR_RegimeImpot2025.pdf'
      },
      {
        title: 'Revenu Québec - Individual contributions to the FSS (Line 446)',
        url: 'https://www.revenuquebec.ca/en/citizens/income-tax-return/paying-a-balance-due-or-receiving-a-refund/paying-contributions-and-premiums/individual-contributions-to-the-health-services-fund/'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))
    
    return {
      name: language === 'fr' ? 'Fonds des services de santé (FSS)' : 'Health Services Fund (HSF)',
      description: language === 'fr' 
        ? 'Contribution obligatoire des retraités de 65 ans et plus pour financer les services de santé au Québec. Calculée selon une structure progressive basée sur le revenu de retraite.'
        : 'Mandatory contribution from retirees aged 65 and over to fund health services in Quebec. Calculated using a progressive structure based on retirement income.',
      formula: '',
      currentValue: totalContribution,
      parameters: calculationSteps
    }
  }

  // Fonction helper pour formater les montants selon la langue avec 2 décimales
  const formatCurrencyAmount = (amount: number): string => {
    if (language === 'fr') {
      return `${amount.toLocaleString('fr-CA', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })} $`
    } else {
      return `$${amount.toLocaleString('en-CA', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`
    }
  }

  // Génère les détails dynamiques du RAMQ basés sur les données réelles
  const getRAMQDetails = (): ProgramDetail | null => {
    if (!household) return null
    
    // Paramètres RAMQ selon l'année
    const params2024 = {
      exemptionSingle: 19790,
      exemptionCouple: 32080,
      exemptionSingleOneChild: 32080,
      exemptionSingleMultipleChildren: 36185,
      exemptionCoupleOneChild: 36185,
      exemptionCoupleMultipleChildren: 39975,
      firstThreshold: 5000,
      baseRateSingle: 0.0747,
      additionalRateSingle: 0.1122,
      baseRateCouple: 0.0375,
      additionalRateCouple: 0.0562,
      baseMaxSingle: 373.50,
      baseMaxCouple: 186.75,
      maxContribution: 737.50
    }
    
    const params2025 = {
      exemptionSingle: 19790,
      exemptionCouple: 32080,
      exemptionSingleOneChild: 32080,
      exemptionSingleMultipleChildren: 36185,
      exemptionCoupleOneChild: 36185,
      exemptionCoupleMultipleChildren: 39975,
      firstThreshold: 5000,
      baseRateSingle: 0.0747,
      additionalRateSingle: 0.1122,
      baseRateCouple: 0.0375,
      additionalRateCouple: 0.0562,
      baseMaxSingle: 373.50,
      baseMaxCouple: 186.75,
      maxContribution: 744
    }
    
    const params = taxYear === 2025 ? params2025 : params2024
    
    // Calculer le revenu brut familial total
    let grossFamilyIncome = 0
    let numAdults = 1
    
    if (household.primaryPerson) {
      const primaryIncome = household.primaryPerson.isRetired 
        ? household.primaryPerson.grossRetirementIncome 
        : household.primaryPerson.grossWorkIncome
      grossFamilyIncome += typeof primaryIncome === 'number' ? primaryIncome : primaryIncome.toNumber()
    }
    
    if (household.spouse) {
      numAdults = 2
      const spouseIncome = household.spouse.isRetired
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
      grossFamilyIncome += typeof spouseIncome === 'number' ? spouseIncome : spouseIncome.toNumber()
    }
    
    // Déterminer le seuil d'exemption selon la situation familiale
    let exemptionThreshold: number
    const isCouple = numAdults === 2
    
    if (isCouple) {
      if (household.numChildren === 0) {
        exemptionThreshold = params.exemptionCouple
      } else if (household.numChildren === 1) {
        exemptionThreshold = params.exemptionCoupleOneChild
      } else {
        exemptionThreshold = params.exemptionCoupleMultipleChildren
      }
    } else {
      if (household.numChildren === 0) {
        exemptionThreshold = params.exemptionSingle
      } else if (household.numChildren === 1) {
        exemptionThreshold = params.exemptionSingleOneChild
      } else {
        exemptionThreshold = params.exemptionSingleMultipleChildren
      }
    }
    
    const calculationSteps: { label: string; value: string }[] = []
    
    // Étape 1: Revenu familial brut
    calculationSteps.push({
      label: language === 'fr' ? 'Revenu familial brut' : 'Gross family income',
      value: formatCurrencyAmount(grossFamilyIncome)
    })
    
    // Étape 2: Seuil d'exemption
    calculationSteps.push({
      label: language === 'fr' 
        ? `Seuil d'exemption (${isCouple ? 'couple' : 'célibataire'}${household.numChildren > 0 ? `, ${household.numChildren} enfant${household.numChildren > 1 ? 's' : ''}` : ''})`
        : `Exemption threshold (${isCouple ? 'couple' : 'single'}${household.numChildren > 0 ? `, ${household.numChildren} child${household.numChildren > 1 ? 'ren' : ''}` : ''})`,
      value: formatCurrencyAmount(exemptionThreshold)
    })
    
    // Étape 3: Revenu servant au calcul
    const incomeForCalculation = Math.max(0, grossFamilyIncome - exemptionThreshold)
    calculationSteps.push({
      label: language === 'fr' ? 'Revenu servant au calcul' : 'Income for calculation',
      value: `${formatCurrencyAmount(grossFamilyIncome)} - ${formatCurrencyAmount(exemptionThreshold)} = ${formatCurrencyAmount(incomeForCalculation)}`
    })
    
    if (incomeForCalculation <= 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Contribution finale' : 'Final contribution',
        value: formatCurrencyAmount(0)
      })
      return {
        name: language === 'fr' ? 'Régime d\'assurance médicaments du Québec' : 'Quebec Prescription Drug Insurance Plan',
        description: language === 'fr' 
          ? 'Cotisation calculée selon le revenu familial net. Dans ce cas, le revenu est sous le seuil d\'exemption.'
          : 'Contribution calculated based on net family income. In this case, income is below the exemption threshold.',
        formula: '',
        currentValue: 0,
        parameters: calculationSteps
      }
    }
    
    // Étape 4: Première tranche
    const rates = isCouple 
      ? { base: params.baseRateCouple, additional: params.additionalRateCouple, baseMax: params.baseMaxCouple }
      : { base: params.baseRateSingle, additional: params.additionalRateSingle, baseMax: params.baseMaxSingle }
    
    const firstTierIncome = Math.min(incomeForCalculation, params.firstThreshold)
    const firstTierContribution = firstTierIncome * rates.base
    
    calculationSteps.push({
      label: language === 'fr' ? 'Première tranche' : 'First bracket',
      value: `${formatCurrencyAmount(firstTierIncome)} × ${(rates.base * 100).toFixed(2).replace('.', language === 'fr' ? ',' : '.')} % = ${formatCurrencyAmount(firstTierContribution)}`
    })
    
    // Étape 5: Tranche additionnelle (si applicable)
    let additionalTierContribution = 0
    if (incomeForCalculation > params.firstThreshold) {
      const additionalTierIncome = incomeForCalculation - params.firstThreshold
      additionalTierContribution = additionalTierIncome * rates.additional
      
      calculationSteps.push({
        label: language === 'fr' ? 'Tranche additionnelle' : 'Additional bracket',
        value: `${formatCurrencyAmount(additionalTierIncome)} × ${(rates.additional * 100).toFixed(2).replace('.', language === 'fr' ? ',' : '.')} % = ${formatCurrencyAmount(additionalTierContribution)}`
      })
    }
    
    // Étape 6: Total avant plafond
    const totalBeforeCap = firstTierContribution + additionalTierContribution
    if (additionalTierContribution > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Total avant plafond' : 'Total before cap',
        value: `${formatCurrencyAmount(firstTierContribution)} + ${formatCurrencyAmount(additionalTierContribution)} = ${formatCurrencyAmount(totalBeforeCap)}`
      })
    }
    
    // Étape 7: Application du plafond
    const maxIndividualContribution = params.maxContribution
    const maxFamilyContribution = isCouple ? maxIndividualContribution * 2 : maxIndividualContribution
    const finalContribution = Math.min(totalBeforeCap, maxFamilyContribution)
    
    const isCapped = totalBeforeCap > maxFamilyContribution
    calculationSteps.push({
      label: language === 'fr' ? 'Contribution finale' : 'Final contribution',
      value: isCapped 
        ? `min(${formatCurrencyAmount(totalBeforeCap)}, ${formatCurrencyAmount(maxFamilyContribution)}) = ${formatCurrencyAmount(finalContribution)} ${language === 'fr' ? '(plafonnée)' : '(capped)'}`
        : formatCurrencyAmount(finalContribution)
    })
    
    return {
      name: language === 'fr' ? 'Régime d\'assurance médicaments du Québec' : 'Quebec Prescription Drug Insurance Plan',
      description: language === 'fr' 
        ? 'Régime qui assure l\'accès aux médicaments d\'ordonnance pour les personnes qui ne sont pas couvertes par un régime privé.'
        : 'Plan that ensures access to prescription drugs for people not covered by a private plan.',
      formula: '',
      currentValue: finalContribution,
      parameters: calculationSteps
    }
  }

  // Génère les détails dynamiques de l'impôt du Québec
  const getQcTaxDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Paramètres fiscaux selon l'année
    const params2024 = {
      brackets: [
        { min: 0, max: 49275, rate: 0.14 },
        { min: 49275, max: 98540, rate: 0.19 },
        { min: 98540, max: 119910, rate: 0.24 },
        { min: 119910, max: 999999999, rate: 0.2575 }
      ],
      credits: {
        basic: 17183,
        age65: 3395,
        pension: 3017,
        livingAlone: 1890
      }
    }
    
    const params2025 = {
      brackets: [
        { min: 0, max: 51780, rate: 0.14 },
        { min: 51780, max: 103545, rate: 0.19 },
        { min: 103545, max: 126000, rate: 0.24 },
        { min: 126000, max: 999999999, rate: 0.2575 }
      ],
      credits: {
        basic: 18056,
        age65: 3569,
        pension: 3172,
        livingAlone: 1985
      }
    }
    
    const params = taxYear === 2025 ? params2025 : params2024

    // Fonction pour calculer les détails d'une personne
    const calculatePersonDetails = (person: any, label: string, contributions?: { rrq?: number, ei?: number, rqap?: number }) => {
      const grossIncome = person.isRetired 
        ? (typeof person.grossRetirementIncome === 'number' ? person.grossRetirementIncome : person.grossRetirementIncome.toNumber())
        : (typeof person.grossWorkIncome === 'number' ? person.grossWorkIncome : person.grossWorkIncome.toNumber())

      if (grossIncome <= 0) {
        return {
          steps: [
            { label: `${label} - ${language === 'fr' ? 'Aucun revenu imposable' : 'No taxable income'}`, value: formatAmount(0) }
          ],
          tax: 0
        }
      }

      const steps = []
      
      // 1. Revenu brut
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Revenu brut déclaré' : 'Gross income declared'}`, 
        value: formatAmount(grossIncome)
      })

      // 2. Déductions (cotisations sociales)
      let totalDeductions = 0
      if (contributions) {
        const deductions = []
        if (contributions.rrq && contributions.rrq > 0) {
          deductions.push({ name: 'RRQ', amount: contributions.rrq })
          totalDeductions += contributions.rrq
        }
        if (contributions.ei && contributions.ei > 0) {
          deductions.push({ name: 'AE', amount: contributions.ei })
          totalDeductions += contributions.ei
        }
        if (contributions.rqap && contributions.rqap > 0) {
          deductions.push({ name: 'RQAP', amount: contributions.rqap })
          totalDeductions += contributions.rqap
        }
        
        if (deductions.length > 0) {
          steps.push({ 
            label: `${label} - ${language === 'fr' ? 'Déductions (cotisations sociales)' : 'Deductions (social contributions)'}`, 
            value: `-${formatAmount(totalDeductions)}`
          })
          deductions.forEach(ded => {
            steps.push({ 
              label: `  • ${ded.name}`, 
              value: `-${formatAmount(ded.amount)}`
            })
          })
        }
      }

      // 3. Revenu imposable
      const taxableIncome = Math.max(0, grossIncome - totalDeductions)
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Revenu imposable' : 'Taxable income'}`, 
        value: formatAmount(taxableIncome)
      })

      // 4. Calcul de l'impôt par paliers
      let taxBeforeCredits = 0
      let previousMax = 0

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Calcul par paliers fiscaux' : 'Tax calculation by brackets'}`, 
        value: ''
      })

      for (const bracket of params.brackets) {
        if (taxableIncome <= previousMax) break
        
        const taxableInBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min)
        if (taxableInBracket > 0) {
          const taxInBracket = taxableInBracket * bracket.rate
          taxBeforeCredits += taxInBracket
          
          const bracketLabel = bracket.max === 999999999 
            ? `${formatAmount(bracket.min)}${language === 'fr' ? '$ et plus' : '$ and above'}`
            : `${formatAmount(bracket.min)}$ - ${formatAmount(bracket.max)}$`
          
          steps.push({ 
            label: `  • ${bracketLabel} à ${(bracket.rate * 100).toFixed(1)}%`, 
            value: `${formatAmount(taxableInBracket)} × ${(bracket.rate * 100).toFixed(1)}% = ${formatAmount(taxInBracket)}`
          })
        }
        previousMax = bracket.max
      }

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Impôt avant crédits' : 'Tax before credits'}`, 
        value: formatAmount(taxBeforeCredits)
      })

      // 5. Crédits d'impôt non remboursables
      let totalCredits = 0
      const lowestRate = params.brackets[0].rate

      // Crédit personnel de base
      const basicCredit = params.credits.basic * lowestRate
      totalCredits += basicCredit
      steps.push({ 
        label: `  • ${language === 'fr' ? 'Crédit personnel de base' : 'Basic personal credit'}`, 
        value: `${formatAmount(params.credits.basic)} × ${(lowestRate * 100).toFixed(1)}% = ${formatAmount(basicCredit)}`
      })

      // Crédit d'âge (65 ans et plus)
      if (person.age >= 65) {
        const ageCredit = params.credits.age65 * lowestRate
        totalCredits += ageCredit
        steps.push({ 
          label: `  • ${language === 'fr' ? 'Crédit d\'âge (65 ans et plus)' : 'Age credit (65 years and over)'}`, 
          value: `${formatAmount(params.credits.age65)} × ${(lowestRate * 100).toFixed(1)}% = ${formatAmount(ageCredit)}`
        })
      }

      // Crédit de pension (retraités)
      if (person.isRetired && person.grossRetirementIncome > 0) {
        const maxPensionAmount = params.credits.pension
        const eligibleAmount = Math.min(grossIncome, maxPensionAmount)
        const pensionCredit = eligibleAmount * lowestRate
        totalCredits += pensionCredit
        steps.push({ 
          label: `  • ${language === 'fr' ? 'Crédit de pension' : 'Pension credit'}`, 
          value: `${formatAmount(eligibleAmount)} × ${(lowestRate * 100).toFixed(1)}% = ${formatAmount(pensionCredit)}`
        })
      }

      // Crédit pour personne vivant seule
      if (!household.spouse && household.numChildren === 0) {
        const livingAloneCredit = params.credits.livingAlone * lowestRate
        totalCredits += livingAloneCredit
        steps.push({ 
          label: `  • ${language === 'fr' ? 'Crédit pour personne vivant seule' : 'Living alone credit'}`, 
          value: `${formatAmount(params.credits.livingAlone)} × ${(lowestRate * 100).toFixed(1)}% = ${formatAmount(livingAloneCredit)}`
        })
      }

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Total des crédits d\'impôt' : 'Total tax credits'}`, 
        value: formatAmount(totalCredits)
      })

      // 6. Impôt net
      const netTax = Math.max(0, taxBeforeCredits - totalCredits)
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Impôt du Québec net' : 'Net Quebec tax'}`, 
        value: formatAmount(netTax)
      })

      return { steps, tax: netTax }
    }

    // Calculer pour la personne principale
    const primaryContributions = results?.cotisations ? {
      rrq: results.cotisations.rrq ? (typeof results.cotisations.rrq === 'number' ? results.cotisations.rrq : results.cotisations.rrq.toNumber()) : 0,
      ei: results.cotisations.assurance_emploi ? (typeof results.cotisations.assurance_emploi === 'number' ? results.cotisations.assurance_emploi : results.cotisations.assurance_emploi.toNumber()) : 0,
      rqap: results.cotisations.rqap ? (typeof results.cotisations.rqap === 'number' ? results.cotisations.rqap : results.cotisations.rqap.toNumber()) : 0,
    } : undefined

    const primaryResult = calculatePersonDetails(
      household.primaryPerson, 
      language === 'fr' ? 'Personne principale' : 'Primary person',
      primaryContributions
    )

    let calculationSteps = [...primaryResult.steps]
    let totalTax = primaryResult.tax

    // Calculer pour le conjoint si applicable
    if (household.spouse) {
      const spouseResult = calculatePersonDetails(
        household.spouse, 
        language === 'fr' ? 'Conjoint' : 'Spouse',
        primaryContributions // Simplification: mêmes cotisations pour les deux
      )
      calculationSteps.push(...spouseResult.steps)
      totalTax += spouseResult.tax
    }

    // Ajouter le total
    calculationSteps.push({ 
      label: language === 'fr' ? 'TOTAL - Impôt du Québec (ménage)' : 'TOTAL - Quebec Tax (household)', 
      value: formatAmount(totalTax),
      isTotal: true 
    })

    // Références officielles
    const webReferences = language === 'fr' ? [
      {
        title: 'Revenu Québec - Barème d\'imposition du Québec',
        url: 'https://www.revenuquebec.ca/fr/citoyens/declaration-de-revenus/produire-votre-declaration-de-revenus/report-dimpot-et-remboursement/bareme-dimposition/'
      },
      {
        title: 'Ministère des Finances du Québec - Paramètres fiscaux ' + taxYear,
        url: taxYear === 2025 
          ? 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTFR_RegimeImpot2025.pdf'
          : 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTFR_RegimeImpot2024.pdf'
      },
      {
        title: 'Revenu Québec - Crédits d\'impôt non remboursables',
        url: 'https://www.revenuquebec.ca/fr/citoyens/credits-dimpot/credits-dimpot-non-remboursables/'
      }
    ] : [
      {
        title: 'Revenu Québec - Quebec Tax Schedule',
        url: 'https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/report-and-receipt/tax-schedule/'
      },
      {
        title: 'Quebec Ministry of Finance - Tax Regime Parameters ' + taxYear,
        url: taxYear === 2025 
          ? 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTEN_RegimeImpot2025.pdf'
          : 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTEN_RegimeImpot2024.pdf'
      },
      {
        title: 'Revenu Québec - Non-refundable tax credits',
        url: 'https://www.revenuquebec.ca/en/citizens/tax-credits/non-refundable-tax-credits/'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))

    return {
      name: language === 'fr' ? 'Impôt du Québec' : 'Quebec Income Tax',
      description: language === 'fr' 
        ? 'Impôt sur le revenu provincial calculé selon les paliers fiscaux du Québec. Inclut les crédits d\'impôt non remboursables et les déductions pour cotisations sociales.'
        : 'Provincial income tax calculated according to Quebec tax brackets. Includes non-refundable tax credits and deductions for social contributions.',
      formula: '',
      currentValue: formatAmount(totalTax),
      parameters: calculationSteps
    }
  }

  // Génère les détails dynamiques de l'assurance-emploi basés sur les données réelles
  const getEmploymentInsuranceDetails = (): ProgramDetail | null => {
    if (!household) return null
    
    // Paramètres officiels selon l'année
    const params2024 = { rate: 0.0132, maxInsurable: 63200, maxContribution: 834.24 }
    const params2025 = { rate: 0.0131, maxInsurable: 65700, maxContribution: 860.67 }
    const params = taxYear === 2025 ? params2025 : params2024

    // Fonction pour calculer les détails d'une personne
    const calculatePersonDetails = (person: any, label: string) => {
      const workIncome = person.grossWorkIncome
      const workIncomeNum = typeof workIncome === 'number' ? workIncome : workIncome.toNumber()
      const isRetired = person.isRetired || person.age >= 65
      
      if (workIncomeNum <= 0 || isRetired) {
        return {
          steps: [
            { label: `${label} - ${language === 'fr' ? 'Aucune cotisation (retraité ou sans revenu)' : 'No contribution (retired or no income)'}`, value: formatAmount(0) }
          ],
          contribution: 0
        }
      }

      const insurableIncome = Math.min(workIncomeNum, params.maxInsurable)
      const contribution = Math.min(insurableIncome * params.rate, params.maxContribution)
      const isAtMax = workIncomeNum >= params.maxInsurable

      const steps = [
        { 
          label: `${label} - ${language === 'fr' ? 'Revenu de travail déclaré' : 'Declared work income'}`, 
          value: formatAmount(workIncomeNum)
        },
        { 
          label: `${label} - ${language === 'fr' ? 'Maximum assurable (' + taxYear + ')' : 'Maximum insurable (' + taxYear + ')'}`, 
          value: formatAmount(params.maxInsurable)
        },
        { 
          label: `${label} - ${language === 'fr' ? 'Revenu assurable' : 'Insurable income'}`,
          value: formatAmount(insurableIncome) + (isAtMax ? (language === 'fr' ? ' (plafonné)' : ' (capped)') : '')
        },
        { 
          label: `${label} - ${language === 'fr' ? 'Taux employé Québec (' + taxYear + ')' : 'Quebec employee rate (' + taxYear + ')'}`, 
          value: formatPercent(params.rate)
        },
        { 
          label: `${label} - ${language === 'fr' ? 'Cotisation calculée' : 'Calculated contribution'}`,
          value: formatAmount(insurableIncome * params.rate)
        }
      ]

      if (isAtMax) {
        steps.push({ 
          label: `${label} - ${language === 'fr' ? 'Cotisation finale' : 'Final contribution'}`,
          value: formatAmount(params.maxContribution)
        })
      }

      return { steps, contribution }
    }

    // Calculer pour la personne principale
    const adult1Label = language === 'fr' ? 'Adulte 1' : 'Adult 1'
    const person1Details = calculatePersonDetails(household.primaryPerson, adult1Label)
    
    let calculationSteps = [...person1Details.steps]
    let totalContribution = person1Details.contribution

    // Si c'est un couple, calculer pour le conjoint aussi
    if (household.spouse) {
      const adult2Label = language === 'fr' ? 'Adulte 2' : 'Adult 2' 
      const person2Details = calculatePersonDetails(household.spouse, adult2Label)
      
      calculationSteps.push(...person2Details.steps)
      totalContribution += person2Details.contribution
      
      // Ajouter le total
      calculationSteps.push({
        label: language === 'fr' ? 'Total cotisations pour le couple' : 'Total contributions for couple',
        value: formatAmount(totalContribution)
      })
    }

    // Ajouter des références web
    const webReferences = language === 'fr' ? [
      {
        title: 'Agence du revenu du Canada - Taux de cotisation à l\'AE et maximums',
        url: 'https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/retenues-paie/retenues-paie-cotisations/assurance-emploi-ae/taux-cotisation-a-ae-maximums.html'
      },
      {
        title: 'Gouvernement du Canada - Assurance-emploi',
        url: 'https://www.canada.ca/fr/services/prestations/ae.html'
      },
      {
        title: 'Service Canada - Comment fonctionne l\'assurance-emploi',
        url: 'https://www.canada.ca/fr/emploi-developpement-social/programmes/assurance-emploi/ae-liste/rapports/comment-fonctionne.html'
      }
    ] : [
      {
        title: 'Canada Revenue Agency - EI contribution rates and maximums',
        url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-contribution-rates-maximums.html'
      },
      {
        title: 'Government of Canada - Employment Insurance',
        url: 'https://www.canada.ca/en/services/benefits/ei.html'
      },
      {
        title: 'Service Canada - How Employment Insurance works',
        url: 'https://www.canada.ca/en/employment-social-development/programmes/ei/ei-list/reports/how-it-works.html'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))
    
    return {
      name: language === 'fr' ? 'Assurance-emploi (AE)' : 'Employment Insurance (EI)',
      description: language === 'fr' 
        ? 'Programme qui offre une aide financière temporaire aux travailleurs canadiens qui perdent leur emploi sans en être responsables. Au Québec, le taux est réduit en raison du RQAP.'
        : 'Program that provides temporary financial assistance to Canadian workers who lose their job through no fault of their own. In Quebec, the rate is reduced due to QPIP.',
      formula: '', // Plus utilisé car nous avons le détail complet dans les paramètres
      currentValue: totalContribution,
      parameters: calculationSteps
    }
  }
  // Affiche le programme épinglé en priorité, sinon le programme survolé
  const displayedProgram = pinnedProgram || hoveredProgram
  const currentProgram = displayedProgram ? (
    displayedProgram === 'assurance_emploi' 
      ? getEmploymentInsuranceDetails()
      : displayedProgram === 'rrq'
      ? getRRQDetails()
      : displayedProgram === 'rqap'
      ? getRQAPDetails()
      : displayedProgram === 'fss'
      ? getFSSDetails()
      : displayedProgram === 'ramq'
      ? getRAMQDetails()
      : displayedProgram === 'quebec_tax'
      ? getQcTaxDetails()
      : programs[displayedProgram as keyof typeof programs]
  ) : null

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey)
    } else {
      newExpanded.add(sectionKey)
    }
    setExpandedSections(newExpanded)
  }

  // Fonction pour épingler/désépingler un programme
  const handleProgramClick = (programKey: string) => {
    if (pinnedProgram === programKey) {
      // Désépingler si déjà épinglé
      setPinnedProgram(null)
    } else {
      // Épingler le programme
      setPinnedProgram(programKey)
    }
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
      case 'rqap':
        return results.cotisations.rqap instanceof Decimal ? -results.cotisations.rqap.toNumber() : 0
      case 'fss':
        return results.cotisations.fss instanceof Decimal ? -results.cotisations.fss.toNumber() : 0
      case 'ramq':
        return results.cotisations.ramq instanceof Decimal ? -results.cotisations.ramq.toNumber() : 0
      case 'quebec_tax':
        return results.taxes?.quebec instanceof Decimal ? -results.taxes.quebec.toNumber() : 0
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
        { key: 'impot_quebec', label: language === 'fr' ? 'Impôt sur le revenu des particuliers' : 'Personal Income Tax', value: getValueForProgram('quebec_tax') },
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
      value: (() => {
        // Calculer la somme de toutes les cotisations
        const cotisations = [
          getValueForProgram('assurance_emploi'),
          getValueForProgram('rqap'), 
          getValueForProgram('rrq'),
          getValueForProgram('fss'),
          getValueForProgram('ramq')
        ]
        return cotisations.reduce((sum, value) => sum + value, 0)
      })(),
      items: [
        { key: 'assurance_emploi', label: language === 'fr' ? 'Assurance-emploi' : 'Employment Insurance', value: getValueForProgram('assurance_emploi') },
        { key: 'rqap', label: language === 'fr' ? 'Régime québécois d\'assurance parentale' : 'Quebec Parental Insurance Plan', value: getValueForProgram('rqap') },
        { key: 'rrq', label: language === 'fr' ? 'Régime de rentes du Québec' : 'Quebec Pension Plan', value: getValueForProgram('rrq') },
        { key: 'fss', label: language === 'fr' ? 'Fonds des services de santé' : 'Health Services Fund', value: getValueForProgram('fss') },
        { key: 'ramq', label: language === 'fr' ? 'Régime d\'assurance médicaments du Québec' : 'Quebec Prescription Drug Insurance Plan', value: getValueForProgram('ramq') }
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
                    <td className="px-4 py-2 font-bold" style={{ color: '#000000' }}>
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
                    <td className="px-4 py-2 text-right font-bold" style={{ color: '#000000' }}>
                      {section.key === 'revenu_disponible' ? (
                        <span className="font-bold" style={{ color: '#000000' }}>{formatCurrency(section.value)}</span>
                      ) : (
                        !section.standalone && formatCurrency(section.value)
                      )}
                    </td>
                  </tr>
                  
                  {/* Section Items (only show if expanded or standalone) */}
                  {(section.standalone || isSectionExpanded(section.key)) && section.items.map((item) => (
                    <tr
                      key={item.key}
                      className={`
                        hover:bg-blue-50 border-t border-gray-200 transition-colors cursor-pointer
                        ${pinnedProgram === item.key ? 'bg-blue-100 ring-2 ring-blue-300' : ''}
                      `}
                      onMouseEnter={() => setHoveredProgram(item.key)}
                      onMouseLeave={() => setHoveredProgram(null)}
                      onClick={() => handleProgramClick(item.key)}
                    >
                      <td className="px-4 py-2 pl-8 flex items-center justify-between" style={{ color: '#000000' }}>
                        <span>{item.label}</span>
                        {/* Indicateur d'épinglage pour assurance-emploi, rrq, rqap, fss et ramq */}
                        {(item.key === 'assurance_emploi' || item.key === 'rrq' || item.key === 'rqap' || item.key === 'fss' || item.key === 'ramq') && (
                          <div className="ml-2">
                            {pinnedProgram === item.key ? (
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right" style={{ color: '#000000' }}>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-black">{currentProgram.name}</h4>
                {(displayedProgram === 'assurance_emploi' || displayedProgram === 'rrq' || displayedProgram === 'rqap' || displayedProgram === 'fss' || displayedProgram === 'ramq') && (
                  <div className="flex items-center text-xs" style={{ color: '#000000' }}>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {language === 'fr' 
                      ? (pinnedProgram === displayedProgram ? 'Épinglé - Cliquez pour désépingler' : 'Cliquez pour épingler')
                      : (pinnedProgram === displayedProgram ? 'Pinned - Click to unpin' : 'Click to pin')
                    }
                  </div>
                )}
              </div>
              
              <div>
                <p style={{ color: '#000000', lineHeight: '1.3' }} className="text-sm">{currentProgram.description}</p>
              </div>
              
              
              <div>
                <h5 className="font-semibold mb-2" style={{ color: '#000000' }}>
                  {language === 'fr' ? 'Détail du calcul' : 'Calculation Details'}
                </h5>
                <div className="space-y-1 bg-gray-50 p-3 rounded">
                  {currentProgram.parameters.filter(param => !(param as any).isReference).map((param, index) => {
                    // Détecter la section total pour la mettre en évidence
                    const isTotalSection = param.label.includes('Total') || param.label.includes('couple')
                    
                    return (
                      <div key={index} className="flex justify-between items-center" style={{ lineHeight: '1.3' }}>
                        <span className={`text-sm ${isTotalSection ? 'font-bold' : ''}`} style={{ color: '#000000' }}>
                          {param.label}
                        </span>
                        <span className={`font-medium text-sm ${isTotalSection ? 'font-bold' : ''}`} style={{ color: '#000000' }}>
                          {param.value}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Section Références */}
              {currentProgram.parameters.some(param => (param as any).isReference) && (
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: '#000000' }}>
                    {language === 'fr' ? 'Références officielles' : 'Official References'}
                  </h5>
                  <div className="space-y-1">
                    {currentProgram.parameters.filter(param => (param as any).isReference).map((param, index) => (
                      <div key={index} className="text-sm flex items-start" style={{ lineHeight: '1.3' }}>
                        <span className="mr-2 mt-1" style={{ color: '#000000' }}>•</span>
                        <a 
                          href={param.value} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: '#2563EB' }}
                        >
                          {param.label}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full" style={{ color: '#000000' }}>
              <div className="text-center space-y-3">
                <div className="text-4xl mb-2">👆</div>
                <p className="font-medium">{language === 'fr' ? 
                  'Survolez un élément du tableau pour voir ses détails' : 
                  'Hover over a table item to see its details'
                }</p>
                <div className="text-sm space-y-1" style={{ color: '#000000' }}>
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    <span>{language === 'fr' ? 
                      'Cliquez sur "Assurance-emploi", "RRQ", "RQAP", "FSS" ou "RAMQ" pour épingler les détails' : 
                      'Click on "Employment Insurance", "QPP", "QPIP", "HSF" or "RAMQ" to pin details'
                    }</span>
                  </div>
                  <p>{language === 'fr' ? 
                    'Une fois épinglé, les détails restent visibles pendant que vous modifiez les paramètres' : 
                    'Once pinned, details stay visible while you modify parameters'
                  }</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}