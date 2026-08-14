(() => {
    'use strict';

    const form =
        document.getElementById('cgpaForm');

    const rowsContainer =
        document.getElementById('calcRows');

    const addBtn =
        document.getElementById('addRow');

    const errorBox =
        document.getElementById('calcError');

    const result =
        document.getElementById('calcResult');

    const resultValue =
        document.getElementById('resultValue');

    const resultTier =
        document.getElementById('resultTier');

    const resultExtra =
        document.getElementById('resultExtra');

    const copyBtn =
        document.getElementById('copyBtn');

    const resetBtn =
        document.getElementById('resetBtn');

    if (
        !form ||
        !rowsContainer ||
        !addBtn ||
        !errorBox ||
        !result ||
        !resultValue ||
        !resultTier ||
        !resultExtra ||
        !copyBtn ||
        !resetBtn
    ) {
        return;
    }

    const prefersReducedMotion =
        window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );

    const removeIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5l14 14M19 5 5 19"></path>
        </svg>
    `;

    function setNeutralResult() {
        result.classList.remove('visible');

        resultValue.textContent = '--';

        resultTier.textContent = 'Result';

        resultTier.className =
            'calc-result-tier';

        resultExtra.textContent =
            'Total credits, semesters, and academic standing will appear here.';
    }

    function getAllInputs() {
        return rowsContainer.querySelectorAll(
            '.calc-input'
        );
    }

    function clearValidation() {
        errorBox.hidden = true;
        errorBox.textContent = '';

        getAllInputs().forEach(
            (input) => {
                input.removeAttribute(
                    'aria-invalid'
                );
            }
        );
    }

    function showError(
        message,
        input
    ) {
        clearValidation();

        errorBox.textContent =
            message;

        errorBox.hidden =
            false;

        if (input) {
            input.setAttribute(
                'aria-invalid',
                'true'
            );

            input.focus();
        }
    }

    function createRow() {
        const row =
            document.createElement(
                'div'
            );

        row.className =
            'calc-row';

        row.innerHTML = `
            <input
                type="text"
                class="calc-input"
                placeholder="Semester name"
                aria-label="Semester name">

            <input
                type="number"
                class="calc-input"
                placeholder="3.5"
                min="0"
                max="4"
                step="0.01"
                inputmode="decimal"
                aria-label="Semester GPA">

            <input
                type="number"
                class="calc-input"
                placeholder="15"
                min="0"
                max="30"
                step="1"
                inputmode="decimal"
                aria-label="Credits">

            <button
                type="button"
                class="calc-remove"
                aria-label="Remove semester">
                ${removeIcon}
            </button>
        `;

        return row;
    }

    function getRowValues(row) {
        const inputs =
            row.querySelectorAll(
                '.calc-input'
            );

        const semesterInput =
            inputs[0];

        const gpaInput =
            inputs[1];

        const creditsInput =
            inputs[2];

        const semester =
            semesterInput.value.trim();

        const gpaRaw =
            gpaInput.value.trim();

        const creditsRaw =
            creditsInput.value.trim();

        const gpa =
            gpaRaw === ''
                ? null
                : Number(gpaRaw);

        const credits =
            creditsRaw === ''
                ? null
                : Number(creditsRaw);

        return {
            semesterInput,
            gpaInput,
            creditsInput,
            semester,
            gpaRaw,
            creditsRaw,
            gpa,
            credits,
            hasData:
                semester !== '' ||
                gpaRaw !== '' ||
                creditsRaw !== ''
        };
    }

    function validateRows() {
        clearValidation();

        const rows =
            Array.from(
                rowsContainer.querySelectorAll(
                    '.calc-row'
                )
            );

        let totalPoints = 0;
        let totalCredits = 0;
        let semesters = 0;

        for (const row of rows) {

            const values =
                getRowValues(row);

            if (!values.hasData) {
                continue;
            }

            if (
                values.gpa === null ||
                !Number.isFinite(
                    values.gpa
                )
            ) {
                showError(
                    'Enter a GPA for each semester you want to include.',
                    values.gpaInput
                );

                return null;
            }

            if (
                values.gpa < 0 ||
                values.gpa > 4
            ) {
                showError(
                    'Semester GPA must be between 0 and 4.',
                    values.gpaInput
                );

                return null;
            }

            if (
                values.credits === null ||
                !Number.isFinite(
                    values.credits
                )
            ) {
                showError(
                    'Enter credits for each semester you want to include.',
                    values.creditsInput
                );

                return null;
            }

            if (
                values.credits <= 0 ||
                values.credits > 30
            ) {
                showError(
                    'Semester credits must be greater than 0 and no more than 30.',
                    values.creditsInput
                );

                return null;
            }

            totalPoints +=
                values.gpa *
                values.credits;

            totalCredits +=
                values.credits;

            semesters += 1;
        }

        if (semesters === 0) {

            const firstRow =
                rowsContainer.querySelector(
                    '.calc-row'
                );

            const firstGpa =
                firstRow
                    ? firstRow.querySelectorAll(
                        '.calc-input'
                    )[1]
                    : null;

            showError(
                'Enter at least one semester GPA and credits.',
                firstGpa
            );

            return null;
        }

        return {
            totalPoints,
            totalCredits,
            semesters
        };
    }

    function getTier(
        cgpaValue
    ) {
        if (cgpaValue >= 3.9) {
            return {
                name: 'Outstanding',
                className:
                    'tier-excellent'
            };
        }

        if (cgpaValue >= 3.7) {
            return {
                name: 'Excellent',
                className:
                    'tier-excellent'
            };
        }

        if (cgpaValue >= 3.5) {
            return {
                name: 'Very Good',
                className:
                    'tier-excellent'
            };
        }

        if (cgpaValue >= 3.0) {
            return {
                name: 'Good',
                className:
                    'tier-good'
            };
        }

        if (cgpaValue >= 2.5) {
            return {
                name: 'Satisfactory',
                className:
                    'tier-average'
            };
        }

        return {
            name:
                'Needs Improvement',
            className:
                'tier-low'
        };
    }

    function formatCredits(
        value
    ) {
        return Number.isInteger(
            value
        )
            ? String(value)
            : value
                .toFixed(2)
                .replace(
                    /0+$/,
                    ''
                )
                .replace(
                    /\.$/,
                    ''
                );
    }

    function launchConfetti() {

        if (
            prefersReducedMotion.matches
        ) {
            return;
        }

        const colors = [
            '#2563eb',
            '#06b6d4',
            '#3b82f6',
            '#22d3ee',
            '#1d4ed8'
        ];

        for (
            let index = 0;
            index < 40;
            index += 1
        ) {
            const piece =
                document.createElement(
                    'div'
                );

            piece.className =
                'confetti';

            piece.style.background =
                colors[
                    Math.floor(
                        Math.random() *
                        colors.length
                    )
                ];

            piece.style.left =
                `${
                    50 +
                    (
                        Math.random() -
                        0.5
                    ) *
                    20
                }%`;

            piece.style.top =
                '50%';

            piece.style.setProperty(
                '--x',
                `${
                    (
                        Math.random() -
                        0.5
                    ) *
                    600
                }px`
            );

            piece.style.setProperty(
                '--y',
                `${
                    Math.random() *
                    400 +
                    100
                }px`
            );

            piece.style.borderRadius =
                Math.random() > 0.5
                    ? '50%'
                    : '2px';

            piece.style.animationDelay =
                `${
                    Math.random() *
                    0.3
                }s`;

            document.body.appendChild(
                piece
            );

            window.setTimeout(
                () => {
                    piece.remove();
                },
                2000
            );
        }
    }

    async function copyText(
        text
    ) {
        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard.writeText(
                text
            );

            return;
        }

        const textarea =
            document.createElement(
                'textarea'
            );

        textarea.value =
            text;

        textarea.setAttribute(
            'readonly',
            ''
        );

        textarea.style.position =
            'fixed';

        textarea.style.opacity =
            '0';

        document.body.appendChild(
            textarea
        );

        textarea.select();

        const copied =
            document.execCommand(
                'copy'
            );

        textarea.remove();

        if (!copied) {
            throw new Error(
                'Copy failed'
            );
        }
    }

    addBtn.addEventListener(
        'click',
        () => {

            const row =
                createRow();

            rowsContainer.appendChild(
                row
            );

            clearValidation();
            setNeutralResult();

            const firstInput =
                row.querySelector(
                    '.calc-input'
                );

            if (firstInput) {
                firstInput.focus();
            }
        }
    );

    rowsContainer.addEventListener(
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
                rowsContainer.children
                    .length <= 1
            ) {
                return;
            }

            const row =
                removeButton.closest(
                    '.calc-row'
                );

            if (row) {
                row.remove();

                clearValidation();
                setNeutralResult();
            }
        }
    );

    rowsContainer.addEventListener(
        'input',
        () => {
            clearValidation();
            setNeutralResult();
        }
    );

    form.addEventListener(
        'submit',
        (event) => {

            event.preventDefault();

            const values =
                validateRows();

            if (!values) {
                setNeutralResult();
                return;
            }

            const cgpaValue =
                values.totalPoints /
                values.totalCredits;

            const cgpa =
                cgpaValue.toFixed(
                    2
                );

            const tier =
                getTier(
                    cgpaValue
                );

            resultValue.textContent =
                cgpa;

            resultTier.textContent =
                tier.name;

            resultTier.className =
                `calc-result-tier ${tier.className}`;

            resultExtra.textContent =
                `${values.semesters} semester` +
                `${values.semesters !== 1 ? 's' : ''}` +
                ` · ${formatCredits(values.totalCredits)} total credits` +
                ` · CGPA: ${cgpa}`;

            result.classList.add(
                'visible'
            );

            result.scrollIntoView({
                behavior:
                    prefersReducedMotion.matches
                        ? 'auto'
                        : 'smooth',
                block:
                    'center'
            });

            launchConfetti();

            if (
                typeof window.gtag ===
                'function'
            ) {
                window.gtag(
                    'event',
                    'calculator_used',
                    {
                        tool:
                            'cgpa_calculator'
                    }
                );
            }
        }
    );

    copyBtn.addEventListener(
        'click',
        async () => {

            const text =
                `CGPA: ${resultValue.textContent} | ` +
                resultExtra.textContent;

            const label =
                copyBtn.querySelector(
                    'span'
                );

            const originalText =
                label
                    ? label.textContent
                    : 'Copy Result';

            try {
                await copyText(
                    text
                );

                if (label) {
                    label.textContent =
                        'Copied';
                }
            } catch (error) {

                if (label) {
                    label.textContent =
                        'Copy failed';
                }
            }

            window.setTimeout(
                () => {
                    if (label) {
                        label.textContent =
                            originalText;
                    }
                },
                1500
            );
        }
    );

    resetBtn.addEventListener(
        'click',
        () => {

            const rows =
                Array.from(
                    rowsContainer.querySelectorAll(
                        '.calc-row'
                    )
                );

            rows.forEach(
                (
                    row,
                    index
                ) => {
                    if (index > 0) {
                        row.remove();
                    }
                }
            );

            const firstRow =
                rowsContainer.querySelector(
                    '.calc-row'
                );

            if (firstRow) {

                firstRow
                    .querySelectorAll(
                        '.calc-input'
                    )
                    .forEach(
                        (input) => {
                            input.value =
                                '';
                        }
                    );
            }

            clearValidation();
            setNeutralResult();

            const firstInput =
                firstRow
                    ? firstRow.querySelector(
                        '.calc-input'
                    )
                    : null;

            if (firstInput) {
                firstInput.focus();
            }
        }
    );

    setNeutralResult();
})();
