/**
 * Export all calculators and ensure they are registered
 */

// Import all calculators to trigger registration
import { QppCalculator } from './QppCalculator'
import { EmploymentInsuranceCalculator } from './EmploymentInsuranceCalculator'
import { RqapCalculator } from './RqapCalculator'
import { FssCalculator } from './FssCalculator'
import { QcTaxCalculator } from './QcTaxCalculator'
import { RamqCalculator } from './RamqCalculator'
import { MarginalRateCalculator } from './MarginalRateCalculator'

// Export them
export { QppCalculator, EmploymentInsuranceCalculator, RqapCalculator, FssCalculator, QcTaxCalculator, RamqCalculator, MarginalRateCalculator }