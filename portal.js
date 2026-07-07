// --- CONFIGURATION ET JEUX DE BASE ---
const DEFAULT_GAMES = [
    {
        id: "zombie_stadium",
        title: "Zombie Stadium",
        desc: "FPS 2D rétro-arcade. Shootez des ballons de foot sur les zombies pour survivre et trouvez le téléphone pour appeler les secours !",
        type: "js",
        src: "./zombie_stadium.html",
        difficulty: "★★☆ Difficile",
        diffClass: "easy" // cyan
    },
    {
        id: "scratch_paper_minecraft",
        title: "Paper Minecraft",
        desc: "L'adaptation légendaire de Minecraft en 2D sur Scratch par Griffpatch. Construisez, minez et survivez dans un monde infini !",
        type: "scratch",
        src: "10128407",
        difficulty: "★★★ Expert",
        diffClass: "hard" // pink
    },
    {
        id: "scratch_scratcharia",
        title: "Scratcharia",
        desc: "Le célèbre Terraria en 2D entièrement recréé sur Scratch. Explorez des grottes générées aléatoirement et combattez des boss !",
        type: "scratch",
        src: "12513470",
        difficulty: "★★☆ Moyen",
        diffClass: "normal" // yellow
    },
    {
        id: "scratch_geometry_dash_1",
        title: "Geometry Dash 1",
        desc: "Le jeu de rythme et de réflexes légendaire recréé sur Scratch par splatast0. Évitez les obstacles et terminez le niveau !",
        type: "scratch",
        src: "1351612590",
        difficulty: "★★☆ Moyen",
        diffClass: "normal" // yellow
    },
    {
        id: "scratch_esquive_crane_oeuf",
        title: "Esquive of Crane d'Oeuf",
        desc: "Un jeu d'esquive palpitant créé sur Scratch par AntoCampsEte. Évitez les obstacles et survivez le plus longtemps possible !",
        type: "scratch",
        src: "1351870577",
        difficulty: "★☆☆ Facile",
        diffClass: "easy" // cyan
    }
];

let customGames = [];

// --- FONCTIONS DE GESTION DU PORTAIL ---

// Charger les jeux depuis localStorage
function loadCustomGames() {
    try {
        const stored = localStorage.getItem('arcade_camp_custom_games');
        if (stored) {
            customGames = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Impossible de charger localStorage :", e);
        customGames = [];
    }
}

// Enregistrer les jeux dans localStorage
function saveCustomGames() {
    try {
        localStorage.setItem('arcade_camp_custom_games', JSON.stringify(customGames));
    } catch (e) {
        console.error("Impossible d'enregistrer dans localStorage :", e);
    }
}

// Extraire l'ID du projet Scratch depuis un lien ou un ID direct
function extractScratchId(input) {
    input = input.trim();
    // Regex pour détecter l'ID d'un lien Scratch : scratch.mit.edu/projects/12345678
    const regex = /\/projects\/(\d+)/;
    const match = input.match(regex);
    if (match && match[1]) {
        return match[1];
    }
    // Si c'est juste un nombre
    const digitsOnly = /^\d+$/;
    if (digitsOnly.test(input)) {
        return input;
    }
    return null;
}

// Rendu des cartes de jeux
function renderGamesCatalog() {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = ''; // Nettoyer
    
    // Combinaison des jeux par défaut et customisés
    const allGames = [...DEFAULT_GAMES, ...customGames];
    
    allGames.forEach(game => {
        const card = document.createElement('div');
        card.className = `game-card ${game.type === 'scratch' ? 'scratch-card' : 'js-card'}`;
        
        // Configurer la source du jeu dans les attributs de données
        card.setAttribute('data-game-type', game.type);
        card.setAttribute('data-src', game.src);
        card.setAttribute('data-title', game.title);
        
        // Aperçu de carte
        let previewHtml = '';
        if (game.id === 'zombie_stadium') {
            previewHtml = `
                <div class="card-preview">
                    <div class="preview-overlay">⚽ ZOMBIE STADIUM</div>
                </div>
            `;
        } else if (game.id === 'scratch_paper_minecraft') {
            previewHtml = `
                <div class="card-preview scratch-bg-1" style="background-image: url('https://uploads.scratch.mit.edu/projects/thumbnails/10128407.png')">
                    <div class="preview-overlay">📦 PAPER MINECRAFT</div>
                </div>
            `;
        } else if (game.id === 'scratch_scratcharia') {
            previewHtml = `
                <div class="card-preview scratch-bg-2" style="background-image: url('https://uploads.scratch.mit.edu/projects/thumbnails/12513470.png')">
                    <div class="preview-overlay">🌳 SCRATCHARIA</div>
                </div>
            `;
        } else if (game.id === 'scratch_geometry_dash_1') {
            previewHtml = `
                <div class="card-preview scratch-bg-3" style="background-image: url('https://uploads.scratch.mit.edu/projects/thumbnails/1351612590.png')">
                    <div class="preview-overlay">🔺 GEOMETRY DASH 1</div>
                </div>
            `;
        } else if (game.id === 'scratch_esquive_crane_oeuf') {
            previewHtml = `
                <div class="card-preview scratch-bg-4" style="background-image: url('https://uploads.scratch.mit.edu/projects/thumbnails/1351870577.png')">
                    <div class="preview-overlay">🥚 ESQUIVE CRANE D'OEUF</div>
                </div>
            `;
        } else {
            // Jeu personnalisé Scratch
            const thumbUrl = `https://uploads.scratch.mit.edu/projects/thumbnails/${game.src}.png`;
            previewHtml = `
                <div class="card-preview scratch-bg-custom" style="background-image: url('${thumbUrl}')">
                    <div class="preview-overlay">🕹️ PROJET CUSTOM</div>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="card-badge ${game.type === 'scratch' ? 'tag-scratch' : 'tag-js'}">${game.type.toUpperCase()}</div>
            ${previewHtml}
            <div class="card-content">
                <h3>${game.title}</h3>
                <p class="card-desc">${game.desc}</p>
                <div class="card-controls">
                    <span class="difficulty ${game.diffClass}">${game.difficulty}</span>
                    <button class="play-btn">JOUER</button>
                </div>
            </div>
        `;
        
        // Attacher l'événement jouer
        card.querySelector('.play-btn').addEventListener('click', () => {
            openArcadeCabinet(game.type, game.src, game.title);
        });
        
        grid.appendChild(card);
    });
}

// --- GESTION DE LA BORNE D'ARCADE (MODAL) ---

function openArcadeCabinet(type, src, title) {
    const modal = document.getElementById('arcade-modal');
    const iframe = document.getElementById('arcade-iframe');
    const statusTitle = document.getElementById('active-game-title');
    
    statusTitle.textContent = title.toUpperCase();
    
    // Déterminer l'URL d'intégration
    let targetUrl = '';
    if (type === 'js') {
        targetUrl = src; // ./zombie_stadium.html
    } else {
        // Iframe d'intégration standard Scratch
        targetUrl = `https://scratch.mit.edu/projects/${src}/embed`;
    }
    
    // Charger le jeu
    iframe.src = targetUrl;
    
    // Afficher la borne
    modal.style.display = 'flex';
}

function closeArcadeCabinet() {
    const modal = document.getElementById('arcade-modal');
    const iframe = document.getElementById('arcade-iframe');
    
    // Vider l'iframe pour stopper les boucles sonores en tâche de fond
    iframe.src = 'about:blank';
    
    modal.style.display = 'none';
}

// --- LE CHARGEMENT INITIAL ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Charger et afficher les jeux
    loadCustomGames();
    renderGamesCatalog();
    
    // 2. Événements de fermeture de la borne
    document.getElementById('btn-modal-close').addEventListener('click', closeArcadeCabinet);
    document.getElementById('btn-close-overlay').addEventListener('click', closeArcadeCabinet);
    
    // Touche ECHAP pour quitter la borne
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeArcadeCabinet();
        }
    });
    
    // 3. Bouton CRT sur la borne d'arcade
    const btnCrt = document.getElementById('btn-modal-crt');
    const crtOverlay = document.getElementById('modal-crt-overlay');
    const scanlineOverlay = document.getElementById('modal-scanline-overlay');
    btnCrt.addEventListener('click', () => {
        if (crtOverlay.classList.contains('crt-on')) {
            crtOverlay.classList.remove('crt-on');
            scanlineOverlay.style.display = 'none';
            btnCrt.style.transform = 'translateY(2px)';
        } else {
            crtOverlay.classList.add('crt-on');
            scanlineOverlay.style.display = 'block';
            btnCrt.style.transform = '';
        }
    });
    
    // 4. Bouton Plein écran de la borne
    const btnFullscreen = document.getElementById('btn-modal-fullscreen');
    btnFullscreen.addEventListener('click', () => {
        const iframe = document.getElementById('arcade-iframe');
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) { /* Safari */
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) { /* IE11 */
            iframe.msRequestFullscreen();
        }
    });

    // 5. Formulaire d'ajout de jeu Scratch
    const form = document.getElementById('add-game-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const titleInput = document.getElementById('game-title');
        const descInput = document.getElementById('game-desc');
        const scratchIdInput = document.getElementById('scratch-id');
        
        const rawId = scratchIdInput.value;
        const scratchId = extractScratchId(rawId);
        
        if (!scratchId) {
            alert("ID de projet Scratch invalide. Veuillez entrer un ID valide ou le lien du projet Scratch (ex: https://scratch.mit.edu/projects/12345678).");
            return;
        }
        
        // Créer l'objet jeu personnalisé
        const newGame = {
            id: `custom_${Date.now()}`,
            title: titleInput.value.trim(),
            desc: descInput.value.trim(),
            type: "scratch",
            src: scratchId,
            difficulty: "★★☆ Joueur",
            diffClass: "normal"
        };
        
        // Enregistrer et re-rendre
        customGames.push(newGame);
        saveCustomGames();
        renderGamesCatalog();
        
        // Reset formulaire
        form.reset();
        
        // Petite notification de succès
        alert(`Jeu "${newGame.title}" ajouté avec succès à votre meuble d'arcade !`);
    });
});
