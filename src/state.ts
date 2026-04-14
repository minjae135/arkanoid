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
export let currentMode: C.ModeType = C.MODES.NORMAL;
export let currentSize: C.SizePresetType = 'NORMAL';

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

// 게임 객체 인터페이스
export interface Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
}

export interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    speed: number;
    stuck: boolean;
    trails: { x: number; y: number }[];
}

export interface Brick {
    x: number;
    y: number;
    w: number;
    h: number;
    alive: boolean;
    type: C.BlockType;
    hp: number;
    color?: string;
}

export interface Item {
    x: number;
    y: number;
    w: number;
    h: number;
    vy: number;
    type: C.ItemType;
}

export interface Laser {
    x: number;
    y: number;
    w: number;
    h: number;
    vy: number;
}

export const paddle: Paddle = {
    x: C.WIDTH / 2 - C.PADDLE.width / 2,
    y: C.HEIGHT - 50,
    width: C.PADDLE.width,
    height: C.PADDLE.height,
    speed: C.PADDLE.speed
};

export const baseBall = {radius: C.BALL.radius, speed: C.BALL.speed};
export let balls: Ball[] = [];
export let bricks: Brick[] = [];
export let items: Item[] = [];

// 파워업 타이머
export let extendTimer = 0;
export let fullWidthTimer = 0;

// --- 상태 변경 함수 ---

export function setScore(newScore: number) { score = newScore; }
export function setHighScore(newHighScore: number) { highScore = newHighScore; }
export function setLives(newLives: number) { lives = newLives; }
export function setPaused(isPaused: boolean) { paused = isPaused; }
export function setRunning(isRunning: boolean) { running = isRunning; }
export function setWon(isWon: boolean) { won = isWon; }
export function setUiModalOpen(isOpen: boolean) { uiModalOpen = isOpen; }
export function setWasPausedBeforeModal(wasPaused: boolean) { wasPausedBeforeModal = wasPaused; }
export function setCurrentMode(mode: C.ModeType) { currentMode = mode; }
export function setCurrentSize(size: C.SizePresetType) { currentSize = size; }
export function setBallSpeedScale(scale: number) { ballSpeedScale = scale; }
export function setMaxBallCount(count: number) { maxBallCount = count; }
export function setExtendTimer(time: number) { extendTimer = time; }
export function setFullWidthTimer(time: number) { fullWidthTimer = time; }
export function setShakeAmount(amount: number) { shakeAmount = amount; }
export function setBgOffset(offset: number) { bgOffset = offset; }
export function setCombo(c: number) { combo = c; }
export function setComboTimer(t: number) { comboTimer = t; }

export function resetItems() { items.length = 0; }
export function resetBalls(newBalls: Ball[]) { balls = newBalls; }
export function resetBricks(newBricks: Brick[]) { bricks = newBricks; }

// --- 최고 점수 관리 ---
export function loadHighScore() {
    highScore = parseInt(localStorage.getItem('arkanoidHighScore') || '0') || 0;
}
export function saveHighScore() {
    localStorage.setItem('arkanoidHighScore', highScore.toString());
}
