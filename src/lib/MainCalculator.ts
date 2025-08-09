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
      const calculatorTypes = ['qpp', 'employment_insurance', 'ramq']
      
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
    // Ensure calculators are initialized
    if (Object.keys(this.calculators).length === 0) {
      await this.initialize()
    }

    const results: CalculationResults = {
      cotisations: {},
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

    // TODO: Add other calculators as they are implemented
    // - RQAP
    // - Quebec Tax (needed for RAMQ)
    // - FSS
    // - RAMQ (requires Quebec tax results)

    // Calculate total contributions
    results.cotisations.total = Object.values(results.cotisations)
      .filter((value): value is Decimal => value instanceof Decimal)
      .reduce((sum, value) => sum.plus(value), new Decimal(0))

    // TODO: Add other calculations (transfers, credits, etc.)

    return results
  }
}