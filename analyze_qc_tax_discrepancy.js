/**
 * Analyse de l'écart entre notre calculateur et le calculateur officiel
 * Cas test : Personne seule, 25 ans, 15 000$ revenu brut
 */

const Decimal = require('decimal.js');

// Données du calculateur officiel MFQ
const OFFICIAL_RESULTS = {
  grossIncome: 15000,
  age: 25,
  // Résultats du scraper officiel
  qc_impot_total: -2208,   // Régime fiscal QC (NÉGATIF = crédit net)
  qc_solidarite: 1221,     // Crédit solidarité (remboursable)
  qc_prime_travail: 987,   // Prime au travail (remboursable)
  cotisations_total: -1008, // AE + RRQ + RQAP
  ae_total: -198,
  rrq_total: -736,
  rqap_total: -74
};

// Configuration 2024 actuelle
const QC_CONFIG = {
  tax_brackets: [
    { min: 0, max: 51780, rate: 0.14 },
    { min: 51780, max: 103545, rate: 0.19 },
    { min: 103545, max: 126000, rate: 0.24 },
    { min: 126000, max: 999999999, rate: 0.2575 }
  ],
  credits: {
    basic_amount: 18056,     // Confirmé par sources officielles
    age_65_amount: 3395,     // Pour 65+
    pension_amount: 3017,    // Pour revenus de retraite
    living_alone_amount: 1890 // Pour personne seule
  }
};

function analyzeDiscrepancy() {
  console.log('🔍 ANALYSE DE L\'ÉCART - IMPÔT QUÉBEC');
  console.log('=====================================');

  const gross = new Decimal(OFFICIAL_RESULTS.grossIncome);
  console.log(`Revenu brut: ${gross.toFixed(2)}$`);

  // Étape 1: Calcul des cotisations (validées à 100%)
  const totalContributions = Math.abs(OFFICIAL_RESULTS.cotisations_total);
  console.log(`Cotisations totales: ${totalContributions.toFixed(2)}$`);

  // Étape 2: Revenu imposable
  const taxableIncome = gross.minus(totalContributions);
  console.log(`Revenu imposable: ${taxableIncome.toFixed(2)}$`);

  // Étape 3: Calcul de l'impôt brut avec nos paramètres
  let taxBrut = new Decimal(0);
  if (taxableIncome.greaterThan(0)) {
    const firstBracket = Math.min(taxableIncome.toNumber(), QC_CONFIG.tax_brackets[0].max);
    taxBrut = new Decimal(firstBracket).times(QC_CONFIG.tax_brackets[0].rate);
  }
  console.log(`Impôt brut (notre calcul): ${taxBrut.toFixed(2)}$`);

  // Étape 4: Crédits non remboursables standard
  const lowestRate = new Decimal(QC_CONFIG.tax_brackets[0].rate);
  const basicCredit = new Decimal(QC_CONFIG.credits.basic_amount).times(lowestRate);
  const livingAloneCredit = new Decimal(QC_CONFIG.credits.living_alone_amount).times(lowestRate);
  const totalCredits = basicCredit.plus(livingAloneCredit);

  console.log(`\n🎯 CRÉDITS NON REMBOURSABLES:`);
  console.log(`• Crédit de base: ${QC_CONFIG.credits.basic_amount}$ × 14% = ${basicCredit.toFixed(2)}$`);
  console.log(`• Crédit personne seule: ${QC_CONFIG.credits.living_alone_amount}$ × 14% = ${livingAloneCredit.toFixed(2)}$`);
  console.log(`• Total crédits: ${totalCredits.toFixed(2)}$`);

  // Étape 5: Impôt après crédits standard
  const netTaxStandard = Decimal.max(0, taxBrut.minus(totalCredits));
  console.log(`Impôt après crédits standard: ${netTaxStandard.toFixed(2)}$`);

  // Étape 6: Comparaison avec le résultat officiel
  const officialRegimeFiscal = OFFICIAL_RESULTS.qc_impot_total;
  console.log(`\n📊 COMPARAISON:`);
  console.log(`• Notre calcul: ${netTaxStandard.toFixed(2)}$`);
  console.log(`• MFQ officiel: ${officialRegimeFiscal.toFixed(2)}$`);
  console.log(`• Écart: ${(netTaxStandard.toNumber() - officialRegimeFiscal).toFixed(2)}$`);

  // Analyse de l'écart
  console.log(`\n🔍 ANALYSE DE L'ÉCART:`);

  if (officialRegimeFiscal < 0) {
    console.log(`⚠️  PROBLÈME MAJEUR IDENTIFIÉ:`);
    console.log(`• Le régime fiscal officiel est NÉGATIF (${officialRegimeFiscal}$)`);
    console.log(`• Cela signifie que les crédits dépassent l'impôt brut`);
    console.log(`• Notre impl. force à 0 avec Decimal.max(0, ...)`);
    console.log(`• Il manque des crédits dans notre calcul OU`);
    console.log(`• L'écart provient des crédits remboursables intégrés`);

    const missingAmount = Math.abs(officialRegimeFiscal) + netTaxStandard.toNumber();
    console.log(`• Montant manquant: ${missingAmount.toFixed(2)}$`);
  }

  // Hypothèses sur les crédits manquants
  console.log(`\n💡 HYPOTHÈSES:`);
  console.log(`• Les crédits remboursables (solidarité, prime travail) sont`);
  console.log(`  peut-être inclus dans le régime fiscal total du MFQ`);
  console.log(`• Notre séparation impôt/crédits remboursables pourrait`);
  console.log(`  ne pas correspondre à la présentation officielle`);

  return {
    ourCalculation: netTaxStandard.toNumber(),
    officialResult: officialRegimeFiscal,
    discrepancy: netTaxStandard.toNumber() - officialRegimeFiscal,
    taxableIncome: taxableIncome.toNumber(),
    grossTax: taxBrut.toNumber(),
    totalCredits: totalCredits.toNumber()
  };
}

const analysis = analyzeDiscrepancy();

console.log(`\n📋 RÉSUMÉ FINAL:`);
console.log(`================`);
console.log(`Écart identifié: ${analysis.discrepancy.toFixed(2)}$`);
console.log(`Revenu imposable: ${analysis.taxableIncome.toFixed(2)}$`);
console.log(`Impôt brut: ${analysis.grossTax.toFixed(2)}$`);
console.log(`Crédits totaux: ${analysis.totalCredits.toFixed(2)}$`);