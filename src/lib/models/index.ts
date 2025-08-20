/**
 * Data models for tax calculations
 */

import Decimal from 'decimal.js'
import { InvalidHouseholdError } from '../core/exceptions'

export enum HouseholdType {
  SINGLE = "single",
  SINGLE_PARENT = "single_parent",
  COUPLE = "couple",
  RETIRED_SINGLE = "retired_single",
  RETIRED_COUPLE = "retired_couple"
}

export interface PersonData {
  age: number
  grossWorkIncome?: Decimal | number | string
  selfEmployedIncome?: Decimal | number | string
  grossRetirementIncome?: Decimal | number | string
  isRetired?: boolean
}

export interface ChildData {
  age: number
  childcareExpenses: number
  childcareType: 'subsidized' | 'nonSubsidized'
}

export class Person {
  age: number
  grossWorkIncome: Decimal
  selfEmployedIncome: Decimal
  grossRetirementIncome: Decimal
  isRetired: boolean

  constructor(data: PersonData) {
    this.age = data.age
    this.grossWorkIncome = new Decimal(data.grossWorkIncome || 0)
    this.selfEmployedIncome = new Decimal(data.selfEmployedIncome || 0)
    this.grossRetirementIncome = new Decimal(data.grossRetirementIncome || 0)
    this.isRetired = data.isRetired || false

    this.validate()
  }

  private validate(): void {
    if (this.age < 0 || this.age > 120) {
      throw new InvalidHouseholdError(`Invalid age: ${this.age}`)
    }

    if (this.grossWorkIncome.lessThan(0) || 
        this.selfEmployedIncome.lessThan(0) || 
        this.grossRetirementIncome.lessThan(0)) {
      throw new InvalidHouseholdError("Income amounts cannot be negative")
    }
  }

  get totalIncome(): Decimal {
    return this.grossWorkIncome.plus(this.selfEmployedIncome).plus(this.grossRetirementIncome)
  }

  get income() {
    return {
      work: this.grossWorkIncome,
      retirement: this.grossRetirementIncome,
      other: new Decimal(0)
    }
  }
}

export interface HouseholdData {
  householdType: HouseholdType
  primaryPerson: PersonData
  spouse?: PersonData
  numChildren?: number
  children?: ChildData[]
  province?: string
  medicalExpenses?: Decimal | number | string
}

export class Household {
  householdType: HouseholdType
  primaryPerson: Person
  spouse: Person | null
  numChildren: number
  children: ChildData[]
  province: string
  medicalExpenses: Decimal

  constructor(data: HouseholdData) {
    this.householdType = data.householdType
    this.primaryPerson = new Person(data.primaryPerson)
    this.spouse = data.spouse ? new Person(data.spouse) : null
    this.numChildren = data.numChildren || 0
    this.children = data.children || []
    this.province = data.province || 'QC'
    this.medicalExpenses = new Decimal(data.medicalExpenses || 0)

    this.validate()
  }

  private validate(): void {
    if (this.numChildren < 0) {
      throw new InvalidHouseholdError("Number of children cannot be negative")
    }

    if (this.medicalExpenses.lessThan(0)) {
      throw new InvalidHouseholdError("Medical expenses cannot be negative")
    }

    // Check spouse requirement for couples
    if ([HouseholdType.COUPLE, HouseholdType.RETIRED_COUPLE].includes(this.householdType)) {
      if (!this.spouse) {
        throw new InvalidHouseholdError("Couples must have a spouse")
      }
    }

    // Check retirement status for retired households
    if ([HouseholdType.RETIRED_SINGLE, HouseholdType.RETIRED_COUPLE].includes(this.householdType)) {
      if (!this.primaryPerson.isRetired) {
        throw new InvalidHouseholdError("Primary person must be retired for retired household")
      }
      if (this.spouse && !this.spouse.isRetired) {
        throw new InvalidHouseholdError("Spouse must be retired for retired couple")
      }
    }
  }

  get isCouple(): boolean {
    return [HouseholdType.COUPLE, HouseholdType.RETIRED_COUPLE].includes(this.householdType)
  }

  get isRetired(): boolean {
    return [HouseholdType.RETIRED_SINGLE, HouseholdType.RETIRED_COUPLE].includes(this.householdType)
  }

  get totalIncome(): Decimal {
    const total = this.primaryPerson.totalIncome
    return this.spouse ? total.plus(this.spouse.totalIncome) : total
  }

  get totalChildcareExpenses(): number {
    return this.children.reduce((total, child) => total + child.childcareExpenses, 0)
  }
}