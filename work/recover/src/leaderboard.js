// src/leaderboard.js
// ตอนนี้ใช้ localStorage เป็นหลัก — ถ้า supabase.js ตั้งค่าเสร็จ (isConfigured) จะ sync ขึ้นคลาวด์ด้วย

import { isConfigured, fetchLeaderboard as fetchRemote, submitScore as submitRemote } from "./supabase.js";

const KEY = "lohd101_leaderboard";
const MAX_ENTRIES = 50;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getLocalBest() {
  const list = load();
  return list.length ? Math.max(...list.map((e) => e.score)) : 0;
}

/** บันทึกคะแนนใหม่ ทั้ง local เสมอ และขึ้นคลาวด์ถ้าตั้งค่า Supabase ไว้แล้ว */
export async function submitScore(name, score) {
  const list = load();
  list.push({ name: name || "Player", score, date: new Date().toISOString() });
  list.sort((a, b) => b.score - a.score);
  save(list.slice(0, MAX_ENTRIES));

  if (isConfigured()) {
    try {
      await submitRemote(name, score);
    } catch (e) {
      console.warn("[leaderboard] remote submit failed, kept local copy", e);
    }
  }
}

/** คืน list อันดับ (สูง→ต่ำ) ใช้ remote ถ้ามี ไม่งั้น fallback local */
export async function getTop(limit = 10) {
  if (isConfigured()) {
    try {
      return await fetchRemote(limit);
    } catch (e) {
      console.warn("[leaderboard] remote fetch failed, fallback to local", e);
    }
  }
  return load()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function renderLeaderboard(container, currentName) {
  if (!container) return;
  const top = await getTop(10);
  container.innerHTML = "";
  if (top.length === 0) {
    container.innerHTML = `<p class="hint">ยังไม่มีคะแนนบันทึกไว้ — ลองเล่นแล้วจบด่านดูสิ!</p>`;
    return;
  }
  top.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row" + (entry.name === currentName ? " me" : "");
    row.innerHTML = `<span class="rank">#${i + 1}</span><span class="name">${entry.name}</span><span class="score">${entry.score}</span>`;
    container.appendChild(row);
  });
}
