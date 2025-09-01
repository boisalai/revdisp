/**
 * Calculateur de l'allocation-logement du Québec
 * 
 * Programme d'aide financière pour les ménages à faible revenu qui consacrent
 * une proportion importante de leur revenu au logement.
 * 
 * Sources:
 * - Revenu Québec: Programme allocation-logement
 * - CFFP: Guide des mesures fiscales - Allocation-logement
 * - Société d'habitation du Québec
 */

import Decimal from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { CalculatorRegistry } from '../core/factory';
import { HousingAllowanceConfig } from '../config/types';

export interface HousingAllowanceInput {
  household_type: 'single' | 'couple' | 'single_parent';
  family_net_income: number;
  children_count: number;
  annual_housing_cost: number;
  applicant_age?: number;
  spouse_age?: number;
  liquid_assets_value: number; // Valeur des comptes non enregistrés + CELI
}

export interface HousingAllowanceResult {
  eligible: boolean;
  housing_effort_rate: number;
  monthly_allowance: number;
  annual_allowance: number;
  ineligibility_reason?: string;
  calculation_details: {
    income_threshold: number;
    housing_cost_minimum: number;
    effort_rate_tier: '30-49.9%' | '50-79.9%' | '80%+' | 'below_30%';
    progressive_reduction: number;
  };
}

export class HousingAllowanceCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'housing_allowance';
  }

  calculate(...args: any[]): Record<string, Decimal> {
    const input = args[0] as HousingAllowanceInput;
    const result = this.calculateHousingAllowance(input);
    
    return {
      eligible: new Decimal(result.eligible ? 1 : 0),
      housing_effort_rate: new Decimal(result.housing_effort_rate),
      monthly_allowance: new Decimal(result.monthly_allowance),
      annual_allowance: new Decimal(result.annual_allowance),
      progressive_reduction: new Decimal(result.calculation_details.progressive_reduction)
    };
  }

  calculateHousingAllowance(input: HousingAllowanceInput): HousingAllowanceResult {
    const config = this.calculatorConfig as HousingAllowanceConfig;
    
    // 1. Vérifier l'admissibilité de base
    const eligibilityCheck = this.checkBasicEligibility(input, config);
    if (!eligibilityCheck.eligible) {
      return this.createIneligibleResult(input, eligibilityCheck.reason || 'unknown');
    }

    // 2. Calculer le taux d'effort au logement
    const housingEffortRate = this.calculateHousingEffortRate(input);
    
    // 3. Vérifier si le taux d'effort minimum est atteint (30%)
    if (housingEffortRate < 0.30) {
      return this.createIneligibleResult(input, 'housing_effort_too_low');
    }

    // 4. Déterminer le seuil de revenu selon la composition familiale
    const incomeThreshold = this.getIncomeThreshold(input, config);
    
    // 5. Vérifier l'admissibilité selon le revenu
    if (input.family_net_income > incomeThreshold) {
      return this.createIneligibleResult(input, 'income_too_high');
    }

    // 6. Calculer le montant de base selon le taux d'effort
    const baseMonthlyAmount = this.calculateBaseAmount(housingEffortRate, config);
    
    // 7. Appliquer la réduction progressive si nécessaire
    const reductionThreshold = this.getReductionThreshold(input, config);
    const progressiveReduction = Math.max(0, input.family_net_income - reductionThreshold);
    const monthlyAllowance = Math.max(0, baseMonthlyAmount - progressiveReduction / 12);

    // 8. Déterminer le palier d'effort
    const effortTier = this.getEffortTier(housingEffortRate);

    return {
      eligible: true,
      housing_effort_rate: housingEffortRate,
      monthly_allowance: Math.round(monthlyAllowance),
      annual_allowance: Math.round(monthlyAllowance * 12),
      calculation_details: {
        income_threshold: incomeThreshold,
        housing_cost_minimum: input.family_net_income * 0.30,
        effort_rate_tier: effortTier,
        progressive_reduction: progressiveReduction
      }
    };
  }

  private checkBasicEligibility(
    input: HousingAllowanceInput, 
    config: HousingAllowanceConfig
  ): { eligible: boolean; reason?: string } {
    // Vérifier les avoirs liquides (limite de 50 000$)
    if (input.liquid_assets_value > config.max_liquid_assets) {
      return { eligible: false, reason: 'liquid_assets_too_high' };
    }

    // Vérifier les conditions d'âge et de composition familiale
    if (input.children_count === 0) {
      // Sans enfants, il faut avoir 50 ans ou plus
      const applicantAge = input.applicant_age || 0;
      const spouseAge = input.spouse_age || 0;
      
      if (input.household_type === 'single') {
        if (applicantAge < 50) {
          return { eligible: false, reason: 'age_too_young_single' };
        }
      } else if (input.household_type === 'couple') {
        if (applicantAge < 50 && spouseAge < 50) {
          return { eligible: false, reason: 'age_too_young_couple' };
        }
      }
    }

    return { eligible: true };
  }

  private calculateHousingEffortRate(input: HousingAllowanceInput): number {
    if (input.family_net_income <= 0) return 0;
    return input.annual_housing_cost / input.family_net_income;
  }

  private getIncomeThreshold(input: HousingAllowanceInput, config: HousingAllowanceConfig): number {
    const { thresholds } = config;
    
    if (input.household_type === 'single') {
      if (input.children_count === 0) {
        return thresholds.single_no_children; // 24 440$
      } else {
        return input.children_count <= 2 
          ? thresholds.single_parent_1_2_children // 40 740$
          : thresholds.single_parent_3plus_children; // 46 640$
      }
    } else { // couple
      if (input.children_count === 0) {
        return thresholds.couple_no_children; // 33 540$
      } else if (input.children_count === 1) {
        return thresholds.couple_1_child; // 40 740$
      } else {
        return thresholds.couple_2plus_children; // 46 640$
      }
    }
  }

  private getReductionThreshold(input: HousingAllowanceInput, config: HousingAllowanceConfig): number {
    // Le seuil de réduction est généralement plus bas que le seuil d'admissibilité
    // Utilisation d'un ratio approximatif basé sur les données disponibles
    const incomeThreshold = this.getIncomeThreshold(input, config);
    return incomeThreshold * config.reduction_threshold_ratio;
  }

  private calculateBaseAmount(housingEffortRate: number, config: HousingAllowanceConfig): number {
    if (housingEffortRate >= 0.80) {
      return config.amounts.tier_80_plus; // 170$
    } else if (housingEffortRate >= 0.50) {
      return config.amounts.tier_50_79; // 150$
    } else if (housingEffortRate >= 0.30) {
      return config.amounts.tier_30_49; // 100$
    }
    return 0;
  }

  private getEffortTier(housingEffortRate: number): '30-49.9%' | '50-79.9%' | '80%+' | 'below_30%' {
    if (housingEffortRate >= 0.80) return '80%+';
    if (housingEffortRate >= 0.50) return '50-79.9%';
    if (housingEffortRate >= 0.30) return '30-49.9%';
    return 'below_30%';
  }

  private createIneligibleResult(input: HousingAllowanceInput, reason: string): HousingAllowanceResult {
    return {
      eligible: false,
      housing_effort_rate: this.calculateHousingEffortRate(input),
      monthly_allowance: 0,
      annual_allowance: 0,
      ineligibility_reason: reason,
      calculation_details: {
        income_threshold: 0,
        housing_cost_minimum: 0,
        effort_rate_tier: 'below_30%',
        progressive_reduction: 0
      }
    };
  }
}

// Enregistrement du calculateur
CalculatorRegistry.register('housing_allowance', HousingAllowanceCalculator);