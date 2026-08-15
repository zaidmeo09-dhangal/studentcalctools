document.documentElement.classList.add('js');

try {
    const savedTheme = localStorage.getItem('theme');
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    document.documentElement.setAttribute(
        'data-theme',
        savedTheme || preferredTheme
    );
} catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
}
