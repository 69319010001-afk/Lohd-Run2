// data/questions.js
// คลังคำถามสำหรับ Knowledge Gate — ผูกกับ stageId เพื่อสุ่มคำถามที่เกี่ยวข้องกับด่านนั้น
// answerIndex คือ index ที่ถูกต้องใน choices (0-3)

export const QUESTIONS = [
  {
    id: "q1",
    stageId: "stage01",
    text: "หอโหวด 101 ตั้งอยู่ที่จังหวัดใด?",
    choices: ["ร้อยเอ็ด", "ขอนแก่น", "อุบลราชธานี", "มหาสารคาม"],
    answerIndex: 0,
  },
  {
    id: "q2",
    stageId: "stage01",
    text: "สวนสาธารณะใจกลางเมืองร้อยเอ็ดชื่อว่าอะไร?",
    choices: ["สวนลุมพินี", "บึงพลาญชัย", "สวนหลวง ร.9", "สวนสมเด็จ"],
    answerIndex: 1,
  },
  {
    id: "q3",
    stageId: "stage01",
    text: "ร้อยเอ็ดมีชื่อเรียกที่มาจากจำนวนเมืองในอดีตว่ากี่เมือง?",
    choices: ["101 เมือง", "11 เมือง", "99 เมือง", "20 เมือง"],
    answerIndex: 1,
  },
  {
    id: "q4",
    stageId: "stage01",
    text: "สระน้ำคู่เมืองโบราณของร้อยเอ็ดชื่อว่าอะไร?",
    choices: ["สระแก้ว สระทอง", "สระบัว", "หนองหาน", "บึงแก่นนคร"],
    answerIndex: 0,
  },
  {
    id: "q5",
    stageId: "stage01",
    text: "ผ้าที่ตัวละคร \"ปลาหลด\" ใช้คาดเอวในเกมคือผ้าประเภทใด?",
    choices: ["ผ้าไหมมัดหมี่", "ผ้าขาวม้า", "ผ้าซิ่น", "ผ้าฝ้ายทอมือ"],
    answerIndex: 1,
  },
];

export function questionsForStage(stageId) {
  const list = QUESTIONS.filter((q) => q.stageId === stageId);
  return list.length ? list : QUESTIONS;
}

export function randomQuestion(stageId) {
  const pool = questionsForStage(stageId);
  return pool[Math.floor(Math.random() * pool.length)];
}
