const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.final.test', 
    version: '2.0.1', // ZVEDLI JSME VERZI (Stremio si všimne změny)
    name: 'CZ/SK Free TV',
    description: 'Živé vysílání českých a slovenských stanic',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'cz_tv_catalog',
            name: 'CZ/SK Televize (Live)'
        }
    ],
    idPrefixes: ['cztv_']
};

// --- REÁLNÉ TV KANÁLY ---
const STREAMS = [
    {
        id: 'cztv_ct24',
        type: 'movie',
        name: 'ČT24 (Zprávy)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Ct24_logo_new.png',
        description: 'Zpravodajský kanál České televize. Vysílá 24 hodin denně.',
        // Oficiální stream ČT
        url: 'https://ct24-lh.akamaihd.net/i/CT24_1@308332/master.m3u8'
    },
    {
        id: 'cztv_ta3',
        type: 'movie',
        name: 'TA3 (Slovensko)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/TA3_logo_2011.png/640px-TA3_logo_2011.png',
        description: 'Slovenská zpravodajská televize.',
        url: 'https://stream.mediawork.cz/ta3/ta3-hq/playlist.m3u8'
    },
    {
        id: 'cztv_ocko',
        type: 'movie',
        name: 'Óčko Star',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/%C3%93%C4%8Dko_Star_logo_2021.png',
        description: 'Největší hudební hity. Videoklipy nonstop.',
        url: 'https://stream.mediawork.cz/ocko-star/ocko-star-hq/playlist.m3u8'
    },
    {
        id: 'cztv_rtvs24',
        type: 'movie',
        name: 'RTVS 24',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/RTVS_24_logo.png/600px-RTVS_24_logo.png',
        description: 'Zpravodajský okruh slovenské veřejnoprávní televize.',
        url: 'https://b-rtvs-live-24-hls.live1.cdn.siminn.net/rtvs_live_24_hls/live_720p/playlist.m3u8'
    },
    {
        id: 'cztv_retro',
        type: 'movie',
        name: 'Retro Music TV',
        poster: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Retro_Music_Television_logo.png',
        description: 'Hudební pecky z minulých dekád.',
        url: 'https://stream.mediawork.cz/retrotv/retrotv-hq/playlist.m3u8'
    }
];

const builder = new addonBuilder(manifest);

// 1. Katalog
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

// 2. Detail
builder.defineMetaHandler(({ type, id }) => {
    const item = STREAMS.find(i => i.id === id);
    return Promise.resolve({ meta: item || null });
});

// 3. Stream
builder.defineStreamHandler(({ type, id }) => {
    const item = STREAMS.find(i => i.id === id);
    if (item && item.url) {
        return Promise.resolve({
            streams: [
                {
                    url: item.url,
                    title: "▶️ Sledovat Živě (Live Stream)",
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

// Router
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<h1>CZ/SK TV v2.0.1</h1><p>Aktualizováno.</p><a href="stremio://${req.headers.host}/manifest.json">Instalovat</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};