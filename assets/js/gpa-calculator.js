(function () {
    const rowsContainer = document.getElementById('calcRows');
    const addBtn = document.getElementById('addRow');
    const calcBtn = document.getElementById('calculateBtn');
    const result = document.getElementById('calcResult');
    const resultValue = document.getElementById('resultValue');
    const resultTier = document.getElementById('resultTier');
    const resultExtra = document.getElementById('resultExtra');
    const copyBtn = document.getElementById('copyBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (
        !rowsContainer ||
        !addBtn ||
        !calcBtn ||
        !result ||
        !resultValue ||
        !resultTier ||
        !resultExtra ||
        !copyBtn ||
        !resetBtn
    ) {
        return;
    }

    const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    addBtn.setAttribute('type', 'button');
    calcBtn.setAttribute('type', 'button');
    copyBtn.setAttribute('type', 'button');
    resetBtn.setAttribute('type', 'button');

    const gradeSelectHTML =
        '<option value="4.0">A</option>' +
        '<option value="3.7">A-</option>' +
        '<option value="3.3">B+</option>' +
        '<option value="3.0">B</option>' +
        '<option value="2.7">B-</option>' +
        '<option value="2.3">C+</option>' +
        '<option value="2.0">C</option>' +
        '<option value="1.7">C-</option>' +
        '<option value="1.3">D+</option>' +
        '<option value="1.0">D</option>' +
        '<option value="0.0">F</option>';

    function decorateRemoveButton(button) {
        if (!button) {
            return;
        }

        button.setAttribute('type', 'button');
        button.setAttribute('aria-label', 'Remove course');

        button.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M5 5l14 14M19 5 5 19"></path>' +
            '</svg>';
    }

    function clearCreditError(input) {
        input.removeAttribute('aria-invalid');

        const existing =
            input.parentElement.querySelector('.field-error-message');

        if (existing) {
            existing.remove();
        }
    }

    function showCreditError(input, message) {
        input.setAttribute('aria-invalid', 'true');

        let error =
            input.parentElement.querySelector('.field-error-message');

        if (!error) {
            error = document.createElement('span');
            error.className = 'field-error-message';
            input.parentElement.appendChild(error);
        }

        error.textContent = message;
    }

    function hideResult() {
        result.classList.remove('visible');
    }

    function bindRow(row) {
        const removeButton = row.querySelector('.calc-remove');
        const creditInput = row.querySelector('input[type="number"]');

        if (!removeButton || !creditInput) {
            return;
        }

        decorateRemoveButton(removeButton);

        removeButton.addEventListener('click', function () {
            if (rowsContainer.children.length > 1) {
                row.remove();
                hideResult();
            }
        });

        creditInput.addEventListener('input', function () {
            clearCreditError(creditInput);
            hideResult();
        });

        row.querySelectorAll('input, select').forEach(function (field) {
            field.addEventListener('change', hideResult);
        });
    }

    document.querySelectorAll('.calc-row').forEach(bindRow);

    addBtn.addEventListener('click', function () {
        const row = document.createElement('div');

        row.className = 'calc-row';

        row.innerHTML =
            '<input type="text" class="calc-input" placeholder="Course name" aria-label="Course name">' +
            '<select class="calc-select" aria-label="Grade">' +
            gradeSelectHTML +
            '</select>' +
            '<input type="number" class="calc-input" placeholder="3" min="1" max="6" step="0.5" value="3" aria-label="Credits">' +
            '<button type="button" class="calc-remove" aria-label="Remove course"></button>';

        rowsContainer.appendChild(row);
        bindRow(row);

        row.querySelector('input[type="text"]').focus();
    });

    function launchConfetti() {
        const colors = [
            '#2563eb',
            '#06b6d4',
            '#3b82f6',
            '#22d3ee',
            '#1d4ed8'
        ];

        for (let index = 0; index < 40; index += 1) {
            const piece = document.createElement('div');

            piece.className = 'confetti';
            piece.style.background =
                colors[Math.floor(Math.random() * colors.length)];

            piece.style.left =
                (50 + (Math.random() - 0.5) * 20) + '%';

            piece.style.top = '50%';

            piece.style.setProperty(
                '--x',
                (Math.random() - 0.5) * 600 + 'px'
            );

            piece.style.setProperty(
                '--y',
                (Math.random() * 400 + 100) + 'px'
            );

            piece.style.borderRadius =
                Math.random() > 0.5 ? '50%' : '2px';

            piece.style.animationDelay =
                Math.random() * 0.3 + 's';

            document.body.appendChild(piece);

            window.setTimeout(function () {
                piece.remove();
            }, 2000);
        }
    }

    function getTierLabel(gpa) {
        if (gpa >= 3.7) {
            return {
                label: 'Excellent',
                className: 'tier-excellent'
            };
        }

        if (gpa >= 3.0) {
            return {
                label: 'Good Standing',
                className: 'tier-good'
            };
        }

        if (gpa >= 2.0) {
            return {
                label: 'Average',
                className: 'tier-average'
            };
        }

        return {
            label: 'Needs Improvement',
            className: 'tier-low'
        };
    }

    calcBtn.addEventListener('click', function () {
        const rows = rowsContainer.querySelectorAll('.calc-row');

        let totalPoints = 0;
        let totalCredits = 0;
        let valid = true;
        let firstInvalid = null;

        rows.forEach(function (row) {
            const grade = Number.parseFloat(
                row.querySelector('.calc-select').value
            );

            const creditInput =
                row.querySelector('input[type="number"]');

            const credits =
                Number.parseFloat(creditInput.value);

            clearCreditError(creditInput);

            if (
                !Number.isFinite(credits) ||
                credits <= 0 ||
                credits > 6
            ) {
                showCreditError(
                    creditInput,
                    'Enter credits above 0 and up to 6.'
                );

                valid = false;
                firstInvalid = firstInvalid || creditInput;
                return;
            }

            totalPoints += grade * credits;
            totalCredits += credits;
        });

        if (!valid) {
            firstInvalid.focus();
            return;
        }

        if (totalCredits === 0) {
            return;
        }

        const gpa = totalPoints / totalCredits;
        const finalGpa = gpa.toFixed(2);

        resultValue.textContent = finalGpa;

        const tier = getTierLabel(gpa);

        resultTier.textContent = tier.label;
        resultTier.className =
            'calc-result-tier ' + tier.className;

        resultExtra.textContent =
            'Total Credits: ' +
            totalCredits +
            ' | Quality Points: ' +
            totalPoints.toFixed(2);

        result.classList.add('visible');

        result.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'center'
        });

        if (gpa >= 3.5 && !reducedMotion) {
            launchConfetti();
        }

        if (typeof gtag === 'function') {
            gtag('event', 'calculator_used', {
                tool: 'gpa_calculator'
            });
        }
    });

    copyBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<rect x="9" y="9" width="11" height="11" rx="2"></rect>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
        '</svg>' +
        '<span>Copy Result</span>';

    resetBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 4v6h6"></path>' +
        '<path d="M5.5 16a8 8 0 1 0 .4-8.5L4 10"></path>' +
        '</svg>' +
        '<span>Reset</span>';

    copyBtn.addEventListener('click', async function () {
        const text =
            'My GPA: ' +
            resultValue.textContent +
            ' (' +
            resultTier.textContent +
            ') - ' +
            resultExtra.textContent;

        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            const temporary =
                document.createElement('textarea');

            temporary.value = text;
            temporary.style.position = 'fixed';
            temporary.style.opacity = '0';

            document.body.appendChild(temporary);
            temporary.select();
            document.execCommand('copy');
            temporary.remove();
        }

        const label = copyBtn.querySelector('span');

        if (!label) {
            return;
        }

        const original = label.textContent;
        label.textContent = 'Copied';

        window.setTimeout(function () {
            label.textContent = original;
        }, 1500);
    });

    resetBtn.addEventListener('click', function () {
        hideResult();

        document
            .querySelectorAll('.calc-row')
            .forEach(function (row, index) {
                if (index > 0) {
                    row.remove();
                }
            });

        const firstRow =
            document.querySelector('.calc-row');

        if (!firstRow) {
            return;
        }

        firstRow
            .querySelectorAll('.calc-input')
            .forEach(function (input) {
                input.value = '';
                clearCreditError(input);
            });

        firstRow.querySelector('.calc-select').selectedIndex = 0;

        resultValue.textContent = '--';
        resultTier.textContent = 'Result';
        resultTier.className = 'calc-result-tier';
        resultExtra.textContent = 'Total Credits: 0';

        firstRow
            .querySelector('input[type="text"]')
            .focus();
    });
}());
