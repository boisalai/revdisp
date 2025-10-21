/**
 * Calculateur d'aide sociale du Québec
 * Implémente les règles de calcul selon le Règlement sur l'aide aux personnes et aux familles
 */

import Decimal from 'decimal.js';
import { BaseCalculator } from '../core/BaseCalculator';
import { CalculatorRegistry } from '../core/factory';
import { SocialAssistanceConfig } from '../config/types';
import { 
  SocialAssistanceInput, 
  SocialAssistanceResult, 
  EmploymentConstraint,
  SocialAssistanceProgram
} from './SocialAssistanceTypes';

export class SocialAssistanceCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'social_assistance';
  }

  calculate(...args: any[]): Record<string, Decimal> {
    const input = args[0] as SocialAssistanceInput;
    const result = this.calculateSocialAssistance(input);
    
    // Convert to the expected format
    return {
      base_benefit: new Decimal(result.base_benefit),
      constraint_allocation: new Decimal(result.constraint_allocation),
      single_adjustment: new Decimal(result.single_adjustment),
      total_work_income: new Decimal(result.total_work_income),
      work_income_exemption: new Decimal(result.work_income_exemption),
      work_income_supplement: new Decimal(result.work_income_supplement),
      income_reduction: new Decimal(result.income_reduction),
      gross_benefit: new Decimal(result.gross_benefit),
      net_benefit: new Decimal(result.net_benefit),
      eligible: new Decimal(result.eligible ? 1 : 0)
    };
  }

  calculateSocialAssistance(input: SocialAssistanceInput): SocialAssistanceResult {
    const config = this.calculatorConfig as SocialAssistanceConfig;

    // Calculer dans tous les cas - la réduction progressive éliminera les non-admissibles
    // Vérification des avoirs liquides seulement pour les détails de calcul
    const eligibilityCheck = this.checkEligibility(input, config);

    // Déterminer le programme applicable
    const program = this.determineProgram(input);

    // Calculer la prestation de base
    const baseBenefit = this.calculateBaseBenefit(input, config);

    // Calculer l'ajustement
    const adjustmentBenefit = this.calculateAdjustment(input, config);

    // Calculer l'allocation pour contraintes à l'emploi
    const constraintAllocation = this.calculateConstraintAllocation(input, config);

    // Calculer l'ajustement pour personne seule (Programme objectif emploi)
    const singleAdjustment = this.calculateSingleAdjustment(input, config);

    // Calculer les revenus de travail totaux (convertir en mensuel)
    const totalWorkIncome = new Decimal(input.work_income)
      .plus(input.partner_work_income || 0)
      .div(12);

    // Calculer l'exemption sur revenus de travail
    const workIncomeExemption = this.calculateWorkIncomeExemption(input, config, totalWorkIncome);

    // Calculer le supplément sur revenus de travail (2025+)
    const workIncomeSuplement = this.calculateWorkIncomeSuplement(input, config, totalWorkIncome, workIncomeExemption);

    // Calculer la réduction due aux revenus excédentaires
    const incomeReduction = this.calculateIncomeReduction(totalWorkIncome, workIncomeExemption);

    // Prestation brute avant réduction
    const grossBenefit = baseBenefit.plus(adjustmentBenefit).plus(constraintAllocation).plus(singleAdjustment);

    // Prestation nette après réduction des revenus
    const netBenefitAfterReduction = Decimal.max(0, grossBenefit.minus(incomeReduction));

    // Le supplément ne s'applique que si la personne a encore droit à une prestation de base
    const finalWorkIncomeSuplement = netBenefitAfterReduction.gt(0) ? workIncomeSuplement : new Decimal(0);

    const netBenefit = netBenefitAfterReduction.plus(finalWorkIncomeSuplement);

    // Déterminer l'admissibilité finale : eligible si prestation nette > 0 ET avoirs liquides OK
    const finalEligible = netBenefit.gt(0) && eligibilityCheck.eligible;

    return {
      base_benefit: baseBenefit.times(12).toNumber(), // Annuel
      adjustment_benefit: adjustmentBenefit.times(12).toNumber(), // Annuel
      constraint_allocation: constraintAllocation.times(12).toNumber(), // Annuel
      single_adjustment: singleAdjustment.times(12).toNumber(), // Annuel
      total_work_income: totalWorkIncome.times(12).toNumber(), // Reconvertir en annuel
      work_income_exemption: workIncomeExemption.times(12).toNumber(), // Reconvertir en annuel
      work_income_supplement: finalWorkIncomeSuplement.times(12).toNumber(), // Annuel
      income_reduction: incomeReduction.times(12).toNumber(), // Annuel
      gross_benefit: grossBenefit.times(12).toNumber(), // Annuel
      net_benefit: finalEligible ? netBenefit.times(12).toNumber() : 0, // Annuel - 0 si non admissible
      eligible: finalEligible,
      program,
      ineligibility_reason: !finalEligible ? (eligibilityCheck.reason || 'revenus_trop_eleves') : undefined,
      calculation_details: {
        base_benefit_category: this.getBaseBenefitCategory(input),
        constraint_details: this.getConstraintDetails(input),
        work_income_calculation: this.getWorkIncomeCalculationDetails(totalWorkIncome, workIncomeExemption, finalWorkIncomeSuplement),
        liquid_assets_check: this.getLiquidAssetsDetails(input, config),
        monthly_net_benefit: finalEligible ? netBenefit.toNumber() : 0 // Garder le mensuel pour les détails
      }
    };
  }


  private checkEligibility(input: SocialAssistanceInput, config: SocialAssistanceConfig): { eligible: boolean; reason?: string } {
    // Vérifier l'âge : les personnes de 65 ans et plus ne sont pas admissibles à l'aide sociale
    // Elles reçoivent plutôt la PSV/SRG (Pension de la Sécurité de la vieillesse et Supplément de revenu garanti)
    if (input.age >= 65) {
      return {
        eligible: false,
        reason: 'Les personnes de 65 ans et plus ne sont pas admissibles à l\'aide sociale (admissibles à la PSV/SRG)'
      };
    }

    // Pour les couples, vérifier aussi l'âge du conjoint
    if (input.household_type === 'couple' && input.partner_age && input.partner_age >= 65) {
      return {
        eligible: false,
        reason: 'Les couples dont un conjoint a 65 ans et plus ne sont pas admissibles à l\'aide sociale (admissibles à la PSV/SRG)'
      };
    }

    // Vérifier les limites d'avoirs liquides
    const liquidAssetLimit = this.getLiquidAssetLimit(input, config);

    if (input.liquid_assets > liquidAssetLimit) {
      return {
        eligible: false,
        reason: `Avoirs liquides (${input.liquid_assets}$) dépassent la limite permise (${liquidAssetLimit}$)`
      };
    }

    return { eligible: true };
  }

  private getLiquidAssetLimit(input: SocialAssistanceInput, config: SocialAssistanceConfig): number {
    const hasChildren = (input.children_count || 0) > 0;

    if (input.household_type === 'single' || input.household_type === 'single_parent') {
      return hasChildren ? config.liquid_asset_limits.single_with_children : config.liquid_asset_limits.single_no_children;
    } else {
      return hasChildren ? config.liquid_asset_limits.couple_with_children : config.liquid_asset_limits.couple_no_children;
    }
  }

  private determineProgram(input: SocialAssistanceInput): SocialAssistanceProgram {
    if (input.first_time_applicant) {
      return 'objectif_emploi';
    }
    
    if (input.employment_constraint === 'severe' || input.partner_employment_constraint === 'severe') {
      return 'solidarite_sociale';
    }
    
    return 'aide_sociale';
  }

  private getFamilyType(input: SocialAssistanceInput): string {
    /**
     * Détermine le type de famille selon la nouvelle structure
     * Inspiré de votre code de référence
     */
    if (input.household_type === 'couple') {
      return input.living_with_parents ? 'couple_with_parents' : 'couple';
    } else {
      return input.living_with_parents ? 'single_with_parents' : 'single_adult';
    }
  }

  private calculateBaseBenefit(input: SocialAssistanceInput, config: SocialAssistanceConfig): Decimal {
    const program = this.determineProgram(input);
    const familyType = this.getFamilyType(input);
    
    if (program === 'solidarite_sociale') {
      const programParams = config.solidarite_sociale[familyType as keyof typeof config.solidarite_sociale] as any;
      return new Decimal(programParams.base);
    } else {
      const programParams = config.aide_sociale[familyType as keyof typeof config.aide_sociale] as any;
      // Vérifier que c'est un objet avec base et adjustment (pas couple_one_constraint)
      if (programParams && programParams.base !== undefined) {
        return new Decimal(programParams.base);
      }
      return new Decimal(0);
    }
  }

  private calculateAdjustment(input: SocialAssistanceInput, config: SocialAssistanceConfig): Decimal {
    const program = this.determineProgram(input);
    const familyType = this.getFamilyType(input);
    
    if (program === 'solidarite_sociale') {
      const programParams = config.solidarite_sociale[familyType as keyof typeof config.solidarite_sociale] as any;
      return new Decimal(programParams.adjustment || 0);
    } else {
      const programParams = config.aide_sociale[familyType as keyof typeof config.aide_sociale] as any;
      // Vérifier que c'est un objet avec base et adjustment (pas couple_one_constraint)
      if (programParams && programParams.adjustment !== undefined) {
        return new Decimal(programParams.adjustment);
      }
      return new Decimal(0);
    }
  }

  private calculateConstraintAllocation(input: SocialAssistanceInput, config: SocialAssistanceConfig): Decimal {
    const program = this.determineProgram(input);
    
    // Pas d'allocation pour solidarité sociale (contraintes sévères)
    if (program === 'solidarite_sociale') {
      return new Decimal(0);
    }

    const isCouple = input.household_type === 'couple';
    const hasConstraint = input.employment_constraint === 'temporary';
    const partnerHasConstraint = input.partner_employment_constraint === 'temporary';

    if (!hasConstraint && !partnerHasConstraint) {
      return new Decimal(0);
    }

    const familyType = this.getFamilyType(input);
    
    if (isCouple) {
      if (hasConstraint && partnerHasConstraint) {
        // Les deux ont une contrainte temporaire
        const params = config.aide_sociale[familyType as keyof typeof config.aide_sociale] as any;
        return new Decimal(params.temp_constraint_amount || 0);
      } else {
        // Un seul a une contrainte temporaire
        return new Decimal(config.aide_sociale.couple_one_constraint.temp_constraint_amount);
      }
    } else {
      // Personne seule avec contrainte temporaire
      const params = config.aide_sociale[familyType as keyof typeof config.aide_sociale] as any;
      return new Decimal(params.temp_constraint_amount || 0);
    }
  }

  private calculateSingleAdjustment(input: SocialAssistanceInput, config: SocialAssistanceConfig): Decimal {
    const program = this.determineProgram(input);
    return program === 'objectif_emploi' ? new Decimal(config.objectif_emploi.single_adjustment) : new Decimal(0);
  }

  private calculateWorkIncomeExemption(input: SocialAssistanceInput, config: SocialAssistanceConfig, totalWorkIncome: Decimal): Decimal {
    const exemptionLimit = input.household_type === 'couple' 
      ? config.work_income_exemption.couple 
      : config.work_income_exemption.single;

    return Decimal.min(totalWorkIncome, exemptionLimit);
  }

  private calculateWorkIncomeSuplement(input: SocialAssistanceInput, config: SocialAssistanceConfig, totalWorkIncome: Decimal, exemption: Decimal): Decimal {
    // Supplément introduit en 2025
    if (input.year < config.work_income_supplement_start_year) {
      return new Decimal(0);
    }

    const excessIncome = Decimal.max(0, totalWorkIncome.minus(exemption));
    
    // Le supplément de 25% ne s'applique que sur une portion limitée des revenus excédentaires
    // Plafonner à un montant raisonnable (ex: maximum 200$ par mois de supplément)
    const maxSupplementPerMonth = new Decimal(200);
    const supplementAmount = excessIncome.times(config.work_income_supplement_rate);
    
    return Decimal.min(supplementAmount, maxSupplementPerMonth);
  }

  private calculateIncomeReduction(totalWorkIncome: Decimal, exemption: Decimal): Decimal {
    // Réduction dollar pour dollar sur les revenus excédant l'exemption
    return Decimal.max(0, totalWorkIncome.minus(exemption));
  }

  private getBaseBenefitCategory(input: SocialAssistanceInput): string {
    const base = input.household_type === 'couple' ? 'Couple' : 'Personne seule';
    const residence = input.living_with_parents ? ' (avec parents)' : '';
    return `${base}${residence}`;
  }

  private getConstraintDetails(input: SocialAssistanceInput): string {
    const constraints = [];
    
    if (input.employment_constraint === 'temporary') {
      constraints.push('Personne principale: contrainte temporaire');
    }
    
    if (input.partner_employment_constraint === 'temporary') {
      constraints.push('Conjoint: contrainte temporaire');
    }

    return constraints.length > 0 ? constraints.join(', ') : 'Aucune contrainte';
  }

  private getWorkIncomeCalculationDetails(totalIncome: Decimal, exemption: Decimal, supplement: Decimal): string {
    const parts = [
      `Revenus totaux: ${totalIncome.toFixed(2)}$`,
      `Exemption: ${exemption.toFixed(2)}$`,
      `Réduction: ${Decimal.max(0, totalIncome.minus(exemption)).toFixed(2)}$`
    ];

    if (supplement.gt(0)) {
      parts.push(`Supplément 25%: ${supplement.toFixed(2)}$`);
    }

    return parts.join(', ');
  }

  private getLiquidAssetsDetails(input: SocialAssistanceInput, config: SocialAssistanceConfig): string {
    const limit = this.getLiquidAssetLimit(input, config);
    return `Avoirs: ${input.liquid_assets}$ / Limite: ${limit}$`;
  }

  private createIneligibleResult(input: SocialAssistanceInput, reason: string, config: SocialAssistanceConfig): SocialAssistanceResult {
    return {
      base_benefit: 0,
      adjustment_benefit: 0,
      constraint_allocation: 0,
      single_adjustment: 0,
      total_work_income: new Decimal(input.work_income).plus(input.partner_work_income || 0).toNumber(),
      work_income_exemption: 0,
      work_income_supplement: 0,
      income_reduction: 0,
      gross_benefit: 0,
      net_benefit: 0,
      eligible: false,
      ineligibility_reason: reason,
      program: this.determineProgram(input),
      calculation_details: {
        base_benefit_category: 'Non admissible',
        constraint_details: 'Non applicable',
        work_income_calculation: 'Non applicable',
        liquid_assets_check: reason,
        monthly_net_benefit: 0
      }
    };
  }
}

// Register the calculator
CalculatorRegistry.register('social_assistance', SocialAssistanceCalculator);