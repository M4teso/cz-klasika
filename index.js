const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.radio.film', 
    version: '3.0.0', // Velký skok verze pro čistou instalaci
    name: 'CZ Rádio & Archiv',
    description: 'Česká rádia a filmy z veřejného archivu',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'cz_radio_catalog',
            name: 'CZ Rádio a Klasika'
        }
    ],
    idPrefixes: ['czmix_']
};

const STREAMS = [
    // 1. RÁDIOŽURNÁL (Audio MP3)
    {
        id: 'czmix_radiozurnal',
        type: 'movie',
        name: '📻 ČRo Radiožurnál',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/2/23/%C4%8CRo_Radio%C5%BEurn%C3%A1l_logo.png',
        description: 'Živé vysílání Českého rozhlasu. Zprávy a publicistika. (Audio)',
        // Oficiální HTTPS stream - velmi stabilní
        url: 'https://icecast.rozhlas.cz/radiozurnal-128.mp3'
    },
    // 2. EVROPA 2 (Audio MP3)
    {
        id: 'czmix_evropa2',
        type: 'movie',
        name: '📻 Evropa 2',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Evropa_2_logo_2015.png',
        description: 'MaXXimum muziky. Nejposlouchanější rádio pro mladé.',
        url: 'https://icecast.axis.cz/evropa2-128.mp3'
    },
    // 3. KRAKATIT (Film MP4)
    {
        id: 'czmix_krakatit',
        type: 'movie',
        name: '🎥 Krakatit (1948)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Krakatit.jpg',
        description: 'Filmová adaptace románu Karla Čapka. Režie: Otakar Vávra. (Zdroj: Archive.org)',
        // Přímý odkaz na soubor z Archive.org (nikdy neexspiruje)
        url: 'https://archive.org/download/Krakatit/Krakatit.mp4'
    },
    // 4. MUX TEST (Kontrola)
    {
        id: 'czmix_mux',
        type: 'movie',
        name: '🔧 TEST: Big Buck Bunny',
        poster: 'https://image.tmdb.org/t/p/w500/uVEFQvFMMsg4e6yb03xWI5wdjv.jpg',
        description: 'Kontrolní video.',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'cz_radio_catalog') {
        const metas = STREAMS.map(item => ({
            id: item.id, type: item.type, name: item.name, poster: item.poster, description: item.description
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
                    title: "▶️ Přehrát (Direct Stream)",
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

// ROUTER
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>CZ Rádio & Archiv v3.0</h1>
                    <p>Audio streamy a Public Domain filmy.</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #e67e22; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                       INSTALOVAT VERZI 3.0
                    </a>
                </body>
            </html>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};