import { Decimal } from 'decimal.js';

/**
 * Result of a calculation from a calculator
 */
export interface CalculationResult {
  amount: Decimal;
  details: Record<string, any>;
  warnings?: string[];
}

/**
 * Base interface for calculator configuration parameters
 */
export interface BaseCalculatorConfig {
  [key: string]: any;
}