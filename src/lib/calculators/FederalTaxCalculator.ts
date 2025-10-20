/**
 * Federal Income Tax Calculator (Canada)
 * Calcule l'impôt sur le revenu fédéral canadien avec crédits et déductions
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'

export interface FederalTaxResult {
  gross_income: Decimal
  taxable_income: Decimal
  tax_before_credits: Decimal
  credits: {
    basic: Decimal
    age_65: Decimal
    pension: Decimal
    living_alone: Decimal
    employment: Decimal
    cpp_qpp: Decimal
    ei: Decimal
    qpip: Decimal
    total: Decimal
  }
  net_tax: Decimal
  net_income: {
    individual: Decimal
    family: Decimal
  }
  quebec_abatement: Decimal
}

export class FederalTaxCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'federal_tax'
  }

  /**
   * Calculate Federal tax for a household
   */
  calculateHousehold(household: Household, contributions?: {
    rrq?: Decimal
    ei?: Decimal
    rqap?: Decimal
  }): { primary: FederalTaxResult, spouse?: FederalTaxResult, combined: FederalTaxResult } {
    // Calculate for primary person
    const primaryResult = this.calculateForPerson(household.primaryPerson, household, contributions)
    
    // Calculate for spouse if applicable
    let spouseResult: FederalTaxResult | undefined
    if (household.spouse) {
      spouseResult = this.calculateForPerson(household.spouse, household, contributions)
    }

    // Combine results for family income
    // RÈGLE: Les crédits d'impôt NON REMBOURSABLES ne peuvent jamais créer de remboursement
    // Impôt minimum du ménage = max(0, somme des impôts individuels)
    const householdNetTax = Decimal.max(0, primaryResult.net_tax.plus(spouseResult?.net_tax || 0))

    const combined: FederalTaxResult = {
      gross_income: primaryResult.gross_income.plus(spouseResult?.gross_income || 0),
      taxable_income: primaryResult.taxable_income.plus(spouseResult?.taxable_income || 0),
      tax_before_credits: primaryResult.tax_before_credits.plus(spouseResult?.tax_before_credits || 0),
      credits: {
        basic: primaryResult.credits.basic.plus(spouseResult?.credits.basic || 0),
        age_65: primaryResult.credits.age_65.plus(spouseResult?.credits.age_65 || 0),
        pension: primaryResult.credits.pension.plus(spouseResult?.credits.pension || 0),
        living_alone: primaryResult.credits.living_alone.plus(spouseResult?.credits.living_alone || 0),
        employment: primaryResult.credits.employment.plus(spouseResult?.credits.employment || 0),
        cpp_qpp: primaryResult.credits.cpp_qpp.plus(spouseResult?.credits.cpp_qpp || 0),
        ei: primaryResult.credits.ei.plus(spouseResult?.credits.ei || 0),
        qpip: primaryResult.credits.qpip.plus(spouseResult?.credits.qpip || 0),
        total: primaryResult.credits.total.plus(spouseResult?.credits.total || 0)
      },
      net_tax: this.quantize(householdNetTax),
      net_income: {
        individual: primaryResult.net_income.individual,
        family: primaryResult.net_income.individual.plus(spouseResult?.net_income.individual || 0)
      },
      quebec_abatement: primaryResult.quebec_abatement.plus(spouseResult?.quebec_abatement || 0)
    }

    return { primary: primaryResult, spouse: spouseResult, combined }
  }

  /**
   * Calculate Federal tax for an individual
   */
  private calculateForPerson(person: Person, household: Household, contributions?: {
    rrq?: Decimal
    ei?: Decimal
    rqap?: Decimal
  }): FederalTaxResult {
    // 1. Determine gross income
    const grossIncome = person.isRetired
      ? person.grossRetirementIncome
      : person.grossWorkIncome

    // 2. Calculate deductions
    // IMPORTANT: Base RRQ/EI/RQAP contributions are NOT deductible at federal level
    // They are converted to non-refundable tax credits instead (15% × contribution)
    // Only enhanced QPP contributions (for income > $68,500) are deductible
    let totalDeductions = new Decimal(0)

    // TODO: Add enhanced QPP deduction for high earners
    // if (grossIncome.greaterThan(68500)) {
    //   const enhancedQppDeduction = calculateEnhancedQppDeduction(grossIncome)
    //   totalDeductions = totalDeductions.plus(enhancedQppDeduction)
    // }

    // 3. Calculate taxable income (NO deduction for base contributions)
    const taxableIncome = Decimal.max(0, grossIncome.minus(totalDeductions))

    // 4. Calculate tax before credits
    const taxBeforeCredits = this.calculateTaxOnIncome(taxableIncome)

    // 5. Calculate net income (ligne 23600) - used for credit calculations
    const netIncome = grossIncome.minus(totalDeductions)

    // 6. Calculate non-refundable tax credits (including contribution credits)
    const credits = this.calculateCredits(person, household, netIncome, contributions)

    // 7. Calculate base tax (impôt de base) - tax after credits but before Quebec abatement
    const baseTax = Decimal.max(0, taxBeforeCredits.minus(credits.total))

    // 8. Calculate Quebec abatement (16.5% of BASE TAX, not credits)
    // L'abattement du Québec représente 16.5% de l'impôt de base
    const quebecAbatement = baseTax.times(0.165)

    // 9. Calculate net tax (impôt à payer) - base tax minus Quebec abatement
    const netTax = Decimal.max(0, baseTax.minus(quebecAbatement))

    return {
      gross_income: this.quantize(grossIncome),
      taxable_income: this.quantize(taxableIncome),
      tax_before_credits: this.quantize(taxBeforeCredits),
      credits,
      net_tax: this.quantize(netTax),
      net_income: {
        individual: this.quantize(netIncome),
        family: this.quantize(netIncome) // Will be combined at household level
      },
      quebec_abatement: this.quantize(quebecAbatement)
    }
  }

  /**
   * Calculate tax on taxable income using progressive brackets
   * Federal tax brackets vary by year (see config files)
   */
  private calculateTaxOnIncome(taxableIncome: Decimal): Decimal {
    const brackets = this.getTaxBrackets()
    let tax = new Decimal(0)
    let remainingIncome = taxableIncome

    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i]
      const bracketMin = this.toDecimal(bracket.min)
      const bracketMax = this.toDecimal(bracket.max)
      const rate = this.toDecimal(bracket.rate)

      // Skip if no remaining income
      if (remainingIncome.lessThanOrEqualTo(0)) {
        break
      }

      // Skip if total income doesn't reach this bracket
      if (taxableIncome.lessThanOrEqualTo(bracketMin)) {
        break
      }

      // Calculate taxable amount in this bracket
      // This is the income portion that falls in this bracket
      const incomeAtBracketStart = Decimal.max(0, taxableIncome.minus(bracketMin))
      const incomeInBracket = Decimal.min(incomeAtBracketStart, bracketMax.minus(bracketMin))

      // Only tax positive amounts
      if (incomeInBracket.greaterThan(0)) {
        const bracketTax = incomeInBracket.times(rate)
        tax = tax.plus(bracketTax)
        remainingIncome = remainingIncome.minus(incomeInBracket)
      }

      // Stop if we've covered all income
      if (taxableIncome.lessThanOrEqualTo(bracketMax)) {
        break
      }
    }

    return tax
  }

  /**
   * Calculate variable Basic Personal Amount (BPA) based on net income
   *
   * The BPA varies based on net income:
   * - 2023: Increases from 13,520 to 15,000 as income goes from 165,430 to 235,675
   * - 2024: Decreases from 15,705 to 14,156 as income goes from 173,205 to 246,752
   * - 2025: Decreases from 16,129 to 14,539 as income goes from 177,882 to 253,414
   */
  private calculateBasicPersonalAmount(netIncome: Decimal): Decimal {
    const creditAmounts = this.getCreditAmounts()

    // Check if we have the variable BPA parameters
    if (!creditAmounts.basic_amount_min || !creditAmounts.basic_amount_max ||
        !creditAmounts.basic_amount_threshold_low || !creditAmounts.basic_amount_threshold_high) {
      // Fallback to fixed amount if parameters not available
      return this.toDecimal(creditAmounts.basic_amount)
    }

    const minAmount = this.toDecimal(creditAmounts.basic_amount_min)
    const maxAmount = this.toDecimal(creditAmounts.basic_amount_max)
    const thresholdLow = this.toDecimal(creditAmounts.basic_amount_threshold_low)
    const thresholdHigh = this.toDecimal(creditAmounts.basic_amount_threshold_high)

    // If income is below low threshold, use min amount
    if (netIncome.lessThanOrEqualTo(thresholdLow)) {
      return minAmount
    }

    // If income is above high threshold, use max amount
    if (netIncome.greaterThanOrEqualTo(thresholdHigh)) {
      return maxAmount
    }

    // Linear interpolation between thresholds
    const incomeAboveThreshold = netIncome.minus(thresholdLow)
    const thresholdRange = thresholdHigh.minus(thresholdLow)
    const amountDifference = maxAmount.minus(minAmount)
    const proportion = incomeAboveThreshold.dividedBy(thresholdRange)
    const adjustment = amountDifference.times(proportion)

    return minAmount.plus(adjustment)
  }

  /**
   * Calculate Age Amount (65+) with income-based reduction
   *
   * The age amount is reduced when net income exceeds a threshold:
   * Reduction = 15% × (net income - threshold)
   * Credit is eliminated when: age_amount - reduction ≤ 0
   */
  private calculateAgeAmount(person: Person, netIncome: Decimal): Decimal {
    if (person.age < 65) {
      return new Decimal(0)
    }

    const creditAmounts = this.getCreditAmounts()
    const baseAmount = this.toDecimal(creditAmounts.age_65_amount)

    // Check if we have reduction parameters
    if (!creditAmounts.age_65_threshold || !creditAmounts.age_65_reduction_rate) {
      return baseAmount
    }

    const threshold = this.toDecimal(creditAmounts.age_65_threshold)
    const reductionRate = this.toDecimal(creditAmounts.age_65_reduction_rate)

    // No reduction if income is below threshold
    if (netIncome.lessThanOrEqualTo(threshold)) {
      return baseAmount
    }

    // Calculate reduction
    const excessIncome = netIncome.minus(threshold)
    const reduction = excessIncome.times(reductionRate)

    // Age amount cannot be negative
    return Decimal.max(0, baseAmount.minus(reduction))
  }

  /**
   * Calculate non-refundable tax credits
   *
   * IMPORTANT: Credits are calculated at 15% rate WITHOUT Quebec abatement
   * The Quebec abatement (16.5%) is applied AFTER credits on the base tax
   */
  private calculateCredits(person: Person, _household: Household, netIncome: Decimal, contributions?: {
    rrq?: Decimal
    ei?: Decimal
    rqap?: Decimal
  }): {
    basic: Decimal
    age_65: Decimal
    pension: Decimal
    living_alone: Decimal
    employment: Decimal
    cpp_qpp: Decimal
    ei: Decimal
    qpip: Decimal
    total: Decimal
  } {
    const creditAmounts = this.getCreditAmounts()
    const lowestRate = this.getLowestTaxRate() // 15% for most years

    // 1. Basic personal amount (ligne 30000) - Variable according to net income
    const basicAmount = this.calculateBasicPersonalAmount(netIncome)
    const basicCredit = basicAmount.times(lowestRate)

    // 2. Age 65+ credit (ligne 30100) - With income-based reduction
    const age65Amount = this.calculateAgeAmount(person, netIncome)
    const age65Credit = age65Amount.times(lowestRate)

    // 3. Pension credit (ligne 31400) - for retirement income
    let pensionCredit = new Decimal(0)
    if (person.isRetired && person.grossRetirementIncome.greaterThan(0)) {
      const maxPensionAmount = this.toDecimal(creditAmounts.pension_amount)
      const eligibleAmount = Decimal.min(person.grossRetirementIncome, maxPensionAmount)
      pensionCredit = eligibleAmount.times(lowestRate)
    }

    // 4. Federal doesn't have a specific living alone credit (unlike Quebec)
    let livingAloneCredit = new Decimal(0)

    // 5. Canada employment amount (ligne 31260)
    // Amount varies by year - read from config
    let employmentCredit = new Decimal(0)
    if (!person.isRetired && person.grossWorkIncome.greaterThan(0)) {
      const maxEmploymentAmount = creditAmounts.employment_amount
        ? this.toDecimal(creditAmounts.employment_amount)
        : new Decimal(1433) // Fallback to 2024 value
      const eligibleAmount = Decimal.min(person.grossWorkIncome, maxEmploymentAmount)
      employmentCredit = eligibleAmount.times(lowestRate)
    }

    // 6-8. Social contributions credits (lignes 30800, 31200, 31205)
    // Base RRQ/CPP, EI, and QPIP contributions give 15% tax credit (NOT a deduction)
    // Source: https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/
    let cppQppCredit = new Decimal(0)
    let eiCredit = new Decimal(0)
    let qpipCredit = new Decimal(0)

    if (contributions) {
      if (contributions.rrq) {
        cppQppCredit = contributions.rrq.times(lowestRate)
      }
      if (contributions.ei) {
        eiCredit = contributions.ei.times(lowestRate)
      }
      if (contributions.rqap) {
        qpipCredit = contributions.rqap.times(lowestRate)
      }
    }

    const totalCredits = basicCredit
      .plus(age65Credit)
      .plus(pensionCredit)
      .plus(livingAloneCredit)
      .plus(employmentCredit)
      .plus(cppQppCredit)
      .plus(eiCredit)
      .plus(qpipCredit)

    return {
      basic: this.quantize(basicCredit),
      age_65: this.quantize(age65Credit),
      pension: this.quantize(pensionCredit),
      living_alone: this.quantize(livingAloneCredit),
      employment: this.quantize(employmentCredit),
      cpp_qpp: this.quantize(cppQppCredit),
      ei: this.quantize(eiCredit),
      qpip: this.quantize(qpipCredit),
      total: this.quantize(totalCredits)
    }
  }

  private getTaxBrackets() {
    return this.getConfigValue('tax_brackets')
  }

  private getCreditAmounts() {
    return this.getConfigValue('credits')
  }

  private getLowestTaxRate(): Decimal {
    const brackets = this.getTaxBrackets()
    return this.toDecimal(brackets[0].rate)
  }

  // Legacy method for compatibility with RAMQ calculator
  calculate(person: Person): Record<string, Decimal> {
    // This method is for individual calculation only
    // For full household calculation, use calculateHousehold()
    const household = new Household({
      householdType: HouseholdType.SINGLE,
      primaryPerson: {
        age: person.age,
        grossWorkIncome: person.grossWorkIncome,
        grossRetirementIncome: person.grossRetirementIncome,
        isRetired: person.isRetired
      },
      numChildren: 0
    })
    const result = this.calculateForPerson(person, household)
    
    return {
      net_tax: result.net_tax,
      net_income: result.net_income.individual,
      taxable_income: result.taxable_income
    }
  }
}

// Register the calculator
CalculatorRegistry.register('federal_tax', FederalTaxCalculator)