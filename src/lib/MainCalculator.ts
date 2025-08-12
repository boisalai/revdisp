/**
 * Main calculator that coordinates all tax calculations
 */

import Decimal from 'decimal.js'
import { CalculatorFactory } from './core/factory'
import { Household } from './models'
import { InvalidTaxYearError } from './core/exceptions'
import { BaseCalculator } from './core/BaseCalculator'

// Import calculators to ensure registration
import './calculators'

export interface CalculationResults {
  cotisations: {
    rrq?: Decimal
    assurance_emploi?: Decimal
    rqap?: Decimal
    fss?: Decimal
    ramq?: Decimal
    total?: Decimal
  }
  taxes: {
    quebec?: Decimal
    canada?: Decimal
    total?: Decimal
  }
  quebec: Record<string, any>
  canada: Record<string, any>
  revenu_disponible: Decimal
}

export class RevenuDisponibleCalculator {
  private taxYear: number
  private calculators: Record<string, BaseCalculator> = {}

  constructor(taxYear: number = 2024) {
    this.taxYear = taxYear
  }

  /**
   * Initialize all calculators
   */
  async initialize(): Promise<void> {
    try {
      // Create the calculators we currently have implemented
      const calculatorTypes = ['qpp', 'employment_insurance', 'qpip', 'fss', 'quebec_tax', 'ramq']
      
      for (const type of calculatorTypes) {
        try {
          this.calculators[type] = await CalculatorFactory.createCalculator(type, this.taxYear)
        } catch (error) {
          console.warn(`Failed to create calculator ${type}:`, error)
        }
      }
    } catch (error) {
      throw new InvalidTaxYearError(`Failed to initialize calculators for year ${this.taxYear}: ${error}`)
    }
  }

  /**
   * Calculate all tax components for a household
   */
  async calculate(household: Household): Promise<CalculationResults> {
    // Always reinitialize calculators to ensure fresh config for the tax year
    // This is necessary because config can change between years
    await this.initialize()

    const results: CalculationResults = {
      cotisations: {},
      taxes: {},
      quebec: {},
      canada: {},
      revenu_disponible: new Decimal(0)
    }

    // 1. Calculate basic contributions
    
    // RRQ/QPP (if available)
    if (this.calculators.qpp) {
      const qppPrimary = this.calculators.qpp.calculate(household.primaryPerson)
      results.cotisations.rrq = qppPrimary.total

      if (household.spouse) {
        const qppSpouse = this.calculators.qpp.calculate(household.spouse)
        results.cotisations.rrq = results.cotisations.rrq.plus(qppSpouse.total)
      }
    }

    // Employment Insurance (if available)
    if (this.calculators.employment_insurance) {
      const eiPrimary = this.calculators.employment_insurance.calculate(household.primaryPerson)
      results.cotisations.assurance_emploi = eiPrimary.employee

      if (household.spouse) {
        const eiSpouse = this.calculators.employment_insurance.calculate(household.spouse)
        results.cotisations.assurance_emploi = results.cotisations.assurance_emploi.plus(eiSpouse.employee)
      }
    }

    // RQAP (if available)
    if (this.calculators.qpip) {
      const rqapPrimary = this.calculators.qpip.calculate(household.primaryPerson)
      results.cotisations.rqap = rqapPrimary.employee

      if (household.spouse) {
        const rqapSpouse = this.calculators.qpip.calculate(household.spouse)
        results.cotisations.rqap = results.cotisations.rqap.plus(rqapSpouse.employee)
      }
    }

    // FSS (if available)
    if (this.calculators.fss) {
      const fssPrimary = this.calculators.fss.calculate(household.primaryPerson)
      results.cotisations.fss = fssPrimary.total

      if (household.spouse) {
        const fssSpouse = this.calculators.fss.calculate(household.spouse)
        results.cotisations.fss = results.cotisations.fss.plus(fssSpouse.total)
      }
    }

    // 2. Calculate Quebec income tax (using social contributions for deductions)
    if (this.calculators.quebec_tax) {
      const qcTaxCalculator = this.calculators.quebec_tax as any
      if (qcTaxCalculator.calculateHousehold) {
        const contributions = {
          rrq: results.cotisations.rrq,
          ei: results.cotisations.assurance_emploi,  
          rqap: results.cotisations.rqap
        }
        const qcTaxResult = qcTaxCalculator.calculateHousehold(household, contributions)
        results.taxes.quebec = qcTaxResult.combined.net_tax
        
        // Store for RAMQ calculation
        results.quebec.net_income = qcTaxResult.combined.net_income
      }
    }

    // 3. Calculate RAMQ (using net family income from Quebec tax if available)
    if (this.calculators.ramq) {
      let familyNetIncome: Decimal
      
      // Use Quebec tax net income if available, otherwise gross income as fallback
      if (results.quebec.net_income && results.quebec.net_income.family) {
        familyNetIncome = results.quebec.net_income.family
      } else {
        // Fallback to gross family income
        familyNetIncome = household.primaryPerson.isRetired 
          ? household.primaryPerson.grossRetirementIncome 
          : household.primaryPerson.grossWorkIncome
        
        if (household.spouse) {
          const spouseIncome = household.spouse.isRetired
            ? household.spouse.grossRetirementIncome
            : household.spouse.grossWorkIncome
          familyNetIncome = familyNetIncome.plus(spouseIncome)
        }
      }

      const ramqResult = (this.calculators.ramq as any).calculate(household, {
        net_income: {
          family: familyNetIncome
        }
      })
      results.cotisations.ramq = ramqResult.contribution
    }

    // Calculate total contributions
    results.cotisations.total = Object.values(results.cotisations)
      .filter((value): value is Decimal => value instanceof Decimal)
      .reduce((sum, value) => sum.plus(value), new Decimal(0))

    // Calculate total taxes  
    results.taxes.total = Object.values(results.taxes)
      .filter((value): value is Decimal => value instanceof Decimal)
      .reduce((sum, value) => sum.plus(value), new Decimal(0))

    // Calculate disposable income
    // Gross income - contributions - taxes + transfers (to be implemented)
    const grossIncome = this.calculateGrossIncome(household)
    const totalContributions = results.cotisations.total || new Decimal(0)
    const totalTaxes = results.taxes.total || new Decimal(0)
    
    results.revenu_disponible = grossIncome
      .minus(totalContributions)
      .minus(totalTaxes)
    
    // Ensure disposable income is not negative
    results.revenu_disponible = Decimal.max(0, results.revenu_disponible)

    // TODO: Add transfers and credits to increase disposable income

    return results
  }

  /**
   * Calculate total gross income for a household
   */
  private calculateGrossIncome(household: Household): Decimal {
    let totalIncome = new Decimal(0)

    // Primary person income
    const primaryIncome = household.primaryPerson.isRetired
      ? household.primaryPerson.grossRetirementIncome
      : household.primaryPerson.grossWorkIncome
    totalIncome = totalIncome.plus(primaryIncome)

    // Spouse income (if applicable)
    if (household.spouse) {
      const spouseIncome = household.spouse.isRetired
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
      totalIncome = totalIncome.plus(spouseIncome)
    }

    return totalIncome
  }
}