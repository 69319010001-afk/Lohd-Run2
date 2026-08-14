// src/physics.js
// ค่าคงที่และฟังก์ชันฟิสิกส์พื้นฐาน (แรงโน้มถ่วง/กระโดด) — ใช้หน่วย px และ px/s

export const GRAVITY = 2600; // px/s^2
export const JUMP_VELOCITY = -980; // px/s (ค่าลบ = ขึ้น)
export const TERMINAL_VELOCITY = 1800;

/** ปรับ velocity/y ของ object ที่มี {y, vy, grounded, groundY} ตาม dt (วินาที) */
export function applyGravity(body, dt) {
  if (body.grounded) return;
  body.vy += GRAVITY * dt;
  if (body.vy > TERMINAL_VELOCITY) body.vy = TERMINAL_VELOCITY;
  body.y += body.vy * dt;
  if (body.y >= body.groundY) {
    body.y = body.groundY;
    body.vy = 0;
    body.grounded = true;
  }
}

export function startJump(body) {
  if (!body.grounded) return false;
  body.vy = JUMP_VELOCITY;
  body.grounded = false;
  return true;
}
