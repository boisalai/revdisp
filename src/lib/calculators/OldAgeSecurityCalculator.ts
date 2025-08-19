import { Decimal } from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { Person, Household } from '../models';
import { CalculatorRegistry } from '../core/factory';

/**
 * Calculator for Old Age Security (OAS) / Pension de la Sécurité de la Vieillesse (PSV)
 * 
 * The Old Age Security pension is a monthly payment available to most Canadians who 
 * are 65 years old or older. The amount varies based on income and is subject to 
 * recovery tax for higher-income recipients.
 * 
 * Key features:
 * - Quarterly adjustments based on Consumer Price Index (CPI)
 * - 10% increase for recipients aged 75 and older (implemented July 2022)
 * - Recovery tax (clawback) applies above certain income thresholds
 * - Requires minimum 10 years residence in Canada after age 18
 * - Full pension requires 40 years residence
 * 
 * Official reference:
 * https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/benefit-amount.html
 */
export class OldAgeSecurityCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'old_age_security';
  }


  /**
   * Calculate the average quarterly amount across all four quarters
   * This accounts for the CPI adjustments that happen quarterly
   */
  private calculateAverageQuarterlyAmount(): Decimal {
    const params = this.calculatorConfig;
    
    // For now, assume person is in 65-74 age group, will be adjusted in main calculate method
    const q1Amount = new Decimal(params.quarters.q1.max_amount_65_74);
    const q2Amount = new Decimal(params.quarters.q2.max_amount_65_74);
    const q3Amount = new Decimal(params.quarters.q3.max_amount_65_74);
    const q4Amount = new Decimal(params.quarters.q4.max_amount_65_74);
    
    return q1Amount.plus(q2Amount).plus(q3Amount).plus(q4Amount).dividedBy(4);
  }

  /**
   * Calculate recovery tax (clawback) based on individual income
   */
  private calculateRecoveryTax(individualIncome: Decimal, is75Plus: boolean): Decimal {
    const params = this.calculatorConfig;
    const recoveryThreshold = new Decimal(params.quarters.q1.recovery_threshold);
    
    // No recovery tax if income is below threshold
    if (individualIncome.lessThanOrEqualTo(recoveryThreshold)) {
      return new Decimal(0);
    }
    
    // Determine upper limit based on age
    const upperLimit = is75Plus 
      ? new Decimal(params.quarters.q1.recovery_upper_limit_75_plus)
      : new Decimal(params.quarters.q1.recovery_upper_limit_65_74);
    
    // Full clawback if income is above upper limit
    if (individualIncome.greaterThanOrEqualTo(upperLimit)) {
      // Calculate maximum monthly amount for this age group
      const maxMonthlyAmount = is75Plus 
        ? this.calculateAverageQuarterlyAmount75Plus()
        : this.calculateAverageQuarterlyAmount();
      return maxMonthlyAmount; // Full clawback
    }
    
    // Partial recovery: 15% of income above threshold
    const incomeAboveThreshold = individualIncome.minus(recoveryThreshold);
    const monthlyRecovery = incomeAboveThreshold.times(params.recovery_rate).dividedBy(12);
    
    return monthlyRecovery;
  }

  /**
   * Calculate average quarterly amount for 75+ age group
   */
  private calculateAverageQuarterlyAmount75Plus(): Decimal {
    const params = this.calculatorConfig;
    
    const q1Amount = new Decimal(params.quarters.q1.max_amount_75_plus);
    const q2Amount = new Decimal(params.quarters.q2.max_amount_75_plus);
    const q3Amount = new Decimal(params.quarters.q3.max_amount_75_plus);
    const q4Amount = new Decimal(params.quarters.q4.max_amount_75_plus);
    
    return q1Amount.plus(q2Amount).plus(q3Amount).plus(q4Amount).dividedBy(4);
  }

  /**
   * Calculate individual income for OAS recovery tax
   * Uses individual income, not family income
   */
  private calculateIndividualIncome(person: Person): Decimal {
    let income = new Decimal(0);
    
    // Add all sources of income
    income = income.plus(person.grossWorkIncome);
    income = income.plus(person.grossRetirementIncome);
    
    return income;
  }

  /**
   * Round to nearest dollar using banker's rounding
   */
  private roundToNearestDollar(value: Decimal): Decimal {
    return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  calculate(person: Person, household: Household): Record<string, Decimal> {
    const params = this.calculatorConfig;
    
    // OAS is only available to people 65 and older
    if (person.age < 65) {
      return {
        amount: new Decimal(0),
        eligible: new Decimal(0),
        age_requirement_met: new Decimal(0)
      };
    }

    // Determine age category
    const is75Plus = person.age >= 75;
    
    // Calculate average quarterly amount for appropriate age group
    const averageQuarterlyAmount = is75Plus 
      ? this.calculateAverageQuarterlyAmount75Plus()
      : this.calculateAverageQuarterlyAmount();
    
    // Calculate individual income for recovery tax
    const individualIncome = this.calculateIndividualIncome(person);
    
    // Apply recovery tax (clawback) if applicable
    const recoveryTax = this.calculateRecoveryTax(individualIncome, is75Plus);
    
    // Calculate net OAS amount
    const grossAmount = averageQuarterlyAmount;
    const netAmount = Decimal.max(0, grossAmount.minus(recoveryTax));
    
    // Calculate residence factor (assumed full residence for simplification)
    const residenceFactor = new Decimal(1); // 40/40 years = full pension
    const adjustedAmount = netAmount.times(residenceFactor);
    
    // Annual amount (monthly to annual)
    const annualAmount = adjustedAmount.times(12);

    return {
      amount: this.roundToNearestDollar(annualAmount),
      gross_monthly_amount: this.roundToNearestDollar(grossAmount),
      net_monthly_amount: this.roundToNearestDollar(adjustedAmount),
      annual_amount: this.roundToNearestDollar(annualAmount),
      recovery_tax: this.roundToNearestDollar(recoveryTax),
      individual_income: this.roundToNearestDollar(individualIncome),
      is_75_plus: new Decimal(is75Plus ? 1 : 0),
      recovery_threshold: new Decimal(params.quarters.q1.recovery_threshold),
      residence_factor: residenceFactor,
      eligible: new Decimal(1),
      age_requirement_met: new Decimal(1),
      q1_amount: new Decimal(is75Plus ? params.quarters.q1.max_amount_75_plus : params.quarters.q1.max_amount_65_74),
      q2_amount: new Decimal(is75Plus ? params.quarters.q2.max_amount_75_plus : params.quarters.q2.max_amount_65_74),
      q3_amount: new Decimal(is75Plus ? params.quarters.q3.max_amount_75_plus : params.quarters.q3.max_amount_65_74),
      q4_amount: new Decimal(is75Plus ? params.quarters.q4.max_amount_75_plus : params.quarters.q4.max_amount_65_74),
      average_quarterly_amount: this.roundToNearestDollar(averageQuarterlyAmount)
    };
  }
}

// Register the calculator
CalculatorRegistry.register('old_age_security', OldAgeSecurityCalculator);