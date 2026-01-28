const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
    id: 'org.cz.manual.linker',
    version: '2.0.0',
    name: 'Můj Linker (HLS Test)',
    description: 'Test HLS linku pro Stranger Things',
    resources: ['stream'], 
    types: ['movie', 'series'], 
    idPrefixes: ['tt'] 
};

// --- DATABÁZE VAŠICH ODKAZŮ ---
const MOJE_DATABAZE = {
    // Stranger Things (tt4574334), Série 1, Díl 1
    // Formát ID ve Stremiu je: "ttIMDB:série:díl"
    'tt4574334:1:1': 'https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0'
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(({ type, id }) => {
    // Stremio se ptá třeba na "tt4574334:1:1"
    const mujOdkaz = MOJE_DATABAZE[id];

    if (mujOdkaz) {
        return Promise.resolve({
            streams: [
                {
                    url: mujOdkaz,
                    title: "🚀 VIP Stream (Dočasný)",
                    behaviorHints: {
                        notWebReady: true, // Nutné pro HLS na Windows
                        bingeGroup: "manual"
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
        res.end(`<h1>Linker v2.0</h1><a href="stremio://${req.headers.host}/manifest.json">AKTIVOVAT</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};