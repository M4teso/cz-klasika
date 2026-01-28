const needle = require('needle');

const manifest = {
    id: 'org.cz.site.scanner',
    version: '1.0.0',
    name: 'CZ/SK Site Scanner',
    description: 'Zjistí, které weby neblokují Vercel',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

// SEZNAM WEBŮ K TESTOVÁNÍ
const SITES = [
    { name: 'SledujSerialy.io', url: 'https://sledujserialy.io/' },
    { name: 'Bombuj.si', url: 'https://bombuj.si/' },
    { name: 'Kukaj.io', url: 'https://kukaj.io/' },
    { name: 'Prehraj.to', url: 'https://prehraj.to/' },
    { name: 'FilmPlanet.to', url: 'https://filmplanet.to/' },
    { name: 'FreeFilm.to', url: 'https://freefilm.to/' },
    { name: 'NajFilmy.com', url: 'https://najfilmy.com/' }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/manifest.json') {
        res.end(JSON.stringify(manifest));
        return;
    }

    if (req.url.indexOf('/stream/') > -1) {
        let streams = [];
        
        // Přidáme info řádek
        streams.push({
            title: "ℹ️ PROBÍHÁ TEST WEBŮ...",
            url: "http://google.com"
        });

        // Projdeme všechny weby a zkusíme se připojit
        const promises = SITES.map(async (site) => {
            try {
                const resp = await needle('get', site.url, {
                    open_timeout: 3000, // Max 3 sekundy na odpověď
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                if (resp.statusCode >= 200 && resp.statusCode < 300) {
                    // ÚSPĚCH! Tady nemají Cloudflare (nebo nás pustili)
                    return {
                        title: `✅ OTEVŘENO: ${site.name}`,
                        description: "Tento web neblokuje Vercel! Můžeme ho zkusit vykrást.",
                        url: site.url, // Odkaz na web
                        behaviorHints: { notWebReady: true }
                    };
                } else if (resp.statusCode === 403 || resp.statusCode === 503) {
                    // BLOKACE (Cloudflare)
                    return {
                        title: `⛔ BLOKOVÁNO: ${site.name}`,
                        description: `Kód ${resp.statusCode} (Cloudflare ochrana)`,
                        url: "http://google.com"
                    };
                } else {
                    // JINÁ CHYBA
                    return {
                        title: `⚠️ CHYBA ${resp.statusCode}: ${site.name}`,
                        url: "http://google.com"
                    };
                }
            } catch (e) {
                // TIMEOUT
                return {
                    title: `💀 NEDOSTUPNÉ: ${site.name}`,
                    description: e.message,
                    url: "http://google.com"
                };
            }
        });

        // Počkáme na všechny testy
        const results = await Promise.all(promises);
        
        // Seřadíme: Zelené (funkční) nahoru
        results.sort((a, b) => {
            if (a.title.includes('✅')) return -1;
            if (b.title.includes('✅')) return 1;
            return 0;
        });

        res.end(JSON.stringify({ streams: results }));
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Scanner v1.0</h1><a href="stremio://${req.headers.host}/manifest.json">SPUSTIT TEST</a>`);
};