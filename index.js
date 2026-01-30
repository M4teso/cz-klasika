const { addonBuilder } = require('stremio-addon-sdk');
const getRouter = require('stremio-addon-sdk/src/getRouter');
const http = require('http');

// Import Puppeteer a Stealth pluginu
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const manifest = {
    id: 'org.cz.render.puppeteer',
    version: '2.0.0',
    name: 'CZ Browser Scanner',
    description: 'Pokus o průlom pomocí Puppeteer',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt'],
    catalogs: []
};

const builder = new addonBuilder(manifest);

const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

// Testujeme jen ty nejdůležitější, šetříme RAM
const SITES = [
    { name: '🔫 UZI.si (Hledání)', url: 'https://uzi.si/hladaj/matrix' },
    { name: '▶️ Prehraj.to', url: 'https://prehraj.to/hledej/matrix' },
    { name: '💣 Bombuj.si', url: 'https://bombuj.si' },
    { name: '🟢 Google (Test)', url: 'https://www.google.com' }
];

builder.defineStreamHandler(async ({ type, id }) => {
    console.log("🚀 Startuji virtuální prohlížeč...");
    let streams = [];
    let browser = null;

    try {
        // Spuštění prohlížeče s nastavením pro Docker/Render (šetří paměť)
        browser = await puppeteer.launch({
            headless: 'new', // Nový headless režim
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Důležité pro Render
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', 
                '--disable-gpu'
            ]
        });

        // Otevřeme novou stránku
        const page = await browser.newPage();
        
        // Nastavíme timeout na 30 sekund
        page.setDefaultNavigationTimeout(30000);

        // Projdeme weby jeden po druhém (sériově, ne paralelně, aby nespadla RAM)
        for (const site of SITES) {
            const uniqueId = Math.floor(Math.random() * 1000);
            const rowUrl = `${SAFE_URL}&site=${encodeURIComponent(site.name)}&uid=${uniqueId}`;

            try {
                console.log(`Navštěvuji: ${site.url}`);
                
                // Jdeme na web
                await page.goto(site.url, { waitUntil: 'domcontentloaded' });
                
                // ČEKÁME NA CLOUDFLARE (6 sekund)
                // Během této doby by měl JS na stránce vyřešit hádanku a reloadnout se
                await new Promise(r => setTimeout(r, 6000));

                // Získáme titulek stránky po čekání
                const pageTitle = await page.title();
                const content = await page.content(); // HTML obsah

                console.log(`Výsledek ${site.name}: ${pageTitle}`);

                // Analýza
                if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required')) {
                    streams.push({
                        title: `⛔ STÁLE BLOK: ${site.name}`,
                        description: "Cloudflare nás prokoukl i s prohlížečem.",
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    });
                } else if (pageTitle.includes('503') || pageTitle.includes('403') || pageTitle.includes('Access denied')) {
                     streams.push({
                        title: `⛔ CHYBA ${pageTitle}: ${site.name}`,
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    });
                } else {
                    // MÁME TO?!
                    streams.push({
                        title: `✅ OTEVŘENO: ${site.name}`,
                        description: `Titulek: ${pageTitle}`,
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    });
                }

            } catch (err) {
                console.log(`Chyba u ${site.name}: ${err.message}`);
                streams.push({
                    title: `💀 CRASH: ${site.name}`,
                    description: err.message,
                    url: rowUrl,
                    behaviorHints: { notWebReady: true }
                });
            }
        }

    } catch (e) {
        console.error("Critical Browser Error:", e);
        return { streams: [{ title: "💀 SELHAL START PROHLÍŽEČE", description: e.message, url: SAFE_URL }] };
    } finally {
        // Vždy zavřít prohlížeč, jinak dojde paměť
        if (browser) await browser.close();
    }

    return { streams: streams };
});

const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Puppeteer Scanner</h1><a href="/manifest.json">Instalovat</a>');
        return;
    }
    router(req, res, () => { res.statusCode = 404; res.end(); });
});

const port = process.env.PORT || 7000;
server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Puppeteer Server běží na portu ${port}`);
});