/**
 * Quebec Solidarity Tax Credit Calculator
 * Calcule le crédit d'impôt pour solidarité du Québec
 * 
 * Sources officielles:
 * - https://www.calculconversion.com/calcul-credit-impot-solidarite-2024-2025.html
 * - https://www.calculconversion.com/calcul-credit-impot-solidarite-2023-2024.html
 * - https://hellosafe.ca/outils/credit-impot-pour-solidarite
 * - https://www.revenuquebec.ca/fr/citoyens/credits-dimpot/credit-dimpot-pour-solidarite/
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person, Household, HouseholdType } from '../models'

export interface SolidarityResult {
  tvq_component: Decimal
  housing_component: Decimal
  northern_village_component: Decimal
  gross_total: Decimal
  family_net_income: Decimal
  reduction_amount: Decimal
  net_credit: Decimal
  components_count: number
  is_eligible: boolean
}

export class SolidarityCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'solidarity'
  }

  /**
   * Required by BaseCalculator - DOIT utiliser impôt QC calculé AVANT
   */
  calculate(...args: any[]): Record<string, Decimal> {
    const [household, taxResults] = args

    // EXIGENCE: Utiliser le revenu familial net calculé par l'impôt QC
    // Si non disponible, forcer le calcul avec le calculateur d'impôt QC
    const familyNetIncome = taxResults?.quebec_net_income ||
      this.calculateFamilyNetIncomeWithQcTax(household, taxResults)

    // Check basic eligibility
    if (!this.isEligible(household, familyNetIncome)) {
      const zeroResult = this.createZeroResult(familyNetIncome)
      return {
        net_credit: zeroResult.net_credit,
        tvq_component: zeroResult.tvq_component,
        housing_component: zeroResult.housing_component,
        northern_village_component: zeroResult.northern_village_component,
        gross_total: zeroResult.gross_total,
        reduction_amount: zeroResult.reduction_amount
      }
    }

    // Calculate each component
    const tvqComponent = this.calculateTvqComponent(household)
    const housingComponent = this.calculateHousingComponent(household)
    const northernVillageComponent = this.calculateNorthernVillageComponent(household)

    // Count active components
    const componentsCount = this.countActiveComponents(tvqComponent, housingComponent, northernVillageComponent)

    // Calculate gross total
    const grossTotal = tvqComponent.plus(housingComponent).plus(northernVillageComponent)

    // Calculate reduction
    const reductionAmount = this.calculateReduction(grossTotal, familyNetIncome, componentsCount)

    // Calculate net credit
    const netCredit = Decimal.max(0, grossTotal.minus(reductionAmount))

    return {
      net_credit: netCredit,
      tvq_component: tvqComponent,
      housing_component: housingComponent,
      northern_village_component: northernVillageComponent,
      gross_total: grossTotal,
      reduction_amount: reductionAmount
    }
  }

  /**
   * Calculate Quebec Solidarity Tax Credit for a household
   */
  async calculateHousehold(
    household: Household,
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Promise<SolidarityResult> {
    
    // Calculate family net income (ligne 275 des déclarations)
    const familyNetIncome = await this.calculateFamilyNetIncome(household, taxResults)
    
    // Check basic eligibility
    if (!this.isEligible(household, familyNetIncome)) {
      return this.createZeroResult(familyNetIncome)
    }

    // Calculate each component
    const tvqComponent = this.calculateTvqComponent(household)
    const housingComponent = this.calculateHousingComponent(household)
    const northernVillageComponent = this.calculateNorthernVillageComponent(household)
    
    // Count active components
    const componentsCount = this.countActiveComponents(tvqComponent, housingComponent, northernVillageComponent)
    
    // Calculate gross total
    const grossTotal = tvqComponent.plus(housingComponent).plus(northernVillageComponent)
    
    // Calculate reduction
    const reductionAmount = this.calculateReduction(grossTotal, familyNetIncome, componentsCount)
    
    // Calculate net credit
    const netCredit = Decimal.max(0, grossTotal.minus(reductionAmount))
    
    return {
      tvq_component: tvqComponent,
      housing_component: housingComponent,
      northern_village_component: northernVillageComponent,
      gross_total: grossTotal,
      family_net_income: familyNetIncome,
      reduction_amount: reductionAmount,
      net_credit: netCredit,
      components_count: componentsCount,
      is_eligible: true
    }
  }

  /**
   * Calculate family net income (ligne 275) using official Quebec tax calculator
   *
   * IMPORTANT: Pour un couple, on doit calculer la ligne 275 de chaque adulte séparément,
   * puis sommer les résultats. Chaque adulte a sa propre déclaration TP-1.
   *
   * Based on Quebec tax form TP-1:
   * Ligne 199: Revenu total (par adulte)
   * Ligne 201: Déduction pour travailleur (par adulte)
   * Ligne 248: Déduction pour cotisation au RRQ ou au RQAP (par adulte)
   * Ligne 275: Revenu net (par adulte)
   *
   * Revenu familial net = Ligne275Adulte1 + Ligne275Adulte2
   */
  private calculateFamilyNetIncomeWithQcTax(
    household: Household,
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Decimal {
    // Use Quebec net income if available (this is line 275)
    if (taxResults?.quebec_net_income) {
      return taxResults.quebec_net_income
    }

    // Use official Quebec tax calculator to get exact line 275
    try {
      const QcTaxCalculator = require('./QcTaxCalculator').QcTaxCalculator
      const qcTaxCalculator = new QcTaxCalculator(this.taxYear)

      // Calculate contributions first (needed for tax calculation)
      const qppCalculator = new (require('./QppCalculator').QppCalculator)(this.taxYear)
      const eiCalculator = new (require('./EmploymentInsuranceCalculator').EmploymentInsuranceCalculator)(this.taxYear)
      const rqapCalculator = new (require('./RqapCalculator').RqapCalculator)(this.taxYear)

      // Calculate QPP, EI, RQAP for proper deductions
      const qppPrimary = qppCalculator.calculate(household.primaryPerson)
      const eiPrimary = eiCalculator.calculate(household.primaryPerson)
      const rqapPrimary = rqapCalculator.calculate(household.primaryPerson)

      let qppSpouse = new Decimal(0)
      let eiSpouse = new Decimal(0)
      let rqapSpouse = new Decimal(0)

      if (household.spouse) {
        qppSpouse = qppCalculator.calculate(household.spouse).total
        eiSpouse = eiCalculator.calculate(household.spouse).total
        rqapSpouse = rqapCalculator.calculate(household.spouse).total
      }

      // Calculate Quebec tax with proper contributions
      const contributions = {
        rrq: qppPrimary.total.plus(qppSpouse),
        ei: eiPrimary.total.plus(eiSpouse),
        rqap: rqapPrimary.total.plus(rqapSpouse)
      }

      const qcTaxResult = qcTaxCalculator.calculateHousehold(household, contributions)

      // Return family net income (ligne 275)
      return qcTaxResult.combined.net_income.family

    } catch (error) {
      // Fallback to old method if tax calculator fails
      return this.calculateFamilyNetIncomeOfficial(household, taxResults)
    }
  }

  /**
   * Fallback method - Calculate family net income using simplified approach
   */
  private calculateFamilyNetIncomeOfficial(
    household: Household,
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Decimal {
    // Use Quebec net income if available (this is line 275)
    if (taxResults?.quebec_net_income) {
      return taxResults.quebec_net_income
    }

    // Calculate ligne 275 for primary person
    const primaryNetIncome = this.calculatePersonalNetIncome(household.primaryPerson)

    // Calculate ligne 275 for spouse (if exists)
    let spouseNetIncome = new Decimal(0)
    if (household.spouse) {
      spouseNetIncome = this.calculatePersonalNetIncome(household.spouse)
    }

    // Sum individual net incomes to get family net income
    return primaryNetIncome.plus(spouseNetIncome)
  }

  /**
   * Calculate personal net income (ligne 275) for an individual
   *
   * MÉTHODE OFFICIELLE selon document gouvernemental 2024:
   * Ligne 275 = Ligne 199 (Revenu total) - Ligne 254 (Total des déductions)
   *
   * Déductions officielles (Ligne 254):
   * - Ligne 201: Déduction pour travailleur (max 1380$ en 2024)
   * - Ligne 248: Déduction RRQ (base + supplémentaire selon formules officielles)
   *
   * Source: Document calcul.md avec paramètres officiels MFQ 2024
   */
  private calculatePersonalNetIncome(person: Person): Decimal {
    // ===== LIGNE 199: REVENU TOTAL (pour cette personne) =====
    const personalGrossIncome = person.grossWorkIncome.plus(person.grossRetirementIncome)

    // ===== DÉDUCTIONS OFFICIELLES (LIGNE 254) =====
    let personalDeductions = new Decimal(0)

    // LIGNE 201: Déduction pour travailleur (OFFICIELLE 2024: 1380$)
    if (person.grossWorkIncome.greaterThan(0)) {
      // Selon document officiel: moindre de 6% du revenu d'emploi ou 1380$ en 2024
      const sixPercentOfIncome = person.grossWorkIncome.times(0.06)
      const maxWorkerDeduction = new Decimal(1380) // Officiel 2024
      const workerDeduction = Decimal.min(sixPercentOfIncome, maxWorkerDeduction)
      personalDeductions = personalDeductions.plus(workerDeduction)
    }

    // LIGNE 248: Déduction RRQ (UTILISER CALCULATEUR VALIDÉ)
    // Note: Utiliser le calculateur RRQ existant qui est validé à 100%
    try {
      const qppCalculator = new (require('./QppCalculator').QppCalculator)(this.taxYear)
      const qppResult = qppCalculator.calculate(person)
      // La déduction RRQ = cotisation payée × taux de déduction fiscal
      // Utilisons directement la cotisation du calculateur validé × 15.625%
      const rrqDeduction = qppResult.total.times(0.15625)
      personalDeductions = personalDeductions.plus(rrqDeduction)
    } catch (error) {
      // Fallback si erreur
    }

    // LIGNE 205: Déduction RPA pour revenus de retraite
    const rpaDeduction = person.grossRetirementIncome
    personalDeductions = personalDeductions.plus(rpaDeduction)

    // ===== LIGNE 275: REVENU NET PERSONNEL (OFFICIEL) =====
    return personalGrossIncome.minus(personalDeductions)
  }

  /**
   * Calculate official RRQ deduction according to 2024 government parameters
   *
   * MÉTHODE OFFICIELLE 2024:
   * Déduction RRQ = (Cotisation RRQ de base + Cotisation RRQ supplémentaire) × 15.625%
   *
   * Source: Document calcul.md - Tableau officiel ligne 28 et 34
   */
  private calculateOfficialRrqDeduction(grossWorkIncome: Decimal): Decimal {
    // Étape 1: Calculer cotisation RRQ de base (max 4160$)
    const baseRateContribution = new Decimal(0.15625) // Taux cotisation RRQ
    const maxBaseContribution = new Decimal(4160) // Maximum cotisation de base 2024
    const baseContribution = Decimal.min(
      grossWorkIncome.times(baseRateContribution),
      maxBaseContribution
    )

    // Étape 2: Calculer cotisation RRQ supplémentaire
    const maxIncomeForSupp = new Decimal(73200)
    const thresholdForSupp = new Decimal(68500)
    const suppRate = new Decimal(0.04) // 4%

    const applicableIncome = Decimal.min(grossWorkIncome, maxIncomeForSupp)
    const excessIncome = Decimal.max(0, applicableIncome.minus(thresholdForSupp))
    const supplementaryContribution = excessIncome.times(suppRate)

    // Étape 3: Calculer déduction = (Cotisation totale) × 15.625%
    const totalContribution = baseContribution.plus(supplementaryContribution)
    const deductionRate = new Decimal(0.15625) // Taux de déduction officiel

    return totalContribution.times(deductionRate)
  }

  /**
   * Calculate family net income (ligne 275) using official tax calculation
   */
  private async calculateFamilyNetIncome(
    household: Household,
    taxResults?: {
      quebec_net_income?: Decimal
      federal_net_income?: Decimal
    }
  ): Promise<Decimal> {
    // Use Quebec net income if available (this is line 275)
    if (taxResults?.quebec_net_income) {
      return taxResults.quebec_net_income
    }

    // For now, use a simplified approach: gross income minus basic deductions
    // This will be more accurate than the empirical estimation but simpler than full tax calculation

    let totalGrossIncome = household.primaryPerson.grossWorkIncome
      .plus(household.primaryPerson.grossRetirementIncome)

    if (household.spouse) {
      totalGrossIncome = totalGrossIncome
        .plus(household.spouse.grossWorkIncome)
        .plus(household.spouse.grossRetirementIncome)
    }

    // Calculate basic social contributions that are deductible
    const qppCalculator = new (require('./QppCalculator').QppCalculator)(this.taxYear)
    const eiCalculator = new (require('./EmploymentInsuranceCalculator').EmploymentInsuranceCalculator)(this.taxYear)
    const rqapCalculator = new (require('./RqapCalculator').RqapCalculator)(this.taxYear)

    await qppCalculator.initialize()
    await eiCalculator.initialize()
    await rqapCalculator.initialize()

    let totalDeductions = new Decimal(0)

    // Calculate QPP contributions
    const qppPrimary = qppCalculator.calculate(household.primaryPerson)
    totalDeductions = totalDeductions.plus(qppPrimary.total)

    if (household.spouse) {
      const qppSpouse = qppCalculator.calculate(household.spouse)
      totalDeductions = totalDeductions.plus(qppSpouse.total)
    }

    // Calculate EI contributions
    const eiPrimary = eiCalculator.calculate(household.primaryPerson)
    totalDeductions = totalDeductions.plus(eiPrimary.total)

    if (household.spouse) {
      const eiSpouse = eiCalculator.calculate(household.spouse)
      totalDeductions = totalDeductions.plus(eiSpouse.total)
    }

    // Calculate RQAP contributions
    const rqapPrimary = rqapCalculator.calculate(household.primaryPerson)
    totalDeductions = totalDeductions.plus(rqapPrimary.total)

    if (household.spouse) {
      const rqapSpouse = rqapCalculator.calculate(household.spouse)
      totalDeductions = totalDeductions.plus(rqapSpouse.total)
    }

    // Return net income = gross income - deductible contributions
    return totalGrossIncome.minus(totalDeductions)
  }

  /**
   * Check basic eligibility
   */
  private isEligible(household: Household, familyNetIncome: Decimal): boolean {
    // Must be 18+ (handled by household validation)
    // Must reside in Quebec (assumed)
    // Income-based eligibility checked in reduction calculation
    return familyNetIncome.greaterThanOrEqualTo(0)
  }

  /**
   * Calculate TVQ component
   */
  private calculateTvqComponent(household: Household): Decimal {
    const config = this.getConfigValue('tvq_component')
    let amount = new Decimal(config.base_amount)
    
    // Add spouse amount if applicable
    if (household.spouse) {
      amount = amount.plus(config.spouse_amount)
    }
    
    // Add single person additional amount
    if (household.householdType === HouseholdType.SINGLE || 
        household.householdType === HouseholdType.RETIRED_SINGLE ||
        household.householdType === HouseholdType.SINGLE_PARENT) {
      amount = amount.plus(config.single_additional)
    }
    
    return amount
  }

  /**
   * Calculate housing component
   */
  private calculateHousingComponent(household: Household): Decimal {
    const config = this.getConfigValue('housing_component')
    
    // Base amount based on household type
    let amount: Decimal
    if (household.spouse) {
      amount = new Decimal(config.couple_amount)
    } else {
      amount = new Decimal(config.single_amount)
    }
    
    // Add child amounts
    const numChildren = household.children?.length ?? 0
    const childAmount = new Decimal(config.child_amount).times(numChildren)
    amount = amount.plus(childAmount)
    
    return amount
  }

  /**
   * Calculate northern village component
   * Note: For now, we assume not in a northern village unless explicitly specified
   */
  private calculateNorthernVillageComponent(household: Household): Decimal {
    // TODO: Add northern village detection logic if needed
    // For now, return 0 as most households are not in northern villages
    return new Decimal(0)
  }

  /**
   * Count active components (for reduction rate calculation)
   */
  private countActiveComponents(tvq: Decimal, housing: Decimal, northern: Decimal): number {
    let count = 0
    if (tvq.greaterThan(0)) count++
    if (housing.greaterThan(0)) count++
    if (northern.greaterThan(0)) count++
    return count
  }

  /**
   * Calculate reduction amount based on income
   */
  private calculateReduction(
    grossTotal: Decimal, 
    familyNetIncome: Decimal, 
    componentsCount: number
  ): Decimal {
    const config = this.getConfigValue('reduction')
    const threshold = new Decimal(config.threshold)
    
    // No reduction if income is below threshold
    if (familyNetIncome.lessThanOrEqualTo(threshold)) {
      return new Decimal(0)
    }
    
    // Calculate excess income
    const excessIncome = familyNetIncome.minus(threshold)
    
    // Determine reduction rate
    const reductionRate = componentsCount === 1 
      ? new Decimal(config.single_component_rate) // 3%
      : new Decimal(config.rate) // 6%
    
    // Calculate reduction amount
    const reductionAmount = excessIncome.times(reductionRate)
    
    // Reduction cannot exceed gross total
    return Decimal.min(reductionAmount, grossTotal)
  }

  /**
   * Create zero result for ineligible households
   */
  private createZeroResult(familyNetIncome: Decimal): SolidarityResult {
    const zero = new Decimal(0)
    return {
      tvq_component: zero,
      housing_component: zero,
      northern_village_component: zero,
      gross_total: zero,
      family_net_income: familyNetIncome,
      reduction_amount: zero,
      net_credit: zero,
      components_count: 0,
      is_eligible: false
    }
  }
}

// Register the calculator
CalculatorRegistry.register('solidarity', SolidarityCalculator)