// src/ui.ts
import * as S from './state.js';
import * as C from './constants.js';

let canvas: HTMLCanvasElement | null = null;
let resetGameCallback: () => void;
let setModeCallback: (mode: C.ModeType) => void;
let setSizeCallback: (size: C.SizePresetType) => void;
let setSpeedCallback: (scale: number) => void;
let setMaxBallsCallback: (count: number) => void;

// 모달 UI 요소
const btnReset = document.getElementById('btn-reset');
const btnMode = document.getElementById('btn-mode');
const backdrop = document.getElementById('mode-backdrop') as HTMLElement | null;
const btnCancel = document.getElementById('mode-cancel');
const choiceNormal = document.getElementById('choice-normal');
const choiceSpeed = document.getElementById('choice-speed');
const choiceHard = document.getElementById('choice-hard');

const btnSize = document.getElementById('btn-size');
const sizeBackdrop = document.getElementById('size-backdrop') as HTMLElement | null;
const sizeCancel = document.getElementById('size-cancel');
const sizeSmall = document.getElementById('size-small');
const sizeNormal = document.getElementById('size-normal');
const sizeLarge = document.getElementById('size-large');
const sizeXLarge = document.getElementById('size-xlarge');

const btnHelp = document.getElementById('btn-help');
const helpBackdrop = document.getElementById('help-backdrop') as HTMLElement | null;
const helpCancel = document.getElementById('help-cancel');

// 슬라이더
const speedSlider = document.getElementById('speed-slider') as HTMLInputElement | null;
const speedValue  = document.getElementById('speed-value');
const maxBallsSlider = document.getElementById('max-balls-slider') as HTMLInputElement | null;
const maxBallsValue = document.getElementById('max-balls-value');

function updateModalButtonsUI(): void {
    if (!choiceNormal || !choiceSpeed || !choiceHard) return;
    const map = {NORMAL: choiceNormal, SPEED: choiceSpeed, HARD: choiceHard};
    Object.values(map).forEach(el => {
        el.classList.remove('active');
        el.setAttribute('aria-pressed', 'false');
    });
    const active = map[S.currentMode];
    if (active) {
        active.classList.add('active');
        active.setAttribute('aria-pressed', 'true');
    }
}

function updateSizeButtonsUI(): void {
    const map = {SMALL: sizeSmall, NORMAL: sizeNormal, LARGE: sizeLarge, XLARGE: sizeXLarge};
    const isHard = S.currentMode === C.MODES.HARD;

    Object.entries(map).forEach(([size, el]) => {
        if (!el) return;
        el.classList.remove('active', 'locked');
        el.removeAttribute('disabled');
        el.setAttribute('aria-pressed', 'false');

        // 하드 모드에서는 SMALL, NORMAL 잠금
        if (isHard && (size === 'SMALL' || size === 'NORMAL')) {
            el.classList.add('locked');
            el.setAttribute('disabled', 'true');
        }
    });

    const active = map[S.currentSize as keyof typeof map];
    if (active) {
        active.classList.add('active');
        active.setAttribute('aria-pressed', 'true');
    }
}

function openModal(backdropElement: HTMLElement, focusElement: HTMLElement | null): void {
    if (S.uiModalOpen) return;
    S.setWasPausedBeforeModal(S.paused);
    S.setUiModalOpen(true);
    S.setPaused(true);
    backdropElement.hidden = false;
    focusElement?.focus();
}

function closeModal(backdropElement: HTMLElement): void {
    if (!S.uiModalOpen) return;
    S.setUiModalOpen(false);
    backdropElement.hidden = true;
    S.setPaused(S.wasPausedBeforeModal);
    canvas?.focus();
}

export function initUI(canvasElement: HTMLCanvasElement, callbacks: {
    onReset: () => void,
    onSetMode: (mode: C.ModeType) => void,
    onSetSize: (size: C.SizePresetType) => void,
    onSetSpeed: (scale: number) => void,
    onSetMaxBalls: (count: number) => void
}): void {
    canvas = canvasElement;
    resetGameCallback = callbacks.onReset;
    setModeCallback = callbacks.onSetMode;
    setSizeCallback = callbacks.onSetSize;
    setSpeedCallback = callbacks.onSetSpeed;
    setMaxBallsCallback = callbacks.onSetMaxBalls;

    // 리셋 버튼
    btnReset?.addEventListener('click', () => {
        resetGameCallback();
    });

    // 모드 모달
    btnMode?.addEventListener('click', () => { if (backdrop) { openModal(backdrop, choiceNormal); updateModalButtonsUI(); } });
    btnCancel?.addEventListener('click', () => { if (backdrop) closeModal(backdrop); });
    backdrop?.addEventListener('click', (e) => { if (backdrop && e.target === backdrop) closeModal(backdrop); });
    choiceNormal?.addEventListener('click', () => { if (backdrop) { closeModal(backdrop); setModeCallback(C.MODES.NORMAL); } });
    choiceSpeed?.addEventListener('click', () => { if (backdrop) { closeModal(backdrop); setModeCallback(C.MODES.SPEED); } });
    choiceHard?.addEventListener('click', () => { if (backdrop) { closeModal(backdrop); setModeCallback(C.MODES.HARD); } });

    // 크기 모달
    btnSize?.addEventListener('click', () => { if (sizeBackdrop) { openModal(sizeBackdrop, sizeNormal); updateSizeButtonsUI(); } });
    sizeCancel?.addEventListener('click', () => { if (sizeBackdrop) closeModal(sizeBackdrop); });
    sizeBackdrop?.addEventListener('click', (e) => { if (sizeBackdrop && e.target === sizeBackdrop) closeModal(sizeBackdrop); });
    sizeSmall?.addEventListener('click', () => { if (sizeBackdrop) { closeModal(sizeBackdrop); setSizeCallback('SMALL'); } });
    sizeNormal?.addEventListener('click', () => { if (sizeBackdrop) { closeModal(sizeBackdrop); setSizeCallback('NORMAL'); } });
    sizeLarge?.addEventListener('click', () => { if (sizeBackdrop) { closeModal(sizeBackdrop); setSizeCallback('LARGE'); } });
    sizeXLarge?.addEventListener('click', () => { if (sizeBackdrop) { closeModal(sizeBackdrop); setSizeCallback('XLARGE'); } });

    // 도움말 모달
    btnHelp?.addEventListener('click', () => { if (helpBackdrop) openModal(helpBackdrop, helpCancel); });
    helpCancel?.addEventListener('click', () => { if (helpBackdrop) closeModal(helpBackdrop); });
    helpBackdrop?.addEventListener('click', (e) => { if (helpBackdrop && e.target === helpBackdrop) closeModal(helpBackdrop); });

    // 속도 슬라이더
    if (speedSlider) {
        speedSlider.value = String(S.ballSpeedScale);
        if (speedValue) speedValue.textContent = `${Math.round(S.ballSpeedScale * 100)}%`;
        speedSlider.addEventListener('input', () => {
            const v = parseFloat(speedSlider.value || '1');
            setSpeedCallback(isNaN(v) ? 1 : v);
            if (speedValue) speedValue.textContent = `${Math.round(S.ballSpeedScale * 100)}%`;
        });
    }

    // 공 최대 개수 슬라이더
    if (maxBallsSlider) {
        maxBallsSlider.value = String(S.maxBallCount);
        if (maxBallsValue) maxBallsValue.textContent = String(S.maxBallCount);
        maxBallsSlider.addEventListener('input', () => {
            const v = parseInt(maxBallsSlider.value || '100');
            setMaxBallsCallback(isNaN(v) ? 100 : v);
            if (maxBallsValue) maxBallsValue.textContent = String(S.maxBallCount);
        });
    }

    // Space 키 이벤트 전파 방지
    [...document.querySelectorAll('button')].forEach(el => {
        el.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });

    updateModalButtonsUI();
    updateSizeButtonsUI();
}

/**
 * 상태(S)의 값을 UI 슬라이더에 반영합니다. (어드민 설정 변경 등 외부 요인 시 사용)
 */
export function syncSlidersWithState(): void {
    if (speedSlider) {
        speedSlider.value = String(S.ballSpeedScale);
        if (speedValue) speedValue.textContent = `${Math.round(S.ballSpeedScale * 100)}%`;
    }
    if (maxBallsSlider) {
        // 어드민이 설정한 값이 현재 슬라이더의 최대값보다 크면 최대값도 확장
        const currentMax = parseInt(maxBallsSlider.max || '10000');
        if (S.maxBallCount > currentMax) {
            maxBallsSlider.max = String(S.maxBallCount);
        }
        maxBallsSlider.value = String(S.maxBallCount);
        if (maxBallsValue) maxBallsValue.textContent = String(S.maxBallCount);
    }
}
