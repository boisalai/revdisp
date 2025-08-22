import { Decimal } from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { Person, Household } from '../models';
import { CalculatorRegistry } from '../core/factory';

/**
 * Calculator for Old Age Security (OAS) / Pension de la Sécurité de la Vieillesse (PSV)
 * and Guaranteed Income Supplement (GIS) / Supplément de revenu garanti (SRG)
 * 
 * The Old Age Security pension is a monthly payment available to most Canadians who 
 * are 65 years old or older. The amount varies based on income and is subject to 
 * recovery tax for higher-income recipients.
 * 
 * The Guaranteed Income Supplement is an additional non-taxable monthly payment for 
 * low-income OAS recipients.
 * 
 * Key features:
 * - Quarterly adjustments based on Consumer Price Index (CPI)
 * - 10% increase for recipients aged 75 and older (implemented July 2022)
 * - Recovery tax (clawback) applies above certain income thresholds
 * - GIS provides additional support for low-income recipients
 * - Requires minimum 10 years residence in Canada after age 18
 * - Full pension requires 40 years residence
 * 
 * Official references:
 * - https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/benefit-amount.html
 * - https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement.html
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
   * Calculate GIS income after employment income exemptions
   */
  private calculateGisIncome(person: Person, household: Household): Decimal {
    const gisParams = this.calculatorConfig.gis;
    let totalIncome = new Decimal(0);
    
    // Base income (retirement income is fully counted)
    totalIncome = totalIncome.plus(person.grossRetirementIncome);
    
    // Work income with exemptions
    const workIncome = new Decimal(person.grossWorkIncome);
    let countedWorkIncome = workIncome;
    
    if (workIncome.greaterThan(0)) {
      // First $5,000 is fully exempt
      if (workIncome.lessThanOrEqualTo(gisParams.employment_income_exemption.first_exemption)) {
        countedWorkIncome = new Decimal(0);
      } else {
        // Subtract first exemption
        countedWorkIncome = workIncome.minus(gisParams.employment_income_exemption.first_exemption);
        
        // Apply partial exemption for income between $5,000 and $15,000
        const partialExemptionLimit = gisParams.employment_income_exemption.partial_exemption;
        const remainingForPartial = partialExemptionLimit - gisParams.employment_income_exemption.first_exemption;
        
        if (workIncome.lessThanOrEqualTo(partialExemptionLimit)) {
          // Only count 50% of income between $5,000 and $15,000
          countedWorkIncome = countedWorkIncome.times(gisParams.employment_income_exemption.partial_rate);
        } else {
          // Count 50% of income between $5,000 and $15,000, plus 100% above $15,000
          const partialAmount = new Decimal(remainingForPartial).times(gisParams.employment_income_exemption.partial_rate);
          const fullAmount = workIncome.minus(partialExemptionLimit);
          countedWorkIncome = partialAmount.plus(fullAmount);
        }
      }
    }
    
    totalIncome = totalIncome.plus(countedWorkIncome);
    
    // For couples, include spouse income (if applicable)
    if (household.spouse) {
      const spouse = household.spouse;
      if (spouse.age >= 65) {
        // Spouse also receives OAS - use combined income approach
        const spouseWorkIncome = new Decimal(spouse.grossWorkIncome);
        let countedSpouseWorkIncome = spouseWorkIncome;
        
        if (spouseWorkIncome.greaterThan(0)) {
          // Same exemption logic for spouse
          if (spouseWorkIncome.lessThanOrEqualTo(gisParams.employment_income_exemption.first_exemption)) {
            countedSpouseWorkIncome = new Decimal(0);
          } else {
            countedSpouseWorkIncome = spouseWorkIncome.minus(gisParams.employment_income_exemption.first_exemption);
            
            const remainingForPartial = gisParams.employment_income_exemption.partial_exemption - gisParams.employment_income_exemption.first_exemption;
            
            if (spouseWorkIncome.lessThanOrEqualTo(gisParams.employment_income_exemption.partial_exemption)) {
              countedSpouseWorkIncome = countedSpouseWorkIncome.times(gisParams.employment_income_exemption.partial_rate);
            } else {
              const partialAmount = new Decimal(remainingForPartial).times(gisParams.employment_income_exemption.partial_rate);
              const fullAmount = spouseWorkIncome.minus(gisParams.employment_income_exemption.partial_exemption);
              countedSpouseWorkIncome = partialAmount.plus(fullAmount);
            }
          }
        }
        
        totalIncome = totalIncome.plus(spouse.grossRetirementIncome).plus(countedSpouseWorkIncome);
      }
    }
    
    return totalIncome;
  }

  /**
   * Calculate Guaranteed Income Supplement (GIS) amount
   */
  private calculateGis(person: Person, household: Household): { amount: Decimal; details: Record<string, Decimal> } {
    const gisParams = this.calculatorConfig.gis;
    
    // Calculate average quarterly GIS amounts
    const q1Amount = new Decimal(gisParams.quarters.q1.single_max_amount);
    const q2Amount = new Decimal(gisParams.quarters.q2.single_max_amount);
    const q3Amount = new Decimal(gisParams.quarters.q3.single_max_amount);
    const q4Amount = new Decimal(gisParams.quarters.q4.single_max_amount);
    
    // Determine marital status and maximum amount
    let maxMonthlyAmount: Decimal;
    let incomeCutoff: Decimal;
    const isCouple = household.isCouple;
    const spouse = household.spouse;
    const spouseReceivesOas = spouse && spouse.age >= 65;
    
    if (isCouple && spouseReceivesOas) {
      // Both receive OAS
      maxMonthlyAmount = q1Amount.plus(q2Amount).plus(q3Amount).plus(q4Amount).dividedBy(4);
      maxMonthlyAmount = new Decimal(gisParams.quarters.q1.couple_both_oas_max)
        .plus(gisParams.quarters.q2.couple_both_oas_max)
        .plus(gisParams.quarters.q3.couple_both_oas_max)
        .plus(gisParams.quarters.q4.couple_both_oas_max)
        .dividedBy(4);
      
      incomeCutoff = new Decimal(gisParams.quarters.q1.couple_both_oas_income_cutoff);
    } else if (isCouple && !spouseReceivesOas) {
      // Only one receives OAS
      maxMonthlyAmount = q1Amount.plus(q2Amount).plus(q3Amount).plus(q4Amount).dividedBy(4);
      incomeCutoff = new Decimal(gisParams.quarters.q1.couple_one_oas_income_cutoff);
    } else {
      // Single person
      maxMonthlyAmount = q1Amount.plus(q2Amount).plus(q3Amount).plus(q4Amount).dividedBy(4);
      incomeCutoff = new Decimal(gisParams.quarters.q1.single_income_cutoff);
    }
    
    // Calculate income for GIS purposes
    const gisIncome = this.calculateGisIncome(person, household);
    
    // Calculate GIS amount
    let gisAmount = new Decimal(0);
    let isEligible = false;
    
    if (gisIncome.lessThanOrEqualTo(incomeCutoff)) {
      isEligible = true;
      // Calculate reduction: 0.50$ per dollar of income (annual), convert to monthly
      const annualReduction = gisIncome.times(gisParams.reduction_rate);
      const monthlyReduction = annualReduction.dividedBy(12);
      gisAmount = Decimal.max(0, maxMonthlyAmount.minus(monthlyReduction));
    }
    
    // Annual amount
    const annualGisAmount = gisAmount.times(12);
    
    return {
      amount: annualGisAmount,
      details: {
        monthly_amount: gisAmount,
        annual_amount: annualGisAmount,
        max_monthly_amount: maxMonthlyAmount,
        gis_income: gisIncome,
        income_cutoff: incomeCutoff,
        is_couple: new Decimal(isCouple ? 1 : 0),
        spouse_receives_oas: new Decimal(spouseReceivesOas ? 1 : 0),
        reduction_applied: gisIncome.times(gisParams.reduction_rate).dividedBy(12),
        eligible: new Decimal(isEligible ? 1 : 0)
      }
    };
  }

  /**
   * Round to nearest dollar using banker's rounding
   */
  private roundToNearestDollar(value: Decimal): Decimal {
    return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  calculate(person: Person, household: Household): Record<string, Decimal> {
    const params = this.calculatorConfig;
    
    // OAS and GIS are only available to people 65 and older
    if (person.age < 65) {
      return {
        amount: new Decimal(0),
        eligible: new Decimal(0),
        age_requirement_met: new Decimal(0),
        gis_amount: new Decimal(0),
        gis_eligible: new Decimal(0),
        combined_amount: new Decimal(0)
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
    
    // Annual OAS amount (monthly to annual)
    const annualOasAmount = adjustedAmount.times(12);
    
    // Calculate GIS (Guaranteed Income Supplement)
    const gisCalculation = this.calculateGis(person, household);
    const gisAmount = gisCalculation.amount;
    const gisEligible = gisCalculation.details.eligible.equals(1);
    
    // Combined total (OAS + GIS)
    const combinedAmount = annualOasAmount.plus(gisAmount);

    const result = {
      // Main amounts (backward compatibility)
      amount: this.roundToNearestDollar(combinedAmount), // Total including GIS for compatibility with MFQ
      
      // OAS-specific amounts
      oas_amount: this.roundToNearestDollar(annualOasAmount),
      oas_gross_monthly_amount: this.roundToNearestDollar(grossAmount),
      oas_net_monthly_amount: this.roundToNearestDollar(adjustedAmount),
      oas_annual_amount: this.roundToNearestDollar(annualOasAmount),
      
      // GIS-specific amounts
      gis_amount: this.roundToNearestDollar(gisAmount),
      gis_monthly_amount: this.roundToNearestDollar(gisCalculation.details.monthly_amount),
      gis_eligible: new Decimal(gisEligible ? 1 : 0),
      gis_max_monthly_amount: this.roundToNearestDollar(gisCalculation.details.max_monthly_amount),
      gis_income: this.roundToNearestDollar(gisCalculation.details.gis_income),
      gis_income_cutoff: this.roundToNearestDollar(gisCalculation.details.income_cutoff),
      gis_reduction_applied: this.roundToNearestDollar(gisCalculation.details.reduction_applied),
      gis_is_couple: gisCalculation.details.is_couple,
      gis_spouse_receives_oas: gisCalculation.details.spouse_receives_oas,
      
      // Combined amounts
      combined_amount: this.roundToNearestDollar(combinedAmount),
      
      // Legacy/compatibility fields
      gross_monthly_amount: this.roundToNearestDollar(grossAmount),
      net_monthly_amount: this.roundToNearestDollar(adjustedAmount),
      annual_amount: this.roundToNearestDollar(annualOasAmount),
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
    
    return result;
  }
}

// Register the calculator
CalculatorRegistry.register('old_age_security', OldAgeSecurityCalculator);