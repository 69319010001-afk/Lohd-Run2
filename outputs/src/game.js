// src/game.js
// ===== แกนหลักของเกม: State Manager + Game Loop =====
// ผูก Player / Coin / Obstacle / Powerup / Stage / Discovery / KnowledgeGate เข้าด้วยกัน

import { Player } from "./player.js";
import { InputManager } from "./input.js";
import { CoinManager, collectCoin } from "./coin.js";
import { ObstacleManager } from "./obstacle.js";
import { PowerupManager } from "./powerup.js";
import { StageRenderer } from "./stage.js";
import { DiscoveryTracker, allDiscoveredForStage } from "./discovery.js";
import { KnowledgeGate } from "./question.js";
import { unlockBadge } from "./passport.js";
import { updateHearts, animateNumber, updatePowerupBar, shakeScreen, toast } from "./ui.js";

export const GameState = Object.freeze({
  MENU: "MENU",
  STAGE_SELECT: "STAGE_SELECT",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
  RESULT: "RESULT",
  KNOWLEDGE_GATE: "KNOWLEDGE_GATE",
});

/* ---------------- Save profile (localStorage) ---------------- */
const PROFILE_KEY = "lohd101_profile";
const defaultProfile = () => ({ totalCoins: 0, bestScore: 0, playerName: "", selectedStage: "stage01" });

export function loadProfile() {
  try {
    return { ...defaultProfile(), ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(patch) {
  const p = { ...loadProfile(), ...patch };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  return p;
}

/* ---------------- Game engine ---------------- */
export class Game {
  constructor(canvas, dom, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dom = dom;
    this.callbacks = callbacks;

    this.width = canvas.width;
    this.height = canvas.height;
    this.groundY = this.height - 90;

    this.player = new Player(this.groundY);
    this.coinManager = new CoinManager();
    this.obstacleManager = new ObstacleManager();
    this.powerupManager = new PowerupManager();
    this.knowledgeGate = new KnowledgeGate(dom.knowledgeGateDom);
    this.stageRenderer = null;
    this.discovery = null;

    this.input = new InputManager({
      onJump: () => this.player.jump(),
      onSlideStart: () => this.player.startSlide(),
      onSlideEnd: () => this.player.stopSlide(),
      onPause: () => this.togglePause(),
    });
    this.input.bindTouchButtons(dom.jumpBtn, dom.slideBtn);
    this.input.bindCanvasSwipe(canvas);

    this.state = GameState.MENU;
    this.running = false;
    this.lastTime = 0;
    this._rafId = null;

    this.baseSpeed = 260;
    this.maxSpeed = 620;
    this.speedRamp = 5.5;
    this.worldSpeed = this.baseSpeed;
    this.speedBoostTimer = 0;

    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.gateInterval = 900;
    this.nextGateDistance = this.gateInterval;
    this.noHitRun = true;
  }

  async loadAssets() {
    await this.player.loadAssets();
  }

  startRun(stage) {
    this.stage = stage;
    this.stageRenderer = new StageRenderer(stage, this.width, this.height, this.groundY);
    this.discovery = new DiscoveryTracker(stage.id);
    this.player.reset(this.groundY);
    this.coinManager.reset();
    this.obstacleManager.reset();
    this.powerupManager.reset();

    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.worldSpeed = this.baseSpeed;
    this.speedBoostTimer = 0;
    this.nextGateDistance = this.gateInterval;
    this.noHitRun = true;

    this.input.setEnabled(true);
    this.state = GameState.PLAYING;
    this.running = true;
    this.lastTime = performance.now();
    this._updateHUD(true);
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(this._loop);
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.input.setEnabled(false);
      this.callbacks.onPause?.();
    } else if (this.state === GameState.PAUSED) {
      this.resume();
    }
  }

  resume() {
    this.state = GameState.PLAYING;
    this.input.setEnabled(true);
    this.lastTime = performance.now();
  }

  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _loop = (now) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.state === GameState.PLAYING) this._update(dt);
    this._draw();

    this._rafId = requestAnimationFrame(this._loop);
  };

  _update(dt) {
    const boosted = this.speedBoostTimer > 0 || this.powerupManager.isActive("speed");
    if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;
    const cap = boosted ? this.maxSpeed + 140 : this.maxSpeed;
    this.worldSpeed = Math.min(cap, this.worldSpeed + this.speedRamp * dt * (boosted ? 2.4 : 1));

    this.player.update(dt);
    this.stageRenderer.update(dt, this.worldSpeed);
    this.distance += (this.worldSpeed * dt) / 40; // 40px ~= 1 เมตร (สมมติ)

    this.coinManager.update(
      dt,
      this.worldSpeed,
      this.width,
      this.groundY,
      this.player,
      this.powerupManager.isActive("magnet"),
      (coin) => collectCoin(coin, this, this.dom, this.canvas, this.powerupManager.isActive("doubleCoin"))
    );

    this.obstacleManager.update(dt, this.worldSpeed, this.width, this.groundY, 0.85);
    const hit = this.obstacleManager.checkCollision(this.player);
    if (hit) this._onObstacleHit();

    this.powerupManager.update(dt, this.worldSpeed, this.width, this.groundY, this.player, null);
    updatePowerupBar(this.dom.powerupBar, this.powerupManager.active);

    if (this.discovery) {
      const found = this.discovery.update(this.distance, this.dom.gameWrap);
      if (found) {
        const prev = this.score;
        this.score += found.bonus;
        animateNumber(this.dom.score, prev, this.score, 300);
        if (allDiscoveredForStage(this.stage.id)) unlockBadge("all_discovery_stage1");
      }
    }

    this._updateHUD(false);

    if (this.distance >= this.nextGateDistance) {
      this.nextGateDistance += this.gateInterval;
      this._triggerKnowledgeGate();
    }

    if (this.player.hp <= 0) this._onGameOver();
  }

  _onObstacleHit() {
    if (this.powerupManager.consumeShield()) {
      toast("🛡 Shield ป้องกันไว้ได้!");
      return;
    }
    const hit = this.player.takeHit();
    if (hit) {
      this.noHitRun = false;
      shakeScreen(this.dom.gameWrap);
      updateHearts(this.dom.hearts, this.player.hp, this.player.maxHp);
    }
  }

  async _triggerKnowledgeGate() {
    this.state = GameState.KNOWLEDGE_GATE;
    this.input.setEnabled(false);
    const result = await this.knowledgeGate.open(this.stage.id);
    const prevScore = this.score;
    this.score = Math.max(0, this.score + result.scoreDelta);
    this.coins += result.coinDelta;
    animateNumber(this.dom.score, prevScore, this.score, 300);
    animateNumber(this.dom.coins, this.coins - result.coinDelta, this.coins, 300);
    if (result.speedBoost) this.speedBoostTimer = 2.5;
    if (this.state === GameState.KNOWLEDGE_GATE) {
      this.state = GameState.PLAYING;
      this.input.setEnabled(true);
      this.lastTime = performance.now();
    }
  }

  _onGameOver() {
    if (this.state === GameState.GAME_OVER) return;
    this.state = GameState.GAME_OVER;
    this.input.setEnabled(false);

    const profile = loadProfile();
    const newTotalCoins = profile.totalCoins + this.coins;
    const bestScore = Math.max(profile.bestScore, this.score);
    saveProfile({ totalCoins: newTotalCoins, bestScore });

    if (newTotalCoins >= 100) unlockBadge("coin_100");
    if (newTotalCoins >= 1000) unlockBadge("coin_1000");
    if (this.noHitRun) unlockBadge("no_hit_run");
    unlockBadge("first_run");

    setTimeout(() => {
      this.state = GameState.RESULT;
      this.callbacks.onGameOver?.({
        score: this.score,
        coins: this.coins,
        distance: Math.round(this.distance),
        discoveries: this.discovery ? this.discovery.foundThisRun : [],
      });
    }, 900);
  }

  _updateHUD(force) {
    updateHearts(this.dom.hearts, this.player.hp, this.player.maxHp);
    if (force) {
      this.dom.coins.textContent = this.coins;
      this.dom.score.textContent = this.score;
    }
    if (this.dom.stageProgress && this.stage) {
      const pct = Math.min(100, (this.distance / this.stage.distanceGoal) * 100);
      this.dom.stageProgress.style.width = `${pct}%`;
    }
    if (this.dom.energyBar) {
      const pct = Math.min(100, ((this.worldSpeed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed)) * 100);
      this.dom.energyBar.style.setProperty("--energy", `${pct}%`);
    }
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.stageRenderer) this.stageRenderer.draw(ctx);
    this.obstacleManager.draw(ctx);
    this.coinManager.draw(ctx);
    this.powerupManager.draw(ctx);
    this.player.draw(ctx);
  }
}
