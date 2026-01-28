const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.google.test', 
    version: '6.0.0', // Velký skok verze
    name: 'Google Source Test',
    description: 'Pouze zdroje z Google CDN (MP4)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'google_catalog',
            name: 'Google Test Movies'
        }
    ],
    idPrefixes: ['goog_']
};

const VIDEOS = [
    {
        id: 'goog_bunny',
        type: 'movie',
        name: 'Big Buck Bunny',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Tohle vám minule fungovalo. Musí to jet i teď.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
        id: 'goog_steel',
        type: 'movie',
        name: 'Tears of Steel',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Tears_of_Steel_poster.jpg/450px-Tears_of_Steel_poster.jpg',
        description: 'Sci-fi film. Stejný server jako Králík.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    },
    {
        id: 'goog_sintel',
        type: 'movie',
        name: 'Sintel',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Sintel_poster.jpg/450px-Sintel_poster.jpg',
        description: 'Animovaný film. Stejný server jako Králík.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
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
                    title: "▶️ Přehrát (Google CDN)",
                    behaviorHints: {
                        notWebReady: true, // Vynutí desktop player (fungovalo minule)
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
        res.end(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>Google Test v6.0</h1>
                    <p>Návrat k funkčnímu řešení.</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #d35400; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                       NAINSTALOVAT
                    </a>
                </body>
            </html>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};