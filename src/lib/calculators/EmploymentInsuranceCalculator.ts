/**
 * Calculateur des cotisations à l'assurance-emploi fédérale
 * 
 * Règles principales:
 * - Les résidents du Québec bénéficient d'un taux réduit (réduction RQAP)
 * - Les retraités de 65 ans et plus ne cotisent pas à l'AE
 * - Les travailleurs autonomes ne cotisent pas à l'AE (sauf exception)
 * - Cotisation basée sur le revenu de travail jusqu'au maximum assurable
 * - L'employeur cotise à 1.4× le taux de l'employé
 * 
 * Sources officielles:
 * - Chaire en fiscalité et en finances publiques, Cotisations au RRQ, au RQAP et à l'assurance-emploi
 *   https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/
 * - Commission de l'assurance-emploi du Canada
 * - Agence du revenu du Canada (ARC)
 * - Guide T4001 - Guide de l'employeur - Les retenues sur la paie et les versements
 */

import Decimal from 'decimal.js'
import { BaseCalculator } from '../core/BaseCalculator'
import { CalculatorRegistry } from '../core/factory'
import { Person } from '../models'

export interface EmploymentInsuranceResult {
  /** Cotisation de l'employé */
  employee: Decimal
  /** Cotisation de l'employeur */
  employer: Decimal
  /** Total des cotisations (employé + employeur) */
  total: Decimal
  /** Revenu assurable utilisé pour le calcul */
  insurable_earnings: Decimal
  /** Taux effectif appliqué à l'employé */
  effective_employee_rate: Decimal
  /** Indique si la personne est exemptée */
  is_exempt: boolean
  /** Raison de l'exemption, si applicable */
  exemption_reason?: string
}

export class EmploymentInsuranceCalculator extends BaseCalculator {
  get calculatorName(): string {
    return 'employment_insurance'
  }

  /**
   * Méthode héritée de BaseCalculator (interface simplifiée)
   * @param person Données de la personne  
   * @returns Cotisations sous format Record<string, Decimal>
   */
  calculate(person: Person): Record<string, Decimal> {
    const result = this.calculateDetailed(person)
    return {
      employee: result.employee,
      employer: result.employer,
      total: result.total
    }
  }

  /**
   * Calcule les cotisations d'assurance-emploi avec détails complets
   * 
   * @param person Données de la personne
   * @returns Détails complets des cotisations AE
   */
  calculateDetailed(person: Person): EmploymentInsuranceResult {
    // Vérification des conditions d'exemption
    const exemptionCheck = this.checkExemptions(person)
    if (exemptionCheck.is_exempt) {
      return {
        employee: new Decimal(0),
        employer: new Decimal(0),
        total: new Decimal(0),
        insurable_earnings: new Decimal(0),
        effective_employee_rate: new Decimal(0),
        is_exempt: true,
        exemption_reason: exemptionCheck.reason
      }
    }

    // Calcul du revenu assurable
    const insurableEarnings = this.calculateInsurableEarnings(person)
    
    // Si aucun revenu assurable, pas de cotisation
    if (insurableEarnings.equals(0)) {
      return {
        employee: new Decimal(0),
        employer: new Decimal(0),
        total: new Decimal(0),
        insurable_earnings: insurableEarnings,
        effective_employee_rate: new Decimal(0),
        is_exempt: false
      }
    }

    // Calcul des taux effectifs
    const employeeRate = this.getEffectiveEmployeeRate()
    const employerRate = this.getEffectiveEmployerRate()

    // Calcul des cotisations
    const maxEmployeeContrib = this.toDecimal(this.getConfigValue('max_employee_contribution'))
    const maxEmployerContrib = maxEmployeeContrib.times(
      this.toDecimal(this.getConfigValue('employer_rate_multiplier'))
    )

    const employeeContribution = Decimal.min(
      insurableEarnings.times(employeeRate),
      maxEmployeeContrib
    )

    const employerContribution = Decimal.min(
      insurableEarnings.times(employerRate),
      maxEmployerContrib
    )

    const totalContribution = employeeContribution.plus(employerContribution)

    return {
      employee: this.quantize(employeeContribution),
      employer: this.quantize(employerContribution),
      total: this.quantize(totalContribution),
      insurable_earnings: this.quantize(insurableEarnings),
      effective_employee_rate: employeeRate,
      is_exempt: false
    }
  }

  /**
   * Vérifie les conditions d'exemption de l'AE
   */
  private checkExemptions(person: Person): { is_exempt: boolean; reason?: string } {
    // Retraités de 65 ans et plus
    if (person.isRetired && person.age >= 65) {
      return {
        is_exempt: true,
        reason: 'Personne retraitée de 65 ans et plus'
      }
    }

    // Travailleurs autonomes (revenu de travail = 0, mais revenu autonome > 0)
    if (person.grossWorkIncome.equals(0) && person.selfEmployedIncome.greaterThan(0)) {
      return {
        is_exempt: true,
        reason: 'Travailleur autonome (non assujetti à l\'AE)'
      }
    }

    return { is_exempt: false }
  }

  /**
   * Calcule le revenu assurable pour l'AE
   */
  private calculateInsurableEarnings(person: Person): Decimal {
    // Seul le revenu de travail compte pour l'AE (pas les revenus de retraite)
    const workIncome = person.grossWorkIncome
    
    // Vérification du seuil minimum
    const minEarnings = this.toDecimal(this.getConfigValue('min_insurable_earnings'))
    if (workIncome.lessThan(minEarnings)) {
      return new Decimal(0)
    }

    // Application du maximum assurable
    const maxEarnings = this.toDecimal(this.getConfigValue('max_insurable_earnings'))
    return Decimal.min(workIncome, maxEarnings)
  }

  /**
   * Obtient le taux effectif de cotisation de l'employé
   * Pour les résidents du Québec, c'est le taux réduit (réduction RQAP)
   */
  private getEffectiveEmployeeRate(): Decimal {
    return this.toDecimal(this.getConfigValue('employee_rate'))
  }

  /**
   * Obtient le taux effectif de cotisation de l'employeur
   * L'employeur paie 1.4× le taux de l'employé
   */
  private getEffectiveEmployerRate(): Decimal {
    const employeeRate = this.getEffectiveEmployeeRate()
    const multiplier = this.toDecimal(this.getConfigValue('employer_rate_multiplier'))
    return employeeRate.times(multiplier)
  }

  /**
   * Calcule la cotisation maximale de l'employé pour l'année
   */
  public getMaxEmployeeContribution(): Decimal {
    return this.toDecimal(this.getConfigValue('max_employee_contribution'))
  }

  /**
   * Calcule la cotisation maximale de l'employeur pour l'année
   */
  public getMaxEmployerContribution(): Decimal {
    const maxEmployee = this.getMaxEmployeeContribution()
    const multiplier = this.toDecimal(this.getConfigValue('employer_rate_multiplier'))
    return maxEmployee.times(multiplier)
  }

  /**
   * Obtient le maximum des gains assurables
   */
  public getMaxInsurableEarnings(): Decimal {
    return this.toDecimal(this.getConfigValue('max_insurable_earnings'))
  }

  /**
   * Vérifie si une personne est assujettie à l'AE
   */
  public isSubjectToEI(person: Person): boolean {
    const exemption = this.checkExemptions(person)
    return !exemption.is_exempt
  }

  /**
   * Calcule la réduction RQAP pour les résidents du Québec
   * Cette réduction est appliquée car le Québec administre son propre régime parental
   */
  public getQuebecReduction(): Decimal {
    try {
      return this.toDecimal(this.getConfigValue('quebec_reduction'))
    } catch {
      // Si la réduction RQAP n'est pas configurée, retourner 0
      return new Decimal(0)
    }
  }

}

// Enregistrement du calculateur dans le registre
CalculatorRegistry.register('employment_insurance', EmploymentInsuranceCalculator)