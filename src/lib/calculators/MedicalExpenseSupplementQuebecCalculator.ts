import { Decimal } from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { Person, Household } from '../models';
import { CalculatorRegistry } from '../core/factory';

/**
 * Calculator for Quebec Refundable Tax Credit for Medical Expenses
 * Crédit d'impôt remboursable pour frais médicaux (Québec)
 * 
 * This refundable tax credit helps working individuals with low incomes
 * who have high medical expenses. It's designed to encourage people
 * with disabilities to enter the job market.
 * 
 * Key eligibility criteria:
 * - Must be a Quebec resident for the entire tax year
 * - Must be 18 years or older at the end of the tax year
 * - Must have minimum employment/self-employment income
 * - Family net income must be below the phase-out threshold
 * - Must have claimed medical expenses
 * 
 * Official reference:
 * https://www.budget.finances.gouv.qc.ca/budget/outils/depenses-fiscales/fiches/fiche-110804.asp
 */
export class MedicalExpenseSupplementQuebecCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'medical_expense_supplement_quebec';
  }

  calculate(person: Person, household: Household, additionalData?: any): Record<string, Decimal> {
    // This supplement is calculated at the household level, not individual
    // Only calculate for the primary person
    if (person !== household.primaryPerson) {
      return {
        amount: new Decimal(0),
        eligible: new Decimal(0),
        work_income: new Decimal(0),
        family_net_income: new Decimal(0),
        medical_expenses: household.medicalExpenses,
        creditable_medical_expenses: new Decimal(0)
      };
    }

    const params = this.calculatorConfig;
    
    // Check if medical expenses are provided
    if (household.medicalExpenses.lessThanOrEqualTo(0)) {
      return this.createZeroResult(household, 'No medical expenses claimed');
    }

    // Calculate work income (employment + self-employment)
    const workIncome = this.calculateWorkIncome(household);
    
    // Check minimum work income requirement
    if (workIncome.lessThan(params.minimum_work_income)) {
      return this.createZeroResult(household, 'Insufficient work income');
    }

    // Get family net income from additional data (from Quebec tax calculation preferably)
    const familyNetIncome = this.getFamilyNetIncome(additionalData);
    
    // Check if family income exceeds maximum threshold
    if (familyNetIncome.greaterThanOrEqualTo(params.phase_out_end)) {
      return this.createZeroResult(household, 'Family income too high');
    }

    // Calculate creditable medical expenses (25% of medical expenses)
    const creditableMedicalExpenses = household.medicalExpenses.times(params.medical_expense_rate);
    
    // Calculate base supplement amount (lesser of maximum or creditable medical expenses)
    let supplementAmount = Decimal.min(
      new Decimal(params.maximum_amount),
      creditableMedicalExpenses
    );

    // Apply phase-out reduction based on family net income
    if (familyNetIncome.greaterThan(params.reduction_threshold)) {
      const incomeAboveThreshold = familyNetIncome.minus(params.reduction_threshold);
      const reduction = incomeAboveThreshold.times(params.reduction_rate);
      supplementAmount = Decimal.max(0, supplementAmount.minus(reduction));
    }

    return {
      amount: this.roundToNearestDollar(supplementAmount),
      eligible: new Decimal(supplementAmount.greaterThan(0) ? 1 : 0),
      work_income: this.roundToNearestDollar(workIncome),
      family_net_income: this.roundToNearestDollar(familyNetIncome),
      medical_expenses: household.medicalExpenses,
      creditable_medical_expenses: this.roundToNearestDollar(creditableMedicalExpenses),
      phase_out_reduction: this.calculatePhaseOutReduction(familyNetIncome, params),
      minimum_work_income_met: new Decimal(1)
    };
  }

  /**
   * Calculate total work income for the household
   * Includes employment income and self-employment income (net positive amounts only)
   */
  private calculateWorkIncome(household: Household): Decimal {
    let workIncome = new Decimal(0);

    // Primary person work income
    workIncome = workIncome.plus(household.primaryPerson.grossWorkIncome);
    workIncome = workIncome.plus(household.primaryPerson.selfEmployedIncome);

    // Spouse work income (if applicable)
    if (household.spouse) {
      workIncome = workIncome.plus(household.spouse.grossWorkIncome);
      workIncome = workIncome.plus(household.spouse.selfEmployedIncome);
    }

    return workIncome;
  }

  /**
   * Get family net income from additional data provided by tax calculation
   * Prefer Quebec net income if available, fallback to federal
   */
  private getFamilyNetIncome(additionalData?: any): Decimal {
    // Try Quebec net income first (preferred for Quebec calculations)
    if (additionalData?.quebec_net_income) {
      if (additionalData.quebec_net_income.family) {
        return new Decimal(additionalData.quebec_net_income.family);
      }
      if (additionalData.quebec_net_income.individual) {
        return new Decimal(additionalData.quebec_net_income.individual);
      }
    }
    
    // Fallback to federal net income
    if (additionalData?.federal_net_income) {
      if (additionalData.federal_net_income.family) {
        return new Decimal(additionalData.federal_net_income.family);
      }
      if (additionalData.federal_net_income.individual) {
        return new Decimal(additionalData.federal_net_income.individual);
      }
    }
    
    // Fallback to zero if no net income data is available
    // This should not happen in normal operation as tax should be calculated first
    return new Decimal(0);
  }

  /**
   * Calculate phase-out reduction for debugging/display purposes
   */
  private calculatePhaseOutReduction(familyNetIncome: Decimal, params: any): Decimal {
    if (familyNetIncome.greaterThan(params.reduction_threshold)) {
      const incomeAboveThreshold = familyNetIncome.minus(params.reduction_threshold);
      return this.roundToNearestDollar(incomeAboveThreshold.times(params.reduction_rate));
    }
    return new Decimal(0);
  }

  /**
   * Create a zero result with reason for ineligibility
   */
  private createZeroResult(household: Household, reason: string): Record<string, Decimal> {
    return {
      amount: new Decimal(0),
      eligible: new Decimal(0),
      work_income: this.roundToNearestDollar(this.calculateWorkIncome(household)),
      family_net_income: new Decimal(0),
      medical_expenses: household.medicalExpenses,
      creditable_medical_expenses: new Decimal(0),
      phase_out_reduction: new Decimal(0),
      minimum_work_income_met: new Decimal(0)
    };
  }

  /**
   * Round to nearest dollar using standard rounding
   */
  private roundToNearestDollar(value: Decimal): Decimal {
    return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }
}

// Register the calculator
CalculatorRegistry.register('medical_expense_supplement_quebec', MedicalExpenseSupplementQuebecCalculator);