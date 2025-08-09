/**
 * Export all calculators and ensure they are registered
 */

// Import all calculators to trigger registration
import { QppCalculator } from './QppCalculator'
import { EmploymentInsuranceCalculator } from './EmploymentInsuranceCalculator'
import { RamqCalculator } from './RamqCalculator'
import { MarginalRateCalculator } from './MarginalRateCalculator'

// Export them
export { QppCalculator, EmploymentInsuranceCalculator, RamqCalculator, MarginalRateCalculator }