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
   * Required by BaseCalculator - uses simplified calculation for sync compatibility
   */
  calculate(...args: any[]): Record<string, Decimal> {
    const [household, taxResults] = args

    // Determine household type category
    const householdCategory = this.getHouseholdCategory(household)

    // Calculate total work income for the household
    const workIncome = this.calculateWorkIncome(household)

    // Check basic eligibility
    if (!this.isEligible(household, workIncome, householdCategory)) {
      const ineligibleResult = this.createIneligibleResult(workIncome, householdCategory)
      return {
        net_premium: ineligibleResult.net_premium,
        basic_premium: ineligibleResult.basic_premium,
        reduction_amount: ineligibleResult.reduction_amount,
        work_income: ineligibleResult.work_income,
        family_net_income: ineligibleResult.family_net_income
      }
    }

    // Calculate family net income using official method only
    const familyNetIncome = this.calculateFamilyNetIncomeOfficial(household, taxResults)

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

    return {
      net_premium: netPremium,
      basic_premium: basicPremium,
      reduction_amount: reductionAmount,
      work_income: workIncome,
      family_net_income: familyNetIncome
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
   * Calculate family net income (ligne 275) using official TP-1 structure
   *
   * IMPORTANT: Pour un couple, on doit calculer la ligne 275 de chaque adulte séparément,
   * puis sommer les résultats. Chaque adulte a sa propre déclaration TP-1.
   *
   * Based on Quebec tax form TP-1:
   * Ligne 199: Revenu total (par adulte)
   * Ligne 201: Déduction pour travailleur (par adulte)
   * Ligne 248: Déduction pour cotisation au RRQ ou au RQAP (par adulte)
   * Ligne 275: Revenu net (par adulte)
   *
   * Revenu familial net = Ligne275Adulte1 + Ligne275Adulte2
   */
  private calculateFamilyNetIncomeOfficial(
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

    // Calculate ligne 275 for primary person
    const primaryNetIncome = this.calculatePersonalNetIncome(household.primaryPerson)

    // Calculate ligne 275 for spouse (if exists)
    let spouseNetIncome = new Decimal(0)
    if (household.spouse) {
      spouseNetIncome = this.calculatePersonalNetIncome(household.spouse)
    }

    // Sum individual net incomes to get family net income
    return primaryNetIncome.plus(spouseNetIncome)
  }

  /**
   * Calculate personal net income (ligne 275) for an individual
   *
   * This follows the official TP-1 calculation for one person:
   * Ligne 199: Revenu total
   * MOINS Ligne 201: Déduction pour travailleur (si applicable)
   * MOINS Ligne 205: Déduction pour régime de pension agréé (RPA)
   * MOINS Ligne 248: Cotisations RRQ/RQAP
   * ÉGALE Ligne 275: Revenu net
   *
   * NOTE: Le montant personnel de base (ligne 350) N'EST PAS utilisé ici.
   * Il sert pour les crédits d'impôt non remboursables (ligne 399).
   */
  private calculatePersonalNetIncome(person: Person): Decimal {
    // ===== LIGNE 199: REVENU TOTAL (pour cette personne) =====
    const personalGrossIncome = person.grossWorkIncome.plus(person.grossRetirementIncome)

    // ===== DÉDUCTIONS INDIVIDUELLES =====
    let personalDeductions = new Decimal(0)

    // LIGNE 201: Déduction pour travailleur (1350$ si revenu de travail > 0)
    if (person.grossWorkIncome.greaterThan(0)) {
      const workerDeductionAmount = new Decimal(this.getConfigValue('worker_deduction.amount'))
      personalDeductions = personalDeductions.plus(workerDeductionAmount)
    }

    // LIGNE 205: Déduction pour régime de pension agréé (RPA)
    // Les revenus de retraite sont considérés comme provenant d'un RPA
    // et sont donc déductibles intégralement
    const rpaDeduction = person.grossRetirementIncome
    personalDeductions = personalDeductions.plus(rpaDeduction)

    // LIGNE 248: Cotisations RRQ/RQAP (pour cette personne seulement)
    try {
      const qppCalculator = new (require('./QppCalculator').QppCalculator)(this.taxYear)
      const rqapCalculator = new (require('./RqapCalculator').RqapCalculator)(this.taxYear)

      // Cotisations RRQ de cette personne
      const qppContribution = qppCalculator.calculate(person)
      personalDeductions = personalDeductions.plus(qppContribution.total || 0)

      // Cotisations RQAP de cette personne
      const rqapContribution = rqapCalculator.calculate(person)
      personalDeductions = personalDeductions.plus(rqapContribution.total || 0)

    } catch (error) {
      // Continue sans ces déductions si erreur
    }

    // ===== LIGNE 275: REVENU NET PERSONNEL =====
    return personalGrossIncome.minus(personalDeductions)
  }

  /**
   * Calculate worker deduction (Ligne 201 TP-1) - DEPRECATED
   * This method is kept for compatibility but should not be used in new calculations
   */
  private calculateWorkerDeduction(household: Household): Decimal {
    const workerDeductionAmount = new Decimal(this.getConfigValue('worker_deduction.amount'))
    let totalWorkerDeduction = new Decimal(0)

    // Déduction pour personne principale si elle a un revenu de travail
    if (household.primaryPerson.grossWorkIncome.greaterThan(0)) {
      totalWorkerDeduction = totalWorkerDeduction.plus(workerDeductionAmount)
    }

    // Déduction pour conjoint si il/elle a un revenu de travail
    if (household.spouse && household.spouse.grossWorkIncome.greaterThan(0)) {
      totalWorkerDeduction = totalWorkerDeduction.plus(workerDeductionAmount)
    }

    return totalWorkerDeduction
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
  ): Promise<Decimal> {
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