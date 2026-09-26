// One hero question per page load, chosen before first paint (see index.html).
document.documentElement.setAttribute('data-hero-q', String(Math.floor(Math.random() * 6)));
