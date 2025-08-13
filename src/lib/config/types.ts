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
}

/**
 * Configuration globale avec toutes les années disponibles
 */
export interface ConfigData {
  [year: number]: TaxYearConfig
}