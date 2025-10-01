/**
 * Quebec Income Tax Calculator
 * Calcule l'impôt sur le revenu du Québec avec crédits et déductions
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'
import { QppCalculator } from './QppCalculator'

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
    // Calculate for primary person (allow negative tax for transfer)
    const primaryResult = this.calculateForPerson(household.primaryPerson, household, contributions, false)

    // Calculate for spouse if applicable (allow negative tax for transfer)
    let spouseResult: QcTaxResult | undefined
    if (household.spouse) {
      spouseResult = this.calculateForPerson(household.spouse, household, contributions, false)
    }

    // Handle credit transfer between spouses (si applicable)
    let finalPrimaryTax = primaryResult.net_tax
    let finalSpouseTax = spouseResult?.net_tax || new Decimal(0)

    if (spouseResult) {
      // Si un conjoint a un impôt négatif (crédits excédentaires), transférer à l'autre
      if (spouseResult.net_tax.lessThan(0)) {
        const unusedCredits = spouseResult.net_tax.abs()
        finalPrimaryTax = primaryResult.net_tax.minus(unusedCredits)
        finalSpouseTax = new Decimal(0)
      } else if (primaryResult.net_tax.lessThan(0)) {
        const unusedCredits = primaryResult.net_tax.abs()
        finalSpouseTax = spouseResult.net_tax.minus(unusedCredits)
        finalPrimaryTax = new Decimal(0)
      }
    }

    // Ensure no negative taxes after transfer
    finalPrimaryTax = Decimal.max(0, finalPrimaryTax)
    finalSpouseTax = Decimal.max(0, finalSpouseTax)

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
      net_tax: finalPrimaryTax.plus(finalSpouseTax),
      net_income: {
        individual: primaryResult.net_income.individual,
        family: primaryResult.net_income.individual.plus(spouseResult?.net_income.individual || 0)
      }
    }

    // Update individual results with final taxes after transfer
    const finalPrimaryResult = { ...primaryResult, net_tax: this.quantize(finalPrimaryTax) }
    const finalSpouseResult = spouseResult ? { ...spouseResult, net_tax: this.quantize(finalSpouseTax) } : undefined

    return { primary: finalPrimaryResult, spouse: finalSpouseResult, combined }
  }

  /**
   * Calculate Quebec tax for an individual
   * @param allowNegative If true, allows negative net tax (for credit transfer between spouses)
   */
  private calculateForPerson(person: Person, household: Household, contributions?: {
    rrq?: Decimal
    ei?: Decimal
    rqap?: Decimal
  }, allowNegative: boolean = true): QcTaxResult {
    // 1. Determine gross income
    const grossIncome = person.isRetired
      ? person.grossRetirementIncome
      : person.grossWorkIncome

    // 2. Calculate deductions for ligne 275 (net income)
    let totalDeductions = new Decimal(0)

    // 2a. Déduction pour travailleur (ligne 201)
    // Source: https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTFR_RegimeImpot2025.pdf
    // Formule: min(6% × revenu d'emploi, montant maximal selon l'année)
    // Montants officiels: 1 315$ (2023), 1 380$ (2024), 1 420$ (2025)
    if (!person.isRetired && person.grossWorkIncome.greaterThan(0)) {
      const maxWorkerDeduction = new Decimal((this.config as any).worker_deduction.amount)
      const sixPercentOfIncome = person.grossWorkIncome.times(0.06)
      const workerDeduction = Decimal.min(sixPercentOfIncome, maxWorkerDeduction)
      totalDeductions = totalDeductions.plus(workerDeduction)
    }

    // 2b. Déduction RRQ
    // La déduction RRQ est calculée selon la formule:
    // - Première composante: première cotisation RRQ × 15.625% (car 1/0.064 = 15.625)
    // - Deuxième composante: deuxième cotisation RRQ × 100%
    // - Déduction totale = première composante + deuxième composante
    if (!person.isRetired && person.grossWorkIncome.greaterThan(0)) {
      const rrqComponents = this.calculateRrqComponents(person)

      // Formule officielle: (première × 15.625%) + (deuxième × 100%)
      const firstDeduction = rrqComponents.first.times(0.15625)  // 15.625% = 1/0.064
      const secondDeduction = rrqComponents.second              // 100%
      const rrqDeduction = firstDeduction.plus(secondDeduction)

      totalDeductions = totalDeductions.plus(rrqDeduction)
    }

    // 3. Calculate taxable income
    const taxableIncome = Decimal.max(0, grossIncome.minus(totalDeductions))

    // 4. Calculate tax before credits
    const taxBeforeCredits = this.calculateTaxOnIncome(taxableIncome)

    // 5. Calculate non-refundable tax credits
    const credits = this.calculateCredits(person, household, taxableIncome)

    // 6. Calculate net tax
    // Si allowNegative = true, permet impôt négatif pour transfert entre conjoints
    // Sinon, ramène à 0 minimum
    let netTax = taxBeforeCredits.minus(credits.total)
    if (!allowNegative) {
      netTax = Decimal.max(0, netTax)
    }

    // 7. Calculate net income (ligne 275) - revenu total moins déductions AVANT impôt
    const netIncome = grossIncome.minus(totalDeductions)

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
   * Quebec tax brackets for 2024 (CONFORMES FORMULAIRE OFFICIEL):
   * - $0 to $51,780: 14%
   * - $51,780 to $103,545: 19%
   * - $103,545 to $126,000: 24%
   * - Over $126,000: 25.75%
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
   * Calculate non-refundable tax credits according to official QC structure:
   * 1. Montant personnel de base (no reduction)
   * 2. Montant accordé (combined: living alone + single parent + age 65+ + pension)
   *    with single 18.75% reduction applied to the total
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

    // Get family net income for reduction calculations (line 275 equivalent)
    const familyNetIncome = this.calculateFamilyNetIncomeForCredits(person, household)

    // 1. Montant personnel de base (everyone gets this - NO reduction)
    const basicCredit = this.toDecimal(creditAmounts.basic_amount).times(lowestRate)

    // 2. Calculate "Montant accordé" components (before reduction)
    let combinedAmount = new Decimal(0)

    // 2a. Montant pour personne vivant seule (only singles)
    let livingAloneAmount = new Decimal(0)
    if (!household.spouse) {
      const livingConfig = creditAmounts.living_alone || {
        base_amount: creditAmounts.living_alone_amount || 2069,
        single_parent_supplement: 2554
      }
      livingAloneAmount = this.toDecimal(livingConfig.base_amount)

      // Add single-parent supplement if applicable
      const hasEligibleChildren = (household.children?.length ?? 0) > 0
      if (hasEligibleChildren) {
        livingAloneAmount = livingAloneAmount.plus(this.toDecimal(livingConfig.single_parent_supplement))
      }

      combinedAmount = combinedAmount.plus(livingAloneAmount)
    }

    // 2b. Montant en raison de l'âge (65+)
    let ageAmount = new Decimal(0)
    if (person.age >= 65) {
      const ageConfig = creditAmounts.age_credit || { base_amount: creditAmounts.age_65_amount || 3798 }
      ageAmount = this.toDecimal(ageConfig.base_amount || 3798)
      combinedAmount = combinedAmount.plus(ageAmount)
    }

    // 2c. Montant pour revenus de retraite
    let pensionAmount = new Decimal(0)
    if (person.isRetired && person.grossRetirementIncome.greaterThan(0)) {
      const pensionConfig = creditAmounts.pension_credit || { max_amount: creditAmounts.pension_amount || 3374 }
      const maxAmount = this.toDecimal(pensionConfig.max_amount || 3374)
      pensionAmount = Decimal.min(person.grossRetirementIncome, maxAmount)
      combinedAmount = combinedAmount.plus(pensionAmount)
    }

    // 3. Apply SINGLE reduction of 18.75% to the combined total
    // Seuils: 38945$ (2023), 40925$ (2024), 42090$ (2025)
    const reductionThreshold = this.getReductionThreshold()
    const reductionRate = new Decimal(0.1875) // 18.75%

    const reducedCombinedAmount = this.applyIncomeReduction(
      combinedAmount,
      familyNetIncome,
      reductionThreshold,
      reductionRate
    )

    // Convert to credit by multiplying by lowest rate
    const combinedCredit = reducedCombinedAmount.times(lowestRate)

    // Calculate individual credits proportionally for reporting
    // (they were all reduced together, so split proportionally)
    const reductionFactor = combinedAmount.greaterThan(0)
      ? reducedCombinedAmount.dividedBy(combinedAmount)
      : new Decimal(1)

    const age65Credit = ageAmount.times(reductionFactor).times(lowestRate)
    const pensionCredit = pensionAmount.times(reductionFactor).times(lowestRate)
    const livingAloneCredit = livingAloneAmount.times(reductionFactor).times(lowestRate)

    const totalCredits = basicCredit.plus(combinedCredit)

    return {
      basic: this.quantize(basicCredit),
      age_65: this.quantize(age65Credit),
      pension: this.quantize(pensionCredit),
      living_alone: this.quantize(livingAloneCredit),
      total: this.quantize(totalCredits)
    }
  }

  /**
   * Get reduction threshold based on tax year
   * 38945$ (2023), 40925$ (2024), 42090$ (2025)
   */
  private getReductionThreshold(): Decimal {
    const thresholds: Record<number, number> = {
      2023: 38945,
      2024: 40925,
      2025: 42090
    }
    return new Decimal(thresholds[this.taxYear] || 40925)
  }

  /**
   * Calculate family net income for credit reduction calculations
   * Uses actual line 275 equivalent (revenu familial net)
   */
  private calculateFamilyNetIncomeForCredits(person: Person, household: Household): Decimal {
    // Use the same calculation as net_income (ligne 275)
    // This is the actual net income after deductions, not an approximation
    let familyIncome = person.isRetired ? person.grossRetirementIncome : person.grossWorkIncome

    if (household.spouse) {
      const spouseIncome = household.spouse.isRetired ?
        household.spouse.grossRetirementIncome : household.spouse.grossWorkIncome
      familyIncome = familyIncome.plus(spouseIncome)
    }

    // For this specific calculation, we need to use the net income (after deductions)
    // This should match what's calculated in the main tax calculation
    // For now, return the net income from the individual calculation
    return this.calculateNetIncomeForPerson(person, familyIncome)
  }

  /**
   * Calculate net income for a person (ligne 275 equivalent)
   */
  private calculateNetIncomeForPerson(person: Person, grossIncome: Decimal): Decimal {
    // Déduction pour travailleur (ligne 201) seulement
    // Les cotisations (RRQ, AE, RQAP) ne sont PAS déductibles selon le calculateur officiel
    let totalDeductions = new Decimal(0)

    // Déduction pour travailleur: min(6% × revenu d'emploi, 1 380$ en 2024)
    if (!person.isRetired && grossIncome.greaterThan(0)) {
      const maxWorkerDeduction = new Decimal((this.config as any).worker_deduction?.amount || 1380)
      const sixPercentOfIncome = grossIncome.times(0.06)
      const workerDeduction = Decimal.min(sixPercentOfIncome, maxWorkerDeduction)
      totalDeductions = totalDeductions.plus(workerDeduction)
    }

    return grossIncome.minus(totalDeductions)
  }


  /**
   * Apply income-based reduction to a credit amount
   */
  private applyIncomeReduction(baseAmount: Decimal, familyNetIncome: Decimal, threshold: Decimal, reductionRate: Decimal): Decimal {
    if (familyNetIncome.lessThanOrEqualTo(threshold)) {
      return baseAmount
    }

    const excessIncome = familyNetIncome.minus(threshold)
    const reduction = excessIncome.times(reductionRate)

    return Decimal.max(0, baseAmount.minus(reduction))
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

  /**
   * Calculate RRQ contribution components (first and second)
   * Used for Quebec tax deduction calculation
   */
  private calculateRrqComponents(person: Person): { first: Decimal; second: Decimal } {
    const income = person.grossWorkIncome
    const qppConfig = (this.config as any).qpp

    const basicExemption = this.toDecimal(qppConfig.basic_exemption)
    const maxPensionableEarnings = this.toDecimal(qppConfig.max_pensionable_earnings)
    const maxAdditionalEarnings = this.toDecimal(qppConfig.max_additional_earnings)
    const firstRate = this.toDecimal(qppConfig.first_contribution_rate)
    const secondRate = this.toDecimal(qppConfig.second_contribution_rate)

    let firstContrib = new Decimal(0)
    let secondContrib = new Decimal(0)

    if (income.greaterThan(basicExemption)) {
      // Première cotisation
      const firstBracketIncome = Decimal.min(income, maxPensionableEarnings).minus(basicExemption)
      firstContrib = firstBracketIncome.times(firstRate)

      // Deuxième cotisation (si applicable)
      if (income.greaterThan(maxPensionableEarnings) && maxAdditionalEarnings.greaterThan(maxPensionableEarnings)) {
        const secondBracketIncome = Decimal.min(income, maxAdditionalEarnings).minus(maxPensionableEarnings)
        if (secondBracketIncome.greaterThan(0)) {
          secondContrib = secondBracketIncome.times(secondRate)
        }
      }
    }

    return { first: firstContrib, second: secondContrib }
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
CalculatorRegistry.register('quebec_tax', QcTaxCalculator)