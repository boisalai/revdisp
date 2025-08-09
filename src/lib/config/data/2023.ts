import { TaxYearConfig } from '../types'

/**
 * Configuration fiscale 2023 - Québec
 * Source: Paramètres officiels du ministère des Finances du Québec
 */
export const config2023: TaxYearConfig = {
  year: 2023,
  quebec_tax: {
    tax_brackets: [
      { min: 0, max: 46295, rate: 0.14 },
      { min: 46295, max: 92580, rate: 0.19 },
      { min: 92580, max: 112655, rate: 0.24 },
      { min: 112655, max: 999999999, rate: 0.2575 }
    ],
    credits: {
      basic_amount: 16495,
      age_65_amount: 3211,
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
    max_insurable_earnings: 61500,
    employee_rate: 0.0127,
    max_employee_contribution: 781.05,
    min_insurable_earnings: 2000,
    employer_rate_multiplier: 1.4
  },
  qpip: {
    max_insurable_earnings: 91000,
    employee_rate: 0.00494,
    employer_rate: 0.00692,
    self_employed_rate: 0.00878,
    min_earnings: 2000
  },
  qpp: {
    basic_exemption: 3500,
    max_pensionable_earnings: 66600,
    max_additional_earnings: 66600, // Pas de palier additionnel en 2023
    base_rate: 0.054,
    additional_rate_first: 0.01,
    additional_rate_second: 0.01, // Même taux en 2023
    self_employed_multiplier: 2.0
  },
  fss: {
    first_threshold: 16780,
    second_threshold: 58350,
    rate: 0.01,
    base_contribution: 150,
    max_contribution: 1000
  },
  ramq: {
    max_contribution: 720.50,
    exemption_single: 18910,
    exemption_couple: 30640,
    exemption_single_one_child: 30640,
    exemption_single_multiple_children: 34545,
    exemption_couple_one_child: 34545,
    exemption_couple_multiple_children: 38150,
    first_threshold: 5000,
    base_rate_single: 0.0747,
    additional_rate_single: 0.1122,
    base_rate_couple: 0.0375,
    additional_rate_couple: 0.0562,
    base_max_single: 373.50,
    base_max_couple: 186.75,
    monthly_adjustment: 60.04
  }
} as const