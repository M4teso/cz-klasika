// --- ZDE JE VÁŠ DLOUHÝ ODKAZ ---
const URL_STREAM = "https://be7713.rcr82.waw05.r66nv9ed.com/hls2/01/10370/c31ul1nrticy_x/index-v1-a1.m3u8?t=L8uKu7HWoC4QIiVoCUfjTkiazCXSlEVqJtNMA9A3RiQ&s=1769627005&e=10800&f=51854519&srv=1065&asn=57564&sp=5500&p=0";

module.exports = (req, res) => {
    // 1. Nastavíme hlavičky (CORS), aby Stremio mohlo číst data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    // 2. Pokud se Stremio ptá na Manifest (Instalace)
    if (req.url === '/manifest.json') {
        const manifest = {
            id: "org.cz.manual.hls",
            version: "1.0.0",
            name: "VIP Linker (No-SDK)",
            description: "Manuální stream bez závislostí",
            resources: ["stream"],
            types: ["movie", "series"],
            idPrefixes: ["tt"],
            catalogs: []
        };
        res.end(JSON.stringify(manifest));
        return;
    }

    // 3. Pokud se Stremio ptá na Stream
    // Očekáváme URL ve stylu /stream/series/tt4574334:1:1.json
    if (req.url.indexOf('/stream/') > -1) {
        
        // Dekódujeme URL (pro jistotu, kdyby tam byly znaky jako %3A)
        const currentUrl = decodeURIComponent(req.url);

        // Hledáme ID pro Stranger Things S01E01
        if (currentUrl.indexOf('tt4574334:1:1') > -1) {
            const streamResponse = {
                streams: [
                    {
                        url: URL_STREAM,
                        title: "🚀 VIP Stream (Direct)",
                        behaviorHints: {
                            notWebReady: true,
                            bingeGroup: "manual"
                        }
                    }
                ]
            };
            res.end(JSON.stringify(streamResponse));
            return;
        }

        // Pokud je to jiný film, vrátíme prázdno
        res.end(JSON.stringify({ streams: [] }));
        return;
    }

    // 4. Hlavní stránka (pro prohlížeč)
    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Addon bezi (Bez SDK)</h1><a href="stremio://${req.headers.host}/manifest.json">NAINSTALOVAT</a>`);
};