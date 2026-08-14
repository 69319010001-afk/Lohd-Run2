// src/main.js
// Entry point — ต่อ DOM เข้ากับ Game engine, จัดการ navigation ระหว่างหน้าจอ (ไม่ใช่ Gameplay state)

import { Game, loadProfile, saveProfile } from "./game.js";
import { STAGES, getStage } from "../data/stages.js";
import { renderPassportGrid, discoveredCount, unlockedBadges } from "./passport.js";
import { renderLeaderboard, submitScore, getLocalBest } from "./leaderboard.js";
import { toast } from "./ui.js";
import * as sb from "./supabase.js";

/* ---------------- DOM refs ---------------- */
const $ = (id) => document.getElementById(id);

const screens = {
  menu: $("menuScreen"),
  stage: $("stageScreen"),
  game: $("gameScreen"),
  passport: $("passportScreen"),
  leaderboard: $("leaderboardScreen"),
  result: $("resultScreen"),
};

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("hidden", key !== name);
  }
}

const canvas = $("gameCanvas");
const dom = {
  hearts: $("hearts"),
  coins: $("coins"),
  score: $("score"),
  coinsPill: $("coins")?.closest(".pill"),
  scorePill: $("score")?.closest(".pill"),
  stageProgress: $("stageProgress"),
  energyBar: $("energyBar"),
  powerupBar: $("powerupBar"),
  gameWrap: document.querySelector(".game-wrap"),
  jumpBtn: $("jumpBtn"),
  slideBtn: $("slideBtn"),
  knowledgeGateDom: {
    modal: $("questionModal"),
    text: $("questionText"),
    answers: $("answers"),
    timerBar: $("questionTimer"),
  },
};

let game = null;
let assetsLoaded = false;
let currentStage = getStage(loadProfile().selectedStage);

/* ---------------- Menu stats ---------------- */
function refreshMenuStats() {
  const profile = loadProfile();
  $("menuCoins").textContent = profile.totalCoins;
  $("menuBest").textContent = profile.bestScore || getLocalBest();
  $("menuDiscoveries").textContent = `${discoveredCount()}/5`;
  $("menuBadges").textContent = unlockedBadges().length;
}

/* ---------------- Stage select ---------------- */
function renderStageGrid() {
  const grid = $("stageGrid");
  grid.innerHTML = "";
  for (const stage of STAGES) {
    const btn = document.createElement("button");
    btn.className = "stage-tile";
    btn.disabled = !stage.unlocked;
    btn.innerHTML = `<div class="num">STAGE ${String(stage.order).padStart(2, "0")}</div>
      <div class="name">${stage.name}</div>
      <div class="desc">${stage.desc}</div>`;
    if (stage.unlocked) {
      btn.addEventListener("click", () => {
        currentStage = stage;
        saveProfile({ selectedStage: stage.id });
        beginRun(stage);
      });
    }
    grid.appendChild(btn);
  }
}

/* ---------------- Game lifecycle ---------------- */
async function ensureGame() {
  if (game) return game;
  game = new Game(canvas, dom, {
    onPause: () => $("pauseModal").classList.remove("hidden"),
    onGameOver: (result) => showResult(result),
  });
  return game;
}

async function beginRun(stage) {
  await ensureGame();
  showScreen("game");
  if (!assetsLoaded) {
    toast("⏳ กำลังโหลดตัวละคร...");
    await game.loadAssets();
    assetsLoaded = true;
  }
  $("stageLabel").textContent = stage.name;
  game.startRun(stage);
}

function showResult(result) {
  showScreen("result");
  $("resultScore").textContent = result.score;
  $("resultCoins").textContent = result.coins;
  $("resultDistance").textContent = `${result.distance}m`;

  const box = $("resultDiscovery");
  if (result.discoveries.length > 0) {
    box.classList.remove("hidden");
    box.innerHTML = `📍 พบสถานที่ใหม่: ${result.discoveries.map((d) => d.name).join(", ")}`;
  } else {
    box.classList.add("hidden");
  }

  const profile = loadProfile();
  submitScore(profile.playerName || "Player", result.score);
  refreshMenuStats();
}

/* ---------------- Navigation wiring ---------------- */
$("startBtn").addEventListener("click", () => beginRun(currentStage));
$("stageBtn").addEventListener("click", () => {
  renderStageGrid();
  showScreen("stage");
});
$("passportBtn").addEventListener("click", () => {
  renderPassportGrid($("passportGrid"));
  showScreen("passport");
});
$("leaderboardBtn").addEventListener("click", () => {
  renderLeaderboard($("leaderboardList"), loadProfile().playerName);
  showScreen("leaderboard");
});
$("backMenuBtn").addEventListener("click", () => showScreen("menu"));
document.querySelectorAll("[data-back]").forEach((btn) => btn.addEventListener("click", () => showScreen("menu")));

$("retryBtn").addEventListener("click", () => beginRun(currentStage));
$("resultMenuBtn").addEventListener("click", () => {
  refreshMenuStats();
  showScreen("menu");
});

/* ---------------- Pause modal ---------------- */
$("pauseBtn").addEventListener("click", () => game?.togglePause());
$("resumeBtn").addEventListener("click", () => {
  $("pauseModal").classList.add("hidden");
  game?.resume();
});
$("pauseMenuBtn").addEventListener("click", () => {
  $("pauseModal").classList.add("hidden");
  game?.stop();
  refreshMenuStats();
  showScreen("menu");
});

/* ---------------- Mute / Reset ---------------- */
window.__muted = false;
$("muteBtn").addEventListener("click", () => {
  window.__muted = !window.__muted;
  $("muteBtn").textContent = window.__muted ? "🔇" : "🔊";
});
$("resetBtn").addEventListener("click", () => {
  if (confirm("ล้างข้อมูลความคืบหน้าทั้งหมด (เหรียญ/คะแนน/Discovery/Badge)? กระทำนี้ย้อนกลับไม่ได้")) {
    localStorage.removeItem("lohd101_profile");
    localStorage.removeItem("lohd101_passport");
    localStorage.removeItem("lohd101_leaderboard");
    refreshMenuStats();
    toast("♻️ ล้างข้อมูลแล้ว");
  }
});

/* ---------------- Login modal (offline-first; Supabase optional) ---------------- */
const loginModal = $("loginModal");
$("loginBtn").addEventListener("click", () => {
  loginModal.classList.remove("hidden");
  refreshAuthPanels();
});
$("closeLoginBtn").addEventListener("click", () => loginModal.classList.add("hidden"));

function refreshAuthPanels() {
  const offline = $("authOfflineNotice");
  const loggedOut = $("authLoggedOut");
  const loggedIn = $("authLoggedIn");
  offline.classList.add("hidden");
  loggedOut.classList.add("hidden");
  loggedIn.classList.add("hidden");

  if (!sb.isConfigured()) {
    offline.classList.remove("hidden");
    $("demoName").value = loadProfile().playerName || "";
  } else {
    // TODO: Phase 13 — เช็ค session จริงจาก sb.getSession() แล้วสลับ loggedIn/loggedOut
    loggedOut.classList.remove("hidden");
  }
}

$("saveNameBtn").addEventListener("click", () => {
  const name = $("demoName").value.trim() || "Player";
  saveProfile({ playerName: name });
  toast(`บันทึกชื่อ "${name}" แล้ว`);
  loginModal.classList.add("hidden");
});

$("signInBtn").addEventListener("click", async () => {
  try {
    await sb.signIn($("authEmail").value, $("authPassword").value);
    loginModal.classList.add("hidden");
  } catch (e) {
    $("authError").textContent = e.message;
    $("authError").classList.remove("hidden");
  }
});
$("signUpBtn").addEventListener("click", async () => {
  try {
    await sb.signUp($("authEmail").value, $("authPassword").value, $("authUsername").value);
    loginModal.classList.add("hidden");
  } catch (e) {
    $("authError").textContent = e.message;
    $("authError").classList.remove("hidden");
  }
});
$("signOutBtn").addEventListener("click", async () => {
  await sb.signOut();
  refreshAuthPanels();
});

/* ---------------- Boot ---------------- */
refreshMenuStats();
showScreen("menu");
