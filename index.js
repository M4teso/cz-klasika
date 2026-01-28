const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.auto.uzi',
    version: '1.0.2',
    name: 'UZI Auto-Search',
    description: 'Automatické hledání na uzi.si',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

// Pomocná funkce: Zjistit název filmu podle IMDb ID
async function getMovieName(imdbId) {
    const url = `https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`;
    try {
        const resp = await needle('get', url);
        if (resp.body && resp.body.meta && resp.body.meta.name) {
            return resp.body.meta.name;
        }
    } catch (e) { console.error("Chyba Cinemeta:", e); }
    return null;
}

module.exports = async (req, res) => {
    // 1. Nastavíme CORS (aby Stremio mohlo číst data)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // 2. Obsluha Manifestu (Instalace)
    if (req.url === '/manifest.json') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(manifest));
        return;
    }

    // 3. Obsluha Streamu (Hledání videa)
    if (req.url.indexOf('/stream/') > -1) {
        res.setHeader('Content-Type', 'application/json');
        
        try {
            const parts = req.url.split('/');
            const id = parts[parts.length - 1].replace('.json', ''); 

            // A) Získáme název filmu
            const movieName = await getMovieName(id);
            if (!movieName) { 
                res.end(JSON.stringify({ streams: [] })); 
                return; 
            }

            console.log(`Hledám film: ${movieName}`);

            // B) Jdeme hledat na UZI.si
            // Použijeme URL, kterou jste mi poslal: https://uzi.si/hladaj/matrix
            const searchUrl = `https://uzi.si/hladaj/${encodeURIComponent(movieName)}`;
            
            // Stáhneme HTML stránky
            const resp = await needle('get', searchUrl, { 
                follow_max: 5,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } // Tváříme se jako PC
            });
            
            const $ = cheerio.load(resp.body);

            // C) HLEDÁNÍ ODKAZU V HTML
            let foundLink = null;
            let foundTitle = "";

            // Prohledáme všechny odkazy na stránce
            $('a').each((i, elem) => {
                const link = $(elem).attr('href');
                const title = $(elem).text().trim();

                // Pokud titulek odkazu obsahuje název filmu a není to balast
                if (link && title && title.toLowerCase().includes(movieName.toLowerCase())) {
                    // Ignorujeme odkazy, které nevedou na film (např. stránkování, login)
                    if (link.includes('hladaj') || link.includes('login') || link.includes('register')) return;
                    
                    foundLink = link;
                    foundTitle = title;
                    return false; // Stop hledání (našli jsme první shodu)
                }
            });

            // D) Výsledek
            if (foundLink) {
                // Oprava relativního odkazu (pokud začíná lomítkem)
                if (foundLink.startsWith('/')) {
                    foundLink = 'https://uzi.si' + foundLink;
                }

                // Zatím vracíme odkaz na stránku jako "důkaz", že jsme to našli
                const streams = [{
                    url: foundLink, 
                    title: `✅ Nalezeno na UZI: ${foundTitle}`,
                    behaviorHints: { notWebReady: true }
                }];
                
                res.end(JSON.stringify({ streams: streams }));
            } else {
                // Nenalezeno - vrátíme prázdno (nebo informaci o chybě)
                console.log("Nenalezen žádný odkaz odpovídající názvu.");
                res.end(JSON.stringify({ streams: [{
                    title: "❌ Nenalezeno na UZI",
                    url: "http://google.com"
                }] }));
            }

        } catch (e) {
            console.error("Chyba při hledání:", e);
            res.end(JSON.stringify({ streams: [] }));
        }
        return;
    }

    // 4. Hlavní stránka (Instalace) - Tady byla ta chyba, teď posíláme HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
            <h1>UZI Auto-Search v1.0.2</h1>
            <p>Addon běží správně.</p>
            <a href="stremio://${req.headers.host}/manifest.json" 
               style="background:green; color:white; padding:15px; text-decoration:none; border-radius:5px;">
               NAINSTALOVAT DO STREMIA
            </a>
        </div>
    `);
};