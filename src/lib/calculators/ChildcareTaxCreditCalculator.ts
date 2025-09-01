/**
 * Calculateur du crédit d'impôt pour frais de garde d'enfants - Québec
 * Implémente le crédit d'impôt remboursable selon les règles de Revenu Québec
 */

import Decimal from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { CalculatorRegistry } from '../core/factory';
import { ChildcareTaxCreditConfig } from '../config/types';

export interface ChildcareTaxCreditInput {
  family_net_income: number;
  children: Array<{
    age: number;
    has_disability: boolean;
    childcare_expenses: number;
  }>;
}

export interface ChildcareTaxCreditResult {
  eligible_children: number;
  total_eligible_expenses: number;
  credit_rate: number;
  gross_credit: number;
  net_credit: number;
  breakdown: Array<{
    child_age: number;
    has_disability: boolean;
    expenses: number;
    max_eligible: number;
    eligible_expenses: number;
    credit_amount: number;
  }>;
}

export class ChildcareTaxCreditCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'childcare_tax_credit';
  }

  calculate(...args: any[]): Record<string, Decimal> {
    const input = args[0] as ChildcareTaxCreditInput;
    const result = this.calculateChildcareTaxCredit(input);
    
    return {
      eligible_children: new Decimal(result.eligible_children),
      total_eligible_expenses: new Decimal(result.total_eligible_expenses),
      credit_rate: new Decimal(result.credit_rate),
      gross_credit: new Decimal(result.gross_credit),
      net_credit: new Decimal(result.net_credit)
    };
  }

  calculateChildcareTaxCredit(input: ChildcareTaxCreditInput): ChildcareTaxCreditResult {
    const config = this.calculatorConfig as ChildcareTaxCreditConfig;
    
    // Filtrer les enfants éligibles (16 ans et moins)
    const eligibleChildren = input.children.filter(child => child.age <= 16);
    
    if (eligibleChildren.length === 0) {
      return this.createEmptyResult();
    }

    // Calculer le taux de crédit basé sur le revenu familial
    const creditRate = this.calculateCreditRate(input.family_net_income, config);
    
    // Calculer les frais éligibles pour chaque enfant
    const breakdown = eligibleChildren.map(child => {
      const maxEligible = this.getMaxEligibleExpenses(child, config);
      const eligibleExpenses = Math.min(child.childcare_expenses, maxEligible);
      const creditAmount = eligibleExpenses * creditRate;
      
      return {
        child_age: child.age,
        has_disability: child.has_disability,
        expenses: child.childcare_expenses,
        max_eligible: maxEligible,
        eligible_expenses: eligibleExpenses,
        credit_amount: creditAmount
      };
    });

    const totalEligibleExpenses = breakdown.reduce((sum, item) => sum + item.eligible_expenses, 0);
    const grossCredit = breakdown.reduce((sum, item) => sum + item.credit_amount, 0);

    return {
      eligible_children: eligibleChildren.length,
      total_eligible_expenses: totalEligibleExpenses,
      credit_rate: creditRate,
      gross_credit: grossCredit,
      net_credit: grossCredit, // Crédit remboursable, donc net = gross
      breakdown
    };
  }

  private calculateCreditRate(familyNetIncome: number, config: ChildcareTaxCreditConfig): number {
    const { rate_schedule } = config;
    
    // Trouver le bon palier de taux basé sur le revenu familial
    for (const bracket of rate_schedule) {
      if (familyNetIncome >= bracket.income_min && familyNetIncome <= bracket.income_max) {
        return bracket.rate;
      }
    }
    
    // Si le revenu dépasse tous les seuils, retourner le taux minimum
    return rate_schedule[rate_schedule.length - 1].rate;
  }

  private getMaxEligibleExpenses(child: { age: number; has_disability: boolean }, config: ChildcareTaxCreditConfig): number {
    const { max_expenses } = config;
    
    if (child.has_disability) {
      return max_expenses.disabled_child;
    } else if (child.age < 7) {
      return max_expenses.under_7;
    } else {
      return max_expenses.other_children;
    }
  }

  private createEmptyResult(): ChildcareTaxCreditResult {
    return {
      eligible_children: 0,
      total_eligible_expenses: 0,
      credit_rate: 0,
      gross_credit: 0,
      net_credit: 0,
      breakdown: []
    };
  }
}

// Enregistrement du calculateur
CalculatorRegistry.register('childcare_tax_credit', ChildcareTaxCreditCalculator);