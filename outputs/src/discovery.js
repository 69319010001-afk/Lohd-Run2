// src/discovery.js
// ระหว่างวิ่ง เมื่อระยะทางถึงจุดที่กำหนดใน data/districts.js ให้โชว์ popup + บันทึกลง passport

import { districtsForStage } from "../data/districts.js";
import { showDiscoveryPopup, toast } from "./ui.js";
import { markDiscovered, isDiscovered } from "./passport.js";

export class DiscoveryTracker {
  constructor(stageId) {
    this.stageId = stageId;
    this.points = districtsForStage(stageId);
    this.nextIndex = 0;
    this.foundThisRun = [];
  }

  reset(stageId) {
    this.stageId = stageId;
    this.points = districtsForStage(stageId);
    this.nextIndex = 0;
    this.foundThisRun = [];
  }

  /** เรียกทุก frame พร้อมระยะทางสะสม (เมตร) ของการวิ่งครั้งนี้ */
  update(distanceMeters, gameWrapEl) {
    if (this.nextIndex >= this.points.length) return null;
    const point = this.points[this.nextIndex];
    if (distanceMeters >= point.triggerAt) {
      this.nextIndex++;
      this.foundThisRun.push(point);
      markDiscovered(point.id);
      showDiscoveryPopup(gameWrapEl, point.icon, point.name, point.bonus);
      return point;
    }
    return null;
  }

  totalBonusThisRun() {
    return this.foundThisRun.reduce((sum, p) => sum + p.bonus, 0);
  }
}

export function allDiscoveredForStage(stageId) {
  return districtsForStage(stageId).every((p) => isDiscovered(p.id));
}
