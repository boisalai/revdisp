'use client'

import { useState, useEffect } from 'react'
import { HouseholdType, Household, Person, ChildData } from '../lib/models'
import { RevenuDisponibleCalculator, CalculationResults } from '../lib/MainCalculator'
import { translations, Translation } from '../lib/i18n/translations'
import Slider from './Slider'
import Decimal from 'decimal.js'
import { MarginalRateVisualization } from './MarginalRateVisualization'
import DetailedResults from './DetailedResults'

interface CalculatorState {
  language: 'fr' | 'en'
  taxYear: number
  householdType: HouseholdType
  primaryPerson: {
    age: number
    grossWorkIncome: number
    grossRetirementIncome: number
    isRetired: boolean
  }
  spouse: {
    age: number
    grossWorkIncome: number
    grossRetirementIncome: number
    isRetired: boolean
  } | null
  numChildren: number
  children: ChildData[]
  medicalExpenses: number
  socialAssistance: {
    employmentConstraint: 'none' | 'temporary' | 'severe'
    partnerEmploymentConstraint: 'none' | 'temporary' | 'severe'
    liquidAssets: number
    firstTimeApplicant: boolean
    livingWithParents: boolean
  }
  housingAllowance: {
    annualHousingCost: number      // Coût annuel du logement (loyer + charges)
    liquidAssetsValue: number      // Valeur des avoirs liquides (CELI + comptes non enregistrés)
  }
}

export default function CompactCalculator() {
  const [isClient, setIsClient] = useState(false)
  const [state, setState] = useState<CalculatorState>({
    language: 'fr',
    taxYear: 2025,
    householdType: HouseholdType.SINGLE,
    primaryPerson: {
      age: 35,
      grossWorkIncome: 50000,
      grossRetirementIncome: 0,
      isRetired: false
    },
    spouse: null,
    numChildren: 0,
    children: [],
    medicalExpenses: 0,
    socialAssistance: {
      employmentConstraint: 'none',
      partnerEmploymentConstraint: 'none', 
      liquidAssets: 0,
      firstTimeApplicant: false,
      livingWithParents: false
    },
    housingAllowance: {
      annualHousingCost: 0,
      liquidAssetsValue: 0
    }
  })

  const [results, setResults] = useState<CalculationResults | null>(null)
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Accordion state for sections
  const [expandedSections, setExpandedSections] = useState({
    children: true,      // Show children section by default when applicable
    medical: false,      // Hide medical expenses by default
    socialAssistance: false,  // Hide social assistance by default
    housingAllowance: false   // Hide housing allowance by default
  })

  const t: Translation = translations[state.language]

  // Toggle accordion sections
  const toggleSection = (section: 'children' | 'medical' | 'socialAssistance' | 'housingAllowance') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Accordion header component
  const AccordionHeader = ({ 
    title, 
    section, 
    isExpanded, 
    showBadge = false, 
    badgeCount = 0 
  }: { 
    title: string
    section: 'children' | 'medical' | 'socialAssistance' | 'housingAllowance'
    isExpanded: boolean
    showBadge?: boolean
    badgeCount?: number
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-center space-x-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showBadge && badgeCount > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {badgeCount}
          </span>
        )}
      </div>
      <div className="flex items-center">
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  )

  // Derived values
  const hasSpouse = [HouseholdType.COUPLE, HouseholdType.RETIRED_COUPLE].includes(state.householdType)
  const canHaveChildren = [HouseholdType.SINGLE_PARENT, HouseholdType.COUPLE].includes(state.householdType)
  const isRetiredHousehold = [HouseholdType.RETIRED_SINGLE, HouseholdType.RETIRED_COUPLE].includes(state.householdType)

  // Generate household description
  const generateHouseholdDescription = (): string => {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat(state.language === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0
      }).format(value)

    let description = ''

    // Household type
    const householdTypeMap = {
      [HouseholdType.SINGLE]: t.householdTypes.single,
      [HouseholdType.SINGLE_PARENT]: t.householdTypes.singleParent,
      [HouseholdType.COUPLE]: t.householdTypes.couple,
      [HouseholdType.RETIRED_SINGLE]: t.householdTypes.retiredSingle,
      [HouseholdType.RETIRED_COUPLE]: t.householdTypes.retiredCouple
    }
    
    description += householdTypeMap[state.householdType]

    // Primary person details
    const primaryAge = state.primaryPerson.age
    const primaryWorkIncome = state.primaryPerson.grossWorkIncome
    const primaryRetirementIncome = state.primaryPerson.grossRetirementIncome

    if (state.language === 'fr') {
      description += `, adulte de ${primaryAge} ans`
      
      if (primaryWorkIncome > 0) {
        description += `, avec un revenu brut de travail de ${formatCurrency(primaryWorkIncome)}`
      }
      if (primaryRetirementIncome > 0) {
        description += `, avec un revenu de retraite de ${formatCurrency(primaryRetirementIncome)}`
      }
    } else {
      description += `, adult aged ${primaryAge} years`
      
      if (primaryWorkIncome > 0) {
        description += `, with gross work income of ${formatCurrency(primaryWorkIncome)}`
      }
      if (primaryRetirementIncome > 0) {
        description += `, with retirement income of ${formatCurrency(primaryRetirementIncome)}`
      }
    }

    // Spouse details
    if (state.spouse) {
      const spouseAge = state.spouse.age
      const spouseWorkIncome = state.spouse.grossWorkIncome
      const spouseRetirementIncome = state.spouse.grossRetirementIncome

      if (state.language === 'fr') {
        description += `, conjoint de ${spouseAge} ans`
        
        if (spouseWorkIncome > 0) {
          description += ` avec un revenu brut de travail de ${formatCurrency(spouseWorkIncome)}`
        }
        if (spouseRetirementIncome > 0) {
          description += ` avec un revenu de retraite de ${formatCurrency(spouseRetirementIncome)}`
        }
      } else {
        description += `, spouse aged ${spouseAge} years`
        
        if (spouseWorkIncome > 0) {
          description += ` with gross work income of ${formatCurrency(spouseWorkIncome)}`
        }
        if (spouseRetirementIncome > 0) {
          description += ` with retirement income of ${formatCurrency(spouseRetirementIncome)}`
        }
      }
    }

    // Children details
    if (state.children.length > 0) {
      if (state.language === 'fr') {
        if (state.children.length === 1) {
          const child = state.children[0]
          description += `, ayant un enfant de ${child.age} ans`
          if (child.childcareExpenses > 0) {
            description += `, frais de garde de ${formatCurrency(child.childcareExpenses)} par année`
          }
        } else {
          description += `, ayant ${state.children.length} enfants`
          const childrenAges = state.children.map(c => `${c.age} ans`).join(', ')
          description += ` (${childrenAges})`
          
          const totalChildcareExpenses = state.children.reduce((sum, c) => sum + c.childcareExpenses, 0)
          if (totalChildcareExpenses > 0) {
            description += `, frais de garde totaux de ${formatCurrency(totalChildcareExpenses)} par année`
          }
        }
      } else {
        if (state.children.length === 1) {
          const child = state.children[0]
          description += `, having one child aged ${child.age} years`
          if (child.childcareExpenses > 0) {
            description += `, childcare expenses of ${formatCurrency(child.childcareExpenses)} per year`
          }
        } else {
          description += `, having ${state.children.length} children`
          const childrenAges = state.children.map(c => `${c.age} years`).join(', ')
          description += ` (${childrenAges})`
          
          const totalChildcareExpenses = state.children.reduce((sum, c) => sum + c.childcareExpenses, 0)
          if (totalChildcareExpenses > 0) {
            description += `, total childcare expenses of ${formatCurrency(totalChildcareExpenses)} per year`
          }
        }
      }
    }

    // Medical expenses
    if (state.medicalExpenses > 0) {
      if (state.language === 'fr') {
        description += `, frais médicaux de ${formatCurrency(state.medicalExpenses)} par année`
      } else {
        description += `, medical expenses of ${formatCurrency(state.medicalExpenses)} per year`
      }
    }

    description += '.'

    return description
  }

  // Update spouse state when household type changes
  useEffect(() => {
    if (hasSpouse && !state.spouse) {
      setState(prev => ({
        ...prev,
        spouse: {
          age: isRetiredHousehold ? 65 : 35,
          grossWorkIncome: isRetiredHousehold ? 0 : 30000,
          grossRetirementIncome: isRetiredHousehold ? 25000 : 0,
          isRetired: isRetiredHousehold
        }
      }))
    } else if (!hasSpouse && state.spouse) {
      setState(prev => ({ ...prev, spouse: null }))
    }
  }, [hasSpouse, isRetiredHousehold, state.spouse])

  // Update children array when number changes
  useEffect(() => {
    if (state.numChildren !== state.children.length) {
      const newChildren = Array.from({ length: state.numChildren }, (_, index) => 
        state.children[index] || {
          age: 5,
          childcareExpenses: 0,
          childcareType: 'subsidized' as const
        }
      )
      setState(prev => ({ ...prev, children: newChildren }))
    }
  }, [state.numChildren, state.children.length])

  // Update retirement status when household type changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      primaryPerson: {
        ...prev.primaryPerson,
        isRetired: isRetiredHousehold,
        age: isRetiredHousehold ? Math.max(65, prev.primaryPerson.age) : prev.primaryPerson.age,
        grossRetirementIncome: isRetiredHousehold ? (prev.primaryPerson.grossRetirementIncome || 50000) : prev.primaryPerson.grossRetirementIncome
      }
    }))
  }, [isRetiredHousehold])

  // Adjust number of children when household type changes (Ministry of Finance behavior)
  useEffect(() => {
    setState(prev => {
      let newNumChildren = prev.numChildren

      // Force 0 children for household types that cannot have children
      if ([HouseholdType.SINGLE, HouseholdType.RETIRED_SINGLE, HouseholdType.RETIRED_COUPLE].includes(prev.householdType)) {
        newNumChildren = 0
      }
      // Force minimum 1 child for single parent families
      else if (prev.householdType === HouseholdType.SINGLE_PARENT && prev.numChildren === 0) {
        newNumChildren = 1
      }

      if (newNumChildren !== prev.numChildren) {
        return { ...prev, numChildren: newNumChildren }
      }
      return prev
    })
  }, [state.householdType])

  // Auto-calculate when values change
  const handleCalculate = async () => {
    setLoading(true)
    setError(null)

    try {
      const calculator = new RevenuDisponibleCalculator(state.taxYear)
      await calculator.initialize()

      const household = new Household({
        householdType: state.householdType,
        primaryPerson: {
          age: state.primaryPerson.age,
          grossWorkIncome: state.primaryPerson.isRetired ? 0 : state.primaryPerson.grossWorkIncome,
          grossRetirementIncome: state.primaryPerson.grossRetirementIncome,
          isRetired: state.primaryPerson.isRetired
        },
        spouse: state.spouse ? {
          age: state.spouse.age,
          grossWorkIncome: state.spouse.isRetired ? 0 : state.spouse.grossWorkIncome,
          grossRetirementIncome: state.spouse.grossRetirementIncome,
          isRetired: state.spouse.isRetired
        } : undefined,
        numChildren: state.numChildren,
        children: state.children,
        medicalExpenses: state.medicalExpenses,
        socialAssistance: state.socialAssistance,
        annualHousingCost: state.housingAllowance.annualHousingCost,
        liquidAssetsValue: state.housingAllowance.liquidAssetsValue
      })

      console.log('Starting calculation for household:', household)
      console.log('CompactCalculator - state.children:', state.children)
      console.log('CompactCalculator - household.children:', household.children)
      console.log('CompactCalculator - household.totalChildcareExpenses:', household.totalChildcareExpenses)
      const calculationResults = await calculator.calculate(household)
      console.log('Calculation results:', calculationResults)
      setResults(calculationResults)
      setCurrentHousehold(household)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de calcul')
      console.error('Calculation error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      handleCalculate()
    }
  }, [isClient, state.taxYear, state.householdType, state.primaryPerson, state.spouse, state.numChildren, state.children, state.medicalExpenses, state.socialAssistance])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(state.language === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(value)
  }

  // Convert household type for visualization
  const getVisualizationHouseholdType = (): 'single' | 'couple' | 'single_parent' | 'retiree' => {
    switch (state.householdType) {
      case HouseholdType.SINGLE:
        return 'single'
      case HouseholdType.COUPLE:
        return 'couple'
      case HouseholdType.SINGLE_PARENT:
        return 'single_parent'
      case HouseholdType.RETIRED_SINGLE:
      case HouseholdType.RETIRED_COUPLE:
        return 'retiree'
      default:
        return 'single'
    }
  }

  const childrenOptions = [
    { value: 0, label: state.language === 'fr' ? 'Aucun enfant' : 'No children' },
    { value: 1, label: state.language === 'fr' ? 'Un enfant' : 'One child' },
    { value: 2, label: state.language === 'fr' ? 'Deux enfants' : 'Two children' },
    { value: 3, label: state.language === 'fr' ? 'Trois enfants' : 'Three children' },
    { value: 4, label: state.language === 'fr' ? 'Quatre enfants' : 'Four children' },
    { value: 5, label: state.language === 'fr' ? 'Cinq enfants' : 'Five children' },
  ]

  const getChildLabel = (index: number): string => {
    const labels = {
      fr: ['Premier enfant', 'Deuxième enfant', 'Troisième enfant', 'Quatrième enfant', 'Cinquième enfant'],
      en: ['First child', 'Second child', 'Third child', 'Fourth child', 'Fifth child']
    }
    return labels[state.language][index] || `${index + 1}${state.language === 'fr' ? 'e' : ''} enfant`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 text-sm">
      {/* Compact Header with Language Toggle */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-600">{t.subtitle}</p>
          </div>
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setState(prev => ({ ...prev, language: 'fr' }))}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                state.language === 'fr'
                  ? 'bg-govuk-blue text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, language: 'en' }))}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                state.language === 'en'
                  ? 'bg-govuk-blue text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Compact Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Tax Year */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t.taxYear}
            </label>
            <select
              value={state.taxYear}
              onChange={(e) => setState(prev => ({ ...prev, taxYear: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          {/* Household Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t.familySituation}
            </label>
            <select
              value={state.householdType}
              onChange={(e) => setState(prev => ({ ...prev, householdType: e.target.value as HouseholdType }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={HouseholdType.SINGLE}>{t.householdTypes.single}</option>
              <option value={HouseholdType.SINGLE_PARENT}>{t.householdTypes.singleParent}</option>
              <option value={HouseholdType.COUPLE}>{t.householdTypes.couple}</option>
              <option value={HouseholdType.RETIRED_SINGLE}>{t.householdTypes.retiredSingle}</option>
              <option value={HouseholdType.RETIRED_COUPLE}>{t.householdTypes.retiredCouple}</option>
            </select>
          </div>

          {/* Children */}
          {canHaveChildren && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t.numberOfChildren}
              </label>
              <select
                value={state.numChildren}
                onChange={(e) => setState(prev => ({ ...prev, numChildren: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {childrenOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Income Controls in Compact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Person */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">
              {state.language === 'fr' ? 'Personne principale' : 'Primary Person'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Slider
                  label={`${t.age} (${state.primaryPerson.age} ans)`}
                  value={state.primaryPerson.age}
                  onChange={(age) => setState(prev => ({
                    ...prev,
                    primaryPerson: { ...prev.primaryPerson, age }
                  }))}
                  min={isRetiredHousehold ? 65 : 18}
                  max={100}
                  step={1}
                />
              </div>
              
              <div>
                {!isRetiredHousehold ? (
                  <Slider
                    label={`${t.grossWorkIncome}`}
                    value={state.primaryPerson.grossWorkIncome}
                    onChange={(grossWorkIncome) => setState(prev => ({
                      ...prev,
                      primaryPerson: { ...prev.primaryPerson, grossWorkIncome }
                    }))}
                    min={0}
                    max={200000}
                    step={1000}
                    formatter={formatCurrency}
                  />
                ) : (
                  <Slider
                    label={`${t.grossRetirementIncome}`}
                    value={state.primaryPerson.grossRetirementIncome}
                    onChange={(grossRetirementIncome) => setState(prev => ({
                      ...prev,
                      primaryPerson: { ...prev.primaryPerson, grossRetirementIncome }
                    }))}
                    min={0}
                    max={100000}
                    step={1000}
                    formatter={formatCurrency}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Spouse (if applicable) */}
          {hasSpouse && state.spouse && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">
                {state.language === 'fr' ? 'Conjoint(e)' : 'Spouse'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Slider
                    label={`${t.age} (${state.spouse.age} ans)`}
                    value={state.spouse.age}
                    onChange={(age) => setState(prev => ({
                      ...prev,
                      spouse: prev.spouse ? { ...prev.spouse, age } : null
                    }))}
                    min={isRetiredHousehold ? 65 : 18}
                    max={100}
                    step={1}
                  />
                </div>
                
                <div>
                  {!isRetiredHousehold ? (
                    <Slider
                      label={`${t.spouseGrossWorkIncome}`}
                      value={state.spouse.grossWorkIncome}
                      onChange={(grossWorkIncome) => setState(prev => ({
                        ...prev,
                        spouse: prev.spouse ? { ...prev.spouse, grossWorkIncome } : null
                      }))}
                      min={0}
                      max={200000}
                      step={1000}
                      formatter={formatCurrency}
                    />
                  ) : (
                    <Slider
                      label={`${t.spouseGrossRetirementIncome}`}
                      value={state.spouse.grossRetirementIncome}
                      onChange={(grossRetirementIncome) => setState(prev => ({
                        ...prev,
                        spouse: prev.spouse ? { ...prev.spouse, grossRetirementIncome } : null
                      }))}
                      min={0}
                      max={100000}
                      step={1000}
                      formatter={formatCurrency}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Children Section - Accordion */}
        {canHaveChildren && state.numChildren > 0 && (
          <div className="mt-6">
            <AccordionHeader 
              title={state.language === 'fr' ? 'Informations sur les enfants' : 'Children Information'}
              section="children"
              isExpanded={expandedSections.children}
              showBadge={true}
              badgeCount={state.numChildren}
            />
            {expandedSections.children && (
              <div className="border border-t-0 border-gray-200 rounded-b-lg bg-gray-50 p-4">
                <div className="space-y-4">
                  {state.children.map((child, index) => (
                    <div key={index} className="border-l-4 border-blue-400 pl-4 py-2 bg-white rounded">
                      <div className="text-sm font-bold text-gray-900 mb-3">
                        {getChildLabel(index)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Child Age */}
                        <div>
                          <Slider
                            label={`${state.language === 'fr' ? 'Âge' : 'Age'} (${child.age} ${state.language === 'fr' ? 'ans' : 'years'})`}
                            value={child.age}
                            onChange={(age) => setState(prev => ({
                              ...prev,
                              children: prev.children.map((c, i) => i === index ? { ...c, age } : c)
                            }))}
                            min={0}
                            max={17}
                            step={1}
                          />
                        </div>
                        
                        {/* Childcare Expenses */}
                        <div>
                          <Slider
                            label={`${state.language === 'fr' ? 'Frais de garde' : 'Childcare Expenses'}`}
                            value={child.childcareExpenses}
                            onChange={(childcareExpenses) => setState(prev => ({
                              ...prev,
                              children: prev.children.map((c, i) => i === index ? { ...c, childcareExpenses } : c)
                            }))}
                            min={0}
                            max={15000}
                            step={100}
                            formatter={formatCurrency}
                          />
                        </div>
                        
                        {/* Childcare Type */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            {state.language === 'fr' ? 'Service de garde' : 'Childcare Service'}
                          </label>
                          <select
                            value={child.childcareType}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              children: prev.children.map((c, i) => 
                                i === index ? { ...c, childcareType: e.target.value as 'subsidized' | 'nonSubsidized' } : c
                              )
                            }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            <option value="subsidized">
                              {state.language === 'fr' ? 'Subventionné' : 'Subsidized'}
                            </option>
                            <option value="nonSubsidized">
                              {state.language === 'fr' ? 'Non subventionné' : 'Non-subsidized'}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medical Expenses Section - Accordion */}
        <div className="mt-6">
          <AccordionHeader 
            title={state.language === 'fr' ? 'Frais médicaux' : 'Medical Expenses'}
            section="medical"
            isExpanded={expandedSections.medical}
          />
          {expandedSections.medical && (
            <div className="border border-t-0 border-gray-200 rounded-b-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Slider
                    label={t.medicalExpenses}
                    value={state.medicalExpenses}
                    onChange={(medicalExpenses) => setState(prev => ({
                      ...prev,
                      medicalExpenses
                    }))}
                    min={0}
                    max={15000}
                    step={100}
                    formatter={formatCurrency}
                  />
                </div>
                <div></div>
              </div>
            </div>
          )}
        </div>

        {/* Social Assistance Section - Accordion */}
        <div className="mt-6">
          <AccordionHeader 
            title={t.socialAssistance?.title || (state.language === 'fr' ? 'Aide sociale' : 'Social Assistance')}
            section="socialAssistance"
            isExpanded={expandedSections.socialAssistance}
          />
          {expandedSections.socialAssistance && (
            <div className="border border-t-0 border-gray-200 rounded-b-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Employment Constraints */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.socialAssistance?.employmentConstraint || 'Contrainte à l\'emploi (personne principale)'}
                  </label>
                  <select
                    value={state.socialAssistance.employmentConstraint}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      socialAssistance: {
                        ...prev.socialAssistance,
                        employmentConstraint: e.target.value as 'none' | 'temporary' | 'severe'
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">{t.socialAssistance?.constraintNone || 'Aucune contrainte'}</option>
                    <option value="temporary">{t.socialAssistance?.constraintTemporary || 'Contrainte temporaire'}</option>
                    <option value="severe">{t.socialAssistance?.constraintSevere || 'Contrainte sévère'}</option>
                  </select>
                </div>

                {/* Partner Employment Constraints (if applicable) */}
                {hasSpouse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.socialAssistance?.partnerEmploymentConstraint || 'Contrainte à l\'emploi (conjoint)'}
                    </label>
                    <select
                      value={state.socialAssistance.partnerEmploymentConstraint}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        socialAssistance: {
                          ...prev.socialAssistance,
                          partnerEmploymentConstraint: e.target.value as 'none' | 'temporary' | 'severe'
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">{t.socialAssistance?.constraintNone || 'Aucune contrainte'}</option>
                      <option value="temporary">{t.socialAssistance?.constraintTemporary || 'Contrainte temporaire'}</option>
                      <option value="severe">{t.socialAssistance?.constraintSevere || 'Contrainte sévère'}</option>
                    </select>
                  </div>
                )}
                
                {!hasSpouse && <div></div>}

                {/* Liquid Assets */}
                <div>
                  <Slider
                    label={t.socialAssistance?.liquidAssets || 'Avoirs liquides'}
                    value={state.socialAssistance.liquidAssets}
                    onChange={(liquidAssets) => setState(prev => ({
                      ...prev,
                      socialAssistance: {
                        ...prev.socialAssistance,
                        liquidAssets
                      }
                    }))}
                    min={0}
                    max={5000}
                    step={50}
                    formatter={formatCurrency}
                  />
                </div>

                <div></div>

                {/* First Time Applicant Checkbox */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={state.socialAssistance.firstTimeApplicant}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        socialAssistance: {
                          ...prev.socialAssistance,
                          firstTimeApplicant: e.target.checked
                        }
                      }))}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t.socialAssistance?.firstTimeApplicant || 'Première demande (Programme objectif emploi)'}
                    </span>
                  </label>
                </div>

                {/* Living With Parents Checkbox */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={state.socialAssistance.livingWithParents}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        socialAssistance: {
                          ...prev.socialAssistance,
                          livingWithParents: e.target.checked
                        }
                      }))}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t.socialAssistance?.livingWithParents || 'Vit chez ses parents'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Housing Allowance Section - Accordion */}
        <div className="mt-6">
          <AccordionHeader 
            title={state.language === 'fr' ? 'Allocation-logement' : 'Housing Allowance'}
            section="housingAllowance"
            isExpanded={expandedSections.housingAllowance}
          />
          {expandedSections.housingAllowance && (
            <div className="border border-t-0 border-gray-200 rounded-b-lg bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Annual Housing Cost */}
                <div>
                  <Slider
                    label={state.language === 'fr' ? 'Coût annuel du logement (loyer + charges)' : 'Annual housing cost (rent + charges)'}
                    value={state.housingAllowance.annualHousingCost}
                    onChange={(annualHousingCost) => setState(prev => ({
                      ...prev,
                      housingAllowance: {
                        ...prev.housingAllowance,
                        annualHousingCost
                      }
                    }))}
                    min={0}
                    max={50000}
                    step={500}
                    formatter={formatCurrency}
                  />
                </div>

                {/* Liquid Assets Value */}
                <div>
                  <Slider
                    label={state.language === 'fr' ? 'Valeur des avoirs liquides (CELI + comptes non enregistrés)' : 'Liquid assets value (TFSA + non-registered accounts)'}
                    value={state.housingAllowance.liquidAssetsValue}
                    onChange={(liquidAssetsValue) => setState(prev => ({
                      ...prev,
                      housingAllowance: {
                        ...prev.housingAllowance,
                        liquidAssetsValue
                      }
                    }))}
                    min={0}
                    max={60000}
                    step={1000}
                    formatter={formatCurrency}
                  />
                </div>

                {/* Information note */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">
                        {state.language === 'fr' ? 'Conditions d\'admissibilité :' : 'Eligibility conditions:'}
                      </p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• {state.language === 'fr' ? 'Familles avec enfants OU personne de 50 ans et plus' : 'Families with children OR person 50+ years old'}</li>
                        <li>• {state.language === 'fr' ? 'Avoirs liquides < 50 000$' : 'Liquid assets < $50,000'}</li>
                        <li>• {state.language === 'fr' ? 'Coût du logement ≥ 30% du revenu familial' : 'Housing cost ≥ 30% of family income'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Household Description */}
      {isClient && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {state.language === 'fr' ? 'Description du ménage' : 'Household description'}
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                {generateHouseholdDescription()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results - Detailed Table */}
      {isClient && results && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <DetailedResults 
            results={results} 
            household={currentHousehold || undefined}
            taxYear={state.taxYear}
            language={state.language} 
            formatCurrency={formatCurrency} 
          />
        </div>
      )}

      {/* Streamgraph Visualization */}
      <MarginalRateVisualization
        taxYear={state.taxYear}
        language={state.language}
        householdType={getVisualizationHouseholdType()}
        className=""
      />

      {/* Footer */}
      <div className="text-center py-4 text-sm text-gray-500">
        <p>Basé sur le calculateur officiel du ministère des Finances du Québec</p>
        <div className="flex items-center justify-center space-x-2 mt-1">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Validation continue avec les données officielles</span>
        </div>
      </div>
    </div>
  )
}