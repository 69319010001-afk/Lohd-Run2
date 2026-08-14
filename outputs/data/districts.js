// data/districts.js
// สถานที่สำคัญของร้อยเอ็ดที่ใช้ในระบบ Discovery + Saket Passport
// stageId ผูกกับ data/stages.js — ตอนนี้มีเฉพาะ stage 1 (เมืองร้อยเอ็ด)
// triggerAt = ระยะทาง (เมตร) ที่จะโผล่ Discovery ระหว่างวิ่งในด่านนั้น

export const DISTRICTS = [
  {
    id: "howod101",
    stageId: "stage01",
    name: "หอโหวด 101",
    icon: "🗼",
    triggerAt: 300,
    blurb: "หอชมเมืองที่สูงที่สุดในไทย สัญลักษณ์ใหม่ของร้อยเอ็ด",
    bonus: 100,
  },
  {
    id: "wat_burapha",
    stageId: "stage01",
    name: "วัดบูรพาภิราม",
    icon: "🛕",
    triggerAt: 650,
    blurb: "วัดเก่าแก่ ประดิษฐานหลวงพ่อพระใหญ่กลางเมือง",
    bonus: 100,
  },
  {
    id: "chai_mongkol",
    stageId: "stage01",
    name: "พระมหาเจดีย์ชัยมงคล",
    icon: "🏯",
    triggerAt: 1000,
    blurb: "เจดีย์ใหญ่ที่อำเภอหนองพอก งดงามด้วยศิลปะร่วมสมัย",
    bonus: 120,
  },
  {
    id: "beung_plan_chai",
    stageId: "stage01",
    name: "บึงพลาญชัย",
    icon: "🌳",
    triggerAt: 1350,
    blurb: "สวนสาธารณะใจกลางเมือง หัวใจของชาวร้อยเอ็ด",
    bonus: 100,
  },
  {
    id: "sa_kaeo",
    stageId: "stage01",
    name: "สระแก้ว สระทอง",
    icon: "💧",
    triggerAt: 1700,
    blurb: "สระน้ำคู่เมืองโบราณ ตำนานเล่าขานคู่ร้อยเอ็ด",
    bonus: 100,
  },
];

export function districtsForStage(stageId) {
  return DISTRICTS.filter((d) => d.stageId === stageId).sort((a, b) => a.triggerAt - b.triggerAt);
}
