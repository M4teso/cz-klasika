const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.auto.uzi',
    version: '1.0.3', // Zvedám verzi
    name: 'UZI Debugger',
    description: 'Diagnostika hledání',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

async function getMovieName(imdbId) {
    const url = `https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`;
    try {
        const resp = await needle('get', url);
        if (resp.body && resp.body.meta && resp.body.meta.name) return resp.body.meta.name;
    } catch (e) {}
    return null;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/manifest.json') {
        res.end(JSON.stringify(manifest));
        return;
    }

    if (req.url.indexOf('/stream/') > -1) {
        try {
            const parts = req.url.split('/');
            const id = parts[parts.length - 1].replace('.json', '');
            const movieName = await getMovieName(id);

            if (!movieName) { res.end(JSON.stringify({ streams: [] })); return; }

            // URL pro hledání
            const searchUrl = `https://uzi.si/hladaj/${encodeURIComponent(movieName)}`;
            
            // Stáhneme HTML (tváříme se jako Chrome)
            const resp = await needle('get', searchUrl, { 
                follow_max: 5,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://uzi.si/'
                }
            });

            const $ = cheerio.load(resp.body);

            // DIAGNOSTIKA: Co jsme vlastně stáhli?
            const pageTitle = $('title').text().trim(); // Nadpis stránky
            const bodyText = $('body').text().replace(/\s+/g, ' ').substring(0, 60); // Prvních 60 znaků textu

            // Hledáme odkazy znovu (agresivněji)
            let foundLink = null;
            let foundTitle = "";

            $('a').each((i, elem) => {
                const link = $(elem).attr('href');
                const title = $(elem).text().trim();
                
                // Hledáme, jestli text odkazu obsahuje část názvu filmu (stačí 4 znaky shody)
                if (link && title && title.toLowerCase().includes(movieName.toLowerCase().substring(0, 4))) {
                    if (link.includes('hladaj') || link.includes('login')) return;
                    foundLink = link;
                    foundTitle = title;
                    return false; 
                }
            });

            if (foundLink) {
                if (foundLink.startsWith('/')) foundLink = 'https://uzi.si' + foundLink;
                
                res.end(JSON.stringify({ streams: [{
                    url: foundLink,
                    title: `✅ NAŠEL JSEM: ${foundTitle}`,
                    behaviorHints: { notWebReady: true }
                }]}));
            } else {
                // TOTO JE TO DŮLEŽITÉ - VYPÍŠEME CHYBU DO STREMIA
                res.end(JSON.stringify({ streams: [{
                    title: `❌ CHYBA: ${pageTitle}`, // Zde uvidíme nadpis stránky
                    description: `Obsah: ${bodyText}...`, // Zde uvidíme kousek textu
                    url: "http://google.com"
                }]}));
            }

        } catch (e) {
            res.end(JSON.stringify({ streams: [{
                title: "⚠️ CRASH: " + e.message,
                url: "http://google.com"
            }]}));
        }
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Debugger v1.0.3</h1><a href="/manifest.json">Instalovat</a>');
};