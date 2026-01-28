const needle = require('needle');

const manifest = {
    id: 'org.cz.site.scanner.v2',
    version: '2.0.0',
    name: 'Site Scanner (Visible)',
    description: 'Test dostupnosti webů',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

// Váš funkční odkaz (Stranger Things) - ten zajistí viditelnost
const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

// Seznam webů k testování
const SITES = [
    { name: '🟢 KONTROLA: Archive.org', url: 'https://archive.org/' }, // Musí být zelené
    { name: 'Uzi.si', url: 'https://uzi.si/' },
    { name: 'SledujSerialy.io', url: 'https://sledujserialy.io/' },
    { name: 'Bombuj.si', url: 'https://bombuj.si/' },
    { name: 'Kukaj.io', url: 'https://kukaj.io/' },
    { name: 'Prehraj.to', url: 'https://prehraj.to/' },
    { name: 'FilmPlanet.to', url: 'https://filmplanet.to/' },
    { name: 'NajFilmy.com', url: 'https://najfilmy.com/' },
    { name: 'SledujFilmy.to', url: 'https://sledujfilmy.to/' }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/manifest.json') {
        res.end(JSON.stringify(manifest));
        return;
    }

    if (req.url.indexOf('/stream/') > -1) {
        
        // Spustíme testy paralelně
        const promises = SITES.map(async (site) => {
            // Unikátní odkaz pro každý řádek (aby to Stremio nesloučilo)
            // Přidáváme &site=JMÉNO na konec URL
            const rowUrl = `${SAFE_URL}&debug_site=${encodeURIComponent(site.name)}`;

            try {
                const resp = await needle('get', site.url, {
                    open_timeout: 4000, // 4 sekundy timeout
                    follow_max: 2,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                if (resp.statusCode >= 200 && resp.statusCode < 400) {
                    // ZELENÁ: Web je otevřený!
                    return {
                        title: `✅ OTEVŘENO: ${site.name}`,
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    };
                } else {
                    // ČERVENÁ: Web nás blokuje (403/503)
                    return {
                        title: `⛔ BLOK (${resp.statusCode}): ${site.name}`,
                        url: rowUrl,
                        behaviorHints: { notWebReady: true }
                    };
                }
            } catch (e) {
                // ŠEDÁ: Chyba spojení
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

        res.end(JSON.stringify({ streams: results }));
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Scanner v2.0</h1><a href="stremio://${req.headers.host}/manifest.json">SPUSTIT</a>`);
};