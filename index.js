const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.auto.uzi',
    version: '1.0.6', // Nová verze
    name: 'UZI Rychlý Test',
    description: 'Test spojení s timeoutem',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt']
};

// Váš funkční odkaz (Stranger Things)
const BASE_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

// Funkce pro generování unikátního odkazu (aby Stremio neskrývalo řádky)
function getLink(label) {
    // Přidáme na konec URL náhodné číslo &rand=12345
    // Pro server je to jedno (ignoruje to), ale Stremio si myslí, že je to jiný soubor.
    return `${BASE_URL}&random=${Math.floor(Math.random() * 100000)}&label=${label}`;
}

async function getMovieName(imdbId) {
    const url = `https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`;
    try {
        const resp = await needle('get', url);
        if (resp.body && resp.body.meta && resp.body.meta.name) return resp.body.meta.name;
    } catch (e) {}
    return "Movie";
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
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

            // 1. INFO ŘÁDEK (Ten už vidíte)
            streams.push({
                title: `ℹ️ START: Hledám "${movieName}"`,
                url: getLink('info'),
                behaviorHints: { notWebReady: true }
            });

            // 2. TEST SPOJENÍ (HLAVNÍ STRÁNKA)
            // Zkusíme načíst jen hlavní stránku, ne hledání. Tím zjistíme, jestli máme BAN.
            const testUrl = "https://uzi.si/";
            
            try {
                const resp = await needle('get', testUrl, { 
                    open_timeout: 3000, // Čekáme max 3 sekundy
                    response_timeout: 3000,
                    follow_max: 2,
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
                    }
                });

                if (resp.statusCode === 200) {
                    // SPOJENÍ OK -> ZKUSÍME HLEDAT
                    streams.push({
                        title: `✅ SPOJENÍ OK (Kód 200)`,
                        url: getLink('ok'),
                        behaviorHints: { notWebReady: true }
                    });

                    // Teď zkusíme hledání
                    const searchUrl = `https://uzi.si/hladaj/${encodeURIComponent(movieName)}`;
                    const searchResp = await needle('get', searchUrl, { follow_max: 2 });
                    const $ = cheerio.load(searchResp.body);
                    
                    let foundTitle = "";
                    let foundLink = "";

                    // Hledáme v odkazech
                    $('a').each((i, elem) => {
                        const txt = $(elem).text().trim();
                        const href = $(elem).attr('href');
                        // Hledáme shodu alespoň 4 písmen
                        if (txt.toLowerCase().includes(movieName.toLowerCase().substring(0, 4)) && href) {
                            foundTitle = txt;
                            foundLink = href;
                            return false; 
                        }
                    });

                    if (foundLink) {
                         streams.push({
                            title: `🏆 NAŠEL JSEM: ${foundTitle}`,
                            url: foundLink.startsWith('http') ? foundLink : 'https://uzi.si' + foundLink, // Zde by mělo být reálné video
                            behaviorHints: { notWebReady: true }
                        });
                    } else {
                        streams.push({
                            title: `🤷‍♂️ Web načten, ale film nenalezen`,
                            url: getLink('notfound')
                        });
                    }

                } else {
                    // SERVER ODPOVĚDĚL CHYBOU (asi blokace)
                    streams.push({
                        title: `⛔ BLOKACE: Server vrátil kód ${resp.statusCode}`,
                        url: getLink('error_code')
                    });
                }

            } catch (err) {
                // TIMEOUT NEBO SÍŤOVÁ CHYBA
                streams.push({
                    title: `💀 SÍŤOVÁ CHYBA: ${err.message}`,
                    description: "Vercel se nedokázal spojit s uzi.si (Timeout/Block).",
                    url: getLink('net_error')
                });
            }

        } catch (e) {
            streams.push({ title: "Crash", url: getLink('crash') });
        }

        res.end(JSON.stringify({ streams: streams }));
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Test v1.0.6</h1><a href="stremio://${req.headers.host}/manifest.json">AKTUALIZOVAT</a>`);
};