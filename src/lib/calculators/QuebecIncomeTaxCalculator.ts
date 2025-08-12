/**
 * Calculateur d'impôt sur le revenu du Québec
 * 
 * Implémente le calcul complet de l'impôt provincial du Québec selon les règles officielles:
 * - Paliers d'imposition progressifs 
 * - Crédits d'impôt personnels non remboursables
 * - Déductions pour cotisations sociales
 * - Réductions d'impôt selon la situation familiale
 * 
 * Sources:
 * - Revenu Québec: https://www.revenuquebec.ca/fr/citoyens/declaration-de-revenus/
 * - Guide des mesures fiscales CFFP: https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/
 */

import { BaseCalculator } from '../core/BaseCalculator'
import { Person } from '../models'
import { QuebecTaxConfig } from '../config/types'
import Decimal from 'decimal.js'

export interface QuebecTaxInputs {
  /** Personne principale */
  primaryPerson: Person
  /** Conjoint (optionnel) */
  spouse?: Person
  /** Nombre d'enfants */
  numChildren: number
  /** Cotisations déductibles calculées précédemment */
  deductibleContributions: {
    rrq: Decimal     // Cotisations RRQ/QPP
    ei: Decimal      // Cotisations assurance-emploi
    rqap: Decimal    // Cotisations RQAP
  }
  /** Revenus spéciaux (aide sociale, etc.) - pour futures implémentations */
  specialIncome?: {
    socialAssistance?: Decimal
    otherNonTaxable?: Decimal
  }
}

export interface QuebecTaxResults {
  /** Revenu total imposable */
  taxableIncome: Decimal
  /** Revenu imposable après déductions */
  netTaxableIncome: Decimal
  /** Impôt brut calculé selon les paliers */
  grossTax: Decimal
  /** Crédits d'impôt non remboursables */
  nonRefundableCredits: Decimal
  /** Impôt net à payer (après crédits) */
  netTax: Decimal
  /** Détails du calcul par paliers */
  bracketDetails: Array<{
    bracket: number
    min: number
    max: number
    rate: number
    taxableAmount: Decimal
    tax: Decimal
  }>
  /** Détails des crédits d'impôt */
  creditDetails: {
    basicCredit: Decimal
    ageCredit: Decimal
    pensionCredit: Decimal
    livingAloneCredit: Decimal
    other: Decimal
  }
  /** Déductions appliquées */
  deductionDetails: {
    rrqDeduction: Decimal
    eiDeduction: Decimal
    rqapDeduction: Decimal
    totalDeductions: Decimal
  }
}

export class QuebecIncomeTaxCalculator extends BaseCalculator {
  private taxConfig: QuebecTaxConfig

  constructor(config: QuebecTaxConfig, taxYear: number = 2024) {
    super(taxYear)
    this.taxConfig = config
  }

  get calculatorName(): string {
    return 'quebec_income_tax'
  }

  /**
   * Calcule l'impôt sur le revenu du Québec
   */
  calculate(inputs: QuebecTaxInputs): Record<string, Decimal> {
    // 1. Calculer le revenu imposable
    const taxableIncome = this.calculateTaxableIncome(inputs)
    
    // 2. Appliquer les déductions
    const netTaxableIncome = this.applyDeductions(taxableIncome, inputs)
    
    // 3. Calculer l'impôt brut selon les paliers
    const { grossTax, bracketDetails } = this.calculateGrossTax(netTaxableIncome)
    
    // 4. Calculer les crédits d'impôt non remboursables
    const { nonRefundableCredits, creditDetails } = this.calculateNonRefundableCredits(inputs)
    
    // 5. Calculer l'impôt net
    const netTax = Decimal.max(0, grossTax.minus(nonRefundableCredits))

    // Détails des déductions
    const deductionDetails = this.calculateDeductionDetails(inputs)

    return {
      taxableIncome,
      netTaxableIncome,
      grossTax,
      nonRefundableCredits,
      netTax
    }
  }

  /**
   * Calcule l'impôt sur le revenu du Québec avec tous les détails
   */
  calculateDetailed(inputs: QuebecTaxInputs): QuebecTaxResults {
    // 1. Calculer le revenu imposable
    const taxableIncome = this.calculateTaxableIncome(inputs)
    
    // 2. Appliquer les déductions
    const netTaxableIncome = this.applyDeductions(taxableIncome, inputs)
    
    // 3. Calculer l'impôt brut selon les paliers
    const { grossTax, bracketDetails } = this.calculateGrossTax(netTaxableIncome)
    
    // 4. Calculer les crédits d'impôt non remboursables
    const { nonRefundableCredits, creditDetails } = this.calculateNonRefundableCredits(inputs)
    
    // 5. Calculer l'impôt net
    const netTax = Decimal.max(0, grossTax.minus(nonRefundableCredits))

    // Détails des déductions
    const deductionDetails = this.calculateDeductionDetails(inputs)

    return {
      taxableIncome,
      netTaxableIncome,
      grossTax,
      nonRefundableCredits,
      netTax,
      bracketDetails,
      creditDetails,
      deductionDetails
    }
  }

  /**
   * Calcule le revenu imposable total
   */
  private calculateTaxableIncome(inputs: QuebecTaxInputs): Decimal {
    let totalIncome = new Decimal(0)

    // Revenus d'emploi et de retraite - personne principale
    totalIncome = totalIncome
      .plus(inputs.primaryPerson.grossWorkIncome || 0)
      .plus(inputs.primaryPerson.grossRetirementIncome || 0)

    // Revenus du conjoint
    if (inputs.spouse) {
      totalIncome = totalIncome
        .plus(inputs.spouse.grossWorkIncome || 0)
        .plus(inputs.spouse.grossRetirementIncome || 0)
    }

    // Note: Les revenus d'aide sociale ne sont généralement pas imposables au Québec
    // Cette logique sera ajoutée quand l'aide sociale sera implémentée

    return totalIncome
  }

  /**
   * Applique les déductions au revenu imposable
   */
  private applyDeductions(taxableIncome: Decimal, inputs: QuebecTaxInputs): Decimal {
    let deductions = new Decimal(0)

    // Déductions pour cotisations sociales (100% déductibles au Québec)
    const contributions = inputs.deductibleContributions
    deductions = deductions
      .plus(contributions.rrq.times(this.taxConfig.deduction_rates.cpp))
      .plus(contributions.ei.times(this.taxConfig.deduction_rates.ei))
      .plus(contributions.rqap.times(this.taxConfig.deduction_rates.qpip))

    // Autres déductions possibles à ajouter dans le futur:
    // - Cotisations syndicales
    // - Frais de garde d'enfants
    // - Frais médicaux
    // - REER
    // etc.

    return Decimal.max(0, taxableIncome.minus(deductions))
  }

  /**
   * Calcule l'impôt brut selon les paliers progressifs
   */
  private calculateGrossTax(netTaxableIncome: Decimal): {
    grossTax: Decimal
    bracketDetails: Array<{
      bracket: number
      min: number
      max: number
      rate: number
      taxableAmount: Decimal
      tax: Decimal
    }>
  } {
    let totalTax = new Decimal(0)
    let remainingIncome = netTaxableIncome
    const bracketDetails = []

    for (let i = 0; i < this.taxConfig.tax_brackets.length; i++) {
      const bracket = this.taxConfig.tax_brackets[i]
      
      if (remainingIncome.lte(0)) break
      
      // Calculer le montant imposable dans ce palier
      const bracketMin = new Decimal(bracket.min)
      const bracketMax = new Decimal(bracket.max)
      const bracketWidth = bracketMax.minus(bracketMin)
      
      // Montant imposable dans ce palier
      const taxableInBracket = Decimal.min(remainingIncome, bracketWidth)
      
      // Impôt pour ce palier
      const bracketTax = taxableInBracket.times(bracket.rate)
      
      totalTax = totalTax.plus(bracketTax)
      remainingIncome = remainingIncome.minus(taxableInBracket)
      
      bracketDetails.push({
        bracket: i + 1,
        min: bracket.min,
        max: bracket.max,
        rate: bracket.rate,
        taxableAmount: taxableInBracket,
        tax: bracketTax
      })

      // Sortir si on a atteint le palier le plus élevé
      if (bracket.max === Infinity || bracket.max >= 999999999) {
        break
      }
    }

    return {
      grossTax: totalTax,
      bracketDetails
    }
  }

  /**
   * Calcule les crédits d'impôt non remboursables
   */
  private calculateNonRefundableCredits(inputs: QuebecTaxInputs): {
    nonRefundableCredits: Decimal
    creditDetails: {
      basicCredit: Decimal
      ageCredit: Decimal
      pensionCredit: Decimal
      livingAloneCredit: Decimal
      other: Decimal
    }
  } {
    const creditRate = new Decimal(0.14) // Taux du premier palier (14%)
    
    // Crédit de base personnel - pour tous
    const basicCredit = new Decimal(this.taxConfig.credits.basic_amount).times(creditRate)
    
    // Crédit en raison de l'âge (65 ans et plus)
    let ageCredit = new Decimal(0)
    if (inputs.primaryPerson.age >= 65) {
      ageCredit = ageCredit.plus(new Decimal(this.taxConfig.credits.age_65_amount).times(creditRate))
    }
    if (inputs.spouse && inputs.spouse.age >= 65) {
      ageCredit = ageCredit.plus(new Decimal(this.taxConfig.credits.age_65_amount).times(creditRate))
    }
    
    // Crédit pour revenus de pension (retraités)
    let pensionCredit = new Decimal(0)
    if (inputs.primaryPerson.isRetired && inputs.primaryPerson.grossRetirementIncome.gt(0)) {
      const pensionAmount = Decimal.min(
        inputs.primaryPerson.grossRetirementIncome,
        this.taxConfig.credits.pension_amount
      )
      pensionCredit = pensionCredit.plus(pensionAmount.times(creditRate))
    }
    if (inputs.spouse?.isRetired && inputs.spouse.grossRetirementIncome.gt(0)) {
      const pensionAmount = Decimal.min(
        inputs.spouse.grossRetirementIncome,
        this.taxConfig.credits.pension_amount
      )
      pensionCredit = pensionCredit.plus(pensionAmount.times(creditRate))
    }
    
    // Crédit pour personne vivant seule (si applicable)
    let livingAloneCredit = new Decimal(0)
    if (!inputs.spouse) {
      livingAloneCredit = new Decimal(this.taxConfig.credits.living_alone_amount).times(creditRate)
    }

    // Autres crédits (à implémenter dans de futures versions)
    const other = new Decimal(0)

    const totalCredits = basicCredit
      .plus(ageCredit)
      .plus(pensionCredit)
      .plus(livingAloneCredit)
      .plus(other)

    return {
      nonRefundableCredits: totalCredits,
      creditDetails: {
        basicCredit,
        ageCredit,
        pensionCredit,
        livingAloneCredit,
        other
      }
    }
  }

  /**
   * Calcule les détails des déductions appliquées
   */
  private calculateDeductionDetails(inputs: QuebecTaxInputs): {
    rrqDeduction: Decimal
    eiDeduction: Decimal
    rqapDeduction: Decimal
    totalDeductions: Decimal
  } {
    const contributions = inputs.deductibleContributions
    
    const rrqDeduction = contributions.rrq.times(this.taxConfig.deduction_rates.cpp)
    const eiDeduction = contributions.ei.times(this.taxConfig.deduction_rates.ei)
    const rqapDeduction = contributions.rqap.times(this.taxConfig.deduction_rates.qpip)
    
    const totalDeductions = rrqDeduction.plus(eiDeduction).plus(rqapDeduction)

    return {
      rrqDeduction,
      eiDeduction,
      rqapDeduction,
      totalDeductions
    }
  }

  /**
   * Calcule le taux marginal d'imposition effectif
   */
  getMarginalTaxRate(netTaxableIncome: Decimal): number {
    // Trouver le palier applicable
    for (const bracket of this.taxConfig.tax_brackets) {
      if (netTaxableIncome.gte(bracket.min) && netTaxableIncome.lt(bracket.max)) {
        return bracket.rate
      }
    }
    
    // Si au-dessus du dernier palier, retourner le taux maximum
    return this.taxConfig.tax_brackets[this.taxConfig.tax_brackets.length - 1].rate
  }

  /**
   * Calcule le taux effectif moyen d'imposition
   */
  getAverageTaxRate(netTaxableIncome: Decimal, netTax: Decimal): number {
    if (netTaxableIncome.lte(0)) return 0
    return netTax.div(netTaxableIncome).toNumber()
  }

  /**
   * Validation des inputs
   */
  validateInputs(inputs: QuebecTaxInputs): string[] {
    const errors: string[] = []

    if (!inputs.primaryPerson) {
      errors.push('Personne principale requise')
    }

    if (inputs.primaryPerson.age < 0 || inputs.primaryPerson.age > 150) {
      errors.push('Âge de la personne principale invalide')
    }

    if (inputs.spouse && (inputs.spouse.age < 0 || inputs.spouse.age > 150)) {
      errors.push('Âge du conjoint invalide')
    }

    if (inputs.numChildren < 0) {
      errors.push('Nombre d\'enfants ne peut être négatif')
    }

    // Vérifier que les cotisations sont non négatives
    const contributions = inputs.deductibleContributions
    if (contributions.rrq.lt(0) || contributions.ei.lt(0) || contributions.rqap.lt(0)) {
      errors.push('Les cotisations déductibles ne peuvent être négatives')
    }

    return errors
  }
}