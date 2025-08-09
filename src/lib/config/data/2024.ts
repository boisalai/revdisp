import { TaxYearConfig } from '../types'

/**
 * Configuration fiscale 2024 - Québec
 * Source: Paramètres officiels du ministère des Finances du Québec
 */
export const config2024: TaxYearConfig = {
  year: 2024,
  quebec_tax: {
    tax_brackets: [
      { min: 0, max: 49275, rate: 0.14 },
      { min: 49275, max: 98540, rate: 0.19 },
      { min: 98540, max: 119910, rate: 0.24 },
      { min: 119910, max: 999999999, rate: 0.2575 }
    ],
    credits: {
      basic_amount: 17183,
      age_65_amount: 3395,
      pension_amount: 3017,
      living_alone_amount: 1890
    },
    deduction_rates: {
      cpp: 1.0,
      ei: 1.0,
      qpip: 1.0
    }
  },
  employment_insurance: {
    max_insurable_earnings: 63200,
    employee_rate: 0.0132,
    max_employee_contribution: 834.24,
    min_insurable_earnings: 2000,
    employer_rate_multiplier: 1.4
  },
  qpip: {
    max_insurable_earnings: 94000,
    employee_rate: 0.00494,
    employer_rate: 0.00692,
    self_employed_rate: 0.00878,
    min_earnings: 2000
  },
  qpp: {
    basic_exemption: 3500,
    max_pensionable_earnings: 68500,
    max_additional_earnings: 73200,
    base_rate: 0.054,
    additional_rate_first: 0.01,
    additional_rate_second: 0.04,
    self_employed_multiplier: 2.0
  },
  fss: {
    first_threshold: 17630,
    second_threshold: 61315,
    rate: 0.01,
    base_contribution: 150,
    max_contribution: 1000
  },
  ramq: {
    max_contribution: 731,
    exemption_single: 19790,
    exemption_couple: 32080,
    exemption_single_one_child: 32080,
    exemption_single_multiple_children: 36185,
    exemption_couple_one_child: 36185,
    exemption_couple_multiple_children: 39975,
    first_threshold: 5000,
    base_rate_single: 0.0747,
    additional_rate_single: 0.1122,
    base_rate_couple: 0.0375,
    additional_rate_couple: 0.0562,
    base_max_single: 373.50,
    base_max_couple: 186.75,
    monthly_adjustment: 60.92
  }
} as const