const explanations: Record<string, { title: string; content: string }> = {
  taxYear: {
    title: "Tax Year",
    content:
      "The UK tax year runs from 6 April to 5 April the following year. Tax rates, thresholds, and allowances change each year. Select the tax year you want to calculate for. The 2022/23 year uses estimated effective NI rates due to mid-year rate changes.",
  },
  selfEmployed: {
    title: "Self-employed",
    content:
      "Treat the salary field as your annual trading profits. Class 2 and Class 4 National Insurance contributions replace employee (Class 1) NI, and there is no employer NI. Class 2 was abolished from April 2024 (it remains available as a voluntary contribution — not modelled here). Income tax, student loans, dividends, and personal pension contributions work as normal. Payments on account and Making Tax Digital are not modelled.",
  },
  residentInScotland: {
    title: "Resident in Scotland",
    content:
      "If you are a Scottish taxpayer, you pay Scottish Income Tax rates instead of the rest-of-UK rates. Scotland has more tax bands (currently six: starter, basic, intermediate, higher, advanced, and top rate) compared to three for the rest of the UK. National Insurance is the same across the UK.",
  },
  noNI: {
    title: "Exclude NI",
    content:
      "Toggle this if you do not pay National Insurance contributions — for example, if you are over State Pension age. Employees over State Pension age do not pay Employee NI, but their employer still pays Employer NI.",
  },
  blind: {
    title: "Blind Person's Allowance",
    content:
      "If you are registered blind (or severely sight-impaired), you receive an additional tax-free allowance on top of the standard Personal Allowance. This reduces your taxable income and therefore the amount of income tax you pay.",
  },
  childBenefits: {
    title: "Child Benefits",
    content:
      "Child Benefit is a regular payment from the government to help with the cost of raising children. It is paid to anyone responsible for a child under 16 (or under 20 if in approved education or training). However, if the higher-income parent earns above the HICBC threshold, a tax charge (High Income Child Benefit Charge) claws back some or all of the benefit.",
  },
  numberOfChildren: {
    title: "Number of Children",
    content:
      "The first child receives a higher weekly rate of Child Benefit than subsequent children. The total benefit increases with each additional child, but at the lower per-child rate for the second child onwards.",
  },
  studentLoan: {
    title: "Student Loans",
    content:
      "Student loan repayments are deducted from your pay once you earn above the repayment threshold for your plan type. Plan 1 covers pre-2012 English/Welsh and all Northern Irish loans. Plan 2 covers post-2012 English/Welsh loans. Plan 4 covers Scottish loans. Plan 5 covers post-2023 English loans. Postgraduate loans are for Master's or Doctoral loans and are repaid at a lower rate alongside other plans.",
  },
  autoEnrolment: {
    title: "Auto Enrolment",
    content:
      "Auto enrolment is the government's workplace pension scheme. Your employer must automatically enrol you and contribute to a pension. The percentage you enter here is your employee contribution rate. The legal minimum total contribution is 8% of qualifying earnings, with at least 3% from your employer — enter the employer rate in the field below.",
  },
  employerNISavingsToPension: {
    title: "Employer NI Savings to Pension",
    content:
      "When you sacrifice salary, your employer saves the employer National Insurance they would have paid on that amount (15% for 2025/26). Some employers pass some or all of this saving into your pension as an extra contribution. Enable this if your employer contributes their full NI saving — it's added to your pension pot on top of the sacrificed amount.",
  },
  dbPensionEnabled: {
    title: "Defined Benefit Scheme",
    content:
      "Defined benefit (final salary or career average) schemes pay a guaranteed annual pension rather than building a pot — common in the public sector (NHS, Teachers', LGPS, Civil Service). Your contributions are taken under a 'net pay arrangement': deducted from gross pay before income tax, so you get full marginal-rate relief automatically, but unlike salary sacrifice they do not reduce National Insurance. Career-average revaluation and lump sums are not modelled.",
  },
  dbMemberContribution: {
    title: "DB Member Contribution",
    content:
      "The percentage of your salary you pay into the defined benefit scheme (public sector schemes typically use tiered rates between about 5% and 12% depending on salary — enter your tier's rate). Deducted before income tax (full marginal relief), but still subject to National Insurance.",
  },
  dbAccrualDenominator: {
    title: "Accrual Rate",
    content:
      "How much annual pension you earn per year of service, as a fraction of your pensionable salary. Examples: 1/49 for LGPS, 1/54 for the 2015 NHS scheme, 1/57 for Teachers' career-average. For the pension annual allowance, defined benefit growth is valued at 16x the pension accrued in the year.",
  },
  autoEnrolmentOnQualifyingEarnings: {
    title: "On Qualifying Earnings",
    content:
      "By law, minimum auto enrolment contributions are calculated on 'qualifying earnings' — the slice of your pay between the lower and upper limits set each year by the DWP (£6,240 to £50,270 for recent tax years) — not on your whole salary. Many schemes, however, contribute on full or pensionable pay. Enable this switch if your scheme uses the statutory qualifying earnings band; leave it off if contributions are a percentage of your full pay.",
  },
  autoEnrolmentEmployer: {
    title: "Auto Enrolment (employer)",
    content:
      "Your employer's contribution rate to your workplace pension. The legal minimum is 3% of qualifying earnings, but many employers pay more or match extra employee contributions. Employer contributions go straight into your pension pot — they are paid on top of your salary and don't affect your take-home pay or taxes.",
  },
  autoEnrolmentAsSalarySacrifice: {
    title: "Auto Enrolment as Salary Sacrifice",
    content:
      "When enabled, your auto enrolment contributions are treated as salary sacrifice. This means they are deducted from your gross pay before tax and National Insurance are calculated, saving you NI contributions compared to a standard (relief at source) pension. Many employers offer this arrangement.",
  },
  salarySacrifice: {
    title: "Salary/Bonus Sacrifice",
    content:
      "Salary sacrifice is an arrangement where you agree to reduce your contractual salary in exchange for a non-cash benefit, typically an employer pension contribution. Because your gross pay is reduced, you save on both Income Tax and National Insurance. Enter the annual total sacrificed from your salary and/or bonus — click the £/% button to switch between a fixed amount and a percentage of your gross income.",
  },
  personalContributions: {
    title: "Personal Pension Contributions",
    content:
      "Personal pension contributions are voluntary payments you make to a pension from your net (after-tax) pay. If 'Relief at source' is enabled, your pension provider claims basic rate tax relief (20%) from HMRC and adds it to your pot. Higher/additional rate taxpayers can reclaim further relief via self-assessment. This tool models the full tax relief effect.",
  },
  taxReliefAtSource: {
    title: "Relief at Source",
    content:
      "Relief at source is a method of providing tax relief on personal pension contributions. Under this system, your pension provider claims basic rate tax relief (currently 20%) from HMRC on your behalf and adds it to your pension pot. For example, if you contribute £80, the provider claims £20 from HMRC, making the gross contribution £100. Higher and additional rate taxpayers can claim further relief through self-assessment. Note: if you do not pay Income Tax (e.g. because your income is below the Personal Allowance), relief at source only applies to the first £2,880 of contributions per tax year (grossed up to £3,600).",
  },
  annualGrossSalary: {
    title: "Annual Gross Salary",
    content:
      "Your total annual salary before any deductions (tax, NI, pension, student loan). This is the contractual salary your employer pays you, sometimes called your 'headline' salary. Do not include bonuses — enter those separately.",
  },
  annualGrossBonus: {
    title: "Annual Gross Bonus",
    content:
      "Any additional lump-sum payments on top of your salary, such as annual bonuses or commissions. Bonuses are taxed as part of your total income. If you salary-sacrifice part of your bonus into a pension, enter the sacrifice amount in the pension section.",
  },
  annualGrossDividends: {
    title: "Annual Gross Dividends",
    content:
      "Dividend income from shares, before any tax. Dividends are taxed after your other income, at dividend rates (8.75% / 33.75% / 39.35% for recent years) with a tax-free dividend allowance (£500 for 2024/25 onwards). There is no National Insurance on dividends, and Scottish residents pay the UK-wide dividend rates — Scottish income tax rates don't apply. This tool doesn't count dividends toward student loan repayments.",
  },
  workingDaysPerWeek: {
    title: "Working Days per Week",
    content:
      "Model a part-time working pattern. Enter your full-time salary above, then pick how many days a week you work — the salary is scaled proportionally (e.g. 4 days = 80% of full-time pay) so you can see what dropping to a 4- or 3-day week would mean for your taxes and take-home pay. Your bonus is not scaled.",
  },
  annualGrossIncomeRange: {
    title: "Annual Gross Income Range",
    content:
      "The maximum income shown on the X-axis of the Income Explorer charts. Adjust this to zoom in or out on the income range. For example, set to £60,000 to focus on basic/higher rate thresholds, or £200,000+ to see the additional rate and personal allowance taper.",
  },
  result_annualGrossIncome: {
    title: "Annual Gross Income",
    content:
      "Your total annual income before any deductions. This is the sum of your salary and bonus. It is the starting point for all tax calculations.",
  },
  result_adjustedNetIncome: {
    title: "Adjusted Net Income",
    content:
      "Your gross income minus pension contributions (salary sacrifice and grossed-up personal contributions). HMRC uses this figure to determine your Personal Allowance taper (which starts at £100,000) and your High Income Child Benefit Charge. Increasing pension contributions reduces your Adjusted Net Income.",
  },
  result_taxAllowance: {
    title: "Tax Allowance",
    content:
      "The amount of income you can earn tax-free, also known as the Personal Allowance. The standard allowance is £12,570, but it is reduced by £1 for every £2 of adjusted net income above £100,000, reaching zero at £125,140. The Blind Person's Allowance is added on top if applicable.",
  },
  result_employerNI: {
    title: "Employer NI",
    content:
      "National Insurance contributions paid by your employer on top of your salary. This does not reduce your take-home pay but is a real cost to your employer. It is shown here for transparency and to understand the total cost of employment. Employer NI is calculated on your salary after salary sacrifice deductions.",
  },
  result_combinedTaxes: {
    title: "Total You Pay",
    content:
      "The total amount deducted from your income: Income Tax + Employee National Insurance + Student Loan repayments. This is the sum of all compulsory deductions (not including pension contributions, which are voluntary).",
  },
  result_incomeTax: {
    title: "Income Tax",
    content:
      "Tax charged on your taxable income (gross income minus tax allowance, minus pension relief). It is calculated in bands: each band has a rate applied only to income within that band's range. The breakdown shows how much of your income falls into each band and the tax charged on it.",
  },
  result_employeeNI: {
    title: "Employee NI",
    content:
      "National Insurance contributions deducted from your pay. You pay NI on earnings between the Primary Threshold and Upper Earnings Limit at the main rate, and a lower rate on earnings above the Upper Earnings Limit. NI is calculated on your salary after salary sacrifice deductions.",
  },
  result_studentLoan: {
    title: "Student Loan Repayments",
    content:
      "Repayments deducted from your pay for outstanding student loans. You repay 9% of income above your plan's threshold (6% for postgraduate loans). If you have multiple plans, the highest threshold is used for non-postgraduate plans and repayments are split proportionally.",
  },
  result_totalYouKeep: {
    title: "Total You Keep",
    content:
      "The total value you receive from your employment: Take Home Pay (cash in your bank) + Pension Pot (saved for retirement) + Child Benefits (if claimed). This represents the full financial value of your employment package.",
  },
  result_takeHomePay: {
    title: "Take Home Pay",
    content:
      "The cash you actually receive in your bank account after all deductions: Income Tax, Employee NI, Student Loan repayments, and pension contributions. This is your net pay — the money available to spend.",
  },
  result_pensionPot: {
    title: "Pension Pot",
    content:
      "The total annual amount going into your pension from all sources: auto enrolment, salary sacrifice, and personal contributions (grossed up with tax relief if applicable). This is money saved for your retirement.",
  },
  result_childBenefits: {
    title: "Child Benefits",
    content:
      "The net Child Benefit you receive after the High Income Child Benefit Charge (HICBC). If the higher-income parent earns above the HICBC threshold, a percentage of the benefit is clawed back as a tax charge. Above a certain income, the full benefit is charged back, making the net benefit zero.",
  },
};

export default explanations;
