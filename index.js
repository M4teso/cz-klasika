const { addonBuilder } = require('stremio-addon-sdk');
const getRouter = require('stremio-addon-sdk/src/getRouter');
const http = require('http');
const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.render.uzi.test',
    version: '1.0.5',
    name: 'UZI & Friends Scanner',
    description: 'Poslední pokus o průlom',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt'],
    catalogs: [] 
};

const builder = new addonBuilder(manifest);

// Záchranný odkaz
const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

const SITES = [
    { name: '🔫 UZI.si', url: 'https://uzi.si/' }, // Hlavní cíl
    { name: '🔫 UZI (Hledání)', url: 'https://uzi.si/hladaj/matrix' }, // Test hlubšího odkazu
    { name: '💣 Bombuj.si', url: 'https://bombuj.si/' },
    { name: '🎥 SledujTo (možná jiná ochrana)', url: 'https://sledujteto.cz/' },
    { name: '📺 Kukaj.io', url: 'https://kukaj.io/' },
    { name: '💾 Datoid (Filehosting)', url: 'https://datoid.cz/' },
    { name: '🟢 Archive.org (Kontrola)', url: 'https://archive.org/' }
];

builder.defineStreamHandler(async ({ type, id }) => {
    console.log("Spouštím UZI scan...");
    
    const promises = SITES.map(async (site) => {
        const uniqueId = Math.floor(Math.random() * 1000000);
        const rowUrl = `${SAFE_URL}&site=${encodeURIComponent(site.name)}&uid=${uniqueId}`;

        try {
            const resp = await needle('get', site.url, {
                open_timeout: 5000,
                follow_max: 2,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Referer': 'https://google.com'
                }
            });

            let pageTitle = "---";
            if (resp.body) {
                try {
                    const $ = cheerio.load(resp.body);
                    pageTitle = $('title').text().trim().substring(0, 40);
                } catch (e) {}
            }

            if (resp.statusCode >= 200 && resp.statusCode < 400) {
                // Cloudflare detekce
                if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required') || pageTitle.includes('Security Check')) {
                    return {
                        title: `⛔ CF BLOK: ${site.name}`,
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    };
                }
                
                // UZI.si specifická detekce (Login wall)
                if (pageTitle.includes('Login') || pageTitle.includes('Prihlásenie')) {
                     return {
                        title: `🔒 LOGIN WALL: ${site.name}`,
                        description: "Web dostupný, ale vyžaduje přihlášení.",
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    };
                }

                // ÚSPĚCH
                return {
                    title: `✅ OTEVŘENO: ${site.name}`,
                    description: `Titulek: "${pageTitle}"`,
                    url: rowUrl,
                    behaviorHints: { notWebReady: true }
                };
            } else {
                return {
                    title: `⛔ BLOK ${resp.statusCode}: ${site.name}`,
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

const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>UZI Scanner</h1><a href="/manifest.json">Instalovat</a>');
        return;
    }
    router(req, res, () => { res.statusCode = 404; res.end(); });
});

const port = process.env.PORT || 7000;
server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 UZI Scanner běží na portu ${port}`);
});