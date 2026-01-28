const { addonBuilder } = require('stremio-addon-sdk');
const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.hokejka.vercel',
    version: '1.0.1',
    name: 'Hokejka TV',
    description: 'Extraliga, Reprezentace a NHL novinky',
    resources: ['catalog', 'meta', 'stream'],
    types: ['tv', 'other'], 
    catalogs: [
        {
            type: 'other',
            id: 'hokejka_feed',
            name: '🏒 Hokejka TV',
            extra: [{ name: 'search', isRequired: false }]
        }
    ],
    idPrefixes: ['hokej_']
};

const builder = new addonBuilder(manifest);

// 1. KATALOG (Načte seznam videí)
builder.defineCatalogHandler(async ({ type, id }) => {
    // Vercel logy uvidíte v dashboardu
    console.log("Načítám katalog Hokejka TV...");
    
    try {
        const url = 'https://www.hokej.cz/tv/hokejka';
        const resp = await needle('get', url, { follow_max: 3 });
        
        if (resp.statusCode !== 200) {
            console.log("Chyba načítání webu:", resp.statusCode);
            return { metas: [] };
        }

        const $ = cheerio.load(resp.body);
        let metas = [];

        // Hledáme odkazy, které vypadají jako videa
        // Selektor 'a' je obecný, ale filtrujeme podle obsahu URL
        $('a').each((i, elem) => {
            const link = $(elem).attr('href');
            // Najdeme obrázek (hokej.cz používá lazy loading, takže někdy data-src)
            const img = $(elem).find('img').attr('src') || $(elem).find('img').attr('data-src');
            const title = $(elem).find('h3').text().trim() || $(elem).attr('title') || $(elem).text().trim();

            // Filtr: Musí to být odkaz na video, mít obrázek a titulek
            if (link && link.includes('/video/') && img && title.length > 5) {
                
                // Získáme ID (např. /video/12345)
                const match = link.match(/\/video\/(\d+)/);
                if (match) {
                    const videoId = match[1];
                    
                    // Oprava URL obrázku, pokud je relativní
                    const fullImg = img.startsWith('http') ? img : 'https://www.hokej.cz' + img;

                    metas.push({
                        id: `hokej_${videoId}`,
                        type: 'other',
                        name: title,
                        poster: fullImg,
                        description: "Sledovat na Hokejka TV"
                    });
                }
            }
        });

        // Odstraníme duplicity (někdy je tam stejné video 2x)
        const uniqueMetas = [...new Map(metas.map(item => [item['id'], item])).values()];
        
        return { metas: uniqueMetas };

    } catch (e) {
        console.log("Chyba katalogu:", e.message);
        return { metas: [] };
    }
});

// 2. META (Detail videa - jen aby to nehodilo chybu)
builder.defineMetaHandler(async ({ type, id }) => {
    return {
        meta: {
            id: id,
            type: 'other',
            name: "Hokej Video",
            poster: "https://www.hokej.cz/images/logo.png",
            description: "Načítám stream..."
        }
    };
});

// 3. STREAM (Získání odkazu na video)
builder.defineStreamHandler(async ({ type, id }) => {
    const realId = id.replace('hokej_', '');
    const videoUrl = `https://www.hokej.cz/tv/hokejka/video/${realId}`;
    
    try {
        const resp = await needle('get', videoUrl, { follow_max: 3 });
        const html = resp.body;

        // A) Hledáme .m3u8 (HLS)
        // Regex hledá cokoliv, co začíná http, neobsahuje mezery a končí .m3u8
        const m3u8Match = html.match(/https?:\\?\/\\?\/[^"'\s<>]+\.m3u8/);
        
        if (m3u8Match) {
            // Odstraníme zpětná lomítka (pokud je to v JSONu)
            const cleanUrl = m3u8Match[0].replace(/\\\//g, '/');
            
            return {
                streams: [{
                    title: "🏒 Přehrát Stream (HLS)",
                    url: cleanUrl
                }]
            };
        }

        // B) Hledáme .mp4
        const mp4Match = html.match(/https?:\\?\/\\?\/[^"'\s<>]+\.mp4/);
        if (mp4Match) {
            const cleanUrl = mp4Match[0].replace(/\\\//g, '/');
            return {
                streams: [{
                    title: "🏒 Přehrát Video (MP4)",
                    url: cleanUrl
                }]
            };
        }

        // C) Fallback - Otevřít web
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

// Vercel Router
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1>🏒 Hokejka TV v1.0</h1>
                <p>Nyní běží na Vercelu!</p>
                <a href="stremio://${req.headers.host}/manifest.json" 
                   style="background:#e74c3c; color:white; padding:15px; text-decoration:none; border-radius:5px;">
                   NAINSTALOVAT
                </a>
            </div>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};