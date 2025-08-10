/**
 * Configuration management for tax calculations
 * Utilise des imports statiques TypeScript pour une performance et sécurité optimales
 */

import Decimal from 'decimal.js'
import { TaxYearConfig } from './types'
import { getConfigForYear, isYearSupported, availableYears } from './data'

export class ConfigManager {
  private static decimalConfigs: Map<number, any> = new Map()
  
  /**
   * Load configuration for a specific tax year
   * Utilise les imports statiques pour une performance optimale
   */
  static async loadConfig(taxYear: number): Promise<TaxYearConfig> {
    // En mode développement, on peut désactiver le cache pour faciliter les tests
    const useCache = process.env.NODE_ENV === 'production'
    
    if (useCache && this.decimalConfigs.has(taxYear)) {
      return this.decimalConfigs.get(taxYear)!
    }
    
    if (!isYearSupported(taxYear)) {
      throw new Error(
        `Configuration non disponible pour l'année ${taxYear}. ` +
        `Années disponibles: ${availableYears.join(', ')}`
      )
    }
    
    try {
      // Import statique de la configuration
      const rawConfig = getConfigForYear(taxYear)
      
      // Conversion en Decimal pour la précision
      const decimalConfig = this.convertToDecimal(rawConfig) as TaxYearConfig
      
      if (useCache) {
        this.decimalConfigs.set(taxYear, decimalConfig)
      }
      return decimalConfig
    } catch (error) {
      throw new Error(`Erreur lors du chargement de la configuration ${taxYear}: ${error}`)
    }
  }
  
  /**
   * Recursively convert numeric values to Decimal for precision
   */
  private static convertToDecimal(obj: any): any {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(item => this.convertToDecimal(item))
      } else {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = this.convertToDecimal(value)
        }
        return result
      }
    } else if (typeof obj === 'number') {
      return new Decimal(obj)
    } else {
      return obj
    }
  }
  
  /**
   * Get list of supported tax years
   */
  static getSupportedYears(): number[] {
    return availableYears
  }
  
  /**
   * Check if a year is supported
   */
  static isYearSupported(year: number): boolean {
    return isYearSupported(year)
  }
  
  /**
   * Clear the configuration cache
   */
  static clearCache(): void {
    this.decimalConfigs.clear()
  }
}

// Export des types pour compatibilité
export type TaxConfig = TaxYearConfig