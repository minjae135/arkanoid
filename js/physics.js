// src/physics.ts
import * as C from './constants.js';
import * as S from './state.js';
import { playSound } from './sound.js';
import { spawnItemAt } from './manager.js';
export function reflectBallFromPaddle(b) {
    const hitPos = (b.x - (S.paddle.x + S.paddle.width / 2)) / (S.paddle.width / 2);
    const maxBounce = Math.PI / 3;
    const angle = hitPos * maxBounce;
    const speed = Math.hypot(b.vx, b.vy) || b.speed;
    b.vx = Math.sin(angle) * speed;
    b.vy = -Math.cos(angle) * speed;
}
export function handleBrickCollision(brick) {
    if (!brick.alive)
        return;
    // 콤보 및 점수 계산
    S.setCombo(S.combo + 1);
    S.setComboTimer(C.SCORING.COMBO_WINDOW);
    const multiplier = S.combo * S.balls.length;
    let scoreToAdd = brick.type === C.BLOCK_TYPES.EXPLOSIVE ? 300 : C.SCORING.BRICK;
    // 관리자 점수 배율 적용 (Rank 2 이상)
    if (S.adminRank >= 2 && S.adminScoreMultiplier !== 1.0) {
        scoreToAdd *= S.adminScoreMultiplier;
    }
    S.setScore(S.score + scoreToAdd * multiplier);
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
        const neighbors = S.bricks.filter(other => other.alive &&
            other !== brick &&
            Math.abs(other.x - brick.x) < brick.w * 1.6 &&
            Math.abs(other.y - brick.y) < brick.h * 1.6);
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
//# sourceMappingURL=physics.js.map