const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.streamy',
    version: '1.0.7',
    name: 'CZ/SK Live & Test',
    description: 'Živé vysílání a testovací streamy',
    resources: ['catalog', 'meta', 'stream'],
    types: ['tv', 'channel'], 
    catalogs: [
        {
            type: 'tv',
            id: 'cz_live_tv',
            name: 'CZ/SK Živé Vysílání'
        }
    ],
    idPrefixes: ['cz_live_']
};

const CHANNELS = [
    {
        id: 'cz_live_ocko',
        type: 'tv',
        name: 'Óčko Star',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/%C3%93%C4%8Dko_Star_logo_2021.png',
        description: 'Největší hity od 80. let po současnost. Živé vysílání.',
        streamUrl: 'https://stream.mediawork.cz/ocko-star/ocko-star-hq/playlist.m3u8'
    },
    {
        id: 'cz_live_ta3',
        type: 'tv',
        name: 'TA3 (Zprávy)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/TA3_logo_2011.png/640px-TA3_logo_2011.png',
        description: 'Slovenská zpravodajská televize. Živě.',
        streamUrl: 'https://stream.mediawork.cz/ta3/ta3-hq/playlist.m3u8' 
    },
    {
        id: 'cz_live_bunny',
        type: 'tv',
        name: 'TEST: Big Buck Bunny',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Pokud se toto přehraje, váš addon funguje správně.',
        streamUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
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
            streams: [{ url: channel.streamUrl, title: "🟢 Přehrát Stream" }]
        });
    }
    return Promise.resolve({ streams: [] });
});

// --- VERCEL HTTP HANDLER ---
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    // 1. Pokud uživatel otevře hlavní stránku (/), ukážeme mu instrukce
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>Váš Addon Běží! ✅</h1>
                    <p>Pro instalaci do Stremia klikněte na odkaz níže, nebo zkopírujte adresu:</p>
                    <p style="background: #eee; padding: 10px; display: inline-block;">
                        ${req.headers.host}/manifest.json
                    </p>
                    <br><br>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #8e44ad; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                       Nainstalovat do Stremia
                    </a>
                </body>
            </html>
        `);
        return;
    }

    // 2. Ostatní požadavky (manifest.json, streamy) vyřeší Stremio Router
    router(req, res, function () {
        res.statusCode = 404;
        res.end();
    });
};