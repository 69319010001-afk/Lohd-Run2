// src/player.js
// ตัวละคร "ปลาหลด" — ผูก AnimationManager เข้ากับ physics/state
// ห้ามเปลี่ยนหน้าตา/ชุด/สี — ใช้ sprite จาก assets/character ตามที่มีเท่านั้น

import { AnimationManager, loadImages } from "./animation.js";
import { applyGravity, startJump } from "./physics.js";
import { shrinkRect } from "./collision.js";

const BASE = "./assets/character";

const FRAME_SETS = {
  run: { files: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${BASE}/run/run_0${n}.png`), fps: 14, loop: true },
  jump: { files: [1, 2, 3, 4, 5].map((n) => `${BASE}/jump/jump_0${n}.png`), fps: 12, loop: false },
  slide: { files: [1, 2, 3].map((n) => `${BASE}/slide/slide_0${n}.png`), fps: 10, loop: false },
  idle: { files: [`${BASE}/actions/actions_01.png`], fps: 4, loop: true },
  happy: { files: [`${BASE}/actions/actions_02.png`], fps: 6, loop: true },
  surprised: { files: [`${BASE}/actions/actions_03.png`], fps: 6, loop: false },
  hit: { files: [`${BASE}/actions/actions_04.png`], fps: 8, loop: false },
  defeat: { files: [`${BASE}/actions/actions_05.png`], fps: 4, loop: false },
  superHappy: { files: [`${BASE}/actions/actions_06.png`], fps: 6, loop: true },
};

export const DISPLAY_HEIGHT = 118; // ความสูงตัวละครบนจอ (px) รักษา aspect ratio ต่อเฟรม
export const PLAYER_X = 160; // ตำแหน่ง x คงที่ (โลกเลื่อนเข้าหาแทน)

export class Player {
  constructor(groundY) {
    this.x = PLAYER_X;
    this.groundY = groundY;
    this.y = groundY;
    this.vy = 0;
    this.grounded = true;

    this.state = "run"; // run | jump | slide | hit | defeat | idle | happy | surprised | superHappy
    this.hp = 3;
    this.maxHp = 3;
    this.invincibleTimer = 0;
    this.blink = false;

    this.sliding = false;
    this.slideHeld = false;

    this.animation = new AnimationManager();
    this.animation.onComplete = (name) => this._onAnimComplete(name);
    this.ready = false;
  }

  async loadAssets() {
    for (const [name, cfg] of Object.entries(FRAME_SETS)) {
      const imgs = await loadImages(cfg.files);
      this.animation.addClip(name, imgs, { fps: cfg.fps, loop: cfg.loop });
    }
    this.animation.play("run");
    this.ready = true;
  }

  _onAnimComplete(name) {
    // จบ jump/slide/hit ที่ไม่ loop แล้ว กลับไป run ถ้ายังอยู่บนพื้นและไม่ตาย
    if (this.state === "defeat") return; // ค้างท่า defeat จนกว่าจะ reset
    if (["jump", "slide", "hit", "surprised"].includes(name)) {
      if (this.grounded && this.hp > 0) this._setState("run");
    }
  }

  _setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.animation.play(state, { restart: true });
  }

  jump() {
    if (this.state === "defeat") return;
    if (this.sliding) this.stopSlide();
    if (startJump(this)) this._setState("jump");
  }

  startSlide() {
    if (this.state === "defeat" || !this.grounded) return;
    this.slideHeld = true;
    this.sliding = true;
    this._setState("slide");
  }

  stopSlide() {
    this.slideHeld = false;
    this.sliding = false;
  }

  takeHit() {
    if (this.invincibleTimer > 0 || this.state === "defeat") return false;
    this.hp = Math.max(0, this.hp - 1);
    this.invincibleTimer = 1.0;
    if (this.hp <= 0) {
      this._setState("defeat");
    } else {
      this._setState("hit");
    }
    return true;
  }

  reset(groundY) {
    this.groundY = groundY;
    this.y = groundY;
    this.vy = 0;
    this.grounded = true;
    this.hp = this.maxHp;
    this.invincibleTimer = 0;
    this.sliding = false;
    this.slideHeld = false;
    this._setState("run");
  }

  update(dt) {
    if (!this.ready) return;
    applyGravity(this, dt);

    // slide หยุดอัตโนมัติหลัง 0.55s แม้กดค้าง (จังหวะเกมไม่ดึงยาวเกิน)
    if (this.sliding) {
      this.slideTimer = (this.slideTimer || 0) + dt;
      if (this.slideTimer > 0.55) {
        this.slideTimer = 0;
        this.stopSlide();
      }
    } else {
      this.slideTimer = 0;
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.blink = Math.floor(this.invincibleTimer * 12) % 2 === 0;
    } else {
      this.blink = false;
    }

    this.animation.update(dt);
  }

  /** hitbox ปัจจุบัน (ปรับตามท่าทาง: slide จะเตี้ยลง) */
  getHitbox() {
    const frame = this.animation.getFrame();
    if (!frame || !frame.naturalWidth) {
      return { x: this.x - 30, y: this.y - 90, w: 60, h: 90 };
    }
    const h = this.sliding ? DISPLAY_HEIGHT * 0.62 : DISPLAY_HEIGHT;
    const w = (frame.naturalWidth / frame.naturalHeight) * h;
    const rect = { x: this.x - w / 2, y: this.y - h, w, h };
    return shrinkRect(rect, w * 0.22, h * 0.12);
  }

  draw(ctx) {
    if (!this.ready) return;
    const frame = this.animation.getFrame();
    if (!frame || !frame.complete || !frame.naturalWidth) return;

    const h = this.sliding ? DISPLAY_HEIGHT * 0.72 : DISPLAY_HEIGHT;
    const w = (frame.naturalWidth / frame.naturalHeight) * h;
    const drawX = this.x - w / 2;
    const drawY = this.y - h;

    ctx.save();
    if (this.blink) ctx.globalAlpha = 0.4;
    ctx.drawImage(frame, drawX, drawY, w, h);
    ctx.restore();
  }
}
