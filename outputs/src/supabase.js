// src/supabase.js
// ===== เตรียมโครงไว้สำหรับ Phase 13 — ยังไม่เชื่อมต่อจริง =====
// เมื่อพร้อมใช้งาน Supabase จริง:
//   1. npm i @supabase/supabase-js  (หรือ import จาก CDN ESM)
//   2. ใส่ SUPABASE_URL / SUPABASE_ANON_KEY ด้านล่าง
//   3. สร้างตาราง profiles / player_stats / discoveries / badges / leaderboard พร้อม RLS
//      ให้ policy อนุญาตแค่ auth.uid() = user_id เท่านั้นในการ insert/update แถวตัวเอง
//
// ตอนนี้ทุกฟังก์ชันเป็น no-op ที่ปลอดภัย เพื่อไม่ให้ระบบอื่น (login modal, leaderboard) พังตอนยังไม่ตั้งค่า

const SUPABASE_URL = ""; // TODO: ใส่ URL โปรเจกต์ Supabase
const SUPABASE_ANON_KEY = ""; // TODO: ใส่ anon public key

let client = null;

export function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** โหลด supabase-js แบบ lazy จาก CDN เฉพาะตอนตั้งค่าไว้แล้ว เพื่อไม่ถ่วงโหลดหน้าแรกตอนยังไม่ใช้ */
async function getClient() {
  if (!isConfigured()) return null;
  if (client) return client;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

export async function signUp(email, password, username) {
  if (!isConfigured()) throw new Error("Supabase ยังไม่ได้ตั้งค่า");
  const sb = await getClient();
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!isConfigured()) throw new Error("Supabase ยังไม่ได้ตั้งค่า");
  const sb = await getClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isConfigured()) return;
  const sb = await getClient();
  await sb.auth.signOut();
}

export async function getSession() {
  if (!isConfigured()) return null;
  const sb = await getClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function submitScore(name, score) {
  if (!isConfigured()) return;
  const sb = await getClient();
  const { error } = await sb.from("leaderboard").insert({ name, score });
  if (error) throw error;
}

export async function fetchLeaderboard(limit = 10) {
  if (!isConfigured()) return [];
  const sb = await getClient();
  const { data, error } = await sb
    .from("leaderboard")
    .select("name, score")
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
