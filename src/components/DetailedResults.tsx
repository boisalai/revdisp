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
    },
    fournitures_scolaires: (() => {
      const params2023 = { amount: 115 }
      const params2024 = { amount: 121 }
      const params2025 = { amount: 124 }
      const params = taxYear === 2023 ? params2023 : (taxYear === 2025 ? params2025 : params2024)
      
      return {
        name: 'Supplément pour l\'achat de fournitures scolaires',
        description: 'Aide financière versée annuellement aux familles ayant des enfants d\'âge scolaire primaire et secondaire pour les aider à assumer les coûts des fournitures scolaires.',
        formula: 'Montant fixe par enfant admissible (4-16 ans)',
        parameters: [
          { label: `Montant par enfant (${taxYear})`, value: `${params.amount} $` },
          { label: 'Âge minimum', value: '4 ans' },
          { label: 'Âge maximum', value: '16 ans' },
          { label: 'Versement', value: 'Annuel (avec l\'allocation famille)' },
          { label: 'Référence officielle', value: 'Retraite Québec - Supplément fournitures scolaires', isReference: true }
        ]
      }
    })()
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
    solidarity: (() => {
      const params2023 = {
        tvqBase: 329,
        housingCouple: 821,
        housingSingle: 677,
        threshold: 39160
      }
      const params2024 = {
        tvqBase: 346,
        housingCouple: 863,
        housingSingle: 711,
        threshold: 41150
      }
      const params2025 = {
        tvqBase: 346,
        housingCouple: 863,
        housingSingle: 711,
        threshold: 41150
      }
      const params = taxYear === 2023 ? params2023 : (taxYear === 2025 ? params2025 : params2024)
      
      return {
        name: 'Quebec Solidarity Tax Credit',
        description: 'Refundable tax credit to help low and middle-income households with the cost of living in Quebec.',
        formula: 'TVQ Component + Housing Component + Northern Village Component - Income-based reduction',
        parameters: [
          { label: 'TVQ Base Amount', value: `$${params.tvqBase} (${taxYear})` },
          { label: 'Housing (Couple)', value: `$${params.housingCouple} (${taxYear})` },
          { label: 'Housing (Single)', value: `$${params.housingSingle} (${taxYear})` },
          { label: 'Child Amount', value: taxYear === 2023 ? '$144' : '$151' },
          { label: 'Reduction Threshold', value: `$${params.threshold.toLocaleString()} (${taxYear})` },
          { label: 'Reduction Rate', value: '6% (3% for single component)' }
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
    },
    fournitures_scolaires: (() => {
      const params2023 = { amount: 115 }
      const params2024 = { amount: 121 }
      const params2025 = { amount: 124 }
      const params = taxYear === 2023 ? params2023 : (taxYear === 2025 ? params2025 : params2024)
      
      return {
        name: 'School Supply Supplement',
        description: 'Annual financial assistance paid to families with children of primary and secondary school age to help them cover the costs of school supplies.',
        formula: 'Fixed amount per eligible child (ages 4-16)',
        parameters: [
          { label: `Amount per child (${taxYear})`, value: `$${params.amount}` },
          { label: 'Minimum age', value: '4 years old' },
          { label: 'Maximum age', value: '16 years old' },
          { label: 'Payment', value: 'Annual (with family allowance)' },
          { label: 'Official reference', value: 'Retraite Québec - School Supply Supplement', isReference: true }
        ]
      }
    })()
  }
})

export default function DetailedResults({ results, household, taxYear = 2024, language, formatCurrency }: DetailedResultsProps) {
  
  // Debug: vérifier les données des enfants
  console.log('DetailedResults - household:', household)
  console.log('DetailedResults - children:', household?.children)
  console.log('DetailedResults - totalChildcareExpenses:', household?.totalChildcareExpenses)
  
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

      const steps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []

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
        title: 'Chaire en fiscalité et en finances publiques - Cotisations au RRQ',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/'
      },
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
        title: 'Chaire en fiscalité et en finances publiques - QPP Contributions',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/'
      },
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

      const steps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []
      
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
        title: 'Chaire en fiscalité et en finances publiques - Cotisations au RQAP',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/'
      },
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
        title: 'Chaire en fiscalité et en finances publiques - QPIP Contributions',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/'
      },
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

      const steps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []
      
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
    
    const calculationSteps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []
    
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

      const steps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []
      
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

    let calculationSteps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = [...primaryResult.steps]
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

    // Utiliser la valeur réelle calculée par le MainCalculator pour cohérence
    const actualTax = results.taxes?.quebec instanceof Decimal ? results.taxes.quebec.toNumber() : totalTax
    
    // Ajouter le total
    calculationSteps.push({ 
      label: language === 'fr' ? 'TOTAL - Impôt du Québec (ménage)' : 'TOTAL - Quebec Tax (household)', 
      value: formatAmount(actualTax),
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
      currentValue: actualTax,
      parameters: calculationSteps
    }
  }

  // Génère les détails dynamiques de l'impôt fédéral
  const getFederalTaxDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Paramètres fiscaux fédéraux selon l'année
    const params2024 = {
      brackets: [
        { min: 0, max: 55867, rate: 0.15 },
        { min: 55867, max: 111733, rate: 0.205 },
        { min: 111733, max: 173205, rate: 0.26 },
        { min: 173205, max: 246752, rate: 0.2932 },
        { min: 246752, max: 999999999, rate: 0.33 }
      ],
      credits: {
        basic: 15705,
        age65: 8790,
        pension: 2000,
        livingAlone: 0 // Federal doesn't have living alone credit
      }
    }
    
    const params2025 = {
      brackets: [
        { min: 0, max: 57375, rate: 0.15 },
        { min: 57375, max: 114750, rate: 0.205 },
        { min: 114750, max: 177882, rate: 0.26 },
        { min: 177882, max: 253414, rate: 0.2932 },
        { min: 253414, max: 999999999, rate: 0.33 }
      ],
      credits: {
        basic: 16131,
        age65: 9034,
        pension: 2000,
        livingAlone: 0 // Federal doesn't have living alone credit
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

      const steps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []
      
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
        label: `${label} - ${language === 'fr' ? 'Calcul par paliers fiscaux fédéraux' : 'Federal tax calculation by brackets'}`, 
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

      // 5. Crédits d'impôt fédéraux non remboursables
      let totalCredits = 0
      const lowestRate = params.brackets[0].rate

      // Crédit personnel de base
      const basicCredit = params.credits.basic * lowestRate
      totalCredits += basicCredit
      steps.push({ 
        label: `  • ${language === 'fr' ? 'Montant personnel de base' : 'Basic personal amount'}`, 
        value: `${formatAmount(params.credits.basic)} × ${(lowestRate * 100).toFixed(1)}% = ${formatAmount(basicCredit)}`
      })

      // Crédit d'âge (65 ans et plus)
      if (person.age >= 65) {
        const ageCredit = params.credits.age65 * lowestRate
        totalCredits += ageCredit
        steps.push({ 
          label: `  • ${language === 'fr' ? 'Montant en raison de l\'âge (65 ans et plus)' : 'Age amount (65 years and over)'}`, 
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
          label: `  • ${language === 'fr' ? 'Montant pour revenus de pension' : 'Pension income amount'}`, 
          value: `${formatAmount(eligibleAmount)} × ${(lowestRate * 100).toFixed(1)}% = ${formatAmount(pensionCredit)}`
        })
      }

      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Total des crédits d\'impôt fédéraux' : 'Total federal tax credits'}`, 
        value: formatAmount(totalCredits)
      })

      // 6. Impôt net
      const netTax = Math.max(0, taxBeforeCredits - totalCredits)
      steps.push({ 
        label: `${label} - ${language === 'fr' ? 'Impôt fédéral net' : 'Net federal tax'}`, 
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

    let calculationSteps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = [...primaryResult.steps]
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

    // Utiliser la valeur réelle calculée par le MainCalculator pour cohérence
    const actualTax = results.taxes?.canada instanceof Decimal ? results.taxes.canada.toNumber() : totalTax
    
    // Ajouter le total
    calculationSteps.push({ 
      label: language === 'fr' ? 'TOTAL - Impôt fédéral (ménage)' : 'TOTAL - Federal Tax (household)', 
      value: formatAmount(actualTax),
      isTotal: true 
    })

    // Références officielles
    const webReferences = language === 'fr' ? [
      {
        title: 'Agence du revenu du Canada - Taux d\'imposition fédéraux',
        url: 'https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/frequemment-demandees/taux-imposition-federaux-particuliers-annees-courante-anterieures.html'
      },
      {
        title: 'Agence du revenu du Canada - Montants pour les crédits d\'impôt fédéraux ' + taxYear,
        url: taxYear === 2025 
          ? 'https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/frequemment-demandees/montants-impot-federal-2025.html'
          : 'https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/frequemment-demandees/montants-impot-federal-2024.html'
      },
      {
        title: 'Agence du revenu du Canada - Crédits d\'impôt non remboursables',
        url: 'https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/declaration-revenus/remplir-declaration-revenus/deductions-credits-depenses/ligne-30000-credits-impot-non-remboursables.html'
      }
    ] : [
      {
        title: 'Canada Revenue Agency - Federal income tax rates',
        url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions/canadian-income-tax-rates-individuals-current-previous-years.html'
      },
      {
        title: 'Canada Revenue Agency - Federal tax credit amounts ' + taxYear,
        url: taxYear === 2025 
          ? 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions/federal-tax-amounts-2025.html'
          : 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions/federal-tax-amounts-2024.html'
      },
      {
        title: 'Canada Revenue Agency - Non-refundable tax credits',
        url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-non-refundable-tax-credits.html'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))

    return {
      name: language === 'fr' ? 'Impôt fédéral' : 'Federal Income Tax',
      description: language === 'fr' 
        ? 'Impôt sur le revenu fédéral calculé selon les paliers fiscaux du Canada. Inclut les crédits d\'impôt non remboursables et les déductions pour cotisations sociales.'
        : 'Federal income tax calculated according to Canada tax brackets. Includes non-refundable tax credits and deductions for social contributions.',
      formula: '',
      currentValue: actualTax,
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
        title: 'Chaire en fiscalité et en finances publiques - Cotisations à l\'assurance-emploi',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/'
      },
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
        title: 'Chaire en fiscalité et en finances publiques - EI Contributions',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/'
      },
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

  // Génère les détails dynamiques du crédit de solidarité basés sur les données réelles
  const getSolidarityDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Récupérer les résultats du crédit de solidarité
    const solidarityResult = results.quebec?.solidarity
    if (!solidarityResult) return null

    // Paramètres selon l'année
    const params2023 = {
      tvqBase: 329, housingCouple: 821, housingSingle: 677, childAmount: 144, threshold: 39160
    }
    const params2024 = {
      tvqBase: 346, housingCouple: 863, housingSingle: 711, childAmount: 151, threshold: 41150
    }
    const params2025 = {
      tvqBase: 346, housingCouple: 863, housingSingle: 711, childAmount: 151, threshold: 41150
    }
    const params = taxYear === 2023 ? params2023 : (taxYear === 2025 ? params2025 : params2024)

    const calculationSteps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []

    // Afficher les composantes
    const tvqAmount = solidarityResult.tvq_component?.toNumber() || 0
    const housingAmount = solidarityResult.housing_component?.toNumber() || 0
    const northernAmount = solidarityResult.northern_village_component?.toNumber() || 0
    const familyIncome = solidarityResult.family_net_income?.toNumber() || 0
    const reductionAmount = solidarityResult.reduction_amount?.toNumber() || 0
    const netCredit = solidarityResult.net_credit?.toNumber() || 0

    // Détails des composantes
    calculationSteps.push({
      label: language === 'fr' ? 'Composante TVQ' : 'QST Component',
      value: formatCurrencyAmount(tvqAmount)
    })

    calculationSteps.push({
      label: language === 'fr' ? '• Montant de base' : '• Base amount',
      value: `${params.tvqBase}$`
    })

    if (household.householdType === 'couple' || household.householdType === 'retired_couple') {
      calculationSteps.push({
        label: language === 'fr' ? '• Montant conjoint' : '• Spouse amount',
        value: `${params.tvqBase}$`
      })
    }

    if (household.householdType === 'single' || household.householdType === 'retired_single' || household.householdType === 'single_parent') {
      calculationSteps.push({
        label: language === 'fr' ? '• Supplément personne seule' : '• Single person supplement',
        value: '164$'
      })
    }

    calculationSteps.push({
      label: language === 'fr' ? 'Composante logement' : 'Housing Component',
      value: formatCurrencyAmount(housingAmount)
    })

    const housingBase = household.spouse ? params.housingCouple : params.housingSingle
    calculationSteps.push({
      label: language === 'fr' ? '• Montant de base logement' : '• Base housing amount',
      value: `${housingBase}$`
    })

    if (household.numChildren > 0) {
      calculationSteps.push({
        label: language === 'fr' ? `• Enfants (${household.numChildren} × ${params.childAmount}$)` : `• Children (${household.numChildren} × ${params.childAmount}$)`,
        value: `${household.numChildren * params.childAmount}$`
      })
    }

    if (northernAmount > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Composante village nordique' : 'Northern Village Component',
        value: formatCurrencyAmount(northernAmount)
      })
    }

    // Total brut
    const grossTotal = tvqAmount + housingAmount + northernAmount
    calculationSteps.push({
      label: language === 'fr' ? 'Total brut' : 'Gross Total',
      value: formatCurrencyAmount(grossTotal),
      isTotal: true
    })

    // Réduction basée sur le revenu
    calculationSteps.push({
      label: language === 'fr' ? 'Revenu familial net' : 'Family Net Income',
      value: formatCurrencyAmount(familyIncome)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Seuil de réduction' : 'Reduction Threshold',
      value: `${params.threshold.toLocaleString()}$`
    })

    if (reductionAmount > 0) {
      const excessIncome = familyIncome - params.threshold
      calculationSteps.push({
        label: language === 'fr' ? 'Revenu excédentaire' : 'Excess Income',
        value: formatCurrencyAmount(Math.max(0, excessIncome))
      })

      const components = solidarityResult.components_count || 2
      const rate = components === 1 ? 3 : 6
      calculationSteps.push({
        label: language === 'fr' ? `Réduction (${rate}%)` : `Reduction (${rate}%)`,
        value: `-${formatCurrencyAmount(reductionAmount)}`
      })
    }

    // Crédit net final
    calculationSteps.push({
      label: language === 'fr' ? 'Crédit net final' : 'Final Net Credit',
      value: formatCurrencyAmount(netCredit),
      isTotal: true
    })

    return {
      name: language === 'fr' ? 'Crédit d\'impôt pour solidarité' : 'Solidarity Tax Credit',
      description: language === 'fr' 
        ? 'Crédit d\'impôt remboursable destiné à aider les ménages à revenus faible et moyen à faire face au coût de la vie au Québec. Comprend trois composantes : TVQ, logement et village nordique.'
        : 'Refundable tax credit to help low and middle-income households cope with the cost of living in Quebec. Includes three components: QST, housing and northern village.',
      formula: '', // Détail complet dans les paramètres
      currentValue: netCredit,
      parameters: calculationSteps
    }
  }

  const getWorkPremiumDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Récupérer les résultats de la prime au travail
    const workPremiumResult = results.quebec?.work_premium
    if (!workPremiumResult) return null

    // Paramètres selon l'année
    const params2023 = {
      singleMax: 1120, singleParentMax: 2900, coupleWithChildrenMax: 3770, coupleWithoutChildrenMax: 1120,
      singleThreshold: 22200, singleParentThreshold: 39100, coupleWithChildrenThreshold: 56300, coupleWithoutChildrenThreshold: 33600
    }
    const params2024 = {
      singleMax: 1152, singleParentMax: 2980, coupleWithChildrenMax: 3873, coupleWithoutChildrenMax: 1152,
      singleThreshold: 22795, singleParentThreshold: 40168, coupleWithChildrenThreshold: 57822, coupleWithoutChildrenThreshold: 34500
    }
    const params2025 = {
      singleMax: 1185, singleParentMax: 3065, coupleWithChildrenMax: 3980, coupleWithoutChildrenMax: 1185,
      singleThreshold: 23400, singleParentThreshold: 41300, coupleWithChildrenThreshold: 59400, coupleWithoutChildrenThreshold: 35400
    }
    const params = taxYear === 2023 ? params2023 : (taxYear === 2025 ? params2025 : params2024)

    const calculationSteps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []

    // Afficher les informations de base
    const workIncome = workPremiumResult.work_income?.toNumber() || 0
    const familyNetIncome = workPremiumResult.family_net_income?.toNumber() || 0
    const basicPremium = workPremiumResult.basic_premium?.toNumber() || 0
    const netPremium = workPremiumResult.net_premium?.toNumber() || 0
    const calculationPhase = workPremiumResult.calculation_phase || 'ineligible'

    calculationSteps.push({
      label: language === 'fr' ? 'Revenu de travail' : 'Work Income',
      value: formatCurrencyAmount(workIncome)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Revenu familial net' : 'Family Net Income',
      value: formatCurrencyAmount(familyNetIncome)
    })

    // Déterminer le type de ménage
    const householdType = household.spouse 
      ? (household.numChildren > 0 ? 'couple_with_children' : 'couple_without_children')
      : (household.numChildren > 0 ? 'single_parent' : 'single')

    // Afficher les paramètres selon le type de ménage
    if (householdType === 'single') {
      calculationSteps.push({
        label: language === 'fr' ? 'Prime maximale (célibataire)' : 'Maximum Premium (Single)',
        value: formatCurrencyAmount(params.singleMax)
      })
      calculationSteps.push({
        label: language === 'fr' ? 'Seuil de réduction' : 'Reduction Threshold',
        value: formatCurrencyAmount(params.singleThreshold)
      })
    } else if (householdType === 'single_parent') {
      calculationSteps.push({
        label: language === 'fr' ? 'Prime maximale (parent seul)' : 'Maximum Premium (Single Parent)',
        value: formatCurrencyAmount(params.singleParentMax)
      })
      calculationSteps.push({
        label: language === 'fr' ? 'Seuil de réduction' : 'Reduction Threshold',
        value: formatCurrencyAmount(params.singleParentThreshold)
      })
    } else if (householdType === 'couple_with_children') {
      calculationSteps.push({
        label: language === 'fr' ? 'Prime maximale (couple avec enfants)' : 'Maximum Premium (Couple with Children)',
        value: formatCurrencyAmount(params.coupleWithChildrenMax)
      })
      calculationSteps.push({
        label: language === 'fr' ? 'Seuil de réduction' : 'Reduction Threshold',
        value: formatCurrencyAmount(params.coupleWithChildrenThreshold)
      })
    } else {
      calculationSteps.push({
        label: language === 'fr' ? 'Prime maximale (couple sans enfants)' : 'Maximum Premium (Couple without Children)',
        value: formatCurrencyAmount(params.coupleWithoutChildrenMax)
      })
      calculationSteps.push({
        label: language === 'fr' ? 'Seuil de réduction' : 'Reduction Threshold',
        value: formatCurrencyAmount(params.coupleWithoutChildrenThreshold)
      })
    }

    // Afficher la phase de calcul
    const phaseLabels = {
      fr: {
        ineligible: 'Non admissible',
        growth: 'Croissance',
        maximum: 'Maximum',
        reduction: 'Réduction',
        zero: 'Zéro'
      },
      en: {
        ineligible: 'Not Eligible',
        growth: 'Growth Phase',
        maximum: 'Maximum Phase',
        reduction: 'Reduction Phase',
        zero: 'Zero'
      }
    }

    calculationSteps.push({
      label: language === 'fr' ? 'Phase de calcul' : 'Calculation Phase',
      value: phaseLabels[language][calculationPhase as keyof typeof phaseLabels.fr] || calculationPhase
    })

    if (basicPremium > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Prime de base calculée' : 'Calculated Basic Premium',
        value: formatCurrencyAmount(basicPremium)
      })
    }

    // Résultat final
    calculationSteps.push({
      label: language === 'fr' ? 'Prime au travail nette' : 'Net Work Premium',
      value: formatCurrencyAmount(netPremium),
      isTotal: true
    })

    return {
      name: language === 'fr' ? 'Prime au travail' : 'Work Premium',
      description: language === 'fr' 
        ? 'Crédit d\'impôt remboursable qui encourage le travail en offrant un supplément de revenu aux travailleurs et travailleuses à revenu faible ou moyen.'
        : 'Refundable tax credit that encourages work by providing income supplement to low and middle-income workers.',
      formula: '', // Détail complet dans les paramètres
      currentValue: netPremium,
      parameters: calculationSteps
    }
  }

  const getFamilyAllowanceDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Récupérer les résultats de l'allocation famille
    const familyAllowanceResult = results.quebec?.family_allowance
    if (!familyAllowanceResult) return null

    // Paramètres selon l'année
    const params2023 = {
      maxAmount: 2782, minAmount: 1107, singleParentSupplement: 976, schoolSupplies: 115,
      coupleThreshold: 55183, singleParentThreshold: 40168, reductionRate: 4
    }
    const params2024 = {
      maxAmount: 2923, minAmount: 1158, singleParentSupplement: 1024, schoolSupplies: 121,
      coupleThreshold: 57822, singleParentThreshold: 42136, reductionRate: 4
    }
    const params2025 = {
      maxAmount: 3006, minAmount: 1196, singleParentSupplement: 1055, schoolSupplies: 124,
      coupleThreshold: 59369, singleParentThreshold: 43280, reductionRate: 4
    }
    const params = taxYear === 2023 ? params2023 : (taxYear === 2025 ? params2025 : params2024)

    const calculationSteps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []

    // Afficher les informations de base
    const numChildren = familyAllowanceResult.eligible_children || 0
    const basicAllowance = familyAllowanceResult.basic_allowance?.toNumber() || 0
    const singleParentSupplement = familyAllowanceResult.single_parent_supplement?.toNumber() || 0
    const schoolSuppliesSupplement = familyAllowanceResult.school_supplies_supplement?.toNumber() || 0
    const familyNetIncome = familyAllowanceResult.family_net_income?.toNumber() || 0
    const reductionAmount = familyAllowanceResult.reduction_amount?.toNumber() || 0
    const netAllowance = familyAllowanceResult.net_allowance?.toNumber() || 0
    const reductionThreshold = familyAllowanceResult.reduction_threshold?.toNumber() || 0

    calculationSteps.push({
      label: language === 'fr' ? 'Nombre d\'enfants éligibles' : 'Number of Eligible Children',
      value: numChildren.toString()
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Montant de base par enfant' : 'Basic Amount per Child',
      value: formatCurrencyAmount(params.maxAmount)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Allocation de base totale' : 'Total Basic Allowance',
      value: formatCurrencyAmount(basicAllowance)
    })

    // Supplément monoparental si applicable
    if (singleParentSupplement > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Supplément famille monoparentale' : 'Single-Parent Family Supplement',
        value: formatCurrencyAmount(singleParentSupplement)
      })
    }

    // Supplément fournitures scolaires si applicable
    if (schoolSuppliesSupplement > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Supplément fournitures scolaires' : 'School Supplies Supplement',
        value: formatCurrencyAmount(schoolSuppliesSupplement)
      })
    }

    calculationSteps.push({
      label: language === 'fr' ? 'Revenu familial net' : 'Family Net Income',
      value: formatCurrencyAmount(familyNetIncome)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Seuil de réduction' : 'Reduction Threshold',
      value: formatCurrencyAmount(reductionThreshold)
    })

    // Calcul de la réduction si applicable
    if (reductionAmount > 0) {
      const excessIncome = Math.max(0, familyNetIncome - reductionThreshold)
      calculationSteps.push({
        label: language === 'fr' ? 'Excédent de revenu' : 'Excess Income',
        value: formatCurrencyAmount(excessIncome)
      })

      calculationSteps.push({
        label: language === 'fr' ? `Réduction (${params.reductionRate}%)` : `Reduction (${params.reductionRate}%)`,
        value: `-${formatCurrencyAmount(reductionAmount)}`
      })
    }

    calculationSteps.push({
      label: language === 'fr' ? 'Allocation famille nette' : 'Net Family Allowance',
      value: formatCurrencyAmount(netAllowance),
      isTotal: true
    })

    // Ajouter les références officielles
    const webReferences = language === 'fr' ? [
      {
        title: 'Chaire en fiscalité et en finances publiques - Allocation famille',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/allocation-famille/'
      },
      {
        title: 'Retraite Québec - Allocation famille',
        url: 'https://www.retraitequebec.gouv.qc.ca/fr/enfants/allocation-famille/'
      },
      {
        title: 'Gouvernement du Québec - Calcul de l\'allocation famille',
        url: 'https://www.quebec.ca/famille-et-soutien-aux-personnes/enfance/aide-financiere-aux-familles/allocation-famille'
      }
    ] : [
      {
        title: 'Chair in Taxation and Public Finance - Family Allowance',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/allocation-famille/'
      },
      {
        title: 'Retraite Québec - Family Allowance',
        url: 'https://www.retraitequebec.gouv.qc.ca/fr/enfants/allocation-famille/'
      },
      {
        title: 'Government of Quebec - Family Allowance Calculation',
        url: 'https://www.quebec.ca/en/family-and-support-for-individuals/childhood/financial-assistance-families/family-allowance'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))

    return {
      name: language === 'fr' ? 'Allocation famille' : 'Family Allowance',
      description: language === 'fr' 
        ? 'Aide financière versée aux familles québécoises pour soutenir les coûts liés à l\'éducation des enfants de moins de 18 ans.'
        : 'Financial assistance provided to Quebec families to support costs related to raising children under 18 years old.',
      formula: language === 'fr' 
        ? 'Montant de base + Suppléments - Réduction selon le revenu familial' 
        : 'Basic amount + Supplements - Reduction based on family income',
      currentValue: netAllowance,
      parameters: calculationSteps
    }
  }

  const getChildcareTaxCreditDetails = (): ProgramDetail | null => {
    if (!household) return null
    
    // Récupérer les résultats du crédit d'impôt pour frais de garde
    const childcareCreditResult = results.quebec?.childcare_tax_credit
    if (!childcareCreditResult) return null

    // Paramètres selon l'année
    const params2023 = {
      maxExpensesDisabled: 15545, maxExpensesUnder7: 11360, maxExpensesOther: 5720,
      minIncome: 0, maxIncome: 110880, minRate: 67, maxRate: 78
    }
    const params2024 = {
      maxExpensesDisabled: 16335, maxExpensesUnder7: 11935, maxExpensesOther: 6010,
      minIncome: 0, maxIncome: 116515, minRate: 67, maxRate: 78
    }
    const params2025 = {
      maxExpensesDisabled: 16800, maxExpensesUnder7: 12275, maxExpensesOther: 6180,
      minIncome: 0, maxIncome: 119835, minRate: 67, maxRate: 78
    }
    const params = taxYear === 2023 ? params2023 : (taxYear === 2025 ? params2025 : params2024)

    const calculationSteps: { label: string; value: string; isTotal?: boolean; isReference?: boolean }[] = []

    // Informations de base
    const eligibleChildren = childcareCreditResult.eligible_children?.toNumber() || 0
    const totalEligibleExpenses = childcareCreditResult.total_eligible_expenses?.toNumber() || 0
    const creditRate = childcareCreditResult.credit_rate?.toNumber() || 0
    const grossCredit = childcareCreditResult.gross_credit?.toNumber() || 0
    const netCredit = childcareCreditResult.net_credit?.toNumber() || 0

    calculationSteps.push({
      label: language === 'fr' ? 'Enfants éligibles' : 'Eligible Children',
      value: eligibleChildren.toString()
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Total des frais éligibles' : 'Total Eligible Expenses',
      value: formatCurrencyAmount(totalEligibleExpenses)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Taux de crédit' : 'Credit Rate',
      value: `${(creditRate * 100).toFixed(0)}%`
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Crédit brut' : 'Gross Credit',
      value: formatCurrencyAmount(grossCredit)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Crédit net final' : 'Final Net Credit',
      value: formatCurrencyAmount(netCredit),
      isTotal: true
    })

    // Références officielles
    const webReferences = language === 'fr' ? [
      {
        title: 'CFFP - Crédit d\'impôt pour frais de garde d\'enfants',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/credit-impot-frais-garde-enfants/'
      },
      {
        title: 'Revenu Québec - Crédit d\'impôt pour frais de garde d\'enfants',
        url: 'https://www.revenuquebec.ca/fr/citoyens/credits-dimpot/credit-dimpot-pour-frais-de-garde-denfants/'
      }
    ] : [
      {
        title: 'CFFP - Childcare Tax Credit',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/credit-impot-frais-garde-enfants/'
      },
      {
        title: 'Revenu Québec - Childcare Tax Credit',
        url: 'https://www.revenuquebec.ca/fr/citoyens/credits-dimpot/credit-dimpot-pour-frais-de-garde-denfants/'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))

    return {
      name: language === 'fr' ? 'Crédit d\'impôt pour frais de garde d\'enfants' : 'Childcare Tax Credit',
      description: language === 'fr' 
        ? 'Crédit d\'impôt remboursable du Québec pour les frais de garde d\'enfants permettant de réduire l\'impôt à payer ou d\'obtenir un remboursement pour les familles engageant des frais de garde.'
        : 'Quebec refundable tax credit for childcare expenses allowing families to reduce their taxes or receive a refund for childcare expenses.',
      formula: language === 'fr' 
        ? 'Frais éligibles × Taux de crédit (selon le revenu familial)' 
        : 'Eligible expenses × Credit rate (based on family income)',
      currentValue: netCredit,
      parameters: calculationSteps
    }
  }

  const getCanadaChildBenefitDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Récupérer les résultats de l'ACE
    const ccbResult = results.canada?.child_benefit
    if (!ccbResult) return null

    // Paramètres selon l'année
    const params2023 = {
      under6: 7437, age6to17: 6275, disability: 3173, firstThreshold: 34863, secondThreshold: 75537
    }
    const params2024 = {
      under6: 7787, age6to17: 6570, disability: 3322, firstThreshold: 36502, secondThreshold: 79087  
    }
    const params2025 = {
      under6: 7997, age6to17: 6748, disability: 3411, firstThreshold: 37487, secondThreshold: 81222
    }
    const params = taxYear === 2025 ? params2025 : taxYear === 2024 ? params2024 : params2023

    const calculationSteps: Array<{ label: string; value: string; isReference?: boolean }> = []

    const netBenefit = ccbResult.net_benefit?.toNumber() || 0
    const baseBenefit = ccbResult.base_benefit?.toNumber() || 0
    const disabilityBenefit = ccbResult.disability_benefit?.toNumber() || 0
    const reductionAmount = ccbResult.reduction_amount?.toNumber() || 0
    const familyNetIncome = ccbResult.family_net_income?.toNumber() || 0
    const childrenUnder6 = ccbResult.eligible_children_under_6 || 0
    const children6to17 = ccbResult.eligible_children_6_to_17 || 0

    // Étapes de calcul
    calculationSteps.push({
      label: language === 'fr' ? 'Enfants éligibles (< 6 ans)' : 'Eligible children (< 6 years)',
      value: childrenUnder6.toString()
    })
    
    calculationSteps.push({
      label: language === 'fr' ? 'Enfants éligibles (6-17 ans)' : 'Eligible children (6-17 years)',  
      value: children6to17.toString()
    })

    calculationSteps.push({
      label: language === 'fr' ? `Montant de base (< 6 ans): ${childrenUnder6} × ${params.under6.toLocaleString()} $` : `Base amount (< 6 years): ${childrenUnder6} × $${params.under6.toLocaleString()}`,
      value: `${(childrenUnder6 * params.under6).toLocaleString()} $`
    })

    calculationSteps.push({
      label: language === 'fr' ? `Montant de base (6-17 ans): ${children6to17} × ${params.age6to17.toLocaleString()} $` : `Base amount (6-17 years): ${children6to17} × $${params.age6to17.toLocaleString()}`,
      value: `${(children6to17 * params.age6to17).toLocaleString()} $`
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Prestation de base totale' : 'Total base benefit',
      value: `${baseBenefit.toLocaleString()} $`
    })

    if (disabilityBenefit > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Prestation pour enfants handicapés' : 'Disability benefit',
        value: `${disabilityBenefit.toLocaleString()} $`
      })
    }

    calculationSteps.push({
      label: language === 'fr' ? 'Revenu familial net ajusté' : 'Adjusted family net income',
      value: `${familyNetIncome.toLocaleString()} $`
    })

    if (reductionAmount > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Réduction selon le revenu' : 'Income-based reduction',
        value: `${reductionAmount.toLocaleString()} $`
      })
    }

    calculationSteps.push({
      label: language === 'fr' ? 'Allocation canadienne pour enfants (nette)' : 'Canada Child Benefit (net)',
      value: `${netBenefit.toLocaleString()} $`
    })

    // Références officielles
    const webReferences = [
      {
        title: language === 'fr' 
          ? 'Agence du revenu du Canada - Allocation canadienne pour enfants'
          : 'Canada Revenue Agency - Canada Child Benefit',
        url: 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview.html'
      },
      {
        title: language === 'fr'
          ? 'Calculateur de prestations pour enfants et familles'
          : 'Child and family benefits calculator',
        url: 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/child-family-benefits-calculator.html'
      },
      {
        title: 'CFFP - Allocation canadienne pour enfants',
        url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/allocation-canadienne-enfants/'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))

    return {
      name: language === 'fr' ? 'Allocation canadienne pour enfants (ACE)' : 'Canada Child Benefit (CCB)',
      description: language === 'fr'
        ? 'Prestation mensuelle non imposable versée aux familles admissibles pour les aider à assumer les coûts liés à l\'éducation des enfants de moins de 18 ans.'
        : 'Monthly non-taxable benefit paid to eligible families to help them with the costs of raising children under 18 years of age.',
      formula: language === 'fr'
        ? 'Montant de base + Prestation handicap - Réduction selon le revenu familial net ajusté'
        : 'Base amount + Disability benefit - Reduction based on adjusted family net income',
      currentValue: netBenefit,
      parameters: calculationSteps
    }
  }

  const getGstCreditDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Récupérer les résultats du crédit TPS
    const gstResult = results.canada?.gst_credit
    if (!gstResult) return null

    // Paramètres selon l'année
    const params2023 = {
      base: 325, spouse: 325, child: 171, singleThreshold: 10544, singleMax: 171, familyThreshold: 42335, reductionRate: 0.05
    }
    const params2024 = {
      base: 340, spouse: 340, child: 179, singleThreshold: 11039, singleMax: 179, familyThreshold: 44324, reductionRate: 0.05
    }
    const params2025 = {
      base: 349, spouse: 349, child: 184, singleThreshold: 11337, singleMax: 184, familyThreshold: 45521, reductionRate: 0.05
    }
    const params = taxYear === 2025 ? params2025 : taxYear === 2024 ? params2024 : params2023

    const calculationSteps: Array<{ label: string; value: string; isReference?: boolean }> = []

    const annualAmount = gstResult.amount?.toNumber() || 0
    const baseCredit = gstResult.base_credit?.toNumber() || 0
    const singleSupplement = gstResult.single_supplement?.toNumber() || 0
    const childrenCredit = gstResult.children_credit?.toNumber() || 0
    const familyIncome = gstResult.family_income?.toNumber() || 0
    const reductionAmount = gstResult.reduction_amount?.toNumber() || 0
    const quarterlyPayment = gstResult.quarterly_payment?.toNumber() || 0
    const hasSpouse = gstResult.has_spouse?.toNumber() === 1
    const isSingleParent = gstResult.is_single_parent?.toNumber() === 1
    const childrenCount = gstResult.children_count?.toNumber() || 0

    // Composition familiale
    const familyType = hasSpouse 
      ? (language === 'fr' ? 'Couple' : 'Couple')
      : isSingleParent 
      ? (language === 'fr' ? 'Parent seul' : 'Single parent')
      : (language === 'fr' ? 'Célibataire' : 'Single')

    calculationSteps.push({
      label: language === 'fr' ? 'Composition familiale' : 'Family composition',
      value: `${familyType}${childrenCount > 0 ? ` - ${childrenCount} ${language === 'fr' ? 'enfant(s)' : 'child(ren)'}` : ''}`
    })

    // Revenu familial net ajusté
    calculationSteps.push({
      label: language === 'fr' ? 'Revenu familial net ajusté' : 'Adjusted family net income',
      value: `${familyIncome.toLocaleString()} $`
    })

    // Crédit de base
    calculationSteps.push({
      label: language === 'fr' ? 'Crédit de base' : 'Base credit',
      value: `${baseCredit.toLocaleString()} $`
    })

    // Supplément pour célibataire
    if (singleSupplement > 0) {
      calculationSteps.push({
        label: language === 'fr' ? 'Supplément pour célibataire' : 'Single supplement',
        value: `${singleSupplement.toLocaleString()} $`
      })
    }

    // Crédit pour enfants
    if (childrenCredit > 0) {
      calculationSteps.push({
        label: language === 'fr' ? `Crédit pour enfants: ${childrenCount} × ${params.child} $` : `Children credit: ${childrenCount} × $${params.child}`,
        value: `${childrenCredit.toLocaleString()} $`
      })
    }

    // Réduction
    if (reductionAmount > 0) {
      calculationSteps.push({
        label: language === 'fr' 
          ? `Réduction: 5% × (${familyIncome.toLocaleString()} $ - ${params.familyThreshold.toLocaleString()} $)`
          : `Reduction: 5% × ($${familyIncome.toLocaleString()} - $${params.familyThreshold.toLocaleString()})`,
        value: `- ${reductionAmount.toLocaleString()} $`
      })
    }

    // Montant annuel net
    calculationSteps.push({
      label: language === 'fr' ? 'Crédit annuel net' : 'Net annual credit',
      value: `${annualAmount.toLocaleString()} $`
    })

    // Versement trimestriel
    calculationSteps.push({
      label: language === 'fr' ? 'Versement trimestriel' : 'Quarterly payment',
      value: `${quarterlyPayment.toLocaleString()} $`
    })

    // Références web
    const webReferences = [
      {
        title: language === 'fr' 
          ? 'Agence du revenu du Canada - Crédit pour la TPS/TVH'
          : 'Canada Revenue Agency - GST/HST Credit',
        url: 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/goods-services-tax-harmonized-sales-tax-gst-hst-credit.html'
      },
      {
        title: language === 'fr'
          ? 'Calculateur de prestations - ARC'
          : 'Benefits calculator - CRA',
        url: 'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/child-family-benefits-calculator.html'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))

    return {
      name: language === 'fr' ? 'Crédit pour la TPS/TVH' : 'GST/HST Credit',
      description: language === 'fr'
        ? 'Crédit trimestriel non imposable qui aide les personnes et les familles à revenu faible ou modeste à récupérer en totalité ou en partie la TPS ou la TVH qu\'elles paient.'
        : 'Tax-free quarterly payment that helps low- to modest-income individuals and families offset all or part of the GST or HST they pay.',
      formula: language === 'fr'
        ? 'Crédit de base + Supplément célibataire + Crédit enfants - Réduction selon le revenu'
        : 'Base credit + Single supplement + Children credit - Income reduction',
      currentValue: annualAmount,
      parameters: calculationSteps
    }
  }

  const getCanadaWorkersBenefitDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Récupérer les résultats de l'ACT
    const actResult = results.canada?.workers_benefit
    if (!actResult) return null

    // Paramètres selon l'année
    const params2023 = {
      singleMax: 1518, familyMax: 2616, disabilityMax: 700, minimumWork: 3000,
      phaseInRate: 0.27, phaseOutRate: 0.15, secondaryExemption: 14000
    }
    const params2024 = {
      singleMax: 1590, familyMax: 2739, disabilityMax: 737, minimumWork: 3000,
      phaseInRate: 0.27, phaseOutRate: 0.15, secondaryExemption: 14000
    }
    const params2025 = {
      singleMax: 1633, familyMax: 2813, disabilityMax: 843, minimumWork: 3000,
      phaseInRate: 0.27, phaseOutRate: 0.15, secondaryExemption: 14000
    }
    const params = taxYear === 2025 ? params2025 : taxYear === 2024 ? params2024 : params2023

    const calculationSteps: Array<{ label: string; value: string; isReference?: boolean }> = []

    const totalBenefit = actResult.amount?.toNumber() || 0
    const basicBenefit = actResult.basic_amount?.toNumber() || 0
    const disabilityBenefit = actResult.disability_supplement?.toNumber() || 0
    const workIncome = actResult.work_income?.toNumber() || 0
    const totalIncome = actResult.total_income?.toNumber() || 0
    const isFamily = actResult.is_family?.toNumber() === 1
    const minimumMet = actResult.minimum_work_income_met?.toNumber() === 1
    const phaseInAmount = actResult.phase_in_amount?.toNumber() || 0
    const phaseOutReduction = actResult.phase_out_reduction?.toNumber() || 0

    // Type de ménage
    const householdType = isFamily 
      ? (language === 'fr' ? 'Famille (conjoint ou enfants)' : 'Family (spouse or children)')
      : (language === 'fr' ? 'Personne seule' : 'Single person')

    calculationSteps.push({
      label: language === 'fr' ? 'Type de ménage' : 'Household type',
      value: householdType
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Revenu de travail' : 'Work income',
      value: formatCurrency(workIncome)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Revenu total' : 'Total income',
      value: formatCurrency(totalIncome)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Seuil minimum requis' : 'Minimum threshold required',
      value: formatCurrency(params.minimumWork)
    })

    calculationSteps.push({
      label: language === 'fr' ? 'Exigence minimum respectée' : 'Minimum requirement met',
      value: minimumMet ? (language === 'fr' ? 'Oui' : 'Yes') : (language === 'fr' ? 'Non' : 'No')
    })

    if (minimumMet) {
      calculationSteps.push({
        label: language === 'fr' ? 'Montant maximum admissible' : 'Maximum eligible amount',
        value: formatCurrency(isFamily ? params.familyMax : params.singleMax)
      })

      calculationSteps.push({
        label: language === 'fr' ? 'Montant d\'accumulation (27%)' : 'Phase-in amount (27%)',
        value: formatCurrency(phaseInAmount)
      })

      if (phaseOutReduction > 0) {
        calculationSteps.push({
          label: language === 'fr' ? 'Réduction (15%)' : 'Phase-out reduction (15%)',
          value: `-${formatCurrency(phaseOutReduction)}`
        })
      }

      calculationSteps.push({
        label: language === 'fr' ? 'Prestation de base' : 'Basic benefit',
        value: formatCurrency(basicBenefit)
      })

      if (disabilityBenefit > 0) {
        calculationSteps.push({
          label: language === 'fr' ? 'Supplément pour personnes handicapées' : 'Disability supplement',
          value: formatCurrency(disabilityBenefit)
        })
      }
    }

    // Référence officielle
    calculationSteps.push({
      label: language === 'fr' ? 'Source officielle' : 'Official source',
      value: language === 'fr'
        ? 'Agence du revenu du Canada - Allocation canadienne pour les travailleurs'
        : 'Canada Revenue Agency - Canada Workers Benefit',
      isReference: true
    })

    return {
      name: language === 'fr' ? 'Allocation canadienne pour les travailleurs (ACT)' : 'Canada Workers Benefit (CWB)',
      description: language === 'fr'
        ? 'Crédit d\'impôt remboursable qui aide les travailleurs et les familles à revenu faible ou modeste à demeurer sur le marché du travail.'
        : 'Refundable tax credit that helps low-income working individuals and families stay in the workforce.',
      formula: language === 'fr'
        ? 'Prestation de base + Supplément invalidité - Réduction selon le revenu familial'
        : 'Basic benefit + Disability supplement - Income-based reduction',
      currentValue: totalBenefit,
      parameters: calculationSteps
    }
  }

  const getOldAgeSecurityDetails = (): ProgramDetail | null => {
    if (!household) return null

    // Récupérer les résultats de la PSV
    const oasResult = results.canada?.old_age_security
    if (!oasResult) return null

    const primaryResult = oasResult.primary
    const spouseResult = oasResult.spouse
    const oasResultTotalAmount = oasResult.total_amount?.toNumber() || 0

    // Paramètres selon l'année
    const params2023 = {
      recoveryThreshold: 86912, recoveryRate: 0.15, minResidence: 10, fullPensionYears: 40
    }
    const params2024 = {
      recoveryThreshold: 90997, recoveryRate: 0.15, minResidence: 10, fullPensionYears: 40
    }
    const params2025 = {
      recoveryThreshold: 90997, recoveryRate: 0.15, minResidence: 10, fullPensionYears: 40
    }
    const params = taxYear === 2025 ? params2025 : taxYear === 2024 ? params2024 : params2023

    const calculationSteps: Array<{ label: string; value: string; isReference?: boolean }> = []

    // Information pour la personne principale
    if (primaryResult && primaryResult.eligible?.toNumber() === 1) {
      const primaryAge = household.primaryPerson.age
      const primaryIncome = primaryResult.individual_income?.toNumber() || 0
      const primaryGrossAmount = primaryResult.gross_monthly_amount?.toNumber() || 0
      const primaryRecoveryTax = primaryResult.recovery_tax?.toNumber() || 0
      const primaryNetAmount = primaryResult.net_monthly_amount?.toNumber() || 0
      const primaryAnnualAmount = primaryResult.annual_amount?.toNumber() || 0
      const is75Plus = primaryResult.is_75_plus?.toNumber() === 1

      calculationSteps.push({
        label: language === 'fr' ? 'Personne principale' : 'Primary person',
        value: language === 'fr' ? `${primaryAge} ans${is75Plus ? ' (75+)' : ''}` : `${primaryAge} years old${is75Plus ? ' (75+)' : ''}`
      })

      calculationSteps.push({
        label: language === 'fr' ? 'Revenu individuel' : 'Individual income',
        value: formatCurrency(primaryIncome)
      })

      calculationSteps.push({
        label: language === 'fr' ? 'Seuil de récupération' : 'Recovery threshold',
        value: formatCurrency(params.recoveryThreshold)
      })

      // Détail du calcul PSV étape par étape
      calculationSteps.push({
        label: language === 'fr' ? '<span class="text-sm font-bold" style="color: rgb(0, 0, 0);">Programme de la Sécurité du revenu </span>' : '📋 Old Age Security Program',
        value: ''
      })

      calculationSteps.push({
        label: language === 'fr' ? '1️⃣ Montant mensuel maximum PSV' : '1️⃣ Maximum monthly OAS amount',
        value: `${formatCurrency(primaryGrossAmount)}${is75Plus ? (language === 'fr' ? ' (75+ ans, +10%)' : ' (75+ years, +10%)') : ''}`
      })

      if (primaryRecoveryTax > 0) {
        calculationSteps.push({
          label: language === 'fr' ? '2️⃣ Récupération fiscale (15% × excédent)' : '2️⃣ Recovery tax (15% × excess)',
          value: `-${formatCurrency(primaryRecoveryTax)}`
        })
        
        calculationSteps.push({
          label: language === 'fr' ? '   • Calcul: 15% × (${formatCurrency(primaryIncome)} - ${formatCurrency(params.recoveryThreshold)}) ÷ 12' : '   • Calculation: 15% × (${formatCurrency(primaryIncome)} - ${formatCurrency(params.recoveryThreshold)}) ÷ 12',
          value: language === 'fr' ? '   • Si revenu > seuil de récupération' : '   • If income > recovery threshold'
        })

        calculationSteps.push({
          label: language === 'fr' ? '3️⃣ PSV nette mensuelle' : '3️⃣ Net monthly OAS',
          value: `${formatCurrency(primaryGrossAmount)} - ${formatCurrency(primaryRecoveryTax)} = ${formatCurrency(primaryNetAmount)}`
        })
      } else {
        calculationSteps.push({
          label: language === 'fr' ? '2️⃣ Aucune récupération fiscale' : '2️⃣ No recovery tax',
          value: language === 'fr' ? `Revenu sous ${formatCurrency(params.recoveryThreshold)}` : `Income below ${formatCurrency(params.recoveryThreshold)}`
        })
        
        calculationSteps.push({
          label: language === 'fr' ? '3️⃣ PSV mensuelle = montant maximum' : '3️⃣ Monthly OAS = maximum amount',
          value: formatCurrency(primaryNetAmount)
        })
      }

      calculationSteps.push({
        label: language === 'fr' ? '4️⃣ PSV annuelle (×12 mois)' : '4️⃣ Annual OAS (×12 months)',
        value: `${formatCurrency(primaryNetAmount)} × 12 = ${formatCurrency(primaryAnnualAmount)}`
      })
    }

    // Information pour le conjoint
    if (spouseResult && spouseResult.eligible?.toNumber() === 1) {
      const spouseAge = household.spouse?.age || 0
      const spouseIncome = spouseResult.individual_income?.toNumber() || 0
      const spouseGrossAmount = spouseResult.gross_monthly_amount?.toNumber() || 0
      const spouseRecoveryTax = spouseResult.recovery_tax?.toNumber() || 0
      const spouseNetAmount = spouseResult.net_monthly_amount?.toNumber() || 0
      const spouseAnnualAmount = spouseResult.annual_amount?.toNumber() || 0
      const spouseIs75Plus = spouseResult.is_75_plus?.toNumber() === 1

      calculationSteps.push({
        label: language === 'fr' ? 'Conjoint' : 'Spouse',
        value: language === 'fr' ? `${spouseAge} ans${spouseIs75Plus ? ' (75+)' : ''}` : `${spouseAge} years old${spouseIs75Plus ? ' (75+)' : ''}`
      })

      calculationSteps.push({
        label: language === 'fr' ? 'Revenu individuel (conjoint)' : 'Individual income (spouse)',
        value: formatCurrency(spouseIncome)
      })

      calculationSteps.push({
        label: language === 'fr' ? 'Montant mensuel brut (conjoint)' : 'Gross monthly amount (spouse)',
        value: formatCurrency(spouseGrossAmount)
      })

      if (spouseRecoveryTax > 0) {
        calculationSteps.push({
          label: language === 'fr' ? 'Récupération conjoint (15%)' : 'Spouse recovery tax (15%)',
          value: `-${formatCurrency(spouseRecoveryTax)}`
        })
      }

      calculationSteps.push({
        label: language === 'fr' ? 'Montant annuel (conjoint)' : 'Annual amount (spouse)',
        value: formatCurrency(spouseAnnualAmount)
      })
    }

    // Informations sur le SRG (Supplément de revenu garanti) - TOUJOURS AFFICHER
    if (primaryResult && primaryResult.age_requirement_met?.toNumber() === 1) {
      const gisAmount = primaryResult.gis_amount?.toNumber() || 0
      const gisMonthlyAmount = primaryResult.gis_monthly_amount?.toNumber() || 0
      const gisEligible = primaryResult.gis_eligible?.toNumber() === 1
      const gisIncome = primaryResult.gis_income?.toNumber() || 0
      const gisIncomeCutoff = primaryResult.gis_income_cutoff?.toNumber() || 0
      const gisMaxMonthly = primaryResult.gis_max_monthly_amount?.toNumber() || 0
      const gisReduction = primaryResult.gis_reduction_applied?.toNumber() || 0
      const gisIsCouple = primaryResult.gis_is_couple?.toNumber() === 1
      const gisSpouseOas = primaryResult.gis_spouse_receives_oas?.toNumber() === 1

      calculationSteps.push({
        label: language === 'fr' ? '<span class="text-sm font-bold" style="color: rgb(0, 0, 0);">Supplément de revenu garanti (SRG)</span>' : 'Guaranteed Income Supplement (GIS)',
        value: ''
      })

      calculationSteps.push({
        label: language === 'fr' ? 'Situation familiale' : 'Marital status',
        value: gisIsCouple 
          ? (gisSpouseOas 
              ? (language === 'fr' ? 'Couple (les deux reçoivent la PSV)' : 'Couple (both receive OAS)')
              : (language === 'fr' ? 'Couple (un seul reçoit la PSV)' : 'Couple (one receives OAS)'))
          : (language === 'fr' ? 'Personne seule' : 'Single person')
      })

      // Détail du calcul du revenu pour SRG
      calculationSteps.push({
        label: language === 'fr' ? 'Calcul du revenu pour SRG:' : 'Income calculation for GIS:',
        value: ''
      })

      const rawIncome = primaryResult.individual_income?.toNumber() || 0
      const workIncome = household.primaryPerson.grossWorkIncome.toNumber()
      const retirementIncome = household.primaryPerson.grossRetirementIncome.toNumber()
      
      calculationSteps.push({
        label: language === 'fr' ? 'Revenu de retraite' : 'Retirement income',
        value: formatCurrency(retirementIncome)
      })

      if (workIncome > 0) {
        calculationSteps.push({
          label: language === 'fr' ? 'Revenu de travail brut' : 'Gross work income',
          value: formatCurrency(workIncome)
        })

        const firstExemption = Math.min(workIncome, 5000)
        const remainingWork = Math.max(0, workIncome - 5000)
        const partialExemption = Math.min(remainingWork, 10000) * 0.5
        const countedWork = Math.max(0, remainingWork - 10000) + (remainingWork > 10000 ? 5000 : remainingWork * 0.5)

        calculationSteps.push({
          label: language === 'fr' ? 'Exemption complète (premiers 5 000 $)' : 'Full exemption (first $5,000)',
          value: `-${formatCurrency(firstExemption)}`
        })

        if (remainingWork > 0 && remainingWork <= 10000) {
          calculationSteps.push({
            label: language === 'fr' ? 'Exemption partielle (50% de 5 000 $ à 15 000 $)' : 'Partial exemption (50% from $5,000 to $15,000)',
            value: `-${formatCurrency(partialExemption)}`
          })
        }

        calculationSteps.push({
          label: language === 'fr' ? 'Revenu de travail comptabilisé' : 'Counted work income',
          value: formatCurrency(countedWork)
        })
      }

      calculationSteps.push({
        label: language === 'fr' ? '1️⃣ Revenu total pour SRG' : '1️⃣ Total income for GIS',
        value: formatCurrency(gisIncome)
      })

      calculationSteps.push({
        label: language === 'fr' ? '2️⃣ Seuil d\'admissibilité annuel' : '2️⃣ Annual eligibility threshold',
        value: formatCurrency(gisIncomeCutoff)
      })

      calculationSteps.push({
        label: language === 'fr' ? '3️⃣ SRG mensuel maximal possible' : '3️⃣ Maximum possible monthly GIS',
        value: formatCurrency(gisMaxMonthly)
      })

      if (gisEligible) {
        calculationSteps.push({
          label: language === 'fr' ? '4️⃣ Réduction (0,50 $ par $ de revenu)' : '4️⃣ Reduction ($0.50 per $ of income)',
          value: `${formatCurrency(gisIncome)} × 0,50 = -${formatCurrency(gisReduction)}`
        })

        calculationSteps.push({
          label: language === 'fr' ? '5️⃣ SRG mensuel final' : '5️⃣ Final monthly GIS',
          value: `${formatCurrency(gisMaxMonthly)} - ${formatCurrency(gisReduction)} = ${formatCurrency(gisMonthlyAmount)}`
        })

        calculationSteps.push({
          label: language === 'fr' ? '6️⃣ SRG annuel (×12 mois)' : '6️⃣ Annual GIS (×12 months)',
          value: `${formatCurrency(gisMonthlyAmount)} × 12 = ${formatCurrency(gisAmount)}`
        })

        calculationSteps.push({
          label: language === 'fr' ? '✅ Statut SRG' : '✅ GIS Status',
          value: language === 'fr' ? `Admissible - ${formatCurrency(gisAmount)}/an` : `Eligible - ${formatCurrency(gisAmount)}/year`
        })
      } else {
        calculationSteps.push({
          label: language === 'fr' ? '4️⃣ Vérification d\'admissibilité' : '4️⃣ Eligibility check',
          value: gisIncome <= gisIncomeCutoff 
            ? (language === 'fr' ? `${formatCurrency(gisIncome)} ≤ ${formatCurrency(gisIncomeCutoff)} ✅` : `${formatCurrency(gisIncome)} ≤ ${formatCurrency(gisIncomeCutoff)} ✅`)
            : (language === 'fr' ? `${formatCurrency(gisIncome)} > ${formatCurrency(gisIncomeCutoff)} ❌` : `${formatCurrency(gisIncome)} > ${formatCurrency(gisIncomeCutoff)} ❌`)
        })

        calculationSteps.push({
          label: language === 'fr' ? '❌ Statut SRG' : '❌ GIS Status',
          value: language === 'fr' ? 'Non admissible (revenu trop élevé)' : 'Not eligible (income too high)'
        })

        calculationSteps.push({
          label: language === 'fr' ? '💡 Pour être admissible' : '💡 To be eligible',
          value: language === 'fr' ? `Revenu doit être ≤ ${formatCurrency(gisIncomeCutoff)}` : `Income must be ≤ ${formatCurrency(gisIncomeCutoff)}`
        })
      }
    }

    // Récupérer les montants pour le calcul du total
    const primaryAnnualAmount = primaryResult?.annual_amount?.toNumber() || 0
    const gisAmount = primaryResult?.gis_amount?.toNumber() || 0
    
    // Total PSV + SRG
    const calculatedTotalAmount = primaryAnnualAmount + gisAmount + (spouseResult ? (spouseResult.annual_amount?.toNumber() || 0) + (spouseResult.gis_amount?.toNumber() || 0) : 0)
    
    if (household.isCouple && spouseResult) {
      calculationSteps.push({
        label: language === 'fr' ? '• Personne principale (PSV + SRG)' : '• Primary person (OAS + GIS)',
        value: formatCurrency(primaryAnnualAmount + gisAmount)
      })
      
      const spouseGisAmount = spouseResult.gis_amount?.toNumber() || 0
      const spouseOasAmount = spouseResult.annual_amount?.toNumber() || 0
      calculationSteps.push({
        label: language === 'fr' ? '• Conjoint (PSV + SRG)' : '• Spouse (OAS + GIS)',
        value: formatCurrency(spouseOasAmount + spouseGisAmount)
      })
    }

    calculationSteps.push({
      label: language === 'fr' ? '<span class="text-sm font-bold" style="color: rgb(0, 0, 0);">Total</span>' : '<span class="text-sm font-bold" style="color: rgb(0, 0, 0);">Total</span>',
      value: formatCurrency(calculatedTotalAmount)
    })

    // Référence officielle
    calculationSteps.push({
      label: language === 'fr' ? 'Référence officielle' : 'Official reference',
      value: language === 'fr' ? 'Canada.ca - Sécurité de la vieillesse' : 'Canada.ca - Old Age Security',
      isReference: true
    })

    return {
      name: language === 'fr' ? 'Programme de la Sécurité de la vieillesse (PSV + SRG)' : 'Old Age Security Program (OAS + GIS)',
      description: language === 'fr' 
        ? 'Pension mensuelle offerte à la plupart des Canadiens de 65 ans et plus, incluant le Supplément de revenu garanti (SRG) pour les bénéficiaires à faible revenu. Indexée trimestriellement selon l\'IPC.'
        : 'Monthly pension available to most Canadians 65 years old or older, including the Guaranteed Income Supplement (GIS) for low-income recipients. Indexed quarterly based on CPI.',
      formula: language === 'fr' 
        ? 'Montant moyen trimestriel - Récupération fiscale (si applicable)'
        : 'Average quarterly amount - Recovery tax (if applicable)',
      currentValue: calculatedTotalAmount,
      parameters: calculationSteps
    }
  }

  // Génère les détails du supplément médical fédéral
  const getFederalMedicalSupplementDetails = (): ProgramDetail | null => {
    if (!household) return null

    const medicalResult = results.canada?.medical_expense_supplement
    if (!medicalResult) return null

    const supplementAmount = medicalResult.amount instanceof Decimal ? medicalResult.amount.toNumber() : 0
    const workIncome = medicalResult.work_income instanceof Decimal ? medicalResult.work_income.toNumber() : 0
    const familyNetIncome = medicalResult.family_net_income instanceof Decimal ? medicalResult.family_net_income.toNumber() : 0
    const medicalExpenses = household.medicalExpenses.toNumber()
    const creditableMedical = medicalResult.creditable_medical_expenses instanceof Decimal ? medicalResult.creditable_medical_expenses.toNumber() : 0
    const phaseOutReduction = medicalResult.phase_out_reduction instanceof Decimal ? medicalResult.phase_out_reduction.toNumber() : 0
    const isEligible = medicalResult.eligible instanceof Decimal ? medicalResult.eligible.toNumber() === 1 : false

    const calculationSteps = [
      {
        label: language === 'fr' ? 'Frais médicaux réclamés' : 'Medical expenses claimed',
        value: formatAmount(medicalExpenses)
      },
      {
        label: language === 'fr' ? 'Frais médicaux admissibles (25%)' : 'Eligible medical expenses (25%)',
        value: formatAmount(creditableMedical)
      },
      {
        label: language === 'fr' ? 'Montant maximal (2025)' : 'Maximum amount (2025)',
        value: formatAmount(1500)
      },
      {
        label: language === 'fr' ? 'Supplément de base' : 'Base supplement',
        value: formatAmount(Math.min(1500, creditableMedical))
      },
      {
        label: language === 'fr' ? 'Revenu familial net ajusté' : 'Adjusted family net income',
        value: formatAmount(familyNetIncome)
      },
      {
        label: language === 'fr' ? 'Seuil de réduction (33 300 $)' : 'Reduction threshold ($33,300)',
        value: familyNetIncome > 33300 ? language === 'fr' ? 'Dépassé' : 'Exceeded' : language === 'fr' ? 'Respecté' : 'Met'
      },
      {
        label: language === 'fr' ? 'Réduction (5% de l\'excédent)' : 'Reduction (5% of excess)',
        value: formatAmount(phaseOutReduction)
      },
      {
        label: language === 'fr' ? 'Supplément final' : 'Final supplement',
        value: formatAmount(supplementAmount)
      }
    ]

    return {
      name: language === 'fr' ? 'Supplément remboursable pour frais médicaux (fédéral)' : 'Refundable Medical Expense Supplement (Federal)',
      description: language === 'fr' 
        ? 'Crédit d\'impôt remboursable fédéral qui aide les travailleurs à faible revenu ayant des frais médicaux élevés. Nécessite un revenu de travail minimum de 4 400 $ et s\'applique aux frais médicaux admissibles.'
        : 'Federal refundable tax credit that helps low-income workers with high medical expenses. Requires minimum work income of $4,400 and applies to eligible medical expenses.',
      formula: language === 'fr' 
        ? 'Min(1 500 $, 25% × frais médicaux) - 5% × max(0, revenu familial net - 33 300 $)'
        : 'Min($1,500, 25% × medical expenses) - 5% × max(0, family net income - $33,300)',
      currentValue: supplementAmount,
      parameters: calculationSteps
    }
  }

  // Génère les détails du crédit médical québécois
  const getQuebecMedicalSupplementDetails = (): ProgramDetail | null => {
    if (!household) return null

    const medicalResult = results.quebec?.medical_expense_supplement
    if (!medicalResult) return null

    const supplementAmount = medicalResult.amount instanceof Decimal ? medicalResult.amount.toNumber() : 0
    const workIncome = medicalResult.work_income instanceof Decimal ? medicalResult.work_income.toNumber() : 0
    const familyNetIncome = medicalResult.family_net_income instanceof Decimal ? medicalResult.family_net_income.toNumber() : 0
    const medicalExpenses = household.medicalExpenses.toNumber()
    const creditableMedical = medicalResult.creditable_medical_expenses instanceof Decimal ? medicalResult.creditable_medical_expenses.toNumber() : 0
    const phaseOutReduction = medicalResult.phase_out_reduction instanceof Decimal ? medicalResult.phase_out_reduction.toNumber() : 0
    const isEligible = medicalResult.eligible instanceof Decimal ? medicalResult.eligible.toNumber() === 1 : false

    const calculationSteps = [
      {
        label: language === 'fr' ? 'Frais médicaux réclamés' : 'Medical expenses claimed',
        value: formatAmount(medicalExpenses)
      },
      {
        label: language === 'fr' ? 'Frais médicaux admissibles (25%)' : 'Eligible medical expenses (25%)',
        value: formatAmount(creditableMedical)
      },
      {
        label: language === 'fr' ? 'Montant maximal (2025)' : 'Maximum amount (2025)',
        value: formatAmount(1466)
      },
      {
        label: language === 'fr' ? 'Crédit de base' : 'Base credit',
        value: formatAmount(Math.min(1466, creditableMedical))
      },
      {
        label: language === 'fr' ? 'Revenu familial net ajusté' : 'Adjusted family net income',
        value: formatAmount(familyNetIncome)
      },
      {
        label: language === 'fr' ? 'Seuil de réduction (28 335 $)' : 'Reduction threshold ($28,335)',
        value: familyNetIncome > 28335 ? language === 'fr' ? 'Dépassé' : 'Exceeded' : language === 'fr' ? 'Respecté' : 'Met'
      },
      {
        label: language === 'fr' ? 'Réduction (5% de l\'excédent)' : 'Reduction (5% of excess)',
        value: formatAmount(phaseOutReduction)
      },
      {
        label: language === 'fr' ? 'Crédit final' : 'Final credit',
        value: formatAmount(supplementAmount)
      }
    ]

    return {
      name: language === 'fr' ? 'Crédit d\'impôt remboursable pour frais médicaux (Québec)' : 'Refundable Tax Credit for Medical Expenses (Quebec)',
      description: language === 'fr' 
        ? 'Crédit d\'impôt remboursable québécois destiné à inciter les personnes handicapées ou ayant des frais médicaux élevés à intégrer le marché du travail. Nécessite un revenu de travail minimum de 3 750 $.'
        : 'Quebec refundable tax credit designed to encourage people with disabilities or high medical expenses to enter the job market. Requires minimum work income of $3,750.',
      formula: language === 'fr' 
        ? 'Min(1 466 $, 25% × frais médicaux) - 5% × max(0, revenu familial net - 28 335 $)'
        : 'Min($1,466, 25% × medical expenses) - 5% × max(0, family net income - $28,335)',
      currentValue: supplementAmount,
      parameters: calculationSteps
    }
  }

  // Génère les détails de l'aide sociale
  const getSocialAssistanceDetails = (): ProgramDetail | null => {
    if (!household) return null
    const socialAssistanceResult = results.quebec?.social_assistance
    if (!socialAssistanceResult) return null
    
    const netBenefit = socialAssistanceResult.net_benefit instanceof Decimal ? socialAssistanceResult.net_benefit.toNumber() : 0
    const baseBenefit = socialAssistanceResult.base_benefit instanceof Decimal ? socialAssistanceResult.base_benefit.toNumber() : 0
    const adjustmentBenefit = socialAssistanceResult.adjustment_benefit instanceof Decimal ? socialAssistanceResult.adjustment_benefit.toNumber() : 0
    const constraintAllocation = socialAssistanceResult.constraint_allocation instanceof Decimal ? socialAssistanceResult.constraint_allocation.toNumber() : 0
    const singleAdjustment = socialAssistanceResult.single_adjustment instanceof Decimal ? socialAssistanceResult.single_adjustment.toNumber() : 0
    const workIncomeExemption = socialAssistanceResult.work_income_exemption instanceof Decimal ? socialAssistanceResult.work_income_exemption.toNumber() : 0
    const workIncomeSuplement = socialAssistanceResult.work_income_supplement instanceof Decimal ? socialAssistanceResult.work_income_supplement.toNumber() : 0
    const incomeReduction = socialAssistanceResult.income_reduction instanceof Decimal ? socialAssistanceResult.income_reduction.toNumber() : 0
    const totalWorkIncome = socialAssistanceResult.total_work_income instanceof Decimal ? socialAssistanceResult.total_work_income.toNumber() : 0
    const eligible = socialAssistanceResult.eligible instanceof Decimal ? socialAssistanceResult.eligible.toNumber() === 1 : false
    const program = socialAssistanceResult.program ? socialAssistanceResult.program.toString() : 'aide_sociale'
    
    const calculationSteps = []
    
    if (!eligible) {
      calculationSteps.push({
        label: language === 'fr' ? 'Statut d\'admissibilité' : 'Eligibility Status',
        value: language === 'fr' ? 'Non admissible' : 'Not eligible'
      })
      calculationSteps.push({
        label: language === 'fr' ? 'Raison' : 'Reason',
        value: socialAssistanceResult.ineligibility_reason?.toString() || (language === 'fr' ? 'Critères non respectés' : 'Criteria not met')
      })
    } else {
      // Déterminer le type de programme
      const programName = program === 'objectif_emploi' 
        ? (language === 'fr' ? 'Programme objectif emploi' : 'Employment objective program')
        : program === 'solidarite_sociale'
        ? (language === 'fr' ? 'Solidarité sociale' : 'Social solidarity') 
        : (language === 'fr' ? 'Aide sociale' : 'Social assistance')
      
      // Calculs mensuels pour l'affichage détaillé
      const monthlyWorkIncome = totalWorkIncome / 12
      const monthlyExemption = workIncomeExemption / 12
      const monthlyReduction = incomeReduction / 12
      const monthlySupplement = workIncomeSuplement / 12
      const monthlyNet = netBenefit / 12
      const monthlyConstraint = constraintAllocation / 12
      const monthlySingle = singleAdjustment / 12
      const monthlyBase = baseBenefit / 12
      const monthlyAdjustment = adjustmentBenefit / 12
      
      calculationSteps.push({
        label: language === 'fr' ? 'Programme applicable' : 'Applicable program',
        value: programName
      })
      
      calculationSteps.push({
        label: language === 'fr' ? 'Prestation de base' : 'Base benefit',
        value: formatCurrency(monthlyBase)
      })
      
      calculationSteps.push({
        label: language === 'fr' ? 'Ajustement' : 'Adjustment',
        value: formatCurrency(monthlyAdjustment)
      })
      
      if (constraintAllocation > 0) {
        calculationSteps.push({
          label: language === 'fr' ? 'Allocation contrainte temporaire' : 'Temporary constraint allocation',
          value: formatCurrency(monthlyConstraint)
        })
      }
      
      if (singleAdjustment > 0) {
        calculationSteps.push({
          label: language === 'fr' ? 'Ajustement objectif emploi' : 'Employment objective adjustment',
          value: formatCurrency(monthlySingle)
        })
      }
      
      const monthlyGrossBenefit = monthlyBase + monthlyAdjustment + monthlyConstraint + monthlySingle
      calculationSteps.push({
        label: language === 'fr' ? 'Prestation totale' : 'Total benefit',
        value: formatCurrency(monthlyGrossBenefit)
      })
      
      if (totalWorkIncome > 0) {
        calculationSteps.push({
          label: language === 'fr' ? `Revenus de travail (${formatCurrency(totalWorkIncome)}/an)` : `Work income (${formatCurrency(totalWorkIncome)}/year)`,
          value: `${formatCurrency(monthlyWorkIncome)}/mois`
        })
        
        // L'exemption officielle est de 200$/mois pour une personne seule
        const officialExemption = household.householdType === 'single' ? 200 : 300
        calculationSteps.push({
          label: language === 'fr' ? 'Revenus de travail exclus' : 'Excluded work income',
          value: formatCurrency(officialExemption)
        })
        
        calculationSteps.push({
          label: language === 'fr' ? `Réduction de la prestation mensuelle (max(0;${formatCurrency(monthlyWorkIncome)}-${formatCurrency(officialExemption)}))` : `Monthly benefit reduction (max(0;${formatCurrency(monthlyWorkIncome)}-${formatCurrency(officialExemption)}))`,
          value: monthlyReduction > 0 ? `-${formatCurrency(monthlyReduction)}` : formatCurrency(0)
        })
        
        if (workIncomeSuplement > 0) {
          calculationSteps.push({
            label: language === 'fr' ? 'Supplément 25% (2025)' : '25% supplement (2025)',
            value: `+${formatCurrency(monthlySupplement)}`
          })
        }
      }
      
      calculationSteps.push({
        label: language === 'fr' ? 'Prestation mensuelle' : 'Monthly benefit',
        value: formatCurrency(monthlyNet)
      })
      
      calculationSteps.push({
        label: language === 'fr' ? `Prestation annuelle (${formatCurrency(monthlyNet)} × 12)` : `Annual benefit (${formatCurrency(monthlyNet)} × 12)`,
        value: formatCurrency(netBenefit)
      })
    }

    // Références officielles
    const webReferences = [
      {
        title: language === 'fr' 
          ? 'Gouvernement du Québec - Aide sociale et solidarité sociale'
          : 'Government of Quebec - Social assistance and social solidarity',
        url: 'https://www.quebec.ca/famille-et-soutien-aux-personnes/aide-sociale-et-solidarite-sociale'
      }
    ]

    calculationSteps.push(...webReferences.map(ref => ({
      label: ref.title,
      value: ref.url,
      isReference: true
    })))

    return {
      name: language === 'fr' ? 'Aide sociale du Québec' : 'Quebec Social Assistance',
      description: language === 'fr'
        ? 'Programme d\'assistance financière de dernier recours pour les personnes et familles dans le besoin au Québec.'
        : 'Last resort financial assistance program for individuals and families in need in Quebec.',
      formula: language === 'fr'
        ? 'Prestation de base + Ajustement + Allocations - Réduction revenus + Supplément'
        : 'Base benefit + Adjustment + Allowances - Income reduction + Supplement',
      currentValue: netBenefit,
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
      : displayedProgram === 'federal_tax'
      ? getFederalTaxDetails()
      : displayedProgram === 'credit_solidarite'
      ? getSolidarityDetails()
      : displayedProgram === 'prime_travail'
      ? getWorkPremiumDetails()
      : displayedProgram === 'allocation_famille'
      ? getFamilyAllowanceDetails()
      : displayedProgram === 'allocation_enfants'
      ? getCanadaChildBenefitDetails()
      : displayedProgram === 'credit_tps'
      ? getGstCreditDetails()
      : displayedProgram === 'allocation_travailleurs'
      ? getCanadaWorkersBenefitDetails()
      : displayedProgram === 'securite_vieillesse'
      ? getOldAgeSecurityDetails()
      : displayedProgram === 'supplement_medical_federal'
      ? getFederalMedicalSupplementDetails()
      : displayedProgram === 'credit_medical'
      ? getQuebecMedicalSupplementDetails()
      : displayedProgram === 'aide_sociale'
      ? getSocialAssistanceDetails()
      : displayedProgram === 'credit_garde'
      ? getChildcareTaxCreditDetails()
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
        // Utiliser directement le revenu disponible calculé par le MainCalculator
        return results.revenu_disponible instanceof Decimal ? results.revenu_disponible.toNumber() : 0
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
      case 'federal_tax':
        return results.taxes?.canada instanceof Decimal ? -results.taxes.canada.toNumber() : 0
      case 'credit_solidarite':
        return results.quebec?.solidarity?.net_credit instanceof Decimal ? results.quebec.solidarity.net_credit.toNumber() : 0
      case 'prime_travail':
        return results.quebec?.work_premium?.net_premium instanceof Decimal ? results.quebec.work_premium.net_premium.toNumber() : 0
      case 'allocation_famille':
        return results.quebec?.family_allowance?.net_allowance instanceof Decimal ? results.quebec.family_allowance.net_allowance.toNumber() : 0
      case 'allocation_enfants':
        return results.canada?.child_benefit?.net_benefit instanceof Decimal ? results.canada.child_benefit.net_benefit.toNumber() : 0
      case 'credit_tps':
        return results.canada?.gst_credit?.amount instanceof Decimal ? results.canada.gst_credit.amount.toNumber() : 0
      case 'allocation_travailleurs':
        return results.canada?.workers_benefit?.amount instanceof Decimal ? results.canada.workers_benefit.amount.toNumber() : 0
      case 'securite_vieillesse':
        return results.canada?.old_age_security?.total_amount instanceof Decimal ? results.canada.old_age_security.total_amount.toNumber() : 0
      case 'supplement_medical_federal':
        return results.canada?.medical_expense_supplement?.amount instanceof Decimal ? results.canada.medical_expense_supplement.amount.toNumber() : 0
      case 'supplement_medical_quebec':
        return results.quebec?.medical_expense_supplement?.amount instanceof Decimal ? results.quebec.medical_expense_supplement.amount.toNumber() : 0
      case 'aide_sociale':
        return results.quebec?.social_assistance?.net_benefit instanceof Decimal ? results.quebec.social_assistance.net_benefit.toNumber() : 0
      case 'credit_garde_enfants':
        return results.quebec?.childcare_tax_credit?.net_credit instanceof Decimal ? results.quebec.childcare_tax_credit.net_credit.toNumber() : 0
      case 'fournitures_scolaires':
        return results.quebec?.school_supplies_supplement?.total_amount instanceof Decimal ? results.quebec.school_supplies_supplement.total_amount.toNumber() : 0
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
      value: (() => {
        // Calculer la somme de tous les programmes du Québec (fiscaux seulement)
        const quebecPrograms = [
          getValueForProgram('quebec_tax'),     // Impôt du Québec
          getValueForProgram('aide_sociale'),   // aide_sociale
          getValueForProgram('allocation_famille'), // allocation_famille
          getValueForProgram('fournitures_scolaires'), // fournitures_scolaires
          getValueForProgram('prime_travail'), // prime_travail
          getValueForProgram('credit_solidarite'), // credit_solidarite
          getValueForProgram('credit_garde_enfants'), // credit_garde_enfants
          0, // allocation_logement
          getValueForProgram('supplement_medical_quebec'), // credit_medical
          0  // soutien_aines
        ]
        return quebecPrograms.reduce((sum, value) => sum + value, 0)
      })(),
      items: [
        { key: 'quebec_tax', label: language === 'fr' ? 'Impôt sur le revenu des particuliers' : 'Personal Income Tax', value: getValueForProgram('quebec_tax') },
        { key: 'aide_sociale', label: language === 'fr' ? 'Aide sociale' : 'Social Assistance', value: getValueForProgram('aide_sociale') },
        { key: 'allocation_famille', label: language === 'fr' ? 'Allocation famille' : 'Family Allowance', value: getValueForProgram('allocation_famille') },
        { key: 'fournitures_scolaires', label: language === 'fr' ? 'Supplément pour l\'achat de fournitures scolaires' : 'School Supply Supplement', value: getValueForProgram('fournitures_scolaires') },
        { key: 'prime_travail', label: language === 'fr' ? 'Prime au travail' : 'Work Premium', value: getValueForProgram('prime_travail') },
        { key: 'credit_solidarite', label: language === 'fr' ? 'Crédit pour la solidarité' : 'Solidarity Tax Credit', value: getValueForProgram('credit_solidarite') },
        { key: 'credit_garde', label: language === 'fr' ? 'Crédit d\'impôt pour frais de garde d\'enfants' : 'Child Care Tax Credit', value: getValueForProgram('credit_garde_enfants') },
        { key: 'allocation_logement', label: language === 'fr' ? 'Allocation-logement' : 'Housing Allowance', value: 0 },
        { key: 'credit_medical', label: language === 'fr' ? 'Crédit d\'impôt remboursable pour frais médicaux' : 'Medical Expense Tax Credit', value: getValueForProgram('supplement_medical_quebec') },
        { key: 'soutien_aines', label: language === 'fr' ? 'Montant pour le soutien des aînés' : 'Amount for Support of Seniors', value: 0 }
      ]
    },
    {
      key: 'federal_section',
      label: language === 'fr' ? 'Régime fiscal fédéral' : 'Federal Tax System',
      value: (() => {
        // Calculer la somme de tous les programmes fédéraux
        const federalPrograms = [
          getValueForProgram('federal_tax'), // federal_tax
          getValueForProgram('allocation_enfants'), // allocation_enfants
          getValueForProgram('credit_tps'), // credit_tps
          getValueForProgram('allocation_travailleurs'), // allocation_travailleurs
          getValueForProgram('securite_vieillesse'), // securite_vieillesse
          getValueForProgram('supplement_medical_federal')  // supplement_medical_federal
        ]
        return federalPrograms.reduce((sum, value) => sum + value, 0)
      })(),
      items: [
        { key: 'federal_tax', label: language === 'fr' ? 'Impôt sur le revenu des particuliers' : 'Personal Income Tax', value: getValueForProgram('federal_tax') },
        { key: 'allocation_enfants', label: language === 'fr' ? 'Allocation canadienne pour enfants' : 'Canada Child Benefit', value: getValueForProgram('allocation_enfants') },
        { key: 'credit_tps', label: language === 'fr' ? 'Crédit pour la TPS' : 'GST Credit', value: getValueForProgram('credit_tps') },
        { key: 'allocation_travailleurs', label: language === 'fr' ? 'Allocation canadienne pour les travailleurs' : 'Canada Workers Benefit', value: getValueForProgram('allocation_travailleurs') },
        { key: 'securite_vieillesse', label: language === 'fr' ? 'Programme de la Sécurité de la vieillesse' : 'Old Age Security Program', value: getValueForProgram('securite_vieillesse') },
        { key: 'supplement_medical_federal', label: language === 'fr' ? 'Supplément remboursable pour frais médicaux' : 'Medical Expense Supplement', value: getValueForProgram('supplement_medical_federal') }
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
      value: (household?.totalChildcareExpenses || 0) === 0 ? 0 : -(household?.totalChildcareExpenses || 0),
      items: household?.children.map((child, index) => ({
        key: `child_${index}`,
        label: language === 'fr' ? `Enfant ${index + 1} (${child.age} ans)` : `Child ${index + 1} (${child.age} years old)`,
        value: child.childcareExpenses === 0 ? 0 : -child.childcareExpenses
      })) || [],
      standalone: false
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
                        {/* Indicateur d'épinglage pour tous les programmes socio-fiscaux principaux */}
                        {(item.key === 'assurance_emploi' || item.key === 'rrq' || item.key === 'rqap' || item.key === 'fss' || item.key === 'ramq' || item.key === 'quebec_tax' || item.key === 'federal_tax' || item.key === 'credit_solidarite' || item.key === 'prime_travail' || item.key === 'allocation_enfants' || item.key === 'credit_tps' || item.key === 'allocation_travailleurs' || item.key === 'securite_vieillesse' || item.key === 'supplement_medical_federal' || item.key === 'credit_medical' || item.key === 'aide_sociale' || item.key === 'fournitures_scolaires' || item.key === 'credit_garde') && (
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
                {(displayedProgram === 'assurance_emploi' || displayedProgram === 'rrq' || displayedProgram === 'rqap' || displayedProgram === 'fss' || displayedProgram === 'ramq' || displayedProgram === 'quebec_tax' || displayedProgram === 'federal_tax' || displayedProgram === 'credit_solidarite' || displayedProgram === 'allocation_enfants' || displayedProgram === 'supplement_medical_federal' || displayedProgram === 'credit_medical' || displayedProgram === 'aide_sociale') && (
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
                    // Détecter si le label contient du HTML
                    const hasHtml = param.label.includes('<span')
                    
                    return (
                      <div key={index} className="flex justify-between items-center" style={{ lineHeight: '1.3' }}>
                        {hasHtml ? (
                          <span 
                            className="text-sm" 
                            style={{ color: '#000000' }}
                            dangerouslySetInnerHTML={{ __html: param.label }}
                          />
                        ) : (
                          <span className={`text-sm ${isTotalSection ? 'font-bold' : ''}`} style={{ color: '#000000' }}>
                            {param.label}
                          </span>
                        )}
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
                      'Cliquez sur n\'importe quel programme socio-fiscal (impôts, cotisations, crédits et allocations) pour épingler les détails' : 
                      'Click on any socio-fiscal program (taxes, contributions, credits and benefits) to pin details'
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