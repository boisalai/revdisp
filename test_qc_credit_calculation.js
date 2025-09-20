/**
 * Test du calcul du crédit pour personne vivant seule
 * Cas : 25 ans, 15 000$ revenu brut
 */

const Decimal = require('decimal.js');

// Paramètres officiels 2024 pour crédit personne seule
const LIVING_ALONE_CONFIG = {
  base_amount: 2069,           // Montant de base
  single_parent_supplement: 2554, // Supplément famille monoparentale
  reduction_threshold: 40925,   // Seuil de réduction
  reduction_rate: 0.1875       // Taux de réduction 18.75%
};

const TAX_RATE = 0.14; // Taux de crédit 14%

function testLivingAloneCredit() {
  console.log('🧮 TEST DU CRÉDIT POUR PERSONNE VIVANT SEULE');
  console.log('='.repeat(50));

  // Cas test : 25 ans, 15 000$ revenu brut
  const grossIncome = 15000;
  const age = 25;
  const cotisations = 1008; // AE + RRQ + RQAP selon scraper

  // Revenu net approximatif (pour seuils de réduction)
  const netIncome = grossIncome - cotisations; // 13 992$
  console.log(`Revenu brut: ${grossIncome}$`);
  console.log(`Cotisations: ${cotisations}$`);
  console.log(`Revenu net (approximatif): ${netIncome}$`);

  // Calcul du crédit pour personne vivant seule
  const baseAmount = new Decimal(LIVING_ALONE_CONFIG.base_amount);
  const reductionThreshold = new Decimal(LIVING_ALONE_CONFIG.reduction_threshold);
  const netIncomeDecimal = new Decimal(netIncome);

  console.log(`\n🎯 CALCUL DU CRÉDIT:`);
  console.log(`Montant de base: ${baseAmount.toFixed(2)}$`);
  console.log(`Seuil de réduction: ${reductionThreshold.toFixed(2)}$`);

  // Aucune réduction car revenu net < seuil
  let eligibleAmount = baseAmount;
  if (netIncomeDecimal.greaterThan(reductionThreshold)) {
    const excessIncome = netIncomeDecimal.minus(reductionThreshold);
    const reductionRate = new Decimal(LIVING_ALONE_CONFIG.reduction_rate);
    const reduction = excessIncome.times(reductionRate);
    eligibleAmount = Decimal.max(0, baseAmount.minus(reduction));

    console.log(`Excédent de revenu: ${excessIncome.toFixed(2)}$`);
    console.log(`Réduction: ${reduction.toFixed(2)}$`);
  } else {
    console.log(`Pas de réduction (revenu < seuil)`);
  }

  console.log(`Montant admissible: ${eligibleAmount.toFixed(2)}$`);

  // Conversion en crédit d'impôt
  const taxRate = new Decimal(TAX_RATE);
  const creditAmount = eligibleAmount.times(taxRate);

  console.log(`\n💰 CRÉDIT FINAL:`);
  console.log(`${eligibleAmount.toFixed(2)}$ × ${(taxRate.times(100)).toFixed(0)}% = ${creditAmount.toFixed(2)}$`);

  // Comparaison avec notre ancienne méthode
  const oldAmount = new Decimal(1890); // Ancien paramètre
  const oldCredit = oldAmount.times(taxRate);

  console.log(`\n📊 COMPARAISON:`);
  console.log(`• Nouveau calcul: ${creditAmount.toFixed(2)}$`);
  console.log(`• Ancien calcul: ${oldCredit.toFixed(2)}$`);
  console.log(`• Amélioration: +${creditAmount.minus(oldCredit).toFixed(2)}$`);

  // Calcul total des crédits
  const basicPersonalAmount = new Decimal(18056);
  const basicCredit = basicPersonalAmount.times(taxRate);
  const totalCredits = basicCredit.plus(creditAmount);

  console.log(`\n🎯 CRÉDITS TOTAUX:`);
  console.log(`• Crédit personnel de base: ${basicCredit.toFixed(2)}$`);
  console.log(`• Crédit personne seule: ${creditAmount.toFixed(2)}$`);
  console.log(`• Total crédits: ${totalCredits.toFixed(2)}$`);

  return {
    livingAloneCredit: creditAmount.toNumber(),
    totalCredits: totalCredits.toNumber(),
    improvement: creditAmount.minus(oldCredit).toNumber()
  };
}

const result = testLivingAloneCredit();

console.log(`\n📋 RÉSUMÉ:`);
console.log(`Crédit personne seule: ${result.livingAloneCredit.toFixed(2)}$`);
console.log(`Amélioration vs ancien: +${result.improvement.toFixed(2)}$`);
console.log(`Total crédits: ${result.totalCredits.toFixed(2)}$`);