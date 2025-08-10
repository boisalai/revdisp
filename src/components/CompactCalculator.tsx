'use client'

import { useState, useEffect } from 'react'
import { HouseholdType, Household, Person } from '../lib/models'
import { RevenuDisponibleCalculator, CalculationResults } from '../lib/MainCalculator'
import { translations, Translation } from '../lib/i18n/translations'
import Slider from './Slider'
import Decimal from 'decimal.js'
import { MarginalRateVisualization } from './MarginalRateVisualization'
import DetailedResults from './DetailedResults'

interface Child {
  age: number
  childcareExpenses: number
  childcareType: 'subsidized' | 'nonSubsidized'
}

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
  children: Child[]
}

export default function CompactCalculator() {
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
    children: []
  })

  const [results, setResults] = useState<CalculationResults | null>(null)
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t: Translation = translations[state.language]

  // Derived values
  const hasSpouse = [HouseholdType.COUPLE, HouseholdType.RETIRED_COUPLE].includes(state.householdType)
  const canHaveChildren = [HouseholdType.SINGLE_PARENT, HouseholdType.COUPLE, HouseholdType.RETIRED_COUPLE].includes(state.householdType)
  const isRetiredHousehold = [HouseholdType.RETIRED_SINGLE, HouseholdType.RETIRED_COUPLE].includes(state.householdType)

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
          grossWorkIncome: state.primaryPerson.grossWorkIncome,
          grossRetirementIncome: state.primaryPerson.grossRetirementIncome,
          isRetired: state.primaryPerson.isRetired
        },
        spouse: state.spouse ? {
          age: state.spouse.age,
          grossWorkIncome: state.spouse.grossWorkIncome,
          grossRetirementIncome: state.spouse.grossRetirementIncome,
          isRetired: state.spouse.isRetired
        } : undefined,
        numChildren: state.numChildren
      })

      console.log('Starting calculation for household:', household)
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
    handleCalculate()
  }, [state.taxYear, state.householdType, state.primaryPerson, state.spouse, state.numChildren])

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

        {/* Children Details - Readable & Compact */}
        {canHaveChildren && state.numChildren > 0 && (
          <div className="mt-4 space-y-4">
            {state.children.map((child, index) => (
              <div key={index} className="border-l-4 border-blue-400 pl-4 py-2">
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
        )}
      </div>

      {/* Results - Detailed Table */}
      {results && (
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