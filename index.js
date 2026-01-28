const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.prehraj.probe',
    version: '1.0.0',
    name: 'Prehraj.to Probe',
    description: 'Test dostupnosti a hledání na Prehraj.to',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

// Záchranný odkaz (Stranger Things), aby byl výsledek vždy vidět
const SAFE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

// Pomocná funkce pro název filmu
async function getMovieName(imdbId) {
    const url = `https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`;
    try {
        const resp = await needle('get', url);
        if (resp.body && resp.body.meta && resp.body.meta.name) return resp.body.meta.name;
    } catch (e) {}
    return "Matrix"; // Fallback
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
        const parts = req.url.split('/');
        const id = parts[parts.length - 1].replace('.json', '');
        const movieName = await getMovieName(id);

        // ODKAZ 1: Info o tom, co děláme
        streams.push({
            title: `ℹ️ Testuji Prehraj.to pro: ${movieName}`,
            url: SAFE_URL,
            behaviorHints: { notWebReady: true }
        });

        try {
            // URL pro vyhledávání na Prehraj.to
            // Obvykle to bývá https://prehraj.to/hledej/nazev+filmu
            const searchUrl = `https://prehraj.to/hledej/${encodeURIComponent(movieName)}`;
            
            console.log("Dotazuji se:", searchUrl);

            const resp = await needle('get', searchUrl, {
                open_timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://prehraj.to/'
                }
            });

            // ANALÝZA ODPOVĚDI
            if (resp.statusCode === 200) {
                const $ = cheerio.load(resp.body);
                const pageTitle = $('title').text().trim();
                
                // Kontrola Cloudflare
                if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required')) {
                     streams.push({
                        title: `⛔ BLOK: Cloudflare ochrana aktivní`,
                        description: "Vercel se přes bránu nedostal.",
                        url: SAFE_URL
                    });
                } else {
                    // JSME UVNITŘ! Zkusíme spočítat výsledky.
                    // Na Prehraj.to jsou výsledky často v div class="video-item" nebo odkazech
                    let foundCount = 0;
                    let firstLink = "";

                    // Hledáme odkazy, které vypadají jako videa
                    $('a').each((i, elem) => {
                        const href = $(elem).attr('href');
                        const text = $(elem).text().trim();
                        
                        // Hledáme typické znaky videa (avi, mp4, mkv v názvu nebo URL)
                        // Nebo prostě jen odkazy, co nejsou menu
                        if (href && href.length > 10 && !href.includes('prihlaseni') && !href.includes('registrace')) {
                             // Jednoduchá heuristika: pokud text odkazu obsahuje název filmu
                             if (text.toLowerCase().includes(movieName.toLowerCase())) {
                                 foundCount++;
                                 if (!firstLink) firstLink = href;
                             }
                        }
                    });

                    if (foundCount > 0) {
                        streams.push({
                            title: `✅ ÚSPĚCH: Našel jsem ${foundCount} videí!`,
                            description: `První: ${firstLink.substring(0, 30)}...`,
                            url: firstLink.startsWith('http') ? firstLink : 'https://prehraj.to' + firstLink,
                            behaviorHints: { notWebReady: true }
                        });
                    } else {
                        streams.push({
                            title: `⚠️ Web běží, ale nic nenašel`,
                            description: `Titulek stránky: ${pageTitle}`,
                            url: searchUrl // Odkaz na výsledky hledání
                        });
                    }
                }

            } else {
                streams.push({
                    title: `⛔ CHYBA SERVERU: Kód ${resp.statusCode}`,
                    url: SAFE_URL
                });
            }

        } catch (e) {
            streams.push({
                title: `💀 KRITICKÁ CHYBA`,
                description: e.message,
                url: SAFE_URL
            });
        }

        res.end(JSON.stringify({ streams: streams }));
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Prehraj.to Probe</h1><a href="stremio://${req.headers.host}/manifest.json">SPUSTIT</a>`);
};