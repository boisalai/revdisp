/**
 * Senior Support Tax Credit Calculator (Crédit d'impôt pour le soutien aux aînés)
 * 
 * Calcule le crédit d'impôt remboursable du Québec pour le soutien aux personnes âgées de 70 ans et plus.
 * 
 * Règles principales:
 * - Crédit d'impôt remboursable pour les résidents du Québec âgés de 70 ans et plus
 * - Montant maximal: 2 000$ par personne admissible, 4 000$ pour un couple
 * - Réduction progressive selon le revenu familial net
 * - Taux de réduction: 5,16% (2023), 5,31% (2024), 5,40% (2025)
 * - Élimination complète aux revenus élevés
 * - Traitement automatique par Revenu Québec (pas de demande explicite requise)
 * 
 * Sources officielles:
 * - Revenu Québec: https://www.revenuquebec.ca/fr/citoyens/credits-dimpot/credit-dimpot-pour-soutien-aux-aines/
 * - Budget Québec: Dépenses fiscales 2024 (fiche 110108)
 * - CFFP: https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/credit-impot-soutien-aines/
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Household, Person } from '../models'

export interface SeniorSupportResult {
  /** Montant total du crédit pour le ménage */
  total_credit: Decimal
  /** Crédit pour la personne principale */
  person_credit: Decimal
  /** Crédit pour le conjoint (si applicable) */
  spouse_credit: Decimal
  /** Nombre de personnes âgées éligibles dans le ménage */
  eligible_seniors: number
  /** Âge minimum requis pour l'éligibilité */
  min_age: number
  /** Revenu familial net utilisé pour le calcul */
  family_net_income: Decimal
  /** Seuil de réduction applicable */
  income_threshold: Decimal
  /** Excédent de revenu soumis à réduction */
  excess_income: Decimal
  /** Taux de réduction appliqué */
  reduction_rate: Decimal
  /** Montant de la réduction */
  reduction_amount: Decimal
}

export class SeniorSupportCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'senior_support'
  }

  /**
   * Méthode héritée de BaseCalculator (interface simplifiée)
   * @param household Données du ménage
   * @returns Crédit sous format Record<string, Decimal>
   */
  calculate(household: Household): Record<string, Decimal> {
    const result = this.calculateDetailed(household)
    return {
      senior_support: result.total_credit
    }
  }

  /**
   * Calcul détaillé du crédit d'impôt pour le soutien aux aînés
   * @param household Données du ménage
   * @returns Résultat détaillé du calcul
   */
  calculateDetailed(household: Household): SeniorSupportResult {
    const config = this.getConfigValue('senior_support')
    
    const familyNetIncome = this.calculateFamilyNetIncome(household)
    
    // Vérifier l'éligibilité des personnes
    const personEligible = this.isPersonEligible(household.primaryPerson, config.min_age)
    const spouseEligible = household.spouse ? this.isPersonEligible(household.spouse, config.min_age) : false
    
    const eligibleSeniors = Number(personEligible) + Number(spouseEligible)
    
    if (eligibleSeniors === 0) {
      return this.createZeroResult(config.min_age, familyNetIncome)
    }

    // Déterminer le seuil de réduction et le montant maximum
    const hasSpouse = household.spouse !== null
    const incomeThreshold = new Decimal(hasSpouse ? config.income_thresholds.couple : config.income_thresholds.single)
    const maxCredit = new Decimal(eligibleSeniors === 2 ? config.max_credit.couple : config.max_credit.single)

    // Calculer l'excédent de revenu et la réduction
    const excessIncome = Decimal.max(familyNetIncome.minus(incomeThreshold), 0)
    const reductionRate = new Decimal(config.reduction_rate)
    const reductionAmount = excessIncome.times(reductionRate)

    // Calculer le crédit net (ne peut pas être négatif)
    const totalCredit = Decimal.max(maxCredit.minus(reductionAmount), 0)

    // Répartir le crédit entre les conjoints (si applicable)
    let personCredit = new Decimal(0)
    let spouseCredit = new Decimal(0)

    if (eligibleSeniors === 1) {
      if (personEligible) {
        personCredit = totalCredit
      } else {
        spouseCredit = totalCredit
      }
    } else if (eligibleSeniors === 2) {
      // Partage égal entre les deux conjoints éligibles
      personCredit = totalCredit.div(2)
      spouseCredit = totalCredit.div(2)
    }

    return {
      total_credit: totalCredit,
      person_credit: personCredit,
      spouse_credit: spouseCredit,
      eligible_seniors: eligibleSeniors,
      min_age: config.min_age,
      family_net_income: familyNetIncome,
      income_threshold: incomeThreshold,
      excess_income: excessIncome,
      reduction_rate: reductionRate,
      reduction_amount: reductionAmount
    }
  }

  /**
   * Vérifie si une personne est éligible au crédit (70 ans et plus)
   */
  private isPersonEligible(person: Person, minAge: number): boolean {
    return person.age >= minAge
  }

  /**
   * Calcule le revenu familial net pour la détermination du crédit
   * Utilise le revenu total (incluant tous les revenus imposables et non imposables)
   */
  private calculateFamilyNetIncome(household: Household): Decimal {
    let familyIncome = new Decimal(household.primaryPerson.grossWorkIncome)
      .plus(household.primaryPerson.grossRetirementIncome)

    if (household.spouse) {
      familyIncome = familyIncome
        .plus(household.spouse.grossWorkIncome)
        .plus(household.spouse.grossRetirementIncome)
    }

    return familyIncome
  }

  /**
   * Crée un résultat zéro quand aucune personne n'est éligible
   */
  private createZeroResult(minAge: number, familyNetIncome: Decimal): SeniorSupportResult {
    return {
      total_credit: new Decimal(0),
      person_credit: new Decimal(0),
      spouse_credit: new Decimal(0),
      eligible_seniors: 0,
      min_age: minAge,
      family_net_income: familyNetIncome,
      income_threshold: new Decimal(0),
      excess_income: new Decimal(0),
      reduction_rate: new Decimal(0),
      reduction_amount: new Decimal(0)
    }
  }

  /**
   * Valide les entrées du ménage
   */
  validateInputs(household: Household): void {
    if (!household.primaryPerson) {
      throw new Error('Personne principale requise')
    }

    if (household.primaryPerson.age < 0 || household.primaryPerson.age > 150) {
      throw new Error('Âge de la personne principale invalide')
    }

    if (household.spouse && (household.spouse.age < 0 || household.spouse.age > 150)) {
      throw new Error('Âge du conjoint invalide')
    }
  }
}

// Enregistrer le calculateur dans le registre
CalculatorRegistry.register('senior_support', SeniorSupportCalculator)