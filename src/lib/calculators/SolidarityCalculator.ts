/**
 * Quebec Solidarity Tax Credit Calculator
 * Calcule le crédit d'impôt pour solidarité du Québec
 * 
 * Sources officielles:
 * - https://www.calculconversion.com/calcul-credit-impot-solidarite-2024-2025.html
 * - https://www.calculconversion.com/calcul-credit-impot-solidarite-2023-2024.html
 * - https://hellosafe.ca/outils/credit-impot-pour-solidarite
 * - https://www.revenuquebec.ca/fr/citoyens/credits-dimpot/credit-dimpot-pour-solidarite/
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'

export interface SolidarityResult {
  tvq_component: Decimal
  housing_component: Decimal
  northern_village_component: Decimal
  gross_total: Decimal
  family_net_income: Decimal
  reduction_amount: Decimal
  net_credit: Decimal
  components_count: number
  is_eligible: boolean
}

export class SolidarityCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'solidarity'
  }

  /**
   * Required by BaseCalculator - delegates to calculateHousehold
   */
  calculate(...args: any[]): Record<string, Decimal> {
    const [household, taxResults] = args
    const result = this.calculateHousehold(household, taxResults)
    return {
      net_credit: result.net_credit,
      tvq_component: result.tvq_component,
      housing_component: result.housing_component,
      northern_village_component: result.northern_village_component,
      gross_total: result.gross_total,
      reduction_amount: result.reduction_amount
    }
  }

  /**
   * Calculate Quebec Solidarity Tax Credit for a household
   */
  calculateHousehold(
    household: Household, 
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): SolidarityResult {
    
    // Calculate family net income (ligne 275 des déclarations)
    const familyNetIncome = this.calculateFamilyNetIncome(household, taxResults)
    
    // Check basic eligibility
    if (!this.isEligible(household, familyNetIncome)) {
      return this.createZeroResult(familyNetIncome)
    }

    // Calculate each component
    const tvqComponent = this.calculateTvqComponent(household)
    const housingComponent = this.calculateHousingComponent(household)
    const northernVillageComponent = this.calculateNorthernVillageComponent(household)
    
    // Count active components
    const componentsCount = this.countActiveComponents(tvqComponent, housingComponent, northernVillageComponent)
    
    // Calculate gross total
    const grossTotal = tvqComponent.plus(housingComponent).plus(northernVillageComponent)
    
    // Calculate reduction
    const reductionAmount = this.calculateReduction(grossTotal, familyNetIncome, componentsCount)
    
    // Calculate net credit
    const netCredit = Decimal.max(0, grossTotal.minus(reductionAmount))
    
    return {
      tvq_component: tvqComponent,
      housing_component: housingComponent,
      northern_village_component: northernVillageComponent,
      gross_total: grossTotal,
      family_net_income: familyNetIncome,
      reduction_amount: reductionAmount,
      net_credit: netCredit,
      components_count: componentsCount,
      is_eligible: true
    }
  }

  /**
   * Calculate family net income (ligne 275)
   */
  private calculateFamilyNetIncome(
    household: Household, 
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Decimal {
    // Use provided tax results if available, otherwise estimate
    if (taxResults?.quebec_net_income && taxResults?.federal_net_income) {
      // Use the lower of the two (more conservative approach)
      return Decimal.min(taxResults.quebec_net_income, taxResults.federal_net_income)
    }
    
    // Fallback: estimate based on gross income minus basic deductions
    let totalGrossIncome = household.primaryPerson.grossWorkIncome
      .plus(household.primaryPerson.grossRetirementIncome)
    
    if (household.spouse) {
      totalGrossIncome = totalGrossIncome
        .plus(household.spouse.grossWorkIncome)
        .plus(household.spouse.grossRetirementIncome)
    }
    
    // Conservative estimate: assume ~15% total deductions
    return totalGrossIncome.times(0.85)
  }

  /**
   * Check basic eligibility
   */
  private isEligible(household: Household, familyNetIncome: Decimal): boolean {
    // Must be 18+ (handled by household validation)
    // Must reside in Quebec (assumed)
    // Income-based eligibility checked in reduction calculation
    return familyNetIncome.greaterThanOrEqualTo(0)
  }

  /**
   * Calculate TVQ component
   */
  private calculateTvqComponent(household: Household): Decimal {
    const config = this.getConfigValue('tvq_component')
    let amount = new Decimal(config.base_amount)
    
    // Add spouse amount if applicable
    if (household.spouse) {
      amount = amount.plus(config.spouse_amount)
    }
    
    // Add single person additional amount
    if (household.householdType === HouseholdType.SINGLE || 
        household.householdType === HouseholdType.RETIRED_SINGLE ||
        household.householdType === HouseholdType.SINGLE_PARENT) {
      amount = amount.plus(config.single_additional)
    }
    
    return amount
  }

  /**
   * Calculate housing component
   */
  private calculateHousingComponent(household: Household): Decimal {
    const config = this.getConfigValue('housing_component')
    
    // Base amount based on household type
    let amount: Decimal
    if (household.spouse) {
      amount = new Decimal(config.couple_amount)
    } else {
      amount = new Decimal(config.single_amount)
    }
    
    // Add child amounts
    const childAmount = new Decimal(config.child_amount).times(household.numChildren)
    amount = amount.plus(childAmount)
    
    return amount
  }

  /**
   * Calculate northern village component
   * Note: For now, we assume not in a northern village unless explicitly specified
   */
  private calculateNorthernVillageComponent(household: Household): Decimal {
    // TODO: Add northern village detection logic if needed
    // For now, return 0 as most households are not in northern villages
    return new Decimal(0)
  }

  /**
   * Count active components (for reduction rate calculation)
   */
  private countActiveComponents(tvq: Decimal, housing: Decimal, northern: Decimal): number {
    let count = 0
    if (tvq.greaterThan(0)) count++
    if (housing.greaterThan(0)) count++
    if (northern.greaterThan(0)) count++
    return count
  }

  /**
   * Calculate reduction amount based on income
   */
  private calculateReduction(
    grossTotal: Decimal, 
    familyNetIncome: Decimal, 
    componentsCount: number
  ): Decimal {
    const config = this.getConfigValue('reduction')
    const threshold = new Decimal(config.threshold)
    
    // No reduction if income is below threshold
    if (familyNetIncome.lessThanOrEqualTo(threshold)) {
      return new Decimal(0)
    }
    
    // Calculate excess income
    const excessIncome = familyNetIncome.minus(threshold)
    
    // Determine reduction rate
    const reductionRate = componentsCount === 1 
      ? new Decimal(config.single_component_rate) // 3%
      : new Decimal(config.rate) // 6%
    
    // Calculate reduction amount
    const reductionAmount = excessIncome.times(reductionRate)
    
    // Reduction cannot exceed gross total
    return Decimal.min(reductionAmount, grossTotal)
  }

  /**
   * Create zero result for ineligible households
   */
  private createZeroResult(familyNetIncome: Decimal): SolidarityResult {
    const zero = new Decimal(0)
    return {
      tvq_component: zero,
      housing_component: zero,
      northern_village_component: zero,
      gross_total: zero,
      family_net_income: familyNetIncome,
      reduction_amount: zero,
      net_credit: zero,
      components_count: 0,
      is_eligible: false
    }
  }
}

// Register the calculator
CalculatorRegistry.register('solidarity', SolidarityCalculator)