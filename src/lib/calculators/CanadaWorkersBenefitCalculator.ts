import { Decimal } from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { Person, Household } from '../models';
import { CalculatorRegistry } from '../core/factory';

/**
 * Calculator for Canada Workers Benefit (CWB) / Allocation canadienne pour les travailleurs (ACT)
 * 
 * The Canada Workers Benefit (CWB) is a refundable tax credit to help low-income 
 * working individuals and families stay in the workforce. It includes a basic amount 
 * and a disability supplement for people with a valid disability tax credit certificate.
 * 
 * Official reference:
 * https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-workers-benefit.html
 */
export class CanadaWorkersBenefitCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'canada_workers';
  }

  calculate(person: Person, household: Household): Record<string, Decimal> {
    // ACT is calculated at the household level, not individual
    // Only calculate for the primary person
    if (person !== household.primaryPerson) {
      return {
        amount: new Decimal(0),
        basic_amount: new Decimal(0),
        disability_supplement: new Decimal(0)
      };
    }

    const params = this.calculatorConfig;

    // Calculate work income and total income
    const workIncome = this.calculateWorkIncome(household);
    const totalIncome = this.calculateTotalIncome(household);
    
    // Determine household composition
    const hasSpouse = household.spouse !== null;
    const childrenCount = (household.children?.length ?? 0) || 0;
    const isFamily = hasSpouse || childrenCount > 0;

    // Check minimum work income requirement (different for single vs couple in Quebec)
    const minWorkIncome = isFamily 
      ? (params.income_thresholds.minimum_work_income_couple || params.income_thresholds.minimum_work_income)
      : params.income_thresholds.minimum_work_income;
      
    if (workIncome.lessThan(minWorkIncome)) {
      return {
        amount: new Decimal(0),
        basic_amount: new Decimal(0),
        disability_supplement: new Decimal(0),
        work_income: this.roundToNearestDollar(workIncome),
        total_income: this.roundToNearestDollar(totalIncome),
        is_family: new Decimal(isFamily ? 1 : 0),
        minimum_work_income_met: new Decimal(0)
      };
    }

    // Calculate basic benefit
    const basicBenefit = this.calculateBasicBenefit(
      workIncome,
      totalIncome,
      isFamily,
      params
    );

    // Calculate disability supplement (assuming no disability for now)
    const disabilitySupplement = new Decimal(0);

    // Total benefit
    const totalBenefit = basicBenefit.plus(disabilitySupplement);

    return {
      amount: totalBenefit,
      basic_amount: basicBenefit,
      disability_supplement: disabilitySupplement,
      work_income: this.roundToNearestDollar(workIncome),
      total_income: this.roundToNearestDollar(totalIncome),
      is_family: new Decimal(isFamily ? 1 : 0),
      minimum_work_income_met: new Decimal(1),
      phase_in_amount: this.calculatePhaseInAmount(workIncome, isFamily, params),
      phase_out_reduction: this.calculatePhaseOutReduction(totalIncome, basicBenefit, isFamily, params)
    };
  }

  /**
   * Calculate basic Canada Workers Benefit amount
   */
  private calculateBasicBenefit(
    workIncome: Decimal,
    totalIncome: Decimal,
    isFamily: boolean,
    params: any
  ): Decimal {
    const hasSpouse = isFamily;
    const childrenCount = 0; // TODO: Get actual children count from household
    const isSingleParent = !hasSpouse && childrenCount > 0;
    const isFamilyWithChildren = hasSpouse && childrenCount > 0;
    
    // Determine family type and corresponding parameters
    let maxAmount: Decimal;
    let phaseInRate: Decimal;
    let phaseOutThreshold: number;
    let baseWorkingIncome: number;
    
    if (isSingleParent) {
      maxAmount = new Decimal(params.basic_amount.single_parent_max);
      phaseInRate = new Decimal(params.calculation_rates.phase_in_rate_single_parent);
      phaseOutThreshold = params.income_thresholds.phase_out_start_single_parent;
      baseWorkingIncome = params.income_thresholds.minimum_work_income;
    } else if (isFamilyWithChildren) {
      maxAmount = new Decimal(params.basic_amount.family_with_children_max);
      phaseInRate = new Decimal(params.calculation_rates.phase_in_rate_family_children);
      phaseOutThreshold = params.income_thresholds.phase_out_start_family_children;
      baseWorkingIncome = params.income_thresholds.minimum_work_income_couple || params.income_thresholds.minimum_work_income;
    } else if (hasSpouse) {
      // Couple without children
      maxAmount = new Decimal(params.basic_amount.family_max);
      phaseInRate = new Decimal(params.calculation_rates.phase_in_rate);
      phaseOutThreshold = params.income_thresholds.phase_out_start_family;
      baseWorkingIncome = params.income_thresholds.minimum_work_income_couple || params.income_thresholds.minimum_work_income;
    } else {
      // Single person
      maxAmount = new Decimal(params.basic_amount.single_max);
      phaseInRate = new Decimal(params.calculation_rates.phase_in_rate);
      phaseOutThreshold = params.income_thresholds.phase_out_start_single;
      baseWorkingIncome = params.income_thresholds.minimum_work_income;
    }

    // Phase-in calculation: rate of work income above base working income
    const phaseInIncome = Decimal.max(0, workIncome.minus(baseWorkingIncome));
    const phaseInAmount = phaseInIncome.times(phaseInRate);
    
    // Calculate benefit before phase-out
    let benefit = Decimal.min(maxAmount, phaseInAmount);

    // Phase-out calculation based on total income
    if (totalIncome.greaterThan(phaseOutThreshold)) {
      const incomeAboveThreshold = totalIncome.minus(phaseOutThreshold);
      const reduction = incomeAboveThreshold.times(params.calculation_rates.phase_out_rate);
      benefit = Decimal.max(0, benefit.minus(reduction));
    }

    return this.roundToNearestDollar(benefit);
  }

  /**
   * Calculate phase-in amount for debugging
   */
  private calculatePhaseInAmount(
    workIncome: Decimal,
    isFamily: boolean,
    params: any
  ): Decimal {
    const phaseInIncome = Decimal.max(0, workIncome.minus(params.income_thresholds.phase_in_start));
    const phaseInAmount = phaseInIncome.times(params.calculation_rates.phase_in_rate);
    
    const maxAmount = isFamily 
      ? new Decimal(params.basic_amount.family_max)
      : new Decimal(params.basic_amount.single_max);

    return this.roundToNearestDollar(Decimal.min(maxAmount, phaseInAmount));
  }

  /**
   * Calculate phase-out reduction for debugging
   */
  private calculatePhaseOutReduction(
    totalIncome: Decimal,
    basicBenefit: Decimal,
    isFamily: boolean,
    params: any
  ): Decimal {
    const phaseOutThreshold = isFamily 
      ? params.income_thresholds.phase_out_start_family
      : params.income_thresholds.phase_out_start_single;

    if (totalIncome.greaterThan(phaseOutThreshold)) {
      const incomeAboveThreshold = totalIncome.minus(phaseOutThreshold);
      return this.roundToNearestDollar(incomeAboveThreshold.times(params.calculation_rates.phase_out_rate));
    }

    return new Decimal(0);
  }

  /**
   * Calculate work income for ACT eligibility
   * Includes employment income, self-employment income, and certain other work-related income
   * Note: Secondary earner exemption is NOT applied here - it only applies to phase-out calculation
   */
  private calculateWorkIncome(household: Household): Decimal {
    let workIncome = new Decimal(0);

    // Add primary person work income
    workIncome = workIncome.plus(household.primaryPerson.grossWorkIncome);

    // Add spouse work income if applicable (full amount for eligibility)
    if (household.spouse) {
      workIncome = workIncome.plus(household.spouse.grossWorkIncome);
    }

    return workIncome;
  }

  /**
   * Calculate total family income for ACT phase-out
   * Uses adjusted family net income with secondary earner exemption applied
   */
  private calculateTotalIncome(household: Household): Decimal {
    let totalIncome = new Decimal(0);

    // Add primary person income
    totalIncome = totalIncome.plus(household.primaryPerson.grossWorkIncome);
    totalIncome = totalIncome.plus(household.primaryPerson.grossRetirementIncome);

    // Add spouse income if applicable
    if (household.spouse) {
      let spouseWorkIncome = new Decimal(household.spouse.grossWorkIncome);

      // Apply secondary earner exemption for spouse with lower income (for phase-out calculation only)
      const primaryWorkIncome = new Decimal(household.primaryPerson.grossWorkIncome);
      if (spouseWorkIncome.lessThan(primaryWorkIncome)) {
        const exemption = new Decimal(this.calculatorConfig.secondary_earner_exemption);
        spouseWorkIncome = Decimal.max(0, spouseWorkIncome.minus(exemption));
      }

      totalIncome = totalIncome.plus(spouseWorkIncome);
      totalIncome = totalIncome.plus(household.spouse.grossRetirementIncome);
    }

    return totalIncome;
  }

  /**
   * Round to nearest dollar using banker's rounding
   */
  private roundToNearestDollar(value: Decimal): Decimal {
    return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }
}

// Register the calculator
CalculatorRegistry.register('canada_workers', CanadaWorkersBenefitCalculator);