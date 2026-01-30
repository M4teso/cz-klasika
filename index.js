const { addonBuilder } = require('stremio-addon-sdk');
const getRouter = require('stremio-addon-sdk/src/getRouter');
const http = require('http');
const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.render.scanner.v2',
    version: '1.0.1',
    name: 'Render EU Scanner',
    description: 'Testuje dostupnost CZ webů z Frankfurtu',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

const builder = new addonBuilder(manifest);

const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

const SITES = [
    { name: '🏒 Hokej.cz (Ofiko)', url: 'https://www.hokej.cz/tv/hokejka' },
    { name: '▶️ Prehraj.to', url: 'https://prehraj.to/' },
    { name: '💣 Bombuj.si', url: 'https://bombuj.si/' },
    { name: '📺 SledujSerialy', url: 'https://sledujserialy.io/' },
    { name: '🟢 Archive.org (Kontrola)', url: 'https://archive.org/' }
];

builder.defineStreamHandler(async ({ type, id }) => {
    console.log("Spouštím skenování webů...");
    
    const promises = SITES.map(async (site) => {
        const rowUrl = `${SAFE_URL}&debug_site=${encodeURIComponent(site.name)}`;

        try {
            const resp = await needle('get', site.url, {
                open_timeout: 5000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
            });

            let pageTitle = "Neznámý titul";
            if (resp.body) {
                try {
                    const $ = cheerio.load(resp.body);
                    pageTitle = $('title').text().trim().substring(0, 50);
                } catch (e) {}
            }

            if (resp.statusCode >= 200 && resp.statusCode < 400) {
                if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required')) {
                    return {
                        title: `⛔ BLOK (Cloudflare): ${site.name}`,
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    };
                }
                return {
                    title: `✅ OTEVŘENO: ${site.name}`,
                    description: `Titulek: "${pageTitle}"`,
                    url: rowUrl,
                    behaviorHints: { notWebReady: true }
                };
            } else {
                return {
                    title: `⛔ BLOK (Kód ${resp.statusCode}): ${site.name}`,
                    url: rowUrl,
                    behaviorHints: { notWebReady: true }
                };
            }
        } catch (e) {
            return {
                title: `💀 ERROR: ${site.name}`,
                description: e.message,
                url: rowUrl,
                behaviorHints: { notWebReady: true }
            };
        }
    });

    const results = await Promise.all(promises);
    results.sort((a, b) => (a.title.includes('✅') ? -1 : 1));
    return { streams: results };
});

// ==========================================
// START SERVERU (Upraveno pro Render)
// ==========================================
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

// Vytvoříme klasický HTTP server
const server = http.createServer((req, res) => {
    // Hlavní stránka (aby to nepsalo Not Found na rootu)
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Scanner bezi</h1><p>Jdi na <a href="/manifest.json">/manifest.json</a></p>');
        return;
    }
    // Router pro Stremio
    router(req, res, () => {
        res.statusCode = 404;
        res.end();
    });
});

// DŮLEŽITÉ: Poslouchat na 0.0.0.0
const port = process.env.PORT || 7000;
server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server běží na portu ${port}`);
});