const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.relax.slowtv',
    version: '1.0.0',
    name: 'Relax & Slow TV',
    description: 'Krb, Akvária, Příroda a Vlaky (Relaxační kulisa)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'], 
    catalogs: [
        {
            type: 'movie',
            id: 'relax_catalog',
            name: '🍃 Relaxační Zóna'
        }
    ],
    idPrefixes: ['relax_']
};

const VIDEOS = [
    // --- OHEŇ & DOMOV ---
    {
        id: 'relax_fire',
        type: 'movie',
        name: '🔥 Praskající Krb (Loop)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Fireplace_breezeway_20090123.jpg/640px-Fireplace_breezeway_20090123.jpg',
        description: 'Detailní záběr na oheň v krbu. Perfektní pro zimní večery.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Fireplace-2.webm'
    },
    
    // --- VODA & OCEÁN ---
    {
        id: 'relax_aquarium',
        type: 'movie',
        name: '🐠 Korálový Útes (4K)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Eilat_Coral_Beach_Nature_Reserve_and_Conservation_area_-_underwater_14.jpg/640px-Eilat_Coral_Beach_Nature_Reserve_and_Conservation_area_-_underwater_14.jpg',
        description: 'Podmořský svět, ryby a korály. (Ultra HD)',
        url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Coral_Reef_in_4K.webm'
    },
    {
        id: 'relax_ocean',
        type: 'movie',
        name: '🌊 Divoký Oceán',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Waves_in_Pacifica_1.jpg/640px-Waves_in_Pacifica_1.jpg',
        description: 'Pohled na vlny narážející na pobřeží. Zvuk oceánu.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Waves_at_Pacifica.webm'
    },
    {
        id: 'relax_waterfall',
        type: 'movie',
        name: '💧 Lesní Vodopád',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Waterfall_in_the_forest.jpg/640px-Waterfall_in_the_forest.jpg',
        description: 'Klidný vodopád uprostřed zeleného lesa.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Waterfall_in_Video.webm'
    },

    // --- PŘÍRODA & KRAJINA ---
    {
        id: 'relax_patagonia',
        type: 'movie',
        name: '🏔️ Patagonie Timelapse',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Patagonia_landscape.jpg/640px-Patagonia_landscape.jpg',
        description: 'Dechberoucí časosběr z hor v Patagonii. Mraky, hory, jezera.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Patagonia_Timelapse.webm'
    },
    {
        id: 'relax_alps',
        type: 'movie',
        name: '🌲 Let nad Alpami',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Alps_from_air.jpg/640px-Alps_from_air.jpg',
        description: 'Letecké záběry zasněžených vrcholků Alp.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Aerial_View_of_the_Alps.webm'
    },
    {
        id: 'relax_jellyfish',
        type: 'movie',
        name: '🟣 Medúzy',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Jelly_cc11.jpg/640px-Jelly_cc11.jpg',
        description: 'Hypnotický pohyb medúz v tmavé vodě.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Jellyfish_in_Monterey_Aquarium.webm'
    },

    // --- VLAKY & CESTOVÁNÍ ---
    {
        id: 'relax_train_norway',
        type: 'movie',
        name: '🚂 Vlakem Norskem (Zima)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Bergensbanen_winter.jpg/640px-Bergensbanen_winter.jpg',
        description: 'Slavná trať Bergensbanen. Pohled z čela vlaku do zasněžené krajiny.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Bergensbanen_Finse_-_Myrdal.webm'
    },
    {
        id: 'relax_tram_prague',
        type: 'movie',
        name: '🚋 Tramvaj v Praze',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/T3R.P_ev._%C4%8D._8526_na_lince_15.jpg/640px-T3R.P_ev._%C4%8D._8526_na_lince_15.jpg',
        description: 'Průjezd Prahou (Modřany). Pohled řidiče.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Praha%2C_S%C3%ADdli%C5%A1t%C4%9B_Mod%C5%99any_-_Levsk%C3%A9ho%2C_j%C3%ADzda_tramvaj%C3%AD.webm'
    },

    // --- VESMÍR ---
    {
        id: 'relax_earth',
        type: 'movie',
        name: '🌍 Planeta Země (ISS)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bg/ISS-42_Flying_over_the_Mediterranean_Sea_and_East_Africa.jpg/640px-ISS-42_Flying_over_the_Mediterranean_Sea_and_East_Africa.jpg',
        description: 'Přelet Mezinárodní vesmírné stanice nad noční Zemí.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/ISS_flyover_of_the_Earth.webm'
    },
    {
        id: 'relax_moon',
        type: 'movie',
        name: '🌑 Měsíc v detailu',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/630px-FullMoon2010.jpg',
        description: 'Průlet sondy nad povrchem Měsíce.',
        url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flyover_of_the_Moon.webm'
    },

    // --- TECH DEMO ---
    {
        id: 'relax_bunny',
        type: 'movie',
        name: '🐰 Big Buck Bunny',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        description: 'Klasika pro kontrolu funkčnosti.',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'relax_catalog') {
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
                    title: "▶️ Přehrát Relax (Direct)",
                    behaviorHints: {
                        notWebReady: true, // Tohle je klíč k funkčnosti na Windows
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
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f0f3f4;">
                    <h1>🍃 Relax & Slow TV</h1>
                    <p>Krb, Hory, Oceán, Vlaky.</p>
                    <a href="stremio://${req.headers.host}/manifest.json" 
                       style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">
                       NAINSTALOVAT DO STREMIA
                    </a>
                </body>
            </html>
        `);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};