// src/stage.ts
import * as C from './constants.js';
import * as S from './state.js';
import * as D from './draw.js';
import * as U from './utils.js';
import { initUI } from './ui.js';
import { initAudio, playSound } from './sound.js';
import * as I from './input.js';
import * as M from './manager.js';
import * as P from './physics.js';
import { STAGES } from './levels.js';

let currentStageIndex = 0;
let isClearing = false;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function setupCanvasResolution(): void {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(C.WIDTH * dpr);
    canvas.height = Math.floor(C.HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// 스테이지 데이터를 기반으로 블록 생성
function loadStage(index: number): void {
    const stage = STAGES[index];
    if (!stage) return;

    const newBricks: S.Brick[] = [];
    const rows = stage.layout.length;
    const cols = stage.layout[0].length;

    const usableW = C.WIDTH - C.BRICKS.offsetLeft * 2;
    const brickW = Math.floor((usableW - (cols - 1) * C.BRICKS.padding) / cols);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const char = stage.layout[r][c];
            if (char === '.') continue; // 빈 공간

            const brick: S.Brick = {
                x: C.BRICKS.offsetLeft + c * (brickW + C.BRICKS.padding),
                y: C.BRICKS.offsetTop + r * (C.BRICKS.height + C.BRICKS.padding),
                w: brickW,
                h: C.BRICKS.height,
                alive: true,
                type: C.BLOCK_TYPES.NORMAL,
                hp: 1,
            };

            if (char === 'D') {
                brick.type = C.BLOCK_TYPES.DURABLE;
                brick.hp = 2;
            } else if (char === 'E') {
                brick.type = C.BLOCK_TYPES.EXPLOSIVE;
            }

            // 색상 지정
            if (brick.type === C.BLOCK_TYPES.NORMAL) {
                brick.color = C.BLOCK_COLORS.NORMAL[r % C.BLOCK_COLORS.NORMAL.length];
            } else if (brick.type === C.BLOCK_TYPES.DURABLE) {
                brick.color = C.BLOCK_COLORS.DURABLE[brick.hp - 1];
            } else if (brick.type === C.BLOCK_TYPES.EXPLOSIVE) {
                brick.color = C.BLOCK_COLORS.EXPLOSIVE as string;
            }

            newBricks.push(brick);
        }
    }
    S.resetBricks(newBricks);
    M.resetBalls(true);
}

function showClearModal(): void {
    isClearing = true;
    const backdrop = document.getElementById('stage-clear-backdrop')!;
    const info = document.getElementById('clear-info')!;
    info.textContent = `${STAGES[currentStageIndex].name} 완료!`;
    
    const nextBtn = document.getElementById('btn-next-stage') as HTMLButtonElement;
    if (currentStageIndex >= STAGES.length - 1) {
        nextBtn.textContent = "모든 스테이지 클리어!";
        nextBtn.onclick = () => location.href = 'index.html';
    } else {
        nextBtn.textContent = "다음 스테이지";
        nextBtn.onclick = startNextStage;
    }
    
    backdrop.hidden = false;
}

function startNextStage(): void {
    document.getElementById('stage-clear-backdrop')!.hidden = true;
    currentStageIndex++;
    isClearing = false;
    loadStage(currentStageIndex);
}

function handlePointerDown(e: PointerEvent): void {
    if (isClearing) return;
    if (e.cancelable) e.preventDefault();
    initAudio(); 
    I.updatePointerPosition(canvas, e);

    if (!S.running) {
        currentStageIndex = 0;
        M.resetGame();
        loadStage(0);
        return;
    }

    if (S.paused) {
        S.setPaused(false);
        return;
    }

    const isBallStuck = S.balls.every(b => b.stuck);
    if (isBallStuck) {
        const b0 = S.balls[0];
        const ang = U.randRange(-Math.PI / 4, Math.PI / 4);
        b0.stuck = false;
        b0.vx = Math.cos(ang) * b0.speed;
        b0.vy = -Math.sin(Math.PI / 2 - ang) * b0.speed;
        S.setShakeAmount(2);
    }
}

function update(dt: number): void {
    if (S.uiModalOpen || isClearing) return;

    if (I.keys.has('KeyP')) { I.keys.delete('KeyP'); S.setPaused(!S.paused); }
    if (I.keys.has('KeyR')) { I.keys.delete('KeyR'); loadStage(currentStageIndex); return; }

    if (S.paused || !S.running) return;

    // 공통 업데이트 로직 호출 (생략 없이 main.ts와 동일 구조 유지)
    S.setShakeAmount(Math.max(0, S.shakeAmount - dt * 75));
    S.setBgOffset(S.bgOffset + dt * 20);
    M.applyPaddleWidthByPower();

    const moveLeft = I.keys.has('ArrowLeft') || I.keys.has('KeyA');
    const moveRight = I.keys.has('ArrowRight') || I.keys.has('KeyD');
    let targetX = S.paddle.x;
    const paddleSpeed = S.paddle.speed * S.adminPaddleSpeedScale; // 관리자 속도 배율 적용
    if (moveLeft && !moveRight) targetX = S.paddle.x - paddleSpeed * dt;
    else if (moveRight && !moveLeft) targetX = S.paddle.x + paddleSpeed * dt;
    else if (!I.mouseSnapLock) targetX = I.mouseX - S.paddle.width / 2;
    S.paddle.x = U.clamp(targetX, 8, C.WIDTH - S.paddle.width - 8);

    if (S.balls.every(b => b.stuck)) {
        S.balls.forEach(b => { 
            b.x = S.paddle.x + S.paddle.width / 2; 
            b.y = S.paddle.y - b.radius - 1; 
        });
    } else {
        // 아이템 업데이트
        for (let i = S.items.length - 1; i >= 0; i--) {
            const it = S.items[i];
            it.y += it.vy * dt;
            if (U.circleRectCollision(it.x + it.w / 2, it.y + it.h / 2, Math.min(it.w, it.h) / 2, S.paddle.x, S.paddle.y, S.paddle.width, S.paddle.height)) {
                M.applyItem(it.type);
                playSound('item');
                S.setShakeAmount(4);
                let itemScore = C.SCORING.ITEM_CATCH;
                if (S.adminRank >= 2 && S.adminScoreMultiplier !== 1.0) itemScore *= S.adminScoreMultiplier;
                S.setScore(S.score + itemScore);
                S.items.splice(i, 1);
                continue;
            }
            if (it.y > C.HEIGHT + 40) S.items.splice(i, 1);
        }

        // 공 업데이트
        for (const b of S.balls) {
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.x - b.radius < 0 || b.x + b.radius > C.WIDTH) { b.vx *= -1; playSound('bounce'); }
            if (b.y - b.radius < 48) { b.vy *= -1; playSound('bounce'); }
            if (U.circleRectCollision(b.x, b.y, b.radius, S.paddle.x, S.paddle.y, S.paddle.width, S.paddle.height) && b.vy > 0) {
                P.reflectBallFromPaddle(b); playSound('bounce');
            }
            for (const brick of S.bricks) {
                if (!brick.alive || !U.circleRectCollision(b.x, b.y, b.radius, brick.x, brick.y, brick.w, brick.h)) continue;
                b.vy *= -1; P.handleBrickCollision(brick); break;
            }
        }
    }

    // 결과 판정
    const bricksLeft = S.bricks.reduce((acc, br) => acc + (br.alive ? 1 : 0), 0);
    if (bricksLeft === 0 && !isClearing) {
        showClearModal();
        return;
    }

    for (let i = S.balls.length - 1; i >= 0; i--) {
        if (S.balls[i].y - S.balls[i].radius > C.HEIGHT) S.balls.splice(i, 1);
    }
    if (S.balls.length === 0) {
        S.setLives(S.lives - 1);
        if (S.lives <= 0) S.setRunning(false);
        else M.resetBalls(true);
    }
}

function render(): void {
    ctx.save();
    if (S.shakeAmount > 0) ctx.translate(U.randRange(-S.shakeAmount, S.shakeAmount), U.randRange(-S.shakeAmount, S.shakeAmount));
    D.drawBackground(ctx);
    D.drawHUD(ctx, `STG ${currentStageIndex + 1}: ${STAGES[currentStageIndex].name}`);
    
    D.drawBricks(ctx);
    D.drawPaddle(ctx);
    D.drawBalls(ctx);
    D.drawItems(ctx);
    if (S.paused) D.drawOverlay(ctx, 'PAUSED', 'TAP TO CONTINUE');
    else if (!S.running) D.drawOverlay(ctx, 'GAME OVER', 'TAP TO RESTART');
    ctx.restore();
}

function loop(ts: number): void {
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
}

let last = performance.now();
S.loadHighScore();
setupCanvasResolution();
I.initInput(canvas, handlePointerDown);
initUI(canvas, { 
    onReset: () => loadStage(currentStageIndex), 
    onSetMode: M.setMode, onSetSize: M.setSize, onSetSpeed: M.setSpeed, onSetMaxBalls: M.setMaxBalls 
});
M.resetGame();
loadStage(0);
requestAnimationFrame(loop);
window.addEventListener('resize', setupCanvasResolution);
