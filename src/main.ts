// src/main.ts
import * as C from './constants.js';
import * as S from './state.js';
import * as D from './draw.js';
import * as U from './utils.js';
import { initUI } from './ui.js';
import { initAudio, playSound } from './sound.js';

// --- 초기화 ---
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let keys = new Set<string>();
let mouseX = C.WIDTH / 2;
let mouseSnapLock = false;
let laserCooldown = 0;

function setupCanvasResolution(): void {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(C.WIDTH * dpr);
    canvas.height = Math.floor(C.HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// --- 게임 로직 ---

function buildLevel(): void {
    const newBricks: S.Brick[] = [];
    const preset = C.SIZE_PRESET[S.currentSize] || C.SIZE_PRESET.NORMAL;
    const rows = preset.rows;
    const cols = preset.cols;

    const usableW = C.WIDTH - C.BRICKS.offsetLeft * 2;
    const brickW = Math.floor((usableW - (cols - 1) * C.BRICKS.padding) / cols);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const brick: S.Brick = {
                x: C.BRICKS.offsetLeft + c * (brickW + C.BRICKS.padding),
                y: C.BRICKS.offsetTop + r * (C.BRICKS.height + C.BRICKS.padding),
                w: brickW,
                h: C.BRICKS.height,
                alive: true,
                type: C.BLOCK_TYPES.NORMAL,
                hp: 1,
            };

            const rand = Math.random();
            if (rand < 0.1) {
                brick.type = C.BLOCK_TYPES.DURABLE;
                brick.hp = 2;
            } else if (rand < 0.15) {
                brick.type = C.BLOCK_TYPES.EXPLOSIVE;
            }

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
}

function makeBall(stick = true, angle: number | null = null): S.Ball {
    const x = S.paddle.x + S.paddle.width / 2;
    const y = S.paddle.y - S.baseBall.radius - 1;
    const b: S.Ball = { 
        x, y, vx: 0, vy: 0, 
        radius: S.baseBall.radius, 
        speed: S.baseBall.speed * S.ballSpeedScale, 
        stuck: stick,
        trails: [] 
    };
    if (!stick) {
        const ang = angle ?? U.randRange(-Math.PI / 4, Math.PI / 4);
        b.vx = Math.cos(ang) * b.speed;
        b.vy = -Math.sin(Math.PI / 2 - ang) * b.speed;
    }
    return b;
}

function resetBalls(stick = true): void {
    S.resetBalls([makeBall(stick)]);
}

function resetGame(): void {
    S.setScore(0);
    S.setLives(3);
    S.setWon(false);
    S.setRunning(true);
    S.setExtendTimer(0);
    S.setFullWidthTimer(0);
    S.setLaserTimer(0);
    S.setShakeAmount(0);
    S.setCombo(0);
    S.setComboTimer(0);
    S.resetItems();
    S.resetLasers();
    buildLevel();
    S.paddle.x = C.WIDTH / 2 - C.PADDLE.width / 2;
    S.paddle.width = C.PADDLE.width;
    resetBalls(true);
    canvas.focus();
}

function setMode(mode: C.ModeType): void {
    S.setCurrentMode(mode);
    resetGame();
}

function setSize(size: C.SizePresetType): void {
    S.setCurrentSize(size);
    resetGame();
}

function setSpeed(scale: number): void {
    const newScale = U.clamp(scale, 0.5, 2.0);
    if (newScale === S.ballSpeedScale) return;

    const ratio = newScale / S.ballSpeedScale;
    S.setBallSpeedScale(newScale);

    for (const b of S.balls) {
        if (!b.stuck) {
            b.vx *= ratio;
            b.vy *= ratio;
        }
        b.speed = C.BALL.speed * S.ballSpeedScale;
    }
}

function setMaxBalls(count: number): void {
    S.setMaxBallCount(count);
}

function reflectBallFromPaddle(b: S.Ball): void {
    const hitPos = (b.x - (S.paddle.x + S.paddle.width / 2)) / (S.paddle.width / 2);
    const maxBounce = Math.PI / 3;
    const angle = hitPos * maxBounce;
    const speed = Math.hypot(b.vx, b.vy) || b.speed;
    b.vx = Math.sin(angle) * speed;
    b.vy = -Math.cos(angle) * speed;
}

function applyPaddleWidthByPower(): void {
    if (S.fullWidthTimer > 0) {
        S.paddle.width = C.WIDTH - 16;
    } else if (S.extendTimer > 0) {
        S.paddle.width = C.PADDLE.width * 1.8;
    } else {
        S.paddle.width = C.PADDLE.width;
    }
    S.paddle.x = U.clamp(S.paddle.x, 8, C.WIDTH - S.paddle.width - 8);
}

function spawnItemAt(brick: S.Brick): void {
    let dropChance = S.currentMode === C.MODES.SPEED ? 1.0 : S.currentMode === C.MODES.HARD ? 0.12 : 0.35;
    if (Math.random() > dropChance) return;

    const wExtend = (S.extendTimer > 0 || S.fullWidthTimer > 0) ? 0 : 40;
    let weighted: { type: C.ItemType, w: number }[] = [
        { type: C.ITEM_TYPES.EXTEND, w: wExtend },
        { type: C.ITEM_TYPES.MULTI2, w: 35 },
        { type: C.ITEM_TYPES.TRIPLE, w: 23 },
        { type: C.ITEM_TYPES.LASER, w: 15 },
    ];
    if (S.currentMode !== C.MODES.HARD) {
        weighted.push({ type: C.ITEM_TYPES.FULLWIDTH, w: 2 });
    }

    if (weighted.every(w => w.w <= 0)) return;

    const selectedType = U.randChoiceWeighted(weighted);
    const w = 46, h = 22;
    S.items.push({ x: brick.x + brick.w / 2 - w / 2, y: brick.y + brick.h / 2 - h / 2, w, h, vy: 140, type: selectedType });
}

function applyItem(type: C.ItemType): void {
    switch (type) {
        case C.ITEM_TYPES.EXTEND: S.setExtendTimer(12); break;
        case C.ITEM_TYPES.FULLWIDTH: S.setFullWidthTimer(8); break;
        case C.ITEM_TYPES.LASER: S.setLaserTimer(10); break;
        case C.ITEM_TYPES.TRIPLE: {
            let slots = Math.max(0, S.maxBallCount - S.balls.length);
            if (slots <= 0) break;
            const originals = S.balls.slice();
            for (const src of originals) {
                if (slots <= 0) break;
                if (src.stuck) {
                    if (slots-- > 0) S.balls.push(makeBall(false, -Math.PI / 4));
                    if (slots-- > 0) S.balls.push(makeBall(false, Math.PI / 4));
                } else {
                    const srcSpeed = Math.hypot(src.vx, src.vy) || (S.baseBall.speed * S.ballSpeedScale);
                    const dir = Math.atan2(src.vy, src.vx);
                    const offset = Math.PI / 10;
                    if (slots-- > 0) S.balls.push({ 
                        x: src.x, y: src.y, 
                        vx: Math.cos(dir + offset) * srcSpeed, 
                        vy: Math.sin(dir + offset) * srcSpeed, 
                        radius: S.baseBall.radius, 
                        speed: srcSpeed, 
                        stuck: false, 
                        trails: [] 
                    });
                    if (slots-- > 0) S.balls.push({ 
                        x: src.x, y: src.y, 
                        vx: Math.cos(dir - offset) * srcSpeed, 
                        vy: Math.sin(dir - offset) * srcSpeed, 
                        radius: S.baseBall.radius, 
                        speed: srcSpeed, 
                        stuck: false, 
                        trails: [] 
                    });
                }
            }
            break;
        }
            case C.ITEM_TYPES.MULTI2: {
                let slots = Math.max(0, S.maxBallCount - S.balls.length);
                if (slots <= 0) break;
                const angles = [-Math.PI / 6, -Math.PI / 3.5];
                for (let i = 0; i < angles.length && slots > 0; i++, slots--) {
                    S.balls.push(makeBall(false, angles[i]));
                }
                break;
            }
        }
    }

    function handleBrickCollision(brick: S.Brick): void {
        if (!brick.alive) return;

        // 콤보 및 점수 계산
        S.setCombo(S.combo + 1);
        S.setComboTimer(C.SCORING.COMBO_WINDOW);
        const multiplier = S.combo * S.balls.length;
        const basePoints = brick.type === C.BLOCK_TYPES.EXPLOSIVE ? 20 : C.SCORING.BRICK;
        S.setScore(S.score + basePoints * multiplier);

        if (brick.type === C.BLOCK_TYPES.DURABLE) {
            brick.hp--;
            playSound('bounce');
            S.setShakeAmount(1); // 최소한의 피드백
            if (brick.hp > 0) {
                return;
            }
        }

        if (brick.type === C.BLOCK_TYPES.EXPLOSIVE) {
            brick.alive = false;
            playSound('break');
            S.setShakeAmount(12); // 폭발만 강하게

            const neighbors = S.bricks.filter(other =>
                other.alive &&
                other !== brick &&
                Math.abs(other.x - brick.x) < brick.w * 1.6 &&
                Math.abs(other.y - brick.y) < brick.h * 1.6
            );
            for (const neighbor of neighbors) {
                handleBrickCollision(neighbor);
            }
            return;
        }

        brick.alive = false;
        spawnItemAt(brick);
        playSound('break');
        S.setShakeAmount(0); // 일반 블록은 흔들림 제거
    }

function update(dt: number): void {
    if (S.uiModalOpen) return;

    if (keys.has('KeyP')) { keys.delete('KeyP'); S.setPaused(!S.paused); }
    if (keys.has('KeyR')) { keys.delete('KeyR'); resetGame(); return; }

    if (S.paused || !S.running) return;

    // 타이머 및 효과 업데이트
    if (S.extendTimer > 0) S.setExtendTimer(Math.max(0, S.extendTimer - dt));
    if (S.fullWidthTimer > 0) S.setFullWidthTimer(Math.max(0, S.fullWidthTimer - dt));
    if (S.laserTimer > 0) S.setLaserTimer(Math.max(0, S.laserTimer - dt));
    if (laserCooldown > 0) laserCooldown = Math.max(0, laserCooldown - dt);
    
    // 콤보 타이머 및 초기화
    if (S.comboTimer > 0) {
        S.setComboTimer(Math.max(0, S.comboTimer - dt));
        if (S.comboTimer === 0) S.setCombo(0);
    }
    
    S.setShakeAmount(Math.max(0, S.shakeAmount - dt * 75)); // 흔들림 감쇠 속도 증가
    S.setBgOffset(S.bgOffset + dt * 20); // 배경 이동

    applyPaddleWidthByPower();

    const moveLeft = keys.has('ArrowLeft') || keys.has('KeyA');
    const moveRight = keys.has('ArrowRight') || keys.has('KeyD');
    let targetX = S.paddle.x;
    if (moveLeft && !moveRight) {
        targetX = S.paddle.x - S.paddle.speed * dt;
    } else if (moveRight && !moveLeft) {
        targetX = S.paddle.x + S.paddle.speed * dt;
    } else if (!mouseSnapLock) {
        targetX = mouseX - S.paddle.width / 2;
    }
    S.paddle.x = U.clamp(targetX, 8, C.WIDTH - S.paddle.width - 8);

    const isBallStuck = S.balls.every(b => b.stuck);

    if (keys.has('Space')) {
        if (isBallStuck) {
            initAudio();
            const b0 = S.balls[0];
            const ang = U.randRange(-Math.PI / 4, Math.PI / 4);
            b0.stuck = false;
            b0.vx = Math.cos(ang) * b0.speed;
            b0.vy = -Math.sin(Math.PI / 2 - ang) * b0.speed;
            S.setShakeAmount(2); // 살짝만
        } else if (S.laserTimer > 0 && laserCooldown === 0) {
            laserCooldown = 0.3;
            const paddleCenter = S.paddle.x + S.paddle.width / 2;
            S.lasers.push({ x: paddleCenter - 40, y: S.paddle.y, w: 4, h: 12, vy: -600 });
            S.lasers.push({ x: paddleCenter + 40, y: S.paddle.y, w: 4, h: 12, vy: -600 });
            playSound('laser');
            S.setShakeAmount(1); // 아주 살짝만
        }
        keys.delete('Space');
    }

    if (isBallStuck) {
        S.balls.forEach(b => { 
            b.x = S.paddle.x + S.paddle.width / 2; 
            b.y = S.paddle.y - b.radius - 1; 
            b.trails = [];
        });
        return;
    }

    for (let i = S.items.length - 1; i >= 0; i--) {
        const it = S.items[i];
        it.y += it.vy * dt;
        it.vy = Math.min(it.vy + 400 * dt, 540);
        if (U.circleRectCollision(it.x + it.w / 2, it.y + it.h / 2, Math.min(it.w, it.h) / 2, S.paddle.x, S.paddle.y, S.paddle.width, S.paddle.height)) {
            applyItem(it.type);
            playSound('item');
            S.setShakeAmount(4); // 아이템 획득 효과 대폭 감소
            S.setScore(S.score + C.SCORING.ITEM_CATCH); // 아이템 획득 점수
            S.items.splice(i, 1);
            continue;
        }
        if (it.y > C.HEIGHT + 40) S.items.splice(i, 1);
    }

    for (let i = S.lasers.length - 1; i >= 0; i--) {
        const l = S.lasers[i];
        l.y += l.vy * dt;
        if (l.y < 0) {
            S.lasers.splice(i, 1);
            continue;
        }
        for (const brick of S.bricks) {
            if (brick.alive && U.circleRectCollision(l.x, l.y, l.w, brick.x, brick.y, brick.w, brick.h)) {
                handleBrickCollision(brick);
                S.lasers.splice(i, 1);
                break;
            }
        }
    }

    for (const b of S.balls) {
        if (b.stuck) continue;

        // 트레일 업데이트
        b.trails.push({ x: b.x, y: b.y });
        if (b.trails.length > 8) b.trails.shift();

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x - b.radius < 0) { 
            b.x = b.radius; b.vx = Math.abs(b.vx); 
            playSound('bounce'); S.setShakeAmount(0.5); // 벽 충돌은 거의 안 느껴지게
        } else if (b.x + b.radius > C.WIDTH) { 
            b.x = C.WIDTH - b.radius; b.vx = -Math.abs(b.vx); 
            playSound('bounce'); S.setShakeAmount(0.5);
        }
        if (b.y - b.radius < 48) { 
            b.y = b.radius + 48; b.vy = Math.abs(b.vy); 
            playSound('bounce'); S.setShakeAmount(0.5);
        }

        if (U.circleRectCollision(b.x, b.y, b.radius, S.paddle.x, S.paddle.y, S.paddle.width, S.paddle.height) && b.vy > 0) {
            b.y = S.paddle.y - b.radius - 0.1;
            reflectBallFromPaddle(b);
            playSound('bounce');
            S.setShakeAmount(1.5); // 패들 충돌 피드백 감소
            
            // 패들 보너스 점수 및 콤보 유지
            S.setScore(S.score + C.SCORING.PADDLE_BOUNCE);
            if (S.combo > 0) S.setComboTimer(C.SCORING.COMBO_WINDOW);
        }

        for (const brick of S.bricks) {
            if (!brick.alive || !U.circleRectCollision(b.x, b.y, b.radius, brick.x, brick.y, brick.w, brick.h)) continue;

            const overlapXLeft = Math.abs((brick.x - b.radius) - b.x);
            const overlapXRight = Math.abs((brick.x + brick.w + b.radius) - b.x);
            const overlapYTop = Math.abs((brick.y - b.radius) - b.y);
            const overlapYBottom = Math.abs((brick.y + brick.h + b.radius) - b.y);

            if (Math.min(overlapXLeft, overlapXRight) < Math.min(overlapYTop, overlapYBottom)) {
                b.vx *= -1;
            } else {
                b.vy *= -1;
            }

            handleBrickCollision(brick);

            const spd = Math.hypot(b.vx, b.vy) * 1.02;
            const dir = Math.atan2(b.vy, b.vx);
            const newSpeed = Math.min(spd, 760 * S.ballSpeedScale);
            b.vx = Math.cos(dir) * newSpeed;
            b.vy = Math.sin(dir) * newSpeed;
            break;
        }
    }

    const bricksLeft = S.bricks.reduce((acc, br) => acc + (br.alive ? 1 : 0), 0);
    if (bricksLeft === 0) {
        S.setWon(true);
        S.setRunning(false);
        S.setShakeAmount(0); // 클리어 시 즉시 흔들림 멈춤
        if (S.score > S.highScore) {
            S.setHighScore(S.score);
            S.saveHighScore();
        }
    }

    for (let i = S.balls.length - 1; i >= 0; i--) {
        if (S.balls[i].y - S.balls[i].radius > C.HEIGHT) S.balls.splice(i, 1);
    }

    if (S.balls.length === 0) {
        S.setLives(S.lives - 1);
        S.setShakeAmount(10); // 목숨 잃을 때 강한 흔들림 대폭 감소
        if (S.lives <= 0) {
            S.setRunning(false);
            if (S.score > S.highScore) {
                S.setHighScore(S.score);
                S.saveHighScore();
            }
        } else {
            S.setExtendTimer(Math.max(0, S.extendTimer - 1.5));
            S.setFullWidthTimer(Math.max(0, S.fullWidthTimer - 1.5));
            S.resetItems();
            S.resetLasers();
            resetBalls(true);
        }
    }
}

function render(): void {
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
    D.drawLasers(ctx);

    if (S.paused && !S.uiModalOpen) {
        D.drawOverlay(ctx, 'PAUSED', 'TAP OR P TO CONTINUE  •  R TO RESET');
    } else if (!S.running) {
        if (S.won) {
            D.drawOverlay(ctx, 'CLEAR!', `SCORE: ${S.score}  •  TAP OR R TO RESET`);
        } else if (S.lives <= 0) {
            D.drawOverlay(ctx, 'GAME OVER', `SCORE: ${S.score}  •  TAP OR R TO RESET`);
        } else {
            D.drawOverlay(ctx, 'STOPPED', 'TAP OR R TO RESET');
        }
    } else if (S.balls.every(b => b.stuck) && !S.uiModalOpen) {
        D.drawOverlay(ctx, 'READY?', 'TAP OR SPACE TO LAUNCH');
    }

    ctx.restore();
}

let last = performance.now();
function loop(ts: number): void {
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
}

// --- 이벤트 리스너 ---
const updatePointerPosition = (e: any): void => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX !== undefined) {
        mouseX = (clientX - rect.left) / rect.width * C.WIDTH;
        mouseSnapLock = false;
    }
};

const handlePointerDown = (e: PointerEvent): void => {
    // 터치 시 화면이 출렁이는 것 방지
    if (e.cancelable) e.preventDefault();
    
    initAudio(); 
    updatePointerPosition(e);

    if (S.uiModalOpen) return;

    // 게임이 실행 중이 아닐 때 (게임 오버, 클리어 등) 화면 터치 시 리셋
    if (!S.running) {
        resetGame();
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
    } else if (S.laserTimer > 0 && laserCooldown === 0) {
        // 모바일 터치 시 레이저 발사 로직 추가
        laserCooldown = 0.3;
        const paddleCenter = S.paddle.x + S.paddle.width / 2;
        S.lasers.push({ x: paddleCenter - 40, y: S.paddle.y, w: 4, h: 12, vy: -600 });
        S.lasers.push({ x: paddleCenter + 40, y: S.paddle.y, w: 4, h: 12, vy: -600 });
        playSound('laser');
        S.setShakeAmount(1);
    }
};

// Pointer Events 사용 (마우스, 터치, 펜 통합)
canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
canvas.addEventListener('pointermove', (e) => {
    updatePointerPosition(e);
}, { passive: true });

// 기존 touch/mouse 이벤트가 pointer 이벤트와 충돌하지 않도록 방지
canvas.style.touchAction = 'none';

window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyP', 'KeyR'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) mouseSnapLock = true;
});
window.addEventListener('keyup', (e: KeyboardEvent) => {
    keys.delete(e.code);
});
window.addEventListener('resize', setupCanvasResolution);

// --- 최종 초기화 ---
S.loadHighScore();
setupCanvasResolution();
initUI(canvas, { onReset: resetGame, onSetMode: setMode, onSetSize: setSize, onSetSpeed: setSpeed, onSetMaxBalls: setMaxBalls });
resetGame();
canvas.focus();
requestAnimationFrame(loop);
