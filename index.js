const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.czsk.mountains',
    version: '1.0.1', // Nová verze
    name: 'CZ/SK Hory Live',
    description: 'Živé kamery z hor (Direct HLS)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'mountains_catalog',
            name: '🏔️ Hory a Sjezdovky'
        }
    ],
    idPrefixes: ['cam_']
};

const CAMS = [
    {
        id: 'cam_lomnicak',
        type: 'movie',
        name: 'Lomnický štít (2634 m)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Lomnicky_stit_z_Kehmarskeho.jpg/600px-Lomnicky_stit_z_Kehmarskeho.jpg',
        description: 'Vysoké Tatry. Úžasný výhled z druhé nejvyšší hory Slovenska. (Live Stream)',
        // Přímý stream Feratel - velmi stabilní
        url: 'https://streams.feratel.co/stream/1/webtv/t13l.m3u8'
    },
    {
        id: 'cam_strbske',
        type: 'movie',
        name: 'Štrbské Pleso (Sjezdovka)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/%C5%A0trbsk%C3%A9_pleso_1.jpg/640px-%C5%A0trbsk%C3%A9_pleso_1.jpg',
        description: 'Pohled na areál běžeckého lyžování a sjezdovky.',
        url: 'https://streams.feratel.co/stream/1/webtv/t06l.m3u8'
    },
    {
        id: 'cam_bachledka',
        type: 'movie',
        name: 'Bachledka (Stezka)',
        poster: 'https://chodnikkorunamistromov.sk/wp-content/uploads/2019/10/DJI_0109-min.jpg',
        description: 'Bachledova dolina - Stezka korunami stromů.',
        url: 'https://streams.feratel.co/stream/1/webtv/t23l.m3u8'
    },
    {
        id: 'cam_martinky',
        type: 'movie',
        name: 'Martinské hole',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Martinsk%C3%A9_hole%2C_vysiela%C4%8D_K%C3%A9%C5%BE.jpg',
        description: 'Winter Park Martinky. Pohled na sjezdovku.',
        url: 'https://streams.feratel.co/stream/1/webtv/t11l.m3u8'
    },
    {
        id: 'cam_kubinska',
        type: 'movie',
        name: 'Kubínska hoľa',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Kub%C3%ADnska_ho%C4%BEa_-_panoramio_%281%29.jpg',
        description: 'Jeden z nejpopulárnějších lyžařských areálů na Oravě.',
        url: 'https://streams.feratel.co/stream/1/webtv/t16l.m3u8'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'mountains_catalog') {
        const metas = CAMS.map(item => ({
            id: item.id, type: item.type, name: item.name, poster: item.poster, description: item.description
        }));
        return Promise.resolve({ metas });
    }
    return Promise.resolve({ metas: [] });
});

builder.defineMetaHandler(({ type, id }) => {
    const item = CAMS.find(i => i.id === id);
    return Promise.resolve({ meta: item || null });
});

builder.defineStreamHandler(({ type, id }) => {
    const item = CAMS.find(i => i.id === id);
    if (item && item.url) {
        return Promise.resolve({
            streams: [
                {
                    url: item.url,
                    title: "⛰️ Sledovat Live (HLS)",
                    behaviorHints: {
                        notWebReady: true, // Klíčové pro Windows
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
                    <h1>🏔️ CZ/SK Hory Live</h1>
                    <p>Webkamery z Tater a sjezdovek (Direct HLS).</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #2ecc71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       NAINSTALOVAT
                    </a>
                </body>
            </html>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};