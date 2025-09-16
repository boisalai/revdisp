/**
 * Types TypeScript stricts pour la configuration fiscale
 */

export interface TaxBracket {
  min: number
  max: number
  rate: number
}

export interface FederalTaxConfig {
  tax_brackets: TaxBracket[]
  credits: {
    basic_amount: number
    age_65_amount: number
    pension_amount: number
    living_alone_amount: number
  }
}

export interface QuebecTaxConfig {
  tax_brackets: TaxBracket[]
  credits: {
    basic_amount: number
    // Nouvelles structures avec seuils de réduction
    living_alone?: {
      base_amount: number
      single_parent_supplement: number
      reduction_threshold: number
      reduction_rate: number
      elimination_threshold_base: number
      elimination_threshold_supplement: number
    }
    age_credit?: {
      base_amount: number
      reduction_threshold_single: number
      reduction_threshold_couple: number
      reduction_rate: number
    }
    pension_credit?: {
      max_amount: number
      reduction_threshold_single: number
      reduction_threshold_couple: number
      reduction_rate: number
    }
    // Anciens paramètres (pour compatibilité)
    age_65_amount: number
    pension_amount: number
    living_alone_amount: number
  }
  deduction_rates: {
    cpp: number
    ei: number
    qpip: number
  }
}

export interface EmploymentInsuranceConfig {
  max_insurable_earnings: number
  employee_rate: number
  max_employee_contribution: number
  min_insurable_earnings: number
  employer_rate_multiplier: number
  quebec_reduction?: number // Réduction RQAP pour les résidents du Québec
}

export interface QpipConfig {
  max_insurable_earnings: number
  employee_rate: number
  employer_rate: number
  self_employed_rate: number
  min_earnings: number
}

export interface QppConfig {
  basic_exemption: number
  max_pensionable_earnings: number
  max_additional_earnings: number
  base_rate: number
  additional_rate_first: number
  additional_rate_second: number
  self_employed_multiplier: number
}

export interface FssConfig {
  first_threshold: number
  second_threshold: number
  rate: number
  base_contribution: number
  max_contribution: number
}

export interface SolidarityConfig {
  tvq_component: {
    base_amount: number
    spouse_amount: number
    single_additional: number
  }
  housing_component: {
    couple_amount: number
    single_amount: number
    child_amount: number
  }
  northern_village_component: {
    adult_amount: number
    child_amount: number
  }
  reduction: {
    threshold: number
    rate: number
    single_component_rate: number
  }
}

export interface WorkPremiumConfig {
  minimum_work_income: {
    single: number
    couple: number
  }
  maximum_amounts: {
    single: number
    single_parent: number
    couple_with_children: number
    couple_without_children: number
  }
  growth_rates: {
    no_children: number
    with_children: number
  }
  reduction: {
    rate: number
    thresholds: {
      single: number
      single_parent: number
      couple_with_children: number
      couple_without_children: number
    }
  }
  excluded_work_income: {
    single: number
    couple: number
  }
}

export interface RamqConfig {
  max_contribution: number
  max_contribution_couple: number // Maximum pour un couple (2 × 737.50$)
  exemption_single: number
  exemption_couple: number
  exemption_single_one_child: number
  exemption_single_multiple_children: number
  exemption_couple_one_child: number
  exemption_couple_multiple_children: number
  first_threshold: number
  base_rate_single: number
  additional_rate_single: number
  base_rate_couple: number
  additional_rate_couple: number
  base_max_single: number
  base_max_couple: number
  monthly_adjustment: number
}

export interface FamilyAllowanceConfig {
  basic_allowance: {
    max_amount: number
    min_amount: number
  }
  single_parent_supplement: {
    max_amount: number
    min_amount: number
  }
  school_supplies_supplement: {
    amount: number
    min_age: number
    max_age: number
  }
  disabled_child_supplement: {
    basic_amount: number
    exceptional_care_tier1: number
    exceptional_care_tier2: number
  }
  reduction: {
    thresholds: {
      couple: number
      single_parent: number
    }
    rate: number
  }
}

export interface CanadaChildBenefitConfig {
  base_amounts: {
    under_6: number
    age_6_to_17: number
  }
  disability_benefit: {
    amount: number
  }
  thresholds: {
    first: number
    second: number
  }
  reduction_rates: {
    first_phase: {
      one_child: number
      two_children: number
      three_children: number
      four_plus_children: number
    }
    second_phase: {
      one_child: number
      two_children: number
      three_children: number
      four_plus_children: number
    }
  }
}

export interface GstCreditParameters {
  base_amount: number
  spouse_amount: number
  child_amount: number
  single_income_threshold: number
  single_supplement_rate: number
  single_supplement_max: number
  family_income_threshold: number
  reduction_rate: number
}

export interface CanadaWorkersConfig {
  basic_amount: {
    single_max: number
    family_max: number
    single_parent_max: number
    family_with_children_max: number
  }
  disability_supplement: {
    max_amount: number
  }
  income_thresholds: {
    minimum_work_income: number
    minimum_work_income_couple: number
    phase_in_start: number
    phase_out_start_single: number
    phase_out_start_family: number
    phase_out_start_single_parent: number
    phase_out_start_family_children: number
    phase_out_end_single: number
    phase_out_end_family: number
    disability_phase_out_start_single: number
    disability_phase_out_start_family: number
    disability_phase_out_end_single: number
    disability_phase_out_end_family: number
  }
  calculation_rates: {
    phase_in_rate: number
    phase_in_rate_single_parent: number
    phase_in_rate_family_children: number
    phase_out_rate: number
    disability_phase_out_rate: number
  }
  secondary_earner_exemption: number
}

export interface OldAgeSecurityQuarter {
  max_amount_65_74: number
  max_amount_75_plus: number
  recovery_threshold: number
  recovery_upper_limit_65_74: number
  recovery_upper_limit_75_plus: number
}

export interface GisQuarterConfig {
  single_max_amount: number
  single_income_cutoff: number
  single_top_up_cutoff: number
  couple_both_oas_max: number
  couple_both_oas_income_cutoff: number
  couple_both_oas_top_up_cutoff: number
  couple_one_oas_max: number
  couple_one_oas_income_cutoff: number
  couple_one_oas_top_up_cutoff: number
}

export interface GisConfig {
  quarters: {
    q1: GisQuarterConfig
    q2: GisQuarterConfig
    q3: GisQuarterConfig
    q4: GisQuarterConfig
  }
  employment_income_exemption: {
    first_exemption: number      // Premier 5 000 $ exempt
    partial_exemption: number    // 50% entre 5 000 $ et 15 000 $
    partial_rate: number         // Taux partiel (0.5)
  }
  reduction_rate: number         // Taux de réduction standard (0.5)
}

export interface OldAgeSecurityConfig {
  quarters: {
    q1: OldAgeSecurityQuarter  // janvier-mars
    q2: OldAgeSecurityQuarter  // avril-juin
    q3: OldAgeSecurityQuarter  // juillet-septembre
    q4: OldAgeSecurityQuarter  // octobre-décembre
  }
  recovery_rate: number  // Taux de récupération (15%)
  minimum_residence_years: number  // 10 ans minimum pour recevoir
  full_pension_years: number      // 40 ans pour pension complète
  gis: GisConfig         // Configuration du Supplément de revenu garanti
}

export interface MedicalExpenseSupplementConfig {
  maximum_amount: number           // Montant maximal du supplément
  minimum_work_income: number      // Revenu de travail minimum requis
  reduction_threshold: number      // Seuil de réduction du revenu familial net
  reduction_rate: number           // Taux de réduction (généralement 5%)
  medical_expense_rate: number     // Taux de crédit sur frais médicaux (généralement 25%)
  phase_out_end: number           // Seuil d'élimination complète
}

export interface SocialAssistanceBenefitConfig {
  base: number
  adjustment: number
  temp_constraint_amount?: number
}

export interface SocialAssistanceConfig {
  aide_sociale: {
    single_adult: SocialAssistanceBenefitConfig
    single_with_parents: SocialAssistanceBenefitConfig
    couple: SocialAssistanceBenefitConfig
    couple_with_parents: SocialAssistanceBenefitConfig
    couple_one_constraint: {
      temp_constraint_amount: number
    }
  }
  solidarite_sociale: {
    single_adult: SocialAssistanceBenefitConfig
    single_with_parents: SocialAssistanceBenefitConfig
    couple: SocialAssistanceBenefitConfig
    couple_with_parents: SocialAssistanceBenefitConfig
  }
  objectif_emploi: {
    single_adjustment: number
  }
  work_income_exemption: {
    single: number
    couple: number
  }
  work_income_supplement_rate: number
  work_income_supplement_start_year: number
  work_income_supplement_max_monthly: number
  liquid_asset_limits: {
    single_no_children: number
    single_with_children: number
    couple_no_children: number
    couple_with_children: number
  }
}

/**
 * Configuration fiscale complète pour une année donnée
 */
export interface TaxYearConfig {
  year: number
  federal_tax: FederalTaxConfig
  quebec_tax: QuebecTaxConfig
  employment_insurance: EmploymentInsuranceConfig
  qpip: QpipConfig
  qpp: QppConfig
  fss: FssConfig
  ramq: RamqConfig
  solidarity: SolidarityConfig
  work_premium: WorkPremiumConfig
  family_allowance: FamilyAllowanceConfig
  canada_child_benefit: CanadaChildBenefitConfig
  gst_credit: GstCreditParameters
  canada_workers: CanadaWorkersConfig
  old_age_security: OldAgeSecurityConfig
  medical_expense_supplement_federal: MedicalExpenseSupplementConfig
  medical_expense_supplement_quebec: MedicalExpenseSupplementConfig
  school_supplies_supplement: SchoolSuppliesSupplementConfig
  senior_support: SeniorSupportConfig
  social_assistance: SocialAssistanceConfig
  childcare_tax_credit: ChildcareTaxCreditConfig
  housing_allowance: HousingAllowanceConfig
}

/**
 * Configuration globale avec toutes les années disponibles
 */
export interface ConfigData {
  [year: number]: TaxYearConfig
}

/**
 * Types for individual configuration sections
 */
export interface ConfigTypes {
  federal_tax: FederalTaxConfig
  quebec_tax: QuebecTaxConfig
  employment_insurance: EmploymentInsuranceConfig
  qpip: QpipConfig
  qpp: QppConfig
  fss: FssConfig
  ramq: RamqConfig
  solidarity: SolidarityConfig
  work_premium: WorkPremiumConfig
  family_allowance: FamilyAllowanceConfig
  canada_child_benefit: CanadaChildBenefitConfig
  gst_credit: GstCreditParameters
  canada_workers: CanadaWorkersConfig
  old_age_security: OldAgeSecurityConfig
  medical_expense_supplement_federal: MedicalExpenseSupplementConfig
  medical_expense_supplement_quebec: MedicalExpenseSupplementConfig
  school_supplies_supplement: SchoolSuppliesSupplementConfig
  social_assistance: SocialAssistanceConfig
  childcare_tax_credit: ChildcareTaxCreditConfig
  housing_allowance: HousingAllowanceConfig
}

export interface SchoolSuppliesSupplementConfig {
  amount: number
  min_age: number
  max_age: number
  max_age_with_disability: number
}

export interface SeniorSupportConfig {
  min_age: number
  max_credit: {
    single: number
    couple: number
  }
  income_thresholds: {
    single: number
    couple: number
  }
  income_limits: {
    single: number
    couple: number
  }
  reduction_rate: number
}

export interface ChildcareTaxCreditConfig {
  max_expenses: {
    disabled_child: number
    under_7: number
    other_children: number
  }
  rate_schedule: Array<{
    income_min: number
    income_max: number
    rate: number
  }>
}

export interface HousingAllowanceConfig {
  max_liquid_assets: number
  amounts: {
    tier_30_49: number    // 100$ (30-49.9% d'effort)
    tier_50_79: number    // 150$ (50-79.9% d'effort)
    tier_80_plus: number  // 170$ (80%+ d'effort)
  }
  thresholds: {
    single_no_children: number        // 24 440$ (50+ ans)
    couple_no_children: number        // 33 540$ (50+ ans)
    single_parent_1_2_children: number  // 40 740$
    single_parent_3plus_children: number // 46 640$
    couple_1_child: number            // 40 740$
    couple_2plus_children: number     // 46 640$
  }
  reduction_threshold_ratio: number   // Ratio du seuil de réduction (ex: 0.85)
}