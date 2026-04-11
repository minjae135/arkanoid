// js/ui.js
import * as S from './state.js';
import * as C from './constants.js';

let canvas, resetGameCallback, setModeCallback, setSizeCallback, setSpeedCallback;

// 모달 UI 요소
const btnMode = document.getElementById('btn-mode');
const backdrop = document.getElementById('mode-backdrop');
const btnCancel = document.getElementById('mode-cancel');
const choiceNormal = document.getElementById('choice-normal');
const choiceSpeed = document.getElementById('choice-speed');
const choiceHard = document.getElementById('choice-hard');

const btnSize = document.getElementById('btn-size');
const sizeBackdrop = document.getElementById('size-backdrop');
const sizeCancel = document.getElementById('size-cancel');
const sizeSmall = document.getElementById('size-small');
const sizeNormal = document.getElementById('size-normal');
const sizeLarge = document.getElementById('size-large');
const sizeXLarge = document.getElementById('size-xlarge');

const btnHelp = document.getElementById('btn-help');
const helpBackdrop = document.getElementById('help-backdrop');
const helpCancel = document.getElementById('help-cancel');

// 속도 슬라이더
const speedSlider = document.getElementById('speed-slider');
const speedValue  = document.getElementById('speed-value');

function updateModalButtonsUI() {
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

function updateSizeButtonsUI() {
    const map = {SMALL: sizeSmall, NORMAL: sizeNormal, LARGE: sizeLarge, XLARGE: sizeXLarge};
    Object.values(map).forEach(el => {
        el?.classList.remove('active');
        el?.setAttribute('aria-pressed', 'false');
    });
    const active = map[S.currentSize];
    if (active) {
        active.classList.add('active');
        active.setAttribute('aria-pressed', 'true');
    }
}

function openModal(backdropElement, focusElement) {
    if (S.uiModalOpen) return;
    S.setWasPausedBeforeModal(S.paused);
    S.setUiModalOpen(true);
    S.setPaused(true);
    backdropElement.hidden = false;
    focusElement?.focus();
}

function closeModal(backdropElement) {
    if (!S.uiModalOpen) return;
    S.setUiModalOpen(false);
    backdropElement.hidden = true;
    S.setPaused(S.wasPausedBeforeModal);
    canvas?.focus();
}

export function initUI(canvasElement, callbacks) {
    canvas = canvasElement;
    resetGameCallback = callbacks.onReset;
    setModeCallback = callbacks.onSetMode;
    setSizeCallback = callbacks.onSetSize;
    setSpeedCallback = callbacks.onSetSpeed;

    // 모드 모달
    btnMode?.addEventListener('click', () => { openModal(backdrop, choiceNormal); updateModalButtonsUI(); });
    btnCancel?.addEventListener('click', () => closeModal(backdrop));
    backdrop?.addEventListener('click', (e) => e.target === backdrop && closeModal(backdrop));
    choiceNormal?.addEventListener('click', () => { closeModal(backdrop); setModeCallback(C.MODES.NORMAL); });
    choiceSpeed?.addEventListener('click', () => { closeModal(backdrop); setModeCallback(C.MODES.SPEED); });
    choiceHard?.addEventListener('click', () => { closeModal(backdrop); setModeCallback(C.MODES.HARD); });

    // 크기 모달
    btnSize?.addEventListener('click', () => { openModal(sizeBackdrop, sizeNormal); updateSizeButtonsUI(); });
    sizeCancel?.addEventListener('click', () => closeModal(sizeBackdrop));
    sizeBackdrop?.addEventListener('click', (e) => e.target === sizeBackdrop && closeModal(sizeBackdrop));
    sizeSmall?.addEventListener('click', () => { closeModal(sizeBackdrop); setSizeCallback('SMALL'); });
    sizeNormal?.addEventListener('click', () => { closeModal(sizeBackdrop); setSizeCallback('NORMAL'); });
    sizeLarge?.addEventListener('click', () => { closeModal(sizeBackdrop); setSizeCallback('LARGE'); });
    sizeXLarge?.addEventListener('click', () => { closeModal(sizeBackdrop); setSizeCallback('XLARGE'); });

    // 도움말 모달
    btnHelp?.addEventListener('click', () => openModal(helpBackdrop, helpCancel));
    helpCancel?.addEventListener('click', () => closeModal(helpBackdrop));
    helpBackdrop?.addEventListener('click', (e) => e.target === helpBackdrop && closeModal(helpBackdrop));

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

    // Space 키 이벤트 전파 방지
    [...document.querySelectorAll('button')].forEach(el => {
        el.addEventListener('keydown', e => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });

    updateModalButtonsUI();
    updateSizeButtonsUI();
}
