(() => {
    'use strict';

    const rowsBody = document.getElementById('lgcRows');
    const addRowBtn = document.getElementById('lgcAddRow');
    const calcBtn = document.getElementById('lgcCalculateBtn');
    const result = document.getElementById('lgcResult');
    const resultLsac = document.getElementById('lgcResultLsac');
    const resultSchool = document.getElementById('lgcResultSchool');
    const resultExtra = document.getElementById('lgcResultExtra');
    const copyBtn = document.getElementById('lgcCopyBtn');
    const resetBtn = document.getElementById('lgcResetBtn');
    const cycle2026Radio = document.getElementById('lgcCycle2026');
    const cycle2027Radio = document.getElementById('lgcCycle2027');

    if (
        !rowsBody ||
        !addRowBtn ||
        !calcBtn ||
        !result ||
        !resultLsac ||
        !resultSchool ||
        !resultExtra ||
        !copyBtn ||
        !resetBtn ||
        !cycle2026Radio ||
        !cycle2027Radio
    ) {
        return;
    }

    const GRADE_OPTIONS = [
        { value: '', label: 'Grade' },
        { value: 'A+', label: 'A+' },
        { value: 'A', label: 'A' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B', label: 'B' },
        { value: 'B-', label: 'B-' },
        { value: 'C+', label: 'C+' },
        { value: 'C', label: 'C' },
        { value: 'C-', label: 'C-' },
        { value: 'D+', label: 'D+' },
        { value: 'D', label: 'D' },
        { value: 'D-', label: 'D-' },
        { value: 'F', label: 'F' },
        { value: 'WF', label: 'WF (withdraw failing)' },
        { value: 'W', label: 'W / WP (withdraw)' },
        { value: 'I', label: 'I (incomplete)' },
        { value: 'P', label: 'P / CR (pass)' }
    ];

    const LSAC_POINTS = {
        'A+': 4.33,
        'A': 4.00,
        'A-': 3.67,
        'B+': 3.33,
        'B': 3.00,
        'B-': 2.67,
        'C+': 2.33,
        'C': 2.00,
        'C-': 1.67,
        'D+': 1.33,
        'D': 1.00,
        'D-': 0.67,
        'F': 0.00,
        'WF': 0.00
    };

    const SCHOOL_POINTS = {
        'A+': 4.00,
        'A': 4.00,
        'A-': 3.67,
        'B+': 3.33,
        'B': 3.00,
        'B-': 2.67,
        'C+': 2.33,
        'C': 2.00,
        'C-': 1.67,
        'D+': 1.33,
        'D': 1.00,
        'D-': 0.67,
        'F': 0.00,
        'WF': 0.00
    };

    const EXCLUDED_GRADES = ['W', 'I', 'P'];

    let rowCount = 0;

    function buildGradeSelect() {
        const select = document.createElement('select');
        select.className = 'lgc-row-input lgc-grade-select';
        select.setAttribute('aria-label', 'Grade');

        GRADE_OPTIONS.forEach((option) => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            select.appendChild(optionEl);
        });

        return select;
    }

    function addRow() {
        rowCount += 1;

        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'lgc-row-input lgc-course-name';
        nameInput.placeholder = 'Course (optional)';
        nameInput.setAttribute('aria-label', 'Course name');
        nameCell.appendChild(nameInput);

        const gradeCell = document.createElement('td');
        const gradeSelect = buildGradeSelect();
        gradeCell.appendChild(gradeSelect);

        const creditsCell = document.createElement('td');
        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.className = 'lgc-row-input lgc-credits-input';
        creditsInput.placeholder = '3';
        creditsInput.min = '0';
        creditsInput.step = '0.5';
        creditsInput.setAttribute('aria-label', 'Credit hours');
        creditsCell.appendChild(creditsInput);

        const dualCell = document.createElement('td');
        dualCell.className = 'lgc-dual-cell';
        const dualCheckbox = document.createElement('input');
        dualCheckbox.type = 'checkbox';
        dualCheckbox.className = 'lgc-dual-checkbox';
        dualCheckbox.setAttribute('aria-label', 'Taken as dual enrollment in high school');
        dualCell.appendChild(dualCheckbox);

        const removeCell = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'lgc-remove-btn';
        removeBtn.setAttribute('aria-label', 'Remove course');
        removeBtn.textContent = '\u00D7';
        removeBtn.addEventListener('click', () => {
            row.remove();
        });
        removeCell.appendChild(removeBtn);

        row.appendChild(nameCell);
        row.appendChild(gradeCell);
        row.appendChild(creditsCell);
        row.appendChild(dualCell);
        row.appendChild(removeCell);

        rowsBody.appendChild(row);
    }

    function addStarterRows() {
        rowsBody.innerHTML = '';

        for (let i = 0; i < 4; i += 1) {
            addRow();
        }
    }

    function getCycle() {
        return cycle2027Radio.checked ? '2027' : '2026';
    }

    function readRows() {
        return Array.from(rowsBody.querySelectorAll('tr')).map((row) => {
            const grade = row.querySelector('.lgc-grade-select').value;
            const creditsRaw = row.querySelector('.lgc-credits-input').value.trim();
            const credits = creditsRaw === '' ? NaN : Number(creditsRaw);
            const dual = row.querySelector('.lgc-dual-checkbox').checked;

            return { grade, credits, dual };
        });
    }

    function calculate() {
        const cycle = getCycle();
        const rows = readRows();

        let lsacPoints = 0;
        let lsacCredits = 0;
        let schoolPoints = 0;
        let schoolCredits = 0;
        let excludedDualCredits = 0;
        let excludedNonGradedCredits = 0;
        let validRowCount = 0;

        rows.forEach((row) => {
            if (!row.grade || Number.isNaN(row.credits) || row.credits <= 0) {
                return;
            }

            validRowCount += 1;

            if (EXCLUDED_GRADES.indexOf(row.grade) !== -1) {
                excludedNonGradedCredits += row.credits;
                return;
            }

            const excludedForCycle = row.dual && cycle === '2027';

            if (excludedForCycle) {
                excludedDualCredits += row.credits;
            } else {
                lsacPoints += LSAC_POINTS[row.grade] * row.credits;
                lsacCredits += row.credits;
            }

            schoolPoints += SCHOOL_POINTS[row.grade] * row.credits;
            schoolCredits += row.credits;
        });

        if (validRowCount === 0) {
            resultLsac.textContent = '--';
            resultSchool.textContent = '--';
            resultExtra.textContent = 'Add at least one course with a grade and credit hours to see your GPA.';
            result.classList.add('visible');
            return;
        }

        const lsacGpa = lsacCredits > 0 ? lsacPoints / lsacCredits : null;
        const schoolGpa = schoolCredits > 0 ? schoolPoints / schoolCredits : null;

        resultLsac.textContent = lsacGpa === null ? 'N/A' : lsacGpa.toFixed(2);
        resultSchool.textContent = schoolGpa === null ? 'N/A' : schoolGpa.toFixed(2);

        const notes = [];

        notes.push(
            'Based on ' + lsacCredits.toFixed(1) + ' graded LSAC credit hours across ' + validRowCount + ' course row(s).'
        );

        if (excludedNonGradedCredits > 0) {
            notes.push(
                excludedNonGradedCredits.toFixed(1) + ' credit hour(s) excluded as W/WP, incomplete, or pass/credit.'
            );
        }

        if (excludedDualCredits > 0) {
            notes.push(
                excludedDualCredits.toFixed(1) + ' dual enrollment credit hour(s) excluded under the 2027-2028 cycle rule.'
            );
        }

        if (lsacCredits > 0 && lsacCredits < 60) {
            notes.push(
                'You have fewer than 60 graded credits entered. LSAC may not calculate a numeric cumulative GPA in some cases below that threshold.'
            );
        }

        notes.push('This is an estimate based on standard letter grades, not your official CAS GPA.');

        resultExtra.textContent = notes.join(' ');

        result.classList.add('visible');

        result.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'center'
        });

        if (typeof window.gtag === 'function') {
            window.gtag('event', 'calculator_used', {
                tool: 'lsac_gpa_calculator'
            });
        }
    }

    async function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const temporary = document.createElement('textarea');
        temporary.value = text;
        temporary.setAttribute('readonly', '');
        temporary.style.position = 'fixed';
        temporary.style.opacity = '0';
        temporary.style.pointerEvents = 'none';

        document.body.appendChild(temporary);
        temporary.select();

        const copied = document.execCommand('copy');
        temporary.remove();

        if (!copied) {
            throw new Error('Copy failed');
        }
    }

    addStarterRows();

    addRowBtn.addEventListener('click', addRow);
    calcBtn.addEventListener('click', calculate);

    copyBtn.addEventListener('click', async () => {
        const text =
            'My LSAC GPA: ' + resultLsac.textContent +
            ' | Approx. School GPA: ' + resultSchool.textContent;

        const originalText = copyBtn.textContent;

        try {
            await copyToClipboard(text);
            copyBtn.textContent = 'Copied';
        } catch (error) {
            copyBtn.textContent = 'Copy failed';
        }

        window.setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 1500);
    });

    resetBtn.addEventListener('click', () => {
        addStarterRows();
        cycle2026Radio.checked = true;
        result.classList.remove('visible');
    });
})();
