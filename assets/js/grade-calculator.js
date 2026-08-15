(function () {
    'use strict';

    const rowsContainer = document.getElementById('calcRows');
    const addBtn = document.getElementById('addRow');
    const calcBtn = document.getElementById('calculateBtn');
    const result = document.getElementById('calcResult');
    const resultValue = document.getElementById('resultValue');
    const resultTier = document.getElementById('resultTier');
    const resultExtra = document.getElementById('resultExtra');
    const copyBtn = document.getElementById('copyBtn');
    const resetBtn = document.getElementById('resetBtn');
    const calcError = document.getElementById('calcError');

    if (
        !rowsContainer ||
        !addBtn ||
        !calcBtn ||
        !result ||
        !resultValue ||
        !resultTier ||
        !resultExtra ||
        !copyBtn ||
        !resetBtn ||
        !calcError
    ) {
        return;
    }

    const removeIcon =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M5 5l14 14M19 5 5 19"></path>' +
        '</svg>';

    const copyIcon =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<rect x="9" y="9" width="11" height="11" rx="2"></rect>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
        '</svg>' +
        '<span>Copy Result</span>';

    const resetIcon =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 4v6h6"></path>' +
        '<path d="M5.5 16a8 8 0 1 0 .4-8.5L4 10"></path>' +
        '</svg>' +
        '<span>Reset</span>';

    function clearValidation() {
        calcError.hidden = true;
        calcError.textContent = '';

        rowsContainer
            .querySelectorAll('[aria-invalid="true"]')
            .forEach(function (input) {
                input.removeAttribute('aria-invalid');
            });
    }

    function showError(message, input) {
        calcError.textContent = message;
        calcError.hidden = false;

        if (input) {
            input.setAttribute('aria-invalid', 'true');
            input.focus();
        }
    }

    function setNeutralResult() {
        resultValue.textContent = '--';
        resultTier.textContent = 'Result';
        resultTier.className = 'calc-result-tier';
        resultExtra.textContent = 'Letter Grade: --';
    }

    function hideResult() {
        result.classList.remove('visible');
    }

    function bindRemove(row) {
        const button = row.querySelector('.calc-remove');

        if (!button) {
            return;
        }

        button.type = 'button';
        button.setAttribute(
            'aria-label',
            'Remove assignment'
        );

        button.innerHTML = removeIcon;

        button.addEventListener(
            'click',
            function () {
                if (rowsContainer.children.length > 1) {
                    row.remove();
                    clearValidation();
                    hideResult();
                }
            }
        );
    }

    function addRow() {
        const row =
            document.createElement('div');

        row.className =
            'calc-row';

        row.innerHTML =
            '<input ' +
            'type="text" ' +
            'class="calc-input" ' +
            'placeholder="Assignment name" ' +
            'aria-label="Assignment name">' +

            '<input ' +
            'type="number" ' +
            'class="calc-input" ' +
            'placeholder="85" ' +
            'min="0" ' +
            'max="100" ' +
            'step="0.01" ' +
            'aria-label="Score">' +

            '<input ' +
            'type="number" ' +
            'class="calc-input" ' +
            'placeholder="25" ' +
            'min="0" ' +
            'max="100" ' +
            'step="0.01" ' +
            'aria-label="Weight">' +

            '<button ' +
            'type="button" ' +
            'class="calc-remove" ' +
            'aria-label="Remove assignment">' +
            removeIcon +
            '</button>';

        rowsContainer.appendChild(row);

        bindRemove(row);

        const firstInput =
            row.querySelector('input');

        if (firstInput) {
            firstInput.focus();
        }
    }

    function letterGrade(percentage) {
        if (percentage >= 90) {
            return 'A';
        }

        if (percentage >= 80) {
            return 'B';
        }

        if (percentage >= 70) {
            return 'C';
        }

        if (percentage >= 60) {
            return 'D';
        }

        return 'F';
    }

    function gradeTier(percentage) {
        if (percentage >= 90) {
            return {
                label: 'Excellent',
                className: 'tier-excellent'
            };
        }

        if (percentage >= 80) {
            return {
                label: 'Good',
                className: 'tier-good'
            };
        }

        if (percentage >= 70) {
            return {
                label: 'Average',
                className: 'tier-average'
            };
        }

        if (percentage >= 60) {
            return {
                label: 'Needs Improvement',
                className: 'tier-average'
            };
        }

        return {
            label: 'Failing',
            className: 'tier-low'
        };
    }

    function formatWeight(value) {
        return Number(
            value.toFixed(2)
        ).toString();
    }

    function prefersReducedMotion() {
        return window
            .matchMedia(
                '(prefers-reduced-motion: reduce)'
            )
            .matches;
    }

    function calculateGrade() {
        clearValidation();

        const rows =
            Array.from(
                rowsContainer.querySelectorAll(
                    '.calc-row'
                )
            );

        let totalWeighted = 0;
        let totalWeight = 0;
        let hasEnteredRow = false;

        for (const row of rows) {
            const inputs =
                row.querySelectorAll(
                    '.calc-input'
                );

            const nameInput =
                inputs[0];

            const scoreInput =
                inputs[1];

            const weightInput =
                inputs[2];

            if (
                !scoreInput ||
                !weightInput
            ) {
                continue;
            }

            const nameValue =
                nameInput
                    ? nameInput.value.trim()
                    : '';

            const scoreValue =
                scoreInput.value.trim();

            const weightValue =
                weightInput.value.trim();

            const rowHasData =
                nameValue !== '' ||
                scoreValue !== '' ||
                weightValue !== '';

            if (!rowHasData) {
                continue;
            }

            hasEnteredRow = true;

            if (scoreValue === '') {
                showError(
                    'Enter a score between 0 and 100 for each assignment you want to include.',
                    scoreInput
                );

                return;
            }

            if (weightValue === '') {
                showError(
                    'Enter a weight between 0 and 100 for each assignment you want to include.',
                    weightInput
                );

                return;
            }

            const score =
                Number.parseFloat(
                    scoreValue
                );

            const weight =
                Number.parseFloat(
                    weightValue
                );

            if (
                !Number.isFinite(score) ||
                score < 0 ||
                score > 100
            ) {
                showError(
                    'Score must be a number from 0 to 100.',
                    scoreInput
                );

                return;
            }

            if (
                !Number.isFinite(weight) ||
                weight < 0 ||
                weight > 100
            ) {
                showError(
                    'Weight must be a number from 0 to 100.',
                    weightInput
                );

                return;
            }

            if (weight > 0) {
                totalWeighted +=
                    score * weight;

                totalWeight +=
                    weight;
            }
        }

        if (!hasEnteredRow) {
            showError(
                'Enter at least one assignment score and weight.'
            );

            return;
        }

        if (totalWeight <= 0) {
            showError(
                'Enter at least one assignment with a weight greater than 0.'
            );

            return;
        }

        const grade =
            totalWeighted /
            totalWeight;

        const tier =
            gradeTier(grade);

        resultValue.textContent =
            grade.toFixed(2) + '%';

        resultTier.textContent =
            tier.label;

        resultTier.className =
            'calc-result-tier ' +
            tier.className;

        resultExtra.textContent =
            'Letter Grade: ' +
            letterGrade(grade) +
            ' | Total Weight: ' +
            formatWeight(totalWeight) +
            '%';

        result.classList.add(
            'visible'
        );

        result.scrollIntoView({
            behavior:
                prefersReducedMotion()
                    ? 'auto'
                    : 'smooth',
            block: 'center'
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
                        'grade_calculator'
                }
            );
        }
    }

    async function copyResult() {
        const text =
            'My Grade: ' +
            resultValue.textContent +
            ' (' +
            resultTier.textContent +
            ') - ' +
            resultExtra.textContent;

        try {
            await navigator
                .clipboard
                .writeText(text);
        } catch (error) {
            const temporary =
                document.createElement(
                    'textarea'
                );

            temporary.value =
                text;

            temporary.style.position =
                'fixed';

            temporary.style.opacity =
                '0';

            document.body.appendChild(
                temporary
            );

            temporary.select();

            document.execCommand(
                'copy'
            );

            temporary.remove();
        }

        const label =
            copyBtn.querySelector(
                'span'
            );

        if (!label) {
            return;
        }

        const original =
            label.textContent;

        label.textContent =
            'Copied';

        window.setTimeout(
            function () {
                label.textContent =
                    original;
            },
            1500
        );
    }

    function resetCalculator() {
        clearValidation();
        hideResult();
        setNeutralResult();

        Array.from(
            rowsContainer.querySelectorAll(
                '.calc-row'
            )
        ).forEach(
            function (row, index) {
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
                    function (input) {
                        input.value = '';
                    }
                );

            const firstInput =
                firstRow.querySelector(
                    '.calc-input'
                );

            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    document
        .querySelectorAll(
            '.calc-row'
        )
        .forEach(
            bindRemove
        );

    addBtn.type =
        'button';

    calcBtn.type =
        'button';

    copyBtn.type =
        'button';

    resetBtn.type =
        'button';

    copyBtn.innerHTML =
        copyIcon;

    resetBtn.innerHTML =
        resetIcon;

    addBtn.addEventListener(
        'click',
        addRow
    );

    calcBtn.addEventListener(
        'click',
        calculateGrade
    );

    copyBtn.addEventListener(
        'click',
        copyResult
    );

    resetBtn.addEventListener(
        'click',
        resetCalculator
    );

    rowsContainer.addEventListener(
        'input',
        function (event) {
            if (
                event.target.matches(
                    '.calc-input'
                )
            ) {
                event.target
                    .removeAttribute(
                        'aria-invalid'
                    );

                calcError.hidden =
                    true;

                calcError.textContent =
                    '';

                hideResult();
            }
        }
    );

    setNeutralResult();
}());
