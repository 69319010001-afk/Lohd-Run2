// src/animation.js
// Animation Manager สำหรับตัวละคร + shared image loader/cache
// ใช้งาน: player.animation.play("run") / .update(dt) / .getFrame()

const imageCache = new Map();

/** โหลดรูปครั้งเดียวแล้ว cache ไว้ — ห้ามสร้าง Image object ใหม่ทุก frame */
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const img = new Image();
  const promise = new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(img);
    };
    img.onload = finish;
    img.onerror = () => {
      console.warn(`[animation] failed to load image: ${src}`);
      finish(); // อย่าให้ error ทำให้ Promise.all ค้าง
    };
    // กันเหนียว: ถ้ารูปไหนไม่ยิง load/error ภายใน 8 วิ (เช่นปัญหาเน็ตเวิร์ก/เซิร์ฟเวอร์แปลกๆ)
    // ให้ปล่อยผ่านไปเลย จะได้ไม่ค้างที่หน้าจอโหลดตลอดไป
    setTimeout(() => {
      if (!done) console.warn(`[animation] timed out loading image: ${src}`);
      finish();
    }, 8000);
  });
  img.src = src;
  imageCache.set(src, img);
  img.__ready = promise;
  return img;
}

/** โหลดหลายรูปพร้อมกัน คืน array ของ HTMLImageElement (รอจน onload ครบ) */
export async function loadImages(paths) {
  const imgs = paths.map(loadImage);
  await Promise.all(imgs.map((i) => i.__ready));
  return imgs;
}

export class AnimationClip {
  constructor(name, frames, { fps = 15, loop = true } = {}) {
    this.name = name;
    this.frames = frames; // array of HTMLImageElement
    this.fps = fps;
    this.loop = loop;
  }
}

export class AnimationManager {
  constructor() {
    this.clips = new Map();
    this.current = null;
    this.frameIndex = 0;
    this.timer = 0;
    this.finished = false;
    this.onComplete = null; // optional callback when a non-loop clip finishes
  }

  addClip(name, frames, opts) {
    this.clips.set(name, new AnimationClip(name, frames, opts));
    return this;
  }

  play(name, { restart = false } = {}) {
    if (!this.clips.has(name)) {
      console.warn(`[animation] clip "${name}" not found`);
      return;
    }
    if (this.current === name && !restart) return;
    this.current = name;
    this.frameIndex = 0;
    this.timer = 0;
    this.finished = false;
  }

  update(dt) {
    const clip = this.clips.get(this.current);
    if (!clip || clip.frames.length === 0) return;
    if (this.finished && !clip.loop) return;

    this.timer += dt;
    const frameDuration = 1 / clip.fps;
    while (this.timer >= frameDuration) {
      this.timer -= frameDuration;
      this.frameIndex++;
      if (this.frameIndex >= clip.frames.length) {
        if (clip.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = clip.frames.length - 1;
          this.finished = true;
          if (this.onComplete) this.onComplete(this.current);
          break;
        }
      }
    }
  }

  getFrame() {
    const clip = this.clips.get(this.current);
    if (!clip) return null;
    return clip.frames[this.frameIndex];
  }

  isFinished() {
    return this.finished;
  }
}
