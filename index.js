const needle = require('needle');
const cheerio = require('cheerio'); // Knihovna na čtení HTML

const manifest = {
    id: 'org.cz.auto.uzi',
    version: '1.0.1',
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
    } catch (e) { console.error(e); }
    return null;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/manifest.json') {
        res.end(JSON.stringify(manifest));
        return;
    }

    if (req.url.indexOf('/stream/') > -1) {
        const parts = req.url.split('/');
        const id = parts[parts.length - 1].replace('.json', ''); 

        // 1. Získáme název (např. "Matrix")
        const movieName = await getMovieName(id);
        if (!movieName) { res.end(JSON.stringify({ streams: [] })); return; }

        console.log(`Hledám: ${movieName}`);

        try {
            // 2. Jdeme hledat na UZI.si
            const searchUrl = `https://uzi.si/hladaj/${encodeURIComponent(movieName)}`;
            
            // Stáhneme HTML stránky s výsledky
            const resp = await needle('get', searchUrl, { follow_max: 5 });
            const $ = cheerio.load(resp.body);

            // 3. HLEDÁNÍ ODKAZU V HTML (TOTO JE KRITICKÁ ČÁST)
            // Musíme najít první odkaz <a>, který vypadá jako výsledek filmu.
            // Zkouším obecný odhad: Hledáme odkaz, který obsahuje v URL slovo 'film' nebo 'video'
            // NEBO: Hledáme první odkaz v nějakém seznamu.
            
            // TIP PRO VÁS: Zde musíme trefit "CSS Selektor".
            // Zkouším najít jakýkoliv odkaz, který má v atributu 'href' něco smysluplného.
            
            let foundLink = null;
            let foundTitle = "";

            // Procházíme všechny odkazy na stránce
            $('a').each((i, elem) => {
                const link = $(elem).attr('href');
                const title = $(elem).text().trim();

                // Jednoduchá logika: Pokud text odkazu obsahuje název filmu (Matrix)
                // a odkaz není prázdný, asi jsme to našli.
                if (link && title.toLowerCase().includes(movieName.toLowerCase())) {
                    // Ignorujeme odkazy na 'hladaj' nebo 'login'
                    if (link.includes('hladaj') || link.includes('login')) return;
                    
                    foundLink = link;
                    foundTitle = title;
                    return false; // Stop hledání po prvním nálezu
                }
            });

            if (foundLink) {
                // Pokud je odkaz relativní (např. /film/matrix), přidáme doménu
                if (!foundLink.startsWith('http')) {
                    foundLink = 'https://uzi.si' + foundLink;
                }

                // 4. Vrátíme výsledek
                // POZOR: Zatím vracíme odkaz na STRÁNKU, ne na VIDEO.
                // Stremio to nepřehraje (ukáže chybu), ale uvidíte titulek "Nalezeno!"
                const streams = [{
                    url: foundLink, 
                    title: `✅ Nalezeno: ${foundTitle}`,
                    description: "Kliknutím otevřete (zatím jen web)",
                    behaviorHints: { notWebReady: true }
                }];
                
                res.end(JSON.stringify({ streams: streams }));
                return;
            } else {
                // Nic jsme nenašli
                 res.end(JSON.stringify({ streams: [{
                    title: "❌ Nenalezeno na UZI",
                    url: "http://google.com" // Falešný link
                }] }));
                return;
            }

        } catch (e) {
            console.error("Chyba scrapingu:", e);
            res.end(JSON.stringify({ streams: [] }));
            return;
        }
    }

    res.end('Addon bezi');
};