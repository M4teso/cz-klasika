const { addonBuilder } = require('stremio-addon-sdk');
const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.hokejka.final',
    version: '1.0.6', // Zvedám verzi
    name: 'CZ Hokejka',
    description: 'Videa z Hokej.cz',
    // DŮLEŽITÉ: Vrátil jsem 'meta' do resources
    resources: ['catalog', 'meta', 'stream'], 
    types: ['other'], 
    catalogs: [
        {
            type: 'other',
            id: 'hokej_catalog',
            name: '🏒 CZ Hokej',
            extra: [{ name: 'search', isRequired: false }]
        }
    ],
    idPrefixes: ['hokej_']
};

const builder = new addonBuilder(manifest);

// Hlavičky, abychom vypadali jako běžný prohlížeč (Chrome)
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://hokej.cz/'
};

// 1. KATALOG (Seznam videí)
builder.defineCatalogHandler(async ({ type, id }) => {
    console.log("Stahuji seznam videí...");
    
    try {
        const resp = await needle('get', 'https://www.hokej.cz/tv/hokejka', {
            headers: HEADERS,
            open_timeout: 6000, // 6 sekund timeout
            follow_max: 2
        });
        
        const $ = cheerio.load(resp.body);
        let metas = [];

        $('a').each((i, elem) => {
            const link = $(elem).attr('href');
            // Zkusíme najít obrázek různými způsoby
            const imgElem = $(elem).find('img');
            const img = imgElem.attr('src') || imgElem.attr('data-src');
            const title = $(elem).text().trim();

            if (link && link.includes('/video/') && img && title.length > 3) {
                const match = link.match(/\/video\/(\d+)/);
                if (match) {
                    const fullImg = img.startsWith('http') ? img : 'https://www.hokej.cz' + img;
                    metas.push({
                        id: `hokej_${match[1]}`,
                        type: 'other',
                        name: title.replace(/\s+/g, ' ').substring(0, 60), // Čistý název
                        poster: fullImg,
                        // Přidáme description rovnou do katalogu, vypadá to lépe
                        description: "Sledovat na Hokejka TV" 
                    });
                }
            }
        });

        // Filtr duplicit
        const uniqueMetas = [...new Map(metas.map(item => [item['id'], item])).values()];

        if (uniqueMetas.length === 0) {
            // Pokud se nic nenačte, vrátíme chybovou položku
            return { metas: [{
                id: 'hokej_error',
                type: 'other',
                name: "⚠️ Načítání selhalo",
                poster: "https://www.hokej.cz/images/logo.png",
                description: "Web hokej.cz neodpověděl včas. Zkuste to za chvíli."
            }]};
        }

        return { metas: uniqueMetas };

    } catch (e) {
        console.log("Chyba:", e.message);
        return { metas: [{
            id: 'hokej_error',
            type: 'other',
            name: "⚠️ Chyba spojení",
            poster: "https://www.hokej.cz/images/logo.png",
            description: e.message
        }]};
    }
});

// 2. META (Detail položky - TOTO OPRAVUJE TU CHYBU)
builder.defineMetaHandler(async ({ type, id }) => {
    
    // Pokud uživatel klikl na chybovou hlášku
    if (id === 'hokej_error') {
        return { meta: {
            id: id,
            type: 'other',
            name: "Chyba načítání",
            description: "Server Vercel se nedokázal spojit s Hokej.cz. Zkuste restartovat Stremio nebo obnovit doplněk.",
            poster: "https://www.hokej.cz/images/logo.png"
        }};
    }

    // Normální video
    return {
        meta: {
            id: id,
            type: 'other',
            name: "Hokej Video",
            poster: "https://www.hokej.cz/images/logo.png",
            description: "Načítám přehrávač...",
            background: "https://www.hokej.cz/images/logo.png"
        }
    };
});

// 3. STREAM (Získání odkazu)
builder.defineStreamHandler(async ({ type, id }) => {
    if (id === 'hokej_error') return { streams: [] };

    const realId = id.replace('hokej_', '');
    const videoUrl = `https://www.hokej.cz/tv/hokejka/video/${realId}`;
    
    try {
        const resp = await needle('get', videoUrl, { headers: HEADERS, follow_max: 2 });
        const html = resp.body;
        
        // Hledáme .m3u8
        const m3u8Match = html.match(/https?:\\?\/\\?\/[^"'\s<>]+\.m3u8/);
        
        if (m3u8Match) {
            return {
                streams: [{
                    title: "🏒 Přehrát Stream (HLS)",
                    url: m3u8Match[0].replace(/\\\//g, '/')
                }]
            };
        }
        
        // Hledáme .mp4
        const mp4Match = html.match(/https?:\\?\/\\?\/[^"'\s<>]+\.mp4/);
        if (mp4Match) {
            return {
                streams: [{
                    title: "🏒 Přehrát Video (MP4)",
                    url: mp4Match[0].replace(/\\\//g, '/')
                }]
            };
        }

        // Fallback
        return {
            streams: [{
                title: "🌐 Otevřít na webu",
                url: videoUrl,
                behaviorHints: { notWebReady: true }
            }]
        };
    } catch (e) {
        return { streams: [] };
    }
});

const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<h1>Hokejka v1.0.6</h1><a href="stremio://${req.headers.host}/manifest.json">INSTALOVAT</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};