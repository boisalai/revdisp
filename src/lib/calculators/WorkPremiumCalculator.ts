/**
 * Quebec Work Premium Calculator
 * Calcule la prime au travail du Québec
 * 
 * Sources officielles:
 * - https://www.revenuquebec.ca/en/citizens/tax-credits/work-premium-tax-credits/
 * - https://www.budget.finances.gouv.qc.ca/budget/outils/depenses-fiscales/fiches/fiche-110905.asp
 * - https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/credit-impot-remboursable-prime-travail/
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'

export interface WorkPremiumResult {
  work_income: Decimal
  family_net_income: Decimal
  eligible_work_income: Decimal
  growth_rate: Decimal
  basic_premium: Decimal
  reduction_threshold: Decimal
  reduction_amount: Decimal
  net_premium: Decimal
  is_eligible: boolean
  calculation_phase: 'ineligible' | 'growth' | 'maximum' | 'reduction' | 'zero'
  household_type_category: 'single' | 'single_parent' | 'couple_with_children' | 'couple_without_children'
}

export class WorkPremiumCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'work_premium'
  }

  /**
   * Required by BaseCalculator - delegates to calculateHousehold
   */
  calculate(...args: any[]): Record<string, Decimal> {
    const [household, taxResults] = args
    const result = this.calculateHousehold(household, taxResults)
    return {
      net_premium: result.net_premium,
      basic_premium: result.basic_premium,
      reduction_amount: result.reduction_amount,
      work_income: result.work_income,
      family_net_income: result.family_net_income
    }
  }

  /**
   * Calculate Quebec Work Premium for a household
   */
  async calculateHousehold(
    household: Household,
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Promise<WorkPremiumResult> {
    
    // Determine household type category
    const householdCategory = this.getHouseholdCategory(household)
    
    // Calculate total work income for the household
    const workIncome = this.calculateWorkIncome(household)
    
    // Check basic eligibility
    if (!this.isEligible(household, workIncome, householdCategory)) {
      return this.createIneligibleResult(workIncome, householdCategory)
    }

    // Calculate family net income
    const familyNetIncome = await this.calculateFamilyNetIncome(household, taxResults)
    
    // Get configuration parameters
    const minWorkIncome = this.getMinimumWorkIncome(householdCategory)
    const maxAmount = this.getMaximumAmount(householdCategory)
    const growthRate = this.getGrowthRate(householdCategory)
    const excludedIncome = this.getExcludedWorkIncome(householdCategory)
    const reductionThreshold = this.getReductionThreshold(householdCategory)
    
    // Calculate eligible work income (above excluded amount)
    const eligibleWorkIncome = Decimal.max(0, workIncome.minus(excludedIncome))
    
    // Calculate basic premium (growth phase)
    const basicPremium = this.calculateBasicPremium(eligibleWorkIncome, growthRate, maxAmount)
    
    // Calculate reduction based on family net income
    const reductionAmount = this.calculateReduction(basicPremium, familyNetIncome, reductionThreshold)
    
    // Calculate net premium
    const netPremium = Decimal.max(0, basicPremium.minus(reductionAmount))
    
    // Determine calculation phase
    const calculationPhase = this.getCalculationPhase(workIncome, eligibleWorkIncome, basicPremium, maxAmount, netPremium)
    
    return {
      work_income: workIncome,
      family_net_income: familyNetIncome,
      eligible_work_income: eligibleWorkIncome,
      growth_rate: growthRate,
      basic_premium: basicPremium,
      reduction_threshold: reductionThreshold,
      reduction_amount: reductionAmount,
      net_premium: netPremium,
      is_eligible: true,
      calculation_phase: calculationPhase,
      household_type_category: householdCategory
    }
  }

  /**
   * Determine household category for work premium calculation
   */
  private getHouseholdCategory(household: Household): 'single' | 'single_parent' | 'couple_with_children' | 'couple_without_children' {
    const hasSpouse = household.spouse !== null
    const hasChildren = (household.children?.length ?? 0) > 0
    
    if (!hasSpouse && !hasChildren) {
      return 'single'
    } else if (!hasSpouse && hasChildren) {
      return 'single_parent'
    } else if (hasSpouse && hasChildren) {
      return 'couple_with_children'
    } else {
      return 'couple_without_children'
    }
  }

  /**
   * Calculate total work income for the household
   */
  private calculateWorkIncome(household: Household): Decimal {
    let totalWorkIncome = household.primaryPerson.grossWorkIncome
    
    if (household.spouse) {
      totalWorkIncome = totalWorkIncome.plus(household.spouse.grossWorkIncome)
    }
    
    return totalWorkIncome
  }

  /**
   * Check basic eligibility for work premium
   */
  private isEligible(household: Household, workIncome: Decimal, category: string): boolean {
    const minRequired = this.getMinimumWorkIncome(category)
    return workIncome.greaterThanOrEqualTo(minRequired)
  }

  /**
   * Get minimum work income required by household category
   */
  private getMinimumWorkIncome(category: string): Decimal {
    const config = this.getConfigValue('minimum_work_income')
    
    if (category === 'single' || category === 'single_parent') {
      return new Decimal(config.single)
    } else {
      return new Decimal(config.couple)
    }
  }

  /**
   * Get maximum premium amount by household category
   */
  private getMaximumAmount(category: string): Decimal {
    const config = this.getConfigValue('maximum_amounts')
    return new Decimal(config[category])
  }

  /**
   * Get growth rate by household category
   */
  private getGrowthRate(category: string): Decimal {
    const config = this.getConfigValue('growth_rates')
    
    if (category === 'single' || category === 'couple_without_children') {
      return new Decimal(config.no_children)
    } else {
      return new Decimal(config.with_children)
    }
  }

  /**
   * Get excluded work income amount
   */
  private getExcludedWorkIncome(category: string): Decimal {
    const config = this.getConfigValue('excluded_work_income')
    
    if (category === 'single' || category === 'single_parent') {
      return new Decimal(config.single)
    } else {
      return new Decimal(config.couple)
    }
  }

  /**
   * Get reduction threshold by household category
   */
  private getReductionThreshold(category: string): Decimal {
    const config = this.getConfigValue('reduction.thresholds')
    return new Decimal(config[category])
  }

  /**
   * Calculate family net income (ligne 275) using official tax calculation
   */
  private async calculateFamilyNetIncome(
    household: Household,
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Decimal {
    // Use Quebec net income if available (this is line 275)
    if (taxResults?.quebec_net_income) {
      return taxResults.quebec_net_income
    }

    // For now, use a simplified approach: gross income minus basic deductions
    // This will be more accurate than the empirical estimation but simpler than full tax calculation

    let totalGrossIncome = household.primaryPerson.grossWorkIncome
      .plus(household.primaryPerson.grossRetirementIncome)

    if (household.spouse) {
      totalGrossIncome = totalGrossIncome
        .plus(household.spouse.grossWorkIncome)
        .plus(household.spouse.grossRetirementIncome)
    }

    // Calculate basic social contributions that are deductible
    const qppCalculator = new (require('./QppCalculator').QppCalculator)(this.taxYear)
    const eiCalculator = new (require('./EmploymentInsuranceCalculator').EmploymentInsuranceCalculator)(this.taxYear)
    const rqapCalculator = new (require('./RqapCalculator').RqapCalculator)(this.taxYear)

    await qppCalculator.initialize()
    await eiCalculator.initialize()
    await rqapCalculator.initialize()

    let totalDeductions = new Decimal(0)

    // Calculate QPP contributions
    const qppPrimary = qppCalculator.calculate(household.primaryPerson)
    totalDeductions = totalDeductions.plus(qppPrimary.total)

    if (household.spouse) {
      const qppSpouse = qppCalculator.calculate(household.spouse)
      totalDeductions = totalDeductions.plus(qppSpouse.total)
    }

    // Calculate EI contributions
    const eiPrimary = eiCalculator.calculate(household.primaryPerson)
    totalDeductions = totalDeductions.plus(eiPrimary.total)

    if (household.spouse) {
      const eiSpouse = eiCalculator.calculate(household.spouse)
      totalDeductions = totalDeductions.plus(eiSpouse.total)
    }

    // Calculate RQAP contributions
    const rqapPrimary = rqapCalculator.calculate(household.primaryPerson)
    totalDeductions = totalDeductions.plus(rqapPrimary.total)

    if (household.spouse) {
      const rqapSpouse = rqapCalculator.calculate(household.spouse)
      totalDeductions = totalDeductions.plus(rqapSpouse.total)
    }

    // Return net income = gross income - deductible contributions
    return totalGrossIncome.minus(totalDeductions)
  }

  /**
   * Calculate basic premium (growth phase)
   */
  private calculateBasicPremium(eligibleWorkIncome: Decimal, growthRate: Decimal, maxAmount: Decimal): Decimal {
    const calculatedPremium = eligibleWorkIncome.times(growthRate)
    return Decimal.min(calculatedPremium, maxAmount)
  }

  /**
   * Calculate reduction based on family net income
   */
  private calculateReduction(basicPremium: Decimal, familyNetIncome: Decimal, reductionThreshold: Decimal): Decimal {
    // No reduction if family income is below threshold
    if (familyNetIncome.lessThanOrEqualTo(reductionThreshold)) {
      return new Decimal(0)
    }
    
    // Calculate excess income
    const excessIncome = familyNetIncome.minus(reductionThreshold)
    
    // Apply reduction rate (10%)
    const reductionRate = new Decimal(this.getConfigValue('reduction.rate'))
    const reductionAmount = excessIncome.times(reductionRate)
    
    // Reduction cannot exceed basic premium
    return Decimal.min(reductionAmount, basicPremium)
  }

  /**
   * Determine calculation phase
   */
  private getCalculationPhase(
    workIncome: Decimal, 
    eligibleWorkIncome: Decimal, 
    basicPremium: Decimal, 
    maxAmount: Decimal, 
    netPremium: Decimal
  ): 'ineligible' | 'growth' | 'maximum' | 'reduction' | 'zero' {
    if (netPremium.equals(0)) {
      return 'zero'
    } else if (basicPremium.equals(maxAmount)) {
      return 'maximum'
    } else if (basicPremium.greaterThan(netPremium)) {
      return 'reduction'
    } else {
      return 'growth'
    }
  }

  /**
   * Create result for ineligible households
   */
  private createIneligibleResult(workIncome: Decimal, category: string): WorkPremiumResult {
    const zero = new Decimal(0)
    return {
      work_income: workIncome,
      family_net_income: zero,
      eligible_work_income: zero,
      growth_rate: zero,
      basic_premium: zero,
      reduction_threshold: zero,
      reduction_amount: zero,
      net_premium: zero,
      is_eligible: false,
      calculation_phase: 'ineligible',
      household_type_category: category as any
    }
  }
}

// Register the calculator
CalculatorRegistry.register('work_premium', WorkPremiumCalculator)