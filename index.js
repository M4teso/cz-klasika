const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.najfilmy.bot',
    version: '1.0.0',
    name: 'Najfilmy Auto',
    description: 'Automatické hledání na Najfilmy.com',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

// Hlavičky, abychom vypadali jako prohlížeč Chrome
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://najfilmy.com/'
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
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/manifest.json') {
        res.end(JSON.stringify(manifest));
        return;
    }

    if (req.url.indexOf('/stream/') > -1) {
        let streams = [];
        
        try {
            const parts = req.url.split('/');
            const id = parts[parts.length - 1].replace('.json', '');
            const movieName = await getMovieName(id);

            if (!movieName) {
                res.end(JSON.stringify({ streams: [] }));
                return;
            }

            // 1. FÁZE: HLEDÁNÍ FILMU
            // Najfilmy používá standardní hledání: ?s=nazev
            const searchUrl = `https://najfilmy.com/?s=${encodeURIComponent(movieName)}`;
            
            const searchResp = await needle('get', searchUrl, { headers: HEADERS, follow_max: 2 });
            const $ = cheerio.load(searchResp.body);

            let moviePageUrl = null;
            let foundTitle = "";

            // Procházíme výsledky. Najfilmy mají výsledky obvykle v elementech <article> nebo podobně.
            // Zkusíme najít první odkaz, který v titulku obsahuje název filmu.
            $('a').each((i, elem) => {
                const link = $(elem).attr('href');
                const title = $(elem).text().trim(); // Nebo $(elem).attr('title')

                // Hledáme shodu jména (alespoň část) a ignorujeme odkazy na kategorie/stránkování
                if (link && title && title.toLowerCase().includes(movieName.toLowerCase())) {
                    if (link.length < 15) return; // Příliš krátký odkaz je podezřelý
                    
                    moviePageUrl = link;
                    foundTitle = title;
                    return false; // Stop, máme první výsledek (většinou ten nejlepší)
                }
            });

            if (moviePageUrl) {
                // 2. FÁZE: VYTĚŽENÍ VIDEA
                // Jdeme na stránku filmu
                const movieResp = await needle('get', moviePageUrl, { headers: HEADERS, follow_max: 2 });
                const $$ = cheerio.load(movieResp.body);

                // Hledáme IFRAME (vložené video)
                // Najfilmy často používají přehrávače jako Mixdrop, Streamtape, Supervideo...
                let videoUrl = null;
                let videoSource = "Web";

                $$('iframe').each((i, elem) => {
                    const src = $$(elem).attr('src');
                    if (src && src.startsWith('http')) {
                        // Ignorujeme reklamy a Facebook widgety
                        if (src.includes('facebook') || src.includes('google')) return;
                        
                        videoUrl = src;
                        if (src.includes('mixdrop')) videoSource = "Mixdrop";
                        if (src.includes('streamtape')) videoSource = "Streamtape";
                        if (src.includes('youtube')) videoSource = "Trailer";
                        return false; // Bereme první iframe
                    }
                });

                if (videoUrl) {
                    // MÁME PŘÍMÝ ODKAZ NA PŘEHRÁVAČ!
                    streams.push({
                        title: `✅ ${videoSource}: ${foundTitle}`,
                        url: videoUrl, // Stremio se pokusí otevřít tento iframe
                        behaviorHints: { notWebReady: true } // Vynutíme desktop player
                    });
                } 

                // Vždy přidáme i odkaz na samotnou stránku (jako zálohu)
                streams.push({
                    title: `🌐 Otevřít web: ${foundTitle}`,
                    description: "Pokud video nehraje, klikni zde a otevře se prohlížeč.",
                    url: moviePageUrl
                });

            } else {
                streams.push({
                    title: `❌ Nenalezeno na Najfilmy: ${movieName}`,
                    url: "http://google.com"
                });
            }

        } catch (e) {
            streams.push({
                title: `💀 Chyba robota: ${e.message}`,
                url: "http://google.com"
            });
        }

        res.end(JSON.stringify({ streams: streams }));
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Najfilmy Bot v1.0</h1><a href="stremio://${req.headers.host}/manifest.json">NAINSTALOVAT</a>`);
};