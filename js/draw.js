// js/draw.js
import * as C from './constants.js';
import * as S from './state.js';
import { roundRect } from './utils.js';

const NEON_CYAN = '#00f3ff';
const NEON_MAGENTA = '#ff00ff';
const NEON_YELLOW = '#f3ff00';

export function drawBackground(ctx) {
    // 1. 기본 어두운 배경
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    // 2. 움직이는 그리드 (사이버펑크 느낌)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offset = S.bgOffset % gridSize;

    ctx.beginPath();
    for (let x = offset; x < C.WIDTH; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, C.HEIGHT);
    }
    for (let y = offset; y < C.HEIGHT; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(C.WIDTH, y);
    }
    ctx.stroke();

    // 3. 비네트 효과 (가장자리 어둡게)
    const vignette = ctx.createRadialGradient(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH * 0.3, C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH * 0.7);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    // 상단 HUD 영역 구분선
    ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.fillRect(0, 47, C.WIDTH, 1);
}

export function drawHUD(ctx) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '700 15px "Orbitron", sans-serif';
    ctx.textBaseline = 'middle';

    // Glow 효과를 위해 두 번 그리기
    const drawTextWithGlow = (text, x, y, align, color = NEON_CYAN) => {
        ctx.textAlign = align;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, y);
    };

    // 상단 행: 점수, 모드, 최고기록
    drawTextWithGlow(`SCORE: ${S.score}`, 20, 16, 'left');
    
    const modeLabel = S.currentMode === C.MODES.SPEED ? 'SPEED' : S.currentMode === C.MODES.HARD ? 'HARD' : 'NORMAL';
    drawTextWithGlow(`MODE: ${modeLabel}`, C.WIDTH / 2, 16, 'center', NEON_MAGENTA);
    
    drawTextWithGlow(`HIGH: ${S.highScore}`, C.WIDTH - 20, 16, 'right');

    // 하단 행: 콤보, 멀티볼, 목숨
    if (S.combo > 1) {
        const comboScale = 1 + Math.min(S.combo * 0.05, 0.3);
        ctx.save();
        ctx.translate(20, 35);
        ctx.scale(comboScale, comboScale);
        drawTextWithGlow(`${S.combo} COMBO`, 0, 0, 'left', NEON_YELLOW);
        ctx.restore();
    }

    if (S.balls.length > 1) {
        drawTextWithGlow(`x${S.balls.length} BALLS`, C.WIDTH / 2, 35, 'center', NEON_CYAN);
    }

    drawTextWithGlow(`LIVES: ${S.lives}`, C.WIDTH - 20, 35, 'right', NEON_YELLOW);
}

export function drawPaddle(ctx) {
    const { x, y, width: w, height: h } = S.paddle;
    const r = 6;

    // 패들 본체 Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = S.laserTimer > 0 ? NEON_MAGENTA : NEON_CYAN;
    
    const g = ctx.createLinearGradient(x, y, x, y + h);
    if (S.laserTimer > 0) {
        g.addColorStop(0, '#ff44aa');
        g.addColorStop(1, '#880044');
    } else {
        g.addColorStop(0, '#00d2ff');
        g.addColorStop(1, '#0055ff');
    }

    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, x + 4, y + 3, w - 8, 3, 2);
    ctx.fill();
}

export function drawBalls(ctx) {
    for (const b of S.balls) {
        // 1. 트레일 그리기
        if (b.trails) {
            for (let i = 0; i < b.trails.length; i++) {
                const pos = b.trails[i];
                const alpha = (i + 1) / b.trails.length * 0.4;
                const radius = b.radius * (0.5 + (i / b.trails.length) * 0.5);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 209, 102, ${alpha})`;
                ctx.fill();
            }
        }

        // 2. 공 본체
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd166';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius - 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd166';
        ctx.fill();

        // 반사광
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawItems(ctx) {
    for (const it of S.items) {
        const color = ({
            [C.ITEM_TYPES.EXTEND]: NEON_CYAN,
            [C.ITEM_TYPES.MULTI2]: '#4ea8de',
            [C.ITEM_TYPES.BIGBALL]: NEON_YELLOW,
            [C.ITEM_TYPES.FULLWIDTH]: NEON_MAGENTA,
            [C.ITEM_TYPES.LASER]: '#ff3333'
        })[it.type] || '#999';

        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        roundRect(ctx, it.x, it.y, it.w, it.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((
            {
                [C.ITEM_TYPES.EXTEND]: 'XL',
                [C.ITEM_TYPES.MULTI2]: '+2',
                [C.ITEM_TYPES.BIGBALL]: '3X',
                [C.ITEM_TYPES.FULLWIDTH]: 'MAX',
                [C.ITEM_TYPES.LASER]: 'LSR'
            })[it.type] || '?',
            it.x + it.w / 2,
            it.y + it.h / 2 + 5
        );
    }
}

export function drawLasers(ctx) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = NEON_MAGENTA;
    ctx.fillStyle = '#fff';
    for (const laser of S.lasers) {
        ctx.fillRect(laser.x - laser.w / 2, laser.y, laser.w, laser.h);
    }
    ctx.shadowBlur = 0;
}

export function drawBricks(ctx) {
    for (const b of S.bricks) {
        if (!b.alive) continue;

        let color = b.color;
        if (b.type === C.BLOCK_TYPES.DURABLE) {
            color = C.BLOCK_COLORS.DURABLE[b.hp - 1];
        }

        // 브릭 본체
        ctx.fillStyle = color;
        roundRect(ctx, b.x, b.y, b.w, b.h, 4);
        ctx.fill();

        // 유리 질감 (하이라이트)
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(b.x + 2, b.y + 2);
        ctx.lineTo(b.x + b.w - 2, b.y + 2);
        ctx.lineTo(b.x + b.w - 6, b.y + 6);
        ctx.lineTo(b.x + 6, b.y + 6);
        ctx.fill();

        // 테두리
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, b.x, b.y, b.w, b.h, 4);
        ctx.stroke();

        if (b.type === C.BLOCK_TYPES.EXPLOSIVE) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = NEON_YELLOW;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

export function drawOverlay(ctx, text, sub) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 메인 텍스트 Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = NEON_CYAN;
    ctx.fillStyle = '#fff';
    ctx.font = '900 60px "Orbitron", sans-serif';
    ctx.fillText(text, C.WIDTH / 2, C.HEIGHT / 2 - 30);
    
    if (sub) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = NEON_MAGENTA;
        ctx.font = '700 20px "Orbitron", sans-serif';
        ctx.fillStyle = '#e6f4ff';
        ctx.fillText(sub, C.WIDTH / 2, C.HEIGHT / 2 + 40);
    }
    ctx.shadowBlur = 0;
}
