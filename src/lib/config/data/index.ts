import { ConfigData } from '../types'
import { config2023 } from './2023'
import { config2024 } from './2024'

/**
 * Configuration fiscale complète pour toutes les années disponibles
 * Import statique avec type safety complet
 */
export const taxConfigs: ConfigData = {
  2023: config2023,
  2024: config2024
} as const

/**
 * Années disponibles
 */
export const availableYears = Object.keys(taxConfigs).map(Number).sort((a, b) => b - a)

/**
 * Année par défaut (la plus récente)
 */
export const defaultYear = Math.max(...availableYears)

/**
 * Helper pour obtenir la configuration d'une année spécifique
 */
export function getConfigForYear(year: number) {
  const config = taxConfigs[year]
  if (!config) {
    throw new Error(`Configuration non disponible pour l'année ${year}. Années disponibles: ${availableYears.join(', ')}`)
  }
  return config
}

/**
 * Helper pour vérifier si une année est supportée
 */
export function isYearSupported(year: number): boolean {
  return year in taxConfigs
}

// Export des configurations individuelles pour usage direct
export { config2023, config2024 }