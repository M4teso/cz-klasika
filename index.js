const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.streamy.final',
    version: '1.1.0',
    name: 'HLS Test & CZ TV',
    description: 'Test funkčnosti HLS streamů',
    resources: ['catalog', 'meta', 'stream'],
    types: ['tv'], 
    catalogs: [{ type: 'tv', id: 'cz_live_tv', name: 'Live Stream Test' }],
    idPrefixes: ['test_']
};

const CHANNELS = [
    {
        id: 'test_mux',
        type: 'tv',
        name: 'Mux HLS Test (Big Buck Bunny)',
        poster: 'https://image.tmdb.org/t/p/w500/uVEFQvFMMsg4e6yb03xWI5wdjv.jpg',
        description: 'Referenční HLS stream (.m3u8) od společnosti Mux. Musí fungovat všude.',
        // Tento stream je 100% spolehlivý
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    },
    {
        id: 'test_apple',
        type: 'tv',
        name: 'Apple BipBop (Audio/Video)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Apple-logo.png/640px-Apple-logo.png',
        description: 'Základní testovací stream přímo od Apple. Nízká kvalita, ale rychlý start.',
        // HTTP (ne HTTPS), někdy to projde lépe firewallem
        streamUrl: 'http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8'
    },
    {
        id: 'test_ct24',
        type: 'tv',
        name: 'ČT24 (Pokus)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Ct24_logo_new.png',
        description: 'Pokus o živé vysílání ČT24. (Může být geo-blokováno)',
        // Veřejný stream ČT, často se mění
        streamUrl: 'https://ct24-lh.akamaihd.net/i/CT24_1@308332/master.m3u8'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'cz_live_tv') {
        const metas = CHANNELS.map(ch => ({
            id: ch.id, type: ch.type, name: ch.name, poster: ch.poster, description: ch.description
        }));
        return Promise.resolve({ metas });
    }
    return Promise.resolve({ metas: [] });
});

builder.defineMetaHandler(({ type, id }) => {
    const item = CHANNELS.find(c => c.id === id);
    return Promise.resolve({ meta: item || {} });
});

builder.defineStreamHandler(({ type, id }) => {
    const channel = CHANNELS.find(c => c.id === id);
    if (channel && channel.streamUrl) {
        return Promise.resolve({
            streams: [{ 
                url: channel.streamUrl, 
                title: "▶️ Spustit Stream",
                behaviorHints: {
                    notWebReady: true, // Důležité pro Windows
                    bingeGroup: "tv"
                }
            }]
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
        res.end(`<h1>Addon Update 1.1.0 OK ✅</h1><a href="stremio://${req.headers.host}/manifest.json">Instalovat</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};