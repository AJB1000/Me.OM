// === git04 ===
// --- Parse URL parameters ---
const params = new URLSearchParams(window.location.search);
let lon = params.get('lon');
let lat = params.get('lat');
const zoom = params.get('zoom');

// --- Extra parameters ---
const extras = {};
for (const [key, val] of params.entries()) {
    if (!['lon', 'lat', 'zoom'].includes(key)) extras[key] = val;
}
console.log(extras, extras['ref:refuges.info'])

// --- Update static fields immediately ---
const lonT = lon >= 0 ? Math.round(lon * 10000) / 10000 + 'E' : lon < 0 ? Math.round(lon * 10000) / 10000 + 'W' : '?'
const latT = lat >= 0 ? Math.round(lat * 10000) / 10000 + 'N' : lat < 0 ? Math.round(lat * 10000) / 10000 + 'S' : '?'

document.getElementById('lon').textContent = lonT
document.getElementById('lat').textContent = latT

// --- Build links (base) ---
const linkList = document.getElementById('linkList');

const buildLinks = (locality = null, offline = false) => {
    const disable = offline ? 'disabled' : '';
    const loc = locality ? encodeURIComponent(locality) : '';
    // let refugeUrl = ""
    if ('ref:refuges.info' in extras) {
        const refugeInfoUrl = `<a class="${disable}" href="https://www.refuges.info/point/${extras['ref:refuges.info']}">Refuges-info</a>`
        delete extras['ref:refuges.info']
    }
    if ('ref:campwild.org' in extras) {
        const campwildUrl = `<a class="${disable}" href="https://map.campwild.org/places/${extras['ref:campwild.org']}">Refuges Campwild</a>`
        delete extras['ref:campwild.org']
    }
    let refugesUrl = ""
    if ('ref:refuges.info' in extras && 'ref:campwild.org' in extras) {
        refugesUrl = `<tr><td>${refugeInfoUrl}</td><td>${campwildUrl}</td></tr>`
    } else if ('ref:refuges.info' in extras) {
        refugesUrl = `<tr><td>${refugeInfoUrl}</td><td></td></tr>`
    } else if ('ref:campwild.org' in extras) {
        refugesUrl = `<tr><td>${campwildUrl}</td><td></td></tr>`
    }

    let wikidataUrl = ""
    if ('wikidata' in extras) {
        wikidataUrl = `<a class="${disable}" href="https://https://www.wikidata.org/wiki/${extras['wikidata']}">Wikidata</a>`
        delete extras['wikidata']
    }

    const day = new Date()
    const dayf = day.toISOString().split('T')[0]
    //  ajout de 1 jour à day
    day.setDate(day.getDate() + 1);
    const tomorrowf = day.toISOString().split('T')[0]

    linkList.innerHTML = `
    <tr><td><a class="${disable}" href="https://www.google.com/maps/place/@${lat},${lon},14z">Google Maps</a></td>
    <td><a class="${disable}" href="https://www.komoot.com/fr-fr/plan/@${lat},${lon},16z?sport=hike">Komoot</a></td></tr>
    <tr><td><a class="${disable}" href="https://fr.wikipedia.org/wiki/Sp%C3%A9cial:Nearby#/coord/${lat},${lon}">Wikipedia proches</a></td>
    <td>${wikidataUrl}</td></tr>
    <tr><td><a class="${disable}" href="https://www.peakfinder.com/?lat=${lat}&lng=${lon}">Sommets proches</a></td>
    <td><a class="${disable}" href="https://www.meteoblue.com/fr/meteo/semaine/${latT}${lonT}">Météo 7 jours</a></td></tr>
    ${refugesUrl}
    <tr><td><a class="${disable}" href="https://www.rome2rio.com/fr/map/${loc}">Transports</a></td>
    <td><a class="${disable}" href="https://www.booking.com/searchresults.fr.html?ss=${loc}&group_adults=2&group_children=0&no_rooms=1&checkin=${dayf}&checkout=${tomorrowf}">Hébergements</a></td></tr>
  `;
};


// --- Build parameter table ---
const table = document.getElementById('paramTable');
if (Object.keys(extras).length === 0) {
    table.innerHTML = '<tr><td>Aucun paramètre additionnel</td></tr>';
} else {
    table.innerHTML = `
    <tr><th>Attributs</th><th>Valeur</th></tr>
    ${Object.entries(extras)
            .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
            .join('')}
  `;
}

// --- Detect offline mode ---
const offline = !navigator.onLine;
const status = document.getElementById('status');
if (offline) {
    buildLinks(null, true);
    document.getElementById('locality').textContent = 'Localité indisponible (offline)';
} else {
    buildLinks();
    getLocalityGeoNames(lat, lon)
        .then(locality => {
            if (!locality) locality = 'Localité inconnue';
            document.getElementById('locality').textContent = locality;
            buildLinks(locality, false);
        })
        .catch(err => {
            console.error('Erreur getLocalityGeoNames', err);
            document.getElementById('locality').textContent = 'Localité inconnue';
        });
}

// --- Register Service Worker ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service worker enregistré', reg.scope))
        .catch(err => console.error('Erreur SW:', err));
}

// === GeoNames (Nominatim fallback) ===
async function getLocalityGeoNames(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'oruxmaps-pwa-demo' } });
        const data = await resp.json();
        if (data.address && (data.address.village || data.address.town || data.address.city)) {
            return data.address.village || data.address.town || data.address.city;
        } else if (data.display_name) {
            return data.display_name.split(',')[0];
        } else {
            return 'Localité inconnue';
        }
    } catch (err) {
        console.warn('Erreur avec Nominatim :', err);
        return 'Inconnue (offline ?)';
    }
}
