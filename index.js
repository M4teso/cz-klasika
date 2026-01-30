const { addonBuilder } = require('stremio-addon-sdk');
const getRouter = require('stremio-addon-sdk/src/getRouter');
const http = require('http');
const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.render.mass.scanner',
    version: '1.0.4',
    name: 'CZ Mass Scanner',
    description: 'Velký test dostupnosti CZ webů',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt'],
    catalogs: [] 
};

const builder = new addonBuilder(manifest);

// Záchranný funkční odkaz (Stranger Things)
const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

// SEZNAM CÍLŮ (Mix všeho možného)
const SITES = [
    { name: '🏒 Hokej.cz', url: 'https://www.hokej.cz/tv/hokejka' },
    { name: '▶️ Prehraj.to', url: 'https://prehraj.to/' },
    { name: '📼 Sosáč TV', url: 'https://sosac.tv/cs/' },
    { name: '💣 Bombuj.si', url: 'https://bombuj.si/' },
    { name: '📺 SledujSerialy', url: 'https://sledujserialy.io/' },
    { name: '👀 Kukaj.io', url: 'https://kukaj.io/' },
    { name: '🏎️ FastShare', url: 'https://fastshare.cz/' },
    { name: '🎥 Kinogo', url: 'https://kinogo.cz/' },
    { name: '🎞️ SledujFilmy', url: 'https://sledujfilmy.to/' },
    { name: '🟢 Archive.org', url: 'https://archive.org/' } // Kontrola
];

builder.defineStreamHandler(async ({ type, id }) => {
    console.log("Spouštím hromadný sken...");
    
    // Použijeme Promise.all, abychom testovali vše najednou
    const promises = SITES.map(async (site) => {
        // UNIKÁTNÍ URL: Přidáme náhodné číslo, aby Stremio řádek NESKRYLO
        const uniqueId = Math.floor(Math.random() * 1000000);
        const rowUrl = `${SAFE_URL}&site=${encodeURIComponent(site.name)}&uid=${uniqueId}`;

        try {
            // Timeout 4 sekundy na jeden web, ať nezdržujeme
            const resp = await needle('get', site.url, {
                open_timeout: 4000,
                read_timeout: 4000,
                follow_max: 2,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' 
                }
            });

            // Analýza titulku
            let pageTitle = "---";
            if (resp.body) {
                try {
                    const $ = cheerio.load(resp.body);
                    pageTitle = $('title').text().trim().substring(0, 40);
                } catch (e) {}
            }

            // Rozhodovací logika
            if (resp.statusCode >= 200 && resp.statusCode < 400) {
                // Je to Cloudflare brána?
                if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required') || pageTitle.includes('Security Check')) {
                    return {
                        title: `⛔ BLOK (Cloudflare): ${site.name}`,
                        description: "Web běží, ale nepustí nás dovnitř.",
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    };
                }

                // Je to zaparkovaná doména? (GoDaddy atd.)
                if (pageTitle.includes('Domain') && pageTitle.includes('Sale')) {
                    return {
                        title: `⚠️ FAKE: ${site.name}`,
                        description: "Doména je na prodej (web neexistuje).",
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    };
                }

                // ÚSPĚCH!
                return {
                    title: `✅ OTEVŘENO: ${site.name}`,
                    description: `Titulek: "${pageTitle}..."`,
                    url: rowUrl,
                    behaviorHints: { notWebReady: true }
                };

            } else {
                // HTTP chyba (403, 404, 500)
                return {
                    title: `⛔ BLOK (Kód ${resp.statusCode}): ${site.name}`,
                    url: rowUrl,
                    behaviorHints: { notWebReady: true }
                };
            }

        } catch (e) {
            // Chyba spojení (Timeout)
            return {
                title: `💀 ERROR: ${site.name}`,
                description: e.message, // Zobrazí důvod (např. socket hang up)
                url: rowUrl,
                behaviorHints: { notWebReady: true }
            };
        }
    });

    // Počkáme na všechny výsledky
    const results = await Promise.all(promises);
    
    // Seřadíme: Zelené (Otevřeno) úplně nahoru
    results.sort((a, b) => {
        const scoreA = a.title.includes('✅') ? 2 : (a.title.includes('⛔') ? 0 : 1);
        const scoreB = b.title.includes('✅') ? 2 : (b.title.includes('⛔') ? 0 : 1);
        return scoreB - scoreA;
    });

    return { streams: results };
});

// START SERVERU PRO RENDER
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Mass Scanner v1.0.4</h1><a href="/manifest.json">Instalovat</a>');
        return;
    }
    router(req, res, () => { res.statusCode = 404; res.end(); });
});

const port = process.env.PORT || 7000;
server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Mass Scanner běží na portu ${port}`);
});