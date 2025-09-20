/**
 * Test manuel du calcul d'impôt du Québec - Analyse étape par étape
 * Cas : Personne seule, 35 ans, 45 000$ revenu brut
 */

const Decimal = require('decimal.js');

// Configuration 2024 (extraite de notre fichier config)
const QC_TAX_BRACKETS = [
  { min: 0, max: 51780, rate: 0.14 },
  { min: 51780, max: 103545, rate: 0.19 },
  { min: 103545, max: 126000, rate: 0.24 },
  { min: 126000, max: 999999999, rate: 0.2575 }
];

const QC_CREDITS = {
  basic_amount: 18056,
  age_65_amount: 3395,
  pension_amount: 3017,
  living_alone_amount: 1890
};

function calculateQcTaxManual(grossIncome, age, isAlone = true, contributions = {}) {
  console.log('='.repeat(60));
  console.log('🧮 CALCUL MANUEL IMPÔT QUÉBEC 2024');
  console.log('='.repeat(60));

  // Étape 1: Revenu brut
  const gross = new Decimal(grossIncome);
  console.log(`1️⃣ Revenu brut: ${gross.toFixed(2)}$`);

  // Étape 2: Déductions (cotisations sociales)
  let totalDeductions = new Decimal(0);
  if (contributions.rrq) totalDeductions = totalDeductions.plus(contributions.rrq);
  if (contributions.ei) totalDeductions = totalDeductions.plus(contributions.ei);
  if (contributions.rqap) totalDeductions = totalDeductions.plus(contributions.rqap);
  console.log(`2️⃣ Déductions totales: ${totalDeductions.toFixed(2)}$`);

  // Étape 3: Revenu imposable
  const taxableIncome = Decimal.max(0, gross.minus(totalDeductions));
  console.log(`3️⃣ Revenu imposable: ${taxableIncome.toFixed(2)}$`);

  // Étape 4: Calcul de l'impôt brut (progressif)
  console.log('\n📊 CALCUL IMPÔT PROGRESSIF:');
  let tax = new Decimal(0);

  for (let i = 0; i < QC_TAX_BRACKETS.length; i++) {
    const bracket = QC_TAX_BRACKETS[i];
    const bracketMin = new Decimal(bracket.min);
    const bracketMax = new Decimal(bracket.max);
    const rate = new Decimal(bracket.rate);

    if (taxableIncome.lessThanOrEqualTo(bracketMin)) break;

    const incomeInBracket = Decimal.min(
      taxableIncome.minus(bracketMin),
      bracketMax.minus(bracketMin)
    );

    if (incomeInBracket.greaterThan(0)) {
      const bracketTax = incomeInBracket.times(rate);
      tax = tax.plus(bracketTax);

      console.log(`   Tranche ${bracketMin.toFixed(0)}$ - ${bracketMax.toFixed(0)}$:`);
      console.log(`   • Revenu dans tranche: ${incomeInBracket.toFixed(2)}$`);
      console.log(`   • Taux: ${(rate.times(100)).toFixed(2)}%`);
      console.log(`   • Impôt: ${bracketTax.toFixed(2)}$`);
      console.log();
    }

    if (taxableIncome.lessThanOrEqualTo(bracketMax)) break;
  }

  console.log(`4️⃣ Impôt brut total: ${tax.toFixed(2)}$`);

  // Étape 5: Crédits d'impôt non remboursables
  console.log('\n🎯 CRÉDITS D\'IMPÔT NON REMBOURSABLES:');
  const lowestRate = new Decimal(QC_TAX_BRACKETS[0].rate);

  // Crédit personnel de base
  const basicCredit = new Decimal(QC_CREDITS.basic_amount).times(lowestRate);
  console.log(`   • Crédit personnel de base: ${QC_CREDITS.basic_amount}$ × ${(lowestRate.times(100)).toFixed(0)}% = ${basicCredit.toFixed(2)}$`);

  // Crédit pour personne vivant seule
  let livingAloneCredit = new Decimal(0);
  if (isAlone) {
    livingAloneCredit = new Decimal(QC_CREDITS.living_alone_amount).times(lowestRate);
    console.log(`   • Crédit personne seule: ${QC_CREDITS.living_alone_amount}$ × ${(lowestRate.times(100)).toFixed(0)}% = ${livingAloneCredit.toFixed(2)}$`);
  }

  // Crédit d'âge (65+)
  let ageCredit = new Decimal(0);
  if (age >= 65) {
    ageCredit = new Decimal(QC_CREDITS.age_65_amount).times(lowestRate);
    console.log(`   • Crédit d'âge 65+: ${QC_CREDITS.age_65_amount}$ × ${(lowestRate.times(100)).toFixed(0)}% = ${ageCredit.toFixed(2)}$`);
  }

  const totalCredits = basicCredit.plus(livingAloneCredit).plus(ageCredit);
  console.log(`5️⃣ Crédits totaux: ${totalCredits.toFixed(2)}$`);

  // Étape 6: Impôt final
  const netTax = Decimal.max(0, tax.minus(totalCredits));
  console.log(`6️⃣ Impôt final: ${tax.toFixed(2)}$ - ${totalCredits.toFixed(2)}$ = ${netTax.toFixed(2)}$`);

  return {
    grossIncome: gross,
    taxableIncome,
    taxBeforeCredits: tax,
    totalCredits,
    netTax,
    details: {
      basicCredit,
      livingAloneCredit,
      ageCredit
    }
  };
}

// Test avec nos cas concrets
console.log('TEST 1: Personne seule, 35 ans, 45 000$');
const result1 = calculateQcTaxManual(45000, 35, true, {
  rrq: 2623.50,  // Estimation RRQ sur 45k
  ei: 594.00,    // Estimation AE sur 45k
  rqap: 222.75   // Estimation RQAP sur 45k
});

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ FINAL:');
console.log('='.repeat(60));
console.log(`Revenu brut: ${result1.grossIncome.toFixed(2)}$`);
console.log(`Revenu imposable: ${result1.taxableIncome.toFixed(2)}$`);
console.log(`Impôt brut: ${result1.taxBeforeCredits.toFixed(2)}$`);
console.log(`Crédits: ${result1.totalCredits.toFixed(2)}$`);
console.log(`Impôt final: ${result1.netTax.toFixed(2)}$`);