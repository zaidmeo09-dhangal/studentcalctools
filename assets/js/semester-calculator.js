(() => {
    'use strict';

    const root = document.getElementById('semester-calculator');

    if (!root) {
        return;
    }

    const FORMATS = {
        'six-7': {
            kind: 'six',
            weights: [2, 2, 2],
            exam: 1,
            display: 'parts',
            help: 'Semester average = (1st + 2nd + 3rd six weeks) × 2 + semester exam, then divide by 7. Each six weeks counts 28.57% and the exam counts 14.29%.'
        },
        'six-30': {
            kind: 'six',
            weights: [30, 30, 30],
            exam: 10,
            display: 'pct',
            help: 'Each six weeks counts 30% and the semester exam counts 10%.'
        },
        'six-80': {
            kind: 'six',
            weights: [4, 4, 4],
            exam: 3,
            display: 'pct',
            help: 'The three six weeks grades make up 80% (26.67% each) and the semester exam makes up 20%.'
        },
        'nine-7': {
            kind: 'nine',
            weights: [3, 3],
            exam: 1,
            display: 'parts',
            help: 'Semester average = (1st + 2nd nine weeks) × 3 + semester exam, then divide by 7. Each nine weeks counts 42.86% and the exam counts 14.29%.'
        },
        'nine-45': {
            kind: 'nine',
            weights: [45, 45],
            exam: 10,
            display: 'pct',
            help: 'Each nine weeks counts 45% and the semester exam counts 10%.'
        },
        'quarter-40': {
            kind: 'quarter',
            weights: [40, 40],
            exam: 20,
            display: 'pct',
            help: 'Each quarter counts 40% and the final exam counts 20%.'
        },
        custom: {
            kind: 'custom',
            weights: [30, 30, 30],
            exam: 10,
            display: 'pct',
            editable: true,
            help: 'Type your own weights. If they do not add up to 100%, the calculator scales them so they do.'
        }
    };

    const LABELS = {
        six: [
            ['1st Six Weeks', '2nd Six Weeks', '3rd Six Weeks'],
            ['4th Six Weeks', '5th Six Weeks', '6th Six Weeks']
        ],
        nine: [
            ['1st Nine Weeks', '2nd Nine Weeks'],
            ['3rd Nine Weeks', '4th Nine Weeks']
        ],
        quarter: [
            ['Quarter 1', 'Quarter 2'],
            ['Quarter 3', 'Quarter 4']
        ]
    };

    const DEFAULT_GRADES = ['84', '88', '91', '86', '90', '85'];
    const DEFAULT_EXAM = '86';
    const DEFAULT_TARGET = '90';
    const MAX_ROWS = 6;
    const MAX_GRADE = 120;

    const els = {
        tabAverage: document.getElementById('sgcTabAverage'),
        tabNeed: document.getElementById('sgcTabNeed'),
        panel: document.getElementById('sgcPanel'),
        format: document.getElementById('sgcFormat'),
        formatHelp: document.getElementById('sgcFormatHelp'),
        semester: document.getElementById('sgcSemester'),
        rows: document.getElementById('sgcRows'),
        addRow: document.getElementById('sgcAddRow'),
        examRow: document.getElementById('sgcExamRow'),
        exam: document.getElementById('sgcExam'),
        examWeight: document.getElementById('sgcExamWeight'),
        exemptWrap: document.getElementById('sgcExemptWrap'),
        exempt: document.getElementById('sgcExempt'),
        targetWrap: document.getElementById('sgcTargetWrap'),
        target: document.getElementById('sgcTarget'),
        weightTotal: document.getElementById('sgcWeightTotal'),
        error: document.getElementById('sgcError'),
        calculate: document.getElementById('sgcCalculate'),
        result: document.getElementById('sgcResult'),
        resultLabel: document.getElementById('sgcResultLabel'),
        resultValue: document.getElementById('sgcResultValue'),
        resultTier: document.getElementById('sgcResultTier'),
        resultExtra: document.getElementById('sgcResultExtra'),
        formula: document.getElementById('sgcFormula'),
        copy: document.getElementById('sgcCopy'),
        reset: document.getElementById('sgcReset')
    };

    const state = {
        mode: 'average',
        grades: DEFAULT_GRADES.slice(),
        customWeights: FORMATS.custom.weights.map(String),
        customExamWeight: String(FORMATS.custom.exam),
        customCount: 3,
        examValue: DEFAULT_EXAM,
        formatKey: 'six-7'
    };

    /* ---------- helpers ---------- */

    function fmt(value) {
        const rounded = Math.round(value * 100) / 100;
        return String(rounded);
    }

    function pct(value) {
        return fmt(value) + '%';
    }

    function withArticle(value) {
        const text = fmt(value);
        const whole = Math.floor(Math.abs(value));
        const an = text.charAt(0) === '8' || whole === 11 || whole === 18;
        return (an ? 'an ' : 'a ') + text + '%';
    }

    function currentFormat() {
        return FORMATS[els.format.value] || FORMATS['six-7'];
    }

    function rowCount() {
        const format = currentFormat();
        return format.editable ? state.customCount : format.weights.length;
    }

    function periodLabel(index) {
        const format = currentFormat();

        if (format.kind === 'custom') {
            return 'Grading period ' + (index + 1);
        }

        const semesterIndex = els.semester.value === '2' ? 1 : 0;
        return LABELS[format.kind][semesterIndex][index];
    }

    function examLabel() {
        return currentFormat().kind === 'quarter' ? 'Final exam' : 'Semester exam';
    }

    function presetWeightTotal(format) {
        return format.weights.reduce((sum, w) => sum + w, 0) + format.exam;
    }

    function parseNumber(input) {
        const raw = String(input.value).trim();

        if (raw === '') {
            return null;
        }

        const value = Number(raw);
        return Number.isFinite(value) ? value : NaN;
    }

    function clearErrors() {
        els.error.hidden = true;
        els.error.textContent = '';
        root.querySelectorAll('[aria-invalid="true"]').forEach((input) => {
            input.removeAttribute('aria-invalid');
        });
    }

    function showError(message, input) {
        els.error.textContent = message;
        els.error.hidden = false;

        if (input) {
            input.setAttribute('aria-invalid', 'true');
            input.focus();
        }

        hideResult();
    }

    function hideResult() {
        els.result.classList.remove('visible');
    }

    /* ---------- rendering ---------- */

    function saveRowValues(fromFormat) {
        const source = fromFormat || currentFormat();

        els.rows.querySelectorAll('.sgc-row').forEach((row, index) => {
            const grade = row.querySelector('.sgc-grade');
            const weight = row.querySelector('.sgc-weight');

            if (grade) {
                state.grades[index] = grade.value;
            }

            if (weight && source.editable) {
                state.customWeights[index] = weight.value;
            }
        });
    }

    function renderRows() {
        const format = currentFormat();
        const count = rowCount();
        const total = format.editable ? null : presetWeightTotal(format);
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < count; i += 1) {
            const row = document.createElement('div');
            row.className = 'sgc-row' + (format.editable ? ' sgc-has-remove' : '');

            const gradeId = 'sgcGrade' + i;
            const weightId = 'sgcWeight' + i;
            const label = periodLabel(i);
            const weightValue = format.editable
                ? (state.customWeights[i] !== undefined ? state.customWeights[i] : '')
                : fmt((format.weights[i] / total) * 100);

            row.innerHTML =
                '<span class="sgc-row-name">' + label + '</span>' +
                '<div class="sgc-cell">' +
                    '<label class="sgc-mobile-label" for="' + gradeId + '">Grade (%)</label>' +
                    '<input type="number" class="sgc-input sgc-grade" id="' + gradeId + '" aria-label="' + label + ' grade (%)" inputmode="decimal" min="0" max="' + MAX_GRADE + '" step="0.01">' +
                '</div>' +
                '<div class="sgc-cell">' +
                    '<label class="sgc-mobile-label" for="' + weightId + '">Weight (%)</label>' +
                    '<input type="number" class="sgc-input sgc-weight" id="' + weightId + '" aria-label="' + label + ' weight (%)" inputmode="decimal" min="0" max="100" step="0.01"' + (format.editable ? '' : ' readonly tabindex="-1"') + '>' +
                '</div>' +
                (format.editable
                    ? '<button type="button" class="sgc-remove" aria-label="Remove ' + label + '">&times;</button>'
                    : '<span class="sgc-spacer" aria-hidden="true"></span>');

            const gradeInput = row.querySelector('.sgc-grade');
            const weightInput = row.querySelector('.sgc-weight');

            gradeInput.value = state.grades[i] !== undefined ? state.grades[i] : '';
            gradeInput.placeholder = DEFAULT_GRADES[i] || '85';
            weightInput.value = weightValue;

            fragment.appendChild(row);
        }

        els.rows.innerHTML = '';
        els.rows.appendChild(fragment);

        els.rows.querySelectorAll('.sgc-remove').forEach((button, index) => {
            button.addEventListener('click', () => removeRow(index));
        });

        els.rows.querySelectorAll('.sgc-weight').forEach((input) => {
            input.addEventListener('input', updateWeightTotal);
        });

        els.addRow.hidden = !format.editable || count >= MAX_ROWS;
        root.classList.toggle('sgc-fixed', !format.editable);

        renderExamRow();
        updateWeightTotal();
    }

    function renderExamRow() {
        const format = currentFormat();
        const name = els.examRow.querySelector('.sgc-row-name');

        name.textContent = examLabel();
        els.exam.setAttribute('aria-label', examLabel() + ' grade (%)');

        if (format.editable) {
            els.examWeight.readOnly = false;
            els.examWeight.removeAttribute('tabindex');
            els.examWeight.value = state.customExamWeight;
        } else {
            els.examWeight.readOnly = true;
            els.examWeight.setAttribute('tabindex', '-1');
            els.examWeight.value = fmt((format.exam / presetWeightTotal(format)) * 100);
        }

        const solving = state.mode === 'need';
        const exempt = !solving && els.exempt.checked;

        if (solving) {
            els.exam.value = '';
            els.exam.disabled = true;
            els.exam.placeholder = 'Solved for';
        } else {
            els.exam.disabled = exempt;
            els.exam.placeholder = DEFAULT_EXAM;

            if (els.exam.value === '' && !exempt) {
                els.exam.value = state.examValue;
            }
        }

        els.examWeight.disabled = exempt;
        els.examRow.classList.toggle('sgc-disabled', exempt);
        els.exemptWrap.hidden = solving;
        els.exemptWrap.querySelector('span').textContent =
            'I am exempt from the ' + examLabel().toLowerCase();

        els.semester.closest('.sgc-field').hidden = format.kind === 'custom';
        els.formatHelp.textContent = format.help;
    }

    function updateWeightTotal() {
        const format = currentFormat();
        const exempt = state.mode === 'average' && els.exempt.checked;

        els.weightTotal.classList.remove('sgc-warn');

        if (!format.editable) {
            els.weightTotal.textContent = exempt
                ? 'Exam excluded. Grading period weights are scaled to 100%.'
                : 'Total weight: 100%';
            return;
        }

        let total = 0;

        els.rows.querySelectorAll('.sgc-weight').forEach((input) => {
            const value = Number(input.value);
            total += Number.isFinite(value) ? value : 0;
        });

        if (!exempt) {
            const examWeight = Number(els.examWeight.value);
            total += Number.isFinite(examWeight) ? examWeight : 0;
        }

        const rounded = Math.round(total * 100) / 100;

        if (Math.abs(rounded - 100) < 0.01) {
            els.weightTotal.textContent = exempt
                ? 'Exam excluded. Total grading period weight: 100%'
                : 'Total weight: 100%';
        } else {
            els.weightTotal.textContent =
                (exempt ? 'Exam excluded. Total grading period weight: ' : 'Total weight: ') +
                fmt(rounded) + '%. The calculator will scale the weights to 100%.';
            els.weightTotal.classList.add('sgc-warn');
        }
    }

    function addRow() {
        saveRowValues();

        if (state.customCount >= MAX_ROWS) {
            return;
        }

        state.customCount += 1;

        if (state.customWeights[state.customCount - 1] === undefined) {
            state.customWeights[state.customCount - 1] = '';
        }

        renderRows();
        hideResult();

        const inputs = els.rows.querySelectorAll('.sgc-grade');
        inputs[inputs.length - 1].focus();
    }

    function removeRow(index) {
        saveRowValues();

        if (state.customCount <= 1) {
            return;
        }

        state.grades.splice(index, 1);
        state.customWeights.splice(index, 1);
        state.customCount -= 1;
        renderRows();
        hideResult();
    }

    function setMode(mode) {
        saveRowValues();

        if (state.mode === 'average' && els.exam.value !== '') {
            state.examValue = els.exam.value;
        }

        state.mode = mode;

        const isNeed = mode === 'need';

        els.tabAverage.classList.toggle('sgc-tab-active', !isNeed);
        els.tabNeed.classList.toggle('sgc-tab-active', isNeed);
        els.tabAverage.setAttribute('aria-selected', String(!isNeed));
        els.tabNeed.setAttribute('aria-selected', String(isNeed));
        els.panel.setAttribute('aria-labelledby', isNeed ? 'sgcTabNeed' : 'sgcTabAverage');

        els.targetWrap.hidden = !isNeed;
        els.calculate.textContent = isNeed ? 'Find the Exam Score I Need' : 'Calculate Semester Average';

        if (isNeed) {
            els.exempt.checked = false;
        }

        clearErrors();
        hideResult();
        renderExamRow();
        updateWeightTotal();
    }

    /* ---------- reading inputs ---------- */

    function readInputs() {
        const format = currentFormat();
        const isNeed = state.mode === 'need';
        const exempt = !isNeed && els.exempt.checked;
        const gradeInputs = els.rows.querySelectorAll('.sgc-grade');
        const weightInputs = els.rows.querySelectorAll('.sgc-weight');
        const periods = [];

        for (let i = 0; i < gradeInputs.length; i += 1) {
            const label = periodLabel(i);
            const grade = parseNumber(gradeInputs[i]);

            if (grade === null || Number.isNaN(grade)) {
                showError('Enter your ' + label + ' grade.', gradeInputs[i]);
                return null;
            }

            if (grade < 0 || grade > MAX_GRADE) {
                showError('Enter a ' + label + ' grade between 0 and ' + MAX_GRADE + '.', gradeInputs[i]);
                return null;
            }

            let weight = format.editable ? parseNumber(weightInputs[i]) : format.weights[i];

            if (format.editable) {
                if (weight === null || Number.isNaN(weight) || weight <= 0 || weight > 100) {
                    showError('Enter a weight between 0.01 and 100 for ' + label + '.', weightInputs[i]);
                    return null;
                }
            }

            periods.push({ label, grade, weight });
        }

        let examWeight = format.editable ? parseNumber(els.examWeight) : format.exam;

        if (format.editable && !exempt) {
            if (examWeight === null || Number.isNaN(examWeight) || examWeight < 0 || examWeight > 100) {
                showError('Enter an exam weight between 0 and 100.', els.examWeight);
                return null;
            }
        }

        if (exempt) {
            examWeight = 0;
        }

        let exam = null;

        if (!isNeed && !exempt && examWeight > 0) {
            exam = parseNumber(els.exam);

            if (exam === null || Number.isNaN(exam)) {
                showError('Enter your ' + examLabel().toLowerCase() + ' grade, or tick the exemption box.', els.exam);
                return null;
            }

            if (exam < 0 || exam > MAX_GRADE) {
                showError('Enter an exam grade between 0 and ' + MAX_GRADE + '.', els.exam);
                return null;
            }
        }

        let target = null;

        if (isNeed) {
            if (examWeight <= 0) {
                showError('The exam weight must be greater than 0 to solve for the exam score.', els.examWeight);
                return null;
            }

            target = parseNumber(els.target);

            if (target === null || Number.isNaN(target) || target < 0 || target > MAX_GRADE) {
                showError('Enter a target semester grade between 0 and ' + MAX_GRADE + '.', els.target);
                return null;
            }
        }

        return { format, periods, exam, examWeight, exempt, target, isNeed };
    }

    /* ---------- formulas ---------- */

    function partsFormulaAverage(data, total, weightedSum, average) {
        const terms = data.periods.map((p) => fmt(p.grade) + ' × ' + fmt(p.weight));

        if (data.examWeight > 0) {
            terms.push(fmt(data.exam) + ' × ' + fmt(data.examWeight));
        }

        return '(' + terms.join(' + ') + ') ÷ ' + fmt(total) +
            ' = ' + fmt(weightedSum) + ' ÷ ' + fmt(total) +
            ' = <strong>' + pct(average) + '</strong>';
    }

    function pctFormulaAverage(data, total, average) {
        const terms = data.periods.map((p) => fmt(p.grade) + ' × ' + pct((p.weight / total) * 100));

        if (data.examWeight > 0) {
            terms.push(fmt(data.exam) + ' × ' + pct((data.examWeight / total) * 100));
        }

        return terms.join(' + ') + ' = <strong>' + pct(average) + '</strong>';
    }

    function tierFor(average) {
        if (average >= 90) {
            return { text: 'A range (90+)', cls: 'sgc-tier-excellent' };
        }

        if (average >= 80) {
            return { text: 'B range (80–89)', cls: 'sgc-tier-good' };
        }

        if (average >= 70) {
            return { text: 'C range (70–79)', cls: 'sgc-tier-average' };
        }

        return { text: 'Below 70', cls: 'sgc-tier-low' };
    }

    function setTier(tier) {
        els.resultTier.textContent = tier.text;
        els.resultTier.className = 'sgc-result-tier ' + tier.cls;
    }

    function showResult() {
        els.result.classList.add('visible');

        const rect = els.result.getBoundingClientRect();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (rect.top > window.innerHeight - 120 || rect.top < 0) {
            els.result.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }

        if (typeof window.gtag === 'function') {
            window.gtag('event', 'calculator_used', {
                tool: 'semester_grade_calculator',
                mode: state.mode
            });
        }
    }

    /* ---------- calculations ---------- */

    function calculateAverage(data) {
        const periodWeight = data.periods.reduce((sum, p) => sum + p.weight, 0);
        const total = periodWeight + data.examWeight;
        const weightedSum =
            data.periods.reduce((sum, p) => sum + p.grade * p.weight, 0) +
            (data.examWeight > 0 ? data.exam * data.examWeight : 0);
        const average = weightedSum / total;
        const rounded = Math.round(average);

        els.resultLabel.textContent = 'Your semester average';
        els.resultValue.textContent = pct(average);
        setTier(tierFor(average));

        let extra = 'Whole-number grade if your school rounds .5 up: <strong>' + rounded + '</strong>.';

        if (average >= 69.5 && average < 70) {
            extra += ' You are within half a point of 70, so your school\'s rounding rule decides this one.';
        } else if (average < 70) {
            extra += ' In many Texas schools, 70 is the minimum passing grade.';
        }

        if (data.exempt) {
            extra += ' Your ' + examLabel().toLowerCase() + ' is excluded and the grading periods are scaled to 100%.';
        }

        if (data.format.editable && Math.abs(total - 100) >= 0.01) {
            extra += ' Your weights added up to ' + fmt(total) + '%, so they were scaled to 100%.';
        }

        els.resultExtra.innerHTML = extra;

        els.formula.innerHTML = data.format.display === 'parts'
            ? partsFormulaAverage(data, total, weightedSum, average)
            : pctFormulaAverage(data, total, average);

        showResult();
    }

    function calculateNeed(data) {
        const periodWeight = data.periods.reduce((sum, p) => sum + p.weight, 0);
        const total = periodWeight + data.examWeight;
        const periodSum = data.periods.reduce((sum, p) => sum + p.grade * p.weight, 0);
        const required = (data.target * total - periodSum) / data.examWeight;
        const best = (periodSum + 100 * data.examWeight) / total;
        const worst = periodSum / total;
        const name = examLabel().toLowerCase();

        els.resultLabel.textContent = 'Score you need on the ' + name;

        if (required > 100) {
            els.resultValue.textContent = pct(required);
            setTier({ text: 'Not possible with a 100', cls: 'sgc-tier-low' });
            els.resultExtra.innerHTML =
                'Even a 100 on the ' + name + ' gives you <strong>' + pct(best) +
                '</strong>, which is below your ' + pct(data.target) + ' target.';
        } else if (required <= 0) {
            els.resultValue.textContent = '0%';
            setTier({ text: 'Target already secured', cls: 'sgc-tier-excellent' });
            els.resultExtra.innerHTML =
                'Even a 0 on the ' + name + ' keeps you at <strong>' + pct(worst) +
                '</strong>, which meets your ' + pct(data.target) + ' target.';
        } else {
            let tier = { text: 'Challenging', cls: 'sgc-tier-average' };

            if (required <= 70) {
                tier = { text: 'Very reachable', cls: 'sgc-tier-excellent' };
            } else if (required <= 85) {
                tier = { text: 'Reachable', cls: 'sgc-tier-good' };
            }

            els.resultValue.textContent = pct(required);
            setTier(tier);
            els.resultExtra.innerHTML =
                'Score at least <strong>' + pct(required) + '</strong> on the ' + name +
                ' to finish with ' + withArticle(data.target) + ' semester average. A 100 would give you ' +
                pct(best) + '.';
        }

        if (data.format.display === 'parts') {
            const terms = data.periods.map((p) => fmt(p.grade) + ' × ' + fmt(p.weight)).join(' + ');
            els.formula.innerHTML =
                'Exam needed = (' + fmt(data.target) + ' × ' + fmt(total) + ' − (' + terms + ')) ÷ ' +
                fmt(data.examWeight) + ' = (' + fmt(data.target * total) + ' − ' + fmt(periodSum) + ') ÷ ' +
                fmt(data.examWeight) + ' = <strong>' + pct(required) + '</strong>' +
                (required <= 0 ? ' (any exam score meets the target)' : '');
        } else {
            const examShare = data.examWeight / total;
            const terms = data.periods.map((p) => fmt(p.grade) + ' × ' + pct((p.weight / total) * 100)).join(' + ');
            els.formula.innerHTML =
                'Exam needed = (' + fmt(data.target) + ' − (' + terms + ')) ÷ ' + pct(examShare * 100) +
                ' = (' + fmt(data.target) + ' − ' + fmt(periodSum / total) + ') ÷ ' + fmt(examShare) +
                ' = <strong>' + pct(required) + '</strong>' +
                (required <= 0 ? ' (any exam score meets the target)' : '');
        }

        showResult();
    }

    function calculate() {
        clearErrors();

        const data = readInputs();

        if (!data) {
            return;
        }

        if (data.isNeed) {
            calculateNeed(data);
        } else {
            calculateAverage(data);
        }
    }

    /* ---------- copy & reset ---------- */

    async function copyResult() {
        const text =
            els.resultLabel.textContent + ': ' + els.resultValue.textContent +
            ' (' + els.resultTier.textContent + ')\n' +
            els.formula.textContent + '\nStudentCalcTools Semester Grade Calculator';

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const temp = document.createElement('textarea');
                temp.value = text;
                temp.setAttribute('readonly', '');
                temp.style.position = 'fixed';
                temp.style.opacity = '0';
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                temp.remove();
            }

            els.copy.textContent = 'Copied!';
        } catch (error) {
            els.copy.textContent = 'Copy failed';
        }

        window.setTimeout(() => {
            els.copy.textContent = 'Copy Result';
        }, 1800);
    }

    function resetCalculator() {
        state.grades = DEFAULT_GRADES.slice();
        state.customWeights = FORMATS.custom.weights.map(String);
        state.customExamWeight = String(FORMATS.custom.exam);
        state.customCount = 3;
        state.examValue = DEFAULT_EXAM;
        els.exempt.checked = false;
        els.exam.value = state.mode === 'need' ? '' : DEFAULT_EXAM;
        els.target.value = DEFAULT_TARGET;
        clearErrors();
        hideResult();
        renderRows();
    }

    /* ---------- events ---------- */

    els.tabAverage.addEventListener('click', () => setMode('average'));
    els.tabNeed.addEventListener('click', () => setMode('need'));

    [els.tabAverage, els.tabNeed].forEach((tab) => {
        tab.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                const next = tab === els.tabAverage ? els.tabNeed : els.tabAverage;
                next.focus();
                next.click();
                event.preventDefault();
            }
        });
    });

    els.format.addEventListener('change', () => {
        const previous = FORMATS[state.formatKey] || FORMATS['six-7'];

        saveRowValues(previous);

        if (previous.editable && els.examWeight.value !== '') {
            state.customExamWeight = els.examWeight.value;
        }

        state.formatKey = els.format.value;

        clearErrors();
        hideResult();
        renderRows();
    });

    els.semester.addEventListener('change', () => {
        saveRowValues();
        renderRows();
        hideResult();
    });

    els.examWeight.addEventListener('input', () => {
        if (currentFormat().editable) {
            state.customExamWeight = els.examWeight.value;
        }

        updateWeightTotal();
    });

    els.exam.addEventListener('input', () => {
        if (state.mode === 'average') {
            state.examValue = els.exam.value;
        }
    });

    els.exempt.addEventListener('change', () => {
        hideResult();
        renderExamRow();
        updateWeightTotal();
    });

    els.addRow.addEventListener('click', addRow);
    els.calculate.addEventListener('click', calculate);
    els.copy.addEventListener('click', copyResult);
    els.reset.addEventListener('click', resetCalculator);

    root.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.matches('input.sgc-input')) {
            event.preventDefault();
            calculate();
        }
    });

    root.addEventListener('input', (event) => {
        if (event.target.matches('input')) {
            event.target.removeAttribute('aria-invalid');
        }
    });

    renderRows();
})();
