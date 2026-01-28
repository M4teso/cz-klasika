const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.skicams',
    version: '1.0.0',
    name: 'CZ Ski Cams',
    description: 'Živé kamery z českých hor (YouTube)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'ski_catalog',
            name: '⛄ Sjezdovky & Hory'
        }
    ],
    idPrefixes: ['ski_']
};

// --- DATABÁZE KAMER (Zde doplňujte YouTube ID) ---
const CAMS = [
    {
        id: 'ski_spindl_svpetr',
        type: 'movie',
        name: 'Špindlerův Mlýn - Sv. Petr',
        poster: 'https://www.skiareal.cz/images/content/webkamery/svaty-petr-plne.jpg',
        description: 'Panoramatická kamera Svatý Petr. (Zdroj: YouTube)',
        // YouTube ID videa (to za v=)
        ytId: 'FfS1aL1qFj8' 
    },
    {
        id: 'ski_lipno',
        type: 'movie',
        name: 'Skiareál Lipno',
        poster: 'https://www.lipno.info/images/zima/sjezdovky-lipno.jpg',
        description: 'Živý pohled na Skiareál Lipno.',
        ytId: 'K_uJg2qYhMo'
    },
    {
        id: 'ski_pustevny',
        type: 'movie',
        name: 'Pustevny - Stezka',
        poster: 'https://www.pustevny.cz/wp-content/uploads/2018/12/stezka-v-oblacich-zima.jpg',
        description: 'Stezka Valaška a okolí.',
        ytId: '7Q3Z8Z8Z8Z8' // Placeholder, nahraďte aktuálním, pokud tento nejede
    },
    {
        id: 'ski_test',
        type: 'movie',
        name: 'TEST: Big Buck Bunny',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Kontrolní video (MP4), kdyby YouTube zlobilo.',
        // Direct MP4 (funguje vždy)
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'ski_catalog') {
        const metas = CAMS.map(item => ({
            id: item.id, type: item.type, name: item.name, poster: item.poster, description: item.description
        }));
        return Promise.resolve({ metas });
    }
    return Promise.resolve({ metas: [] });
});

builder.defineMetaHandler(({ type, id }) => {
    const item = CAMS.find(i => i.id === id);
    return Promise.resolve({ meta: item || null });
});

builder.defineStreamHandler(({ type, id }) => {
    const item = CAMS.find(i => i.id === id);
    
    // 1. Pokud je to YouTube Stream
    if (item && item.ytId) {
        return Promise.resolve({
            streams: [
                {
                    ytId: item.ytId,
                    title: "🔴 Živý přenos (YouTube)",
                }
            ]
        });
    }

    // 2. Pokud je to přímý soubor (Králík)
    if (item && item.url) {
        return Promise.resolve({
            streams: [
                {
                    url: item.url,
                    title: "▶️ Přehrát soubor",
                    behaviorHints: { notWebReady: true, bingeGroup: "tv" }
                }
            ]
        });
    }

    return Promise.resolve({ streams: [] });
});

// Router
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>❄️ CZ Ski Cams ❄️</h1>
                    <p>Sjezdovky ve vašem obýváku.</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                       NAINSTALOVAT
                    </a>
                </body>
            </html>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};