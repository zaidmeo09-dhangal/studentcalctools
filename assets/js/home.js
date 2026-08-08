(function () {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const form = document.getElementById('miniGpaForm');
    const rowsContainer = document.getElementById('calcRows');
    const addButton = document.getElementById('addRow');
    const result = document.getElementById('calcResult');
    const resultValue = document.getElementById('resultValue');
    const errorBox = document.getElementById('calcError');

    if (!form || !rowsContainer || !addButton || !result || !resultValue || !errorBox) {
        return;
    }

    const gradeOptions = [
        ['', 'Select grade'],
        ['4.0', 'A+'],
        ['4.0', 'A'],
        ['3.7', 'A-'],
        ['3.3', 'B+'],
        ['3.0', 'B'],
        ['2.7', 'B-'],
        ['2.3', 'C+'],
        ['2.0', 'C'],
        ['1.7', 'C-'],
        ['1.3', 'D+'],
        ['1.0', 'D'],
        ['0.7', 'D-'],
        ['0.0', 'F']
    ];

    function clearError() {
        errorBox.hidden = true;
        errorBox.textContent = '';

        rowsContainer.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
            field.removeAttribute('aria-invalid');
        });
    }

    function showError(message, field) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        result.classList.remove('visible');

        if (field) {
            field.setAttribute('aria-invalid', 'true');
            field.focus();
        }
    }

    function renumberRows() {
        const rows = Array.from(rowsContainer.querySelectorAll('.calc-row'));

        rows.forEach(function (row, index) {
            const number = index + 1;
            const course = row.querySelector('.course-input');
            const grade = row.querySelector('.grade-input');
            const credits = row.querySelector('.credits-input');
            const labels = row.querySelectorAll('.calc-field-label');
            const remove = row.querySelector('.calc-remove');

            row.dataset.rowIndex = String(number);

            course.id = 'course-' + number;
            grade.id = 'grade-' + number;
            credits.id = 'credits-' + number;

            labels[0].htmlFor = course.id;
            labels[0].textContent = 'Course ' + number;
            labels[1].htmlFor = grade.id;
            labels[2].htmlFor = credits.id;

            remove.setAttribute('aria-label', 'Remove course ' + number);
        });
    }

    function bindRemove(button) {
        button.addEventListener('click', function () {
            const rows = rowsContainer.querySelectorAll('.calc-row');

            if (rows.length === 1) {
                const row = rows[0];

                row.querySelector('.course-input').value = '';
                row.querySelector('.grade-input').value = '';
                row.querySelector('.credits-input').value = '';

                clearError();
                result.classList.remove('visible');
                return;
            }

            button.closest('.calc-row').remove();
            renumberRows();
            clearError();
            result.classList.remove('visible');
        });
    }

    rowsContainer.querySelectorAll('.calc-remove').forEach(bindRemove);

    addButton.addEventListener('click', function () {
        const rowNumber = rowsContainer.querySelectorAll('.calc-row').length + 1;
        const row = document.createElement('div');

        row.className = 'calc-row';
        row.dataset.rowIndex = String(rowNumber);

        const optionsMarkup = gradeOptions.map(function (option) {
            return '<option value="' + option[0] + '">' + option[1] + '</option>';
        }).join('');

        row.innerHTML =
            '<div class="calc-field">' +
                '<label class="calc-field-label" for="course-' + rowNumber + '">Course ' + rowNumber + '</label>' +
                '<input type="text" class="calc-input course-input" id="course-' + rowNumber + '" placeholder="Example: Chemistry" autocomplete="off">' +
            '</div>' +
            '<div class="calc-field">' +
                '<label class="calc-field-label" for="grade-' + rowNumber + '">Grade</label>' +
                '<select class="calc-select grade-input" id="grade-' + rowNumber + '" aria-describedby="calcHelp">' + optionsMarkup + '</select>' +
            '</div>' +
            '<div class="calc-field">' +
                '<label class="calc-field-label" for="credits-' + rowNumber + '">Credits</label>' +
                '<input type="number" class="calc-input credits-input" id="credits-' + rowNumber + '" placeholder="3" min="0.5" max="30" step="0.5" inputmode="decimal" aria-describedby="calcHelp">' +
            '</div>' +
            '<button type="button" class="calc-remove" aria-label="Remove course ' + rowNumber + '"><span aria-hidden="true">&times;</span></button>';

        rowsContainer.appendChild(row);

        bindRemove(row.querySelector('.calc-remove'));
        row.querySelector('.course-input').focus();
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        clearError();

        const rows = Array.from(rowsContainer.querySelectorAll('.calc-row'));

        let totalQualityPoints = 0;
        let totalCredits = 0;
        let completedRows = 0;

        for (const row of rows) {
            const gradeField = row.querySelector('.grade-input');
            const creditsField = row.querySelector('.credits-input');

            const gradeValue = gradeField.value;
            const rawCredits = creditsField.value.trim();
            const rowNumber = row.dataset.rowIndex;

            if (!gradeValue && !rawCredits) continue;

            if (!gradeValue) {
                showError('Select a grade for course ' + rowNumber + '.', gradeField);
                return;
            }

            if (!rawCredits) {
                showError('Enter credits for course ' + rowNumber + '.', creditsField);
                return;
            }

            const credits = Number(rawCredits);

            if (!Number.isFinite(credits) || credits < 0.5 || credits > 30) {
                showError(
                    'Credits for course ' + rowNumber + ' must be between 0.5 and 30.',
                    creditsField
                );
                return;
            }

            totalQualityPoints += Number(gradeValue) * credits;
            totalCredits += credits;
            completedRows += 1;
        }

        if (completedRows === 0 || totalCredits === 0) {
            showError('Enter at least one grade and credit value before calculating.');
            return;
        }

        const gpa = totalQualityPoints / totalCredits;

        resultValue.textContent = gpa.toFixed(2);
        result.classList.add('visible');

        if (!reducedMotion) {
            result.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }

        if (typeof gtag === 'function') {
            gtag('event', 'calculator_used', {
                tool_name: 'homepage_quick_gpa'
            });
        }
    });
}());
