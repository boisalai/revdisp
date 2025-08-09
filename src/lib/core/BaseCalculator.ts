/**
 * Abstract base class for all tax calculators
 */

import Decimal from 'decimal.js'
import { ConfigManager, TaxConfig } from '../config/ConfigManager'
import { InvalidTaxYearError, ConfigurationError } from './exceptions'

export abstract class BaseCalculator {
  protected taxYear: number
  protected config!: TaxConfig // Défini dans initialize()
  protected calculatorConfig: any

  constructor(taxYear: number) {
    if (!ConfigManager.getSupportedYears().includes(taxYear)) {
      throw new InvalidTaxYearError(
        `Tax year ${taxYear} is not supported. Supported years: ${ConfigManager.getSupportedYears().join(', ')}`
      )
    }
    
    this.taxYear = taxYear
  }

  /**
   * Initialize the calculator with configuration data
   */
  async initialize(): Promise<void> {
    this.config = await ConfigManager.loadConfig(this.taxYear)
    this.calculatorConfig = this.getCalculatorConfig()
  }

  /**
   * Return the name/key of this calculator in the config
   */
  abstract get calculatorName(): string

  /**
   * Get configuration specific to this calculator
   */
  protected getCalculatorConfig(): any {
    const configKey = this.calculatorName
    if (!(configKey in this.config)) {
      throw new ConfigurationError(
        `Configuration for '${configKey}' not found in ${this.taxYear} config`
      )
    }
    return (this.config as any)[configKey]
  }

  /**
   * Perform the calculation. Must be implemented by subclasses.
   */
  abstract calculate(...args: any[]): Record<string, Decimal>

  /**
   * Convert and quantize value to 2 decimal places (cents)
   */
  protected quantize(value: Decimal | number | string): Decimal {
    return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  }

  /**
   * Get a configuration value with optional default
   */
  protected getConfigValue(key: string, defaultValue?: any): any {
    try {
      const keys = key.split('.')
      let value = this.calculatorConfig
      
      for (const k of keys) {
        value = value[k]
        if (value === undefined) {
          break
        }
      }
      
      if (value !== undefined) {
        return value
      }
      
      if (defaultValue !== undefined) {
        return defaultValue
      }
      
      throw new Error(`Key not found: ${key}`)
    } catch (error) {
      throw new ConfigurationError(
        `Configuration key '${key}' not found for ${this.calculatorName}`
      )
    }
  }

  /**
   * Safely convert any value to Decimal
   */
  protected toDecimal(value: any): Decimal {
    if (value instanceof Decimal) {
      return value
    }
    return new Decimal(value || 0)
  }
}