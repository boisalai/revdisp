# 💰 Quebec Disposable Income Calculator

[![Deploy to GitHub Pages](https://github.com/boisalai/revdisp/actions/workflows/deploy.yml/badge.svg)](https://github.com/boisalai/revdisp/actions/workflows/deploy.yml)
[![Live Calculator](https://img.shields.io/badge/Calculator-Live-brightgreen?style=for-the-badge)](https://boisalai.github.io/revdisp/)

*A modern, accurate Quebec tax and disposable income calculator*

---

## 🌐 **[► USE THE CALCULATOR](https://boisalai.github.io/revdisp/)**

---

## 🎯 **What is this?**

This is a **comprehensive Quebec disposable income calculator** that accurately computes your taxes, social insurance contributions, and government transfers. It replicates the functionality of the official Quebec Ministry of Finance calculator with a modern, user-friendly interface.

**Perfect for:**
- 🏠 **Families** planning their household budget
- 💼 **Workers** understanding their net income
- 🏛️ **Tax professionals** needing accurate calculations  
- 📊 **Researchers** studying Quebec fiscal policy
- 🎓 **Students** learning about tax systems

---

## ✨ **Key Features**

- ✅ **All Quebec contributions**: Quebec Pension Plan (QPP), Employment Insurance (EI), Quebec Parental Insurance Plan (QPIP), Health Services Fund (HSF), Quebec prescription drug insurance (RAMQ)
- 🏠 **All household types**: Single person, couples, single parents, retirees
- 🌍 **Bilingual interface**: Full French/English support
- 📱 **Professional design**: Government-grade interface following GOV.UK design standards
- 🔍 **Automatic validation**: Continuously tested against official government calculator
- 📅 **Current tax years**: 2023, 2024, and 2025 parameters
- ⚡ **Real-time calculations**: Instant results as you adjust income sliders

---

## 📊 **Accuracy & Validation**

Our calculator is **automatically validated** against the official Quebec Ministry of Finance calculator to ensure accuracy:

| **Contribution** | **Accuracy** | **Tests** | **Status** |
|------------------|--------------|-----------|------------|
| **RAMQ** (Drug Insurance) | 100% ✅ | 3/3 tests passed | ✅ **Excellent** |
| **RRQ** (Quebec Pension) | 99.7% ✅ | Minor variance <$11 | ✅ **Excellent** |
| **Employment Insurance** | 100% ✅ | 6/6 tests passed | ✅ **Perfect** |
| **QPIP** (Parental Insurance) | 100% ✅ | 6/6 tests passed | ✅ **Perfect** |
| **HSF** (Health Services Fund) | 100% ✅ | 6/6 tests passed | ✅ **Perfect** |

---

## 🧮 **How to Use**

1. **Visit the calculator**: [boisalai.github.io/revdisp](https://boisalai.github.io/revdisp/)
2. **Select your situation**:
   - Tax year (2023, 2024, or 2025)
   - Household type (single, couple, single parent, retiree)
3. **Enter your information**:
   - Your age
   - Gross employment income (or retirement income if 65+)
   - Spouse information (if applicable)
4. **View your results**:
   - Detailed breakdown of all taxes and contributions
   - Net disposable income calculation
   - Quebec prescription drug insurance requirements

---

## 🏛️ **Official Sources**

This calculator uses **official government parameters** from:

- [Quebec Ministry of Finance - Disposable Income Calculator](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp)
- [RAMQ - Quebec prescription drug insurance](https://www.ramq.gouv.qc.ca/en)
- [Retraite Québec - Quebec Pension Plan](https://www.rrq.gouv.qc.ca/en)
- [QPIP - Quebec Parental Insurance Plan](https://www.rqap.gouv.qc.ca/a_propos_regime/information_generale/index_en.asp)
- [Revenu Québec - Health Services Fund](https://www.revenuquebec.ca/en/)

---

## 💡 **Understanding Your Results**

The calculator shows several key components:

**🟢 Contributions (Money you pay):**
- **Employment Insurance (EI)**: Federal program for unemployment benefits
- **Quebec Parental Insurance Plan (QPIP)**: Quebec program for parental/maternity leave
- **Quebec Pension Plan (RRQ)**: Quebec retirement savings program  
- **Health Services Fund (FSS)**: Quebec health funding (age 65+ only)
- **RAMQ**: Quebec prescription drug insurance premium

**🔵 Provincial Tax Regimes:**
- **Quebec Tax**: Provincial income tax
- **Federal Tax**: Federal income tax

**🟡 Special Cases:**
- **RAMQ Drug Insurance**: Shows if you must join the public plan or can opt for private insurance
- **Age-based rules**: Different calculations for working age (18-64) vs. retirement age (65+)

---

## 🛡️ **Privacy & Security**

- 🔒 **No data collection**: Your information never leaves your browser
- 🌐 **Client-side only**: All calculations happen on your device
- 📱 **Offline capable**: Works without internet after initial load
- 🔐 **HTTPS secure**: Encrypted connection for your safety

---

## 🛠️ **For Developers**

### **Technology Stack**
- **Next.js 14** - Modern React framework
- **TypeScript** - Complete type safety
- **Tailwind CSS** - Professional GOV.UK design system
- **Decimal.js** - Precise monetary calculations
- **GitHub Actions** - Automated deployment and validation

### **Quick Start**
```bash
git clone https://github.com/boisalai/revdisp.git
cd revdisp
npm install
npm run dev    # Development server on http://localhost:3001
```

### **Quality Assurance**
```bash
npm run validate    # Run all validation tests against official calculator
npm run check       # Complete pre-deployment validation
npm run test-prod   # Test production build locally
```

### **Project Structure**
```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/
│   ├── calculators/        # Tax and contribution calculators
│   ├── config/            # Tax year configurations (2023-2025)
│   ├── models/            # TypeScript data models
│   ├── validation/        # Automated testing against gov calculator
│   └── i18n/              # French/English translations
```

---

## 🤝 **Contributing**

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/improvement`
3. **Commit** your changes: `git commit -m 'feat: add new feature'`
4. **Push** to the branch: `git push origin feature/improvement`
5. **Open** a Pull Request

**Before contributing:**
- Run `npm run check` to ensure all tests pass
- Follow the existing code style and TypeScript patterns
- Add validation tests for new tax calculations

---

## ⚖️ **Legal Disclaimer**

This calculator is provided **for informational purposes only**. While we strive for accuracy and regularly validate against official sources, this tool should not replace professional tax advice or official government calculators for legal or financial decisions.

For official calculations, please consult:
- [Quebec Ministry of Finance Calculator](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp)
- A qualified tax professional

---

## 📄 **License**

MIT License - See [LICENSE](LICENSE) file for details

---

## 🌟 **Star this project**

If you find this calculator useful, please ⭐ **star this repository** to help others discover it!

---

**🇨🇦 Made with ❤️ in Quebec**