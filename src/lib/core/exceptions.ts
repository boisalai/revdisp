/**
 * Custom exceptions for tax calculation system
 */

export class TaxCalculationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TaxCalculationError'
  }
}

export class InvalidTaxYearError extends TaxCalculationError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTaxYearError'
  }
}

export class InvalidHouseholdError extends TaxCalculationError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidHouseholdError'
  }
}

export class ConfigurationError extends TaxCalculationError {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class CalculationError extends TaxCalculationError {
  constructor(message: string) {
    super(message)
    this.name = 'CalculationError'
  }
}