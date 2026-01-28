const needle = require('needle');
const cheerio = require('cheerio');

// Váš funkční "záchranný" odkaz. Díky němu se řádek vždy zobrazí.
const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

const manifest = {
    id: 'org.cz.auto.uzi',
    version: '1.0.5',
    name: 'UZI Diagnostika',
    description: 'Musí zobrazit výsledek',
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
    return "Unknown Movie";
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
        // Zde budeme sbírat všechny zprávy, které chceme zobrazit
        let streams = [];
        
        try {
            const parts = req.url.split('/');
            const id = parts[parts.length - 1].replace('.json', '');
            const movieName = await getMovieName(id);

            // 1. Zpráva: Vím, co hledám
            // (Tento řádek se zobrazí vždy, abychom věděli, že addon žije)
            streams.push({
                title: `ℹ️ Info: Hledám "${movieName}"`,
                url: SAFE_URL,
                behaviorHints: { notWebReady: true }
            });

            // 2. Pokus o spojení s UZI
            const searchUrl = `https://uzi.si/hladaj/${encodeURIComponent(movieName)}`;
            
            const resp = await needle('get', searchUrl, { 
                follow_max: 5,
                open_timeout: 5000, // Max 5 sekund čekání
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://uzi.si/'
                }
            });

            // 3. Analýza odpovědi
            if (resp.statusCode !== 200) {
                streams.push({
                    title: `⚠️ Chyba webu: Kód ${resp.statusCode}`,
                    description: "Web uzi.si vrátil chybu (asi ochrana).",
                    url: SAFE_URL
                });
            } else {
                const $ = cheerio.load(resp.body);
                const pageTitle = $('title').text().trim();
                
                // Zkusíme najít odkaz
                let found = false;
                $('a').each((i, elem) => {
                    const link = $(elem).attr('href');
                    const txt = $(elem).text().trim();
                    if (link && txt.toLowerCase().includes(movieName.toLowerCase().substring(0, 5))) {
                        streams.push({
                            title: `✅ NALEZENO: ${txt}`,
                            url: link.startsWith('http') ? link : 'https://uzi.si' + link, // Tady to zatím nepůjde přehrát, ale uvidíme odkaz
                            behaviorHints: { notWebReady: true }
                        });
                        found = true;
                        return false; 
                    }
                });

                if (!found) {
                    streams.push({
                        title: `❌ Nenalezeno (Titulek webu: ${pageTitle})`,
                        description: "Robot web přečetl, ale nenašel odkaz.",
                        url: SAFE_URL
                    });
                }
            }

        } catch (e) {
            // Odchycení chyby spojení (timeout atd.)
            streams.push({
                title: `💀 Kritická chyba: ${e.message}`,
                url: SAFE_URL
            });
        }

        // Odeslání výsledků
        res.end(JSON.stringify({ streams: streams }));
        return;
    }

    // Instalace
    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Diagnostika v1.0.5</h1><a href="stremio://${req.headers.host}/manifest.json">Instalovat</a>`);
};