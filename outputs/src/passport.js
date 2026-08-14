// src/passport.js
// เก็บสถานะ Discovery/Badge ไว้ใน localStorage ก่อน (Phase 13 ค่อยย้ายไป Supabase)

import { DISTRICTS } from "../data/districts.js";
import { BADGES } from "../data/badges.js";

const KEY = "lohd101_passport";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { discovered: [], badges: [] };
  } catch {
    return { discovered: [], badges: [] };
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function markDiscovered(id) {
  const data = load();
  if (!data.discovered.includes(id)) {
    data.discovered.push(id);
    save(data);
  }
}

export function isDiscovered(id) {
  return load().discovered.includes(id);
}

export function discoveredCount() {
  return load().discovered.length;
}

export function unlockBadge(id) {
  const data = load();
  if (!data.badges.includes(id)) {
    data.badges.push(id);
    save(data);
    return true; // เพิ่งปลดล็อกใหม่
  }
  return false;
}

export function unlockedBadges() {
  return load().badges;
}

/** วาด grid สถานที่ทั้งหมดลงใน container ที่กำหนด (#passportGrid) */
export function renderPassportGrid(container) {
  if (!container) return;
  const data = load();
  container.innerHTML = "";
  for (const d of DISTRICTS) {
    const found = data.discovered.includes(d.id);
    const cell = document.createElement("div");
    cell.className = "passport-cell" + (found ? " found" : "");
    cell.innerHTML = `<div class="icon">${found ? d.icon : "❔"}</div><div>${found ? d.name : "???"}</div>`;
    container.appendChild(cell);
  }
  for (const b of BADGES) {
    const found = data.badges.includes(b.id);
    const cell = document.createElement("div");
    cell.className = "passport-cell" + (found ? " found" : "");
    cell.title = b.desc;
    cell.innerHTML = `<div class="icon">${found ? b.icon : "🔒"}</div><div>${found ? b.name : "???"}</div>`;
    container.appendChild(cell);
  }
}
