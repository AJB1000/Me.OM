// === git04 ===
// --- Parse URL parameters ---
const params = new URLSearchParams(window.location.search);
let lon = params.get('lon').trim()
let lat = params.get('lat').trim()
const zoom = params.get('zoom');

const day = new Date()
const dayf = day.toISOString().split('T')[0]
day.setDate(day.getDate() + 1)     //  ajout de 1 jour à day
const tomorrowf = day.toISOString().split('T')[0]

// --- Extra parameters ---
const extras = {};
for (const [key, val] of params.entries()) {
    if (!['lon', 'lat', 'zoom'].includes(key)) extras[key] = val;
}

// --- Update static fields immediately ---
let lonT = Math.abs(Math.round(lon * 1000) / 1000)
let latT = Math.abs(Math.round(lat * 1000) / 1000)
document.getElementById('lon').textContent = (lon >= 0) ? lonT + 'E' : lonT + 'W'
document.getElementById('lat').textContent = (lat >= 0) ? latT + 'N' : latT + 'S'

buildOsmTable(extras)
buildLinksTable()

// --- Build OSM parameter table ---
function buildOsmTable(extras) {
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
}

// --- Création des liens pour la table de liens
async function buildLinksTable() {
    // --- Detect offline mode ---
    // si la valeur retournée par navigator.connection.effectiveType n'est pas 3g minimum on passe offline
    lanOK = ['3g', '4g', '5g']
    const online = (navigator.onLine && lanOK.includes(navigator.connection.effectiveType))
    // const offline = !navigator.onLine;
    // const status = document.getElementById('status');
    if (!online) {
        showLinks({ 'carte0': null, 'carte1': null, 'divers0': null, 'divers1': null, 'wiki0': null, 'wiki1': null, 'wiki2': null, 'wiki3': null, 'extras0': null, 'extras1': null, 'transheb0': null, 'transheb1': null })
        document.getElementById('locality').textContent = 'Localité indisponible (offline)';
    } else {
        // Etape 1 uniquement les liens avec lon/lat car aucune recherche, affichage immediat
        showLinks({ 'carte0': `https://www.google.com/maps/place/@${lat},${lon},14z`, 'carte1': `https://www.komoot.com/fr-fr/plan/@${lat},${lon},16z?sport=hike`, 'divers0': `https://www.peakfinder.com/?lat=${lat}&lng=${lon}`, 'divers1': `https://www.meteoblue.com/fr/meteo/semaine/${latT}N${lonT}E`, 'wiki1': `https://fr.wikipedia.org/wiki/Sp%C3%A9cial:Nearby#/coord/${lat},${lon}` })
        //  Etape 2 : liens dépendant du nom de la localité
        getLocalityGeoNames(lat, lon)
            .then(locality => {
                if (locality != "Localité inconnue") {
                    document.getElementById('locality').textContent = locality;
                    showLinks({ 'transheb0': `https://www.rome2rio.com/fr/map/${locality}`, 'transheb1': `https://www.booking.com/searchresults.fr.html?ss=${locality}&group_adults=2&group_children=0&no_rooms=1&checkin=${dayf}&checkout=${tomorrowf}` })
                } else {
                    document.getElementById('locality').textContent = locality
                    showLinks({ 'transheb0': null, 'transheb1': null })
                }
            })
            .catch(err => {
                console.error('Erreur getLocalityGeoNames', err);
                document.getElementById('locality').textContent = 'Localité inconnue';
                showLinks({ 'transheb0': null, 'transheb1': null })
            });
        // Etape 3 : liens wiki
        getWikis(lat, lon, extras).then(data => {
            showLinks({ 'wiki0': data[0], 'wiki2': data[1], 'wiki3': data[2] })
        })
        // Etape 4 : liens divers
        getExtras(extras).then(data => {
            showLinks({ 'extras0': data[0], 'extras1': data[1] })
        })
    }
}
function showLinks(links) {
    for (const [key, value] of Object.entries(links)) {
        const el = document.getElementById(key)
        if (value != null) {
            el.href = value
            el.className = ''
        } else {
            el.href = '#'
            el.className = 'disabled'
        }
    }
}
// === GeoNames (Nominatim fallback) ===
async function getLocalityGeoNames(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        // const resp = await fetch(url, { headers: { 'User-Agent': 'oruxmaps-pwa-demo' } });
        const data = await (await fetch(url, { headers: { 'User-Agent': 'oruxmaps-pwa-demo' } })).json();
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
// --- Création des liens à partir de wikidata ---
async function getWikis(lat, lon, extras) {
    let qid = null
    if ('wikidata' in extras) {
        qid = extras['wikidata']
    } else {
        //  Etape A : on recherche l'identifiant wikidata le plus proche (limi=1) à 1000m à la ronde
        const urlGeoSearch = `https://www.wikidata.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gslimit=1&format=json&prop=pageprops&gsradius=1000&origin=*`;
        let data = await (await fetch(urlGeoSearch)).json()
        console.log((data.query.geosearch[0] != undefined) ? data.query.geosearch[0].title : 'null')
        // Le titre de la page MédiaWiki est le nom de l'entité
        qid = (data.query.geosearch[0] != undefined) ? data.query.geosearch[0].title : null
    }
    try {
        if (qid != null) {
            // Étape B : recherche des données wikidata pour l'identifiant trouvé
            const urlWikiSearch = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims|sitelinks&languages=fr&sitefilter=frwiki|dewiki|commonswiki&format=json&origin=*`;
            data = await (await fetch(urlWikiSearch)).json()
            const googleSearch = data.entities[qid].claims['P646'] || false
            const commons = data.entities[qid].sitelinks.commonswiki || false
            const wikipedia = data.entities[qid].sitelinks.frwiki || data.entities[qid].sitelinks.dewiki || false
            // Etape C constructuion des Url
            if (googleSearch || commons || wikipedia) {
                let wikiurl = []
                const wiki = (wikipedia.site == 'frwiki') ? ['fr', wikipedia.title] : (wikipedia.site == 'dewiki') ? ['de', wikipedia.title] : null
                wikiurl.push((wiki) ? `https://${wiki[0]}.wikipedia.org/wiki/${wiki[1]}` : null)
                wikiurl.push((commons) ? `https://commons.wikimedia.org/wiki/${commons.title}` : null)
                wikiurl.push((googleSearch) ? `https://www.google.com/search?kgmid=${googleSearch[0].mainsnak.datavalue.value}` : null)
                return wikiurl
            } else {
                // return ["Aucune entité trouvée près de ces coordonnées."]
                return [null, null, null]
            }
        } else {
            console.log("Aucune entité trouvée près de ces coordonnées.");
        }
    } catch (err) {
        console.warn('Erreur avec wikidata :', err);
    }
}
// --- Création des liens à partir des attributs OSM ---
async function getExtras(extras) {
    let refugesUrl = []
    refugesUrl.push(('ref:refuges.info' in extras) ? `https://www.refuges.info/point/${extras['ref:refuges.info']}` : null)
    refugesUrl.push(('ref:campwild.org' in extras) ? `https://map.campwild.org/places/${extras['ref:campwild.org']}` : null)
    return refugesUrl
}
// --- Register Service Worker ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service worker enregistré', reg.scope))
        .catch(err => console.error('Erreur SW:', err));
}

