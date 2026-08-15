(() => {
    'use strict';

    const textInput =
        document.getElementById('text');

    const targetInput =
        document.getElementById('targetWords');

    const targetError =
        document.getElementById('targetError');

    const readingSpeedInput =
        document.getElementById('readingSpeed');

    const speakingSpeedInput =
        document.getElementById('speakingSpeed');

    const targetCard =
        document.getElementById('targetCard');

    const targetRatio =
        document.getElementById('targetRatio');

    const targetStatus =
        document.getElementById('targetStatus');

    const targetFill =
        document.getElementById('targetFill');

    const targetTrack =
        document.getElementById('targetTrack');

    const fileInput =
        document.getElementById('file');

    const fileStatus =
        document.getElementById('fileStatus');

    const keywordBody =
        document.getElementById('kwBody');

    const keywordTable =
        document.getElementById('kwTable');

    const keywordEmpty =
        document.getElementById('kwEmpty');

    const uploadButton =
        document.getElementById('upload');

    const sampleButton =
        document.getElementById('sample');

    const copyButton =
        document.getElementById('copy');

    const downloadButton =
        document.getElementById('download');

    const clearButton =
        document.getElementById('clear');

    if (
        !textInput ||
        !targetInput ||
        !targetError ||
        !readingSpeedInput ||
        !speakingSpeedInput ||
        !targetCard ||
        !targetRatio ||
        !targetStatus ||
        !targetFill ||
        !targetTrack ||
        !fileInput ||
        !fileStatus ||
        !keywordBody ||
        !keywordTable ||
        !keywordEmpty ||
        !uploadButton ||
        !sampleButton ||
        !copyButton ||
        !downloadButton ||
        !clearButton
    ) {
        return;
    }

    const outputIds = [
        'wordCount',
        'charCount',
        'charNoSpace',
        'sentenceCount',
        'paragraphCount',
        'uniqueCount',
        'readingTime',
        'speakingTime',
        'avgSentence',
        'avgWord',
        'diversity',
        'pages'
    ];

    const outputs =
        Object.fromEntries(
            outputIds.map(
                (id) => [
                    id,
                    document.getElementById(id)
                ]
            )
        );

    if (
        Object.values(outputs)
            .some((output) => !output)
    ) {
        return;
    }

    const stopWords =
        new Set(
            (
                'a an and are as at be been being but by can could ' +
                'did do does for from had has have he her hers him his ' +
                'how i if in into is it its may me more most my no not ' +
                'of on or our ours she should so some such than that the ' +
                'their theirs them then there these they this those to too ' +
                'up us was we were what when where which who why will with ' +
                'would you your yours'
            ).split(' ')
        );

    const sampleText =
        'A strong essay does more than reach a required word count. ' +
        'It presents a clear claim, supports that claim with relevant ' +
        'evidence, and explains why the evidence matters. During revision, ' +
        'a student can use a Word Counter to check the assignment limit, ' +
        'but the number alone cannot measure quality. Sentence length, ' +
        'paragraph structure, repeated keywords, and the balance between ' +
        'evidence and analysis also matter. The final draft should answer ' +
        'the question directly, follow the required format, and remove ' +
        'material that does not support the main argument.';

    const allowedExtensions =
        new Set([
            'txt',
            'md',
            'csv'
        ]);

    const maximumFileSize =
        5 * 1024 * 1024;

    let updateFrame = null;

    function trackAction(action) {
        if (
            typeof window.gtag ===
            'function'
        ) {
            window.gtag(
                'event',
                'calculator_used',
                {
                    tool:
                        'word_counter',

                    action:
                        action
                }
            );
        }
    }

    function formatNumber(value) {
        return Number(value)
            .toLocaleString(
                'en-US'
            );
    }

    function formatDuration(minutes) {
        if (
            !minutes ||
            minutes <= 0
        ) {
            return '0m';
        }

        if (minutes < 1) {
            return '<1m';
        }

        const roundedMinutes =
            Math.ceil(minutes);

        const hours =
            Math.floor(
                roundedMinutes /
                60
            );

        const minutesLeft =
            roundedMinutes % 60;

        if (
            hours &&
            minutesLeft
        ) {
            return (
                `${hours}h ` +
                `${minutesLeft}m`
            );
        }

        if (hours) {
            return `${hours}h`;
        }

        return `${minutesLeft}m`;
    }

    function getWords(text) {
        if (!text.trim()) {
            return [];
        }

        if (
            typeof Intl !==
                'undefined' &&
            typeof Intl.Segmenter ===
                'function'
        ) {
            const segmenter =
                new Intl.Segmenter(
                    undefined,
                    {
                        granularity:
                            'word'
                    }
                );

            return Array.from(
                segmenter.segment(
                    text
                )
            )
                .filter(
                    (segment) =>
                        segment.isWordLike
                )
                .map(
                    (segment) =>
                        segment.segment
                );
        }

        return (
            text.match(
                /[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu
            ) || []
        );
    }

    function normalizeWord(word) {
        return word
            .toLocaleLowerCase()
            .replace(
                /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,
                ''
            );
    }

    function countSentences(text) {
        if (!text.trim()) {
            return 0;
        }

        if (
            typeof Intl !==
                'undefined' &&
            typeof Intl.Segmenter ===
                'function'
        ) {
            const segmenter =
                new Intl.Segmenter(
                    undefined,
                    {
                        granularity:
                            'sentence'
                    }
                );

            return Array.from(
                segmenter.segment(
                    text
                )
            ).filter(
                (segment) =>
                    segment.segment
                        .trim()
            ).length;
        }

        const matches =
            text.match(
                /[^.!?]+(?:[.!?]+|$)/g
            ) || [];

        const count =
            matches.filter(
                (sentence) =>
                    sentence.trim()
            ).length;

        return count || 1;
    }

    function countParagraphs(text) {
        if (!text.trim()) {
            return 0;
        }

        return text
            .split(/\n+/)
            .filter(
                (paragraph) =>
                    paragraph.trim()
            )
            .length;
    }

    function getTargetValue() {
        const rawValue =
            targetInput.value
                .trim();

        targetInput.removeAttribute(
            'aria-invalid'
        );

        targetError.hidden =
            true;

        targetError.textContent =
            '';

        if (rawValue === '') {
            return 0;
        }

        const target =
            Number(rawValue);

        if (
            !Number.isFinite(target) ||
            !Number.isInteger(target) ||
            target < 0 ||
            target > 1000000
        ) {
            targetInput.setAttribute(
                'aria-invalid',
                'true'
            );

            targetError.textContent =
                'Enter a whole-number target from 0 to 1,000,000.';

            targetError.hidden =
                false;

            return null;
        }

        return target;
    }

    function updateTarget(
        wordCount
    ) {
        const target =
            getTargetValue();

        if (
            target === null ||
            target === 0
        ) {
            targetCard.hidden =
                true;

            targetTrack.setAttribute(
                'aria-valuenow',
                '0'
            );

            targetFill.style.width =
                '0%';

            return;
        }

        targetCard.hidden =
            false;

        targetRatio.textContent =
            `${formatNumber(wordCount)} ` +
            `of ${formatNumber(target)} words`;

        const progress =
            Math.min(
                100,
                (
                    wordCount /
                    target
                ) *
                100
            );

        targetFill.style.width =
            `${progress}%`;

        targetTrack.setAttribute(
            'aria-valuenow',
            String(
                Math.round(
                    progress
                )
            )
        );

        const difference =
            target -
            wordCount;

        if (difference > 0) {
            targetStatus.textContent =
                `${formatNumber(difference)} ` +
                `word${
                    difference === 1
                        ? ''
                        : 's'
                } remaining`;

            targetStatus.style.color =
                'var(--b)';

            return;
        }

        if (difference === 0) {
            targetStatus.textContent =
                'Target reached';

            targetStatus.style.color =
                'var(--ok)';

            return;
        }

        const over =
            Math.abs(
                difference
            );

        targetStatus.textContent =
            `${formatNumber(over)} ` +
            `word${
                over === 1
                    ? ''
                    : 's'
            } over`;

        targetStatus.style.color =
            'var(--bad)';
    }

    function updateKeywords(
        normalizedWords,
        totalWords
    ) {
        const frequencies =
            new Map();

        normalizedWords.forEach(
            (word) => {
                if (
                    word.length < 3 ||
                    stopWords.has(word) ||
                    /^\d+$/.test(word)
                ) {
                    return;
                }

                frequencies.set(
                    word,
                    (
                        frequencies.get(
                            word
                        ) || 0
                    ) + 1
                );
            }
        );

        const topKeywords =
            Array.from(
                frequencies
            )
                .sort(
                    (
                        first,
                        second
                    ) => {
                        return (
                            second[1] -
                                first[1] ||
                            first[0]
                                .localeCompare(
                                    second[0]
                                )
                        );
                    }
                )
                .slice(
                    0,
                    10
                );

        keywordBody.innerHTML =
            '';

        keywordTable.hidden =
            topKeywords.length === 0;

        keywordEmpty.hidden =
            topKeywords.length > 0;

        topKeywords.forEach(
            (
                [
                    keyword,
                    count
                ]
            ) => {
                const row =
                    document.createElement(
                        'tr'
                    );

                const density =
                    totalWords
                        ? (
                            count /
                            totalWords *
                            100
                        ).toFixed(2) +
                        '%'
                        : '0%';

                [
                    keyword,
                    formatNumber(
                        count
                    ),
                    density
                ].forEach(
                    (value) => {
                        const cell =
                            document.createElement(
                                'td'
                            );

                        cell.textContent =
                            value;

                        row.appendChild(
                            cell
                        );
                    }
                );

                keywordBody
                    .appendChild(
                        row
                    );
            }
        );
    }

    function updateCounter() {
        updateFrame = null;

        const text =
            textInput.value;

        const words =
            getWords(text);

        const normalizedWords =
            words
                .map(
                    normalizeWord
                )
                .filter(Boolean);

        const uniqueWords =
            new Set(
                normalizedWords
            );

        const sentenceCount =
            countSentences(
                text
            );

        const paragraphCount =
            countParagraphs(
                text
            );

        const characterCount =
            Array.from(
                text
            ).length;

        const charactersNoSpaces =
            Array.from(
                text.replace(
                    /\s/gu,
                    ''
                )
            ).length;

        const letterCount =
            normalizedWords.reduce(
                (
                    total,
                    word
                ) => {
                    const letters =
                        word.match(
                            /\p{L}/gu
                        ) || [];

                    return (
                        total +
                        letters.length
                    );
                },
                0
            );

        const readingSpeed =
            Number(
                readingSpeedInput.value
            ) || 238;

        const speakingSpeed =
            Number(
                speakingSpeedInput.value
            ) || 130;

        outputs.wordCount
            .textContent =
            formatNumber(
                words.length
            );

        outputs.charCount
            .textContent =
            formatNumber(
                characterCount
            );

        outputs.charNoSpace
            .textContent =
            formatNumber(
                charactersNoSpaces
            );

        outputs.sentenceCount
            .textContent =
            formatNumber(
                sentenceCount
            );

        outputs.paragraphCount
            .textContent =
            formatNumber(
                paragraphCount
            );

        outputs.uniqueCount
            .textContent =
            formatNumber(
                uniqueWords.size
            );

        outputs.readingTime
            .textContent =
            formatDuration(
                words.length /
                readingSpeed
            );

        outputs.speakingTime
            .textContent =
            formatDuration(
                words.length /
                speakingSpeed
            );

        outputs.avgSentence
            .textContent =
            sentenceCount
                ? (
                    words.length /
                    sentenceCount
                ).toFixed(1)
                : '0';

        outputs.avgWord
            .textContent =
            words.length
                ? (
                    letterCount /
                    words.length
                ).toFixed(1)
                : '0';

        outputs.diversity
            .textContent =
            words.length
                ? (
                    uniqueWords.size /
                    words.length *
                    100
                ).toFixed(1) +
                '%'
                : '0%';

        outputs.pages
            .textContent =
            words.length
                ? Math.max(
                    0.1,
                    words.length /
                    250
                ).toFixed(1)
                : '0';

        updateTarget(
            words.length
        );

        updateKeywords(
            normalizedWords,
            words.length
        );
    }

    function scheduleUpdate() {
        if (updateFrame !== null) {
            cancelAnimationFrame(
                updateFrame
            );
        }

        updateFrame =
            requestAnimationFrame(
                updateCounter
            );
    }

    function setFileStatus(
        message,
        type
    ) {
        fileStatus.textContent =
            message;

        if (type === 'error') {
            fileStatus.style.color =
                'var(--bad)';

            return;
        }

        if (type === 'success') {
            fileStatus.style.color =
                'var(--ok)';

            return;
        }

        fileStatus.style.color =
            'var(--m)';
    }

    function getExtension(
        fileName
    ) {
        const parts =
            fileName
                .toLocaleLowerCase()
                .split('.');

        if (parts.length < 2) {
            return '';
        }

        return parts.pop();
    }

    function isAllowedFile(
        file
    ) {
        const extension =
            getExtension(
                file.name
            );

        return allowedExtensions
            .has(extension);
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

        temporary.style.pointerEvents =
            'none';

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

    textInput.addEventListener(
        'input',
        scheduleUpdate
    );

    targetInput.addEventListener(
        'input',
        scheduleUpdate
    );

    readingSpeedInput.addEventListener(
        'change',
        scheduleUpdate
    );

    speakingSpeedInput.addEventListener(
        'change',
        scheduleUpdate
    );

    uploadButton.addEventListener(
        'click',
        () => {
            fileInput.click();
        }
    );

    fileInput.addEventListener(
        'change',
        () => {
            const file =
                fileInput.files &&
                fileInput.files[0];

            if (!file) {
                return;
            }

            if (
                file.size >
                maximumFileSize
            ) {
                setFileStatus(
                    'File is larger than 5 MB.',
                    'error'
                );

                fileInput.value =
                    '';

                return;
            }

            if (
                !isAllowedFile(
                    file
                )
            ) {
                setFileStatus(
                    'Use a .txt, .md, or .csv text file.',
                    'error'
                );

                fileInput.value =
                    '';

                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                () => {
                    textInput.value =
                        String(
                            reader.result ||
                            ''
                        );

                    setFileStatus(
                        `${file.name} loaded`,
                        'success'
                    );

                    updateCounter();

                    trackAction(
                        'upload'
                    );
                };

            reader.onerror =
                () => {
                    setFileStatus(
                        'The file could not be read.',
                        'error'
                    );
                };

            reader.readAsText(
                file
            );

            fileInput.value =
                '';
        }
    );

    sampleButton.addEventListener(
        'click',
        () => {
            textInput.value =
                sampleText;

            setFileStatus(
                'Sample text loaded',
                'success'
            );

            updateCounter();

            textInput.focus();

            trackAction(
                'sample'
            );
        }
    );

    copyButton.addEventListener(
        'click',
        async () => {
            if (!textInput.value) {
                return;
            }

            const label =
                copyButton.querySelector(
                    'span'
                );

            const originalText =
                label
                    ? label.textContent
                    : 'Copy';

            try {
                await copyToClipboard(
                    textInput.value
                );

                if (label) {
                    label.textContent =
                        'Copied';
                }

                trackAction(
                    'copy'
                );
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

    downloadButton.addEventListener(
        'click',
        () => {
            if (!textInput.value) {
                return;
            }

            const blob =
                new Blob(
                    [
                        textInput.value
                    ],
                    {
                        type:
                            'text/plain;charset=utf-8'
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    'a'
                );

            link.href =
                url;

            link.download =
                'essay-text.txt';

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            window.setTimeout(
                () => {
                    URL.revokeObjectURL(
                        url
                    );
                },
                0
            );

            trackAction(
                'download'
            );
        }
    );

    clearButton.addEventListener(
        'click',
        () => {
            if (
                textInput.value &&
                !window.confirm(
                    'Clear all text from the Word Counter?'
                )
            ) {
                return;
            }

            textInput.value =
                '';

            setFileStatus(
                'Plain-text files up to 5 MB',
                'default'
            );

            updateCounter();

            textInput.focus();

            trackAction(
                'clear'
            );
        }
    );

    updateCounter();
})();
