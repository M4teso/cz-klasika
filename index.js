const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.auto.uzi',
    version: '1.0.4', // Zvedáme verzi
    name: 'UZI Debugger Fix',
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
    // CORS hlavičky jsou nutné pro Stremio
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // 1. MANIFEST (Instalace)
    if (req.url === '/manifest.json') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(manifest));
        return;
    }

    // 2. STREAM (Hledání)
    if (req.url.indexOf('/stream/') > -1) {
        res.setHeader('Content-Type', 'application/json');
        try {
            const parts = req.url.split('/');
            const id = parts[parts.length - 1].replace('.json', '');
            const movieName = await getMovieName(id);

            if (!movieName) { res.end(JSON.stringify({ streams: [] })); return; }

            // URL pro hledání
            const searchUrl = `https://uzi.si/hladaj/${encodeURIComponent(movieName)}`;
            
            // Stáhneme HTML
            const resp = await needle('get', searchUrl, { 
                follow_max: 5,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://uzi.si/'
                }
            });

            const $ = cheerio.load(resp.body);

            // DIAGNOSTIKA
            const pageTitle = $('title').text().trim(); 
            const bodyText = $('body').text().replace(/\s+/g, ' ').substring(0, 100); 

            let foundLink = null;
            let foundTitle = "";

            $('a').each((i, elem) => {
                const link = $(elem).attr('href');
                const title = $(elem).text().trim();
                
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
                // Vypisujeme chybu do seznamu zdrojů
                res.end(JSON.stringify({ streams: [{
                    title: `❌ CHYBA: ${pageTitle}`, 
                    description: `Obsah stránky: ${bodyText}...`,
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

    // 3. HLAVNÍ STRÁNKA (HTML) - Tady byla chyba v odkazu
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    // Zde generujeme správný "stremio://" odkaz
    const installUrl = `stremio://${req.headers.host}/manifest.json`;

    res.end(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>Debugger v1.0.4</h1>
            <p>Klikněte na tlačítko níže pro instalaci.</p>
            <br>
            <a href="${installUrl}" 
               style="background: #27ae60; color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 20px;">
               NAINSTALOVAT DO STREMIA
            </a>
            <p style="margin-top: 20px; color: #7f8c8d;">(Pokud se nic nestane, nemáte nainstalované Stremio)</p>
        </div>
    `);
};