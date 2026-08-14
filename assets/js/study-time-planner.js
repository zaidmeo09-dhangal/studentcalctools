(() => {
    'use strict';

    const form = document.getElementById('studyPlannerForm');
    const startDateInput = document.getElementById('startDate');
    const planDaysInput = document.getElementById('planDays');
    const totalHoursInput = document.getElementById('totalHours');
    const sessionLengthInput = document.getElementById('sessionLength');
    const bufferInput = document.getElementById('bufferPercent');
    const rowsContainer = document.getElementById('subjectRows');
    const addButton = document.getElementById('addSubject');
    const resultBox = document.getElementById('resultBox');
    const resultDescription = document.getElementById('resultDescription');
    const summaryBadges = document.getElementById('summaryBadges');
    const allocationGrid = document.getElementById('allocationGrid');
    const dayGrid = document.getElementById('dayGrid');
    const copyButton = document.getElementById('copyPlan');
    const printButton = document.getElementById('printPlan');
    const resetButton = document.getElementById('resetPlan');

    if (
        !form ||
        !startDateInput ||
        !planDaysInput ||
        !totalHoursInput ||
        !sessionLengthInput ||
        !bufferInput ||
        !rowsContainer ||
        !addButton ||
        !resultBox ||
        !resultDescription ||
        !summaryBadges ||
        !allocationGrid ||
        !dayGrid ||
        !copyButton ||
        !printButton ||
        !resetButton
    ) {
        return;
    }

    const initialRowsHTML = rowsContainer.innerHTML;

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );

    let copyText = '';

    function localDateString(dateValue) {
        const year = dateValue.getFullYear();
        const month = String(
            dateValue.getMonth() + 1
        ).padStart(2, '0');

        const day = String(
            dateValue.getDate()
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    function parseLocalDate(value) {
        if (!value) {
            return null;
        }

        const parts = value
            .split('-')
            .map(Number);

        if (
            parts.length !== 3 ||
            !parts.every(Number.isFinite)
        ) {
            return null;
        }

        const date = new Date(
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

    function addDays(dateValue, amount) {
        const next = new Date(dateValue);

        next.setDate(
            next.getDate() + amount
        );

        return next;
    }

    function formatDate(dateValue) {
        return new Intl.DateTimeFormat(
            'en-US',
            {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }
        ).format(dateValue);
    }

    function formatMinutes(minutes) {
        const total = Math.max(
            0,
            Math.round(minutes)
        );

        const hours = Math.floor(
            total / 60
        );

        const mins = total % 60;

        if (hours && mins) {
            return `${hours}h ${mins}m`;
        }

        if (hours) {
            return `${hours}h`;
        }

        return `${mins}m`;
    }

    function purposeFor(
        subject,
        sessionIndex,
        totalSessions
    ) {
        if (
            sessionIndex === 0 &&
            subject.confidence === 'low'
        ) {
            return 'Diagnose weak areas and review core concepts';
        }

        if (
            sessionIndex === totalSessions - 1 &&
            totalSessions > 1
        ) {
            return 'Retrieval check and error review';
        }

        if (subject.difficulty >= 4) {
            return 'Practice problems or active application';
        }

        if (subject.priority === 'urgent') {
            return 'Deadline-focused work';
        }

        return 'Active recall, practice, or focused review';
    }

    function clearError(input) {
        input.removeAttribute(
            'aria-invalid'
        );

        const error = input.parentElement
            .querySelector('.field-error');

        if (error) {
            error.remove();
        }
    }

    function clearAllErrors() {
        form
            .querySelectorAll('[aria-invalid="true"]')
            .forEach((input) => {
                input.removeAttribute(
                    'aria-invalid'
                );
            });

        form
            .querySelectorAll('.field-error')
            .forEach((error) => {
                error.remove();
            });
    }

    function showError(
        input,
        message
    ) {
        input.setAttribute(
            'aria-invalid',
            'true'
        );

        let error = input.parentElement
            .querySelector('.field-error');

        if (!error) {
            error = document.createElement(
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

        error.textContent = message;
    }

    function setNeutralResult() {
        resultBox.classList.remove(
            'visible'
        );

        resultDescription.textContent =
            'Your subject allocation and daily sessions will appear here.';

        summaryBadges.innerHTML = '';
        allocationGrid.innerHTML = '';
        dayGrid.innerHTML = '';
        copyText = '';
    }

    function setInitialDates() {
        const today = new Date();

        startDateInput.value =
            localDateString(today);

        const offsets = [
            6,
            10,
            13
        ];

        rowsContainer
            .querySelectorAll(
                '.deadline-control'
            )
            .forEach(
                (
                    input,
                    index
                ) => {
                    if (
                        !input.value &&
                        offsets[index] !== undefined
                    ) {
                        input.value =
                            localDateString(
                                addDays(
                                    today,
                                    offsets[index]
                                )
                            );
                    }
                }
            );
    }

    function rowMarkup() {
        return `
            <input
                class="control subject-name"
                type="text"
                placeholder="Subject or topic"
                aria-label="Subject or topic">

            <select
                class="control difficulty-control"
                aria-label="Difficulty">

                <option value="1">1 - Very easy</option>
                <option value="2">2 - Easy</option>
                <option value="3" selected>3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Very hard</option>
            </select>

            <select
                class="control confidence-control"
                aria-label="Confidence">

                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
            </select>

            <select
                class="control priority-control"
                aria-label="Priority">

                <option value="normal" selected>Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </select>

            <input
                class="control deadline-control"
                type="date"
                aria-label="Exam or deadline">

            <button
                class="remove-btn"
                type="button"
                aria-label="Remove subject">

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true">

                    <path d="M5 5l14 14M19 5 5 19"></path>
                </svg>
            </button>
        `;
    }

    function confidenceFactor(value) {
        if (value === 'low') {
            return 1.4;
        }

        if (value === 'medium') {
            return 1.15;
        }

        return 1;
    }

    function priorityFactor(value) {
        if (value === 'urgent') {
            return 1.55;
        }

        if (value === 'high') {
            return 1.25;
        }

        return 1;
    }

    function deadlineFactor(
        deadline,
        startDate
    ) {
        if (!deadline) {
            return 1;
        }

        const daysAway = Math.ceil(
            (
                deadline -
                startDate
            ) /
            86400000
        );

        if (daysAway <= 3) {
            return 1.5;
        }

        if (daysAway <= 7) {
            return 1.3;
        }

        if (daysAway <= 14) {
            return 1.12;
        }

        return 1;
    }

    function allocateRoundedMinutes(
        subjects,
        totalMinutes
    ) {
        const sumScore = subjects.reduce(
            (
                sum,
                subject
            ) => {
                return sum + subject.score;
            },
            0
        );

        const raw = subjects.map(
            (subject) => {
                const exact =
                    totalMinutes *
                    subject.score /
                    sumScore;

                const base =
                    Math.floor(
                        exact / 5
                    ) * 5;

                return {
                    subject,
                    exact,
                    minutes: base,
                    remainder:
                        exact - base
                };
            }
        );

        const assigned = raw.reduce(
            (
                sum,
                item
            ) => {
                return sum + item.minutes;
            },
            0
        );

        let remaining =
            totalMinutes - assigned;

        const ordered = raw
            .slice()
            .sort(
                (
                    first,
                    second
                ) => {
                    return (
                        second.remainder -
                        first.remainder
                    );
                }
            );

        let index = 0;

        while (
            remaining >= 5 &&
            ordered.length
        ) {
            ordered[
                index %
                ordered.length
            ].minutes += 5;

            remaining -= 5;
            index += 1;
        }

        if (
            remaining > 0 &&
            ordered.length
        ) {
            ordered[0].minutes +=
                remaining;
        }

        return raw;
    }

    function splitSessions(
        subject,
        sessionLength
    ) {
        const sessions = [];
        let remaining = subject.minutes;

        while (remaining > 0) {
            const duration = Math.min(
                sessionLength,
                remaining
            );

            sessions.push(duration);

            remaining -= duration;
        }

        return sessions;
    }

    function buildSchedule(
        subjects,
        days,
        startDate,
        sessionLength
    ) {
        const dayPlans = Array.from(
            {
                length: days
            },
            (
                _,
                index
            ) => {
                return {
                    date:
                        addDays(
                            startDate,
                            index
                        ),
                    minutes: 0,
                    sessions: []
                };
            }
        );

        const allSessions = [];

        subjects
            .slice()
            .sort(
                (
                    first,
                    second
                ) => {
                    return (
                        second.score -
                        first.score
                    );
                }
            )
            .forEach(
                (subject) => {
                    const chunks =
                        splitSessions(
                            subject,
                            sessionLength
                        );

                    chunks.forEach(
                        (
                            duration,
                            index
                        ) => {
                            allSessions.push({
                                subject,
                                duration,
                                index,
                                total:
                                    chunks.length
                            });
                        }
                    );
                }
            );

        allSessions.forEach(
            (session) => {
                const eligible =
                    dayPlans.filter(
                        (day) => {
                            return (
                                !session.subject
                                    .deadline ||
                                day.date <=
                                    session.subject
                                        .deadline
                            );
                        }
                    );

                const pool =
                    eligible.length
                        ? eligible
                        : dayPlans;

                pool.sort(
                    (
                        first,
                        second
                    ) => {
                        if (
                            first.minutes !==
                            second.minutes
                        ) {
                            return (
                                first.minutes -
                                second.minutes
                            );
                        }

                        return (
                            first.date -
                            second.date
                        );
                    }
                );

                const targetDay =
                    pool[0];

                targetDay.sessions
                    .push(session);

                targetDay.minutes +=
                    session.duration;
            }
        );

        dayPlans.sort(
            (
                first,
                second
            ) => {
                return (
                    first.date -
                    second.date
                );
            }
        );

        return dayPlans;
    }

    function validateAndCollect() {
        clearAllErrors();

        const startDate =
            parseLocalDate(
                startDateInput.value
            );

        const planDays =
            Number.parseInt(
                planDaysInput.value,
                10
            );

        const totalHours =
            Number.parseFloat(
                totalHoursInput.value
            );

        const sessionLength =
            Number.parseInt(
                sessionLengthInput.value,
                10
            );

        const bufferPercent =
            Number.parseInt(
                bufferInput.value,
                10
            );

        let valid = true;
        let firstInvalid = null;

        if (!startDate) {
            showError(
                startDateInput,
                'Choose a valid start date.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                startDateInput;
        }

        if (
            ![1, 3, 7, 14]
                .includes(planDays)
        ) {
            showError(
                planDaysInput,
                'Choose a valid planning period.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                planDaysInput;
        }

        if (
            !Number.isFinite(
                totalHours
            ) ||
            totalHours < 0.5 ||
            totalHours > 100
        ) {
            showError(
                totalHoursInput,
                'Enter total hours from 0.5 to 100.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                totalHoursInput;
        }

        if (
            ![25, 45, 60]
                .includes(
                    sessionLength
                )
        ) {
            showError(
                sessionLengthInput,
                'Choose a valid focus session length.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                sessionLengthInput;
        }

        if (
            ![0, 10, 20]
                .includes(
                    bufferPercent
                )
        ) {
            showError(
                bufferInput,
                'Choose a valid buffer setting.'
            );

            valid = false;

            firstInvalid =
                firstInvalid ||
                bufferInput;
        }

        const subjects = [];

        const subjectRows =
            Array.from(
                rowsContainer
                    .querySelectorAll(
                        '.subject-row'
                    )
            );

        subjectRows.forEach(
            (row) => {
                const nameInput =
                    row.querySelector(
                        '.subject-name'
                    );

                const difficultyInput =
                    row.querySelector(
                        '.difficulty-control'
                    );

                const confidenceInput =
                    row.querySelector(
                        '.confidence-control'
                    );

                const priorityInput =
                    row.querySelector(
                        '.priority-control'
                    );

                const deadlineInput =
                    row.querySelector(
                        '.deadline-control'
                    );

                const name =
                    nameInput.value.trim();

                const difficulty =
                    Number.parseInt(
                        difficultyInput.value,
                        10
                    );

                const confidence =
                    confidenceInput.value;

                const priority =
                    priorityInput.value;

                const deadlineRaw =
                    deadlineInput.value.trim();

                const deadline =
                    deadlineRaw
                        ? parseLocalDate(
                            deadlineRaw
                        )
                        : null;

                if (!name) {
                    showError(
                        nameInput,
                        'Enter a subject or topic name.'
                    );

                    valid = false;

                    firstInvalid =
                        firstInvalid ||
                        nameInput;

                    return;
                }

                if (
                    ![1, 2, 3, 4, 5]
                        .includes(
                            difficulty
                        )
                ) {
                    showError(
                        difficultyInput,
                        'Choose a difficulty from 1 to 5.'
                    );

                    valid = false;

                    firstInvalid =
                        firstInvalid ||
                        difficultyInput;

                    return;
                }

                if (
                    ![
                        'low',
                        'medium',
                        'high'
                    ].includes(
                        confidence
                    )
                ) {
                    showError(
                        confidenceInput,
                        'Choose a valid confidence level.'
                    );

                    valid = false;

                    firstInvalid =
                        firstInvalid ||
                        confidenceInput;

                    return;
                }

                if (
                    ![
                        'normal',
                        'high',
                        'urgent'
                    ].includes(
                        priority
                    )
                ) {
                    showError(
                        priorityInput,
                        'Choose a valid priority.'
                    );

                    valid = false;

                    firstInvalid =
                        firstInvalid ||
                        priorityInput;

                    return;
                }

                if (
                    deadlineRaw &&
                    !deadline
                ) {
                    showError(
                        deadlineInput,
                        'Choose a valid deadline.'
                    );

                    valid = false;

                    firstInvalid =
                        firstInvalid ||
                        deadlineInput;

                    return;
                }

                if (
                    startDate &&
                    deadline &&
                    deadline < startDate
                ) {
                    showError(
                        deadlineInput,
                        'Deadline cannot be before the plan start date.'
                    );

                    valid = false;

                    firstInvalid =
                        firstInvalid ||
                        deadlineInput;

                    return;
                }

                const score =
                    difficulty *
                    confidenceFactor(
                        confidence
                    ) *
                    priorityFactor(
                        priority
                    ) *
                    deadlineFactor(
                        deadline,
                        startDate ||
                            new Date()
                    );

                subjects.push({
                    name,
                    difficulty,
                    confidence,
                    priority,
                    deadline,
                    score,
                    minutes: 0
                });
            }
        );

        if (
            !subjects.length &&
            valid
        ) {
            valid = false;

            firstInvalid =
                subjectRows[0]
                    ? subjectRows[0]
                        .querySelector(
                            '.subject-name'
                        )
                    : null;

            if (firstInvalid) {
                showError(
                    firstInvalid,
                    'Enter at least one subject or topic.'
                );
            }
        }

        if (!valid) {
            setNeutralResult();

            if (firstInvalid) {
                firstInvalid.focus();
            }

            return null;
        }

        return {
            startDate,
            planDays,
            totalHours,
            sessionLength,
            bufferPercent,
            subjects
        };
    }

    function renderPlan(values) {
        const totalMinutes =
            Math.round(
                values.totalHours * 60
            );

        const usableMinutes =
            Math.max(
                5,
                Math.floor(
                    totalMinutes *
                    (
                        1 -
                        values.bufferPercent /
                        100
                    ) /
                    5
                ) *
                5
            );

        const bufferMinutes =
            totalMinutes -
            usableMinutes;

        const allocations =
            allocateRoundedMinutes(
                values.subjects,
                usableMinutes
            );

        allocations.forEach(
            (item) => {
                item.subject.minutes =
                    item.minutes;
            }
        );

        const dayPlans =
            buildSchedule(
                values.subjects,
                values.planDays,
                values.startDate,
                values.sessionLength
            );

        const totalSessions =
            dayPlans.reduce(
                (
                    sum,
                    day
                ) => {
                    return (
                        sum +
                        day.sessions.length
                    );
                },
                0
            );

        resultDescription.textContent =
            'Plan from ' +
            formatDate(
                values.startDate
            ) +
            ' across ' +
            values.planDays +
            ' day' +
            (
                values.planDays === 1
                    ? ''
                    : 's'
            ) +
            '.';

        summaryBadges.innerHTML = '';

        [
            formatMinutes(
                usableMinutes
            ) +
                ' scheduled',

            formatMinutes(
                bufferMinutes
            ) +
                ' buffer',

            values.subjects.length +
                ' subject' +
                (
                    values.subjects
                        .length === 1
                        ? ''
                        : 's'
                ),

            totalSessions +
                ' focused session' +
                (
                    totalSessions === 1
                        ? ''
                        : 's'
                )
        ].forEach(
            (text) => {
                const badge =
                    document.createElement(
                        'span'
                    );

                badge.className =
                    'summary-badge';

                badge.textContent =
                    text;

                summaryBadges
                    .appendChild(
                        badge
                    );
            }
        );

        allocationGrid.innerHTML = '';

        const maxMinutes =
            Math.max(
                ...values.subjects
                    .map(
                        (subject) =>
                            subject.minutes
                    )
            );

        values.subjects
            .slice()
            .sort(
                (
                    first,
                    second
                ) => {
                    return (
                        second.minutes -
                        first.minutes
                    );
                }
            )
            .forEach(
                (subject) => {
                    const card =
                        document.createElement(
                            'article'
                        );

                    card.className =
                        'allocation-card';

                    const top =
                        document.createElement(
                            'div'
                        );

                    top.className =
                        'allocation-top';

                    const name =
                        document.createElement(
                            'span'
                        );

                    name.className =
                        'allocation-name';

                    name.textContent =
                        subject.name;

                    const time =
                        document.createElement(
                            'span'
                        );

                    time.className =
                        'allocation-time';

                    time.textContent =
                        formatMinutes(
                            subject.minutes
                        );

                    top.appendChild(name);
                    top.appendChild(time);

                    const meta =
                        document.createElement(
                            'div'
                        );

                    meta.className =
                        'allocation-meta';

                    const deadlineText =
                        subject.deadline
                            ? ' · deadline ' +
                              formatDate(
                                  subject.deadline
                              )
                            : '';

                    const sessionCount =
                        splitSessions(
                            subject,
                            values.sessionLength
                        ).length;

                    meta.textContent =
                        'Difficulty ' +
                        subject.difficulty +
                        '/5 · ' +
                        subject.confidence +
                        ' confidence · ' +
                        subject.priority +
                        ' priority' +
                        deadlineText +
                        ' · ' +
                        sessionCount +
                        ' session' +
                        (
                            sessionCount === 1
                                ? ''
                                : 's'
                        );

                    const bar =
                        document.createElement(
                            'div'
                        );

                    bar.className =
                        'allocation-bar';

                    const barFill =
                        document.createElement(
                            'span'
                        );

                    const width =
                        maxMinutes
                            ? Math.max(
                                4,
                                subject.minutes /
                                maxMinutes *
                                100
                            )
                            : 0;

                    barFill.style.width =
                        `${width.toFixed(1)}%`;

                    bar.appendChild(
                        barFill
                    );

                    card.appendChild(top);
                    card.appendChild(meta);
                    card.appendChild(bar);

                    allocationGrid
                        .appendChild(card);
                }
            );

        dayGrid.innerHTML = '';

        copyText =
            'STUDY SCHEDULE\n';

        copyText +=
            'Start: ' +
            formatDate(
                values.startDate
            ) +
            '\n';

        copyText +=
            'Scheduled: ' +
            formatMinutes(
                usableMinutes
            ) +
            ' | Buffer: ' +
            formatMinutes(
                bufferMinutes
            ) +
            '\n\n';

        dayPlans.forEach(
            (day) => {
                const card =
                    document.createElement(
                        'article'
                    );

                card.className =
                    'day-card';

                const heading =
                    document.createElement(
                        'h4'
                    );

                heading.textContent =
                    formatDate(
                        day.date
                    );

                card.appendChild(
                    heading
                );

                const total =
                    document.createElement(
                        'div'
                    );

                total.className =
                    'day-total';

                total.textContent =
                    day.sessions.length
                        ? formatMinutes(
                            day.minutes
                          ) +
                          ' scheduled'
                        : 'Buffer or rest day';

                card.appendChild(
                    total
                );

                copyText +=
                    formatDate(
                        day.date
                    ) +
                    ' (' +
                    formatMinutes(
                        day.minutes
                    ) +
                    ')\n';

                if (
                    !day.sessions.length
                ) {
                    const empty =
                        document.createElement(
                            'p'
                        );

                    empty.className =
                        'empty-day';

                    empty.textContent =
                        'No fixed session. Use this day for rest, catch-up, or light review.';

                    card.appendChild(
                        empty
                    );

                    copyText +=
                        '  Buffer, rest, or catch-up\n\n';
                } else {
                    day.sessions.forEach(
                        (session) => {
                            const item =
                                document.createElement(
                                    'div'
                                );

                            item.className =
                                'session-item';

                            const dot =
                                document.createElement(
                                    'span'
                                );

                            dot.className =
                                'session-dot';

                            const details =
                                document.createElement(
                                    'div'
                                );

                            const name =
                                document.createElement(
                                    'div'
                                );

                            name.className =
                                'session-name';

                            name.textContent =
                                session.subject
                                    .name;

                            const purpose =
                                document.createElement(
                                    'div'
                                );

                            purpose.className =
                                'session-purpose';

                            purpose.textContent =
                                purposeFor(
                                    session.subject,
                                    session.index,
                                    session.total
                                );

                            details.appendChild(
                                name
                            );

                            details.appendChild(
                                purpose
                            );

                            const time =
                                document.createElement(
                                    'span'
                                );

                            time.className =
                                'session-time';

                            time.textContent =
                                formatMinutes(
                                    session.duration
                                );

                            item.appendChild(dot);
                            item.appendChild(details);
                            item.appendChild(time);

                            card.appendChild(
                                item
                            );

                            copyText +=
                                '  - ' +
                                session.subject
                                    .name +
                                ': ' +
                                formatMinutes(
                                    session.duration
                                ) +
                                ' | ' +
                                purpose.textContent +
                                '\n';
                        }
                    );

                    copyText += '\n';
                }

                dayGrid.appendChild(
                    card
                );
            }
        );

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

        if (
            typeof window.gtag ===
            'function'
        ) {
            window.gtag(
                'event',
                'calculator_used',
                {
                    tool:
                        'study_schedule_planner'
                }
            );
        }
    }

    async function copyToClipboard(text) {
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

    form.addEventListener(
        'submit',
        (event) => {
            event.preventDefault();

            const values =
                validateAndCollect();

            if (!values) {
                return;
            }

            renderPlan(values);
        }
    );

    addButton.addEventListener(
        'click',
        () => {
            const row =
                document.createElement(
                    'div'
                );

            row.className =
                'subject-row';

            row.innerHTML =
                rowMarkup();

            rowsContainer
                .appendChild(row);

            setNeutralResult();

            const subjectName =
                row.querySelector(
                    '.subject-name'
                );

            if (subjectName) {
                subjectName.focus();
            }
        }
    );

    rowsContainer.addEventListener(
        'click',
        (event) => {
            const removeButton =
                event.target.closest(
                    '.remove-btn'
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
                    '.subject-row'
                );

            if (row) {
                row.remove();
                setNeutralResult();
            }
        }
    );

    form.addEventListener(
        'input',
        (event) => {
            if (
                event.target.matches(
                    '.control'
                )
            ) {
                clearError(
                    event.target
                );

                setNeutralResult();
            }
        }
    );

    form.addEventListener(
        'change',
        (event) => {
            if (
                event.target.matches(
                    '.control'
                )
            ) {
                clearError(
                    event.target
                );

                setNeutralResult();
            }
        }
    );

    copyButton.addEventListener(
        'click',
        async () => {
            const text =
                copyText ||
                'Generate a study schedule first.';

            const label =
                copyButton.querySelector(
                    'span'
                );

            const originalText =
                label
                    ? label.textContent
                    : 'Copy Schedule';

            try {
                await copyToClipboard(
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

    printButton.addEventListener(
        'click',
        () => {
            window.print();
        }
    );

    resetButton.addEventListener(
        'click',
        () => {
            rowsContainer.innerHTML =
                initialRowsHTML;

            planDaysInput.value = '7';
            totalHoursInput.value = '12';
            sessionLengthInput.value = '45';
            bufferInput.value = '10';

            clearAllErrors();
            setInitialDates();
            setNeutralResult();

            startDateInput.focus();
        }
    );

    setInitialDates();
    setNeutralResult();
})();
