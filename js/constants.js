// js/constants.js

// 게임 캔버스 크기
export const WIDTH = 800;
export const HEIGHT = 600;

// 패들 설정
export const PADDLE = {
    width: 110,
    height: 18,
    speed: 520
};

// 공 설정
export const BALL = {
    radius: 8,
    speed: 360,
    maxCountDefault: 100,
    maxCountLimit: 500
};

// 벽돌 설정
export const BRICKS = {
    rows: 6,
    cols: 12,
    width: 58,
    height: 22,
    padding: 6,
    offsetTop: 80,
    offsetLeft: 20
};

// 게임 모드
export const MODES = {
    NORMAL: 'NORMAL',
    SPEED: 'SPEED',
    HARD: 'HARD'
};

// 블록 크기 프리셋
export const SIZE_PRESET = {
    SMALL: {rows: 4, cols: 8},
    NORMAL: {rows: 6, cols: 12}, // 기본
    LARGE: {rows: 8, cols: 14},
    XLARGE: {rows: 10, cols: 16}
};

// 아이템 종류
export const ITEM_TYPES = {
    EXTEND: 'EXTEND',
    MULTI2: 'MULTI2',
    TRIPLE: 'TRIPLE',
    FULLWIDTH: 'FULLWIDTH',
    LASER: 'LASER' // 레이저 아이템 추가
};

// 블록 종류
export const BLOCK_TYPES = {
    NORMAL: 'NORMAL',      // 일반
    DURABLE: 'DURABLE',    // 내구도
    EXPLOSIVE: 'EXPLOSIVE'  // 폭발
};

// 블록 타입별 색상
export const BLOCK_COLORS = {
    [BLOCK_TYPES.NORMAL]: ['#00f3ff', '#ff00ff', '#f3ff00', '#ff44aa', '#00ff00', '#aa00ff'],
    [BLOCK_TYPES.DURABLE]: ['#ff79c6', '#bd93f9'], // [HP 2일때, HP 1일때]
    [BLOCK_TYPES.EXPLOSIVE]: '#ffb86c'
};

// 점수 설정
export const SCORING = {
    BRICK: 10,
    PADDLE_BOUNCE: 5,
    ITEM_CATCH: 50,
    COMBO_WINDOW: 1.5 // 1.5초 내에 다음 타격 시 콤보 유지
};