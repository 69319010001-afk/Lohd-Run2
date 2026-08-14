// src/question.js
// Knowledge Gate — เกมหยุด, เปิดคำถาม, ตอบถูก +100 Score +50 Coin + Speed Boost, ตอบผิด -50 Score

import { randomQuestion } from "../data/questions.js";
import { unlockBadge } from "./passport.js";
import { toast } from "./ui.js";

const TIME_LIMIT = 10; // วินาที

export class KnowledgeGate {
  constructor(dom) {
    this.dom = dom; // { modal, text, answers, timerBar }
    this.active = false;
    this.correctStreak = 0;
    this._timerRAF = null;
  }

  /**
   * เปิดคำถาม — คืน Promise ที่ resolve เมื่อผู้เล่นตอบ (หรือหมดเวลา)
   * result: { correct: bool, scoreDelta, coinDelta, speedBoost }
   */
  open(stageId) {
    return new Promise((resolve) => {
      const q = randomQuestion(stageId);
      this.active = true;
      this.dom.modal.classList.remove("hidden");
      this.dom.text.textContent = q.text;
      this.dom.answers.innerHTML = "";

      let answered = false;
      const startTime = performance.now();

      const finish = (result) => {
        if (answered) return;
        answered = true;
        cancelAnimationFrame(this._timerRAF);
        if (result.correct) {
          this.correctStreak++;
          if (this.correctStreak >= 10) unlockBadge("quiz_master");
        } else {
          this.correctStreak = 0;
        }
        setTimeout(() => {
          this.dom.modal.classList.add("hidden");
          this.active = false;
          resolve(result);
        }, 550);
      };

      q.choices.forEach((choice, i) => {
        const btn = document.createElement("button");
        btn.className = "answer-btn";
        btn.textContent = `${"ABCD"[i]}. ${choice}`;
        btn.addEventListener("click", () => {
          const correct = i === q.answerIndex;
          btn.classList.add(correct ? "correct" : "wrong");
          if (!correct) {
            const correctBtn = this.dom.answers.children[q.answerIndex];
            correctBtn?.classList.add("correct");
          }
          toast(correct ? "✅ ตอบถูก! +100 Score, +50 Coin" : "❌ ตอบผิด -50 Score");
          finish({
            correct,
            scoreDelta: correct ? 100 : -50,
            coinDelta: correct ? 50 : 0,
            speedBoost: correct,
          });
        });
        this.dom.answers.appendChild(btn);
      });

      const tick = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const pct = Math.max(0, 1 - elapsed / TIME_LIMIT);
        if (this.dom.timerBar) this.dom.timerBar.style.transform = `scaleX(${pct})`;
        if (pct <= 0) {
          toast("⏰ หมดเวลา! -50 Score");
          finish({ correct: false, scoreDelta: -50, coinDelta: 0, speedBoost: false });
          return;
        }
        this._timerRAF = requestAnimationFrame(tick);
      };
      this._timerRAF = requestAnimationFrame(tick);
    });
  }
}
