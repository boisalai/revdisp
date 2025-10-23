/**
 * Fonds des services de santé (FSS) calculator
 * Applicable aux retraités de 65 ans et plus seulement
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person } from '../models'

export class FssCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'fss'
  }

  calculate(person: Person): Record<string, Decimal> {
    // FSS s'applique uniquement aux retraités de 65 ans et plus avec revenus de retraite
    // VALIDATION MFQ CONFIRMÉE: FSS = 0$ pour revenus de travail (ménages < 65 ans)
    if (!person.isRetired || person.age < 65) {
      return {
        contribution: new Decimal(0),
        total: new Decimal(0)
      }
    }

    // Calcul basé sur le revenu de retraite total
    const totalRetirementIncome = person.grossRetirementIncome
    const contribution = this.calculateFssContribution(totalRetirementIncome)

    return {
      contribution: this.quantize(contribution),
      total: this.quantize(contribution)
    }
  }

  private calculateFssContribution(income: Decimal): Decimal {
    // Structure officielle FSS selon paramètres gouvernementaux
    // Source: Paramètres fiscaux officiels Québec
    // Validé contre calculateur MFQ: couple retraités 394k$ → 2000$ total (1000$ × 2)
    //
    // Paramètres 2025:
    // - Seuil maximal tranche 1: 18,130$ (max cotisation: 150$)
    // - Seuil maximal tranche 2: 63,060$ (max cotisation: 1,000$)
    // - Taux: 1% pour les deux tranches

    const incomeNum = income.toNumber()

    // Structure FSS 2025
    const firstThreshold = 18130      // Début cotisation
    const firstMax = 33130            // 18,130 + (150 / 0.01) = seuil atteinte 150$
    const secondThreshold = 63060     // Début tranche 2
    const secondMax = 148060          // 63,060 + ((1000-150) / 0.01) = seuil atteinte 1000$

    if (incomeNum <= firstThreshold) {
      // Tranche 0: Aucune cotisation
      return new Decimal(0)
    } else if (incomeNum <= firstMax) {
      // Tranche 1: 1% sur excédent de 18,130$, max 150$
      return income.minus(firstThreshold).times(0.01)
    } else if (incomeNum <= secondThreshold) {
      // Zone fixe: 150$ entre 33,130$ et 63,060$
      return new Decimal(150)
    } else if (incomeNum <= secondMax) {
      // Tranche 2: 150$ + 1% sur excédent de 63,060$, max 1,000$
      const baseContribution = new Decimal(150)
      const excessContribution = income.minus(secondThreshold).times(0.01)
      return baseContribution.plus(excessContribution)
    } else {
      // Maximum: 1,000$ pour revenus > 148,060$
      return new Decimal(1000)
    }
  }
}

// Register the calculator
CalculatorRegistry.register('fss', FssCalculator)