// src/obstacle.js
// สิ่งกีดขวาง: หนาม/ก้อนหิน (ต้องกระโดด) และคานสูง (ต้องสไลด์)
// ตอนนี้ยังไม่มีไฟล์ภาพ obstacle แนบมา จึงวาดด้วย Canvas shapes ไปก่อน (โครงสร้างพร้อมสลับเป็นรูปจริงได้ทันที)

import { rectsOverlap } from "./collision.js";

const TYPES = {
  spike: { w: 34, h: 40, mode: "jump", color: "#8a8a99" },
  rock: { w: 46, h: 42, mode: "jump", color: "#6b5a4a" },
  lowBar: { w: 70, h: 26, mode: "slide", color: "#c8811c" }, // อยู่สูง ต้องสไลด์ลอดใต้
  tallBlock: { w: 40, h: 90, mode: "jump", color: "#4a3b6a" },
};

export class Obstacle {
  constructor(type, x, groundY) {
    this.type = type;
    const cfg = TYPES[type];
    this.w = cfg.w;
    this.h = cfg.h;
    this.mode = cfg.mode; // "jump" = ต้องกระโดดข้าม, "slide" = ต้องสไลด์ลอด
    this.color = cfg.color;
    this.x = x;
    if (this.mode === "slide") {
      // คานลอยอยู่สูงจากพื้นระดับหัว/ตัว ให้สไลด์ลอดผ่านได้
      this.y = groundY - 92 - this.h;
    } else {
      this.y = groundY - this.h;
    }
    this.passed = false;
  }

  update(dt, worldSpeed) {
    this.x -= worldSpeed * dt;
  }

  getRect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    if (this.type === "spike") {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    } else if (this.mode === "slide") {
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.fillRect(this.x, this.y, this.w, 4);
    } else {
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(this.x + r, this.y);
      ctx.arcTo(this.x + this.w, this.y, this.x + this.w, this.y + this.h, r);
      ctx.arcTo(this.x + this.w, this.y + this.h, this.x, this.y + this.h, r);
      ctx.arcTo(this.x, this.y + this.h, this.x, this.y, r);
      ctx.arcTo(this.x, this.y, this.x + this.w, this.y, r);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

export class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.spawnTimer = 2;
    this.types = Object.keys(TYPES);
  }

  reset() {
    this.obstacles = [];
    this.spawnTimer = 2;
  }

  update(dt, worldSpeed, canvasWidth, groundY, minGapSeconds) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const type = this.types[Math.floor(Math.random() * this.types.length)];
      this.obstacles.push(new Obstacle(type, canvasWidth + 40, groundY));
      // ระยะห่างขั้นต่ำผูกกับความเร็วโลก เพื่อให้ยังหลบได้ทันแม้เกมเร็วขึ้น
      this.spawnTimer = Math.max(minGapSeconds, 1.1 + Math.random() * 1.0);
    }
    for (const o of this.obstacles) o.update(dt, worldSpeed);
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -20);
  }

  /** เช็คชนกับ player, คืน obstacle ที่ชน (ครั้งละ 1) หรือ null */
  checkCollision(player) {
    const hitbox = player.getHitbox();
    for (const o of this.obstacles) {
      if (o.hit) continue;
      if (rectsOverlap(hitbox, o.getRect())) {
        o.hit = true;
        return o;
      }
    }
    return null;
  }

  draw(ctx) {
    for (const o of this.obstacles) o.draw(ctx);
  }
}
