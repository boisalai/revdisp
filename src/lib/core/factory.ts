/**
 * Factory for creating tax calculators
 */

import { BaseCalculator } from './BaseCalculator'
import { ConfigurationError } from './exceptions'

export interface CalculatorConstructor {
  new (taxYear: number): BaseCalculator
}

export class CalculatorRegistry {
  private static calculators: Map<string, CalculatorConstructor> = new Map()

  /**
   * Register a calculator class with a name
   */
  static register(name: string, calculatorClass: CalculatorConstructor): void {
    this.calculators.set(name, calculatorClass)
  }

  /**
   * Get a calculator class by name
   */
  static getCalculatorClass(name: string): CalculatorConstructor {
    const calculatorClass = this.calculators.get(name)
    if (!calculatorClass) {
      throw new ConfigurationError(`Calculator '${name}' is not registered`)
    }
    return calculatorClass
  }

  /**
   * Get list of available calculator names
   */
  static getAvailableCalculators(): string[] {
    return Array.from(this.calculators.keys())
  }
}

/**
 * Helper function to register a calculator class (alternative to decorator)
 */
export function registerCalculator(name: string, calculatorClass: CalculatorConstructor): void {
  CalculatorRegistry.register(name, calculatorClass)
}

export class CalculatorFactory {
  /**
   * Create a calculator instance by name and tax year
   */
  static async createCalculator(name: string, taxYear: number): Promise<BaseCalculator> {
    const CalculatorClass = CalculatorRegistry.getCalculatorClass(name)
    const calculator = new CalculatorClass(taxYear)
    await calculator.initialize()
    return calculator
  }

  /**
   * Create instances of all registered calculators for a tax year
   */
  static async createAllCalculators(taxYear: number): Promise<Record<string, BaseCalculator>> {
    const calculators: Record<string, BaseCalculator> = {}
    
    for (const name of CalculatorRegistry.getAvailableCalculators()) {
      calculators[name] = await this.createCalculator(name, taxYear)
    }
    
    return calculators
  }
}