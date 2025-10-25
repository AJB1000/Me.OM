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

    // Afficher les informations
    if (infoDiv) {
        if (Object.keys(p).length > 0) {
            infoDiv.innerHTML = `
                <h2>${p.nom || 'Lieu inconnu'}</h2>
                <p><strong>Échelle :</strong> 1:${p.scale || 'N/A'}</p>
                <p><strong>Coordonnées :</strong> ${p.lat || 'N/A'}, ${p.lon || 'N/A'}</p>
                <p><strong>Mode :</strong> ${navigator.onLine ? '🟢 En ligne' : '🔴 Hors ligne'}</p>
            `;

            // Debug dans la console (alert ne fonctionne pas toujours dans les PWA)
            console.log('Scale:', p.scale);

            // Afficher une notification visuelle au lieu d'alert
            // showNotification(`Échelle: ${p.scale || 'N/A'}`, 'info');
        } else {
            infoDiv.innerHTML = `
                <h2>Aucun paramètre</h2>
                <p>Aucune donnée de localisation fournie.</p>
                <p><strong>Mode :</strong> ${navigator.onLine ? '🟢 En ligne' : '🔴 Hors ligne'}</p>
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

// Fonction pour afficher une notification visuelle (remplace alert)
// function showNotification(message, type = 'info') {
//     // Créer un élément de notification
//     const notification = document.createElement('div');
//     notification.style.cssText = `
//         position: fixed;
//         top: 20px;
//         right: 20px;
//         padding: 15px 20px;
//         background: ${type === 'info' ? '#3498db' : '#e74c3c'};
//         color: white;
//         border-radius: 5px;
//         box-shadow: 0 4px 6px rgba(0,0,0,0.3);
//         z-index: 10000;
//         font-family: Arial, sans-serif;
//         max-width: 300px;
//         animation: slideIn 0.3s ease-out;
//     `;
//     notification.textContent = message;

//     // Ajouter l'animation CSS
//     const style = document.createElement('style');
//     style.textContent = `
//         @keyframes slideIn {
//             from {
//                 transform: translateX(400px);
//                 opacity: 0;
//             }
//             to {
//                 transform: translateX(0);
//                 opacity: 1;
//             }
//         }
//     `;
//     document.head.appendChild(style);

//     document.body.appendChild(notification);

//     // Supprimer après 3 secondes
//     setTimeout(() => {
//         notification.style.animation = 'slideIn 0.3s ease-out reverse';
//         setTimeout(() => notification.remove(), 300);
//     }, 3000);
// }

// Mettre à jour le statut de connexion dans l'interface
function updateConnectionStatus(isOnline) {
    if (connexion) {
        connexion.innerHTML = `<strong>Mode :</strong> ${isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}`;
    }

    // showNotification(
    //     isOnline ? 'Connexion rétablie' : 'Mode hors ligne',
    //     isOnline ? 'info' : 'warning'
    // );
}

// Forcer le rechargement des paramètres (utile pour le debug)
function reloadParams() {
    console.log('Rechargement des paramètres...');
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
}

// Debug: Exposer la fonction dans la console pour tests
window.debugParams = reloadParams;

