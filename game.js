// --- CONFIGURATION DU JEU ---
const MAP_SIZE = 24;
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,2,2,2,0,1,0,2,2,2,2,2,2,2,0,1,0,3,3,3,3,0,1],
    [1,0,2,0,0,0,1,0,2,0,0,0,0,0,2,0,1,0,3,0,0,3,0,1],
    [1,0,2,0,2,2,2,0,2,0,2,2,2,0,2,0,1,0,3,0,0,3,0,1],
    [1,0,0,0,0,0,0,0,0,0,2,0,2,0,0,0,0,0,3,0,0,3,0,1],
    [1,2,2,0,2,2,2,0,2,0,2,0,2,0,2,0,1,1,3,0,0,3,0,1],
    [1,0,0,0,2,0,0,0,2,0,0,0,0,0,2,0,1,0,0,0,0,0,0,1],
    [1,0,2,2,2,0,2,2,2,2,2,2,0,2,2,0,1,0,3,3,3,3,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,0,4,4,4,0,4,4,4,0,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,4,4,4,4,4,4,0,0,0,0,0,0,4,4,4,4,4,4,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1,1,1,1,1],
    [1,0,0,0,1,0,1,0,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0,1],
    [1,0,2,0,1,0,1,0,3,0,1,0,0,1,0,3,0,1,0,1,0,2,0,1],
    [1,0,2,0,0,0,0,0,3,0,0,0,0,0,0,3,0,0,0,0,0,2,0,1],
    [1,0,2,2,2,2,2,2,3,3,3,3,3,3,3,3,2,2,2,2,2,2,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// --- CLASSES DE JOUEURS ---
const PLAYER_CLASSES = {
    striker: {
        name: "L'ATTAQUANT",
        maxHealth: 100,
        speed: 0.11,
        shootCooldown: 300, // ms
        damage: 30,
        staminaRegen: 0.05
    },
    defender: {
        name: "LE DÉFENSEUR",
        maxHealth: 180,
        speed: 0.08,
        shootCooldown: 600,
        damage: 40,
        staminaRegen: 0.03
    },
    midfielder: {
        name: "LE MILIEU",
        maxHealth: 100,
        speed: 0.14,
        shootCooldown: 400,
        damage: 20,
        staminaRegen: 0.09
    }
};

// --- SYNTHÉTISEUR AUDIO RETRO (Web Audio API) ---
const audio = {
    ctx: null,
    muted: false,
    synthInterval: null,
    
    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
    },
    
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.muted;
    },
    
    playKick() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    },
    
    playHit() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start();
        noise.stop(ctx.currentTime + 0.08);
    },
    
    playHurt() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    },
    
    playGroan() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70 + Math.random() * 20, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(45, ctx.currentTime + 0.6);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    },
    
    playPhoneRing() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        
        const playBeep = (time) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.type = 'sine';
            osc1.frequency.value = 850;
            osc2.type = 'sine';
            osc2.frequency.value = 950;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
            gain.gain.setValueAtTime(0.2, time + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
            
            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + 0.25);
            osc2.stop(time + 0.25);
        };
        
        playBeep(now);
        playBeep(now + 0.35);
    },
    
    playWin() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [130.81, 164.81, 196.00, 261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const time = now + i * 0.09;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
            
            osc.start(time);
            osc.stop(time + 0.25);
        });
    },
    
    playLose() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [293.66, 277.18, 261.63, 220.00, 196.00, 146.83];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            const time = now + i * 0.18;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
            
            osc.start(time);
            osc.stop(time + 0.35);
        });
    },
    
    playHeal() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.07);
            
            const time = now + i * 0.07;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            
            osc.start(time);
            osc.stop(time + 0.15);
        });
    },

    startMusic() {
        if (this.muted || !this.ctx) return;
        this.stopMusic();
        
        let step = 0;
        const freqs = [55.00, 55.00, 48.99, 48.99, 43.65, 43.65, 38.89, 41.20]; // A1, G1, F1, D#1/E1
        
        this.synthInterval = setInterval(() => {
            if (!this.ctx || this.muted) return;
            const ctx = this.ctx;
            const now = ctx.currentTime;
            
            // Bass saw
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freqs[step % freqs.length], now);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(180, now);
            filter.frequency.exponentialRampToValueAtTime(500, now + 0.08);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.22);
            
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
            
            // Hats
            if (step % 2 === 0) {
                const bufferSize = ctx.sampleRate * 0.015;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                
                const hh = ctx.createBufferSource();
                hh.buffer = buffer;
                
                const hhFilter = ctx.createBiquadFilter();
                hhFilter.type = 'highpass';
                hhFilter.frequency.value = 8000;
                
                const hhGain = ctx.createGain();
                hhGain.gain.setValueAtTime(0.012, now);
                hhGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
                
                hh.connect(hhFilter);
                hhFilter.connect(hhGain);
                hhGain.connect(ctx.destination);
                
                hh.start(now);
                hh.stop(now + 0.015);
            }
            
            // Snare on 2 and 6
            if (step % 4 === 2) {
                const bufferSize = ctx.sampleRate * 0.06;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                
                const sn = ctx.createBufferSource();
                sn.buffer = buffer;
                
                const snFilter = ctx.createBiquadFilter();
                snFilter.type = 'bandpass';
                snFilter.frequency.value = 1100;
                
                const snGain = ctx.createGain();
                snGain.gain.setValueAtTime(0.025, now);
                snGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                
                sn.connect(snFilter);
                snFilter.connect(snGain);
                snGain.connect(ctx.destination);
                
                sn.start(now);
                sn.stop(now + 0.06);
            }
            
            step++;
        }, 280); // ~107 BPM
    },
    
    stopMusic() {
        if (this.synthInterval) {
            clearInterval(this.synthInterval);
            this.synthInterval = null;
        }
    }
};

// --- GÉNÉRATEUR GRAPHISME PROCÉDURAL (Canvas cache) ---
const textures = [];
const spritesGen = {
    zombieNormalWalk1: null,
    zombieNormalWalk2: null,
    zombieNormalHurt: null,
    
    zombieRunnerWalk1: null,
    zombieRunnerWalk2: null,
    zombieRunnerHurt: null,
    
    zombieTankWalk1: null,
    zombieTankWalk2: null,
    zombieTankHurt: null,
    
    football1: null,
    football2: null,
    football3: null,
    football4: null,
    
    phone: null,
    
    playerFootIdle: null,
    playerFootKick1: null,
    playerFootKick2: null,
    playerFootKick3: null,
    init() {
        // 1. Génération des Textures de Murs en Haute Résolution (128x128)
        textures[0] = this.createConcreteTexture();
        textures[1] = this.createLockerTexture();
        textures[2] = this.createCyberGridTexture();
        textures[3] = this.createGoalNetTexture();
        
        // 2. Génération des Sprites Zombies (64x64)
        // Zombie Normal (Violet)
        this.zombieNormalWalk1 = this.createZombieCanvas('#7b1fa2', 1, false, 1.0);
        this.zombieNormalWalk2 = this.createZombieCanvas('#7b1fa2', 2, false, 1.0);
        this.zombieNormalHurt = this.createZombieCanvas('#ff1744', 1, true, 1.0);
        
        // Zombie Rapide (Rouge)
        this.zombieRunnerWalk1 = this.createZombieCanvas('#c62828', 1, false, 0.8);
        this.zombieRunnerWalk2 = this.createZombieCanvas('#c62828', 2, false, 0.8);
        this.zombieRunnerHurt = this.createZombieCanvas('#ff1744', 1, true, 0.8);
        
        // Zombie Tank (Jaune)
        this.zombieTankWalk1 = this.createZombieCanvas('#f57f17', 1, false, 1.3);
        this.zombieTankWalk2 = this.createZombieCanvas('#f57f17', 2, false, 1.3);
        this.zombieTankHurt = this.createZombieCanvas('#ff1744', 1, true, 1.3);
        
        // 3. Génération des Ballons de foot animés (32x32)
        this.football1 = this.createFootballCanvas(0);
        this.football2 = this.createFootballCanvas(1);
        this.football3 = this.createFootballCanvas(2);
        this.football4 = this.createFootballCanvas(3);
        
        // 4. Génération de la Cabine Téléphonique d'Arcade (64x64)
        this.phone = this.createPhoneCanvas();
        
        // 5. Génération du pied du joueur de foot (128x128)
        this.playerFootIdle = this.createPlayerFootCanvas('idle');
        this.playerFootKick1 = this.createPlayerFootCanvas('kick1');
        this.playerFootKick2 = this.createPlayerFootCanvas('kick2');
        this.playerFootKick3 = this.createPlayerFootCanvas('kick3');

        // 6. Génération de la Gourde de Sport de Soin (32x32)
        this.waterBottle = this.createWaterBottleCanvas();
    },
    
    // Texture 1 : Béton de stade rétro ultra texturé en 128x128 (Effet 3D biseauté et fissures)
    createConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Fond gris béton
        ctx.fillStyle = '#262938';
        ctx.fillRect(0, 0, 128, 128);
        
        // Grain du béton (Texture bruitée de haute intensité)
        for(let i=0; i<350; i++) {
            ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.12)';
            ctx.fillRect(Math.random()*128, Math.random()*128, 2, 2);
        }
        
        // Découpe en blocs (4 blocs de 64x64)
        ctx.strokeStyle = '#10121a';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 128, 128);
        ctx.beginPath();
        ctx.moveTo(0, 64); ctx.lineTo(128, 64);
        ctx.moveTo(64, 0); ctx.lineTo(64, 128);
        ctx.stroke();
        
        // Relief 3D de chaque bloc (Biseaux clairs et ombres)
        ctx.lineWidth = 2;
        const blocks = [
            {x: 0, y: 0}, {x: 64, y: 0},
            {x: 0, y: 64}, {x: 64, y: 64}
        ];
        
        blocks.forEach(b => {
            // Côtés lumineux (Haut et Gauche)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.moveTo(b.x + 2, b.y + 62);
            ctx.lineTo(b.x + 2, b.y + 2);
            ctx.lineTo(b.x + 62, b.y + 2);
            ctx.stroke();
            
            // Côtés sombres (Bas et Droite)
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.moveTo(b.x + 2, b.y + 62);
            ctx.lineTo(b.x + 62, b.y + 62);
            ctx.lineTo(b.x + 62, b.y + 2);
            ctx.stroke();
        });
        
        // Fissures rétro dans le béton
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Fissure bloc 1
        ctx.moveTo(10, 15); ctx.lineTo(18, 22); ctx.lineTo(15, 30); ctx.lineTo(24, 38);
        // Fissure bloc 4
        ctx.moveTo(80, 85); ctx.lineTo(95, 88); ctx.lineTo(100, 102);
        ctx.stroke();
        
        // Néons cyan de marquage stade (Haute luminosité)
        ctx.save();
        ctx.strokeStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 32); ctx.lineTo(128, 32);
        ctx.moveTo(0, 96); ctx.lineTo(128, 96);
        ctx.stroke();
        ctx.restore();
        
        return canvas;
    },
    
    // Texture 2 : Casiers métalliques 128x128 (Rivets, grilles de ventilation, cadenas et rayures)
    createLockerTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Fond métal bleu-gris bleuté
        ctx.fillStyle = '#455a64';
        ctx.fillRect(0, 0, 128, 128);
        
        // Découpe des deux portes de casiers
        ctx.strokeStyle = '#1d272c';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 128, 128);
        ctx.strokeRect(6, 6, 54, 116);
        ctx.strokeRect(68, 6, 54, 116);
        
        // Biseaux lumineux sur les casiers
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Casier Gauche
        ctx.moveTo(8, 120); ctx.lineTo(8, 8); ctx.lineTo(58, 8);
        // Casier Droit
        ctx.moveTo(70, 120); ctx.lineTo(70, 8); ctx.lineTo(120, 8);
        ctx.stroke();
        
        // Grilles d'aération (6 fentes horizontales sombres bevelées par porte)
        const drawVents = (xOffset) => {
            ctx.fillStyle = '#1a2327';
            ctx.strokeStyle = '#78909c';
            ctx.lineWidth = 1;
            for (let y = 18; y < 50; y += 8) {
                ctx.fillRect(xOffset, y, 30, 4);
                ctx.beginPath();
                ctx.moveTo(xOffset, y + 4);
                ctx.lineTo(xOffset + 30, y + 4);
                ctx.stroke();
            }
        };
        drawVents(18);
        drawVents(80);
        
        // Rivets de fixation du métal (petits cercles métalliques)
        ctx.fillStyle = '#cfd8dc';
        const rivetCoords = [
            {x: 10, y: 10}, {x: 52, y: 10}, {x: 10, y: 114}, {x: 52, y: 114},
            {x: 72, y: 10}, {x: 114, y: 10}, {x: 72, y: 114}, {x: 114, y: 114}
        ];
        rivetCoords.forEach(r => {
            ctx.beginPath();
            ctx.arc(r.x, r.y, 2, 0, Math.PI*2);
            ctx.fill();
        });
        
        // Poignées et cadenas en or métallique
        ctx.fillStyle = '#ffd700'; // Or
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillRect(52, 60, 4, 14); // Serrure G
        ctx.fillRect(72, 60, 4, 14); // Serrure D
        ctx.shadowBlur = 0;
        
        // Bandes de sécurité warning jaune/noir en bas (128x128)
        ctx.save();
        ctx.rect(4, 100, 120, 24);
        ctx.clip();
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(4, 100, 120, 24);
        ctx.fillStyle = '#111';
        ctx.lineWidth = 8;
        for(let i=-20; i<150; i+=20) {
            ctx.beginPath();
            ctx.moveTo(i, 100); ctx.lineTo(i+16, 128);
            ctx.stroke();
        }
        ctx.restore();
        
        // Rayures / Griffures de combat
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(15, 60); ctx.lineTo(30, 80);
        ctx.moveTo(85, 75); ctx.lineTo(95, 95);
        ctx.stroke();
        
        return canvas;
    },
    
    // Texture 3 : Grille Cyber-Punk Magenta 128x128 (Double grille et motifs de puces laser)
    createCyberGridTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Fond noir spatial / néon bleu sous-jacent
        ctx.fillStyle = '#060815';
        ctx.fillRect(0, 0, 128, 128);
        
        // Sous-grille violette de fond (Effet de profondeur)
        ctx.strokeStyle = '#281140';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 8; i < 128; i += 8) {
            ctx.moveTo(i, 0); ctx.lineTo(i, 128);
            ctx.moveTo(0, i); ctx.lineTo(128, i);
        }
        ctx.stroke();
        
        // Grille principale magenta brillante
        ctx.strokeStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 128, 128);
        
        ctx.beginPath();
        for (let i = 32; i < 128; i += 32) {
            ctx.moveTo(i, 0); ctx.lineTo(i, 128);
            ctx.moveTo(0, i); ctx.lineTo(128, i);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Motifs technologiques laser dans les coins
        ctx.fillStyle = '#00f3ff'; // Cyan
        ctx.fillRect(14, 14, 4, 4);
        ctx.fillRect(46, 14, 4, 4);
        ctx.fillRect(14, 46, 4, 4);
        ctx.fillRect(78, 14, 4, 4);
        
        return canvas;
    },
    
    // Texture 4 : Filet de But & Gazon texturé 128x128 (Brins d'herbe haute définition et cadre)
    createGoalNetTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Gazon de fond (Vert stade foncé)
        ctx.fillStyle = '#1c3310';
        ctx.fillRect(0, 0, 128, 128);
        
        // Dessin des brins d'herbe individuels (effet gazon texturé)
        for (let i = 0; i < 400; i++) {
            const gx = Math.random() * 128;
            const gy = Math.random() * 128;
            const gh = 3 + Math.random() * 5;
            ctx.strokeStyle = Math.random() < 0.5 ? '#2d5418' : '#14250b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + (Math.random() - 0.5) * 2, gy - gh);
            ctx.stroke();
        }
        
        // Montants métalliques du but (Rouges et Blancs) bevilés sur la gauche
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 16, 128);
        // Bandes rouges
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 0, 16, 24);
        ctx.fillRect(0, 48, 16, 24);
        ctx.fillRect(0, 96, 16, 24);
        
        // Biseau d'acier sur le poteau de but
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(2, 0, 3, 128);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(13, 0, 3, 128);
        
        // Grille du filet de but (Lignes blanches diagonales fines)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = -128; i < 256; i += 16) {
            ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128);
            ctx.moveTo(i + 128, 0); ctx.lineTo(i, 128);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        return canvas;
    },
    
    // Dessine le sprite 2D du zombie à projeter en 3D
    createZombieCanvas(colorJersey, frame, isHurt, scale) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Si touché, effet flash rouge/blanc
        if (isHurt) {
            ctx.fillStyle = '#ff3131';
            ctx.beginPath();
            ctx.arc(32, 32, 28, 0, Math.PI*2);
            ctx.fill();
            return canvas;
        }
        
        ctx.save();
        ctx.translate(32, 32);
        ctx.scale(scale, scale);
        ctx.translate(-32, -32);
        
        // 1. Tête verte zombie
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(24, 8, 16, 16);
        
        // Yeux jaunes brillants
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(27, 12, 3, 3);
        ctx.fillRect(34, 12, 3, 3);
        
        // Bouche béante noire/rouge
        ctx.fillStyle = '#212121';
        ctx.fillRect(28, 18, 8, 4);
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(30, 20, 4, 2);
        
        // 2. Torse maillot de foot
        ctx.fillStyle = colorJersey;
        ctx.fillRect(20, 24, 24, 22);
        
        // Numéro de maillot "13"
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('13', 32, 36);
        
        // Col du maillot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(28, 24); ctx.lineTo(32, 29); ctx.lineTo(36, 24);
        ctx.fill();
        
        // 3. Bras tendus
        ctx.fillStyle = '#4caf50';
        if (frame === 1) {
            // Bras gauche plus haut, bras droit plus bas
            ctx.fillRect(10, 20, 10, 6); // Bras G
            ctx.fillRect(44, 25, 10, 6); // Bras D
        } else {
            // Bras droit plus haut, bras gauche plus bas
            ctx.fillRect(10, 25, 10, 6); // Bras G
            ctx.fillRect(44, 20, 10, 6); // Bras D
        }
        
        // Mains vertes
        ctx.fillStyle = '#388e3c';
        ctx.fillRect(frame === 1 ? 6 : 8, 20, 4, 6);
        ctx.fillRect(frame === 1 ? 54 : 52, 25, 4, 6);
        
        // 4. Jambes / Shorts
        ctx.fillStyle = '#1a1a1a'; // Short
        ctx.fillRect(20, 46, 24, 6);
        
        // Jambes vertes
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(24, 52, 6, 8);
        ctx.fillRect(34, 52, 6, 8);
        
        // Crampons/chaussures noires
        ctx.fillStyle = '#000000';
        ctx.fillRect(22, 60, 8, 4);
        ctx.fillRect(34, 60, 8, 4);
        
        ctx.restore();
        return canvas;
    },
    
    // Ballon de foot avec effet de rotation
    createFootballCanvas(frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.translate(16, 16);
        ctx.rotate((frame * 90) * Math.PI / 180);
        ctx.translate(-16, -16);
        
        // Cercle extérieur blanc
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Pentagones de ballon de foot retro
        ctx.fillStyle = '#000000';
        
        // Centre
        ctx.beginPath();
        ctx.arc(16, 16, 4, 0, Math.PI*2);
        ctx.fill();
        
        // Lignes radiales et petits motifs sur les bords
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        const angles = [0, 72, 144, 216, 288];
        angles.forEach(ang => {
            const rad = ang * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(16, 16);
            ctx.lineTo(16 + Math.cos(rad)*14, 16 + Math.sin(rad)*14);
            ctx.stroke();
            
            // Polygone sur le bord
            ctx.beginPath();
            ctx.arc(16 + Math.cos(rad)*11, 16 + Math.sin(rad)*11, 2.5, 0, Math.PI*2);
            ctx.fill();
        });
        
        ctx.restore();
        return canvas;
    },
    
    // Cabine téléphonique dorée / Objectif
    createPhoneCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Lueur néon jaune extérieure
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 10;
        
        // 1. Structure de la cabine
        ctx.fillStyle = '#ffd700'; // Or métallique
        ctx.fillRect(18, 4, 28, 56);
        
        ctx.fillStyle = '#0d0d0d'; // Intérieur sombre
        ctx.fillRect(22, 8, 20, 48);
        
        ctx.shadowBlur = 0; // Reset ombre pour les détails
        
        // 2. Vitres
        ctx.fillStyle = 'rgba(0, 243, 255, 0.4)'; // Cyan translucide
        ctx.fillRect(24, 12, 16, 12);
        ctx.fillRect(24, 28, 16, 12);
        
        // Barres de fenêtres en or
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(31, 12, 2, 28);
        ctx.fillRect(24, 17, 16, 2);
        ctx.fillRect(24, 33, 16, 2);
        
        // 3. Téléphone à l'intérieur
        ctx.fillStyle = '#ff007f'; // Smartphone néon rose à l'intérieur
        ctx.fillRect(29, 44, 6, 8);
        ctx.fillStyle = '#ffffff'; // Écran allumé
        ctx.fillRect(30, 45, 4, 4);
        
        // 4. Logo Téléphone en haut
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(18, 2, 28, 4);
        
        return canvas;
    },
    
    // Jambe / pied du joueur de foot (Boot & socks)
    createPlayerFootCanvas(state) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        if (state === 'idle') {
            // Pied au repos en bas à droite
            ctx.save();
            ctx.translate(140, 110);
            
            // Jambe inclinée (chaussette rayée rouge et blanche)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 35;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(30, 30);
            ctx.lineTo(80, 120);
            ctx.stroke();
            
            // Rayures rouges sur la chaussette
            ctx.strokeStyle = '#ff3131';
            ctx.lineWidth = 35;
            ctx.setLineDash([15, 20]);
            ctx.beginPath();
            ctx.moveTo(30, 30);
            ctx.lineTo(80, 120);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Chaussure de foot noire
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.ellipse(30, 120, 45, 20, 20 * Math.PI / 180, 0, Math.PI*2);
            ctx.fill();
            
            // Bandes blanches rétro sur la chaussure
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(10, 110); ctx.lineTo(25, 125);
            ctx.moveTo(18, 108); ctx.lineTo(33, 123);
            ctx.stroke();
            
            // Crampons sous la chaussure
            ctx.fillStyle = '#dddddd';
            ctx.fillRect(5, 137, 6, 6);
            ctx.fillRect(20, 139, 6, 6);
            ctx.fillRect(40, 135, 6, 6);
            
            // Petit ballon sous le pied au repos
            ctx.restore();
        } 
        else if (state === 'kick1') {
            // Préparation : Jambe tirée vers l'arrière
            ctx.save();
            ctx.translate(160, 140);
            ctx.scale(0.9, 0.9);
            
            // Jambe
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 35;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(40, 10);
            ctx.lineTo(90, 100);
            ctx.stroke();
            
            ctx.strokeStyle = '#ff3131';
            ctx.lineWidth = 35;
            ctx.setLineDash([15, 20]);
            ctx.beginPath();
            ctx.moveTo(40, 10);
            ctx.lineTo(90, 100);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Chaussure
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.ellipse(35, 105, 42, 18, 30 * Math.PI / 180, 0, Math.PI*2);
            ctx.fill();
            
            ctx.restore();
        } 
        else if (state === 'kick2') {
            // Frappe : pied au centre de l'écran, grand, de face
            ctx.save();
            ctx.translate(128, 140);
            
            // Traînées d'action / vent cyan
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-60, 50); ctx.lineTo(-100, 70);
            ctx.moveTo(60, 50); ctx.lineTo(100, 70);
            ctx.moveTo(0, 80); ctx.lineTo(0, 130);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Jambe droite arrivant de l'arrière
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 45;
            ctx.beginPath();
            ctx.moveTo(0, 80); ctx.lineTo(0, 40);
            ctx.stroke();
            
            ctx.strokeStyle = '#ff3131';
            ctx.lineWidth = 45;
            ctx.beginPath();
            ctx.moveTo(0, 65); ctx.lineTo(0, 45);
            ctx.stroke();
            
            // Grosse chaussure de face/profil
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.ellipse(0, 20, 60, 32, 0, 0, Math.PI*2);
            ctx.fill();
            
            // Bandes de la chaussure
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-15, -10); ctx.lineTo(-15, 20);
            ctx.moveTo(0, -15); ctx.lineTo(0, 20);
            ctx.stroke();
            
            // Crampons gris
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-40, 45, 12, 8);
            ctx.fillRect(-10, 48, 12, 8);
            ctx.fillRect(20, 45, 12, 8);
            
            ctx.restore();
        } 
        else if (state === 'kick3') {
            // Retour de frappe / Flouté
            ctx.save();
            ctx.translate(135, 125);
            ctx.globalAlpha = 0.7; // Légère transparence
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 38;
            ctx.beginPath();
            ctx.moveTo(25, 25); ctx.lineTo(80, 115);
            ctx.stroke();
            
            ctx.fillStyle = '#222222';
            ctx.beginPath();
            ctx.ellipse(25, 115, 45, 20, 10 * Math.PI / 180, 0, Math.PI*2);
            ctx.fill();
            
            ctx.restore();
        }
        
        return canvas;
    },

    createWaterBottleCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Lueur néon verte
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 4;
        
        // Dessin d'une gourde de sport
        // Corps de la gourde (Rouge sport avec bande blanche)
        ctx.fillStyle = '#ff3131';
        ctx.fillRect(10, 10, 12, 18);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 16, 12, 4); // Bande blanche
        
        // Croix verte de soin
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(15, 17, 2, 2);
        ctx.fillRect(14, 18, 4, 1);
        
        // Bouchon
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#111111';
        ctx.fillRect(13, 6, 6, 4); // Goulot
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(14, 3, 4, 3); // Tétine jaune
        
        return canvas;
    }
};

// --- CLASSES ET OBJETS DE JEU ---

// Le Joueur
class Player {
    constructor() {
        this.x = 22.0; // Coordonnées de départ (proche du bas droit)
        this.y = 22.0;
        
        // Vecteur direction (regarde vers le haut/gauche)
        this.dirX = -1.0;
        this.dirY = 0.0;
        
        // Plan de la caméra (perpendiculaire à la direction, définit le FOV ~66°)
        this.planeX = 0.0;
        this.planeY = 0.66;
        
        // Statistiques de classe par défaut (Attaquant)
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 0.1;
        this.shootCooldown = 400; // ms
        this.damage = 25;
        this.staminaRegen = 0.05;
        
        // Barre d'endurance de tir
        this.stamina = 1.0; // De 0.0 à 1.0
        this.lastShootTime = 0;
        
        // États d'animation
        this.kickState = 0; // 0=idle, 1=kick back, 2=kick point, 3=recovery
        this.kickTimer = 0;
        this.bobbing = 0;
        this.isMoving = false;
    }
    
    initClass(type) {
        const pClass = PLAYER_CLASSES[type] || PLAYER_CLASSES.striker;
        this.maxHealth = pClass.maxHealth;
        this.health = this.maxHealth;
        this.speed = pClass.speed;
        this.shootCooldown = pClass.shootCooldown;
        this.damage = pClass.damage;
        this.staminaRegen = pClass.staminaRegen;
        this.stamina = 1.0;
        this.x = 22.0;
        this.y = 22.0;
        this.dirX = -1.0;
        this.dirY = 0.0;
        this.planeX = 0.0;
        this.planeY = 0.66;
        this.kickState = 0;
        this.lastShootTime = 0;
    }
    
    rotate(angle) {
        // Matrice de rotation 2D pour tourner la caméra
        const oldDirX = this.dirX;
        this.dirX = this.dirX * Math.cos(angle) - this.dirY * Math.sin(angle);
        this.dirY = oldDirX * Math.sin(angle) + this.dirY * Math.cos(angle);
        
        const oldPlaneX = this.planeX;
        this.planeX = this.planeX * Math.cos(angle) - this.planeY * Math.sin(angle);
        this.planeY = oldPlaneX * Math.sin(angle) + this.planeY * Math.cos(angle);
    }
    
    shoot() {
        const now = Date.now();
        if (this.health <= 0) return;
        if (now - this.lastShootTime < this.shootCooldown) return;
        if (this.stamina < 0.3) return; // Pas assez d'endurance
        
        this.lastShootTime = now;
        this.stamina -= 0.35; // Coût du tir
        if (this.stamina < 0) this.stamina = 0;
        
        // Déclencher animation du pied
        this.kickState = 1;
        this.kickTimer = now;
        
        // Jouer son de tir
        audio.playKick();
        
        // Lancer la balle après 70ms (moment exact du contact dans l'animation)
        setTimeout(() => {
            if (gameState !== 'playing') return;
            
            // Créer le projectile ballon
            projectiles.push({
                x: this.x + this.dirX * 0.4,
                y: this.y + this.dirY * 0.4,
                dx: this.dirX * 0.28,
                dy: this.dirY * 0.28,
                active: true,
                dist: 0,
                frame: 0,
                damage: this.damage
            });
            
            // Effet d'impulsion de tir (recouvrement)
            this.kickState = 2;
            this.kickTimer = Date.now();
        }, 80);
    }
    
    takeDamage(amount) {
        if (this.health <= 0) return;
        
        // Si défenseur, réduit les dégâts
        if (selectedPlayerClass === 'defender') {
            amount = Math.floor(amount * 0.75);
        }
        
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Flash rouge de dégâts sur l'écran
        const flash = document.getElementById('damage-flash');
        flash.style.backgroundColor = 'rgba(255, 0, 0, 0.45)';
        setTimeout(() => {
            flash.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        }, 120);
        
        // Jouer son de blessure
        audio.playHurt();
        
        // Secouer la caméra (effet de tremblement)
        screenShake = 12;
        
        if (this.health <= 0) {
            triggerGameOver();
        }
    }
    
    update() {
        // Régénération de l'endurance
        if (this.stamina < 1.0) {
            this.stamina += this.staminaRegen;
            if (this.stamina > 1.0) this.stamina = 1.0;
        }
        
        // Gérer les frames d'animation du pied
        if (this.kickState > 0) {
            const now = Date.now();
            const elapsed = now - this.kickTimer;
            
            if (this.kickState === 1 && elapsed > 80) {
                // transition gérée par le setTimeout ci-dessus
            } else if (this.kickState === 2 && elapsed > 100) {
                this.kickState = 3;
                this.kickTimer = now;
            } else if (this.kickState === 3 && elapsed > 100) {
                this.kickState = 0; // Retour à l'état de repos
            }
        }
        
        // Bobbing de la caméra pendant la marche
        if (this.isMoving) {
            this.bobbing += 0.15;
        } else {
            this.bobbing = 0;
        }
    }
}

// Liste des projectiles en jeu
let projectiles = [];

// Liste des entités sprites (Zombies + Objectifs)
let sprites = [];

// --- VARIABLES GLOBALES DE JEU ---
let player = new Player();
let gameState = 'start'; // 'start', 'playing', 'gameover', 'victory'
let selectedPlayerClass = 'striker';
let score = 0;
let killsCount = 0;
let gameStartTime = 0;
let timeElapsed = 0;
let screenShake = 0;
let isPointerLocked = false;
let highScores = [];

const keys = {
    forward: false,
    backward: false,
    strafeLeft: false,
    strafeRight: false,
    rotLeft: false,
    rotRight: false
};

// Canvas principaux
let gameCanvas, ctx;
let minimapCanvas, minimapCtx;
let zBuffer = [];

// Détection de souris
const mouseSensitivity = 0.0025;

// --- INITIALISATION DES CONTROLES ---
function initControls() {
    // Mouvements clavier
    window.addEventListener('keydown', (e) => {
        if (gameState !== 'playing') return;
        
        switch (e.code) {
            case 'KeyW':
            case 'KeyZ': // Z pour AZERTY
            case 'ArrowUp':
                keys.forward = true;
                player.isMoving = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = true;
                player.isMoving = true;
                break;
            case 'KeyA': // A pour pivoter à gauche en AZERTY
                keys.rotLeft = true;
                break;
            case 'KeyQ': // Q pour strafer à gauche en AZERTY
                keys.strafeLeft = true;
                player.isMoving = true;
                break;
            case 'KeyD':
                keys.strafeRight = true;
                player.isMoving = true;
                break;
            case 'KeyE': // E pour pivoter à droite
                keys.rotRight = true;
                break;
            case 'ArrowLeft':
                keys.rotLeft = true;
                break;
            case 'ArrowRight':
                keys.rotRight = true;
                break;
            case 'Space':
                player.shoot();
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW':
            case 'KeyZ':
            case 'ArrowUp':
                keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = false;
                break;
            case 'KeyA':
                keys.rotLeft = false;
                break;
            case 'KeyQ':
                keys.strafeLeft = false;
                break;
            case 'KeyD':
                keys.strafeRight = false;
                break;
            case 'KeyE':
                keys.rotRight = false;
                break;
            case 'ArrowLeft':
                keys.rotLeft = false;
                break;
            case 'ArrowRight':
                keys.rotRight = false;
                break;
        }
        // Vérifier s'il reste des touches de mouvement pressées
        if (!keys.forward && !keys.backward && !keys.strafeLeft && !keys.strafeRight) {
            player.isMoving = false;
        }
    });

    // Clic pour shooter
    const container = document.getElementById('canvas-container');
    container.addEventListener('mousedown', (e) => {
        if (gameState === 'playing') {
            if (document.pointerLockElement === container) {
                player.shoot();
            } else {
                container.requestPointerLock();
            }
        }
    });

    // Mouvement de la souris pour tourner la caméra
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = (document.pointerLockElement === container);
    });

    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked && gameState === 'playing') {
            const rotSpeed = -e.movementX * mouseSensitivity;
            player.rotate(rotSpeed);
        }
    });
}

// --- GESTION DES ZOMBIES (IA & SPAWN) ---
function spawnZombies() {
    sprites = [];
    killsCount = 0;
    
    // 1. Placer le téléphone / cabine téléphonique en position (1.5, 1.5) tout en haut à gauche
    sprites.push({
        x: 1.5,
        y: 1.5,
        type: 'phone',
        active: true,
        texture: spritesGen.phone
    });
    
    // Spawns coordonnés des zombies (sur des cases de MAP valant 0)
    const spawnPoints = [
        { x: 3.5, y: 7.5, type: 'normal' },
        { x: 5.5, y: 3.5, type: 'runner' },
        { x: 2.5, y: 15.5, type: 'normal' },
        { x: 8.5, y: 2.5, type: 'tank' },
        { x: 12.5, y: 8.5, type: 'normal' },
        { x: 21.5, y: 3.5, type: 'runner' },
        { x: 14.5, y: 6.5, type: 'normal' },
        { x: 15.5, y: 12.5, type: 'normal' },
        { x: 12.5, y: 16.5, type: 'runner' },
        { x: 6.5, y: 21.5, type: 'tank' },
        { x: 3.5, y: 20.5, type: 'normal' },
        { x: 10.5, y: 22.5, type: 'normal' },
        { x: 18.5, y: 21.5, type: 'tank' },
        { x: 21.5, y: 18.5, type: 'runner' },
        // Quelques zombies proches du but pour corser le final
        { x: 2.5, y: 3.5, type: 'runner' },
        { x: 4.5, y: 2.5, type: 'tank' },
        { x: 6.5, y: 1.5, type: 'normal' }
    ];
    
    spawnPoints.forEach((sp, idx) => {
        let hp = 30;
        let speed = 0.025;
        let damage = 15;
        
        if (sp.type === 'runner') {
            hp = 15;
            speed = 0.055;
            damage = 10;
        } else if (sp.type === 'tank') {
            hp = 85;
            speed = 0.015;
            damage = 30;
        }
        
        sprites.push({
            id: idx + 1,
            x: sp.x,
            y: sp.y,
            type: sp.type,
            active: true,
            health: hp,
            maxHealth: hp,
            speed: speed,
            damage: damage,
            lastAttackTime: 0,
            isHurt: false,
            hurtTimer: 0,
            animFrame: 0,
            animTimer: 0
        });
    });
}

function updateZombiesAndProjectiles() {
    const now = Date.now();
    
    // 1. Mettre à jour les projectiles (ballons de foot)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p.active) continue;
        
        // Déplacement
        const nextX = p.x + p.dx;
        const nextY = p.y + p.dy;
        
        // Collision avec les murs de la MAP
        const mapX = Math.floor(nextX);
        const mapY = Math.floor(nextY);
        
        if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE || MAP[mapY][mapX] > 0) {
            p.active = false;
            projectiles.splice(i, 1);
            continue;
        }
        
        p.x = nextX;
        p.y = nextY;
        p.dist += Math.sqrt(p.dx*p.dx + p.dy*p.dy);
        
        // Animation de rotation (changement de frame)
        if (Math.random() < 0.6) {
            p.frame = (p.frame + 1) % 4;
        }
        
        // Supprimer si trop loin
        if (p.dist > 15.0) {
            p.active = false;
            projectiles.splice(i, 1);
            continue;
        }
        
        // Collision projectile / zombies
        for (let j = 0; j < sprites.length; j++) {
            const spr = sprites[j];
            if (spr.type === 'phone' || !spr.active) continue;
            
            // Distance 2D
            const dist = Math.sqrt((p.x - spr.x)*(p.x - spr.x) + (p.y - spr.y)*(p.y - spr.y));
            if (dist < 0.45) { // Hitbox zombie
                spr.health -= p.damage;
                spr.isHurt = true;
                spr.hurtTimer = now;
                
                audio.playHit();
                
                // Détruire le ballon
                p.active = false;
                projectiles.splice(i, 1);
                
                // Mort du zombie
                if (spr.health <= 0) {
                    spr.active = false;
                    killsCount++;
                    
                    // Gain de score
                    let pts = 100;
                    if (spr.type === 'runner') pts = 200;
                    else if (spr.type === 'tank') pts = 400;
                    score += pts;
                    
                    audio.playGroan();

                    // Regagner de la vie directement lors du kill (+5 PV)
                    player.health = Math.min(player.maxHealth, player.health + 5);

                    // Chance de drop une gourde de soin au sol (40% de chance)
                    if (Math.random() < 0.40) {
                        sprites.push({
                            x: spr.x,
                            y: spr.y,
                            type: 'health',
                            active: true,
                            texture: spritesGen.waterBottle
                        });
                    }
                }
                break; // Sortir de la boucle zombies pour ce projectile
            }
        }
    }
    
    // 2. Mettre à jour les zombies (IA & attaques)
    for (let i = 0; i < sprites.length; i++) {
        const spr = sprites[i];
        if (spr.type === 'phone' || !spr.active) continue;
        
        // Réinitialiser effet dégât clignotant rouge après 150ms
        if (spr.isHurt && now - spr.hurtTimer > 150) {
            spr.isHurt = false;
        }
        
        // Distance joueur-zombie
        const dist = Math.sqrt((player.x - spr.x)*(player.x - spr.x) + (player.y - spr.y)*(player.y - spr.y));
        
        // Si le joueur est à portée visuelle/auditive
        if (dist < 13.0) {
            // Son de râle zombie aléatoire
            if (Math.random() < 0.003) {
                audio.playGroan();
            }
            
            // Vecteur direction vers le joueur
            const dx = player.x - spr.x;
            const dy = player.y - spr.y;
            
            // Normalisation
            const nextZX = spr.x + (dx / dist) * spr.speed;
            const nextZY = spr.y + (dy / dist) * spr.speed;
            
            // Déplacement avec glissement de mur simple
            if (MAP[Math.floor(spr.y)][Math.floor(nextZX)] === 0) {
                spr.x = nextZX;
            }
            if (MAP[Math.floor(nextZY)][Math.floor(spr.x)] === 0) {
                spr.y = nextZY;
            }
            
            // Animation marche
            if (now - spr.animTimer > 250) {
                spr.animFrame = (spr.animFrame + 1) % 2;
                spr.animTimer = now;
            }
            
            // Attaque si très proche (tacle)
            if (dist < 0.6 && now - spr.lastAttackTime > 1000) {
                spr.lastAttackTime = now;
                player.takeDamage(spr.damage);
            }
        }
    }
}

// --- RENDU 3D RAYCASTER ---
function render3D() {
    // 1. Nettoyer et dessiner le sol (gazon vert rétro) et le ciel (stade de nuit)
    const floorGrad = ctx.createLinearGradient(0, gameCanvas.height/2, 0, gameCanvas.height);
    floorGrad.addColorStop(0, '#102008'); // Vert sombre au loin
    floorGrad.addColorStop(1, '#2c5918'); // Gazon vert fluo près du joueur
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, gameCanvas.height/2, gameCanvas.width, gameCanvas.height/2);
    
    const skyGrad = ctx.createLinearGradient(0, 0, 0, gameCanvas.height/2);
    skyGrad.addColorStop(0, '#020307'); // Ciel noir spatial
    skyGrad.addColorStop(0.7, '#0c0f1e'); // Bleu nuit
    skyGrad.addColorStop(1, '#1b1b3a'); // Ligne d'horizon avec projecteurs flous
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height/2);
    
    // Dessiner de faux projecteurs de stade à l'horizon
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(100, 0); ctx.lineTo(130, 200); ctx.lineTo(70, 200); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(300, 0); ctx.lineTo(340, 200); ctx.lineTo(260, 200); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(520, 0); ctx.lineTo(550, 200); ctx.lineTo(490, 200); ctx.fill();

    // Appliquer le tremblement d'écran (screen shake) si présent
    ctx.save();
    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake--;
    }

    // 2. RAYCASTING POUR CHAQUE COLONNE VERTICALE DU CANVAS
    const w = gameCanvas.width;
    const h = gameCanvas.height;
    
    for (let x = 0; x < w; x++) {
        // Coordonnée X de la caméra de -1 (gauche) à +1 (droite)
        const cameraX = 2 * x / w - 1;
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;
        
        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);
        
        let sideDistX, sideDistY;
        
        // Distance entre 2 lignes X ou Y consécutives du rayon
        const deltaDistX = (rayDirX === 0) ? Infinity : Math.abs(1 / rayDirX);
        const deltaDistY = (rayDirY === 0) ? Infinity : Math.abs(1 / rayDirY);
        let perpWallDist;
        
        let stepX, stepY;
        let hit = 0;
        let side; // 0 pour mur Est/Ouest, 1 pour Nord/Sud
        
        // Direction du pas
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (player.x - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (player.y - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }
        
        // Algorithme DDA (Digital Differential Analysis)
        while (hit === 0) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            // Limites de map
            if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) {
                hit = 1; // Mur virtuel par défaut
                break;
            }
            if (MAP[mapY][mapX] > 0) {
                hit = MAP[mapY][mapX];
            }
        }
        
        // Calculer la distance au mur projetée sur la direction de la caméra
        if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
        else            perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
        
        // Prévenir division par zéro
        if (perpWallDist <= 0) perpWallDist = 0.01;
        
        // Enregistrer la distance dans le Z-Buffer pour les sprites
        zBuffer[x] = perpWallDist;
        
        // Calculer la hauteur de la ligne à dessiner à l'écran
        const lineHeight = Math.floor(h / perpWallDist);
        
        // Calculer les bornes de dessin verticales
        let drawStart = Math.floor(-lineHeight / 2 + h / 2);
        if (drawStart < 0) drawStart = 0;
        let drawEnd = Math.floor(lineHeight / 2 + h / 2);
        if (drawEnd >= h) drawEnd = h - 1;
        
        // Texturage du mur
        const texNum = hit - 1;
        const tex = textures[texNum] || textures[0];
        
        // Déterminer la coordonnée X exacte de collision sur le mur
        let wallX;
        if (side === 0) wallX = player.y + perpWallDist * rayDirY;
        else            wallX = player.x + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);
        
        // Coordonnée X de la texture (adaptée dynamiquement à sa largeur)
        const texWidth = tex.width;
        let texX = Math.floor(wallX * texWidth);
        if (side === 0 && rayDirX > 0) texX = texWidth - texX - 1;
        if (side === 1 && rayDirY < 0) texX = texWidth - texX - 1;
        texX = Math.max(0, Math.min(texWidth - 1, texX));
        
        // Dessiner le bandeau vertical de 1px de large
        ctx.drawImage(
            tex,
            texX, 0, 1, tex.height, // Source
            x, drawStart, 1, (drawEnd - drawStart) // Cible
        );
        
        // Ombrage rétro : Murs Nord/Sud légèrement plus sombres et assombrissement avec la distance
        let shade = 0;
        if (side === 1) shade += 0.25; // assombrir côté NS
        
        // Effet de brouillard/distance linéaire
        const distFade = Math.min(0.85, perpWallDist * 0.065);
        const finalShade = Math.max(shade, distFade);
        
        if (finalShade > 0) {
            ctx.fillStyle = `rgba(3, 4, 8, ${finalShade})`;
            ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
        }
    }
    
    // 3. RENDU DES SPRITES (Zombies, Projectiles, Téléphone)
    // Combiner les sprites des zombies et les ballons de foot lancés
    let activeSprites = [];
    
    // Téléphone et zombies
    sprites.forEach(s => {
        if (s.active) {
            let tex = s.texture;
            if (s.type !== 'phone') {
                // Déterminer la texture animée
                const isHurt = s.isHurt;
                const frame = s.animFrame;
                if (s.type === 'normal') {
                    tex = isHurt ? spritesGen.zombieNormalHurt : (frame === 0 ? spritesGen.zombieNormalWalk1 : spritesGen.zombieNormalWalk2);
                } else if (s.type === 'runner') {
                    tex = isHurt ? spritesGen.zombieRunnerHurt : (frame === 0 ? spritesGen.zombieRunnerWalk1 : spritesGen.zombieRunnerWalk2);
                } else if (s.type === 'tank') {
                    tex = isHurt ? spritesGen.zombieTankHurt : (frame === 0 ? spritesGen.zombieTankWalk1 : spritesGen.zombieTankWalk2);
                }
            }
            activeSprites.push({
                x: s.x,
                y: s.y,
                texture: tex,
                type: s.type
            });
        }
    });
    
    // Projectiles
    projectiles.forEach(p => {
        if (p.active) {
            // Texture du ballon pivoté
            let tex = spritesGen.football1;
            if (p.frame === 1) tex = spritesGen.football2;
            else if (p.frame === 2) tex = spritesGen.football3;
            else if (p.frame === 3) tex = spritesGen.football4;
            
            activeSprites.push({
                x: p.x,
                y: p.y,
                texture: tex,
                type: 'ball'
            });
        }
    });
    
    // Trier les sprites du plus éloigné au plus proche pour un rendu correct en profondeur (Painter's Algorithm)
    const sortedSprites = activeSprites.map((s, index) => {
        const dist = ((player.x - s.x)*(player.x - s.x) + (player.y - s.y)*(player.y - s.y));
        return { sprite: s, dist: dist };
    });
    
    sortedSprites.sort((a, b) => b.dist - a.dist);
    
    // Projeter et dessiner chaque sprite trié
    sortedSprites.forEach(item => {
        const s = item.sprite;
        
        // Coordonnées du sprite par rapport à la caméra du joueur
        const spriteX = s.x - player.x;
        const spriteY = s.y - player.y;
        
        // Matrice de transformation caméra inverse
        const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        
        const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY); // Profondeur (distance Z)
        
        // Si le sprite est derrière l'écran, on ne dessine pas
        if (transformY <= 0.1) return;
        
        // Position X du sprite sur l'écran
        const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
        
        // Hauteur et largeur du sprite à l'écran (inversement proportionnel à la distance)
        let spriteHeight = Math.abs(Math.floor(h / transformY));
        
        // Facteurs d'échelle spécifiques pour les types de sprites
        let scale = 1.0;
        let yOffset = 0; // Ajustement sur le plan vertical (au sol)
        
        if (s.type === 'ball') {
            scale = 0.35; // Le ballon est plus petit
            yOffset = Math.floor(h * 0.15 / transformY); // Fait voler légèrement le ballon
        } else if (s.type === 'phone') {
            // La cabine téléphonique est plus grande et flotte/oscille légèrement (effet arcade)
            scale = 1.15;
            yOffset = Math.floor((Math.sin(Date.now() * 0.005) * 5) / transformY);
        }
        
        spriteHeight = Math.floor(spriteHeight * scale);
        let spriteWidth = spriteHeight; // Sprites carrés par défaut
        
        let drawStartY = Math.floor(-spriteHeight / 2 + h / 2 - yOffset);
        if (drawStartY < 0) drawStartY = 0;
        let drawEndY = Math.floor(spriteHeight / 2 + h / 2 - yOffset);
        if (drawEndY >= h) drawEndY = h - 1;
        
        let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
        if (drawStartX < 0) drawStartX = 0;
        let drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);
        if (drawEndX >= w) drawEndX = w - 1;
        
        // Dessiner le sprite colonne par colonne en vérifiant le Z-Buffer
        for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
            const texX = Math.floor(256 * (stripe - (-spriteWidth / 2 + spriteScreenX)) * s.texture.width / spriteWidth) / 256;
            const intTexX = Math.floor(texX);
            
            if (intTexX >= 0 && intTexX < s.texture.width) {
                // Z-buffer check (Le sprite est-il devant le mur et en face ?)
                if (transformY < zBuffer[stripe]) {
                    ctx.drawImage(
                        s.texture,
                        intTexX, 0, 1, s.texture.height, // Source 1px
                        stripe, drawStartY, 1, (drawEndY - drawStartY) // Cible
                    );
                    
                    // Ombrage de distance pour le sprite (comme pour les murs)
                    const distFade = Math.min(0.85, transformY * 0.065);
                    if (distFade > 0) {
                        ctx.fillStyle = `rgba(3, 4, 8, ${distFade})`;
                        ctx.fillRect(stripe, drawStartY, 1, drawEndY - drawStartY);
                    }
                }
            }
        }
    });

    // 4. RENDU DE L'ARME (Pied de footballeur)
    // Légère oscillation du pied avec la marche
    let bobX = 0;
    let bobY = 0;
    if (player.isMoving) {
        bobX = Math.sin(player.bobbing) * 8;
        bobY = Math.cos(player.bobbing * 2) * 8;
    }
    
    let weaponTex = spritesGen.playerFootIdle;
    if (player.kickState === 1) weaponTex = spritesGen.playerFootKick1;
    else if (player.kickState === 2) weaponTex = spritesGen.playerFootKick2;
    else if (player.kickState === 3) weaponTex = spritesGen.playerFootKick3;
    
    // Dessiner le pied sur le canvas principal
    // Centré en bas de l'écran par défaut
    const weaponW = 200;
    const weaponH = 200;
    const weaponX = Math.floor(w / 2 - weaponW / 2 + 10 + bobX);
    const weaponY = Math.floor(h - weaponH + 20 + bobY);
    
    ctx.drawImage(weaponTex, weaponX, weaponY, weaponW, weaponH);

    ctx.restore(); // Restaurer après screen shake
}

// --- RADAR / MINICARTE ---
function renderMinimap() {
    minimapCtx.fillStyle = '#05060b';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    const tileSize = minimapCanvas.width / MAP_SIZE;
    
    // 1. Dessiner les murs connus
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (MAP[y][x] > 0) {
                // Mur
                minimapCtx.fillStyle = '#1b233a';
                minimapCtx.fillRect(x * tileSize, y * tileSize, tileSize - 0.5, tileSize - 0.5);
            }
        }
    }
    
    // 2. Dessiner le téléphone / cabine téléphonique en jaune clignotant
    const phone = sprites.find(s => s.type === 'phone');
    if (phone && phone.active) {
        minimapCtx.fillStyle = (Math.floor(Date.now() / 250) % 2 === 0) ? '#ffea00' : '#887c00';
        minimapCtx.beginPath();
        minimapCtx.arc(phone.x * tileSize, phone.y * tileSize, 3.5, 0, Math.PI*2);
        minimapCtx.fill();
    }
    
    // 3. Dessiner les zombies actifs en rouge
    sprites.forEach(s => {
        if (s.active && s.type !== 'phone') {
            // Distance au joueur
            const dist = Math.sqrt((player.x - s.x)*(player.x - s.x) + (player.y - s.y)*(player.y - s.y));
            // Ne s'affiche sur le radar que s'il est proche (effet détection radar)
            if (dist < 10) {
                minimapCtx.fillStyle = '#ff3131';
                minimapCtx.fillRect(s.x * tileSize - 1.5, s.y * tileSize - 1.5, 3, 3);
            }
        }
    });
    
    // 4. Dessiner le joueur en cyan avec cône de vision
    minimapCtx.fillStyle = '#00f3ff';
    minimapCtx.beginPath();
    minimapCtx.arc(player.x * tileSize, player.y * tileSize, 3, 0, Math.PI*2);
    minimapCtx.fill();
    
    // Cône directionnel
    minimapCtx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    minimapCtx.lineWidth = 1;
    minimapCtx.beginPath();
    minimapCtx.moveTo(player.x * tileSize, player.y * tileSize);
    minimapCtx.lineTo((player.x + player.dirX * 2) * tileSize, (player.y + player.dirY * 2) * tileSize);
    minimapCtx.stroke();
}

// --- LOGIQUE METIER DU JEU ---

function handlePlayerMovement() {
    if (player.health <= 0) return;
    
    let dx = 0;
    let dy = 0;
    
    if (keys.forward) {
        dx += player.dirX * player.speed;
        dy += player.dirY * player.speed;
    }
    if (keys.backward) {
        dx -= player.dirX * player.speed;
        dy -= player.dirY * player.speed;
    }
    if (keys.strafeLeft) {
        // Décalage latéral orthogonal
        dx -= player.planeX * player.speed;
        dy -= player.planeY * player.speed;
    }
    if (keys.strafeRight) {
        dx += player.planeX * player.speed;
        dy += player.planeY * player.speed;
    }
    
    // Pivoter via touches clavier A / E ou Flèches gauche/droite
    const rotSpeed = 0.045;
    if (keys.rotLeft) {
        player.rotate(rotSpeed);
    }
    if (keys.rotRight) {
        player.rotate(-rotSpeed);
    }
    
    // Collision avec glissement : vérifier X et Y séparément
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (MAP[Math.floor(player.y)][Math.floor(newX)] === 0) {
        player.x = newX;
    }
    if (MAP[Math.floor(newY)][Math.floor(player.x)] === 0) {
        player.y = newY;
    }
    
    // Vérifier distance à la cabine téléphonique (Objectif)
    const phone = sprites.find(s => s.type === 'phone');
    if (phone) {
        const distToPhone = Math.sqrt((player.x - phone.x)*(player.x - phone.x) + (player.y - phone.y)*(player.y - phone.y));
        
        // Mettre à jour l'indicateur de distance dans le HUD
        const distVal = document.getElementById('dist-val');
        distVal.textContent = Math.max(0, Math.floor(distToPhone * 3)); // Facteur d'échelle mètres
        
        // Si le joueur touche la cabine -> Victoire !
        if (distToPhone < 1.0) {
            triggerVictory();
        }
    }

    // Vérifier collision avec les gourdes de soin (items au sol)
    for (let i = 0; i < sprites.length; i++) {
        const spr = sprites[i];
        if (spr.type === 'health' && spr.active) {
            const dist = Math.sqrt((player.x - spr.x)*(player.x - spr.x) + (player.y - spr.y)*(player.y - spr.y));
            if (dist < 0.75) {
                // Ramasser la gourde
                spr.active = false;
                
                // Soigner le joueur (+20 PV)
                player.health = Math.min(player.maxHealth, player.health + 20);
                
                // Effet sonore de soin
                audio.playHeal();
                
                // Gain de score
                score += 150;
                
                // Flash vert de soin à l'écran
                const flash = document.getElementById('damage-flash');
                flash.style.backgroundColor = 'rgba(57, 255, 20, 0.35)'; // Vert fluo arcade
                setTimeout(() => {
                    flash.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                }, 120);
            }
        }
    }
}

// --- BOUTON DE CHANGEMENT D'ECRANS & INTERFACE ---

function selectPlayer(playerType) {
    selectedPlayerClass = playerType;
    
    // Mettre à jour les styles des cartes
    document.querySelectorAll('.player-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.player === playerType) {
            card.classList.add('selected');
        }
    });
}

function updateHUD() {
    // Score
    const scoreVal = String(score).padStart(6, '0');
    document.getElementById('hud-score').textContent = scoreVal;
    
    // Barre de Santé
    const hpPercent = Math.max(0, (player.health / player.maxHealth) * 100);
    document.getElementById('hud-health-fill').style.width = `${hpPercent}%`;
    
    // Alerte visuelle de santé basse
    if (hpPercent < 30) {
        document.getElementById('hud-health-fill').style.backgroundColor = 'var(--neon-red)';
    } else {
        document.getElementById('hud-health-fill').style.backgroundColor = '';
    }
    
    // Barre d'endurance de tir
    const staminaPercent = player.stamina * 100;
    document.getElementById('hud-stamina-fill').style.width = `${staminaPercent}%`;
    
    // Couleur d'endurance
    if (staminaPercent < 30) {
        document.getElementById('hud-stamina-fill').style.backgroundColor = '#b0bec5';
    } else {
        document.getElementById('hud-stamina-fill').style.backgroundColor = '';
    }
}

function loadHighScores() {
    try {
        const data = localStorage.getItem('zombie_stadium_scores');
        if (data) {
            highScores = JSON.parse(data);
        } else {
            highScores = [
                { name: "CR7", score: 8000 },
                { name: "LIO", score: 6500 },
                { name: "ZIZ", score: 4500 },
                { name: "PSG", score: 2500 },
                { name: "OM_", score: 1000 }
            ];
            saveHighScores();
        }
    } catch (e) {
        // Fallback en mémoire si localStorage est indisponible (ex: file:// restrictif)
        highScores = [
            { name: "CR7", score: 8000 },
            { name: "LIO", score: 6500 },
            { name: "ZIZ", score: 4500 },
            { name: "PSG", score: 2500 },
            { name: "OM_", score: 1000 }
        ];
    }
}

function saveHighScores() {
    try {
        localStorage.setItem('zombie_stadium_scores', JSON.stringify(highScores));
    } catch (e) {
        // Ignorer si localStorage est bloqué
    }
}

function updateHighScoresTable() {
    const list = document.getElementById('high-scores-list');
    list.innerHTML = '';
    
    // Prendre les 5 meilleurs
    const sorted = [...highScores].sort((a,b) => b.score - a.score).slice(0, 5);
    sorted.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${entry.name}</span> <span>${entry.score} pts</span>`;
        list.appendChild(li);
    });
}

function checkAndAddHighScore() {
    // Demander le pseudo dans une boîte rétro arcade
    let name = prompt("NOUVEAU HIGH SCORE ! Entrez vos initiales (3 lettres) :", "AAA");
    if (!name) name = "AAA";
    name = name.toUpperCase().slice(0, 3);
    
    highScores.push({ name: name, score: score });
    highScores.sort((a,b) => b.score - a.score);
    highScores = highScores.slice(0, 5); // Conserver uniquement le top 5
    
    saveHighScores();
    updateHighScoresTable();
}

// Transitions d'écrans
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => {
        scr.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function startNewGame() {
    audio.init();
    audio.startMusic();
    
    player.initClass(selectedPlayerClass);
    score = 0;
    killsCount = 0;
    projectiles = [];
    
    // Réinitialiser les touches enfoncées
    Object.keys(keys).forEach(k => keys[k] = false);
    
    spawnZombies();
    
    gameState = 'playing';
    gameStartTime = Date.now();
    
    showScreen('game-screen');
    
    // Demander Pointer Lock directement
    document.getElementById('canvas-container').requestPointerLock();
}

function triggerGameOver() {
    gameState = 'gameover';
    audio.stopMusic();
    audio.playLose();
    
    // Libérer le pointeur de souris
    document.exitPointerLock();
    
    document.getElementById('go-score').textContent = score;
    document.getElementById('go-kills').textContent = killsCount;
    
    showScreen('gameover-screen');
}

function triggerVictory() {
    gameState = 'victory';
    audio.stopMusic();
    audio.playWin();
    
    document.exitPointerLock();
    
    timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Bonus de score pour le temps restant/écoulé rapide
    const timeBonus = Math.max(0, 5000 - timeElapsed * 30);
    score += timeBonus;
    
    document.getElementById('vic-time').textContent = timeElapsed;
    document.getElementById('vic-score').textContent = score;
    document.getElementById('vic-kills').textContent = killsCount;
    
    showScreen('victory-screen');
    
    // Ajouter au tableau des scores si qualifié
    setTimeout(() => {
        checkAndAddHighScore();
    }, 500);
}

// --- BOUCLE PRINCIPALE DE JEU (RequestAnimationFrame) ---
function gameLoop() {
    if (gameState === 'playing') {
        handlePlayerMovement();
        player.update();
        updateZombiesAndProjectiles();
        
        render3D();
        renderMinimap();
        updateHUD();
    }
    
    requestAnimationFrame(gameLoop);
}

// --- CODE AU CHARGEMENT DE LA PAGE ---
window.addEventListener('DOMContentLoaded', () => {
    gameCanvas = document.getElementById('game-canvas');
    ctx = gameCanvas.getContext('2d');
    
    minimapCanvas = document.getElementById('minimap-canvas');
    minimapCtx = minimapCanvas.getContext('2d');
    
    // Initialiser les textures procedurale en cache
    spritesGen.init();
    
    // Charger le tableau des scores
    loadHighScores();
    
    // Configurer contrôles
    initControls();
    
    // Choix du joueur
    document.querySelectorAll('.player-card').forEach(card => {
        card.addEventListener('click', () => {
            selectPlayer(card.dataset.player);
            // Son d'activation lors de la sélection du joueur
            audio.init();
            audio.playKick();
        });
    });
    
    // Boutons de navigation
    document.getElementById('btn-play').addEventListener('click', startNewGame);
    document.getElementById('btn-retry').addEventListener('click', startNewGame);
    document.getElementById('btn-restart').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    // Bouton CRT
    const btnCrt = document.getElementById('btn-crt');
    const crtOverlay = document.getElementById('crt-overlay');
    const scanlineOverlay = document.getElementById('scanline-overlay');
    btnCrt.addEventListener('click', () => {
        if (crtOverlay.classList.contains('crt-on')) {
            crtOverlay.classList.remove('crt-on');
            scanlineOverlay.style.display = 'none';
            btnCrt.style.borderColor = '#3b4263';
        } else {
            crtOverlay.classList.add('crt-on');
            scanlineOverlay.style.display = 'block';
            btnCrt.style.borderColor = 'var(--neon-cyan)';
        }
    });
    
    // Bouton Mute
    const btnMute = document.getElementById('btn-mute');
    btnMute.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        btnMute.textContent = isMuted ? '🔇' : '🔊';
        if (isMuted) {
            btnMute.style.borderColor = '#3b4263';
        } else {
            btnMute.style.borderColor = 'var(--neon-cyan)';
        }
    });
    
    // Lancer la boucle principale
    requestAnimationFrame(gameLoop);
});
