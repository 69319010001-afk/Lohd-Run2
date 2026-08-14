// src/input.js
// รวม input ทั้งคีย์บอร์ดและทัชสกรีนไว้ที่เดียว แล้วยิง callback ออกไปให้ game.js

export class InputManager {
  /**
   * @param {{onJump:Function, onSlideStart:Function, onSlideEnd:Function, onPause:Function}} handlers
   */
  constructor(handlers) {
    this.handlers = handlers;
    this.enabled = true;
    this._bindKeyboard();
  }

  setEnabled(v) {
    this.enabled = v;
  }

  _bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (!this.enabled) return;
      if (e.repeat) return;
      switch (e.code) {
        case "Space":
        case "ArrowUp":
          e.preventDefault();
          this.handlers.onJump?.();
          break;
        case "ArrowDown":
          e.preventDefault();
          this.handlers.onSlideStart?.();
          break;
        case "KeyP":
          this.handlers.onPause?.();
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowDown") this.handlers.onSlideEnd?.();
    });
  }

  /** ผูกปุ่มทัชบนหน้าจอ (jumpBtn / slideBtn) */
  bindTouchButtons(jumpBtn, slideBtn) {
    if (jumpBtn) {
      const jump = (e) => {
        e.preventDefault();
        if (this.enabled) this.handlers.onJump?.();
      };
      jumpBtn.addEventListener("touchstart", jump, { passive: false });
      jumpBtn.addEventListener("mousedown", jump);
    }
    if (slideBtn) {
      const down = (e) => {
        e.preventDefault();
        if (this.enabled) this.handlers.onSlideStart?.();
      };
      const up = (e) => {
        e.preventDefault();
        this.handlers.onSlideEnd?.();
      };
      slideBtn.addEventListener("touchstart", down, { passive: false });
      slideBtn.addEventListener("touchend", up, { passive: false });
      slideBtn.addEventListener("mousedown", down);
      slideBtn.addEventListener("mouseup", up);
    }
  }

  /** ผูก swipe/tap บน canvas เอง: แตะบน = jump, แตะล่าง = slide */
  bindCanvasSwipe(canvas) {
    let startY = null;
    canvas.addEventListener(
      "touchstart",
      (e) => {
        if (!this.enabled) return;
        startY = e.touches[0].clientY;
      },
      { passive: true }
    );
    canvas.addEventListener(
      "touchend",
      (e) => {
        if (!this.enabled || startY === null) return;
        const rect = canvas.getBoundingClientRect();
        const relY = (startY - rect.top) / rect.height;
        if (relY < 0.5) this.handlers.onJump?.();
        else {
          this.handlers.onSlideStart?.();
          setTimeout(() => this.handlers.onSlideEnd?.(), 400);
        }
        startY = null;
      },
      { passive: true }
    );
  }
}
