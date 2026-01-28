const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.final.fixed', 
    version: '2.0.4', 
    name: 'CZ TV (Stabilní)',
    description: 'Praha TV, TV Noe a Test',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'cz_tv_catalog',
            name: 'CZ Televize & Test'
        }
    ],
    idPrefixes: ['cztv_']
};

const STREAMS = [
    {
        id: 'cztv_mux',
        type: 'movie',
        name: 'TEST: Mux (Big Buck Bunny)',
        poster: 'https://image.tmdb.org/t/p/w500/uVEFQvFMMsg4e6yb03xWI5wdjv.jpg',
        description: 'Testovací stream. Pokud toto funguje, addon je v pořádku.',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    },
    {
        id: 'cztv_praha',
        type: 'movie',
        name: 'Praha TV',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Praha_TV_logo.png',
        description: 'Regionální zpravodajství z Prahy. Živě.',
        url: 'https://b-prahatv-live-hls.live1.cdn.siminn.net/prahatv_live_hls/live_720p/playlist.m3u8'
    },
    {
        id: 'cztv_noe',
        type: 'movie',
        name: 'TV NOE',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Tv_noe_logo.jpg',
        description: 'Televize dobrých zpráv.',
        url: 'http://stream.poda.cz/tv-noe/playlist.m3u8'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'cz_tv_catalog') {
        const metas = STREAMS.map(item => ({
            id: item.id,
            type: item.type,
            name: item.name,
            poster: item.poster,
            description: item.description
        }));
        return Promise.resolve({ metas });
    }
    return Promise.resolve({ metas: [] });
});

builder.defineMetaHandler(({ type, id }) => {
    const item = STREAMS.find(i => i.id === id);
    return Promise.resolve({ meta: item || null });
});

builder.defineStreamHandler(({ type, id }) => {
    const item = STREAMS.find(i => i.id === id);
    if (item && item.url) {
        return Promise.resolve({
            streams: [
                {
                    url: item.url,
                    title: "▶️ Přehrát Stream",
                    behaviorHints: {
                        notWebReady: true,
                        bingeGroup: "tv"
                    }
                }
            ]
        });
    }
    return Promise.resolve({ streams: [] });
});

// ROUTER PRO VERCEL
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>CZ TV v2.0.4 OK ✅</h1>
                    <p>Chyba 500 opravena.</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                       AKTUALIZOVAT ADDON
                    </a>
                </body>
            </html>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};