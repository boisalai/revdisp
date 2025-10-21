/**
 * Types et interfaces pour le calculateur d'aide sociale du Québec
 * Basé sur les références officielles du ministère des Finances du Québec
 */

export type EmploymentConstraint = 'none' | 'temporary' | 'severe';
export type SocialAssistanceProgram = 'aide_sociale' | 'solidarite_sociale' | 'objectif_emploi';

export interface SocialAssistanceInput {
  /** Type de ménage */
  household_type: 'single' | 'couple' | 'single_parent';

  /** Âge de la personne principale */
  age: number;

  /** Âge du conjoint (si applicable) */
  partner_age?: number;

  /** Contrainte à l'emploi de la personne principale */
  employment_constraint: EmploymentConstraint;

  /** Contrainte à l'emploi du conjoint (si applicable) */
  partner_employment_constraint?: EmploymentConstraint;

  /** Revenu de travail de la personne principale */
  work_income: number;

  /** Revenu de travail du conjoint */
  partner_work_income?: number;

  /** Avoirs liquides totaux du ménage */
  liquid_assets: number;

  /** Première demande d'aide sociale (Programme objectif emploi) */
  first_time_applicant?: boolean;

  /** Nombre d'enfants */
  children_count?: number;

  /** Âges des enfants (pour calculs futurs) */
  children_ages?: number[];

  /** Vit chez ses parents (réduction des prestations) */
  living_with_parents?: boolean;

  /** Année fiscale */
  year: 2023 | 2024 | 2025;
}

export interface SocialAssistanceResult {
  /** Prestation de base selon la composition familiale */
  base_benefit: number;
  
  /** Ajustement de base (45$ en 2025) */
  adjustment_benefit: number;
  
  /** Allocation pour contrainte à l'emploi */
  constraint_allocation: number;
  
  /** Ajustement pour personne seule (Programme objectif emploi) */
  single_adjustment: number;
  
  /** Montant total des revenus de travail */
  total_work_income: number;
  
  /** Revenus de travail exemptés */
  work_income_exemption: number;
  
  /** Supplément sur revenus de travail (2025+) */
  work_income_supplement: number;
  
  /** Réduction due aux revenus excédentaires */
  income_reduction: number;
  
  /** Prestation totale avant vérifications */
  gross_benefit: number;
  
  /** Prestation nette finale */
  net_benefit: number;
  
  /** Admissible aux prestations */
  eligible: boolean;
  
  /** Raison d'inadmissibilité */
  ineligibility_reason?: string;
  
  /** Programme applicable */
  program: SocialAssistanceProgram;
  
  /** Détails de calcul pour transparence */
  calculation_details: {
    base_benefit_category: string;
    constraint_details: string;
    work_income_calculation: string;
    liquid_assets_check: string;
    monthly_net_benefit: number;
  };
}

export interface SocialAssistanceConfig {
  /** Prestations de base par composition familiale */
  base_benefit: {
    single: number;
    couple: number;
    single_with_parents: number;
    couple_with_parents: number;
  };
  
  /** Allocations pour contraintes à l'emploi */
  constraint_allocation: {
    single_temporary: number;
    couple_both_temporary: number;
    couple_one_temporary: number;
    single_severe: number;
    couple_both_severe: number;
    couple_one_severe: number;
  };
  
  /** Ajustement pour personne seule (Programme objectif emploi) */
  single_adjustment: number;
  
  /** Exemptions sur revenus de travail */
  work_income_exemption: {
    single: number;
    couple: number;
  };
  
  /** Taux de supplément sur revenus excédentaires */
  work_income_supplement_rate: number;
  
  /** Année d'entrée en vigueur du supplément */
  work_income_supplement_start_year: number;
  
  /** Limites d'avoirs liquides pour admissibilité */
  liquid_asset_limits: {
    single_no_children: number;
    single_with_children: number;
    couple_no_children: number;
    couple_with_children: number;
  };
  
  /** Ajustements pour enfants (à implémenter dans une phase future) */
  child_adjustments?: {
    under_6: number;
    age_6_to_11: number;
    age_12_to_17: number;
  };
}

export interface SocialAssistanceValidationCase {
  description: string;
  input: SocialAssistanceInput;
  expected_result: Partial<SocialAssistanceResult>;
  tolerance?: number;
}