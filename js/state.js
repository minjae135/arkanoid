// src/state.ts
import * as C from './constants.js';
// 게임 상태 변수들
export let score = 0;
export let highScore = 0; // 최고 점수
export let lives = 3;
export let paused = false;
export let running = true;
export let won = false;
// UI 상태
export let uiModalOpen = false;
export let wasPausedBeforeModal = false;
// 게임 모드 및 크기
export let currentMode = C.MODES.NORMAL;
export let currentSize = 'NORMAL';
// 공 속도 배율
export let ballSpeedScale = 1.0;
// 공 최대 개수
export let maxBallCount = C.BALL.maxCountDefault;
// 효과 상태
export let shakeAmount = 0;
export let bgOffset = 0;
// 콤보 시스템
export let combo = 0;
export let comboTimer = 0;
export const paddle = {
    x: C.WIDTH / 2 - C.PADDLE.width / 2,
    y: C.HEIGHT - 50,
    width: C.PADDLE.width,
    height: C.PADDLE.height,
    speed: C.PADDLE.speed
};
export const baseBall = { radius: C.BALL.radius, speed: C.BALL.speed };
export let balls = [];
export let bricks = [];
export let items = [];
export let lasers = [];
// 파워업 타이머
export let extendTimer = 0;
export let fullWidthTimer = 0;
export let laserTimer = 0;
// --- 상태 변경 함수 ---
export function setScore(newScore) { score = newScore; }
export function setHighScore(newHighScore) { highScore = newHighScore; }
export function setLives(newLives) { lives = newLives; }
export function setPaused(isPaused) { paused = isPaused; }
export function setRunning(isRunning) { running = isRunning; }
export function setWon(isWon) { won = isWon; }
export function setUiModalOpen(isOpen) { uiModalOpen = isOpen; }
export function setWasPausedBeforeModal(wasPaused) { wasPausedBeforeModal = wasPaused; }
export function setCurrentMode(mode) { currentMode = mode; }
export function setCurrentSize(size) { currentSize = size; }
export function setBallSpeedScale(scale) { ballSpeedScale = scale; }
export function setMaxBallCount(count) { maxBallCount = count; }
export function setExtendTimer(time) { extendTimer = time; }
export function setFullWidthTimer(time) { fullWidthTimer = time; }
export function setLaserTimer(time) { laserTimer = time; }
export function setShakeAmount(amount) { shakeAmount = amount; }
export function setBgOffset(offset) { bgOffset = offset; }
export function setCombo(c) { combo = c; }
export function setComboTimer(t) { comboTimer = t; }
export function resetItems() { items.length = 0; }
export function resetBalls(newBalls) { balls = newBalls; }
export function resetBricks(newBricks) { bricks = newBricks; }
export function resetLasers() { lasers.length = 0; }
// --- 최고 점수 관리 ---
export function loadHighScore() {
    highScore = parseInt(localStorage.getItem('arkanoidHighScore') || '0') || 0;
}
export function saveHighScore() {
    localStorage.setItem('arkanoidHighScore', highScore.toString());
}
//# sourceMappingURL=state.js.map