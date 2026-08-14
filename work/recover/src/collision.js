// src/collision.js
// Axis-Aligned Bounding Box collision — ใช้ rect แบบ {x, y, w, h}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** ให้ hitbox เล็กกว่ารูปจริงนิดหน่อย เพื่อความรู้สึก "แฟร์" เวลาเล่น */
export function shrinkRect(rect, insetX, insetY) {
  return {
    x: rect.x + insetX,
    y: rect.y + insetY,
    w: rect.w - insetX * 2,
    h: rect.h - insetY * 2,
  };
}

export function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}
