window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}

gtag('js', new Date());

gtag('config', 'G-QFNEKR7QE0', {
    anonymize_ip: true
});

function loadGoogleAnalytics() {
    if (window.gaScriptLoaded) return;
    window.gaScriptLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-QFNEKR7QE0';
    document.head.appendChild(script);
}

window.addEventListener('scroll', loadGoogleAnalytics, { once: true, passive: true });
window.addEventListener('mousemove', loadGoogleAnalytics, { once: true });
window.addEventListener('touchstart', loadGoogleAnalytics, { once: true, passive: true });
setTimeout(loadGoogleAnalytics, 3500);
