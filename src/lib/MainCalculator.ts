/**
 * Main calculator that coordinates all tax calculations
 */

import Decimal from 'decimal.js'
import { CalculatorFactory } from './core/factory'
import { Household } from './models'
import { InvalidTaxYearError } from './core/exceptions'
import { BaseCalculator } from './core/BaseCalculator'

// Import calculators to ensure registration
import './calculators'

export interface CalculationResults {
  cotisations: {
    rrq?: Decimal
    assurance_emploi?: Decimal
    rqap?: Decimal
    fss?: Decimal
    ramq?: Decimal
    total?: Decimal
  }
  taxes: {
    quebec?: Decimal
    canada?: Decimal
    total?: Decimal
  }
  quebec: Record<string, any>
  canada: Record<string, any>
  revenu_disponible: Decimal
}

export class RevenuDisponibleCalculator {
  private taxYear: number
  private calculators: Record<string, BaseCalculator> = {}

  constructor(taxYear: number = 2024) {
    this.taxYear = taxYear
  }

  /**
   * Initialize all calculators
   */
  async initialize(): Promise<void> {
    try {
      // Create the calculators we currently have implemented
      const calculatorTypes = ['qpp', 'employment_insurance', 'qpip', 'fss', 'quebec_tax', 'federal_tax', 'ramq', 'solidarity', 'work_premium', 'family_allowance', 'school_supplies_supplement', 'canada_child_benefit', 'gst_credit', 'canada_workers', 'old_age_security', 'medical_expense_supplement_federal', 'medical_expense_supplement_quebec', 'social_assistance', 'childcare_tax_credit', 'housing_allowance']
      
      for (const type of calculatorTypes) {
        try {
          this.calculators[type] = await CalculatorFactory.createCalculator(type, this.taxYear)
        } catch (error) {
          console.warn(`Failed to create calculator ${type}:`, error)
        }
      }
    } catch (error) {
      throw new InvalidTaxYearError(`Failed to initialize calculators for year ${this.taxYear}: ${error}`)
    }
  }

  /**
   * Calculate all tax components for a household
   */
  async calculate(household: Household): Promise<CalculationResults> {
    // Always reinitialize calculators to ensure fresh config for the tax year
    // This is necessary because config can change between years
    await this.initialize()

    const results: CalculationResults = {
      cotisations: {},
      taxes: {},
      quebec: {},
      canada: {},
      revenu_disponible: new Decimal(0)
    }

    // 1. Calculate basic contributions
    
    // RRQ/QPP (if available)
    if (this.calculators.qpp) {
      const qppPrimary = this.calculators.qpp.calculate(household.primaryPerson)
      results.cotisations.rrq = qppPrimary.total

      if (household.spouse) {
        const qppSpouse = this.calculators.qpp.calculate(household.spouse)
        results.cotisations.rrq = results.cotisations.rrq.plus(qppSpouse.total)
      }
    }

    // Employment Insurance (if available)
    if (this.calculators.employment_insurance) {
      const eiPrimary = this.calculators.employment_insurance.calculate(household.primaryPerson)
      results.cotisations.assurance_emploi = eiPrimary.employee

      if (household.spouse) {
        const eiSpouse = this.calculators.employment_insurance.calculate(household.spouse)
        results.cotisations.assurance_emploi = results.cotisations.assurance_emploi.plus(eiSpouse.employee)
      }
    }

    // RQAP (if available)
    if (this.calculators.qpip) {
      const rqapPrimary = this.calculators.qpip.calculate(household.primaryPerson)
      results.cotisations.rqap = rqapPrimary.employee

      if (household.spouse) {
        const rqapSpouse = this.calculators.qpip.calculate(household.spouse)
        results.cotisations.rqap = results.cotisations.rqap.plus(rqapSpouse.employee)
      }
    }

    // FSS (if available)
    if (this.calculators.fss) {
      const fssPrimary = this.calculators.fss.calculate(household.primaryPerson)
      results.cotisations.fss = fssPrimary.total

      if (household.spouse) {
        const fssSpouse = this.calculators.fss.calculate(household.spouse)
        results.cotisations.fss = results.cotisations.fss.plus(fssSpouse.total)
      }
    }

    // 2. Calculate Quebec income tax (using social contributions for deductions)
    if (this.calculators.quebec_tax) {
      const qcTaxCalculator = this.calculators.quebec_tax as any
      if (qcTaxCalculator.calculateHousehold) {
        const contributions = {
          rrq: results.cotisations.rrq,
          ei: results.cotisations.assurance_emploi,  
          rqap: results.cotisations.rqap
        }
        const qcTaxResult = qcTaxCalculator.calculateHousehold(household, contributions)
        results.taxes.quebec = qcTaxResult.combined.net_tax

        // Store for RAMQ calculation
        results.quebec.net_income = qcTaxResult.combined.net_income
      }
    }

    // 3. Calculate Federal income tax (using social contributions for deductions)
    if (this.calculators.federal_tax) {
      const federalTaxCalculator = this.calculators.federal_tax as any
      if (federalTaxCalculator.calculateHousehold) {
        const contributions = {
          rrq: results.cotisations.rrq,
          ei: results.cotisations.assurance_emploi,  
          rqap: results.cotisations.rqap
        }
        const federalTaxResult = federalTaxCalculator.calculateHousehold(household, contributions)
        results.taxes.canada = federalTaxResult.combined.net_tax
        
        // Store federal net income for future use
        results.canada.net_income = federalTaxResult.combined.net_income
      }
    }

    // 4. Calculate RAMQ (using net family income from Quebec tax if available)
    if (this.calculators.ramq) {
      let familyNetIncome: Decimal

      // Use Quebec tax net income if available, otherwise estimate from gross income
      if (results.quebec.net_income && results.quebec.net_income.family) {
        familyNetIncome = results.quebec.net_income.family
      } else {
        // Calculate approximate net income from gross (estimating standard deductions)
        const primaryGrossIncome = household.primaryPerson.isRetired
          ? household.primaryPerson.grossRetirementIncome
          : household.primaryPerson.grossWorkIncome

        let totalGrossIncome = primaryGrossIncome
        if (household.spouse) {
          const spouseIncome = household.spouse.isRetired
            ? household.spouse.grossRetirementIncome
            : household.spouse.grossWorkIncome
          totalGrossIncome = totalGrossIncome.plus(spouseIncome)
        }

        // Estimate net income using standard deductions (RRQ, AE, RQAP, employment deduction)
        // This is an approximation for cases where Quebec tax calculation is not available
        const estimatedDeductions = totalGrossIncome.times(0.08) // ~8% for typical deductions
        familyNetIncome = totalGrossIncome.minus(estimatedDeductions)
      }

      const ramqResult = (this.calculators.ramq as any).calculate(household, {
        net_income: {
          family: familyNetIncome
        }
      })
      results.cotisations.ramq = ramqResult.contribution
    }

    // Calculate total contributions
    results.cotisations.total = Object.values(results.cotisations)
      .filter((value): value is Decimal => value instanceof Decimal)
      .reduce((sum, value) => sum.plus(value), new Decimal(0))

    // Calculate total taxes
    results.taxes.total = Object.values(results.taxes)
      .filter((value): value is Decimal => value instanceof Decimal)
      .reduce((sum, value) => sum.plus(value), new Decimal(0))

    // 5. Calculate Quebec transfers and credits (AFTER Quebec income tax)
    // RÈGLE FONDAMENTALE: Tous les programmes QC qui utilisent le revenu familial net
    // doivent être calculés APRÈS l'impôt sur le revenu des particuliers du Québec
    let totalTransfers = new Decimal(0)
    
    // Solidarity tax credit (utilise revenu familial net - ligne 275)
    if (this.calculators.solidarity) {
      const solidarityResult = await (this.calculators.solidarity as any).calculateHousehold(household, {
        quebec_net_income: results.quebec.net_income?.family || results.quebec.net_income?.individual || new Decimal(0),
        federal_net_income: results.canada.net_income?.family || results.canada.net_income?.individual || new Decimal(0)
      })
      
      // Store detailed result
      results.quebec.solidarity = solidarityResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(solidarityResult.net_credit)
    }

    // Work premium (utilise revenu familial net - ligne 275)
    if (this.calculators.work_premium) {
      const workPremiumResult = await (this.calculators.work_premium as any).calculateHousehold(household, {
        quebec_net_income: results.quebec.net_income?.family || results.quebec.net_income?.individual || new Decimal(0),
        federal_net_income: results.canada.net_income?.family || results.canada.net_income?.individual || new Decimal(0)
      })
      
      // Store detailed result
      results.quebec.work_premium = workPremiumResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(workPremiumResult.net_premium)
    }

    // Family Allowance (Allocation famille)
    if (this.calculators.family_allowance) {
      const familyAllowanceResult = (this.calculators.family_allowance as any).calculateDetailed(household, {
        quebec_net_income: results.quebec.net_income?.family || new Decimal(0),
        federal_net_income: results.canada.net_income?.family || new Decimal(0)
      })
      
      // Store detailed result
      results.quebec.family_allowance = familyAllowanceResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(familyAllowanceResult.net_allowance)
    }

    // School Supplies Supplement (Supplément pour fournitures scolaires)
    if (this.calculators.school_supplies_supplement) {
      const schoolSuppliesResult = (this.calculators.school_supplies_supplement as any).calculateDetailed(household)
      
      // Store detailed result
      results.quebec.school_supplies_supplement = schoolSuppliesResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(schoolSuppliesResult.total_amount)
    }

    // Senior Support Tax Credit (Crédit d'impôt pour le soutien aux aînés) - TEMPORAIREMENT DÉSACTIVÉ
    // if (this.calculators.senior_support) {
    //   const seniorSupportResult = (this.calculators.senior_support as any).calculateDetailed(household)
    //   
    //   // Store detailed result
    //   results.quebec.senior_support = seniorSupportResult
      
    //   // Add to total transfers (this is a refundable tax credit)
    //   totalTransfers = totalTransfers.plus(seniorSupportResult.total_credit)
    // }

    // Childcare Tax Credit (Crédit d'impôt pour frais de garde d'enfants)
    if (this.calculators.childcare_tax_credit && household.children.length > 0) {
      // Calculate family net income (Quebec)
      const familyNetIncome = (results.quebec.net_income?.family || results.quebec.net_income?.individual || new Decimal(0)).toNumber()
      
      // Prepare input for childcare tax credit
      const childcareInput = {
        family_net_income: familyNetIncome,
        children: household.children.map(child => ({
          age: child.age,
          has_disability: false, // TODO: Add disability flag to ChildData model
          childcare_expenses: child.childcareExpenses || 0
        }))
      }

      const childcareCreditResult = (this.calculators.childcare_tax_credit as any).calculateChildcareTaxCredit(childcareInput)
      
      // Store detailed result
      results.quebec.childcare_tax_credit = {
        eligible_children: new Decimal(childcareCreditResult.eligible_children),
        total_eligible_expenses: new Decimal(childcareCreditResult.total_eligible_expenses),
        credit_rate: new Decimal(childcareCreditResult.credit_rate),
        gross_credit: new Decimal(childcareCreditResult.gross_credit),
        net_credit: new Decimal(childcareCreditResult.net_credit),
        breakdown: childcareCreditResult.breakdown
      }
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(childcareCreditResult.net_credit)
    }

    // Social Assistance (Aide sociale)
    if (this.calculators.social_assistance) {
      // Create input for social assistance calculation
      const socialAssistanceInput = {
        household_type: household.isCouple ? 'couple' : household.children.length > 0 ? 'single_parent' : 'single',
        age: household.primaryPerson.age,
        partner_age: household.spouse?.age,
        employment_constraint: household.socialAssistance?.employmentConstraint || 'none',
        partner_employment_constraint: household.socialAssistance?.partnerEmploymentConstraint || 'none',
        work_income: household.primaryPerson.grossWorkIncome.toNumber(),
        partner_work_income: household.spouse?.grossWorkIncome.toNumber() || 0,
        liquid_assets: household.socialAssistance?.liquidAssets || 0,
        first_time_applicant: household.socialAssistance?.firstTimeApplicant || false,
        living_with_parents: household.socialAssistance?.livingWithParents || false,
        children_count: household.children.length,
        year: this.taxYear
      }

      const socialAssistanceResult = (this.calculators.social_assistance as any).calculateSocialAssistance(socialAssistanceInput)
      
      // Convert to Decimal and store detailed result
      results.quebec.social_assistance = {
        base_benefit: new Decimal(socialAssistanceResult.base_benefit),
        adjustment_benefit: new Decimal(socialAssistanceResult.adjustment_benefit),
        constraint_allocation: new Decimal(socialAssistanceResult.constraint_allocation),
        single_adjustment: new Decimal(socialAssistanceResult.single_adjustment),
        total_work_income: new Decimal(socialAssistanceResult.total_work_income),
        work_income_exemption: new Decimal(socialAssistanceResult.work_income_exemption),
        work_income_supplement: new Decimal(socialAssistanceResult.work_income_supplement),
        income_reduction: new Decimal(socialAssistanceResult.income_reduction),
        gross_benefit: new Decimal(socialAssistanceResult.gross_benefit),
        net_benefit: new Decimal(socialAssistanceResult.net_benefit),
        eligible: new Decimal(socialAssistanceResult.eligible ? 1 : 0),
        program: socialAssistanceResult.program,
        ineligibility_reason: socialAssistanceResult.ineligibility_reason,
        calculation_details: socialAssistanceResult.calculation_details
      }
      
      // Add to total transfers if eligible
      if (socialAssistanceResult.eligible) {
        totalTransfers = totalTransfers.plus(socialAssistanceResult.net_benefit)
      }
    }

    // Canada Child Benefit (ACE)
    if (this.calculators.canada_child_benefit) {
      const ccbResult = (this.calculators.canada_child_benefit as any).calculateDetailed(household, {
        federal_net_income: results.canada.net_income?.individual || results.canada.net_income || new Decimal(0)
      })
      
      // Store detailed result
      results.canada.child_benefit = ccbResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(ccbResult.net_benefit)
    }

    // GST Credit
    if (this.calculators.gst_credit) {
      const gstCreditResult = this.calculators.gst_credit.calculate(household.primaryPerson, household)
      
      // Store detailed result
      results.canada.gst_credit = gstCreditResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(gstCreditResult.amount)
    }

    // Canada Workers Benefit (ACT)
    if (this.calculators.canada_workers) {
      const canadaWorkersResult = this.calculators.canada_workers.calculate(household.primaryPerson, household)
      
      // Store detailed result
      results.canada.workers_benefit = canadaWorkersResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(canadaWorkersResult.amount)
    }

    // Old Age Security (PSV)
    if (this.calculators.old_age_security) {
      // Calculate for primary person
      const oasPrimaryResult = this.calculators.old_age_security.calculate(household.primaryPerson, household)
      let totalOasAmount = oasPrimaryResult.amount
      
      // Calculate for spouse if applicable
      let oasSpouseResult = null
      if (household.spouse) {
        oasSpouseResult = this.calculators.old_age_security.calculate(household.spouse, household)
        totalOasAmount = totalOasAmount.plus(oasSpouseResult.amount)
      }
      
      // Store detailed result
      results.canada.old_age_security = {
        primary: oasPrimaryResult,
        spouse: oasSpouseResult,
        total_amount: totalOasAmount
      }
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(totalOasAmount)
    }

    // Federal Medical Expense Supplement
    if (this.calculators.medical_expense_supplement_federal) {
      const federalMedicalResult = this.calculators.medical_expense_supplement_federal.calculate(household.primaryPerson, household, {
        federal_net_income: results.canada.net_income
      })
      
      // Store detailed result
      results.canada.medical_expense_supplement = federalMedicalResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(federalMedicalResult.amount)
    }

    // Quebec Medical Expense Supplement
    if (this.calculators.medical_expense_supplement_quebec) {
      const quebecMedicalResult = this.calculators.medical_expense_supplement_quebec.calculate(household.primaryPerson, household, {
        quebec_net_income: results.quebec.net_income,
        federal_net_income: results.canada.net_income
      })
      
      // Store detailed result
      results.quebec.medical_expense_supplement = quebecMedicalResult
      
      // Add to total transfers
      totalTransfers = totalTransfers.plus(quebecMedicalResult.amount)
    }

    // Housing Allowance (Allocation-logement)
    if (this.calculators.housing_allowance) {
      // Calculer le revenu familial net (Québec)
      const familyNetIncome = (results.quebec.net_income?.family || results.quebec.net_income?.individual || new Decimal(0)).toNumber()
      
      const housingAllowanceInput = {
        household_type: household.spouse ? 'couple' : (household.children.length > 0 ? 'single_parent' : 'single') as 'single' | 'couple' | 'single_parent',
        family_net_income: familyNetIncome,
        children_count: household.children.length,
        annual_housing_cost: household.annualHousingCost || 0,
        applicant_age: household.primaryPerson.age,
        spouse_age: household.spouse?.age,
        liquid_assets_value: household.liquidAssetsValue || 0
      }

      const housingAllowanceResult = (this.calculators.housing_allowance as any).calculateHousingAllowance(housingAllowanceInput)
      
      // Store detailed result
      results.quebec.housing_allowance = {
        eligible: new Decimal(housingAllowanceResult.eligible ? 1 : 0),
        housing_effort_rate: new Decimal(housingAllowanceResult.housing_effort_rate),
        monthly_allowance: new Decimal(housingAllowanceResult.monthly_allowance),
        annual_allowance: new Decimal(housingAllowanceResult.annual_allowance),
        ineligibility_reason: housingAllowanceResult.ineligibility_reason,
        calculation_details: housingAllowanceResult.calculation_details
      }
      
      // Add to total transfers if eligible
      if (housingAllowanceResult.eligible) {
        totalTransfers = totalTransfers.plus(housingAllowanceResult.annual_allowance)
      }
    }

    // Calculate disposable income
    // Gross income - contributions - taxes + transfers
    const grossIncome = this.calculateGrossIncome(household)
    const totalContributions = results.cotisations.total || new Decimal(0)
    const totalTaxes = results.taxes.total || new Decimal(0)
    
    results.revenu_disponible = grossIncome
      .minus(totalContributions)
      .minus(totalTaxes)
      .plus(totalTransfers)
    
    // Ensure disposable income is not negative
    results.revenu_disponible = Decimal.max(0, results.revenu_disponible)

    return results
  }

  /**
   * Calculate total gross income for a household
   */
  private calculateGrossIncome(household: Household): Decimal {
    let totalIncome = new Decimal(0)

    // Primary person income
    const primaryIncome = household.primaryPerson.isRetired
      ? household.primaryPerson.grossRetirementIncome
      : household.primaryPerson.grossWorkIncome
    totalIncome = totalIncome.plus(primaryIncome)

    // Spouse income (if applicable)
    if (household.spouse) {
      const spouseIncome = household.spouse.isRetired
        ? household.spouse.grossRetirementIncome
        : household.spouse.grossWorkIncome
      totalIncome = totalIncome.plus(spouseIncome)
    }

    return totalIncome
  }
}