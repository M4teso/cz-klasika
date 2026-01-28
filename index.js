const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.beauty',
    version: '5.0.0', // Jubilejní verze
    name: 'Krásy Česka',
    description: 'Vlaky, Příroda a Města (Wikimedia Commons)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'cz_beauty_catalog',
            name: 'Krásy Česka (Video)'
        }
    ],
    idPrefixes: ['czvid_']
};

const VIDEOS = [
    {
        id: 'czvid_tram',
        type: 'movie',
        name: 'Praha: Jízda Tramvají',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/T3R.P_ev._%C4%8D._8526_na_lince_15.jpg/640px-T3R.P_ev._%C4%8D._8526_na_lince_15.jpg',
        description: 'Pohled na jízdu tramvají T3 v Praze. (Zdroj: Wikimedia Commons)',
        // Přímý soubor WebM (Stremio ho přehraje)
        url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Praha%2C_S%C3%ADdli%C5%A1t%C4%9B_Mod%C5%99any_-_Levsk%C3%A9ho%2C_j%C3%ADzda_tramvaj%C3%AD.webm'
    },
    {
        id: 'czvid_train',
        type: 'movie',
        name: 'Vlak: Trať 010 (Cabview)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/471.026_Praha-Kl%C3%A1novice.jpg/640px-471.026_Praha-Kl%C3%A1novice.jpg',
        description: 'Pohled z kabiny strojvedoucího. Úsek Kolín - Praha.',
        // Video vlaku
        url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Pr%C5%AFjezd_zast%C3%A1vkou_Osek_nad_Be%C4%8Dvou.webm' 
    },
    {
        id: 'czvid_vltava',
        type: 'movie',
        name: 'Řeka Vltava (Příroda)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vltava_in_Prague.jpg/640px-Vltava_in_Prague.jpg',
        description: 'Klidný tok řeky Vltavy.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Vltava_river.webm'
    },
    {
        id: 'czvid_bunny',
        type: 'movie',
        name: 'Kontrola: Big Buck Bunny',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Starý známý králík. Jistota, že Stremio funguje.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'cz_beauty_catalog') {
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
                    title: "▶️ Přehrát Video",
                    behaviorHints: {
                        notWebReady: false, 
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
        res.end(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>Krásy Česka v5.0</h1>
                    <p>Statické video soubory (100% funkční).</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #8e44ad; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                       NAINSTALOVAT
                    </a>
                </body>
            </html>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};