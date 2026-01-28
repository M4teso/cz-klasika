const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

// --- 1. Konfigurace (Manifest) ---
const manifest = {
    id: 'org.cz.klasika',
    version: '1.0.0',
    name: 'Česká Filmová Klasika',
    description: 'Zlatý fond české kinematografie (Legálně z YouTube)',
    resources: ['catalog', 'meta', 'stream'], // Umíme seznam, detail i přehrát
    types: ['movie'],
    catalogs: [
        {
            type: 'movie',
            id: 'cz_klasika_catalog',
            name: 'České Legendy'
        }
    ],
    idPrefixes: ['cz_film_'] // Naše vlastní IDčka
};

// --- 2. Naše Databáze filmů ---
// Zde stačí přidávat další filmy. Klíčové je 'ytId' (kód za v= na YouTube).
const FILMY = [
    {
        id: 'cz_film_001',
        type: 'movie',
        name: 'Vynález zkázy',
        year: 1958,
        poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/7q2E2xgeiQuNKyVfYQsC8w6UPiC.jpg',
        description: 'Vynález zkázy je československý dobrodružný sci-fi film režiséra Karla Zemana. Vizuálně úchvatné dílo.',
        background: 'https://image.tmdb.org/t/p/original/m9t5XgKzF0UjD3m8hR2f6G3J3w8.jpg',
        ytId: 'C8zJ1XqYF9A' // ID videa na YouTube
    },
    {
        id: 'cz_film_002',
        type: 'movie',
        name: 'Ikarie XB 1',
        year: 1963,
        poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/p4xXqF9X8q8q8q8q8q8q8q8q8q8.jpg', // Placeholder, seženu lepší
        poster: 'https://image.tmdb.org/t/p/original/uY2g3o3g3g3g3g3g3g3g3g3g3g3.jpg', // Upravíme později
        poster: 'https://m.media-amazon.com/images/M/MV5BMmMwNTAwYzQtZjRkMy00Y2EwLWEyZTctOTFmMjFkNjE0YjUzXkEyXkFqcGdeQXVyMjQ0NzE0MQ@@._V1_.jpg',
        description: 'Legendární sci-fi, které inspirovalo i Kubricka. Posádka lodi Ikarie putuje k Alfa Centauri.',
        ytId: 'OsT7d6k-kGk'
    },
    {
        id: 'cz_film_003',
        type: 'movie',
        name: 'Baron Prášil',
        year: 1961,
        poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/2x1x1x1x1x1x1x1x1x1x1x1x1x1.jpg', 
        poster: 'https://m.media-amazon.com/images/M/MV5BNTIwMjk2OTYtMjY4Zi00NmI4LWE0YjMtMzQ5MzdhNTQ3Y2ExXkEyXkFqcGdeQXVyNjExODE1MDc@._V1_FMjpg_UX1000_.jpg',
        description: 'Fantastická dobrodružství Barona Prášila v podání Miloše Kopeckého. Další trikový klenot.',
        ytId: 'S-F0-1-G_1Q' // Smyšlené ID pro demo, nahradíme reálným, pokud tohle nebude sedět
    }
];

const builder = new addonBuilder(manifest);

// --- 3. Logika Addonu ---

// A) Handler pro Katalog (Zobrazí seznam v menu)
builder.defineCatalogHandler(({ type, id }) => {
    if (id === 'cz_klasika_catalog') {
        // Vrátíme jen základní info pro seznam (Metas)
        const metas = FILMY.map(film => ({
            id: film.id,
            type: film.type,
            name: film.name,
            poster: film.poster,
            description: film.description
        }));
        return Promise.resolve({ metas });
    }
    return Promise.resolve({ metas: [] });
});

// B) Handler pro Meta (Zobrazí detail filmu po kliknutí)
builder.defineMetaHandler(({ type, id }) => {
    const film = FILMY.find(f => f.id === id);
    if (film) {
        return Promise.resolve({ meta: film });
    }
    return Promise.resolve({ meta: {} });
});

// C) Handler pro Stream (Spustí video) - TO NEJDŮLEŽITĚJŠÍ
builder.defineStreamHandler(({ type, id }) => {
    const film = FILMY.find(f => f.id === id);
    
    if (film && film.ytId) {
        return Promise.resolve({
            streams: [
                {
                    ytId: film.ytId, // Tímto říkáme Stremiu: "Přehraj to přes YouTube engine"
                    title: "YouTube (Legální zdroj)",
                    behaviorHints: { notWebReady: false } // Optimalizace pro přehrávač
                }
            ]
        });
    }
    return Promise.resolve({ streams: [] });
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });