const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.streamy.fix',
    version: '1.0.9',
    name: 'CZ/SK Live & Test (Fixed)',
    description: 'Test živých streamů a kódování',
    resources: ['catalog', 'meta', 'stream'],
    types: ['tv', 'channel'], 
    catalogs: [
        {
            type: 'tv',
            id: 'cz_live_tv',
            name: 'Živé Vysílání (Test)'
        }
    ],
    idPrefixes: ['cz_live_']
};

// --- OPRAVENÁ DATABÁZE ---
const CHANNELS = [
    {
        id: 'cz_live_nasa',
        type: 'tv',
        name: 'NASA TV (Live)',
        // Používáme stabilní obrázek z IMDB/Githubu, ne z Wikipedie
        poster: 'https://raw.githubusercontent.com/Stremio/stremio-logo/master/examples/nasa_logo.png',
        description: 'Živý přenos z NASA. Test HLS formátu (m3u8).',
        // Oficiální a stabilní NASA stream
        streamUrl: 'https://ntv1.akamaized.net/hls/live/2013975/NASA-NTV1-HLS/master.m3u8'
    },
    {
        id: 'cz_live_bunny',
        type: 'tv',
        name: 'Big Buck Bunny (MP4)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Klasický testovací soubor (formát MP4).',
        streamUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
        id: 'cz_live_hls_test',
        type: 'tv',
        name: 'Akamai HLS Test',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/600px-JavaScript-logo.png',
        description: 'Technický test pro ověření, že Stremio umí přehrát .m3u8 stream.',
        streamUrl: 'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/master.m3u8' 
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
                title: "🟢 Spustit Stream" 
            }]
        });
    }
    return Promise.resolve({ streams: [] });
});

// --- ROUTER S OPRAVENOU ČEŠTINOU ---
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        // TADY JE OPRAVA: Přidáno charset=utf-8
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <html>
                <head>
                    <meta charset="utf-8"> 
                    <title>Můj Stremio Addon</title>
                </head>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f0f0f0;">
                    <h1>Váš Addon Běží! ✅</h1>
                    <p>Čeština už by měla být v pořádku: ěščřžýáíé.</p>
                    <p>Pro instalaci klikněte níže:</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #8e44ad; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       NAINSTALOVAT DO STREMIA
                    </a>
                </body>
            </html>
        `);
        return;
    }

    router(req, res, function () {
        res.statusCode = 404;
        res.end();
    });
};