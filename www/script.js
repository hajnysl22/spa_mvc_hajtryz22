// Funkce pro zobrazeni prislusne sekce
function zobrazSekci(idSekce) {
    // Skryjeme vsechny sekce
    let sekce = document.querySelectorAll('.sekce');
    sekce.forEach(function(el) {
        el.style.display = 'none';
    });
    // Zobrazime vybranou sekci
    document.getElementById(idSekce).style.display = 'block';
}

// Funkce pro aktualizaci navigace podle toho, zda je uzivatel prihlaseny
function aktualizujNavigaci(prihlasen) {
    document.getElementById('btnPrihlaseni').style.display = prihlasen ? 'none' : 'inline-block';
    document.getElementById('btnRegistrace').style.display = prihlasen ? 'none' : 'inline-block';
    document.getElementById('btnOdhlaseni').style.display = prihlasen ? 'inline-block' : 'none';
    document.getElementById('btnNovyPrispevek').style.display = prihlasen ? 'inline-block' : 'none';
    document.getElementById('btnMujProfil').style.display = prihlasen ? 'inline-block' : 'none';
}

// Funkce pro nacteni vsech prispevku
function nactiVsechnyPrispevky() {
    fetch('/api/prispevky')
    .then(response => response.json())
    .then(data => {
        let vypis = document.getElementById('vypisPrispevku');
        vypis.innerHTML = '';
        if (data.prispevky && data.prispevky.length > 0) {
            data.prispevky.forEach(function(p) {
                let div = document.createElement('div');
                div.className = 'prispevek';
                div.textContent = p.obsah + ' (' + new Date(p.cas).toLocaleString() + ')';
                vypis.appendChild(div);
            });
        } else {
            vypis.textContent = 'Zadne prispevky';
        }
    });
}

// Funkce pro nacteni prispevku prihlaseneho uzivatele (profil)
function nactiMujProfil() {
    fetch('/api/profil')
    .then(response => {
        if (response.status === 401) {
            return { chyba: "Uzivatel neni prihlaseny" };
        }
        return response.json();
    })
    .then(data => {
        let vypis = document.getElementById('vypisMujichPrispevku');
        vypis.innerHTML = '';
        if (data.prispevky && data.prispevky.length > 0) {
            data.prispevky.forEach(function(p) {
                let div = document.createElement('div');
                div.className = 'prispevek';
                div.textContent = p.obsah + ' (' + new Date(p.cas).toLocaleString() + ')';
                vypis.appendChild(div);
            });
        } else {
            vypis.textContent = 'Zadne prispevky';
        }
    });
}

// Prirazeni udalosti k tlacitim v navigaci
document.getElementById('btnRegistrace').addEventListener('click', function() {
    zobrazSekci('sekceRegistrace');
});

document.getElementById('btnPrihlaseni').addEventListener('click', function() {
    zobrazSekci('sekcePrihlaseni');
});

document.getElementById('btnOdhlaseni').addEventListener('click', function() {
    fetch('/api/odhlaseni')
    .then(response => response.json())
    .then(data => {
        alert(data.zprava);
        aktualizujNavigaci(false);
        zobrazSekci('sekceVsechnyPrispevky');
    });
});

document.getElementById('btnNovyPrispevek').addEventListener('click', function() {
    zobrazSekci('sekceNovyPrispevek');
});

document.getElementById('btnVsechnyPrispevky').addEventListener('click', function() {
    zobrazSekci('sekceVsechnyPrispevky');
    nactiVsechnyPrispevky();
});

document.getElementById('btnMujProfil').addEventListener('click', function() {
    zobrazSekci('sekceMujProfil');
    nactiMujProfil();
});

// Obsluha formulare pro registraci
document.getElementById('formRegistrace').addEventListener('submit', function(e) {
    e.preventDefault();
    const jmeno = document.getElementById('regJmeno').value;
    const heslo = document.getElementById('regHeslo').value;
    fetch('/api/registrace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jmeno: jmeno, heslo: heslo })
    })
    .then(response => response.json())
    .then(data => {
        let zprava = data.zprava ? data.zprava : data.chyba;
        document.getElementById('regZprava').textContent = zprava;
    });
});

// Obsluha formulare pro prihlaseni
document.getElementById('formPrihlaseni').addEventListener('submit', function(e) {
    e.preventDefault();
    const jmeno = document.getElementById('loginJmeno').value;
    const heslo = document.getElementById('loginHeslo').value;
    fetch('/api/prihlaseni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jmeno: jmeno, heslo: heslo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.zprava) {
            document.getElementById('loginZprava').textContent = data.zprava;
            aktualizujNavigaci(true);
            zobrazSekci('sekceVsechnyPrispevky');
            nactiVsechnyPrispevky();
        } else {
            document.getElementById('loginZprava').textContent = data.chyba;
        }
    });
});

// Obsluha formulare pro pridani noveho prispevku
document.getElementById('formNovyPrispevek').addEventListener('submit', function(e) {
    e.preventDefault();
    const obsah = document.getElementById('prispevekObsah').value;
    fetch('/api/prispevky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obsah: obsah })
    })
    .then(response => response.json())
    .then(data => {
        let zprava = data.zprava ? data.zprava : data.chyba;
        document.getElementById('novyPrispevekZprava').textContent = zprava;
        if (data.zprava) {
            // Vymazeme formular
            document.getElementById('prispevekObsah').value = '';
            // Obnovime zobrazeni prispevku v profilu
            nactiMujProfil();
        }
    });
});

// Pri nacteni stranky zobrazime vsechny prispevky a nastavime navigaci
window.addEventListener('load', function() {
    // Predpokladame, ze uzivatel neni prihlaseny
    aktualizujNavigaci(false);
    zobrazSekci('sekceVsechnyPrispevky');
    nactiVsechnyPrispevky();
});
