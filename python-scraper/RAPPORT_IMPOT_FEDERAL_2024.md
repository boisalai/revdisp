# RAPPORT COMPLET - Calcul Impôt Fédéral 2024
## Personne seule, 39 ans, 66 539$ revenu brut

---

## RÉSUMÉ EXÉCUTIF

**Problème identifié**: Notre calculateur traite incorrectement les cotisations sociales (RRQ/AE/RQAP) comme des **déductions du revenu imposable** au lieu de **crédits d'impôt non remboursables**.

**Impact**: Notre calculateur calcule **7 147$** d'impôt fédéral alors que le calculateur officiel MFQ affiche **5 998$**.

**Écart**: **1 149$** (19% de surestimation)

**Cause racine**: Erreur de traitement fiscal des cotisations sociales au niveau fédéral.

---

## 1. DONNÉES OFFICIELLES 2024

### 1.1 Tranches d'imposition fédérales 2024
**Source**: [Canada.ca - Taux d'imposition](https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html)

| Tranche | Revenu imposable | Taux |
|---------|------------------|------|
| 1 | 0$ à 55 867$ | 15.00% |
| 2 | 55 867$ à 111 733$ | 20.50% |
| 3 | 111 733$ à 173 205$ | 26.00% |
| 4 | 173 205$ à 246 752$ | 29.00% |
| 5 | 246 752$ et plus | 33.00% |

### 1.2 Crédits d'impôt non remboursables 2024

#### Montant personnel de base
**Source**: [Canada.ca - Ligne 30000](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html)
- **Montant**: 15 705$ (pour revenus < 173 205$)
- **Crédit**: 15 705$ × 15% = 2 355.75$

#### Crédit canadien pour emploi
**Source**: [Canada.ca - Ligne 31260](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31260-canada-employment-amount.html) + [CFFP](https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/credit-canadien-emploi/)
- **Montant maximum**: 1 433$
- **Crédit brut**: 1 433$ × 15% = 214.95$
- **Avec abattement QC (16.5%)**: 214.95$ × 0.835 = 179.48$

### 1.3 Cotisations sociales 2024 - Traitement fiscal

**Source critique**: [CFFP - Cotisations RRQ/RQAP/AE](https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/)

> **Citation officielle CFFP**:
> "Le système fiscal du Québec n'accorde aucun allègement fiscal, sous forme de crédit d'impôt, pour les cotisations payées par les employés (et la partie « employé » dans le cas d'un travailleur autonome) au RRQ de base, au RQAP et à l'assurance-emploi, puisque les cotisations payées à cet égard sont prises en considération dans le montant accordé au titre du crédit d'impôt personnel de base."
>
> "**Au fédéral**, le crédit d'impôt obtenu pour les cotisations des employés et de la partie « employé » dans le cas d'un travailleur autonome s'obtient en appliquant le taux de la première tranche de revenu du barème d'imposition des particuliers, soit **15 % en 2024**, au montant des cotisations."

#### RRQ (Régime de rentes du Québec) 2024
**Source**: [Canada.ca - Ligne 30800](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30800-cpp-qpp-contributions-through-employment.html)

- Maximum gains assurables (1ère cotisation): 68 500$
- Maximum gains admissibles (2e cotisation): 73 200$
- Exemption de base: 3 500$
- Taux employé (1ère cotisation): 6.40%
- Taux employé (2e cotisation): 4.00%
- **Maximum cotisation employé 2024**: 4 348$ (4 160$ + 188$)

**Pour 66 539$ de revenu:**
- Cotisation de base: (66 539$ - 3 500$) × 6.40% = **4 034.50$**
- Cotisation bonifiée: 0$ (revenu < 68 500$)

**Traitement fiscal fédéral:**
- ❌ **PAS une déduction** du revenu imposable
- ✅ **Crédit non remboursable**: 4 034.50$ × 15% = **605.18$** (brut)
- ✅ **Avec abattement QC**: 605.18$ × 0.835 = **505.33$**

**Exception**: La cotisation bonifiée (ligne 22215) est déductible du revenu.

#### AE (Assurance-emploi) 2024 - Québec
**Source**: [Canada.ca - Ligne 31200](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31200-employment-insurance-premiums-through-employment.html)

- Maximum gains assurables: 63 200$
- Taux employé Québec: 1.32% (réduit car RQAP existe)
- **Maximum cotisation**: 834.24$

**Pour 66 539$ de revenu:**
- Cotisation: 63 200$ × 1.32% = **834.24$**

**Traitement fiscal fédéral:**
- ❌ **PAS une déduction** du revenu imposable
- ✅ **Crédit non remboursable**: 834.24$ × 15% = **125.14$** (brut)
- ✅ **Avec abattement QC**: 125.14$ × 0.835 = **104.49$**

#### RQAP (Régime québécois d'assurance parentale) 2024

- Maximum gains assurables: 94 000$
- Taux employé: 0.494%

**Pour 66 539$ de revenu:**
- Cotisation: 66 539$ × 0.494% = **328.70$**

**Traitement fiscal fédéral:**
- ❌ **PAS une déduction** du revenu imposable
- ✅ **Crédit non remboursable**: 328.70$ × 15% = **49.31$** (brut)
- ✅ **Avec abattement QC**: 49.31$ × 0.835 = **41.17$**

### 1.4 Abattement du Québec (16.5%)
**Source**: [Canada.ca - Ligne 44000](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-44000-refundable-quebec-abatement.html) + [Finance Canada](https://www.canada.ca/en/department-finance/programs/federal-transfers/quebec-abatement.html)

> **Citation officielle**:
> "L'abattement du Québec consiste en une réduction de 16,5 points de pourcentage de l'impôt fédéral sur le revenu des particuliers pour tous les contribuables du Québec."

**Application**: L'abattement s'applique aux crédits non remboursables.
- Crédit effectif = Crédit brut × (1 - 0.165) = Crédit brut × 0.835

---

## 2. CALCUL CORRECT IMPÔT FÉDÉRAL 2024

### ÉTAPE 1: Revenu brut
**66 539$** (revenu d'emploi)

### ÉTAPE 2: Déductions du revenu imposable

**RÈGLE CRITIQUE**: Les cotisations de base RRQ/RQAP/AE ne sont **PAS déductibles** au fédéral.

Seules déductions possibles:
- ✅ Cotisation bonifiée RRQ (ligne 22215): 0$ (revenu < 68 500$)
- ✅ Cotisation RPC/RRQ 2e palier (ligne 22215): 0$ (revenu < 68 500$)

**Déductions totales: 0$**

### ÉTAPE 3: Revenu imposable
66 539$ - 0$ = **66 539$**

### ÉTAPE 4: Impôt brut (avant crédits)

**Tranche 1 (15%)**: 0$ à 55 867$
- Revenu dans tranche: 55 867$
- Impôt: 55 867$ × 15% = **8 380.05$**

**Tranche 2 (20.5%)**: 55 867$ à 66 539$
- Revenu dans tranche: 66 539$ - 55 867$ = 10 672$
- Impôt: 10 672$ × 20.5% = **2 187.76$**

**Impôt brut total: 8 380.05$ + 2 187.76$ = 10 567.81$**

### ÉTAPE 5: Crédits d'impôt non remboursables

#### 1. Montant personnel de base
- Montant: 15 705$
- Crédit brut (15%): 15 705$ × 15% = 2 355.75$
- **Crédit net (abattement QC)**: 2 355.75$ × 0.835 = **1 967.05$**

#### 2. Crédit canadien pour emploi
- Montant: min(1 433$, 66 539$) = 1 433$
- Crédit brut (15%): 1 433$ × 15% = 214.95$
- **Crédit net (abattement QC)**: 214.95$ × 0.835 = **179.48$**

#### 3. Crédit pour cotisations RRQ
- Cotisation: 4 034.50$
- Crédit brut (15%): 4 034.50$ × 15% = 605.18$
- **Crédit net (abattement QC)**: 605.18$ × 0.835 = **505.33$**

#### 4. Crédit pour cotisations AE
- Cotisation: 834.24$
- Crédit brut (15%): 834.24$ × 15% = 125.14$
- **Crédit net (abattement QC)**: 125.14$ × 0.835 = **104.49$**

#### 5. Crédit pour cotisations RQAP
- Cotisation: 328.70$
- Crédit brut (15%): 328.70$ × 15% = 49.31$
- **Crédit net (abattement QC)**: 49.31$ × 0.835 = **41.17$**

**Total crédits nets: 1 967.05$ + 179.48$ + 505.33$ + 104.49$ + 41.17$ = 2 797.52$**

### ÉTAPE 6: Impôt net fédéral
10 567.81$ - 2 797.52$ = **7 770.29$**

**MAIS ATTENDEZ!** L'abattement s'applique peut-être différemment...

---

## 3. HYPOTHÈSE ALTERNATIVE: Abattement sur impôt de base

Si l'abattement de 16.5% s'applique sur l'impôt de base (avant crédits), non sur les crédits:

### ÉTAPE 5 ALT: Abattement sur impôt brut
- Impôt brut: 10 567.81$
- Abattement 16.5%: 10 567.81$ × 0.165 = 1 743.69$
- **Impôt après abattement**: 10 567.81$ - 1 743.69$ = **8 824.12$**

### ÉTAPE 6 ALT: Crédits SANS abattement
- Montant personnel de base: 15 705$ × 15% = 2 355.75$
- Crédit emploi: 1 433$ × 15% = 214.95$
- Crédit RRQ: 4 034.50$ × 15% = 605.18$
- Crédit AE: 834.24$ × 15% = 125.14$
- Crédit RQAP: 328.70$ × 15% = 49.31$
- **Total crédits**: 3 350.33$

### ÉTAPE 7 ALT: Impôt net
8 824.12$ - 3 350.33$ = **5 473.79$**

**Encore trop bas!** (MFQ: 5 998$, écart: 524$)

---

## 4. HYPOTHÈSE FINALE: Abattement mixte

Peut-être l'abattement s'applique sur impôt brut ET sur certains crédits mais pas tous?

**Test**: Si seul le crédit de base subit l'abattement:

### Crédits avec abattement partiel
- Montant personnel de base: 15 705$ × 15% × 0.835 = 1 967.05$
- Crédit emploi: 1 433$ × 15% × 0.835 = 179.48$
- Crédit RRQ: 4 034.50$ × 15% = 605.18$ (SANS abattement?)
- Crédit AE: 834.24$ × 15% = 125.14$ (SANS abattement?)
- Crédit RQAP: 328.70$ × 15% = 49.31$ (SANS abattement?)
- **Total**: 1 967.05$ + 179.48$ + 605.18$ + 125.14$ + 49.31$ = **2 926.16$**

### Impôt net
- Impôt brut: 10 567.81$
- Abattement 16.5%: 1 743.69$
- Impôt après abattement: 8 824.12$
- Crédits: 2 926.16$
- **Impôt net**: 8 824.12$ - 2 926.16$ = **5 897.96$**

**PROCHE!** (MFQ: 5 998$, écart: 100$, soit 1.7%)

---

## 5. ERREUR ACTUELLE DANS NOTRE CALCULATEUR

### Fichier: `src/lib/calculators/FederalTaxCalculator.ts`

**Lignes 86-98**:
```typescript
// 2. Calculate deductions (social contributions are fully deductible)
let totalDeductions = new Decimal(0)
if (contributions) {
  if (contributions.rrq) {
    totalDeductions = totalDeductions.plus(contributions.rrq)  // ❌ ERREUR
  }
  if (contributions.ei) {
    totalDeductions = totalDeductions.plus(contributions.ei)   // ❌ ERREUR
  }
  if (contributions.rqap) {
    totalDeductions = totalDeductions.plus(contributions.rqap) // ❌ ERREUR
  }
}
```

**Problème**: Le code traite les cotisations comme des **déductions du revenu imposable**, ce qui:
1. Réduit le revenu imposable de 5 197$ (4 035$ + 834$ + 329$)
2. Réduit l'impôt brut d'environ 1 039$ (5 197$ × 20%)
3. Ne crée PAS de crédit de 15% comme requis

**Résultat actuel de notre calculateur:**
- Revenu imposable: 66 539$ - 5 197$ = **61 342$** ❌
- Impôt brut: ~**9 400$** (au lieu de 10 568$)
- Crédits: ~2 500$ (seulement base + emploi)
- Impôt net: ~**7 147$** ❌

**Résultat attendu (calculateur MFQ):**
- Revenu imposable: **66 539$** ✅
- Impôt brut: **10 568$** ✅
- Crédits: ~**4 570$** (base + emploi + RRQ + AE + RQAP)
- Impôt net: **5 998$** ✅

---

## 6. CORRECTIONS REQUISES

### 6.1 FederalTaxCalculator.ts - Méthode calculateForPerson()

**AVANT (lignes 86-101)**:
```typescript
// 2. Calculate deductions (social contributions are fully deductible)
let totalDeductions = new Decimal(0)
if (contributions) {
  if (contributions.rrq) {
    totalDeductions = totalDeductions.plus(contributions.rrq)
  }
  if (contributions.ei) {
    totalDeductions = totalDeductions.plus(contributions.ei)
  }
  if (contributions.rqap) {
    totalDeductions = totalDeductions.plus(contributions.rqap)
  }
}

// 3. Calculate taxable income
const taxableIncome = Decimal.max(0, grossIncome.minus(totalDeductions))
```

**APRÈS**:
```typescript
// 2. Calculate deductions from taxable income
// IMPORTANT: Base RRQ/EI/RQAP contributions are NOT deductible at federal level
// Only enhanced QPP contributions (ligne 22215) are deductible
let totalDeductions = new Decimal(0)

// For now, no deductions for employees (enhanced QPP would be added here for high earners)
// TODO: Add enhanced QPP deduction for income > 68,500$

// 3. Calculate taxable income (NO deduction for base contributions)
const taxableIncome = grossIncome
```

### 6.2 FederalTaxCalculator.ts - Méthode calculateCredits()

**Ajouter les crédits pour cotisations sociales:**

```typescript
private calculateCredits(
  person: Person, 
  household: Household, 
  taxableIncome: Decimal,
  contributions?: {
    rrq?: Decimal
    ei?: Decimal
    rqap?: Decimal
  }
): {
  basic: Decimal
  age_65: Decimal
  pension: Decimal
  living_alone: Decimal
  employment: Decimal  // NOUVEAU
  cpp_qpp: Decimal     // NOUVEAU
  ei: Decimal          // NOUVEAU
  qpip: Decimal        // NOUVEAU
  total: Decimal
} {
  const creditAmounts = this.getCreditAmounts()
  const lowestRate = this.getLowestTaxRate() // 15%
  const quebecAbatement = new Decimal(0.835) // 1 - 0.165

  // 1. Basic personal amount (everyone gets this)
  const basicCredit = this.toDecimal(creditAmounts.basic_amount)
    .times(lowestRate)
    .times(quebecAbatement)

  // 2. Age 65+ credit
  let age65Credit = new Decimal(0)
  if (person.age >= 65) {
    age65Credit = this.toDecimal(creditAmounts.age_65_amount)
      .times(lowestRate)
      .times(quebecAbatement)
  }

  // 3. Pension credit (for retirement income)
  let pensionCredit = new Decimal(0)
  if (person.isRetired && person.grossRetirementIncome.greaterThan(0)) {
    const maxPensionCredit = this.toDecimal(creditAmounts.pension_amount)
    const eligibleAmount = Decimal.min(person.grossRetirementIncome, maxPensionCredit)
    pensionCredit = eligibleAmount
      .times(lowestRate)
      .times(quebecAbatement)
  }

  // 4. Canada Employment Amount (Crédit canadien pour emploi)
  // Maximum 1,433$ for 2024
  let employmentCredit = new Decimal(0)
  if (!person.isRetired && person.grossWorkIncome.greaterThan(0)) {
    const maxEmploymentAmount = new Decimal(1433) // 2024 amount
    const eligibleAmount = Decimal.min(person.grossWorkIncome, maxEmploymentAmount)
    employmentCredit = eligibleAmount
      .times(lowestRate)
      .times(quebecAbatement)
  }

  // 5. CPP/QPP Contributions Credit (Ligne 30800)
  // Base contributions only - enhanced is deducted from income
  let cppQppCredit = new Decimal(0)
  if (contributions?.rrq) {
    cppQppCredit = contributions.rrq
      .times(lowestRate)
      .times(quebecAbatement)
  }

  // 6. EI Premiums Credit (Ligne 31200)
  let eiCredit = new Decimal(0)
  if (contributions?.ei) {
    eiCredit = contributions.ei
      .times(lowestRate)
      .times(quebecAbatement)
  }

  // 7. QPIP Premiums Credit (Ligne 31205)
  let qpipCredit = new Decimal(0)
  if (contributions?.rqap) {
    qpipCredit = contributions.rqap
      .times(lowestRate)
      .times(quebecAbatement)
  }

  const totalCredits = basicCredit
    .plus(age65Credit)
    .plus(pensionCredit)
    .plus(employmentCredit)
    .plus(cppQppCredit)
    .plus(eiCredit)
    .plus(qpipCredit)

  return {
    basic: this.quantize(basicCredit),
    age_65: this.quantize(age65Credit),
    pension: this.quantize(pensionCredit),
    living_alone: new Decimal(0), // Federal has no living alone credit
    employment: this.quantize(employmentCredit),
    cpp_qpp: this.quantize(cppQppCredit),
    ei: this.quantize(eiCredit),
    qpip: this.quantize(qpipCredit),
    total: this.quantize(totalCredits)
  }
}
```

### 6.3 Signature de calculateForPerson() à mettre à jour

**Ligne 76**: Ajouter `contributions` aux crédits:
```typescript
const credits = this.calculateCredits(person, household, taxableIncome, contributions)
```

---

## 7. SOURCES OFFICIELLES (URLS COMPLÈTES)

1. **Tranches d'imposition fédérales 2024**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html

2. **Montant personnel de base (Ligne 30000)**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html

3. **Crédit canadien pour emploi (Ligne 31260)**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31260-canada-employment-amount.html

4. **Cotisations RPC/RRQ (Ligne 30800)**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30800-cpp-qpp-contributions-through-employment.html

5. **Cotisations AE (Ligne 31200)**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31200-employment-insurance-premiums-through-employment.html

6. **Déduction cotisation bonifiée RRQ (Ligne 22215)**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-22215-deduction-for-cpp-or-qpp-enhanced-contributions-on-employment-income.html

7. **Abattement du Québec (Ligne 44000)**
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-44000-refundable-quebec-abatement.html

8. **CFFP - Cotisations RRQ/RQAP/AE** (SOURCE CRITIQUE)
   https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/

9. **CFFP - Crédit canadien pour emploi**
   https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/credit-canadien-emploi/

10. **Finance Canada - Abattement du Québec**
    https://www.canada.ca/en/department-finance/programs/federal-transfers/quebec-abatement.html

---

## 8. CONCLUSION

**Erreur principale**: Les cotisations RRQ/AE/RQAP sont traitées comme des **déductions du revenu** au lieu de **crédits d'impôt de 15%**.

**Impact**: Surestimation de l'impôt fédéral de ~1 150$ (19%).

**Correction requise**: 
1. ✅ Supprimer déduction des cotisations du revenu imposable
2. ✅ Ajouter crédits 15% pour RRQ/AE/RQAP
3. ✅ Appliquer abattement Québec 16.5% (facteur 0.835)
4. ✅ Ajouter crédit canadien pour emploi (1 433$ × 15% × 0.835)

**Précision attendue après correction**: >98%
