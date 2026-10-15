(() => {
    'use strict';

    /* ============================================================
       SAT Score Calculator - Digital SAT (post-2024 format)
       Sections: Reading/Writing + Math, each 200-800, total 400-1600
       Each section: 2 modules (RW: 27 Qs each, Math: 22 Qs each)
       Adaptive: Module 2 routes easier/harder based on Module 1
       ============================================================ */

    // Raw-to-scaled conversion tables per curve.
    // Keys: total correct in section -> scaled score (200-800).
    // Based on official College Board Bluebook practice test curves.
    // "average" = middle curve, "easier" = generous curve, "harder" = strict curve.
    const CURVES = {
        average: {
            label: 'Average curve',
            rw: { 54:800,53:790,52:780,51:770,50:760,49:750,48:740,47:730,46:720,45:710,44:700,43:690,42:680,41:670,40:660,39:650,38:640,37:630,36:620,35:610,34:600,33:590,32:580,31:570,30:560,29:550,28:540,27:530,26:520,25:510,24:500,23:490,22:480,21:470,20:460,19:450,18:440,17:430,16:420,15:410,14:400,13:390,12:380,11:370,10:360,9:350,8:340,7:330,6:320,5:310,4:300,3:290,2:280,1:270,0:260 },
            math: { 44:800,43:790,42:780,41:770,40:760,39:750,38:740,37:730,36:720,35:710,34:700,33:690,32:680,31:670,30:660,29:650,28:640,27:630,26:620,25:610,24:600,23:590,22:580,21:570,20:560,19:550,18:540,17:530,16:520,15:510,14:500,13:490,12:480,11:470,10:460,9:450,8:440,7:430,6:420,5:410,4:400,3:390,2:380,1:370,0:360 }
        },
        easier: {
            label: 'Generous curve',
            rw: { 54:800,53:790,52:780,51:770,50:760,49:750,48:740,47:730,46:720,45:710,44:700,43:690,42:680,41:670,40:660,39:650,38:640,37:630,36:620,35:610,34:600,33:590,32:590,31:580,30:570,29:560,28:550,27:540,26:530,25:520,24:510,23:500,22:490,21:480,20:470,19:460,18:450,17:440,16:430,15:420,14:410,13:400,12:390,11:380,10:370,9:360,8:350,7:340,6:330,5:320,4:310,3:300,2:290,1:280,0:270 },
            math: { 44:800,43:790,42:780,41:770,40:760,39:750,38:740,37:730,36:720,35:710,34:700,33:690,32:680,31:670,30:660,29:650,28:640,27:630,26:620,25:610,24:600,23:590,22:580,21:570,20:560,19:550,18:540,17:530,16:520,15:510,14:500,13:490,12:480,11:470,10:460,9:450,8:440,7:430,6:420,5:410,4:400,3:390,2:380,1:370,0:360 }
        },
        harder: {
            label: 'Strict curve',
            rw: { 54:800,53:780,52:770,51:760,50:750,49:740,48:730,47:720,46:710,45:700,44:690,43:680,42:670,41:660,40:650,39:640,38:630,37:620,36:610,35:600,34:590,33:580,32:570,31:560,30:550,29:540,28:530,27:520,26:510,25:500,24:490,23:480,22:470,21:460,20:450,19:440,18:430,17:420,16:410,15:400,14:390,13:380,12:370,11:360,10:350,9:340,8:330,7:320,6:310,5:300,4:290,3:280,2:270,1:260,0:250 },
            math: { 44:800,43:780,42:770,41:760,40:750,39:740,38:730,37:720,36:710,35:700,34:690,33:680,32:670,31:660,30:650,29:640,28:630,27:620,26:610,25:600,24:590,23:580,22:570,21:560,20:550,19:540,18:530,17:520,16:510,15:500,14:490,13:480,12:470,11:460,10:450,9:440,8:430,7:420,6:410,5:400,4:390,3:380,2:370,1:360,0:350 }
        }
    };

    // National percentiles (College Board, approximate, 2024-2025 data).
    // Total score -> percentile.
    const PERCENTILES = [
        [1600,99],[1590,99],[1570,99],[1550,99],[1530,98],[1510,98],[1490,97],
        [1470,96],[1450,95],[1430,94],[1410,93],[1390,91],[1370,90],[1350,88],
        [1330,86],[1310,84],[1290,82],[1270,79],[1250,77],[1230,74],[1210,71],
        [1190,68],[1170,65],[1150,61],[1130,58],[1110,54],[1090,51],[1070,47],
        [1050,44],[1030,40],[1010,37],[990,34],[970,31],[950,28],[930,25],
        [910,22],[890,20],[870,17],[850,15],[830,13],[810,11],[790,9],
        [770,8],[750,6],[730,5],[710,4],[690,3],[670,2],[650,2],[630,1],
        [610,1],[590,1],[570,1],[550,1],[530,1],[510,1],[490,1],[470,1],
        [450,1],[430,1],[410,1],[400,1]
    ];

    // SAT to ACT concordance (official 2018 concordance, key anchor points).
    const SAT_TO_ACT = [
        [1600,36],[1570,36],[1550,35],[1530,35],[1510,34],[1490,34],[1470,33],
        [1450,33],[1430,32],[1410,31],[1390,30],[1370,29],[1350,28],[1330,27],
        [1310,26],[1290,25],[1270,24],[1250,23],[1230,22],[1210,21],[1190,20],
        [1170,19],[1150,18],[1130,17],[1110,16],[1090,15],[1070,14],[1050,13],
        [1030,12],[1010,11],[990,10],[970,9],[950,9],[930,8],[910,8],[890,7]
    ];

    // College middle-50% SAT ranges (representative, 2024-2025 admissions data).
    const COLLEGES = [
        { name: 'Harvard University', low: 1490, high: 1580 },
        { name: 'Stanford University', low: 1500, high: 1580 },
        { name: 'MIT', low: 1520, high: 1580 },
        { name: 'Princeton University', low: 1500, high: 1570 },
        { name: 'Yale University', low: 1500, high: 1570 },
        { name: 'University of Pennsylvania', low: 1480, high: 1570 },
        { name: 'Caltech', low: 1530, high: 1580 },
        { name: 'Duke University', low: 1490, high: 1570 },
        { name: 'Dartmouth College', low: 1440, high: 1560 },
        { name: 'Brown University', low: 1460, high: 1570 },
        { name: 'Cornell University', low: 1450, high: 1560 },
        { name: 'Columbia University', low: 1490, high: 1570 },
        { name: 'Northwestern University', low: 1470, high: 1570 },
        { name: 'University of Chicago', low: 1510, high: 1580 },
        { name: 'Vanderbilt University', low: 1480, high: 1570 },
        { name: 'Rice University', low: 1490, high: 1570 },
        { name: 'UCLA', low: 1360, high: 1540 },
        { name: 'UC Berkeley', low: 1330, high: 1530 },
        { name: 'University of Michigan', low: 1360, high: 1530 },
        { name: 'NYU', low: 1370, high: 1540 },
        { name: 'Boston University', low: 1360, high: 1520 },
        { name: 'University of Texas at Austin', low: 1230, high: 1480 },
        { name: 'University of Florida', low: 1320, high: 1480 },
        { name: 'Ohio State University', low: 1260, high: 1440 },
        { name: 'Penn State University', low: 1220, high: 1400 },
        { name: 'Arizona State University', low: 1120, high: 1370 },
        { name: 'University of Arizona', low: 1090, high: 1360 }
    ];

    /* ---------- Helpers ---------- */

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getPercentile(total) {
        for (const [score, pct] of PERCENTILES) {
            if (total >= score) return pct;
        }
        return 1;
    }

    function getActEquivalent(satTotal) {
        for (const [sat, act] of SAT_TO_ACT) {
            if (satTotal >= sat) return act;
        }
        return 7;
    }

    function getActToSat(actScore) {
        for (const [sat, act] of SAT_TO_ACT) {
            if (act <= actScore) return sat;
        }
        return 890;
    }

    function ordinalSuffix(n) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

    function sectionScore(raw, section, curveKey) {
        const table = CURVES[curveKey][section];
        const maxRaw = section === 'rw' ? 54 : 44;
        const r = clamp(Math.round(raw), 0, maxRaw);
        return table[r] !== undefined ? table[r] : 200;
    }

    function scoreBand(total) {
        if (total >= 1550) return { label: 'Exceptional', desc: 'Top 1% of test takers. Competitive for any university in the country.' };
        if (total >= 1450) return { label: 'Excellent', desc: 'Top 5%. Strong for selective universities.' };
        if (total >= 1350) return { label: 'Very Good', desc: 'Top 10-12%. Competitive for many flagship state universities.' };
        if (total >= 1250) return { label: 'Good', desc: 'Above the national average. Solid for a wide range of colleges.' };
        if (total >= 1150) return { label: 'Above Average', desc: 'Near or above the national average of about 1024.' };
        if (total >= 1050) return { label: 'Average', desc: 'Around the national average. Many colleges admit in this range.' };
        if (total >= 950) return { label: 'Below Average', desc: 'Below the national average. Consider retaking or test-optional schools.' };
        return { label: 'Needs Work', desc: 'Well below average. A retake with focused prep is strongly recommended.' };
    }

    /* ---------- Main Calculator ---------- */

    const mainForm = document.getElementById('satForm');
    const mainResult = document.getElementById('satResult');

    if (mainForm && mainResult) {
        const rwM1 = document.getElementById('rwM1');
        const rwM2 = document.getElementById('rwM2');
        const mathM1 = document.getElementById('mathM1');
        const mathM2 = document.getElementById('mathM2');
        const curveSelect = document.getElementById('curveSelect');
        const m2DiffInputs = document.querySelectorAll('input[name="m2diff"]');
        const errorBox = document.getElementById('satError');

        function getM2Difficulty() {
            for (const input of m2DiffInputs) {
                if (input.checked) return input.value;
            }
            return 'harder';
        }

        function showError(msg) {
            errorBox.textContent = msg;
            errorBox.hidden = false;
        }

        function clearError() {
            errorBox.textContent = '';
            errorBox.hidden = true;
        }

        function validateModule(input, max, name) {
            const val = input.value.trim();
            if (val === '') { showError('Please enter ' + name + '.'); input.focus(); return null; }
            const num = Number(val);
            if (!Number.isInteger(num) || num < 0 || num > max) {
                showError(name + ' must be a whole number between 0 and ' + max + '.');
                input.focus();
                return null;
            }
            return num;
        }

        mainForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearError();

            const rw1 = validateModule(rwM1, 27, 'Reading/Writing Module 1 correct answers');
            if (rw1 === null) return;
            const rw2 = validateModule(rwM2, 27, 'Reading/Writing Module 2 correct answers');
            if (rw2 === null) return;
            const m1 = validateModule(mathM1, 22, 'Math Module 1 correct answers');
            if (m1 === null) return;
            const m2 = validateModule(mathM2, 22, 'Math Module 2 correct answers');
            if (m2 === null) return;

            const curveKey = curveSelect.value;
            const m2diff = getM2Difficulty();

            const rwRaw = rw1 + rw2;
            const mathRaw = m1 + m2;

            let rwScore = sectionScore(rwRaw, 'rw', curveKey);
            let mathScore = sectionScore(mathRaw, 'math', curveKey);

            // Adaptive routing note: if Module 2 was the easier version,
            // the score ceiling is capped (approx 600 per section on easier routing).
            let capped = false;
            if (m2diff === 'easier') {
                if (rwScore > 600) { rwScore = 600; capped = true; }
                if (mathScore > 600) { mathScore = 600; capped = true; }
            }

            const total = rwScore + mathScore;
            const percentile = getPercentile(total);
            const actEq = getActEquivalent(total);
            const band = scoreBand(total);
            const curveName = CURVES[curveKey].label;

            document.getElementById('resTotal').textContent = total;
            document.getElementById('resRW').textContent = rwScore;
            document.getElementById('resMath').textContent = mathScore;
            document.getElementById('resPercentile').textContent = percentile + (percentile === 99 ? '+' : ordinalSuffix(percentile));
            document.getElementById('resACT').textContent = actEq;
            document.getElementById('resBand').textContent = band.label;
            document.getElementById('resBandDesc').textContent = band.desc;
            document.getElementById('resCurve').textContent = curveName + ' curve';
            document.getElementById('resRawRW').textContent = rwRaw + ' / 54';
            document.getElementById('resRawMath').textContent = mathRaw + ' / 44';

            const capNote = document.getElementById('resCapNote');
            if (capped) {
                capNote.hidden = false;
                capNote.textContent = 'Note: your Module 2 was the easier version, so section scores are capped around 600. To score higher, you need the harder Module 2 routing.';
            } else {
                capNote.hidden = true;
            }

            mainResult.classList.add('visible');
            mainResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        document.getElementById('satReset').addEventListener('click', () => {
            mainForm.reset();
            clearError();
            mainResult.classList.remove('visible');
        });

        // Share button
        const shareBtn = document.getElementById('satShare');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const total = document.getElementById('resTotal').textContent;
                const text = 'I scored ' + total + ' on the SAT (estimated with StudentCalcTools SAT Score Calculator)';
                const url = 'https://studentcalctools.com/sat-score-calculator/';
                if (navigator.share) {
                    try { await navigator.share({ title: 'My SAT Score', text, url }); } catch (err) { /* dismissed */ }
                } else {
                    const shareUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
                    window.open(shareUrl, '_blank', 'noopener,width=600,height=460');
                }
            });
        }
    }

    /* ---------- Goal Planner (reverse) ---------- */

    const goalForm = document.getElementById('goalForm');
    const goalResult = document.getElementById('goalResult');

    if (goalForm && goalResult) {
        const targetInput = document.getElementById('goalTarget');
        const goalCurve = document.getElementById('goalCurve');
        const goalError = document.getElementById('goalError');

        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            goalError.hidden = true;

            const target = Number(targetInput.value);
            if (!Number.isInteger(target) || target < 400 || target > 1600 || target % 10 !== 0) {
                goalError.textContent = 'Enter a target score between 400 and 1600 in multiples of 10.';
                goalError.hidden = false;
                targetInput.focus();
                return;
            }

            const curveKey = goalCurve.value;
            // Split target evenly; each section needs target/2.
            const perSection = target / 2;
            // Find minimum raw needed per section via reverse lookup.
            function minRawFor(section, needed) {
                const table = CURVES[curveKey][section];
                const maxRaw = section === 'rw' ? 54 : 44;
                for (let r = 0; r <= maxRaw; r++) {
                    if (table[r] >= needed) return r;
                }
                return maxRaw;
            }

            const rwNeeded = minRawFor('rw', perSection);
            const mathNeeded = minRawFor('math', perSection);
            const rwMiss = 54 - rwNeeded;
            const mathMiss = 44 - mathNeeded;

            document.getElementById('goalTargetEcho').textContent = target;
            document.getElementById('goalRWNeeded').textContent = rwNeeded + ' / 54';
            document.getElementById('goalRWMiss').textContent = rwMiss;
            document.getElementById('goalMathNeeded').textContent = mathNeeded + ' / 44';
            document.getElementById('goalMathMiss').textContent = mathMiss;
            document.getElementById('goalNote').textContent =
                'This assumes a balanced split (' + perSection + ' per section) on the ' +
                CURVES[curveKey].label.toLowerCase() + ' curve with harder Module 2 routing. ' +
                'Shift points between sections if one is your strength.';

            goalResult.classList.add('visible');
            goalResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        document.getElementById('goalReset').addEventListener('click', () => {
            goalForm.reset();
            goalError.hidden = true;
            goalResult.classList.remove('visible');
        });
    }

    /* ---------- Superscore Calculator ---------- */

    const superForm = document.getElementById('superForm');
    const superResult = document.getElementById('superResult');

    if (superForm && superResult) {
        superForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dates = [];
            let bestRW = 0, bestMath = 0;

            document.querySelectorAll('.super-date').forEach((row) => {
                const rw = Number(row.querySelector('.super-rw').value);
                const math = Number(row.querySelector('.super-math').value);
                if (rw >= 200 && rw <= 800 && math >= 200 && math <= 800) {
                    dates.push({ rw, math });
                    if (rw > bestRW) bestRW = rw;
                    if (math > bestMath) bestMath = math;
                }
            });

            const errEl = document.getElementById('superError');
            if (dates.length < 2) {
                errEl.textContent = 'Enter scores from at least 2 test dates.';
                errEl.hidden = false;
                return;
            }
            errEl.hidden = true;

            const superscore = bestRW + bestMath;
            const bestSingle = Math.max(...dates.map(d => d.rw + d.math));
            const gain = superscore - bestSingle;

            document.getElementById('superBestRW').textContent = bestRW;
            document.getElementById('superBestMath').textContent = bestMath;
            document.getElementById('superTotal').textContent = superscore;
            document.getElementById('superGain').textContent = '+' + gain + ' points vs your best single sitting';
            document.getElementById('superPercentile').textContent = getPercentile(superscore) + ordinalSuffix(getPercentile(superscore)) + ' percentile';

            superResult.classList.add('visible');
            superResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        document.getElementById('superAddDate').addEventListener('click', () => {
            const container = document.getElementById('superDates');
            const rows = container.querySelectorAll('.super-date');
            if (rows.length >= 6) return;
            const div = document.createElement('div');
            div.className = 'super-date';
            div.innerHTML = '<label>Test date ' + (rows.length + 1) +
                ' <span class="super-inputs"><input type="number" class="super-rw" min="200" max="800" step="10" placeholder="RW (200-800)" aria-label="Reading Writing score">' +
                '<input type="number" class="super-math" min="200" max="800" step="10" placeholder="Math (200-800)" aria-label="Math score"></span></label>';
            container.appendChild(div);
        });

        document.getElementById('superReset').addEventListener('click', () => {
            document.getElementById('superDates').innerHTML =
                '<div class="super-date"><label>Test date 1 <span class="super-inputs">' +
                '<input type="number" class="super-rw" min="200" max="800" step="10" placeholder="RW (200-800)" aria-label="Reading Writing score">' +
                '<input type="number" class="super-math" min="200" max="800" step="10" placeholder="Math (200-800)" aria-label="Math score"></span></label></div>' +
                '<div class="super-date"><label>Test date 2 <span class="super-inputs">' +
                '<input type="number" class="super-rw" min="200" max="800" step="10" placeholder="RW (200-800)" aria-label="Reading Writing score">' +
                '<input type="number" class="super-math" min="200" max="800" step="10" placeholder="Math (200-800)" aria-label="Math score"></span></label></div>';
            document.getElementById('superError').hidden = true;
            superResult.classList.remove('visible');
        });
    }

    /* ---------- SAT <-> ACT Converter ---------- */

    const convForm = document.getElementById('convForm');
    const convResult = document.getElementById('convResult');

    if (convForm && convResult) {
        convForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errEl = document.getElementById('convError');
            errEl.hidden = true;

            const direction = document.querySelector('input[name="convDir"]:checked').value;
            const inputVal = Number(document.getElementById('convInput').value);

            if (direction === 'sat2act') {
                if (!Number.isInteger(inputVal) || inputVal < 400 || inputVal > 1600) {
                    errEl.textContent = 'Enter an SAT score between 400 and 1600.';
                    errEl.hidden = false;
                    return;
                }
                const act = getActEquivalent(inputVal);
                document.getElementById('convOutLabel').textContent = 'ACT equivalent';
                document.getElementById('convOutValue').textContent = act + ' / 36';
                document.getElementById('convOutNote').textContent =
                    'Based on the official 2018 SAT-ACT concordance. An SAT ' + inputVal + ' concords to ACT ' + act + '.';
            } else {
                if (!Number.isInteger(inputVal) || inputVal < 1 || inputVal > 36) {
                    errEl.textContent = 'Enter an ACT score between 1 and 36.';
                    errEl.hidden = false;
                    return;
                }
                const sat = getActToSat(inputVal);
                document.getElementById('convOutLabel').textContent = 'SAT equivalent';
                document.getElementById('convOutValue').textContent = sat;
                document.getElementById('convOutNote').textContent =
                    'Based on the official 2018 SAT-ACT concordance. An ACT ' + inputVal + ' concords to roughly SAT ' + sat + '.';
            }

            convResult.classList.add('visible');
            convResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        document.getElementById('convReset').addEventListener('click', () => {
            convForm.reset();
            document.getElementById('convError').hidden = true;
            convResult.classList.remove('visible');
        });
    }

    /* ---------- College Benchmark Search ---------- */

    const collegeSearch = document.getElementById('collegeSearch');
    const collegeScore = document.getElementById('collegeScore');
    const collegeResults = document.getElementById('collegeResults');

    if (collegeSearch && collegeScore && collegeResults) {
        function renderColleges() {
            const query = collegeSearch.value.trim().toLowerCase();
            const score = Number(collegeScore.value);
            const hasScore = Number.isInteger(score) && score >= 400 && score <= 1600;

            const matches = COLLEGES.filter(c =>
                c.name.toLowerCase().includes(query)
            ).slice(0, 12);

            if (matches.length === 0) {
                collegeResults.innerHTML = '<p class="college-empty">No colleges match your search. Try another name.</p>';
                return;
            }

            collegeResults.innerHTML = matches.map(c => {
                let status = '', statusClass = '';
                if (hasScore) {
                    if (score >= c.low && score <= c.high) {
                        status = 'In range'; statusClass = 'in-range';
                    } else if (score > c.high) {
                        status = 'Above 75th percentile'; statusClass = 'above';
                    } else if (score >= c.low - 80) {
                        status = 'Near range'; statusClass = 'near';
                    } else {
                        status = 'Below range'; statusClass = 'below';
                    }
                }
                return '<div class="college-card">' +
                    '<p class="college-name">' + c.name + '</p>' +
                    '<p class="college-range">Middle 50%: <strong>' + c.low + '-' + c.high + '</strong></p>' +
                    (hasScore ? '<p class="college-status ' + statusClass + '">' + status + '</p>' : '') +
                    '</div>';
            }).join('');
        }

        collegeSearch.addEventListener('input', renderColleges);
        collegeScore.addEventListener('input', renderColleges);
        renderColleges();
    }

    /* ---------- Conversion Table Tabs ---------- */

    document.querySelectorAll('.curve-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.curve-tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.curve-table-wrap').forEach(w => {
                w.hidden = true;
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const target = document.getElementById(tab.dataset.target);
            if (target) target.hidden = false;
        });
    });

})();
