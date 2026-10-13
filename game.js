'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const hexA = (hex, a) => {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
};

// ── Power-ups ─────────────────────────────────────────────────────────────────
const POWERUPS = {
  speed:  { duration: 5, color: '#4df',     label: 'VELOCIDAD' },
  shield: { duration: 6, color: '#7dffa0',  label: 'ESCUDO' },
};
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_TYPES = ['speed', 'shield'];

function pickPowerUpType() {
  return POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
}

// ── Skins de nave ─────────────────────────────────────────────────────────────
const SKIN_STORAGE_KEY = 'asteroids.skin';

const SKINS = [
  {
    name: 'CLASICA',
    flame: [-8, 0],
    draw(c, color) {
      c.strokeStyle = color;
      c.lineWidth   = 1.5;
      c.beginPath();
      c.moveTo( 20,  0);   // nariz
      c.lineTo(-12, -9);   // ala izquierda
      c.lineTo( -7,  0);   // muesca trasera
      c.lineTo(-12,  9);   // ala derecha
      c.closePath();
      c.stroke();
    },
  },
  {
    name: 'FLECHA',
    flame: [-6, 0],
    draw(c, color) {
      c.strokeStyle = color;
      c.lineWidth   = 1.5;
      c.beginPath();
      c.moveTo( 22,  0);   // punta
      c.lineTo(-14, -10);  // ala izquierda barrida
      c.lineTo( -6,  0);   // muesca
      c.lineTo(-14,  10);  // ala derecha barrida
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(  8, 0);
      c.lineTo(-10, 0);
      c.stroke();
    },
  },
  {
    name: 'HALCON',
    flame: [-9, 0],
    flameColor: 'rgba(255, 140, 40, 0.9)',
    draw(c, color) {
      // Casco: delta angular con cola doble
      c.beginPath();
      c.moveTo( 24,   0);   // morro
      c.lineTo( -8, -10);   // ala izquierda
      c.lineTo(-17, -13);   // punta ala izquierda
      c.lineTo(-11,  -3);   // muesca cola izq
      c.lineTo(-18,   0);   // cola centro
      c.lineTo(-11,   3);   // muesca cola der
      c.lineTo(-17,  13);   // punta ala derecha
      c.lineTo( -8,  10);   // ala derecha
      c.closePath();
      c.fillStyle = hexA(color, 0.12);
      c.fill();
      c.strokeStyle = color;
      c.lineWidth   = 1.6;
      c.stroke();

      // Cabina (rombo) con acento cian
      c.beginPath();
      c.moveTo( 12,  0);
      c.lineTo(  5, -3);
      c.lineTo(  1,  0);
      c.lineTo(  5,  3);
      c.closePath();
      c.fillStyle = hexA('#7ef9ff', 0.85);
      c.fill();

      // Línea de panel central
      c.beginPath();
      c.moveTo(  1, 0);
      c.lineTo(-16, 0);
      c.strokeStyle = hexA('#7ef9ff', 0.5);
      c.lineWidth   = 1;
      c.stroke();
    },
  },
  {
    name: 'NOVA',
    flame: [-12, 0],
    flameColor: 'rgba(170, 120, 255, 0.9)',
    draw(c, color) {
      c.lineCap = 'round';
      const hull = () => {
        c.beginPath();
        c.moveTo( 20,   0);                      // morro romo
        c.quadraticCurveTo(  6, -14, -10, -12);  // flanco superior
        c.quadraticCurveTo(-18, -10, -16,   0);  // popa superior
        c.quadraticCurveTo(-18,  10, -10,  12);  // popa inferior
        c.quadraticCurveTo(  6,  14,  20,   0);  // flanco inferior
        c.closePath();
      };

      // Relleno + doble contorno neón (en capas, sin shadowBlur)
      hull();
      c.fillStyle = hexA(color, 0.10);
      c.fill();
      c.strokeStyle = hexA(color, 0.18);
      c.lineWidth   = 3.5;
      c.stroke();
      hull();
      c.strokeStyle = color;
      c.lineWidth   = 1.4;
      c.stroke();

      // Cabina con acento violeta
      c.beginPath();
      c.arc(9, 0, 3.2, 0, Math.PI * 2);
      c.fillStyle = hexA('#c77dff', 0.85);
      c.fill();

      // Toberas traseras
      for (const y of [-4.5, 4.5]) {
        c.beginPath();
        c.arc(-13, y, 2.6, 0, Math.PI * 2);
        c.strokeStyle = hexA('#c77dff', 0.9);
        c.lineWidth   = 1.2;
        c.stroke();
      }
    },
  },
  {
    name: 'ESPECTRO',
    flame: [-7, 0],
    flameColor: 'rgba(155, 255, 207, 0.85)',
    draw(c, color) {
      const wing = (dx, alpha, lw) => {
        c.save();
        c.translate(dx, 0);
        c.beginPath();
        c.moveTo( 24,   0);   // morro
        c.lineTo(-15, -10);   // punta izquierda
        c.lineTo( -2,   0);   // muesca trasera
        c.lineTo(-15,  10);   // punta derecha
        c.closePath();
        c.fillStyle = hexA(color, alpha * 0.15);
        c.fill();
        c.strokeStyle = hexA(color, alpha);
        c.lineWidth   = lw;
        c.stroke();
        c.restore();
      };

      // Eco translúcido hacia atrás
      wing(-6, 0.15, 1);
      wing(-3, 0.30, 1.2);
      wing( 0, 1.00, 1.5);

      // Borde de ataque con acento menta
      c.beginPath();
      c.moveTo( 24, 0);
      c.lineTo(-15, -10);
      c.moveTo( 24, 0);
      c.lineTo(-15,  10);
      c.strokeStyle = hexA('#9bffcf', 0.7);
      c.lineWidth   = 1.2;
      c.stroke();
    },
  },
];

let skinIndex = 0;

function loadSkin() {
  try {
    const v = parseInt(localStorage.getItem(SKIN_STORAGE_KEY), 10);
    if (Number.isInteger(v) && v >= 0 && v < SKINS.length) skinIndex = v;
  } catch (e) { /* localStorage no disponible */ }
}

function saveSkin() {
  try { localStorage.setItem(SKIN_STORAGE_KEY, String(skinIndex)); } catch (e) { /* ignorar */ }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const SHOOTING_STAR = {
  radius:    14,
  speedMult: 3,
  ttl:       7,
  points:    150,
  color:     '#ffdf6b',
  glow:      '#7df9ff',
};

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x     = x;
    this.y     = y;
    this.type  = type;
    this.radius = 14;
    this.dead  = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rot = 0;
    this.rotSpeed = rand(-1, 1);
    this.ttl = 12;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const color = POWERUPS[this.type].color;
    const pulse = 1 + Math.sin(this.rot * 3) * 0.12;

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Glifo según el tipo
    ctx.rotate(Math.sin(this.rot) * 0.2);
    ctx.beginPath();
    if (this.type === 'shield') {
      ctx.moveTo( 0, -8);
      ctx.lineTo( 6, -4);
      ctx.lineTo( 6,  2);
      ctx.lineTo( 0,  8);
      ctx.lineTo(-6,  2);
      ctx.lineTo(-6, -4);
      ctx.closePath();
    } else {
      ctx.moveTo( 3, -8);
      ctx.lineTo(-4,  1);
      ctx.lineTo( 0,  1);
      ctx.lineTo(-3,  8);
      ctx.lineTo( 4, -1);
      ctx.lineTo( 0, -1);
      ctx.closePath();
    }
    ctx.stroke();

    ctx.restore();
  }
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class ShootingStar {
  constructor(x, y, angle) {
    this.x      = x;
    this.y      = y;
    this.size   = 1;
    this.radius = SHOOTING_STAR.radius;
    this.points = SHOOTING_STAR.points;
    this.dead   = false;

    const speed = SPEEDS[3] * SHOOTING_STAR.speedMult + rand(-10, 10);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.angle = angle;

    this.ttl  = SHOOTING_STAR.ttl;
    this.life = SHOOTING_STAR.ttl;
    this.rot  = 0;
    this.sparkTimer = 0;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += dt;

    // Chispas que deja a su paso
    this.sparkTimer -= dt;
    if (this.sparkTimer <= 0 && this.ttl > 0.6) {
      this.sparkTimer = 0.03;
      particles.push(new Particle(
        this.x - Math.cos(this.angle) * rand(0, 26),
        this.y - Math.sin(this.angle) * rand(0, 26),
        SHOOTING_STAR.glow,
      ));
    }

    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      explode(this.x, this.y, 20);
    }
  }

  split() { return []; }

  draw() {
    const fade  = this.ttl < 1.5 ? this.ttl / 1.5 : 1;
    const blink = this.ttl < 1.5 && Math.floor(this.ttl * 14) % 2 === 0 ? 0.35 : 1;
    const alpha = fade * blink;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Cola de cometa (contraria al movimiento)
    const tailLen = this.radius + 40;
    const bx = -Math.cos(this.angle);
    const by = -Math.sin(this.angle);
    const grad = ctx.createLinearGradient(0, 0, bx * tailLen, by * tailLen);
    grad.addColorStop(0,    hexA(SHOOTING_STAR.color, 0.85 * alpha));
    grad.addColorStop(0.4,  hexA(SHOOTING_STAR.glow,  0.35 * alpha));
    grad.addColorStop(1,    hexA(SHOOTING_STAR.glow,  0));
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bx * tailLen, by * tailLen);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx * 4, by * 4);
    ctx.lineTo(bx * tailLen * 1.35, by * tailLen * 1.35);
    ctx.stroke();

    // Halo
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 1.8);
    glow.addColorStop(0, hexA('#ffffff', 0.9 * alpha));
    glow.addColorStop(0.4, hexA(SHOOTING_STAR.color, 0.5 * alpha));
    glow.addColorStop(1, hexA(SHOOTING_STAR.glow, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Cabeza brillante
    ctx.fillStyle = hexA('#fff8dc', alpha);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Destello en cruz giratorio
    const spike = this.radius * 1.4 * (0.85 + Math.sin(this.rot * 6) * 0.15);
    ctx.rotate(this.rot);
    ctx.strokeStyle = hexA(SHOOTING_STAR.color, alpha);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-spike, 0); ctx.lineTo(spike, 0);
    ctx.moveTo(0, -spike); ctx.lineTo(0, spike);
    ctx.stroke();

    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.powerTimers   = {};
    this.dead          = false;
  }

  applyPowerUp(type) {
    this.powerTimers[type] = POWERUPS[type].duration;
  }

  hasPowerUp(type) {
    return (this.powerTimers[type] || 0) > 0;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    for (const k in this.powerTimers) {
      if (this.powerTimers[k] > 0) this.powerTimers[k] -= dt;
    }

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * (this.hasPowerUp('speed') ? 2 : 1);  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin  = SKINS[skinIndex];
    const color = this.hasPowerUp('speed') ? POWERUPS.speed.color : '#fff';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.lineJoin = 'round';

    // Silueta según la skin activa
    skin.draw(ctx, color);

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      const [fx, fy] = skin.flame;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 4);
      ctx.lineTo(fx - rand(6, 14), fy);
      ctx.lineTo(fx, fy + 4);
      ctx.strokeStyle = skin.flameColor || 'rgba(255, 130, 0, 0.85)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    ctx.restore();

    // Campo de fuerza del escudo
    if (this.hasPowerUp('shield')) {
      const t     = this.powerTimers.shield;
      const fade  = t < 1.5 ? 0.35 + 0.65 * (t / 1.5) : 1;
      const pulse = 1 + Math.sin(performance.now() / 130) * 0.06;
      const r     = (this.radius + 8) * pulse;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = hexA(POWERUPS.shield.color, 0.9 * fade);
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = hexA(POWERUPS.shield.color, 0.3 * fade);
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '#fff') {
    this.x  = x;
    this.y  = y;
    this.color = color;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = hexA(this.color, alpha);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  // Entra por un borde apuntando hacia el lado opuesto
  const edge = randInt(0, 3);
  let x, y, angle;
  if (edge === 0)      { x = rand(0, W); y = 0; angle = rand(0.5, 1.2); }
  else if (edge === 1) { x = W; y = rand(0, H); angle = rand(1.8, 2.5); }
  else if (edge === 2) { x = rand(0, W); y = H; angle = -rand(0.5, 1.2); }
  else                 { x = 0; y = rand(0, H); angle = rand(-0.7, 0.7); }
  asteroids.push(new ShootingStar(x, y, angle));
}

function resetShootingStarTimer() {
  shootingStarTimer = rand(8, 18);
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
  resetShootingStarTimer();
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  spawnAsteroids(3 + level);
  resetShootingStarTimer();
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function destroyAsteroid(a) {
  a.dead = true;
  score += a.points ?? POINTS[a.size];
  explode(a.x, a.y, a.size * 5);
  if (Math.random() < POWERUP_DROP_CHANCE)
    powerUps.push(new PowerUp(a.x, a.y, pickPowerUpType()));
  return a.split();
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambiar de skin (disponible en cualquier estado)
  if (pressed('KeyS')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    saveSkin();
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerUps.forEach(p => p.update(dt));
    powerUps = powerUps.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Estrella fugaz: aparece de vez en cuando, si no hay otra activa
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    if (!asteroids.some(a => a instanceof ShootingStar)) spawnShootingStar();
    resetShootingStarTimer();
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        newAsteroids.push(...destroyAsteroid(a));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    if (ship.hasPowerUp('shield')) {
      // El escudo destruye lo que toca en vez de recibir daño
      const shattered = [];
      for (const a of asteroids) {
        if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82)
          shattered.push(...destroyAsteroid(a));
      }
      if (shattered.length)
        asteroids = asteroids.filter(a => !a.dead).concat(shattered);
    } else {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
  }

  // Nave vs power-up
  for (const p of powerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      ship.applyPowerUp(p.type);
      p.dead = true;
      explode(p.x, p.y, 6);
    }
  }
  powerUps = powerUps.filter(p => !p.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(0.5, 0.5);
  ctx.lineJoin = 'round';
  SKINS[skinIndex].draw(ctx, '#fff');
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  let hudY = 46;
  for (const type of ['speed', 'shield']) {
    const t = ship.powerTimers[type] || 0;
    if (t > 0) {
      ctx.fillStyle = POWERUPS[type].color;
      ctx.fillText(`${POWERUPS[type].label}  ${t.toFixed(1)}s`, 14, hudY);
      hudY += 20;
    }
  }
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px monospace';
  ctx.fillText(`SKIN ${SKINS[skinIndex].name}`, W / 2, 46);
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadSkin();
initGame();
requestAnimationFrame(loop);
