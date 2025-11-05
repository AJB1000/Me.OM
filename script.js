// === git04 ===
// --- Parse URL parameters ---
const params = new URLSearchParams(window.location.search);
let lon = params.get('lon').trim()
let lat = params.get('lat').trim()
const zoom = params.get('zoom');
console.log(lon, lat)

// --- Extra parameters ---
const extras = {};
for (const [key, val] of params.entries()) {
    if (!['lon', 'lat', 'zoom'].includes(key)) extras[key] = val;
}
var refugesUrl = ""

// --- Update static fields immediately ---
let lonT = Math.abs(Math.round(lon * 1000) / 1000)
let latT = Math.abs(Math.round(lat * 1000) / 1000)
document.getElementById('lon').textContent = (lon >= 0) ? lonT + 'E' : lonT + 'W'
document.getElementById('lat').textContent = (lat >= 0) ? latT + 'N' : latT + 'S'

// --- Build links (base) ---
const linkList = document.getElementById('linkList');

const buildLinks = (locality = null, offline = false) => {
    const disable = offline ? 'disabled' : '';
    const loc = locality ? encodeURIComponent(locality) : '';
    const extrasUrl = getExtrasUrl(extras, disable)

    const day = new Date()
    const dayf = day.toISOString().split('T')[0]
    day.setDate(day.getDate() + 1)     //  ajout de 1 jour à day
    const tomorrowf = day.toISOString().split('T')[0]

    linkList.innerHTML = `
    <tr><td><a class="${disable}" href="https://www.google.com/maps/place/@${lat},${lon},14z">Google Maps</a></td>
    <td><a class="${disable}" href="https://www.komoot.com/fr-fr/plan/@${lat},${lon},14z?sport=hike">Komoot</a></td></tr>
    <tr>${extrasUrl[0]}</tr>
    <tr><td><a class="${disable}" href="https://www.peakfinder.com/?lat=${lat}&lng=${lon}">Sommets proches</a></td>
    <td><a class="${disable}" href="https://www.meteoblue.com/fr/meteo/semaine/${-latT}&#44;${-lonT}">Météo 7 jours</a></td></tr>
    <tr>${extrasUrl[1]}</tr>
    <tr><td><a class="${disable}" href="https://www.rome2rio.com/fr/map/${loc}">Transports</a></td>
    <td><a class="${disable}" href="https://www.booking.com/searchresults.fr.html?ss=${loc}&group_adults=2&group_children=0&no_rooms=1&checkin=${dayf}&checkout=${tomorrowf}">Hébergements</a></td></tr>
  `;
};

// --- Build parameter table ---
const table = document.getElementById('paramTable');
if (Object.keys(extras).length === 0) {
    table.innerHTML = '<tr><td>Aucun paramètre additionnel</td></tr>';
} else {
    // Clés à exclure de l'affichage de la table
    const exclude = ['ref:refuges.info', 'ref:campwild.org', 'wikidata', 'wikipedia', 'nl'];
    // Filtrer les extras en supprimant les clés dans exclude
    const filtered = Object.fromEntries(
        // si l'array exclude ne contient pas la key => true et on garde key
        Object.entries(extras).filter(([key]) => !exclude.includes(key))
    );
    // on affiche filtered
    table.innerHTML = `
    <tr><th>Attributs</th><th>Valeur</th></tr>
    ${Object.entries(filtered)
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
    document.getElementById('linksTitle').textContent = 'Liens indisponibles (offline)';
} else {
    document.getElementById('linksTitle').textContent = 'Liens utiles';
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

function getExtrasUrl(extras, disable) {
    let refugesUrl = [], wikiUrl = []
    refugesUrl.push(('ref:refuges.info' in extras) ? `<a class="${disable}" href="https://www.refuges.info/point/${extras['ref:refuges.info']}">Refuges-info</a>` : null)
    refugesUrl.push(('ref:campwild.org' in extras) ? `<a class="${disable}" href="https://map.campwild.org/places/${extras['ref:campwild.org']}">Refuges Campwild</a>` : null)
    // filtrage suppression des null dans refugesUrl
    refugesUrl = refugesUrl.filter(el => el)
    if (refugesUrl.length >= 2) refugesUrl = `<td>${refugesUrl[0]}</td><td>${refugesUrl[1]}</td>`
    if (refugesUrl.length == 1) refugesUrl = `<td>${refugesUrl[0]}</td><td></td>`
    // construction du lien wikipedia dans osm: wikipedia=fr:.....=> fr.wikipedia.org/wiki/....
    if ('wikipedia' in extras) {
        const wikipedia = extras['wikipedia'].replace(/(.*):(.*)/gm, `$1.wikipedia.org/wiki/$2`)
        wikiUrl.push(`<a class="${disable}" href="https://${wikipedia}">Wikipedia</a>`)
    }
    wikiUrl.push(`<a class="${disable}" href="https://fr.wikipedia.org/wiki/Sp%C3%A9cial:Nearby#/coord/${lat},${lon}">Wikipedia proches</a > `)
    wikiUrl.push(('wikidata' in extras) ? `< a class= "${disable}" href = "https://https://www.wikidata.org/wiki/${extras['wikidata']}">Wikidata</a> ` : null)
    wikiUrl = wikiUrl.filter(el => el)
    if (wikiUrl.length >= 2) wikiUrl = `<td> ${wikiUrl[0]}</td><td>${wikiUrl[1]}</td>`
    if (wikiUrl.length == 1) wikiUrl = `<td> ${wikiUrl[0]}</td><td></td>`

    return [wikiUrl, refugesUrl]
}


