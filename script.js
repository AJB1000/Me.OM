// Script à placer dans votre index.html ou fichier JS séparé

document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM chargé, URL complète:', window.location.href);

    // Récupérer les paramètres URL
    let p = new URLSearchParams(window.location.search);
    p = Object.fromEntries(p.entries());
    const connexion = document.getElementById('connexion');
    const links = document.getElementById('links');
    const infoDiv = document.getElementById('info');

    // Debug détaillé
    console.log('Paramètres URL:', p);
    console.log('Nombre de paramètres:', Object.keys(p).length);

    connexion.innerHTML = `<p>Réseau ${navigator.onLine ? '🟢' : '🔴'}</p>`

    // Afficher les informations
    if (infoDiv) {
        if (Object.keys(p).length > 0) {
            infoDiv.innerHTML = `
                <h2>${p.nom || 'Lieu inconnu'}</h2>
                <p><strong>Échelle :</strong> 1:${p.scale || 'N/A'}</p>
                <p><strong>Coordonnées :</strong> ${p.lat || 'N/A'}, ${p.lon || 'N/A'}</p>
                
            `;

            // Debug dans la console (alert ne fonctionne pas toujours dans les PWA)
            console.log('Scale:', p.scale);

        } else {
            infoDiv.innerHTML = `
                <h2>Aucun paramètre</h2>
                <p>Aucune donnée de localisation fournie.</p>
            `;
            console.warn('Aucun paramètre URL trouvé');
        }
    } else {
        console.error('Element #info non trouvé dans le DOM');
    }

    // Vérifier le statut du service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            console.log('Service Worker actif:', registration.active);
        });
    }

    // Écouter les changements de connexion
    window.addEventListener('online', () => {
        console.log('Connexion rétablie');
        updateConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
        console.log('Connexion perdue');
        updateConnectionStatus(false);
    });
});

// Mettre à jour le statut de connexion dans l'interface
function updateConnectionStatus(isOnline) {
    if (connexion) {
        connexion.innerHTML = `<strong>Réseau:</strong> ${isOnline ? '🟢' : '🔴'}`;
    }
}

// Forcer le rechargement des paramètres (utile pour le debug)
function reloadParams() {
    console.log('Rechargement des paramètres...');
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
}

// Debug: Exposer la fonction dans la console pour tests
window.debugParams = reloadParams;

