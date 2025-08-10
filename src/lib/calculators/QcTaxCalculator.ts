/**
 * Quebec Income Tax Calculator
 * Calcule l'impôt sur le revenu du Québec avec crédits et déductions
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person, Household } from '../models'

export interface QcTaxResult {
  gross_income: Decimal
  taxable_income: Decimal
  tax_before_credits: Decimal
  credits: {
    basic: Decimal
    age_65: Decimal
    pension: Decimal
    living_alone: Decimal
    total: Decimal
  }
  net_tax: Decimal
  net_income: {
    individual: Decimal
    family: Decimal
  }
}

export class QcTaxCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'quebec_tax'
  }

  /**
   * Calculate Quebec tax for a household
   */
  calculateHousehold(household: Household, contributions?: {
    rrq?: Decimal
    ei?: Decimal
    rqap?: Decimal
  }): { primary: QcTaxResult, spouse?: QcTaxResult, combined: QcTaxResult } {
    // Calculate for primary person
    const primaryResult = this.calculateForPerson(household.primaryPerson, household, contributions)
    
    // Calculate for spouse if applicable
    let spouseResult: QcTaxResult | undefined
    if (household.spouse) {
      spouseResult = this.calculateForPerson(household.spouse, household, contributions)
    }

    // Combine results for family income
    const combined: QcTaxResult = {
      gross_income: primaryResult.gross_income.plus(spouseResult?.gross_income || 0),
      taxable_income: primaryResult.taxable_income.plus(spouseResult?.taxable_income || 0),
      tax_before_credits: primaryResult.tax_before_credits.plus(spouseResult?.tax_before_credits || 0),
      credits: {
        basic: primaryResult.credits.basic.plus(spouseResult?.credits.basic || 0),
        age_65: primaryResult.credits.age_65.plus(spouseResult?.credits.age_65 || 0),
        pension: primaryResult.credits.pension.plus(spouseResult?.credits.pension || 0),
        living_alone: primaryResult.credits.living_alone.plus(spouseResult?.credits.living_alone || 0),
        total: primaryResult.credits.total.plus(spouseResult?.credits.total || 0)
      },
      net_tax: primaryResult.net_tax.plus(spouseResult?.net_tax || 0),
      net_income: {
        individual: primaryResult.net_income.individual,
        family: primaryResult.net_income.individual.plus(spouseResult?.net_income.individual || 0)
      }
    }

    return { primary: primaryResult, spouse: spouseResult, combined }
  }

  /**
   * Calculate Quebec tax for an individual
   */
  private calculateForPerson(person: Person, household: Household, contributions?: {
    rrq?: Decimal
    ei?: Decimal
    rqap?: Decimal
  }): QcTaxResult {
    // 1. Determine gross income
    const grossIncome = person.isRetired 
      ? person.grossRetirementIncome 
      : person.grossWorkIncome

    // 2. Calculate deductions (social contributions)
    let totalDeductions = new Decimal(0)
    if (contributions) {
      const deductionRates = this.getDeductionRates()
      
      if (contributions.rrq) {
        totalDeductions = totalDeductions.plus(contributions.rrq.times(deductionRates.cpp))
      }
      if (contributions.ei) {
        totalDeductions = totalDeductions.plus(contributions.ei.times(deductionRates.ei))
      }
      if (contributions.rqap) {
        totalDeductions = totalDeductions.plus(contributions.rqap.times(deductionRates.qpip))
      }
    }

    // 3. Calculate taxable income
    const taxableIncome = Decimal.max(0, grossIncome.minus(totalDeductions))

    // 4. Calculate tax before credits
    const taxBeforeCredits = this.calculateTaxOnIncome(taxableIncome)

    // 5. Calculate non-refundable tax credits
    const credits = this.calculateCredits(person, household, taxableIncome)

    // 6. Calculate net tax (cannot be negative)
    const netTax = Decimal.max(0, taxBeforeCredits.minus(credits.total))

    // 7. Calculate net income
    const netIncome = grossIncome.minus(totalDeductions).minus(netTax)

    return {
      gross_income: this.quantize(grossIncome),
      taxable_income: this.quantize(taxableIncome),
      tax_before_credits: this.quantize(taxBeforeCredits),
      credits,
      net_tax: this.quantize(netTax),
      net_income: {
        individual: this.quantize(netIncome),
        family: this.quantize(netIncome) // Will be combined at household level
      }
    }
  }

  /**
   * Calculate tax on taxable income using progressive brackets
   */
  private calculateTaxOnIncome(taxableIncome: Decimal): Decimal {
    const brackets = this.getTaxBrackets()
    let tax = new Decimal(0)
    let previousMax = new Decimal(0)

    for (const bracket of brackets) {
      const bracketMin = this.toDecimal(bracket.min)
      const bracketMax = this.toDecimal(bracket.max)
      const rate = this.toDecimal(bracket.rate)

      if (taxableIncome.lessThanOrEqualTo(bracketMin)) {
        break
      }

      const taxableInBracket = Decimal.min(
        taxableIncome.minus(bracketMin),
        bracketMax.minus(bracketMin)
      )

      if (taxableInBracket.greaterThan(0)) {
        tax = tax.plus(taxableInBracket.times(rate))
      }

      previousMax = bracketMax
      if (taxableIncome.lessThanOrEqualTo(bracketMax)) {
        break
      }
    }

    return tax
  }

  /**
   * Calculate non-refundable tax credits
   */
  private calculateCredits(person: Person, household: Household, taxableIncome: Decimal): {
    basic: Decimal
    age_65: Decimal
    pension: Decimal
    living_alone: Decimal
    total: Decimal
  } {
    const creditAmounts = this.getCreditAmounts()
    const lowestRate = this.getLowestTaxRate()

    // Basic personal amount (everyone gets this)
    const basicCredit = this.toDecimal(creditAmounts.basic_amount).times(lowestRate)

    // Age 65+ credit
    let age65Credit = new Decimal(0)
    if (person.age >= 65) {
      age65Credit = this.toDecimal(creditAmounts.age_65_amount).times(lowestRate)
    }

    // Pension credit (for retirement income)
    let pensionCredit = new Decimal(0)
    if (person.isRetired && person.grossRetirementIncome.greaterThan(0)) {
      const maxPensionCredit = this.toDecimal(creditAmounts.pension_amount)
      const eligibleAmount = Decimal.min(person.grossRetirementIncome, maxPensionCredit)
      pensionCredit = eligibleAmount.times(lowestRate)
    }

    // Living alone credit (single person without children)
    let livingAloneCredit = new Decimal(0)
    if (!household.spouse && household.numChildren === 0) {
      livingAloneCredit = this.toDecimal(creditAmounts.living_alone_amount).times(lowestRate)
    }

    const totalCredits = basicCredit.plus(age65Credit).plus(pensionCredit).plus(livingAloneCredit)

    return {
      basic: this.quantize(basicCredit),
      age_65: this.quantize(age65Credit),
      pension: this.quantize(pensionCredit),
      living_alone: this.quantize(livingAloneCredit),
      total: this.quantize(totalCredits)
    }
  }

  private getTaxBrackets() {
    return this.getConfigValue('tax_brackets')
  }

  private getCreditAmounts() {
    return this.getConfigValue('credits')
  }

  private getDeductionRates() {
    return this.getConfigValue('deduction_rates')
  }

  private getLowestTaxRate(): Decimal {
    const brackets = this.getTaxBrackets()
    return this.toDecimal(brackets[0].rate)
  }

  // Legacy method for compatibility with RAMQ calculator
  calculate(person: Person): Record<string, Decimal> {
    // This method is for individual calculation only
    // For full household calculation, use calculateHousehold()
    const household = new Household([person])
    const result = this.calculateForPerson(person, household)
    
    return {
      net_tax: result.net_tax,
      net_income: result.net_income.individual,
      taxable_income: result.taxable_income
    }
  }
}

// Register the calculator
CalculatorRegistry.register('quebec_tax', QcTaxCalculator)