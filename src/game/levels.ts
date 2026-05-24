// src/levels.ts

export interface LevelData {
    name: string;
    layout: string[]; // 문자열 배열로 레이아웃 표현 (N: 일반, D: 내구도, E: 폭발, .: 빈공간)
}

export const STAGES: LevelData[] = [
    {
        name: "INITIALIZE",
        layout: [
            "NNNNNNNNNNNN",
            "N..........N",
            "N.DDNNNNDD.N",
            "N.D......D.N",
            "N.DDNNNNDD.N",
            "NNNNNNNNNNNN"
        ]
    },
    {
        name: "CHAIN REACTION",
        layout: [
            "EEEEEEEEEEEE",
            "............",
            "DDDDDDDDDDDD",
            "............",
            "NNNNNNNNNNNN",
            "............"
        ]
    },
    {
        name: "THE CORE",
        layout: [
            "............",
            "....DDDD....",
            "....DEED....",
            "....DEED....",
            "....DDDD....",
            "............"
        ]
    }
];
