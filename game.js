// ==========================================
// CONFIGURATION & CONFIG DU JEU
// ==========================================
const MAP_WIDTH = 24;
const MAP_HEIGHT = 24;

let GAME_MAP = [];

// Paramètres de thèmes et de maps
const MAP_THEMES = {
    STADIUM: 'STADIUM',
    LOCKER_ROOM: 'LOCKER_ROOM',
    PARKING: 'PARKING'
};
let currentTheme = MAP_THEMES.STADIUM;

// Commandes personnalisables
const KEY_BINDINGS = {
    FORWARD: 'w',
    BACKWARD: 's',
    STRAFE_LEFT: 'a',
    STRAFE_RIGHT: 'd',
    INTERACT: 'e'
};

let player = {
    x: 1.5,
    y: 1.5,
    dirX: 1.0,
    dirY: 0.0,
    planeX: 0.0,
    planeY: 0.66,
    health: 100,
    score: 0,
    kills: 0,
    stamina: 100,
    lastDamageTime: 0
};

let weaponWeaponBob = 0;
let weaponRecoil = 0;

let zombies = [];
let balls = [];
let keys = {};
let zBuffer = [];

let ctx = null;
let gameLoopId = null;
let isMuted = false;
let isCrtOn = true;
let isPaused = false;

// Coordonnées de l'objectif physique de fin de niveau
let goalX = 22.5;
let goalY = 22.5;
let canInteractWithGoal = false;

// Frames d'animations et buffers de textures pour éviter le flou et les bugs
let zombieFrames = []; 
let goalSpriteBuffer = null;
let wallTextureBuffer = null;

// ==========================================
// INITIALISATION & ÉCOUTEURS D'ÉVÉNEMENTS
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
        ctx = gameCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false; // Désactive le lissage pour un rendu Pixel-Art net
    }

    generateAdvancedZombieSprites();
    generateGoalSprite();
    updateWallTexture(); 
    setupMenuControls();
    setupInputControls();
});

// Génère les textures d'animation pour simuler la marche 3D des zombies
function generateAdvancedZombieSprites() {
    zombieFrames = [];
    
    for (let frame = 0; frame < 2; frame++) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const zCtx = canvas.getContext('2d');
        zCtx.imageSmoothingEnabled = false;

        // Ombre portée au sol
        zCtx.fillStyle = 'rgba(0,0,0,0.3)';
        zCtx.beginPath();
        zCtx.ellipse(16, 30, 8, 2, 0, 0, Math.PI * 2);
        zCtx.fill();

        // Tête / Peau de monstre
        zCtx.fillStyle = '#3f6212'; 
        zCtx.fillRect(12, 2, 8, 8);
        zCtx.fillStyle = '#65a30d'; 
        zCtx.fillRect(13, 3, 6, 6);

        // Yeux Rouges Lumineux
        zCtx.fillStyle = '#ef4444';
        zCtx.fillRect(14, 4, 1, 2);
        zCtx.fillRect(17, 4, 1, 2);

        // Torse (Maillot d'équipe adverse)
        zCtx.fillStyle = '#991b1b'; 
        zCtx.fillRect(10, 10, 12, 12);
        
        // Numéro de maillot déchiré
        zCtx.fillStyle = '#ffffff';
        zCtx.fillRect(15, 13, 2, 5);

        // Bras oscillants selon la frame active
        zCtx.fillStyle = '#4d7c0f';
        if (frame === 0) {
            zCtx.fillRect(6, 10, 4, 8);  
            zCtx.fillRect(22, 10, 4, 12); 
        } else {
            zCtx.fillRect(6, 10, 4, 12);
            zCtx.fillRect(22, 10, 4, 8);
        }

        // Short et Jambes
        zCtx.fillStyle = '#171717'; 
        zCtx.fillRect(11, 22, 10, 3);
        zCtx.fillStyle = '#4d7c0f';
        zCtx.fillRect(11, 25, 3, 6);
        zCtx.fillRect(18, 25, 3, 6);

        zombieFrames.push(canvas);
    }
}

// Génère le sprite d'objectif au format pixel-art (Téléphone / Trophée)
function generateGoalSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const gCtx = canvas.getContext('2d');
    gCtx.imageSmoothingEnabled = false;

    // Ombre de l'objet
    gCtx.fillStyle = 'rgba(0,0,0,0.4)';
    gCtx.beginPath();
    gCtx.ellipse(16, 28, 6, 2, 0, 0, Math.PI*2);
    gCtx.fill();

    // Socle / Support doré
    gCtx.fillStyle = '#d97706';
    gCtx.fillRect(12, 24, 8, 4);
    gCtx.fillStyle = '#f59e0b';
    gCtx.fillRect(13, 25, 6, 2);

    // Corps de l'appareil électronique/objectif principal
    gCtx.fillStyle = '#1e293b';
    gCtx.fillRect(11, 6, 10, 18);
    
    // Écran rétro-éclairé bleu clignotant
    gCtx.fillStyle = '#38bdf8';
    gCtx.fillRect(13, 8, 6, 10);
    gCtx.fillStyle = '#ffffff';
    gCtx.fillRect(14, 9, 2, 2); // Reflet écran

    goalSpriteBuffer = canvas;
}

const WALL_IMAGES = {
    STADIUM: 'images/mur-map1.png',
    LOCKER_ROOM: 'images/mur-map2.png',
    PARKING: 'images/mur-map3.png'
};

// Génère dynamiquement les textures de murs à partir des vraies images
async function updateWallTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d');
    
    // 1. Désactiver le lissage AVANT de dessiner (et après avoir défini la taille du canvas)
    tCtx.imageSmoothingEnabled = false;
    tCtx.mozImageSmoothingEnabled = false; // Pour Firefox
    tCtx.webkitImageSmoothingEnabled = false; // Pour Safari/Chrome anciens

    // 2. Sélectionner l'image appropriée selon le thème actuel
    let imgSrc = WALL_IMAGES.PARKING; // Par défaut

    if (currentTheme === MAP_THEMES.STADIUM) {
        imgSrc = WALL_IMAGES.STADIUM;
    } else if (currentTheme === MAP_THEMES.LOCKER_ROOM) {
        imgSrc = WALL_IMAGES.LOCKER_ROOM;
    }

    // 3. Créer et charger l'image de manière asynchrone
    const img = new Image();
    
    // [CORRECTION CORS] : On retire crossOrigin si les images sont locales, 
    // car cela peut provoquer des blocages inutiles sur certains serveurs locaux (ex: Live Server)
    // img.crossOrigin = "anonymous"; 

    img.src = imgSrc;

    // On attend que l'image soit totalement chargée en mémoire
    const success = await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => {
            console.error("Erreur de chargement de la texture : " + imgSrc);
            resolve(false); 
        };
    });

    // 4. Sécurité : Si l'image locale a bugué (mauvais chemin), on dessine un carré de couleur de secours
    if (!success) {
        tCtx.fillStyle = (currentTheme === MAP_THEMES.STADIUM) ? '#0f172a' : 
                         (currentTheme === MAP_THEMES.LOCKER_ROOM) ? '#f1f5f9' : '#4b5563';
        tCtx.fillRect(0, 0, size, size);
    } else {
        // Dessiner la vraie texture sur le canvas (compressé proprement en 64x64)
        tCtx.drawImage(img, 0, 0, size, size);
    }

    // 5. On assigne le canvas généré au buffer de ton jeu
    wallTextureBuffer = canvas;
}

function generateRandomMap() {
    GAME_MAP = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(1));

    function carve(cx, cy) {
        GAME_MAP[cy][cx] = 0;
        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
        for (let [dx, dy] of dirs) {
            let nx = cx + dx;
            let ny = cy + dy;
            if (nx > 0 && nx < MAP_WIDTH - 1 && ny > 0 && ny < MAP_HEIGHT - 1) {
                if (GAME_MAP[ny][nx] === 1) {
                    GAME_MAP[cy + dy / 2][cx + dx / 2] = 0;
                    GAME_MAP[ny][nx] = 0;
                    carve(nx, ny);
                }
            }
        }
    }
    
    carve(1, 1);

    for (let i = 0; i < 45; i++) {
        let rx = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        let ry = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
        GAME_MAP[ry][rx] = 0;
    }

    GAME_MAP[1][1] = 0;
    GAME_MAP[1][2] = 0;
    GAME_MAP[2][1] = 0;
    
    let validGoalFound = false;
    let attempts = 0;
    
    while (!validGoalFound && attempts < 120) {
        let rx = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        let ry = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
        
        if (GAME_MAP[ry][rx] === 0 && Math.hypot(rx - 1.5, ry - 1.5) > 12) {
            goalX = rx + 0.5;
            goalY = ry + 0.5;
            validGoalFound = true;
        }
        attempts++;
    }
    
    if (!validGoalFound) {
        goalX = MAP_WIDTH - 2 + 0.5;
        goalY = MAP_HEIGHT - 2 + 0.5;
        GAME_MAP[MAP_HEIGHT - 2][MAP_WIDTH - 2] = 0;
    }
}

function setupMenuControls() {
    document.getElementById('btn-play').addEventListener('click', () => {
        const mapSelect = document.getElementById('map-select');
        if (mapSelect) {
            currentTheme = mapSelect.value; // Prise en compte de la map choisie
            updateWallTexture();
        }
        switchScreen('game-screen');
        startGame();
        document.getElementById('game-canvas').requestPointerLock();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
        switchScreen('settings-screen');
    });

    document.getElementById('btn-settings-back').addEventListener('click', () => {
        switchScreen('start-screen');
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
        switchScreen('game-screen');
        startGame();
        document.getElementById('game-canvas').requestPointerLock();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        switchScreen('start-screen');
    });

    document.getElementById('btn-mute').addEventListener('click', () => {
        isMuted = !isMuted;
        document.getElementById('btn-mute').textContent = isMuted ? "❌" : "🔊";
    });

    document.getElementById('btn-crt').addEventListener('click', () => {
        isCrtOn = !isCrtOn;
        const crtOverlay = document.getElementById('crt-overlay');
        if (crtOverlay) crtOverlay.className = isCrtOn ? "crt-on" : "";
    });

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
        btnResume.addEventListener('click', () => {
            document.getElementById('game-canvas').requestPointerLock();
        });
    }
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

function setupInputControls() {
    window.addEventListener('keydown', (e) => { 
        const key = e.key.toLowerCase();
        keys[key] = true; 
        
        if (e.key === ' ') { 
            if (!isPaused) shootBall(); 
            e.preventDefault(); 
        }
        
        // Interaction physique avec l'objectif de la map
        if (key === KEY_BINDINGS.INTERACT) {
            if (!isPaused && canInteractWithGoal) {
                try { document.exitPointerLock(); } catch(err){}
                switchScreen('victory-screen');
            }
        }
    });
    
    window.addEventListener('keyup', (e) => { 
        keys[e.key.toLowerCase()] = false; 
    });
    
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', () => {
        if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
        } else if (!isPaused) {
            shootBall();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
            isPaused = false;
            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu) pauseMenu.style.display = 'none';
        } else {
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen && gameScreen.classList.contains('active')) {
                isPaused = true;
                const pauseMenu = document.getElementById('pause-menu');
                if (pauseMenu) pauseMenu.style.display = 'flex';
            }
            keys = {};
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas && !isPaused) {
            const mouseSensitivity = 0.0022;
            let rotSpeed = e.movementX * mouseSensitivity;
            
            let oldDirX = player.dirX;
            player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed);
            player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
            
            let oldPlaneX = player.planeX;
            player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
            player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
        }
    });
}

function spawnZombies() {
    zombies = [];
    const count = 15;
    while (zombies.length < count) {
        let rx = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
        let ry = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
        if (GAME_MAP[ry][rx] === 0 && Math.hypot(rx - player.x, ry - player.y) > 4) {
            zombies.push({ 
                x: rx + 0.5, 
                y: ry + 0.5,
                animTimer: Math.random() * 100 
            });
        }
    }
}

function startGame() {
    generateRandomMap();

    player.x = 1.5; 
    player.y = 1.5;
    player.dirX = 1.0; 
    player.dirY = 0.0;
    player.planeX = 0.0; 
    player.planeY = 0.66;
    player.health = 100; 
    player.score = 0; 
    player.kills = 0; 
    player.stamina = 100;
    player.lastDamageTime = 0;
    isPaused = false;
    keys = {};
    canInteractWithGoal = false;
    weaponRecoil = 0;
    weaponWeaponBob = 0;

    spawnZombies();
    balls = [];
    zBuffer = new Array(ctx ? ctx.canvas.width : 640).fill(Infinity);

    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.style.display = 'none';

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!isPaused) {
        updateMovement();
        updateEntities();
    }
    
    renderRaycaster();
    renderWeaponWithHands(); // Exécution de l'affichage des deux bras animés
    renderMinimap();  
    updateHUD();

    if (player.health <= 0) {
        document.getElementById('go-score').textContent = player.score;
        document.getElementById('go-kills').textContent = player.kills;
        try { document.exitPointerLock(); } catch(e){}
        switchScreen('gameover-screen');
        return;
    }

    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateMovement() {
    const moveSpeed = 0.07;
    const buffer = 0.2;

    let newX = player.x;
    let newY = player.y;
    let isMoving = false;

    const isForward = keys[KEY_BINDINGS.FORWARD] || keys['z'] || keys['arrowup'];
    const isBackward = keys[KEY_BINDINGS.BACKWARD] || keys['arrowdown'];
    const isLeft = keys[KEY_BINDINGS.STRAFE_LEFT] || keys['q'] || keys['arrowleft'];
    const isRight = keys[KEY_BINDINGS.STRAFE_RIGHT] || keys['arrowright'];

    if (isForward) { newX += player.dirX * moveSpeed; newY += player.dirY * moveSpeed; isMoving = true; }
    if (isBackward) { newX -= player.dirX * moveSpeed; newY -= player.dirY * moveSpeed; isMoving = true; }
    if (isLeft) { newX -= player.planeX * moveSpeed; newY -= player.planeY * moveSpeed; isMoving = true; }
    if (isRight) { newX += player.planeX * moveSpeed; newY += player.planeY * moveSpeed; isMoving = true; }

    if (GAME_MAP[Math.floor(player.y)][Math.floor(newX + (newX > player.x ? buffer : -buffer))] !== 1) player.x = newX;
    if (GAME_MAP[Math.floor(newY + (newY > player.y ? buffer : -buffer))][Math.floor(player.x)] !== 1) player.y = newY;

    if (isMoving) {
        weaponWeaponBob += 0.24; // Fréquence d'oscillation
    } else {
        weaponWeaponBob *= 0.8; 
    }

    if (weaponRecoil > 0) weaponRecoil -= 4;

    let distToGoal = Math.hypot(player.x - goalX, player.y - goalY);
    canInteractWithGoal = (distToGoal < 0.9);

    if (player.stamina < 100) player.stamina += 1.5;
}

function shootBall() {
    if (player.stamina >= 25) {
        player.stamina -= 25;
        weaponRecoil = 30; // Force du recul visuel appliqué sur l'axe Y des mains
        balls.push({
            x: player.x,
            y: player.y,
            dirX: player.dirX,
            dirY: player.dirY,
            speed: 0.25,
            life: 50
        });
    }
}

function updateEntities() {
    for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];
        b.x += b.dirX * b.speed;
        b.y += b.dirY * b.speed;
        b.life--;

        if (GAME_MAP[Math.floor(b.y)][Math.floor(b.x)] === 1 || b.life <= 0) {
            balls.splice(i, 1);
            continue;
        }

        for (let j = zombies.length - 1; j >= 0; j--) {
            let z = zombies[j];
            let dist = Math.hypot(b.x - z.x, b.y - z.y);
            if (dist < 0.5) {
                zombies.splice(j, 1);
                balls.splice(i, 1);
                player.score += 150;
                player.kills += 1;
                break;
            }
        }
    }

    zombies.forEach(z => {
        z.animTimer += 1.2; 
        
        let angle = Math.atan2(player.y - z.y, player.x - z.x);
        let nextX = z.x + Math.cos(angle) * 0.024;
        let nextY = z.y + Math.sin(angle) * 0.024;

        if (GAME_MAP[Math.floor(z.y)][Math.floor(nextX)] !== 1) z.x = nextX;
        if (GAME_MAP[Math.floor(nextY)][Math.floor(z.x)] !== 1) z.y = nextY;

        if (Math.hypot(player.x - z.x, player.y - z.y) < 0.45) {
            const now = Date.now();
            if (!player.lastDamageTime || now - player.lastDamageTime > 5000) {
                player.health -= 20; // 20 points de dégâts
                player.lastDamageTime = now;
                triggerDamageFlash();
            }
        }
    });
}

function triggerDamageFlash() {
    const flash = document.getElementById('damage-flash');
    if (flash) {
        flash.style.opacity = '0.4';
        setTimeout(() => flash.style.opacity = '0', 50);
    }
}

// RENDU RETRO DES MAINS DE TENUE DU LANCEUR (INSPIRÉ DE DOOM)
function renderWeaponWithHands() {
    if (!ctx) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.save();
    
    // Formules d'oscillation et de recul des membres
    let bobX = Math.sin(weaponWeaponBob) * 10;
    let bobY = Math.abs(Math.cos(weaponWeaponBob)) * 6 + weaponRecoil;

    let cx = w / 2 + bobX;
    let cy = h + bobY;

    // 1. RENDU DES BRAS ET MAINS DU JOUEUR (Pixel-art géométrique)
    ctx.fillStyle = '#fbcfe8'; // Peau claire rétro
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;

    // Main Droite (Maintien de la crosse inférieure)
    ctx.fillRect(cx + 16, cy - 44, 20, 20);
    ctx.strokeRect(cx + 16, cy - 44, 20, 20);
    
    // Main Gauche (Soutien du tube avant)
    ctx.fillRect(cx - 36, cy - 54, 18, 18);
    ctx.strokeRect(cx - 36, cy - 54, 18, 18);

    // Manches bleues du maillot de sport de l'équipe locale
    ctx.fillStyle = '#2563eb'; 
    ctx.fillRect(cx + 24, cy - 24, 26, 30);
    ctx.fillRect(cx - 48, cy - 36, 22, 40);

    // 2. RENDU DU CANON CENTRAL DU LANCE-BALLONS
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy);
    ctx.lineTo(cx - 10, cy - 95);
    ctx.lineTo(cx + 10, cy - 95);
    ctx.lineTo(cx + 16, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Intérieur obscur de la bouche du canon
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 95, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jauge lumineuse de recharge (Stamina)
    ctx.fillStyle = player.stamina >= 25 ? '#22c55e' : '#ef4444';
    ctx.fillRect(cx - 2, cy - 68, 4, 28);

    ctx.restore();
}

function renderRaycaster() {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false; 
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Ciel
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, w, h / 2);
    
    // Détermination du sol selon la carte
    let groundColor = '#15803d'; 
    if (currentTheme === MAP_THEMES.LOCKER_ROOM) groundColor = '#334155';
    if (currentTheme === MAP_THEMES.PARKING) groundColor = '#1c1917';
    
    ctx.fillStyle = groundColor; 
    ctx.fillRect(0, h / 2, w, h / 2);
    
    // Effet bandes blanches de pelouse sur la map Stade
    if (currentTheme === MAP_THEMES.STADIUM) {
        ctx.fillStyle = '#16a34a';
        for (let row = h / 2; row < h; row += 20) {
            if ((row / 20) % 2 === 0) ctx.fillRect(0, row, w, 8);
        }
    }

    // Algorithme DDA Raycasting pour les structures de murs
    for (let x = 0; x < w; x++) {
        let cameraX = 2 * x / w - 1;
        let rayDirX = player.dirX + player.planeX * cameraX;
        let rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        let sideDistX, sideDistY;
        let deltaDistX = (rayDirX === 0) ? Infinity : Math.abs(1 / rayDirX);
        let deltaDistY = (rayDirY === 0) ? Infinity : Math.abs(1 / rayDirY);
        let perpWallDist;

        let stepX, stepY;
        let hit = 0;
        let side;

        if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; } 
        else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; } 
        else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; } 
            else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if (GAME_MAP[mapY][mapX] === 1) hit = 1;
        }

        if (side === 0) perpWallDist = (sideDistX - deltaDistX);
        else perpWallDist = (sideDistY - deltaDistY);

        zBuffer[x] = perpWallDist;

        let lineHeight = Math.floor(h / (perpWallDist || 0.01));
        let drawStart = Math.floor(-lineHeight / 2 + h / 2);
        let drawEnd = Math.floor(lineHeight / 2 + h / 2);

        let wallX = (side === 0) ? player.y + perpWallDist * rayDirY : player.x + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);
        let texX = Math.floor(wallX * 64);
        if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) texX = 64 - texX - 1;

        texX = Math.max(0, Math.min(63, texX));

        if (wallTextureBuffer) {
            ctx.drawImage(wallTextureBuffer, texX, 0, 1, 64, x, drawStart, 1, (drawEnd - drawStart));
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.85, (perpWallDist * 0.06) + (side === 1 ? 0.2 : 0))})`;
            ctx.fillRect(x, drawStart, 1, (drawEnd - drawStart));
        }
    }

    // Gestion du tri de profondeur des Sprites 2.5D (Billboards)
    let sprites = [];
    zombies.forEach(z => sprites.push({ x: z.x, y: z.y, type: 'zombie', animTimer: z.animTimer }));
    sprites.push({ x: goalX, y: goalY, type: 'goal' });
    balls.forEach(b => sprites.push({ x: b.x, y: b.y, type: 'ball' }));

    sprites.sort((a, b) => {
        let distA = Math.hypot(player.x - a.x, player.y - a.y);
        let distB = Math.hypot(player.x - b.x, player.y - b.y);
        return distB - distA;
    });

    sprites.forEach(sprite => {
        if (sprite.type === 'zombie') drawAnimatedZombie(sprite);
        if (sprite.type === 'goal') drawGoalSprite(sprite);
        if (sprite.type === 'ball') drawBallSprite(sprite, 5);
    });

    // Message contextuel d'objectif si le joueur est dessus
    if (canInteractWithGoal) {
        ctx.fillStyle = "white";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Appuyez sur [${KEY_BINDINGS.INTERACT.toUpperCase()}] pour sécuriser l'objectif !`, w / 2, h - 145);
    }
}

function drawAnimatedZombie(obj) {
    let spriteX = obj.x - player.x;
    let spriteY = obj.y - player.y;

    let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
    let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
    let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

    if (transformY > 0.2) {
        let screenX = Math.floor((ctx.canvas.width / 2) * (1 + transformX / transformY));
        let spriteHeight = Math.abs(Math.floor(ctx.canvas.height / transformY)); 
        let spriteWidth = spriteHeight; 

        let drawStartY = -spriteHeight / 2 + ctx.canvas.height / 2;
        let drawStartX = screenX - spriteWidth / 2;

        let frameIndex = Math.floor(obj.animTimer / 12) % 2;
        let currentSprite = zombieFrames[frameIndex];

        for (let stripe = Math.floor(drawStartX); stripe < drawStartX + spriteWidth; stripe++) {
            if (stripe >= 0 && stripe < ctx.canvas.width && transformY < zBuffer[stripe]) {
                let texX = Math.floor((stripe - drawStartX) * 32 / spriteWidth);
                if(texX >= 0 && texX < 32 && currentSprite) {
                    ctx.drawImage(currentSprite, texX, 0, 1, 32, stripe, drawStartY, 1, spriteHeight);
                }
            }
        }
    }
}

function drawGoalSprite(obj) {
    let spriteX = obj.x - player.x;
    let spriteY = obj.y - player.y;

    let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
    let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
    let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

    if (transformY > 0.2) {
        let screenX = Math.floor((ctx.canvas.width / 2) * (1 + transformX / transformY));
        let spriteHeight = Math.abs(Math.floor(ctx.canvas.height / transformY)) * 0.7; 
        let spriteWidth = spriteHeight; 

        let drawStartY = -spriteHeight / 2 + ctx.canvas.height / 2 + (spriteHeight * 0.2);
        let drawStartX = screenX - spriteWidth / 2;

        for (let stripe = Math.floor(drawStartX); stripe < drawStartX + spriteWidth; stripe++) {
            if (stripe >= 0 && stripe < ctx.canvas.width && transformY < zBuffer[stripe]) {
                let texX = Math.floor((stripe - drawStartX) * 32 / spriteWidth);
                if(texX >= 0 && texX < 32 && goalSpriteBuffer) {
                    ctx.drawImage(goalSpriteBuffer, texX, 0, 1, 32, stripe, drawStartY, 1, spriteHeight);
                }
            }
        }
    }
}

function drawBallSprite(obj, sizeDivider) {
    let spriteX = obj.x - player.x;
    let spriteY = obj.y - player.y;

    let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
    let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
    let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

    if (transformY > 0.2) {
        let screenX = Math.floor((ctx.canvas.width / 2) * (1 + transformX / transformY));
        let spriteSize = Math.abs(Math.floor(ctx.canvas.height / transformY)) / sizeDivider;
        
        if (screenX >= 0 && screenX < ctx.canvas.width && transformY < zBuffer[screenX]) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX, ctx.canvas.height / 2 + 15, Math.max(4, spriteSize), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
}

function renderMinimap() {
    if (!ctx) return;
    const w = ctx.canvas.width;
    
    const size = 120; 
    const pad = 16;   
    const startX = w - size - pad;
    const startY = pad;
    
    const cell = size / MAP_WIDTH;

    ctx.save();
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fillRect(startX, startY, size, size);
    ctx.strokeRect(startX, startY, size, size);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (GAME_MAP[y][x] === 1) {
                ctx.fillStyle = currentTheme === MAP_THEMES.STADIUM ? '#166534' : '#334155';
                ctx.fillRect(startX + (x * cell), startY + (y * cell), cell + 0.5, cell + 0.5);
            }
        }
    }

    // Emplacement de l'objectif physique (Point doré clignotant sur la minimap)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(startX + (goalX * cell) - 1.5, startY + (goalY * cell) - 1.5, 3, 3);

    ctx.fillStyle = '#ef4444';
    zombies.forEach(z => {
        ctx.beginPath();
        ctx.arc(startX + (z.x * cell), startY + (z.y * cell), 1.5, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(startX + (player.x * cell), startY + (player.y * cell), 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const healthEl = document.getElementById('hud-health-fill');
    const distEl = document.getElementById('dist-val');
    
    if(scoreEl) scoreEl.textContent = String(player.score).padStart(6, '0');
    if(healthEl) healthEl.style.width = `${Math.max(0, player.health)}%`;
    
    let dist = Math.hypot(player.x - goalX, player.y - goalY);
    if(distEl) distEl.textContent = Math.round(dist * 10);
}