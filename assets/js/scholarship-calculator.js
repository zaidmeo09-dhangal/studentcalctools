(() => {
    'use strict';

    const form = document.getElementById('scholarshipForm');
    const yearsInput = document.getElementById('estimateYears');
    const increaseInput = document.getElementById('costIncrease');
    const rows = document.getElementById('aidRows');
    const addAidButton = document.getElementById('addAid');
    const resultBox = document.getElementById('resultBox');
    const resultDescription = document.getElementById('resultDescription');
    const tableBody = document.getElementById('yearTableBody');
    const resultAlert = document.getElementById('resultAlert');
    const copyButton = document.getElementById('copyResults');
    const printButton = document.getElementById('printResults');
    const resetButton = document.getElementById('resetCalculator');
    const errorBox = document.getElementById('calcError');

    if (
        !form ||
        !yearsInput ||
        !increaseInput ||
        !rows ||
        !addAidButton ||
        !resultBox ||
        !resultDescription ||
        !tableBody ||
        !resultAlert ||
        !copyButton ||
        !printButton ||
        !resetButton ||
        !errorBox
    ) {
        return;
    }

    const costInputs = Array.from(
        document.querySelectorAll('.cost-input')
    );

    const resourceInputs = Array.from(
        document.querySelectorAll('.resource-input')
    );

    const initialRowsHTML = rows.innerHTML;

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );

    const outputs = {
        yearOneCost:
            document.getElementById('yearOneCost'),

        yearOneAid:
            document.getElementById('yearOneAid'),

        yearOneNet:
            document.getElementById('yearOneNet'),

        yearOneGap:
            document.getElementById('yearOneGap'),

        coveragePercent:
            document.getElementById('coveragePercent'),

        projectedNet:
            document.getElementById('projectedNet'),

        projectedLoans:
            document.getElementById('projectedLoans'),

        projectedGap:
            document.getElementById('projectedGap')
    };

    if (
        Object.values(outputs)
            .some((output) => !output)
    ) {
        return;
    }

    const defaultValues = {
        years: '4',

        increase: '3',

        costs: [
            '20000',
            '10000',
            '1200',
            '1200',
            '1600',
            '1000'
        ],

        resources: [
            '5000',
            '2000',
            '5500'
        ]
    };

    let copyText = '';

    function money(value) {
        return new Intl.NumberFormat(
            'en-US',
            {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }
        ).format(
            Math.round(value)
        );
    }

    function optionalNumber(input) {
        const raw =
            input.value.trim();

        if (raw === '') {
            return 0;
        }

        const number =
            Number(raw);

        return Number.isFinite(number)
            ? number
            : null;
    }

    function clearAllErrors() {
        errorBox.hidden = true;
        errorBox.textContent = '';

        document
            .querySelectorAll(
                '#scholarshipForm .calc-input'
            )
            .forEach((input) => {
                input.removeAttribute(
                    'aria-invalid'
                );
            });
    }

    function failValidation(
        input,
        message
    ) {
        input.setAttribute(
            'aria-invalid',
            'true'
        );

        errorBox.textContent =
            message;

        errorBox.hidden =
            false;

        input.focus();

        return null;
    }

    function setNeutralResults() {
        resultBox.classList.remove(
            'visible'
        );

        resultDescription.textContent =
            'Estimated annual and multi-year costs will appear here.';

        tableBody.innerHTML = '';

        resultAlert.textContent = '';

        copyText = '';

        Object
            .values(outputs)
            .forEach((output) => {
                output.textContent =
                    '--';
            });
    }

    function createAidRow() {
        const row =
            document.createElement(
                'div'
            );

        row.className =
            'aid-row';

        row.innerHTML = `
            <input
                class="calc-input aid-name"
                type="text"
                placeholder="Award name"
                aria-label="Award name">

            <select
                class="calc-input aid-type"
                aria-label="Award type">

                <option>Scholarship</option>
                <option>Grant</option>
                <option>Tuition waiver</option>
                <option>Employer benefit</option>
                <option>Other gift aid</option>
            </select>

            <input
                class="calc-input aid-amount"
                type="number"
                min="0"
                step="100"
                value="0"
                aria-label="Annual award amount">

            <select
                class="calc-input aid-years"
                aria-label="Renewable years">

                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3 years</option>
                <option value="4">4 years</option>
            </select>

            <button
                class="calc-remove"
                type="button"
                aria-label="Remove award">
                ×
            </button>
        `;

        return row;
    }

    function validateAndCollect() {
        clearAllErrors();

        const years =
            Number.parseInt(
                yearsInput.value,
                10
            );

        if (
            !Number.isInteger(years) ||
            years < 1 ||
            years > 4
        ) {
            return failValidation(
                yearsInput,
                'Choose an estimate period from 1 to 4 academic years.'
            );
        }

        const increase =
            optionalNumber(
                increaseInput
            );

        if (
            increase === null ||
            increase < 0 ||
            increase > 20
        ) {
            return failValidation(
                increaseInput,
                'Enter an annual increase from 0% to 20%.'
            );
        }

        let annualCost = 0;

        for (
            const input
            of costInputs
        ) {
            const amount =
                optionalNumber(
                    input
                );

            if (
                amount === null ||
                amount < 0
            ) {
                return failValidation(
                    input,
                    'Enter 0 or more.'
                );
            }

            annualCost += amount;
        }

        if (annualCost <= 0) {
            return failValidation(
                costInputs[0],
                'Enter at least one college cost.'
            );
        }

        const resourceValues = [];

        for (
            const input
            of resourceInputs
        ) {
            const amount =
                optionalNumber(
                    input
                );

            if (
                amount === null ||
                amount < 0
            ) {
                return failValidation(
                    input,
                    'Enter 0 or more.'
                );
            }

            resourceValues.push(
                amount
            );
        }

        const awards = [];

        for (
            const row
            of rows.querySelectorAll(
                '.aid-row'
            )
        ) {
            const nameInput =
                row.querySelector(
                    '.aid-name'
                );

            const amountInput =
                row.querySelector(
                    '.aid-amount'
                );

            const yearsSelect =
                row.querySelector(
                    '.aid-years'
                );

            const amount =
                optionalNumber(
                    amountInput
                );

            const name =
                nameInput.value.trim();

            const renewableYears =
                Number.parseInt(
                    yearsSelect.value,
                    10
                );

            if (
                amount === null ||
                amount < 0
            ) {
                return failValidation(
                    amountInput,
                    'Enter an award amount of 0 or more.'
                );
            }

            if (
                !Number.isInteger(
                    renewableYears
                ) ||
                renewableYears < 1 ||
                renewableYears > 4
            ) {
                return failValidation(
                    yearsSelect,
                    'Choose renewable years from 1 to 4.'
                );
            }

            if (
                amount > 0 &&
                !name
            ) {
                return failValidation(
                    nameInput,
                    'Enter an award name.'
                );
            }

            if (amount > 0) {
                awards.push({
                    name,
                    amount,
                    years:
                        renewableYears
                });
            }
        }

        return {
            years,
            increase,
            annualCost,
            awards,

            family:
                resourceValues[0],

            work:
                resourceValues[1],

            loans:
                resourceValues[2]
        };
    }

    function calculate(values) {
        const projections = [];

        let totalNet = 0;
        let totalLoans = 0;
        let totalGap = 0;
        let excess = 0;

        for (
            let year = 1;
            year <= values.years;
            year += 1
        ) {
            const cost =
                values.annualCost *
                Math.pow(
                    1 +
                    values.increase /
                    100,
                    year - 1
                );

            const aid =
                values.awards.reduce(
                    (
                        sum,
                        award
                    ) => {
                        return (
                            sum +
                            (
                                year <=
                                award.years
                                    ? award.amount
                                    : 0
                            )
                        );
                    },
                    0
                );

            const net =
                Math.max(
                    0,
                    cost - aid
                );

            const remainingAfterFamilyAndWork =
                Math.max(
                    0,
                    net -
                    values.family -
                    values.work
                );

            const actualLoans =
                Math.min(
                    values.loans,
                    remainingAfterFamilyAndWork
                );

            const gap =
                Math.max(
                    0,
                    remainingAfterFamilyAndWork -
                    actualLoans
                );

            projections.push({
                year,
                cost,
                aid,
                net,

                family:
                    values.family,

                work:
                    values.work,

                loans:
                    actualLoans,

                gap
            });

            totalNet += net;

            totalLoans +=
                actualLoans;

            totalGap += gap;

            excess +=
                Math.max(
                    0,
                    aid - cost
                );
        }

        return {
            projections,
            totalNet,
            totalLoans,
            totalGap,
            excess
        };
    }

    async function copyToClipboard(
        text
    ) {
        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard
                .writeText(text);

            return;
        }

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

        if (!copied) {
            throw new Error(
                'Copy failed'
            );
        }
    }

    function renderResults(
        values,
        calculation
    ) {
        const first =
            calculation
                .projections[0];

        const coverage =
            Math.min(
                100,
                (
                    first.aid /
                    first.cost
                ) *
                100
            );

        outputs
            .yearOneCost
            .textContent =
            money(first.cost);

        outputs
            .yearOneAid
            .textContent =
            money(first.aid);

        outputs
            .yearOneNet
            .textContent =
            money(first.net);

        outputs
            .yearOneGap
            .textContent =
            money(first.gap);

        outputs
            .coveragePercent
            .textContent =
            coverage.toFixed(1) +
            '%';

        outputs
            .projectedNet
            .textContent =
            money(
                calculation
                    .totalNet
            );

        outputs
            .projectedLoans
            .textContent =
            money(
                calculation
                    .totalLoans
            );

        outputs
            .projectedGap
            .textContent =
            money(
                calculation
                    .totalGap
            );

        resultDescription.textContent =
            values.years +
            '-year projection using a ' +
            values.increase.toFixed(1) +
            '% annual cost increase.';

        tableBody.innerHTML = '';

        calculation
            .projections
            .forEach(
                (
                    projection
                ) => {
                    const row =
                        document
                            .createElement(
                                'tr'
                            );

                    [
                        'Year ' +
                            projection.year,

                        money(
                            projection.cost
                        ),

                        money(
                            projection.aid
                        ),

                        money(
                            projection.net
                        ),

                        money(
                            projection.family
                        ),

                        money(
                            projection.work
                        ),

                        money(
                            projection.loans
                        ),

                        money(
                            projection.gap
                        )
                    ].forEach(
                        (
                            cellValue
                        ) => {
                            const cell =
                                document
                                    .createElement(
                                        'td'
                                    );

                            cell.textContent =
                                cellValue;

                            row.appendChild(
                                cell
                            );
                        }
                    );

                    tableBody.appendChild(
                        row
                    );
                }
            );

        const alerts = [];

        const endingAwards =
            values.awards.filter(
                (award) =>
                    award.years <
                    values.years
            );

        if (
            endingAwards.length
        ) {
            alerts.push(
                'Some awards end early: ' +
                endingAwards
                    .map(
                        (award) =>
                            award.name +
                            ' after year ' +
                            award.years
                    )
                    .join(', ') +
                '.'
            );
        }

        if (
            calculation.excess >
            0
        ) {
            alerts.push(
                'Gift aid exceeds estimated cost in at least one year; actual treatment depends on school and award rules.'
            );
        }

        if (
            values.loans >
            0
        ) {
            alerts.push(
                'Loans reduce the immediate gap but do not reduce net price and must be repaid.'
            );
        }

        if (
            values.work >
            0
        ) {
            alerts.push(
                'Work-study is earned through employment and may not be available before charges are due.'
            );
        }

        resultAlert.textContent =
            alerts.join(' ') ||
            'Review the result against the school’s official aid offer and net price calculator.';

        copyText = [
            'SCHOLARSHIP CALCULATOR RESULTS',

            'Year 1 cost: ' +
                money(
                    first.cost
                ),

            'Year 1 gift aid: ' +
                money(
                    first.aid
                ),

            'Year 1 net price: ' +
                money(
                    first.net
                ),

            'Year 1 funding gap: ' +
                money(
                    first.gap
                ),

            'Projected net price: ' +
                money(
                    calculation
                        .totalNet
                ),

            'Projected loans: ' +
                money(
                    calculation
                        .totalLoans
                ),

            'Projected gap: ' +
                money(
                    calculation
                        .totalGap
                )
        ].join('\n');

        resultBox.classList.add(
            'visible'
        );

        resultBox.scrollIntoView({
            behavior:
                prefersReducedMotion
                    .matches
                    ? 'auto'
                    : 'smooth',

            block: 'start'
        });

        if (
            typeof window.gtag ===
            'function'
        ) {
            window.gtag(
                'event',
                'calculator_used',
                {
                    tool:
                        'scholarship_calculator'
                }
            );
        }
    }

    form.addEventListener(
        'submit',
        (event) => {
            event.preventDefault();

            const values =
                validateAndCollect();

            if (!values) {
                setNeutralResults();
                return;
            }

            renderResults(
                values,
                calculate(values)
            );
        }
    );

    addAidButton.addEventListener(
        'click',
        () => {
            const row =
                createAidRow();

            rows.appendChild(
                row
            );

            clearAllErrors();
            setNeutralResults();

            const nameInput =
                row.querySelector(
                    '.aid-name'
                );

            if (nameInput) {
                nameInput.focus();
            }
        }
    );

    rows.addEventListener(
        'click',
        (event) => {
            const removeButton =
                event.target.closest(
                    '.calc-remove'
                );

            if (!removeButton) {
                return;
            }

            if (
                rows.children.length <=
                1
            ) {
                return;
            }

            const row =
                removeButton.closest(
                    '.aid-row'
                );

            if (row) {
                row.remove();

                clearAllErrors();
                setNeutralResults();
            }
        }
    );

    form.addEventListener(
        'input',
        (event) => {
            if (
                event.target.matches(
                    '.calc-input'
                )
            ) {
                clearAllErrors();
                setNeutralResults();
            }
        }
    );

    form.addEventListener(
        'change',
        (event) => {
            if (
                event.target.matches(
                    '.calc-input'
                )
            ) {
                clearAllErrors();
                setNeutralResults();
            }
        }
    );

    copyButton.addEventListener(
        'click',
        async () => {
            const text =
                copyText ||
                'Calculate results first.';

            const originalText =
                copyButton.textContent;

            try {
                await copyToClipboard(
                    text
                );

                copyButton.textContent =
                    'Copied';
            } catch (error) {
                copyButton.textContent =
                    'Copy failed';
            }

            window.setTimeout(
                () => {
                    copyButton.textContent =
                        originalText;
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
            yearsInput.value =
                defaultValues.years;

            increaseInput.value =
                defaultValues.increase;

            costInputs.forEach(
                (
                    input,
                    index
                ) => {
                    input.value =
                        defaultValues
                            .costs[index];
                }
            );

            resourceInputs.forEach(
                (
                    input,
                    index
                ) => {
                    input.value =
                        defaultValues
                            .resources[index];
                }
            );

            rows.innerHTML =
                initialRowsHTML;

            clearAllErrors();
            setNeutralResults();

            yearsInput.focus();
        }
    );

    setNeutralResults();
})();
