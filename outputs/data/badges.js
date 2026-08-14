// data/badges.js
// Badge ที่ปลดล็อกได้จากการเล่น — เก็บสถานะใน localStorage (หรือ Supabase ในอนาคต)

export const BADGES = [
  { id: "first_run", name: "ก้าวแรก", icon: "🏃", desc: "เล่นเกมครั้งแรก" },
  { id: "coin_100", name: "นักสะสม", icon: "🪙", desc: "เก็บเหรียญสะสมครบ 100" },
  { id: "coin_1000", name: "เศรษฐีปลาหลด", icon: "💰", desc: "เก็บเหรียญสะสมครบ 1,000" },
  { id: "all_discovery_stage1", name: "รอบรู้ร้อยเอ็ด", icon: "📍", desc: "ค้นพบสถานที่ครบทุกจุดในด่านเมืองร้อยเอ็ด" },
  { id: "quiz_master", name: "ตอบถูกทุกข้อ", icon: "🧠", desc: "ตอบ Knowledge Gate ถูก 10 ครั้ง" },
  { id: "no_hit_run", name: "วิ่งไร้รอยขีดข่วน", icon: "🛡️", desc: "จบด่านโดยไม่โดนชนเลย" },
];

export function getBadge(id) {
  return BADGES.find((b) => b.id === id);
}
