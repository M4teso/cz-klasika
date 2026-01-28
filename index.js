const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.google.cinema',
    version: '3.0.0',
    name: 'Google Cinema (Funkční)',
    description: 'Filmy a scenérie z Google serveru',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'google_catalog',
            name: 'Google Videa (100% OK)'
        }
    ],
    idPrefixes: ['goog_']
};

const VIDEOS = [
    // --- FILMY (Animované / Sci-Fi) ---
    {
        id: 'goog_sintel',
        type: 'movie',
        name: 'Sintel (Drak)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Sintel_poster.jpg/450px-Sintel_poster.jpg',
        description: 'Dojemný příběh o dívce a drakovi. (Animovaný)',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    },
    {
        id: 'goog_steel',
        type: 'movie',
        name: 'Tears of Steel',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Tears_of_Steel_poster.jpg/450px-Tears_of_Steel_poster.jpg',
        description: 'Sci-fi akční film s roboty v Amsterdamu.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    },
    {
        id: 'goog_elephant',
        type: 'movie',
        name: 'Elephants Dream',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Elephants_Dream_poster.jpg/450px-Elephants_Dream_poster.jpg',
        description: 'První "Open Movie" film. Surrealistický příběh o stroji.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },

    // --- RELAX / SCENÉRIE (Záběry z Google Chromecastu) ---
    {
        id: 'goog_joyrides',
        type: 'movie',
        name: 'Relax: Joyrides (Vesmír/Příroda)',
        poster: 'https://img.youtube.com/vi/1X9-1X9-1X9/maxresdefault.jpg', // Placeholder
        description: 'Krásné záběry z vesmíru a přírody. (Původně demo pro Chromecast).',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
    },
    {
        id: 'goog_escapes',
        type: 'movie',
        name: 'Relax: Escapes (Příroda)',
        poster: 'https://img.youtube.com/vi/2X9-2X9-2X9/maxresdefault.jpg', // Placeholder
        description: 'Útěk do přírody. Klidné záběry krajiny.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    
    // --- KLASIKA ---
    {
        id: 'goog_bunny',
        type: 'movie',
        name: 'Big Buck Bunny',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Náš starý známý králík.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'google_catalog') {
        const metas = VIDEOS.map(item => ({
            id: item.id, type: item.type, name: item.name, poster: item.poster, description: item.description
        }));
        return Promise.resolve({ metas });
    }
    return Promise.resolve({ metas: [] });
});

builder.defineMetaHandler(({ type, id }) => {
    const item = VIDEOS.find(i => i.id === id);
    return Promise.resolve({ meta: item || null });
});

builder.defineStreamHandler(({ type, id }) => {
    const item = VIDEOS.find(i => i.id === id);
    if (item && item.url) {
        return Promise.resolve({
            streams: [
                {
                    url: item.url,
                    title: "▶️ Přehrát (Google Server)",
                    behaviorHints: {
                        notWebReady: true,
                        bingeGroup: "movie"
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
        res.end(`<h1>Google Cinema v3.0</h1><a href="stremio://${req.headers.host}/manifest.json">NAINSTALOVAT (100% Funkční)</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};