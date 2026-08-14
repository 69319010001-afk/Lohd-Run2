// data/stages.js
// รายชื่อด่านในเกม — ตอนนี้เปิดใช้งานจริงแค่ stage01 ด่านอื่น "coming soon"
// เพิ่มด่านใหม่ในอนาคตแค่เพิ่ม object ในนี้ + สร้าง background ใหม่ใน stage.js

export const STAGES = [
  {
    id: "stage01",
    order: 1,
    name: "เมืองร้อยเอ็ด",
    desc: "จุดเริ่มต้นการผจญภัย วิ่งผ่านถนนเมืองเก่า",
    unlocked: true,
    distanceGoal: 2000, // เมตร ที่ถือว่า "จบด่าน" แบบ soft-goal (ยังวิ่งต่อได้แบบ endless)
    theme: {
      skyTop: "#241a4a",
      skyBottom: "#4a3785",
      groundColor: "#3b2c63",
      accent: "#f4b93f",
    },
  },
  {
    id: "stage02",
    order: 2,
    name: "หนองพอก",
    desc: "เร็ว ๆ นี้",
    unlocked: false,
    distanceGoal: 2000,
    theme: { skyTop: "#1a2f4a", skyBottom: "#375a85", groundColor: "#2c4463", accent: "#4fd1c5" },
  },
  {
    id: "stage03",
    order: 3,
    name: "สุวรรณภูมิ",
    desc: "เร็ว ๆ นี้",
    unlocked: false,
    distanceGoal: 2000,
    theme: { skyTop: "#3a1a4a", skyBottom: "#6a3785", groundColor: "#4c2c63", accent: "#f47ba9" },
  },
];

export function getStage(id) {
  return STAGES.find((s) => s.id === id) || STAGES[0];
}
