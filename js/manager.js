// src/manager.ts
import * as C from './constants.js';
import * as S from './state.js';
import * as U from './utils.js';
export let laserCooldown = 0;
export function setLaserCooldown(val) { laserCooldown = val; }
export function buildLevel() {
    const newBricks = [];
    const preset = C.SIZE_PRESET[S.currentSize] || C.SIZE_PRESET.NORMAL;
    const rows = preset.rows;
    const cols = preset.cols;
    const usableW = C.WIDTH - C.BRICKS.offsetLeft * 2;
    const brickW = Math.floor((usableW - (cols - 1) * C.BRICKS.padding) / cols);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const brick = {
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
            }
            else if (rand < 0.15) {
                brick.type = C.BLOCK_TYPES.EXPLOSIVE;
            }
            if (brick.type === C.BLOCK_TYPES.NORMAL) {
                brick.color = C.BLOCK_COLORS.NORMAL[r % C.BLOCK_COLORS.NORMAL.length];
            }
            else if (brick.type === C.BLOCK_TYPES.DURABLE) {
                brick.color = C.BLOCK_COLORS.DURABLE[brick.hp - 1];
            }
            else if (brick.type === C.BLOCK_TYPES.EXPLOSIVE) {
                brick.color = C.BLOCK_COLORS.EXPLOSIVE;
            }
            newBricks.push(brick);
        }
    }
    S.resetBricks(newBricks);
}
export function makeBall(stick = true, angle = null) {
    const x = S.paddle.x + S.paddle.width / 2;
    const y = S.paddle.y - S.baseBall.radius - 1;
    const b = {
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
export function resetBalls(stick = true) {
    S.resetBalls([makeBall(stick)]);
}
export function resetGame() {
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
}
export function setMode(mode) {
    S.setCurrentMode(mode);
    // 하드 모드일 때 현재 사이즈가 SMALL이나 NORMAL이면 강제로 LARGE로 변경
    if (mode === C.MODES.HARD && (S.currentSize === 'SMALL' || S.currentSize === 'NORMAL')) {
        S.setCurrentSize('LARGE');
    }
    resetGame();
}
export function setSize(size) {
    // 하드 모드에서는 강제로 큰 사이즈만 허용 (UI에서 막지만 이중 안전장치)
    if (S.currentMode === C.MODES.HARD && (size === 'SMALL' || size === 'NORMAL'))
        return;
    S.setCurrentSize(size);
    resetGame();
}
export function setSpeed(scale) {
    const newScale = U.clamp(scale, 0.5, 2.0);
    if (newScale === S.ballSpeedScale)
        return;
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
export function setMaxBalls(count) {
    S.setMaxBallCount(count);
}
export function applyPaddleWidthByPower() {
    if (S.fullWidthTimer > 0) {
        S.paddle.width = C.WIDTH - 16;
    }
    else if (S.extendTimer > 0) {
        S.paddle.width = C.PADDLE.width * 1.8;
    }
    else {
        S.paddle.width = C.PADDLE.width;
    }
    S.paddle.x = U.clamp(S.paddle.x, 8, C.WIDTH - S.paddle.width - 8);
}
export function spawnItemAt(brick) {
    let dropChance = S.currentMode === C.MODES.SPEED ? 1.0 : S.currentMode === C.MODES.HARD ? 0.12 : 0.35;
    if (Math.random() > dropChance)
        return;
    let weighted;
    if (S.currentMode === C.MODES.HARD) {
        // 하드 모드: 오직 XL(+20%)과 +2(MULTI2)만 드롭
        weighted = [
            { type: C.ITEM_TYPES.EXTEND, w: 50 },
            { type: C.ITEM_TYPES.MULTI2, w: 50 },
        ];
    }
    else {
        const wExtend = (S.extendTimer > 0 || S.fullWidthTimer > 0) ? 0 : 40;
        weighted = [
            { type: C.ITEM_TYPES.EXTEND, w: wExtend },
            { type: C.ITEM_TYPES.MULTI2, w: 35 },
            { type: C.ITEM_TYPES.TRIPLE, w: 23 },
            { type: C.ITEM_TYPES.LASER, w: 15 },
            { type: C.ITEM_TYPES.FULLWIDTH, w: 2 },
        ];
    }
    if (weighted.every(w => w.w <= 0))
        return;
    const selectedType = U.randChoiceWeighted(weighted);
    const w = 46, h = 22;
    S.items.push({ x: brick.x + brick.w / 2 - w / 2, y: brick.y + brick.h / 2 - h / 2, w, h, vy: 140, type: selectedType });
}
export function applyItem(type) {
    switch (type) {
        case C.ITEM_TYPES.EXTEND:
            S.setExtendTimer(12);
            break;
        case C.ITEM_TYPES.FULLWIDTH:
            S.setFullWidthTimer(8);
            break;
        case C.ITEM_TYPES.LASER:
            S.setLaserTimer(10);
            break;
        case C.ITEM_TYPES.TRIPLE: {
            let slots = Math.max(0, S.maxBallCount - S.balls.length);
            if (slots <= 0)
                break;
            const originals = S.balls.slice();
            for (const src of originals) {
                if (slots <= 0)
                    break;
                if (src.stuck) {
                    if (slots-- > 0)
                        S.balls.push(makeBall(false, -Math.PI / 4));
                    if (slots-- > 0)
                        S.balls.push(makeBall(false, Math.PI / 4));
                }
                else {
                    const srcSpeed = Math.hypot(src.vx, src.vy) || (S.baseBall.speed * S.ballSpeedScale);
                    const dir = Math.atan2(src.vy, src.vx);
                    const offset = Math.PI / 10;
                    if (slots-- > 0)
                        S.balls.push({
                            x: src.x, y: src.y,
                            vx: Math.cos(dir + offset) * srcSpeed,
                            vy: Math.sin(dir + offset) * srcSpeed,
                            radius: S.baseBall.radius,
                            speed: srcSpeed,
                            stuck: false,
                            trails: []
                        });
                    if (slots-- > 0)
                        S.balls.push({
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
            if (slots <= 0)
                break;
            const angles = [-Math.PI / 6, -Math.PI / 3.5];
            for (let i = 0; i < angles.length && slots > 0; i++, slots--) {
                S.balls.push(makeBall(false, angles[i]));
            }
            break;
        }
    }
}
//# sourceMappingURL=manager.js.map