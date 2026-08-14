// src/coin.js
// ===== ระบบเหรียญ 101 — ระบบที่สำคัญที่สุดของเกม =====
// รูปเหรียญ: assets/coin/coin-101.png (ตอนนี้เป็น placeholder สีทองที่ generate ไว้ชั่วคราว
// เพราะยังไม่ได้แนบไฟล์รูปเหรียญจริงมาในโปรเจกต์ — แค่เปลี่ยนไฟล์ที่ path เดิมได้เลยเมื่อมีรูปจริง)

import { loadImage } from "./animation.js";
import { rectsOverlap } from "./collision.js";
import { addFloatingText, bumpPill, animateNumber } from "./ui.js";

const COIN_IMG_SRC = "./assets/coin/coin-101.png";
export const COIN_SIZE = 34;
export const COIN_VALUE = 1;
export const COIN_SCORE = 10;

export class Coin {
  constructor(x, y, value = COIN_VALUE) {
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.value = value;
    this.collected = false;
    this.spawnTime = performance.now() / 1000;
    this.magnetPull = false;
  }

  update(dt, worldSpeed, player, magnetActive) {
    this.x -= worldSpeed * dt;
    const t = performance.now() / 1000 - this.spawnTime;
    this.y = this.baseY + Math.sin(t * 4.2) * 5; // ลอยขึ้นลงเล็กน้อย
    this.rotation = (t * 3.2) % (Math.PI * 2); // ใช้ทำเอฟเฟกต์หมุนแบบ 2D (squash แกน x)

    if (magnetActive && player) {
      const dx = player.x - this.x;
      const dy = player.y - 40 - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 220) {
        const pull = 640 * dt;
        this.x += (dx / dist) * pull;
        this.y += (dy / dist) * pull;
      }
    }
  }

  getRect() {
    return { x: this.x - COIN_SIZE / 2, y: this.y - COIN_SIZE / 2, w: COIN_SIZE, h: COIN_SIZE };
  }

  draw(ctx, img) {
    if (!img || !img.complete) return;
    const squash = Math.abs(Math.cos(this.rotation || 0)); // 0..1 จำลองการหมุนแนวตั้ง
    const w = COIN_SIZE * Math.max(0.28, squash);
    const shine = 0.75 + 0.25 * squash;
    ctx.save();
    ctx.globalAlpha = shine;
    ctx.drawImage(img, this.x - w / 2, this.y - COIN_SIZE / 2, w, COIN_SIZE);
    ctx.restore();
  }
}

/** สร้างเหรียญเป็น pattern ต่าง ๆ เพื่อความสนุกตอนวิ่งเก็บ */
export function buildPattern(pattern, startX, groundY, laneHeight = 46) {
  const coins = [];
  const jumpY = groundY - 150; // ความสูงตอนกระโดด (คร่าว ๆ ให้เก็บได้ตอนลอย)
  const midY = groundY - 70;

  switch (pattern) {
    case "line":
      for (let i = 0; i < 5; i++) coins.push({ x: startX + i * 42, y: midY });
      break;
    case "arc": {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const y = midY - Math.sin(t * Math.PI) * 90;
        coins.push({ x: startX + i * 40, y });
      }
      break;
    }
    case "zigzag":
      for (let i = 0; i < 6; i++) {
        const y = i % 2 === 0 ? midY : jumpY;
        coins.push({ x: startX + i * 40, y });
      }
      break;
    case "vLine":
      for (let i = 0; i < 5; i++) coins.push({ x: startX + i * 34, y: jumpY });
      break;
    case "single":
    default:
      coins.push({ x: startX, y: midY });
      break;
  }
  return coins;
}

export class CoinManager {
  constructor() {
    this.coins = [];
    this.img = loadImage(COIN_IMG_SRC);
    this.patterns = ["single", "line", "arc", "zigzag", "vLine"];
    this.spawnTimer = 0;
    this.spawnInterval = 1.7;
  }

  reset() {
    this.coins = [];
    this.spawnTimer = 0;
  }

  /** เรียกทุก frame — สุ่ม spawn pattern ใหม่เป็นระยะตามความเร็วโลก */
  update(dt, worldSpeed, canvasWidth, groundY, player, magnetActive, onCollect) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
      const built = buildPattern(pattern, canvasWidth + 60, groundY);
      for (const c of built) this.coins.push(new Coin(c.x, c.y));
      this.spawnTimer = this.spawnInterval + Math.random() * 0.8;
    }

    for (const coin of this.coins) {
      if (coin.collected) continue;
      coin.update(dt, worldSpeed, player, magnetActive);

      if (player) {
        const hit = rectsOverlap(coin.getRect(), player.getHitbox());
        if (hit) {
          coin.collected = true;
          onCollect?.(coin);
        }
      }
    }

    this.coins = this.coins.filter((c) => !c.collected && c.x > -60);
  }

  draw(ctx) {
    for (const coin of this.coins) {
      if (!coin.collected) coin.draw(ctx, this.img);
    }
  }
}

/**
 * ผูก CoinManager เข้ากับ HUD จริง — เรียกตอนเก็บเหรียญ
 * เพิ่ม coins/score, เด้ง pill, floating text, เตรียม hook สำหรับ sound
 */
export function collectCoin(coin, state, dom, canvas, doubleCoin = false) {
  const gained = coin.value * (doubleCoin ? 2 : 1);
  const prevCoins = state.coins;
  const prevScore = state.score;
  state.coins += gained;
  state.score += COIN_SCORE * gained;

  animateNumber(dom.coins, prevCoins, state.coins, 250);
  animateNumber(dom.score, prevScore, state.score, 250);
  bumpPill(dom.coinsPill);
  bumpPill(dom.scorePill);

  addFloatingText(dom.gameWrap, canvas, coin.x, coin.y, `+${gained} 🪙`, "#f4b93f");

  // เตรียม hook เสียง — ยังไม่มีไฟล์เสียงจริง ให้เรียกผ่าน SoundBus เมื่อพร้อม
  playCoinSound();
}

let _audioCtx = null;
/** เสียงเก็บเหรียญแบบ synth เบา ๆ (กันไว้ก่อนมีไฟล์เสียงจริง) ผ่าน Web Audio, ปิดเสียงได้ผ่าน window.__muted */
export function playCoinSound() {
  if (window.__muted) return;
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch (e) {
    /* เงียบไว้ถ้า browser ไม่รองรับ */
  }
}
