const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jsondb = require('simple-json-db'); // Pouzivame pro praci s JSON databazi

// Vytvorime instanci Express aplikace
const app = express();

// Middleware pro parsovani JSON v telu pozadavku
app.use(express.json());

// Nastaveni session middleware
app.use(session({
    secret: require('dotenv').config().parsed.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));

// Slouzeni statickych souboru z adresare www
app.use(express.static('./www'));

// Inicializace databazi pro uzivatele a prispevky (databaze jsou ulozeny v oddelenych souborech)
const dbUzivatele = new jsondb('./data/uzivatele.json');
const dbPrispevky = new jsondb('./data/prispevky.json');

// Inicializace dat, pokud nejsou v databazi
if (!dbUzivatele.has("uzivatele")) {
    dbUzivatele.set("uzivatele", []);
    dbUzivatele.set("counterUzivatele", 1);
}

if (!dbPrispevky.has("prispevky")) {
    dbPrispevky.set("prispevky", []);
    dbPrispevky.set("counterPrispevky", 1);
}

// Pomocna funkce pro nalezeni uzivatele dle jmena
function najdiUzivatele(jmeno) {
    const uzivatele = dbUzivatele.get("uzivatele");
    return uzivatele.find(u => u.jmeno === jmeno);
}

// Endpoint pro registraci
app.post('/api/registrace', function(req, res) {
    // Ocekavame data: { jmeno: "uzivatel", heslo: "heslo" }
    const { jmeno, heslo } = req.body;
    
    // Overime, ze data byla zadana
    if (!jmeno || !heslo) {
        return res.status(400).json({ chyba: "Nedostatecna data" });
    }
    
    // Overime, zda jiz neexistuje uzivatel se stejnym jmenem
    if (najdiUzivatele(jmeno)) {
        return res.status(400).json({ chyba: "Uzivatel jiz existuje" });
    }
    
    // Hashneme heslo pomoci bcrypt (synchronne)
    const hashHesla = bcrypt.hashSync(heslo, 10);
    
    // Ziskame counter a vytvorime noveho uzivatele
    let counter = dbUzivatele.get("counterUzivatele");
    const novyUzivatel = {
        id: counter,
        jmeno: jmeno,
        hash_hesla: hashHesla
    };
    counter++; // zvysime counter
    dbUzivatele.set("counterUzivatele", counter);
    
    // Pridame noveho uzivatele do pole
    let uzivatele = dbUzivatele.get("uzivatele");
    uzivatele.push(novyUzivatel);
    dbUzivatele.set("uzivatele", uzivatele);
    
    // Vse probehlo v poradku
    return res.json({ zprava: "Registrace probehla uspesne" });
});

// Endpoint pro prihlaseni
app.post('/api/prihlaseni', function(req, res) {
    // Ocekavame data: { jmeno: "uzivatel", heslo: "heslo" }
    const { jmeno, heslo } = req.body;
    
    if (!jmeno || !heslo) {
        return res.status(400).json({ chyba: "Nedostatecna data" });
    }
    
    // Najdeme uzivatele
    const uzivatel = najdiUzivatele(jmeno);
    if (!uzivatel) {
        return res.status(400).json({ chyba: "Spatne prihlasovaci udaje" });
    }
    
    // Overime heslo (synchronne)
    if (!bcrypt.compareSync(heslo, uzivatel.hash_hesla)) {
        return res.status(400).json({ chyba: "Spatne prihlasovaci udaje" });
    }
    
    // Ulozime informace o uzivateli do session
    req.session.uzivatel = { id: uzivatel.id, jmeno: uzivatel.jmeno };
    return res.json({ zprava: "Prihlaseni uspesne" });
});

// Endpoint pro odhlaseni
app.get('/api/odhlaseni', function(req, res) {
    // Odstranime session
    req.session.destroy();
    return res.json({ zprava: "Odhlaseni uspesne" });
});

// Endpoint pro ziskani vsech prispevku (verejne)
app.get('/api/prispevky', function(req, res) {
    const prispevky = dbPrispevky.get("prispevky");
    return res.json({ prispevky: prispevky });
});

// Endpoint pro ziskani prispevku prihlaseneho uzivatele (profil)
app.get('/api/profil', function(req, res) {
    if (!req.session.uzivatel) {
        return res.status(401).json({ chyba: "Uzivatel neni prihlaseny" });
    }
    const idUzivatele = req.session.uzivatel.id;
    const prispevky = dbPrispevky.get("prispevky").filter(p => p.id_uzivatele === idUzivatele);
    return res.json({ prispevky: prispevky });
});

// Endpoint pro pridani noveho prispevku
app.post('/api/prispevky', function(req, res) {
    if (!req.session.uzivatel) {
        return res.status(401).json({ chyba: "Uzivatel neni prihlaseny" });
    }
    // Ocekavame data: { obsah: "Text prispevku" }
    const { obsah } = req.body;
    if (!obsah) {
        return res.status(400).json({ chyba: "Obsah prispevku nesmi byt prazdny" });
    }
    
    // Ziskame counter a vytvorime novy prispevek
    let counter = dbPrispevky.get("counterPrispevky");
    const novyPrispevek = {
        id: counter,
        id_uzivatele: req.session.uzivatel.id,
        obsah: obsah,
        cas: new Date().toISOString()
    };
    counter++;
    dbPrispevky.set("counterPrispevky", counter);
    
    // Pridame prispevek do pole
    let prispevky = dbPrispevky.get("prispevky");
    prispevky.push(novyPrispevek);
    dbPrispevky.set("prispevky", prispevky);
    
    return res.json({ zprava: "Prispevek pridan uspesne" });
});

module.exports = app;
