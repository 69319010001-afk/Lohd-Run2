// src/stage.js
// พื้นหลังฉาก (parallax) — วาดด้วย Canvas shapes ตาม theme ของแต่ละด่าน
// ยังไม่มีไฟล์ background จริงแนบมา จึงสร้างฉากเมืองแบบ silhouette ไปก่อน โครงสร้างพร้อมสลับเป็นรูปจริงทีหลัง

export class StageRenderer {
  constructor(stage, canvasWidth, canvasHeight, groundY) {
    this.setStage(stage, canvasWidth, canvasHeight, groundY);
    this.farOffset = 0;
    this.nearOffset = 0;
    this.groundOffset = 0;
    // ตำแหน่งตึก/ต้นไม้แบบสุ่มคงที่ (deterministic) ต่อด่าน
    this.buildings = this._genBuildings(canvasWidth);
    this.trees = this._genTrees(canvasWidth);
  }

  setStage(stage, canvasWidth, canvasHeight, groundY) {
    this.stage = stage;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = groundY;
  }

  _genBuildings(width) {
    const arr = [];
    let x = -20;
    while (x < width + 200) {
      const w = 60 + Math.random() * 70;
      const h = 60 + Math.random() * 120;
      arr.push({ x, w, h });
      x += w + 18 + Math.random() * 30;
    }
    return arr;
  }

  _genTrees(width) {
    const arr = [];
    let x = -20;
    while (x < width + 200) {
      arr.push({ x, s: 0.8 + Math.random() * 0.6 });
      x += 90 + Math.random() * 120;
    }
    return arr;
  }

  update(dt, worldSpeed) {
    this.farOffset = (this.farOffset - worldSpeed * 0.15 * dt) % 99999;
    this.nearOffset = (this.nearOffset - worldSpeed * 0.45 * dt) % 99999;
    this.groundOffset = (this.groundOffset - worldSpeed * dt) % 40;
  }

  draw(ctx) {
    const { skyTop, skyBottom, groundColor, accent } = this.stage.theme;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    // sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, this.groundY);

    // moon/sun glow
    ctx.save();
    ctx.globalAlpha = 0.5;
    const glow = ctx.createRadialGradient(w * 0.82, 70, 4, w * 0.82, 70, 90);
    glow.addColorStop(0, accent);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, this.groundY);
    ctx.restore();

    // far buildings (silhouette, parallax slow)
    ctx.fillStyle = "rgba(0,0,0,.28)";
    for (const b of this.buildings) {
      const x = ((b.x + this.farOffset) % (w + 260)) - 130;
      ctx.fillRect(x, this.groundY - b.h, b.w, b.h);
    }

    // ground
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, this.groundY, w, h - this.groundY);

    // road stripes (near parallax, fast)
    ctx.fillStyle = "rgba(255,255,255,.14)";
    const stripeW = 34;
    const gap = 26;
    let sx = this.groundOffset % (stripeW + gap);
    for (let x = sx - stripeW; x < w; x += stripeW + gap) {
      ctx.fillRect(x, this.groundY + 18, stripeW, 6);
    }

    // trees (near parallax)
    for (const t of this.trees) {
      const x = ((t.x + this.nearOffset) % (w + 200)) - 100;
      this._drawTree(ctx, x, this.groundY, t.s, accent);
    }
  }

  _drawTree(ctx, x, groundY, scale, accent) {
    ctx.save();
    ctx.translate(x, groundY);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(20,15,40,.55)";
    ctx.fillRect(-4, -46, 8, 46);
    ctx.beginPath();
    ctx.ellipse(0, -60, 26, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(43,120,90,.55)";
    ctx.fill();
    ctx.restore();
  }
}
