const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.render.scanner',
    version: '1.0.0',
    name: 'Render EU Scanner',
    description: 'Testuje dostupnost CZ webů z Frankfurtu',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

const builder = new addonBuilder(manifest);

// Záchranný link (Stranger Things), aby byl řádek vždy vidět
const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

// CÍLE K TESTOVÁNÍ
const SITES = [
    { name: '🏒 Hokej.cz (Ofiko)', url: 'https://www.hokej.cz/tv/hokejka' },
    { name: '▶️ Prehraj.to', url: 'https://prehraj.to/' },
    { name: '💣 Bombuj.si', url: 'https://bombuj.si/' },
    { name: '📺 SledujSerialy', url: 'https://sledujserialy.io/' },
    { name: '🟢 Archive.org (Kontrola)', url: 'https://archive.org/' }
];

builder.defineStreamHandler(async ({ type, id }) => {
    console.log("Spouštím skenování webů...");
    let streams = [];

    // Paralelní test všech webů
    const promises = SITES.map(async (site) => {
        // Unikátní URL pro každý řádek
        const rowUrl = `${SAFE_URL}&debug_site=${encodeURIComponent(site.name)}`;

        try {
            const resp = await needle('get', site.url, {
                open_timeout: 5000, // 5s timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // Zjistíme titulek stránky
            let pageTitle = "Neznámý titul";
            if (resp.body) {
                const $ = cheerio.load(resp.body);
                pageTitle = $('title').text().trim().substring(0, 50);
            }

            // ANALÝZA VÝSLEDKU
            if (resp.statusCode >= 200 && resp.statusCode < 400) {
                // Kód 200 - Server odpověděl. Ale je to Cloudflare?
                if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required')) {
                    return {
                        title: `⛔ BLOK (Cloudflare): ${site.name}`,
                        description: "Render se přes ochranu nedostal.",
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
                    description: "Server odmítl spojení.",
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
    
    // Seřadíme: Zelené nahoru
    results.sort((a, b) => {
        if (a.title.includes('✅')) return -1;
        if (b.title.includes('✅')) return 1;
        return 0;
    });

    return { streams: results };
});

// Start serveru pro Render (používá process.env.PORT)
const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port: port });
console.log(`🚀 Scanner běží na portu ${port}`);