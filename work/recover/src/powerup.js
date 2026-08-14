// src/powerup.js
// Power-up: 🧲 Magnet, 🛡 Shield, ⚡ Speed, 🪙 Double Coin
// วาดด้วย emoji บน canvas ไปก่อน (ยังไม่มีไฟล์ภาพ powerup แนบมา)

import { rectsOverlap } from "./collision.js";
import { toast } from "./ui.js";

const KIND_META = {
  magnet: { emoji: "🧲", duration: 6, label: "Magnet" },
  shield: { emoji: "🛡", duration: 8, label: "Shield" },
  speed: { emoji: "⚡", duration: 5, label: "Speed Boost" },
  doubleCoin: { emoji: "🪙", duration: 7, label: "Double Coin" },
};

export const POWERUP_SIZE = 36;

export class Powerup {
  constructor(kind, x, y) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.collected = false;
    this.t = 0;
  }

  update(dt, worldSpeed) {
    this.x -= worldSpeed * dt;
    this.t += dt;
    this.y = this.baseY + Math.sin(this.t * 3) * 6;
  }

  getRect() {
    return { x: this.x - POWERUP_SIZE / 2, y: this.y - POWERUP_SIZE / 2, w: POWERUP_SIZE, h: POWERUP_SIZE };
  }

  draw(ctx) {
    const meta = KIND_META[this.kind];
    ctx.save();
    ctx.font = `${POWERUP_SIZE}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(244,185,63,.8)";
    ctx.shadowBlur = 12;
    ctx.fillText(meta.emoji, this.x, this.y);
    ctx.restore();
  }
}

export class PowerupManager {
  constructor() {
    this.items = [];
    this.spawnTimer = 8;
    this.active = { magnet: 0, shield: 0, speed: 0, doubleCoin: 0 };
  }

  reset() {
    this.items = [];
    this.spawnTimer = 8;
    this.active = { magnet: 0, shield: 0, speed: 0, doubleCoin: 0 };
  }

  update(dt, worldSpeed, canvasWidth, groundY, player, onCollect) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const kinds = Object.keys(KIND_META);
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      this.items.push(new Powerup(kind, canvasWidth + 40, groundY - 130));
      this.spawnTimer = 9 + Math.random() * 6;
    }

    for (const p of this.items) {
      if (p.collected) continue;
      p.update(dt, worldSpeed);
      if (player && rectsOverlap(p.getRect(), player.getHitbox())) {
        p.collected = true;
        this.active[p.kind] = KIND_META[p.kind].duration;
        toast(`${KIND_META[p.kind].emoji} ${KIND_META[p.kind].label}!`);
        onCollect?.(p);
      }
    }
    this.items = this.items.filter((p) => !p.collected && p.x > -60);

    for (const key of Object.keys(this.active)) {
      if (this.active[key] > 0) this.active[key] = Math.max(0, this.active[key] - dt);
    }
  }

  isActive(kind) {
    return this.active[kind] > 0;
  }

  /** ใช้ Shield กันชนหนึ่งครั้ง — คืน true ถ้ามี shield ให้ใช้ */
  consumeShield() {
    if (this.active.shield > 0) {
      this.active.shield = 0;
      return true;
    }
    return false;
  }

  draw(ctx) {
    for (const p of this.items) if (!p.collected) p.draw(ctx);
  }
}
