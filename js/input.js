// src/input.ts
import * as C from './constants.js';
export let keys = new Set();
export let mouseX = C.WIDTH / 2;
export let mouseSnapLock = false;
export function setMouseSnapLock(val) { mouseSnapLock = val; }
export const updatePointerPosition = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX !== undefined) {
        mouseX = (clientX - rect.left) / rect.width * C.WIDTH;
        mouseSnapLock = false;
    }
};
export function initInput(canvas, onPointerDown) {
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', (e) => {
        updatePointerPosition(canvas, e);
    }, { passive: true });
    canvas.style.touchAction = 'none';
    window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyP', 'KeyR'].includes(e.code))
            e.preventDefault();
        keys.add(e.code);
        if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code))
            mouseSnapLock = true;
    });
    window.addEventListener('keyup', (e) => {
        keys.delete(e.code);
    });
}
//# sourceMappingURL=input.js.map