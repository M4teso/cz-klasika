const { addonBuilder } = require('stremio-addon-sdk');

// Odkaz na video
const STREAM_URL = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

const manifest = {
    id: 'org.cz.manual.linker',
    version: '2.0.2',
    name: 'Linker Fix',
    description: 'Manual Stream',
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt']
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(({ type, id }) => {
    // Stranger Things S01E01 = tt4574334:1:1
    if (id === 'tt4574334:1:1') {
        return Promise.resolve({
            streams: [
                {
                    url: STREAM_URL,
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

const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

module.exports = function (req, res) {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end('<h1>Linker v2.0.2 OK</h1><a href="/manifest.json">Install</a>');
        return;
    }
    router(req, res, function () { res.statusCode = 404; res.end(); });
};