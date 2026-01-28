const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.relax.pexels',
    version: '2.0.0', // Nová verze, nové zdroje
    name: 'Relax Pexels (HD)',
    description: 'Relaxační videa z profesionálních serverů',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'relax_pexels',
            name: '🍃 Relax HD (Pexels)'
        }
    ],
    idPrefixes: ['pex_']
};

const VIDEOS = [
    // 1. KRB (Pexels - MP4)
    {
        id: 'pex_fire',
        type: 'movie',
        name: '🔥 Krb (Pexels HD)',
        poster: 'https://images.pexels.com/videos/6466763/fire-fireplace-flame-home-6466763.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
        description: 'Praskající oheň v krbu. (Zdroj: Pexels)',
        // Přímý link na MP4 (1920x1080)
        url: 'https://videos.pexels.com/video-files/6466763/6466763-hd_1920_1080_25fps.mp4'
    },
    // 2. OCEÁN (Pexels - MP4)
    {
        id: 'pex_ocean',
        type: 'movie',
        name: '🌊 Oceán a Pláž',
        poster: 'https://images.pexels.com/videos/855018/free-video-855018.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
        description: 'Vlny narážející na pláž při západu slunce.',
        url: 'https://videos.pexels.com/video-files/855018/855018-hd_1920_1080_30fps.mp4'
    },
    // 3. LES A VODA (Pexels - MP4)
    {
        id: 'pex_forest',
        type: 'movie',
        name: '🌲 Lesní Potok',
        poster: 'https://images.pexels.com/videos/5736841/pexels-photo-5736841.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260',
        description: 'Klidný potok v lese. Zelená příroda.',
        url: 'https://videos.pexels.com/video-files/5736841/5736841-hd_1920_1080_24fps.mp4'
    },
    // 4. KONTROLA (Google - Králík)
    {
        id: 'pex_bunny',
        type: 'movie',
        name: '🐰 Kontrola: Králík',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Pokud nejede ani Krb, ani Oceán, ale Králík ano - Pexels u vás nefunguje.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'relax_pexels') {
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
                    title: "▶️ Přehrát (Pexels HighSpeed)",
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
        res.end(`<h1>Relax Pexels v2.0</h1><a href="stremio://${req.headers.host}/manifest.json">INSTALOVAT</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};