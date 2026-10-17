(() => {
    'use strict';

    /* ============================================================
       Digital SAT Score Calculator - StudentCalcTools
       - Total score 400-1600 = Reading/Writing (200-800) + Math (200-800)
       - Percentiles: College Board "SAT Nationally Representative and
         User Percentiles" (research.collegeboard.org)
       - SAT <-> ACT: official 2018 ACT/SAT concordance (Tables A1/A2)
       - Raw -> scaled: ESTIMATE ONLY. College Board scores the Digital
         SAT with item response theory and publishes no fixed raw-to-scaled
         table, so three estimate curves are modeled here.
       ============================================================ */

    /* ---------- Data ---------- */

    // Index = (total - 400) / 10. 100 means "99+", 0 means "less than 1".
    const NATIONAL_PCT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 16, 17, 18, 20, 21, 23, 24, 26, 27, 29, 31, 33, 35, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 61, 63, 65, 67, 69, 70, 71, 73, 74, 76, 77, 78, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 93, 94, 94, 95, 96, 96, 97, 97, 97, 98, 98, 98, 99, 99, 99, 99, 99, 99, 99, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const USER_PCT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 44, 45, 47, 48, 50, 52, 53, 55, 56, 58, 59, 60, 62, 63, 65, 66, 67, 69, 70, 71, 72, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 88, 89, 90, 91, 91, 92, 93, 93, 94, 94, 95, 95, 96, 96, 97, 97, 97, 98, 98, 99, 99, 99, 100, 100, 100, 100, 100];

    // Anchor points [questions correct, estimated scaled score] on the
    // harder Module 2 path (average curve). Values in between are interpolated.
    const SECTIONS = {
        rw: { max: 54, anchors: [[0, 200], [5, 270], [10, 340], [15, 400], [20, 450], [25, 500], [30, 550], [35, 600], [40, 650], [45, 700], [50, 750], [54, 800]] },
        math: { max: 44, anchors: [[0, 200], [5, 300], [10, 380], [15, 450], [20, 520], [25, 580], [30, 640], [35, 700], [40, 750], [44, 800]] }
    };

    // shift = maximum points added (generous) or removed (strict) at mid-range.
    const CURVES = {
        average: { label: 'Average curve', shift: 0 },
        easier: { label: 'Generous curve', shift: 25 },
        harder: { label: 'Strict curve', shift: -25 }
    };

    // College Board does not publish an exact cap; about 600 is a commonly used estimate.
    const EASIER_CAP = 600;

    // Official 2018 ACT/SAT concordance, Table A2: [ACT composite, single-score SAT, range low, range high]
    const ACT_TABLE = [
        [36, 1590, 1570, 1600], [35, 1540, 1530, 1560], [34, 1500, 1490, 1520], [33, 1460, 1450, 1480],
        [32, 1430, 1420, 1440], [31, 1400, 1390, 1410], [30, 1370, 1360, 1380], [29, 1340, 1330, 1350],
        [28, 1310, 1300, 1320], [27, 1280, 1260, 1290], [26, 1240, 1230, 1250], [25, 1210, 1200, 1220],
        [24, 1180, 1160, 1190], [23, 1140, 1130, 1150], [22, 1110, 1100, 1120], [21, 1080, 1060, 1090],
        [20, 1040, 1030, 1050], [19, 1010, 990, 1020], [18, 970, 960, 980], [17, 930, 920, 950],
        [16, 890, 880, 910], [15, 850, 830, 870], [14, 800, 780, 820], [13, 760, 730, 770],
        [12, 710, 690, 720], [11, 670, 650, 680], [10, 630, 620, 640], [9, 590, 590, 610]
    ];

    // Approximate middle-50% SAT ranges (recent Common Data Sets; sources differ by a few points).
    const COLLEGES = [
        { name: 'Harvard University', low: 1500, high: 1580 },
        { name: 'MIT', low: 1520, high: 1580 },
        { name: 'Stanford University', low: 1500, high: 1570 },
        { name: 'Princeton University', low: 1500, high: 1570 },
        { name: 'Yale University', low: 1490, high: 1570 },
        { name: 'University of Michigan', low: 1360, high: 1530 },
        { name: 'University of Texas at Austin', low: 1230, high: 1490 }
    ];

    /* ---------- Helpers ---------- */

    const $ = (id) => document.getElementById(id);
    const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function round10(value) {
        return Math.round(value / 10) * 10;
    }

    function ordinal(n) {
        const lastTwo = n % 100;
        if (lastTwo >= 11 && lastTwo <= 13) return n + 'th';
        const last = n % 10;
        if (last === 1) return n + 'st';
        if (last === 2) return n + 'nd';
        if (last === 3) return n + 'rd';
        return n + 'th';
    }

    function formatPct(value) {
        if (value >= 100) return '99+';
        if (value <= 0) return '<1';
        return ordinal(value);
    }

    function percentiles(total) {
        const idx = clamp(Math.round((total - 400) / 10), 0, 120);
        return { national: NATIONAL_PCT[idx], user: USER_PCT[idx] };
    }

    function baseScore(section, raw) {
        const anchors = SECTIONS[section].anchors;
        for (let i = 1; i < anchors.length; i += 1) {
            const x0 = anchors[i - 1][0], y0 = anchors[i - 1][1];
            const x1 = anchors[i][0], y1 = anchors[i][1];
            if (raw <= x1) return y0 + ((y1 - y0) * (raw - x0)) / (x1 - x0);
        }
        return anchors[anchors.length - 1][1];
    }

    // Estimated section score (200-800) for a number of correct answers.
    function scaled(section, raw, curveKey, routing) {
        const max = SECTIONS[section].max;
        const r = clamp(Math.round(raw), 0, max);
        const x = r / max;
        const offset = CURVES[curveKey].shift * 4 * x * (1 - x);
        let score = clamp(round10(baseScore(section, r) + offset), 200, 800);
        if (routing === 'easier') score = Math.min(score, EASIER_CAP);
        return score;
    }

    // Smallest number correct that reaches a section score (harder Module 2 path).
    function minRawFor(section, curveKey, needed) {
        const max = SECTIONS[section].max;
        for (let r = 0; r <= max; r += 1) {
            if (scaled(section, r, curveKey, 'harder') >= needed) return r;
        }
        return max;
    }

    // Splits a total target into two section targets, each a multiple of 10.
    function splitTarget(target) {
        const rw = clamp(Math.ceil(target / 20) * 10, 200, 800);
        return { rw: rw, math: clamp(target - rw, 200, 800) };
    }

    function satToAct(total) {
        for (const row of ACT_TABLE) {
            if (total >= row[2] && total <= row[3]) return row[0];
        }
        return null;
    }

    function actToSat(act) {
        for (const row of ACT_TABLE) {
            if (row[0] === act) return { single: row[1], low: row[2], high: row[3] };
        }
        return null;
    }

    function scoreBand(total) {
        if (total >= 1500) return { label: 'Exceptional', desc: 'Within or near the middle-50% range at many of the most selective universities.' };
        if (total >= 1400) return { label: 'Excellent', desc: 'Strong for many selective universities and well above the national average.' };
        if (total >= 1300) return { label: 'Very strong', desc: 'Competitive for many flagship state universities and selective colleges.' };
        if (total >= 1200) return { label: 'Strong', desc: 'Well above the national average and a solid score for a wide range of colleges.' };
        if (total >= 1050) return { label: 'Above average', desc: 'Above the national average of roughly 1030, with room to grow through focused practice.' };
        if (total >= 950) return { label: 'Around average', desc: 'Close to the national average. A targeted study plan can move this up.' };
        if (total >= 800) return { label: 'Below average', desc: 'Below the national average. Consistent practice on your weakest section can help quickly.' };
        return { label: 'Early stage', desc: 'A good starting point for a structured study plan and regular full-length practice tests.' };
    }

    function checkedValue(name, fallback) {
        const el = document.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : fallback;
    }

    function setInvalid(input, invalid) {
        if (!input) return;
        if (invalid) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
    }

    function showError(box, message, input) {
        if (!box) return;
        box.textContent = message;
        box.hidden = false;
        if (input) {
            setInvalid(input, true);
            input.focus();
        }
    }

    function clearError(box, form) {
        if (box) {
            box.textContent = '';
            box.hidden = true;
        }
        if (form) {
            form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
        }
    }

    function revealResult(result) {
        result.classList.add('visible');
        result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function countUp(el, to) {
        if (reduceMotion) {
            el.textContent = to;
            return;
        }
        const duration = 700;
        const start = performance.now();
        function step(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * to);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = to;
        }
        requestAnimationFrame(step);
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        if (!ok) throw new Error('Copy failed');
    }

    function flashButton(btn, message) {
        const original = btn.dataset.label || btn.textContent;
        btn.dataset.label = original;
        btn.textContent = message;
        window.setTimeout(() => { btn.textContent = original; }, 1600);
    }

    function track(tool) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'calculator_used', { tool: tool });
        }
    }

    /* ---------- Score Calculator ---------- */

    const satForm = $('satForm');
    const satResult = $('satResult');

    if (satForm && satResult) {
        const inputs = { rw1: $('rwM1'), rw2: $('rwM2'), m1: $('mathM1'), m2: $('mathM2') };
        const errorBox = $('satError');
        const copyBtn = $('satCopy');
        const shareBtn = $('satShare');
        let summary = '';

        function readModule(input, max, name) {
            const raw = input.value.trim();
            if (raw === '') {
                showError(errorBox, 'Please enter ' + name + '.', input);
                return null;
            }
            const num = Number(raw);
            if (!Number.isInteger(num) || num < 0 || num > max) {
                showError(errorBox, name + ' must be a whole number from 0 to ' + max + '.', input);
                return null;
            }
            return num;
        }

        satForm.addEventListener('input', () => clearError(errorBox, satForm));

        satForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearError(errorBox, satForm);

            const rw1 = readModule(inputs.rw1, 27, 'Reading/Writing Module 1 correct answers');
            if (rw1 === null) return;
            const rw2 = readModule(inputs.rw2, 27, 'Reading/Writing Module 2 correct answers');
            if (rw2 === null) return;
            const m1 = readModule(inputs.m1, 22, 'Math Module 1 correct answers');
            if (m1 === null) return;
            const m2 = readModule(inputs.m2, 22, 'Math Module 2 correct answers');
            if (m2 === null) return;

            const curveKey = $('curveSelect').value;
            const rwRoute = checkedValue('rwRoute', 'harder');
            const mathRoute = checkedValue('mathRoute', 'harder');
            const rwRaw = rw1 + rw2;
            const mathRaw = m1 + m2;

            const rwFree = scaled('rw', rwRaw, curveKey, 'harder');
            const mathFree = scaled('math', mathRaw, curveKey, 'harder');
            const rwScore = scaled('rw', rwRaw, curveKey, rwRoute);
            const mathScore = scaled('math', mathRaw, curveKey, mathRoute);
            const total = rwScore + mathScore;

            const pct = percentiles(total);
            const act = satToAct(total);
            const band = scoreBand(total);

            countUp($('resTotal'), total);
            $('resRW').textContent = rwScore;
            $('resMath').textContent = mathScore;
            $('resUserPct').textContent = formatPct(pct.user);
            $('resNatPct').textContent = formatPct(pct.national);
            $('resACT').textContent = act === null ? 'N/A' : act;
            $('resBand').textContent = band.label;
            $('resBand').className = 'calc-result-tier ' + (total >= 1300 ? 'tier-excellent' : total >= 1050 ? 'tier-good' : total >= 800 ? 'tier-average' : 'tier-low');
            $('resBandDesc').textContent = band.desc;
            $('resRawRW').textContent = rwRaw + ' / 54';
            $('resRawMath').textContent = mathRaw + ' / 44';
            $('resCurve').textContent = CURVES[curveKey].label;

            const capNote = $('resCapNote');
            const capped = [];
            if (rwRoute === 'easier' && rwFree > rwScore) capped.push('Reading/Writing');
            if (mathRoute === 'easier' && mathFree > mathScore) capped.push('Math');
            if (capped.length) {
                capNote.textContent = 'Your ' + capped.join(' and ') + ' section score is capped at about ' + EASIER_CAP + ' because you selected the easier Module 2. College Board does not publish an exact cap, so treat this as an estimate.';
                capNote.hidden = false;
            } else {
                capNote.hidden = true;
            }

            summary = 'Estimated Digital SAT score: ' + total + ' (Reading/Writing ' + rwScore + ', Math ' + mathScore + '), about the ' + formatPct(pct.user) + ' percentile of SAT takers. Estimated with the StudentCalcTools SAT Score Calculator: https://studentcalctools.com/sat-score-calculator/';

            revealResult(satResult);
            track('sat_score_calculator');
        });

        $('satReset').addEventListener('click', () => {
            satForm.reset();
            clearError(errorBox, satForm);
            satResult.classList.remove('visible');
            inputs.rw1.focus();
        });

        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await copyText(summary);
                    flashButton(copyBtn, 'Copied!');
                } catch (err) {
                    flashButton(copyBtn, 'Copy failed');
                }
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const url = 'https://studentcalctools.com/sat-score-calculator/';
                if (navigator.share) {
                    try {
                        await navigator.share({ title: 'My estimated SAT score', text: summary.replace(' ' + url, ''), url: url });
                    } catch (err) { /* share dismissed */ }
                    return;
                }
                try {
                    await copyText(summary);
                    flashButton(shareBtn, 'Link copied!');
                } catch (err) {
                    flashButton(shareBtn, 'Copy failed');
                }
            });
        }
    }

    /* ---------- Goal Planner ---------- */

    const goalForm = $('goalForm');
    const goalResult = $('goalResult');

    if (goalForm && goalResult) {
        const targetInput = $('goalTarget');
        const goalError = $('goalError');

        goalForm.addEventListener('input', () => clearError(goalError, goalForm));

        goalForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearError(goalError, goalForm);

            const raw = targetInput.value.trim();
            const target = Number(raw);
            if (raw === '' || !Number.isInteger(target) || target < 400 || target > 1600 || target % 10 !== 0) {
                showError(goalError, 'Enter a target score from 400 to 1600 in multiples of 10.', targetInput);
                return;
            }

            const curveKey = $('goalCurve').value;
            const split = splitTarget(target);
            const rwNeeded = minRawFor('rw', curveKey, split.rw);
            const mathNeeded = minRawFor('math', curveKey, split.math);

            $('goalTargetEcho').textContent = target;
            $('goalRWNeeded').textContent = rwNeeded + ' / 54';
            $('goalRWMiss').textContent = 54 - rwNeeded;
            $('goalMathNeeded').textContent = mathNeeded + ' / 44';
            $('goalMathMiss').textContent = 44 - mathNeeded;
            $('goalNote').textContent = 'Estimate on the ' + CURVES[curveKey].label.toLowerCase() + ' with the harder Module 2, split as ' + split.rw + ' Reading/Writing and ' + split.math + ' Math. Move points between sections if one is your strength. Real scoring varies by test form.';

            revealResult(goalResult);
            track('sat_goal_planner');
        });

        $('goalReset').addEventListener('click', () => {
            goalForm.reset();
            clearError(goalError, goalForm);
            goalResult.classList.remove('visible');
            targetInput.focus();
        });
    }

    /* ---------- Superscore Calculator ---------- */

    const superForm = $('superForm');
    const superResult = $('superResult');

    if (superForm && superResult) {
        const wrap = $('superDates');
        const superError = $('superError');
        const MIN_ROWS = 2;
        const MAX_ROWS = 6;

        function rowHTML(n) {
            return '<div class="field-row super-date">' +
                '<div class="field-group"><label class="field-label" for="superRW' + n + '">Test date ' + n + ': Reading/Writing <small>(200-800)</small></label>' +
                '<input class="calc-input super-rw" id="superRW' + n + '" type="number" min="200" max="800" step="10" placeholder="e.g. 700" inputmode="numeric" autocomplete="off"></div>' +
                '<div class="field-group"><label class="field-label" for="superMath' + n + '">Test date ' + n + ': Math <small>(200-800)</small></label>' +
                '<input class="calc-input super-math" id="superMath' + n + '" type="number" min="200" max="800" step="10" placeholder="e.g. 650" inputmode="numeric" autocomplete="off"></div>' +
                '</div>';
        }

        const rows = () => wrap.querySelectorAll('.super-date');

        function setRows(count) {
            wrap.innerHTML = '';
            for (let i = 1; i <= count; i += 1) wrap.insertAdjacentHTML('beforeend', rowHTML(i));
        }

        function validScore(value) {
            return Number.isInteger(value) && value >= 200 && value <= 800 && value % 10 === 0;
        }

        superForm.addEventListener('input', () => clearError(superError, superForm));

        superForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearError(superError, superForm);

            const sittings = [];
            const list = rows();
            for (let i = 0; i < list.length; i += 1) {
                const rwInput = list[i].querySelector('.super-rw');
                const mathInput = list[i].querySelector('.super-math');
                const rwRaw = rwInput.value.trim();
                const mathRaw = mathInput.value.trim();
                if (rwRaw === '' && mathRaw === '') continue;
                if (rwRaw === '') { showError(superError, 'Test date ' + (i + 1) + ': enter the Reading/Writing score.', rwInput); return; }
                if (mathRaw === '') { showError(superError, 'Test date ' + (i + 1) + ': enter the Math score.', mathInput); return; }
                const rw = Number(rwRaw);
                const math = Number(mathRaw);
                if (!validScore(rw)) { showError(superError, 'Test date ' + (i + 1) + ': Reading/Writing must be 200 to 800 in multiples of 10.', rwInput); return; }
                if (!validScore(math)) { showError(superError, 'Test date ' + (i + 1) + ': Math must be 200 to 800 in multiples of 10.', mathInput); return; }
                sittings.push({ rw: rw, math: math });
            }

            if (sittings.length < 2) {
                showError(superError, 'Enter complete Reading/Writing and Math scores for at least 2 test dates.', list[0].querySelector('.super-rw'));
                return;
            }

            const bestRW = Math.max(...sittings.map((s) => s.rw));
            const bestMath = Math.max(...sittings.map((s) => s.math));
            const total = bestRW + bestMath;
            const bestSingle = Math.max(...sittings.map((s) => s.rw + s.math));
            const gain = total - bestSingle;
            const pct = percentiles(total);

            countUp($('superTotal'), total);
            $('superBestRW').textContent = bestRW;
            $('superBestMath').textContent = bestMath;
            $('superUserPct').textContent = formatPct(pct.user);
            $('superNatPct').textContent = formatPct(pct.national);
            $('superGain').textContent = gain > 0
                ? '+' + gain + ' points compared with your best single sitting (' + bestSingle + ')'
                : 'Your best single sitting (' + bestSingle + ') already equals your superscore';

            revealResult(superResult);
            track('sat_superscore');
        });

        $('superAddDate').addEventListener('click', () => {
            const count = rows().length;
            if (count >= MAX_ROWS) return;
            wrap.insertAdjacentHTML('beforeend', rowHTML(count + 1));
            wrap.querySelector('.super-date:last-child .super-rw').focus();
        });

        $('superRemoveDate').addEventListener('click', () => {
            const list = rows();
            if (list.length > MIN_ROWS) list[list.length - 1].remove();
        });

        $('superReset').addEventListener('click', () => {
            setRows(MIN_ROWS);
            clearError(superError, superForm);
            superResult.classList.remove('visible');
        });
    }

    /* ---------- SAT <-> ACT Converter ---------- */

    const convForm = $('convForm');
    const convResult = $('convResult');

    if (convForm && convResult) {
        const convInput = $('convInput');
        const convError = $('convError');

        function syncConvInput() {
            if (checkedValue('convDir', 'sat2act') === 'sat2act') {
                convInput.placeholder = 'e.g. 1350';
                convInput.min = 400;
                convInput.max = 1600;
                convInput.step = 10;
            } else {
                convInput.placeholder = 'e.g. 30';
                convInput.min = 1;
                convInput.max = 36;
                convInput.step = 1;
            }
        }

        convForm.querySelectorAll('input[name="convDir"]').forEach((el) => el.addEventListener('change', () => {
            syncConvInput();
            convInput.value = '';
            clearError(convError, convForm);
            convResult.classList.remove('visible');
        }));

        convForm.addEventListener('input', () => clearError(convError, convForm));

        convForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearError(convError, convForm);

            const direction = checkedValue('convDir', 'sat2act');
            const raw = convInput.value.trim();
            const value = Number(raw);

            if (direction === 'sat2act') {
                if (raw === '' || !Number.isInteger(value) || value < 400 || value > 1600 || value % 10 !== 0) {
                    showError(convError, 'Enter an SAT total score from 400 to 1600 in multiples of 10.', convInput);
                    return;
                }
                const act = satToAct(value);
                $('convOutLabel').textContent = 'ACT composite equivalent';
                if (act === null) {
                    $('convOutValue').textContent = 'N/A';
                    $('convOutNote').textContent = 'The official 2018 concordance tables start at an SAT total of 590, so scores below that have no official ACT equivalent.';
                } else {
                    $('convOutValue').textContent = act + ' / 36';
                    $('convOutNote').textContent = 'An SAT score of ' + value + ' concords to an ACT composite of ' + act + ' (official 2018 concordance, Table A1). The estimate can be off by about 2 ACT points.';
                }
            } else {
                if (raw === '' || !Number.isInteger(value) || value < 1 || value > 36) {
                    showError(convError, 'Enter an ACT composite score from 1 to 36.', convInput);
                    return;
                }
                const sat = actToSat(value);
                $('convOutLabel').textContent = 'SAT total equivalent';
                if (sat === null) {
                    $('convOutValue').textContent = 'N/A';
                    $('convOutNote').textContent = 'The official 2018 concordance tables start at an ACT composite of 9, so scores below that have no official SAT equivalent.';
                } else {
                    $('convOutValue').textContent = sat.single;
                    $('convOutNote').textContent = 'An ACT composite of ' + value + ' concords to an SAT total of about ' + sat.single + ' (range ' + sat.low + '-' + sat.high + ', official 2018 concordance, Table A2). The estimate can be off by about 80 SAT points.';
                }
            }

            revealResult(convResult);
            track('sat_act_converter');
        });

        $('convReset').addEventListener('click', () => {
            convForm.reset();
            syncConvInput();
            clearError(convError, convForm);
            convResult.classList.remove('visible');
        });

        syncConvInput();
    }

    /* ---------- College Benchmarks ---------- */

    const collegeSearch = $('collegeSearch');
    const collegeScore = $('collegeScore');
    const collegeResults = $('collegeResults');

    if (collegeSearch && collegeScore && collegeResults) {
        function renderColleges() {
            const query = collegeSearch.value.trim().toLowerCase();
            const score = Number(collegeScore.value);
            const hasScore = collegeScore.value.trim() !== '' && Number.isInteger(score) && score >= 400 && score <= 1600;
            const matches = COLLEGES.filter((c) => c.name.toLowerCase().indexOf(query) !== -1);

            if (matches.length === 0) {
                collegeResults.innerHTML = '<p class="college-empty">No match in this list yet. Check the college\'s own admissions or Common Data Set page for its SAT range.</p>';
                return;
            }

            collegeResults.innerHTML = matches.map((c) => {
                let status = '';
                let cls = '';
                if (hasScore) {
                    if (score > c.high) { status = 'Above the 75th percentile'; cls = 'above'; }
                    else if (score >= c.low) { status = 'Within the middle 50%'; cls = 'in-range'; }
                    else if (score >= c.low - 80) { status = 'Just below the range'; cls = 'near'; }
                    else { status = 'Below the range'; cls = 'below'; }
                }
                return '<div class="college-card"><p class="college-name">' + c.name + '</p>' +
                    '<p class="college-range">Middle 50%: <strong>' + c.low + '-' + c.high + '</strong></p>' +
                    (hasScore ? '<p class="college-status ' + cls + '">' + status + '</p>' : '') + '</div>';
            }).join('');
        }

        collegeSearch.addEventListener('input', renderColleges);
        collegeScore.addEventListener('input', renderColleges);
        renderColleges();
    }

    /* ---------- Conversion Table Tabs ---------- */

    const tabs = Array.prototype.slice.call(document.querySelectorAll('.curve-tab'));

    function activateTab(tab, focus) {
        tabs.forEach((t) => {
            const on = t === tab;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
            t.tabIndex = on ? 0 : -1;
            const panel = $(t.dataset.target);
            if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activateTab(tab, false));
        tab.addEventListener('keydown', (event) => {
            let next = null;
            if (event.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
            else if (event.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
            else if (event.key === 'Home') next = tabs[0];
            else if (event.key === 'End') next = tabs[tabs.length - 1];
            if (next) {
                event.preventDefault();
                activateTab(next, true);
            }
        });
    });

    /* ---------- Scroll Reveal ---------- */

    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
            revealEls.forEach((el) => observer.observe(el));
            window.setTimeout(() => revealEls.forEach((el) => el.classList.add('visible')), 4000);
        } else {
            revealEls.forEach((el) => el.classList.add('visible'));
        }
    }

    window.StudentCalcSAT = Object.freeze({
        scaled: scaled,
        minRawFor: minRawFor,
        splitTarget: splitTarget,
        satToAct: satToAct,
        actToSat: actToSat,
        percentiles: percentiles,
        actTable: ACT_TABLE,
        colleges: COLLEGES,
        sections: SECTIONS,
        curves: CURVES
    });
})();
