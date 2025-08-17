/**
 * Export all calculators and ensure they are registered
 */

// Import all calculators to trigger registration
import { QppCalculator } from './QppCalculator'
import { EmploymentInsuranceCalculator } from './EmploymentInsuranceCalculator'
import { RqapCalculator } from './RqapCalculator'
import { FssCalculator } from './FssCalculator'
import { QcTaxCalculator } from './QcTaxCalculator'
import { FederalTaxCalculator } from './FederalTaxCalculator'
import { RamqCalculator } from './RamqCalculator'
import { SolidarityCalculator } from './SolidarityCalculator'
import { WorkPremiumCalculator } from './WorkPremiumCalculator'
import { FamilyAllowanceCalculator } from './FamilyAllowanceCalculator'
import { CanadaChildBenefitCalculator } from './CanadaChildBenefitCalculator'
import { GstCreditCalculator } from './GstCreditCalculator'
import { CanadaWorkersBenefitCalculator } from './CanadaWorkersBenefitCalculator'
import { MarginalRateCalculator } from './MarginalRateCalculator'

// Export them
export { QppCalculator, EmploymentInsuranceCalculator, RqapCalculator, FssCalculator, QcTaxCalculator, FederalTaxCalculator, RamqCalculator, SolidarityCalculator, WorkPremiumCalculator, FamilyAllowanceCalculator, CanadaChildBenefitCalculator, GstCreditCalculator, CanadaWorkersBenefitCalculator, MarginalRateCalculator }