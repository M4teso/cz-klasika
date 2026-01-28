const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.mp4.player', 
    version: '7.0.0', 
    name: 'Můj MP4 Playlist',
    description: 'Přehrávač pro přímé MP4 odkazy (Google, Vlastní)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'my_playlist',
            name: 'Moje Videa & Relax'
        }
    ],
    idPrefixes: ['mp4_']
};

const VIDEOS = [
    // 1. RELAXACE (KRB) - Funguje jako TV kulisa
    {
        id: 'mp4_fireplace',
        type: 'movie',
        name: 'Krb (1 hodina)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Fireplace_breezeway_20090123.jpg/640px-Fireplace_breezeway_20090123.jpg',
        description: 'Relaxační video praskajícího krbu. (MP4, High Speed)',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' 
        // Google bohužel nemá Krb, dal jsem tam jiné relaxační video "Joyrides" jako demo.
        // Pokud najdete MP4 krbu, dejte ho sem.
    },
    // 2. FILMY (Google CDN)
    {
        id: 'mp4_sintel',
        type: 'movie',
        name: 'Sintel (4K)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Sintel_poster.jpg/450px-Sintel_poster.jpg',
        description: 'Příběh o dračici. (Ověřeno: Funkční)',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    },
    {
        id: 'mp4_bunny',
        type: 'movie',
        name: 'Big Buck Bunny',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Klasika.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    // 3. MÍSTO PRO VÁŠ ODKAZ
    {
        id: 'mp4_vlastni',
        type: 'movie',
        name: 'Můj Vlastní Odkaz',
        poster: 'https://via.placeholder.com/300x450.png?text=Vlozte+Odkaz',
        description: 'Sem si v kódu (index.js) vložte jakýkoliv odkaz na MP4 video.',
        url: '' // <--- ZDE DOPLŇTE ODKAZ, POKUD NĚJAKÝ MÁTE
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'my_playlist') {
        // Vyfiltrujeme položky, které nemají URL (aby se nezobrazoval prázdný "Můj Vlastní Odkaz")
        const validItems = VIDEOS.filter(v => v.url && v.url.length > 0);
        
        const metas = validItems.map(item => ({
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
                    title: "▶️ Přehrát (Direct MP4)",
                    behaviorHints: {
                        notWebReady: true, // Zlatý klíč k funkčnosti
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
        res.end(`<h1>MP4 Playlist v7.0</h1><a href="stremio://${req.headers.host}/manifest.json">Instalovat</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};