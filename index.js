const { addonBuilder } = require('stremio-addon-sdk');
const needle = require('needle');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.cz.hokejka.stable',
    version: '1.0.5',
    name: 'CZ Hokejka (Stable)',
    description: 'Videa z Hokej.cz',
    resources: ['catalog', 'stream'], // Meta nepotřebujeme, ušetříme čas
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

// 1. KATALOG (S záchrannou brzdou)
builder.defineCatalogHandler(async ({ type, id }) => {
    console.log("Stahuji Hokej.cz...");
    
    // ZÁCHRANNÁ POLOŽKA (Kdyby vše selhalo)
    const fallbackItem = {
        id: 'hokej_fallback',
        type: 'other',
        name: "Aktualizovat seznam",
        poster: "https://www.hokej.cz/images/logo.png",
        description: "Pokud nevidíte videa, klikněte zde (chyba spojení)."
    };

    try {
        // Nastavíme timeout jen 5 sekund, aby to Vercel stihl
        const resp = await needle('get', 'https://www.hokej.cz/tv/hokejka', {
            open_timeout: 5000,
            response_timeout: 5000,
            follow_max: 2
        });
        
        if (resp.statusCode !== 200) {
            console.log("Chyba webu.");
            return { metas: [fallbackItem] }; // Vracíme aspoň něco
        }

        const $ = cheerio.load(resp.body);
        let metas = [];

        // Rychlý scrape
        $('a').each((i, elem) => {
            const link = $(elem).attr('href');
            // Hokej.cz má obrázky různě, zkusíme najít jakýkoliv img uvnitř
            const imgElem = $(elem).find('img');
            const img = imgElem.attr('src') || imgElem.attr('data-src');
            const title = $(elem).text().trim();

            if (link && link.includes('/video/') && img && title.length > 5) {
                const match = link.match(/\/video\/(\d+)/);
                if (match) {
                    metas.push({
                        id: `hokej_${match[1]}`,
                        type: 'other',
                        name: title.substring(0, 50), // Zkrátíme název
                        poster: img.startsWith('http') ? img : 'https://www.hokej.cz' + img
                    });
                }
            }
        });

        // Pokud jsme nic nenašli, vrátíme zálohu
        if (metas.length === 0) {
            return { metas: [fallbackItem] };
        }

        return { metas: metas };

    } catch (e) {
        console.log("Chyba:", e.message);
        // I při chybě vrátíme katalog s jednou položkou!
        return { metas: [fallbackItem] };
    }
});

// 2. STREAM (Zůstává stejný)
builder.defineStreamHandler(async ({ type, id }) => {
    if (id === 'hokej_fallback') return { streams: [] }; // Na záložní položku nejde kliknout

    const realId = id.replace('hokej_', '');
    const videoUrl = `https://www.hokej.cz/tv/hokejka/video/${realId}`;
    
    try {
        const resp = await needle('get', videoUrl, { follow_max: 2 });
        const html = resp.body;
        
        // Hledáme .m3u8
        const m3u8Match = html.match(/https?:\\?\/\\?\/[^"'\s<>]+\.m3u8/);
        
        if (m3u8Match) {
            return {
                streams: [{
                    title: "🏒 Přehrát Hokej",
                    url: m3u8Match[0].replace(/\\\//g, '/')
                }]
            };
        }

        // Fallback na web
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

// Router
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<h1>Hokejka v1.0.5</h1><a href="stremio://${req.headers.host}/manifest.json">INSTALOVAT</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};