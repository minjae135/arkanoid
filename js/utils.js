// js/utils.js

/**
 * 값을 최소값과 최대값 사이로 제한합니다.
 * @param {number} v - 현재 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} - 제한된 값
 */
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * 두 수 사이의 랜덤 실수를 반환합니다.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export const randRange = (a, b) => a + Math.random() * (b - a);

/**
 * 가중치를 기반으로 배열에서 항목을 랜덤하게 선택합니다.
 * @param {{type: any, w: number}[]} pairs - {type, w: weight} 형태의 객체 배열
 * @returns {any}
 */
export function randChoiceWeighted(pairs) {
    const sum = pairs.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * sum;
    for (const p of pairs) {
        r -= p.w;
        if (r <= 0) return p.type;
    }
    return pairs[pairs.length - 1].type;
}

/**
 * 원과 사각형의 충돌을 감지합니다.
 */
export function circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
    let nearestX = Math.max(rx, Math.min(cx, rx + rw));
    let nearestY = Math.max(ry, Math.min(cy, ry + rh));

    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return (dx * dx + dy * dy) <= r * r;
}

/**
 * 둥근 모서리 사각형을 그립니다.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
export function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
}
