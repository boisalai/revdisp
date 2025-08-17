import { Decimal } from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { Person, Household } from '../models';
import { CalculatorRegistry } from '../core/factory';

/**
 * Calculator for GST/HST Credit
 * 
 * The goods and services tax/harmonized sales tax (GST/HST) credit is a tax-free 
 * quarterly payment that helps low- to modest-income individuals and families 
 * offset all or part of the GST or HST they pay.
 * 
 * Official reference:
 * https://www.canada.ca/en/revenue-agency/services/child-family-benefits/goods-services-tax-harmonized-sales-tax-gst-hst-credit.html
 */
export class GstCreditCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'gst_credit';
  }

  calculate(person: Person, household: Household): Record<string, Decimal> {
    // GST credit is calculated at the household level, not individual
    // Only calculate for the primary person
    if (person !== household.primaryPerson) {
      return {
        amount: new Decimal(0)
      };
    }

    const params = this.calculatorConfig;

    // Calculate adjusted family net income
    const familyIncome = this.calculateFamilyIncome(household);
    
    // Determine household composition
    const hasSpouse = household.spouse !== null;
    const isSingleParent = !hasSpouse && household.numChildren > 0;
    const childrenCount = household.numChildren || 0;

    // Calculate base credit
    let baseCredit = new Decimal(params.base_amount);

    // Add spouse/equivalent credit
    if (hasSpouse) {
      baseCredit = baseCredit.plus(params.spouse_amount);
    } else if (childrenCount > 0) {
      // Single parent gets equivalent to spouse amount for first child
      baseCredit = baseCredit.plus(params.spouse_amount);
    }

    // Add single supplement if eligible
    let singleSupplement = new Decimal(0);
    if (!hasSpouse && childrenCount === 0) {
      // Single individuals without children may receive a supplement
      const incomeAboveThreshold = Decimal.max(
        0,
        familyIncome.minus(params.single_income_threshold)
      );
      
      // Supplement is the lesser of max amount or 2% of income above threshold
      const calculatedSupplement = incomeAboveThreshold.times(params.single_supplement_rate);
      singleSupplement = Decimal.min(
        params.single_supplement_max,
        calculatedSupplement
      );
    } else if (isSingleParent) {
      // Single parents automatically receive the full supplement
      singleSupplement = new Decimal(params.single_supplement_max);
    }

    // Add credit for additional children
    let childrenCredit = new Decimal(0);
    if (childrenCount > 0) {
      const additionalChildren = isSingleParent ? childrenCount - 1 : childrenCount;
      if (additionalChildren > 0) {
        childrenCredit = new Decimal(params.child_amount).times(additionalChildren);
      }
    }

    // Calculate total credit before reduction
    let totalCredit = baseCredit.plus(singleSupplement).plus(childrenCredit);

    // Apply income reduction if above threshold
    if (familyIncome.greaterThan(params.family_income_threshold)) {
      const incomeAboveThreshold = familyIncome.minus(params.family_income_threshold);
      const reduction = incomeAboveThreshold.times(params.reduction_rate);
      totalCredit = Decimal.max(0, totalCredit.minus(reduction));
    }

    // Round to nearest dollar
    const annualAmount = this.roundToNearestDollar(totalCredit);

    // Calculate quarterly payment (GST credit is paid quarterly)
    const quarterlyAmount = annualAmount.dividedBy(4);

    return {
      amount: annualAmount,
      base_credit: this.roundToNearestDollar(baseCredit),
      single_supplement: this.roundToNearestDollar(singleSupplement),
      children_credit: this.roundToNearestDollar(childrenCredit),
      family_income: this.roundToNearestDollar(familyIncome),
      income_above_threshold: this.roundToNearestDollar(
        Decimal.max(0, familyIncome.minus(params.family_income_threshold))
      ),
      reduction_amount: this.roundToNearestDollar(
        familyIncome.greaterThan(params.family_income_threshold)
          ? familyIncome.minus(params.family_income_threshold).times(params.reduction_rate)
          : new Decimal(0)
      ),
      annual_amount: annualAmount,
      quarterly_payment: this.roundToNearestDollar(quarterlyAmount),
      has_spouse: new Decimal(hasSpouse ? 1 : 0),
      is_single_parent: new Decimal(isSingleParent ? 1 : 0),
      children_count: new Decimal(childrenCount)
    };
  }

  /**
   * Calculate family income for GST credit
   * Uses adjusted family net income (line 23600 of tax return)
   */
  private calculateFamilyIncome(household: Household): Decimal {
    let familyIncome = new Decimal(0);

    // Add primary person income
    familyIncome = familyIncome.plus(household.primaryPerson.grossWorkIncome);
    familyIncome = familyIncome.plus(household.primaryPerson.grossRetirementIncome);

    // Add spouse income if applicable
    if (household.spouse) {
      familyIncome = familyIncome.plus(household.spouse.grossWorkIncome);
      familyIncome = familyIncome.plus(household.spouse.grossRetirementIncome);
    }

    return familyIncome;
  }

  /**
   * Round to nearest dollar using banker's rounding
   */
  private roundToNearestDollar(value: Decimal): Decimal {
    return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }
}

// Register the calculator
CalculatorRegistry.register('gst_credit', GstCreditCalculator);