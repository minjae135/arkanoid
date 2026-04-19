// src/classic.ts
import * as C from './constants.js';
import * as S from './state.js';
import * as D from './draw.js';
import * as U from './utils.js';
import { initUI } from './ui.js';
import { initAudio, playSound } from './sound.js';
import * as I from './input.js';
import * as M from './manager.js';
import * as P from './physics.js';
// --- 초기화 ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function setupCanvasResolution() {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(C.WIDTH * dpr);
    canvas.height = Math.floor(C.HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
// --- 게임 로직 연동 ---
function handlePointerDown(e) {
    if (e.cancelable)
        e.preventDefault();
    initAudio();
    I.updatePointerPosition(canvas, e);
    if (S.uiModalOpen)
        return;
    if (!S.running) {
        M.resetGame();
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
function update(dt) {
    if (S.uiModalOpen)
        return;
    if (I.keys.has('KeyP')) {
        I.keys.delete('KeyP');
        S.setPaused(!S.paused);
    }
    if (I.keys.has('KeyR')) {
        I.keys.delete('KeyR');
        M.resetGame();
        return;
    }
    if (S.paused || !S.running)
        return;
    // 타이머 및 효과 업데이트
    if (S.extendTimer > 0)
        S.setExtendTimer(Math.max(0, S.extendTimer - dt));
    if (S.fullWidthTimer > 0)
        S.setFullWidthTimer(Math.max(0, S.fullWidthTimer - dt));
    if (S.comboTimer > 0) {
        S.setComboTimer(Math.max(0, S.comboTimer - dt));
        if (S.comboTimer === 0)
            S.setCombo(0);
    }
    S.setShakeAmount(Math.max(0, S.shakeAmount - dt * 75));
    S.setBgOffset(S.bgOffset + dt * 20);
    M.applyPaddleWidthByPower();
    const moveLeft = I.keys.has('ArrowLeft') || I.keys.has('KeyA');
    const moveRight = I.keys.has('ArrowRight') || I.keys.has('KeyD');
    let targetX = S.paddle.x;
    const paddleSpeed = S.paddle.speed * S.adminPaddleSpeedScale; // 관리자 속도 배율 적용
    if (moveLeft && !moveRight) {
        targetX = S.paddle.x - paddleSpeed * dt;
    }
    else if (moveRight && !moveLeft) {
        targetX = S.paddle.x + paddleSpeed * dt;
    }
    else if (!I.mouseSnapLock) {
        targetX = I.mouseX - S.paddle.width / 2;
    }
    S.paddle.x = U.clamp(targetX, 8, C.WIDTH - S.paddle.width - 8);
    const isBallStuck = S.balls.every(b => b.stuck);
    if (I.keys.has('Space')) {
        if (isBallStuck) {
            initAudio();
            const b0 = S.balls[0];
            const ang = U.randRange(-Math.PI / 4, Math.PI / 4);
            b0.stuck = false;
            b0.vx = Math.cos(ang) * b0.speed;
            b0.vy = -Math.sin(Math.PI / 2 - ang) * b0.speed;
            S.setShakeAmount(2);
        }
        I.keys.delete('Space');
    }
    if (isBallStuck) {
        S.balls.forEach(b => {
            b.x = S.paddle.x + S.paddle.width / 2;
            b.y = S.paddle.y - b.radius - 1;
            b.trails = [];
        });
        return;
    }
    // 아이템 업데이트
    for (let i = S.items.length - 1; i >= 0; i--) {
        const it = S.items[i];
        it.y += it.vy * dt;
        it.vy = Math.min(it.vy + 400 * dt, 540);
        if (U.circleRectCollision(it.x + it.w / 2, it.y + it.h / 2, Math.min(it.w, it.h) / 2, S.paddle.x, S.paddle.y, S.paddle.width, S.paddle.height)) {
            M.applyItem(it.type);
            playSound('item');
            S.setShakeAmount(4);
            let itemScore = C.SCORING.ITEM_CATCH;
            if (S.adminRank >= 2 && S.adminScoreMultiplier !== 1.0)
                itemScore *= S.adminScoreMultiplier;
            S.setScore(S.score + itemScore);
            S.items.splice(i, 1);
            continue;
        }
        if (it.y > C.HEIGHT + 40)
            S.items.splice(i, 1);
    }
    // 공 업데이트 및 충돌
    for (const b of S.balls) {
        if (b.stuck)
            continue;
        b.trails.push({ x: b.x, y: b.y });
        if (b.trails.length > 8)
            b.trails.shift();
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x - b.radius < 0) {
            b.x = b.radius;
            b.vx = Math.abs(b.vx);
            playSound('bounce');
            S.setShakeAmount(0.5);
        }
        else if (b.x + b.radius > C.WIDTH) {
            b.x = C.WIDTH - b.radius;
            b.vx = -Math.abs(b.vx);
            playSound('bounce');
            S.setShakeAmount(0.5);
        }
        if (b.y - b.radius < 48) {
            b.y = b.radius + 48;
            b.vy = Math.abs(b.vy);
            playSound('bounce');
            S.setShakeAmount(0.5);
        }
        if (U.circleRectCollision(b.x, b.y, b.radius, S.paddle.x, S.paddle.y, S.paddle.width, S.paddle.height) && b.vy > 0) {
            b.y = S.paddle.y - b.radius - 0.1;
            P.reflectBallFromPaddle(b);
            playSound('bounce');
            S.setShakeAmount(1.5);
            // 패들 보너스 점수 및 콤보 유지
            let paddleBonus = C.SCORING.PADDLE_BOUNCE;
            if (S.adminRank >= 2 && S.adminScoreMultiplier !== 1.0) {
                paddleBonus *= S.adminScoreMultiplier;
            }
            S.setScore(S.score + paddleBonus);
            if (S.combo > 0)
                S.setComboTimer(C.SCORING.COMBO_WINDOW);
        }
        for (const brick of S.bricks) {
            if (!brick.alive || !U.circleRectCollision(b.x, b.y, b.radius, brick.x, brick.y, brick.w, brick.h))
                continue;
            const overlapXLeft = Math.abs((brick.x - b.radius) - b.x);
            const overlapXRight = Math.abs((brick.x + brick.w + b.radius) - b.x);
            const overlapYTop = Math.abs((brick.y - b.radius) - b.y);
            const overlapYBottom = Math.abs((brick.y + brick.h + b.radius) - b.y);
            if (Math.min(overlapXLeft, overlapXRight) < Math.min(overlapYTop, overlapYBottom)) {
                b.vx *= -1;
            }
            else {
                b.vy *= -1;
            }
            P.handleBrickCollision(brick);
            const spd = Math.hypot(b.vx, b.vy) * 1.02;
            const dir = Math.atan2(b.vy, b.vx);
            const newSpeed = Math.min(spd, 760 * S.ballSpeedScale);
            b.vx = Math.cos(dir) * newSpeed;
            b.vy = Math.sin(dir) * newSpeed;
            break;
        }
    }
    // 결과 판정
    const bricksLeft = S.bricks.reduce((acc, br) => acc + (br.alive ? 1 : 0), 0);
    if (bricksLeft === 0) {
        S.setWon(true);
        S.setRunning(false);
        S.setShakeAmount(0);
        if (S.score > S.highScore) {
            S.setHighScore(S.score);
            S.saveHighScore();
        }
    }
    for (let i = S.balls.length - 1; i >= 0; i--) {
        if (S.balls[i].y - S.balls[i].radius > C.HEIGHT)
            S.balls.splice(i, 1);
    }
    if (S.balls.length === 0) {
        // 관리자 무적 모드 체크
        if (S.adminRank >= 1 && S.godMode) {
            S.setShakeAmount(5); // 무적 모드 시에도 약간의 피드백
            M.resetBalls(true);
            return;
        }
        S.setLives(S.lives - 1);
        S.setShakeAmount(10);
        if (S.lives <= 0) {
            S.setRunning(false);
            if (S.score > S.highScore) {
                S.setHighScore(S.score);
                S.saveHighScore();
            }
        }
        else {
            S.setExtendTimer(Math.max(0, S.extendTimer - 1.5));
            S.setFullWidthTimer(Math.max(0, S.fullWidthTimer - 1.5));
            S.resetItems();
            M.resetBalls(true);
        }
    }
}
function render() {
    ctx.save();
    if (S.shakeAmount > 0) {
        ctx.translate(U.randRange(-S.shakeAmount, S.shakeAmount), U.randRange(-S.shakeAmount, S.shakeAmount));
    }
    D.drawBackground(ctx);
    D.drawHUD(ctx);
    D.drawBricks(ctx);
    D.drawPaddle(ctx);
    D.drawBalls(ctx);
    D.drawItems(ctx);
    if (S.paused && !S.uiModalOpen) {
        D.drawOverlay(ctx, 'PAUSED', 'TAP OR P TO CONTINUE  •  R TO RESET');
    }
    else if (!S.running) {
        if (S.won) {
            D.drawOverlay(ctx, 'CLEAR!', `SCORE: ${S.score.toLocaleString()}  •  TAP OR R TO RESET`);
        }
        else if (S.lives <= 0) {
            D.drawOverlay(ctx, 'GAME OVER', `SCORE: ${S.score.toLocaleString()}  •  TAP OR R TO RESET`);
        }
        else {
            D.drawOverlay(ctx, 'STOPPED', 'TAP OR R TO RESET');
        }
    }
    else if (S.balls.every(b => b.stuck) && !S.uiModalOpen) {
        D.drawOverlay(ctx, 'READY?', 'TAP OR SPACE TO LAUNCH');
    }
    ctx.restore();
}
let last = performance.now();
function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
}
// --- 최종 초기화 ---
S.loadHighScore();
setupCanvasResolution();
I.initInput(canvas, handlePointerDown);
initUI(canvas, {
    onReset: M.resetGame,
    onSetMode: M.setMode,
    onSetSize: M.setSize,
    onSetSpeed: M.setSpeed,
    onSetMaxBalls: M.setMaxBalls
});
M.resetGame();
canvas.focus();
requestAnimationFrame(loop);
window.addEventListener('resize', setupCanvasResolution);
//# sourceMappingURL=classic.js.map