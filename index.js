const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.nasa.docs',
    version: '4.0.0', // Nová verze
    name: 'Vesmírné Dokumenty',
    description: 'Dokumenty a 4K záběry z NASA (High Speed)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'nasa_docs',
            name: 'Vesmír & Věda'
        }
    ],
    idPrefixes: ['nasa_']
};

const VIDEOS = [
    {
        id: 'nasa_sun',
        type: 'movie',
        name: '☀️ Thermonuclear Art (Slunce 4K)',
        poster: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001435/GSFC_20171208_Archive_e001435~orig.jpg',
        description: '30 minut dechberoucích záběrů Slunce ve 4K rozlišení. Relaxační hudba. (Top kvalita)',
        // Oficiální NASA server (velmi rychlý)
        url: 'https://images-assets.nasa.gov/video/GSFC_20151101_SDO_4k/GSFC_20151101_SDO_4k~orig.mp4'
    },
    {
        id: 'nasa_apollo11',
        type: 'movie',
        name: '🚀 Apollo 11: Highlights',
        poster: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~orig.jpg',
        description: 'Původní restaurované záběry z přistání na Měsíci v roce 1969.',
        url: 'https://images-assets.nasa.gov/video/Apollo%2011%20Overview/Apollo%2011%20Overview~orig.mp4'
    },
    {
        id: 'nasa_moon',
        type: 'movie',
        name: '🌑 Tour of the Moon (4K)',
        poster: 'https://images-assets.nasa.gov/image/PIA13517/PIA13517~orig.jpg',
        description: 'Detailní prohlídka povrchu Měsíce z dat sondy LRO.',
        url: 'https://images-assets.nasa.gov/video/LRO_Tour_of_the_Moon_4k/LRO_Tour_of_the_Moon_4k~orig.mp4'
    },
    {
        id: 'nasa_blackhole',
        type: 'movie',
        name: '🕳️ Simulace Černé díry',
        poster: 'https://images-assets.nasa.gov/image/PIA23408/PIA23408~orig.jpg',
        description: 'Vizualizace černé díry a jejího akrečního disku.',
        url: 'https://images-assets.nasa.gov/video/Black_Hole_Accretion_Disk_Sim_1080p60/Black_Hole_Accretion_Disk_Sim_1080p60~orig.mp4'
    },
    {
        id: 'nasa_aurora',
        type: 'movie',
        name: '🌌 Polární záře (Timelapse)',
        poster: 'https://images-assets.nasa.gov/image/iss052e007937/iss052e007937~orig.jpg',
        description: 'Polární záře z pohledu Mezinárodní vesmírné stanice (ISS).',
        url: 'https://images-assets.nasa.gov/video/UHD_Aurora_Timelapse/UHD_Aurora_Timelapse~orig.mp4'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'nasa_docs') {
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
                    title: "▶️ Přehrát (NASA Server)",
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
        res.end(`<h1>Vesmírné Dokumenty v4.0</h1><a href="stremio://${req.headers.host}/manifest.json">NAINSTALOVAT</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};