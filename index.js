const { addonBuilder } = require('stremio-addon-sdk');

// Zde definujeme ten dlouhý odkaz, aby byl kód přehledný
// Pozor: Odkaz musí být v uvozovkách a na jednom řádku!
const URL_STRANGER = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

const manifest = {
    id: 'org.cz.manual.linker',
    version: '2.0.1', // Oprava verze
    name: 'Můj Linker Fix',
    description: 'Test Stranger Things',
    resources: ['stream'], 
    types: ['movie', 'series'], 
    idPrefixes: ['tt'] 
};

// Mapování ID na Odkaz
const MOJE_DATABAZE = {
    // Stranger Things (S01E01)
    'tt4574334:1:1': URL_STRANGER
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(({ type, id }) => {
    // Pokud najdeme ID v databázi, vrátíme stream
    if (MOJE_DATABAZE[id]) {
        return Promise.resolve({
            streams: [
                {
                    url: MOJE_DATABAZE[id],
                    title: "🚀 VIP Stream (Manual)",
                    behaviorHints: {
                        notWebReady: true,
                        bingeGroup: "manual"
                    }
                }
            ]
        });
    }
    return Promise.resolve({ streams: [] });
});

// Router pro Vercel
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<h1>Linker v2.0.1 OK</h1><a href="stremio://${req.headers.host}/manifest.json">Instalovat</a>`);
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};