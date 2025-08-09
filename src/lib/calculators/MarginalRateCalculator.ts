/**
 * Marginal tax rate calculator for streamgraph visualization
 * Computes the marginal contribution of each tax component at different income levels
 */

import Decimal from 'decimal.js'
import { CalculatorFactory } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'
import { BaseCalculator } from '../core/BaseCalculator'

export interface MarginalRateData {
  income: number
  components: {
    rrq: number
    assurance_emploi: number
    rqap: number
    fss: number
    ramq: number
    quebec_income_tax: number
    federal_income_tax: number
  }
  total_marginal_rate: number
}

export interface StreamgraphDataPoint {
  income: number
  component: string
  value: number
  cumulative: number
}

export class MarginalRateCalculator {
  private taxYear: number
  private calculators: Record<string, BaseCalculator> = {}
  private incomeStep: number
  private maxIncome: number

  constructor(taxYear: number = 2024, incomeStep: number = 1000, maxIncome: number = 200000) {
    this.taxYear = taxYear
    this.incomeStep = incomeStep
    this.maxIncome = maxIncome
  }

  /**
   * Initialize all calculators
   */
  async initialize(): Promise<void> {
    // Only initialize calculators that are currently implemented and work without dependencies
    const calculatorTypes = ['qpp', 'employment_insurance']
    
    for (const type of calculatorTypes) {
      try {
        this.calculators[type] = await CalculatorFactory.createCalculator(type, this.taxYear)
      } catch (error) {
        console.warn(`Failed to create calculator ${type}:`, error)
      }
    }
  }

  /**
   * Calculate marginal rates across income range
   */
  async calculateMarginalRates(householdType: 'single' | 'couple' | 'single_parent' | 'retiree' = 'single'): Promise<MarginalRateData[]> {
    if (Object.keys(this.calculators).length === 0) {
      await this.initialize()
    }

    const results: MarginalRateData[] = []
    
    for (let income = 0; income <= this.maxIncome; income += this.incomeStep) {
      const marginalRate = await this.calculateMarginalRateAtIncome(income, householdType)
      results.push(marginalRate)
    }

    return results
  }

  /**
   * Calculate marginal rate at specific income level
   */
  private async calculateMarginalRateAtIncome(income: number, householdType: string): Promise<MarginalRateData> {
    const baseIncome = income
    const incrementalIncome = income + 100 // Small increment to calculate marginal rate
    
    const baseDisposable = await this.calculateDisposableIncome(baseIncome, householdType)
    const incrementalDisposable = await this.calculateDisposableIncome(incrementalIncome, householdType)
    
    const marginalRate = 1 - (incrementalDisposable.minus(baseDisposable).toNumber() / 100)
    
    // Calculate component-wise marginal rates
    const components = await this.calculateComponentMarginalRates(baseIncome, incrementalIncome, householdType)

    return {
      income: baseIncome,
      components,
      total_marginal_rate: marginalRate
    }
  }

  /**
   * Calculate disposable income at given gross income
   */
  private async calculateDisposableIncome(grossIncome: number, householdType: string): Promise<Decimal> {
    const household = this.createHousehold(grossIncome, householdType)
    
    let totalDeductions = new Decimal(0)
    
    // Calculate each component
    if (this.calculators.qpp) {
      const qppResult = this.calculators.qpp.calculate(household.primaryPerson)
      totalDeductions = totalDeductions.plus(qppResult.total || 0)
    }
    
    if (this.calculators.employment_insurance) {
      const eiResult = this.calculators.employment_insurance.calculate(household.primaryPerson)
      totalDeductions = totalDeductions.plus(eiResult.employee || 0)
    }
    
    // RQAP and FSS calculators are not yet implemented
    // if (this.calculators.rqap) {
    //   const rqapResult = this.calculators.rqap.calculate(household.primaryPerson)
    //   totalDeductions = totalDeductions.plus(rqapResult.employee || 0)
    // }

    // if (this.calculators.fss && household.primaryPerson.age >= 65) {
    //   const fssResult = this.calculators.fss.calculate(household.primaryPerson)
    //   totalDeductions = totalDeductions.plus(fssResult.total || 0)
    // }

    // RAMQ requires Quebec tax results which are not implemented yet
    // Skip RAMQ calculation for now
    // if (this.calculators.ramq) {
    //   const ramqResult = this.calculators.ramq.calculate(household.primaryPerson, household)
    //   totalDeductions = totalDeductions.plus(ramqResult.contribution || 0)
    // }

    // TODO: Add Quebec and Federal income tax calculations once implemented
    
    return new Decimal(grossIncome).minus(totalDeductions)
  }

  /**
   * Calculate marginal rates for each component
   */
  private async calculateComponentMarginalRates(
    baseIncome: number, 
    incrementalIncome: number, 
    householdType: string
  ): Promise<MarginalRateData['components']> {
    const baseHousehold = this.createHousehold(baseIncome, householdType)
    const incrementalHousehold = this.createHousehold(incrementalIncome, householdType)
    
    const components: MarginalRateData['components'] = {
      rrq: 0,
      assurance_emploi: 0,
      rqap: 0,
      fss: 0,
      ramq: 0,
      quebec_income_tax: 0,
      federal_income_tax: 0
    }

    const increment = incrementalIncome - baseIncome

    // RRQ/QPP
    if (this.calculators.qpp) {
      const baseQpp = this.calculators.qpp.calculate(baseHousehold.primaryPerson).total || new Decimal(0)
      const incQpp = this.calculators.qpp.calculate(incrementalHousehold.primaryPerson).total || new Decimal(0)
      components.rrq = incQpp.minus(baseQpp).dividedBy(increment).toNumber()
    }

    // Employment Insurance
    if (this.calculators.employment_insurance) {
      const baseEi = this.calculators.employment_insurance.calculate(baseHousehold.primaryPerson).employee || new Decimal(0)
      const incEi = this.calculators.employment_insurance.calculate(incrementalHousehold.primaryPerson).employee || new Decimal(0)
      components.assurance_emploi = incEi.minus(baseEi).dividedBy(increment).toNumber()
    }

    // RQAP and FSS calculators are not yet implemented
    // RQAP
    // if (this.calculators.rqap) {
    //   const baseRqap = this.calculators.rqap.calculate(baseHousehold.primaryPerson).employee || new Decimal(0)
    //   const incRqap = this.calculators.rqap.calculate(incrementalHousehold.primaryPerson).employee || new Decimal(0)
    //   components.rqap = incRqap.minus(baseRqap).dividedBy(increment).toNumber()
    // }

    // FSS (for retirees 65+)
    // if (this.calculators.fss && baseHousehold.primaryPerson.age >= 65) {
    //   const baseFss = this.calculators.fss.calculate(baseHousehold.primaryPerson).total || new Decimal(0)
    //   const incFss = this.calculators.fss.calculate(incrementalHousehold.primaryPerson).total || new Decimal(0)
    //   components.fss = incFss.minus(baseFss).dividedBy(increment).toNumber()
    // }

    // RAMQ requires Quebec tax results which are not implemented yet
    // Skip RAMQ calculation for now
    // RAMQ
    // if (this.calculators.ramq) {
    //   const baseRamq = this.calculators.ramq.calculate(baseHousehold.primaryPerson, baseHousehold).contribution || new Decimal(0)
    //   const incRamq = this.calculators.ramq.calculate(incrementalHousehold.primaryPerson, incrementalHousehold).contribution || new Decimal(0)
    //   components.ramq = incRamq.minus(baseRamq).dividedBy(increment).toNumber()
    // }

    return components
  }

  /**
   * Create household for given income and type
   */
  private createHousehold(income: number, type: string): Household {
    const primaryPersonData = {
      age: type === 'retiree' ? 65 : 35,
      grossWorkIncome: type === 'retiree' ? new Decimal(0) : new Decimal(income),
      grossRetirementIncome: type === 'retiree' ? new Decimal(income) : new Decimal(0),
      isRetired: type === 'retiree'
    }

    let householdType: HouseholdType
    let spouseData: any = undefined
    let numChildren = 0

    switch (type) {
      case 'couple':
        householdType = HouseholdType.COUPLE
        spouseData = {
          age: 35,
          grossWorkIncome: new Decimal(income * 0.6), // Assume spouse earns 60% of primary
          grossRetirementIncome: new Decimal(0),
          isRetired: false
        }
        break
      case 'single_parent':
        householdType = HouseholdType.SINGLE_PARENT
        numChildren = 2
        break
      case 'retiree':
        householdType = HouseholdType.RETIRED_SINGLE
        break
      default:
        householdType = HouseholdType.SINGLE
        break
    }

    return new Household({
      householdType,
      primaryPerson: primaryPersonData,
      spouse: spouseData,
      numChildren
    })
  }

  /**
   * Convert marginal rate data to streamgraph format
   */
  transformToStreamgraphData(marginalRates: MarginalRateData[]): StreamgraphDataPoint[] {
    const streamData: StreamgraphDataPoint[] = []
    
    const componentNames = ['rrq', 'assurance_emploi', 'rqap', 'fss', 'ramq', 'quebec_income_tax', 'federal_income_tax'] as const
    
    for (const data of marginalRates) {
      let cumulative = 0
      
      for (const component of componentNames) {
        const value = data.components[component]
        streamData.push({
          income: data.income,
          component,
          value,
          cumulative
        })
        cumulative += value
      }
    }

    return streamData
  }
}