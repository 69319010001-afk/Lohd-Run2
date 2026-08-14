// src/ui.js
// ฟังก์ชันช่วยอัปเดต HUD (HTML overlay) — ตัว Gameplay จริงยัง render ผ่าน Canvas
// ที่นี่จัดการแค่ตัวเลข/หัวใจ/เอฟเฟกต์ตัวหนังสือลอยที่เป็น DOM เท่านั้น

export function updateHearts(el, hp, maxHp) {
  if (!el) return;
  let out = "";
  for (let i = 0; i < maxHp; i++) out += i < hp ? "❤️" : "🖤";
  el.textContent = out;
}

/** เด้งเล็กน้อยเวลาค่าเปลี่ยน (เหรียญ/คะแนน) */
export function bumpPill(el) {
  if (!el) return;
  el.classList.remove("bump");
  // force reflow เพื่อให้ animation replay ได้ทุกครั้ง
  void el.offsetWidth;
  el.classList.add("bump");
}

/** นับเลขวิ่งจาก from → to แบบนุ่ม ๆ ในเวลา duration(ms) */
export function animateNumber(el, from, to, duration = 300) {
  if (!el) return;
  if (from === to) {
    el.textContent = to;
    return;
  }
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(from + (to - from) * eased);
    el.textContent = val;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/** แปลงพิกัดจาก canvas-space (px จริงของ canvas) เป็นตำแหน่งบน DOM container ที่ห่อ canvas อยู่ */
export function canvasToContainer(canvas, x, y) {
  const scaleX = canvas.clientWidth / canvas.width;
  const scaleY = canvas.clientHeight / canvas.height;
  return { left: x * scaleX, top: y * scaleY };
}

/** ตัวหนังสือลอยขึ้นแล้วจาง เช่น "+1 🪙" ตอนเก็บเหรียญ */
export function addFloatingText(container, canvas, x, y, text, color = "#f4b93f") {
  if (!container) return;
  const pos = canvasToContainer(canvas, x, y);
  const span = document.createElement("div");
  span.textContent = text;
  span.style.position = "absolute";
  span.style.left = `${pos.left}px`;
  span.style.top = `${pos.top}px`;
  span.style.color = color;
  span.style.fontWeight = "800";
  span.style.fontFamily = "var(--font-display)";
  span.style.fontSize = "15px";
  span.style.textShadow = "0 2px 4px rgba(0,0,0,.5)";
  span.style.pointerEvents = "none";
  span.style.animation = "floatUp .8s ease-out forwards";
  span.style.zIndex = "12";
  container.appendChild(span);
  setTimeout(() => span.remove(), 850);
}

export function toast(msg) {
  const layer = document.getElementById("toastLayer");
  if (!layer) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function showDiscoveryPopup(container, icon, name, bonus) {
  if (!container) return;
  const el = document.createElement("div");
  el.className = "discovery-popup";
  el.innerHTML = `<div>📍 Discovery! ${icon}</div><div class="place">${name}</div><div class="bonus">+${bonus} Discovery</div>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2900);
}

export function updatePowerupBar(container, activePowerups) {
  if (!container) return;
  container.innerHTML = "";
  const icons = { magnet: "🧲", shield: "🛡", speed: "⚡", doubleCoin: "🪙x2" };
  for (const [key, timeLeft] of Object.entries(activePowerups)) {
    if (timeLeft <= 0) continue;
    const chip = document.createElement("div");
    chip.className = "powerup-chip";
    chip.innerHTML = `${icons[key] || "✨"} <i>${timeLeft.toFixed(0)}s</i>`;
    container.appendChild(chip);
  }
}

export function shakeScreen(el) {
  if (!el) return;
  el.classList.remove("screen-shake");
  void el.offsetWidth;
  el.classList.add("screen-shake");
}
