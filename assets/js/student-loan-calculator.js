(function () {
    'use strict';

    const loanBalanceInput =
        document.getElementById('loanBalance');

    const interestRateInput =
        document.getElementById('interestRate');

    const loanTermInput =
        document.getElementById('loanTerm');

    const extraPaymentInput =
        document.getElementById('extraPayment');

    const repaymentStartInput =
        document.getElementById('repaymentStart');

    const currencyInput =
        document.getElementById('currencyCode');

    const calculateButton =
        document.getElementById('calculateButton');

    const resultBox =
        document.getElementById('resultBox');

    const resultDescription =
        document.getElementById('resultDescription');

    const scheduleBody =
        document.getElementById('scheduleBody');

    const resultAlert =
        document.getElementById('resultAlert');

    const copyButton =
        document.getElementById('copyResults');

    const printButton =
        document.getElementById('printResults');

    const resetButton =
        document.getElementById('resetCalculator');

    if (
        !loanBalanceInput ||
        !interestRateInput ||
        !loanTermInput ||
        !extraPaymentInput ||
        !repaymentStartInput ||
        !currencyInput ||
        !calculateButton ||
        !resultBox ||
        !resultDescription ||
        !scheduleBody ||
        !resultAlert ||
        !copyButton ||
        !printButton ||
        !resetButton
    ) {
        return;
    }

    const resultFields = {
        requiredPayment:
            document.getElementById('requiredPayment'),

        paymentWithExtra:
            document.getElementById('paymentWithExtra'),

        totalInterest:
            document.getElementById('totalInterest'),

        totalRepaid:
            document.getElementById('totalRepaid'),

        payoffDate:
            document.getElementById('payoffDate'),

        paymentCount:
            document.getElementById('paymentCount'),

        interestSaved:
            document.getElementById('interestSaved'),

        monthsSaved:
            document.getElementById('monthsSaved'),

        baselinePayment:
            document.getElementById('baselinePayment'),

        baselineInterest:
            document.getElementById('baselineInterest'),

        baselineMonths:
            document.getElementById('baselineMonths'),

        extraPlanPayment:
            document.getElementById('extraPlanPayment'),

        extraPlanInterest:
            document.getElementById('extraPlanInterest'),

        extraPlanMonths:
            document.getElementById('extraPlanMonths')
    };

    let copyText = '';

    const prefersReducedMotion =
        window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );

    function localDateString(dateValue) {
        const year =
            dateValue.getFullYear();

        const month =
            String(
                dateValue.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                dateValue.getDate()
            ).padStart(2, '0');

        return (
            year +
            '-' +
            month +
            '-' +
            day
        );
    }

    function parseLocalDate(value) {
        if (!value) {
            return null;
        }

        const parts =
            value
                .split('-')
                .map(Number);

        if (
            parts.length !== 3 ||
            !parts.every(Number.isFinite)
        ) {
            return null;
        }

        const date =
            new Date(
                parts[0],
                parts[1] - 1,
                parts[2],
                12,
                0,
                0
            );

        if (
            date.getFullYear() !== parts[0] ||
            date.getMonth() !== parts[1] - 1 ||
            date.getDate() !== parts[2]
        ) {
            return null;
        }

        return date;
    }

    function addMonths(
        dateValue,
        amount
    ) {
        const date =
            new Date(dateValue);

        const originalDay =
            date.getDate();

        date.setDate(1);

        date.setMonth(
            date.getMonth() +
            amount
        );

        const lastDay =
            new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0
            ).getDate();

        date.setDate(
            Math.min(
                originalDay,
                lastDay
            )
        );

        return date;
    }

    function formatDate(dateValue) {
        return new Intl.DateTimeFormat(
            'en-US',
            {
                month: 'short',
                year: 'numeric'
            }
        ).format(dateValue);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat(
            'en-US',
            {
                style: 'currency',
                currency:
                    currencyInput.value,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(value);
    }

    function formatMonths(months) {
        const years =
            Math.floor(
                months / 12
            );

        const remainingMonths =
            months % 12;

        if (
            years &&
            remainingMonths
        ) {
            return (
                years +
                'y ' +
                remainingMonths +
                'm'
            );
        }

        if (years) {
            return years + 'y';
        }

        return (
            remainingMonths +
            'm'
        );
    }

    function clearError(input) {
        input.removeAttribute(
            'aria-invalid'
        );

        const existing =
            input.parentElement
                .querySelector(
                    '.field-error'
                );

        if (existing) {
            existing.remove();
        }
    }

    function showError(
        input,
        message
    ) {
        input.setAttribute(
            'aria-invalid',
            'true'
        );

        let error =
            input.parentElement
                .querySelector(
                    '.field-error'
                );

        if (!error) {
            error =
                document.createElement(
                    'span'
                );

            error.className =
                'field-error';

            error.setAttribute(
                'role',
                'alert'
            );

            input.parentElement
                .appendChild(error);
        }

        error.textContent =
            message;
    }

    function setNeutralResults() {
        resultBox.classList.remove(
            'visible'
        );

        scheduleBody.innerHTML = '';

        resultDescription.textContent =
            'Monthly payment, payoff, and amortization estimates will appear here.';

        resultAlert.textContent = '';

        Object.values(
            resultFields
        ).forEach((field) => {
            if (field) {
                field.textContent =
                    '--';
            }
        });

        copyText = '';
    }

    function monthlyPayment(
        principal,
        annualRate,
        months
    ) {
        if (annualRate === 0) {
            return (
                principal /
                months
            );
        }

        const monthlyRate =
            annualRate /
            100 /
            12;

        const factor =
            Math.pow(
                1 + monthlyRate,
                months
            );

        return (
            principal *
            monthlyRate *
            factor /
            (
                factor -
                1
            )
        );
    }

    function simulateLoan(
        principal,
        annualRate,
        scheduledPayment,
        extraPayment
    ) {
        const monthlyRate =
            annualRate /
            100 /
            12;

        const plannedPayment =
            scheduledPayment +
            extraPayment;

        const rows = [];

        let balance =
            principal;

        let month = 0;

        let totalInterest = 0;

        let totalPaid = 0;

        let yearStartBalance =
            principal;

        let yearPayments = 0;

        let yearPrincipal = 0;

        let yearInterest = 0;

        while (
            balance > 0.005 &&
            month < 1200
        ) {
            const interest =
                monthlyRate > 0
                    ? balance *
                      monthlyRate
                    : 0;

            if (
                plannedPayment <=
                    interest &&
                monthlyRate > 0
            ) {
                return {
                    valid: false
                };
            }

            const amountDue =
                balance +
                interest;

            const payment =
                Math.min(
                    plannedPayment,
                    amountDue
                );

            const principalPaid =
                Math.max(
                    0,
                    payment -
                    interest
                );

            balance =
                Math.max(
                    0,
                    balance -
                    principalPaid
                );

            totalInterest +=
                interest;

            totalPaid +=
                payment;

            yearPayments +=
                payment;

            yearPrincipal +=
                principalPaid;

            yearInterest +=
                interest;

            month += 1;

            if (
                month % 12 === 0 ||
                balance <= 0.005
            ) {
                rows.push({
                    year:
                        Math.ceil(
                            month /
                            12
                        ),

                    startingBalance:
                        yearStartBalance,

                    payments:
                        yearPayments,

                    principal:
                        yearPrincipal,

                    interest:
                        yearInterest,

                    endingBalance:
                        balance
                });

                yearStartBalance =
                    balance;

                yearPayments = 0;

                yearPrincipal = 0;

                yearInterest = 0;
            }
        }

        return {
            valid:
                balance <= 0.005,

            months:
                month,

            totalInterest:
                totalInterest,

            totalPaid:
                totalPaid,

            plannedPayment:
                plannedPayment,

            rows:
                rows
        };
    }

    function copyToClipboard(text) {
        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            return navigator.clipboard
                .writeText(text);
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const temporary =
                    document.createElement(
                        'textarea'
                    );

                temporary.value =
                    text;

                temporary.setAttribute(
                    'readonly',
                    ''
                );

                temporary.style.position =
                    'fixed';

                temporary.style.opacity =
                    '0';

                document.body.appendChild(
                    temporary
                );

                temporary.select();

                const copied =
                    document.execCommand(
                        'copy'
                    );

                temporary.remove();

                if (copied) {
                    resolve();
                } else {
                    reject(
                        new Error(
                            'Copy failed'
                        )
                    );
                }
            }
        );
    }

    function calculateLoan() {
        [
            loanBalanceInput,
            interestRateInput,
            loanTermInput,
            extraPaymentInput,
            repaymentStartInput
        ].forEach(clearError);

        const principal =
            Number.parseFloat(
                loanBalanceInput.value
            );

        const annualRate =
            Number.parseFloat(
                interestRateInput.value
            );

        const years =
            Number.parseInt(
                loanTermInput.value,
                10
            );

        const extraPaymentRaw =
            extraPaymentInput.value
                .trim();

        const extraPayment =
            extraPaymentRaw === ''
                ? 0
                : Number.parseFloat(
                      extraPaymentRaw
                  );

        const startDate =
            parseLocalDate(
                repaymentStartInput.value
            );

        let valid = true;

        let firstInvalid = null;

        if (
            !Number.isFinite(
                principal
            ) ||
            principal <= 0 ||
            principal >
                10000000
        ) {
            showError(
                loanBalanceInput,
                'Enter a balance above 0 and up to 10,000,000.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                loanBalanceInput;
        }

        if (
            !Number.isFinite(
                annualRate
            ) ||
            annualRate < 0 ||
            annualRate > 50
        ) {
            showError(
                interestRateInput,
                'Enter an annual rate from 0% to 50%.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                interestRateInput;
        }

        if (
            !Number.isFinite(
                years
            ) ||
            years < 1 ||
            years > 30
        ) {
            showError(
                loanTermInput,
                'Choose a repayment term from 1 to 30 years.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                loanTermInput;
        }

        if (
            !Number.isFinite(
                extraPayment
            ) ||
            extraPayment < 0 ||
            extraPayment >
                1000000
        ) {
            showError(
                extraPaymentInput,
                'Enter an extra payment from 0 to 1,000,000.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                extraPaymentInput;
        }

        if (!startDate) {
            showError(
                repaymentStartInput,
                'Choose a valid repayment start date.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                repaymentStartInput;
        }

        if (!valid) {
            setNeutralResults();

            if (firstInvalid) {
                firstInvalid.focus();
            }

            return;
        }

        const scheduledMonths =
            years * 12;

        const requiredPayment =
            monthlyPayment(
                principal,
                annualRate,
                scheduledMonths
            );

        const baseline =
            simulateLoan(
                principal,
                annualRate,
                requiredPayment,
                0
            );

        const accelerated =
            simulateLoan(
                principal,
                annualRate,
                requiredPayment,
                extraPayment
            );

        if (
            !baseline.valid ||
            !accelerated.valid
        ) {
            showError(
                extraPaymentInput,
                'The selected payment does not repay the loan.'
            );

            setNeutralResults();

            extraPaymentInput.focus();

            return;
        }

        const interestSaved =
            Math.max(
                0,
                baseline.totalInterest -
                    accelerated.totalInterest
            );

        const monthsSaved =
            Math.max(
                0,
                baseline.months -
                    accelerated.months
            );

        const payoffDate =
            addMonths(
                startDate,
                Math.max(
                    0,
                    accelerated.months -
                        1
                )
            );

        resultFields
            .requiredPayment
            .textContent =
            formatCurrency(
                requiredPayment
            );

        resultFields
            .paymentWithExtra
            .textContent =
            formatCurrency(
                requiredPayment +
                    extraPayment
            );

        resultFields
            .totalInterest
            .textContent =
            formatCurrency(
                accelerated
                    .totalInterest
            );

        resultFields
            .totalRepaid
            .textContent =
            formatCurrency(
                accelerated
                    .totalPaid
            );

        resultFields
            .payoffDate
            .textContent =
            formatDate(
                payoffDate
            );

        resultFields
            .paymentCount
            .textContent =
            String(
                accelerated.months
            );

        resultFields
            .interestSaved
            .textContent =
            formatCurrency(
                interestSaved
            );

        resultFields
            .monthsSaved
            .textContent =
            String(
                monthsSaved
            );

        resultFields
            .baselinePayment
            .textContent =
            formatCurrency(
                requiredPayment
            );

        resultFields
            .baselineInterest
            .textContent =
            formatCurrency(
                baseline
                    .totalInterest
            );

        resultFields
            .baselineMonths
            .textContent =
            formatMonths(
                baseline.months
            );

        resultFields
            .extraPlanPayment
            .textContent =
            formatCurrency(
                requiredPayment +
                    extraPayment
            );

        resultFields
            .extraPlanInterest
            .textContent =
            formatCurrency(
                accelerated
                    .totalInterest
            );

        resultFields
            .extraPlanMonths
            .textContent =
            formatMonths(
                accelerated.months
            );

        resultDescription.textContent =
            'Fixed-rate estimate for ' +
            formatCurrency(
                principal
            ) +
            ' at ' +
            annualRate.toFixed(2) +
            '% over ' +
            years +
            ' years.';

        scheduleBody.innerHTML =
            '';

        accelerated.rows.forEach(
            (row) => {
                const tableRow =
                    document.createElement(
                        'tr'
                    );

                [
                    'Year ' +
                        row.year,

                    formatCurrency(
                        row.startingBalance
                    ),

                    formatCurrency(
                        row.payments
                    ),

                    formatCurrency(
                        row.principal
                    ),

                    formatCurrency(
                        row.interest
                    ),

                    formatCurrency(
                        row.endingBalance
                    )
                ].forEach(
                    (value) => {
                        const cell =
                            document.createElement(
                                'td'
                            );

                        cell.textContent =
                            value;

                        tableRow.appendChild(
                            cell
                        );
                    }
                );

                scheduleBody.appendChild(
                    tableRow
                );
            }
        );

        const alertParts = [
            'This is a fixed-payment estimate. Actual federal or private loan billing can differ because of daily interest, fees, repayment-plan rules, variable rates, capitalization, or payment timing.'
        ];

        if (
            extraPayment > 0
        ) {
            alertParts.push(
                'Confirm how your servicer applies amounts above the required payment and whether you need to give instructions for a specific loan.'
            );
        }

        resultAlert.textContent =
            alertParts.join(' ');

        resultBox.classList.add(
            'visible'
        );

        resultBox.scrollIntoView({
            behavior:
                prefersReducedMotion.matches
                    ? 'auto'
                    : 'smooth',

            block: 'start'
        });

        copyText =
            'STUDENT LOAN CALCULATOR RESULTS\n';

        copyText +=
            'Loan balance: ' +
            formatCurrency(
                principal
            ) +
            '\n';

        copyText +=
            'Annual rate: ' +
            annualRate.toFixed(2) +
            '%\n';

        copyText +=
            'Term: ' +
            years +
            ' years\n';

        copyText +=
            'Required monthly payment: ' +
            formatCurrency(
                requiredPayment
            ) +
            '\n';

        copyText +=
            'Monthly payment with extra: ' +
            formatCurrency(
                requiredPayment +
                    extraPayment
            ) +
            '\n';

        copyText +=
            'Estimated total interest: ' +
            formatCurrency(
                accelerated
                    .totalInterest
            ) +
            '\n';

        copyText +=
            'Estimated total repaid: ' +
            formatCurrency(
                accelerated
                    .totalPaid
            ) +
            '\n';

        copyText +=
            'Estimated payoff: ' +
            formatDate(
                payoffDate
            ) +
            '\n';

        copyText +=
            'Interest saved: ' +
            formatCurrency(
                interestSaved
            ) +
            '\n';

        copyText +=
            'Months saved: ' +
            monthsSaved +
            '\n';

        if (
            typeof window.gtag ===
            'function'
        ) {
            window.gtag(
                'event',
                'calculator_used',
                {
                    tool:
                        'student_loan_calculator'
                }
            );
        }
    }

    const today =
        new Date();

    repaymentStartInput.value =
        localDateString(
            addMonths(
                today,
                1
            )
        );

    [
        loanBalanceInput,
        interestRateInput,
        loanTermInput,
        extraPaymentInput,
        repaymentStartInput,
        currencyInput
    ].forEach((input) => {
        input.addEventListener(
            'input',
            () => {
                clearError(input);
                setNeutralResults();
            }
        );

        input.addEventListener(
            'change',
            () => {
                clearError(input);
                setNeutralResults();
            }
        );
    });

    calculateButton.addEventListener(
        'click',
        calculateLoan
    );

    copyButton.addEventListener(
        'click',
        async () => {
            const text =
                copyText ||
                'Calculate results first.';

            const label =
                copyButton.querySelector(
                    'span'
                );

            const original =
                label.textContent;

            try {
                await copyToClipboard(
                    text
                );

                label.textContent =
                    'Copied';
            } catch (error) {
                label.textContent =
                    'Copy failed';
            }

            window.setTimeout(
                () => {
                    label.textContent =
                        original;
                },
                1500
            );
        }
    );

    printButton.addEventListener(
        'click',
        () => {
            window.print();
        }
    );

    resetButton.addEventListener(
        'click',
        () => {
            loanBalanceInput.value =
                '30000';

            interestRateInput.value =
                '6.5';

            loanTermInput.value =
                '10';

            extraPaymentInput.value =
                '50';

            repaymentStartInput.value =
                localDateString(
                    addMonths(
                        new Date(),
                        1
                    )
                );

            currencyInput.value =
                'USD';

            [
                loanBalanceInput,
                interestRateInput,
                loanTermInput,
                extraPaymentInput,
                repaymentStartInput
            ].forEach(clearError);

            setNeutralResults();

            loanBalanceInput.focus();
        }
    );

    setNeutralResults();
}());
