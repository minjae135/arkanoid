// src/admin.ts
import * as S from './state.js';
import * as C from './constants.js';
import * as M from './manager.js';
import { ADMIN_HASHES } from './admin-secrets.js';
let scoreClickCount = 0;
let lastClickTime = 0;
async function sha256(text) {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
export function handleScoreClick() {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
        scoreClickCount = 1;
    }
    else {
        scoreClickCount++;
    }
    lastClickTime = now;
    if (scoreClickCount >= 5) {
        scoreClickCount = 0;
        attemptLogin();
    }
}
async function attemptLogin() {
    const password = prompt("비밀 관리자 암호를 입력하세요:");
    if (!password)
        return;
    const inputHash = await sha256(password);
    if (inputHash === ADMIN_HASHES.RANK_3) {
        S.setAdminRank(3);
        alert("LV.3 마스터 권한이 승인되었습니다.");
    }
    else if (inputHash === ADMIN_HASHES.RANK_2) {
        S.setAdminRank(2);
        alert("LV.2 밸런서 권한이 승인되었습니다.");
    }
    else if (inputHash === ADMIN_HASHES.RANK_1) {
        S.setAdminRank(1);
        alert("LV.1 테스터 권한이 승인되었습니다.");
    }
    else {
        alert("잘못된 암호입니다.");
        return;
    }
    showAdminButtonInControls();
    openAdminMenu();
}
function showAdminButtonInControls() {
    if (document.getElementById('btn-admin-persistent'))
        return;
    const controls = document.querySelector('.controls');
    if (controls) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'btn-admin-persistent';
        adminBtn.className = 'mode-btn';
        adminBtn.type = 'button';
        adminBtn.style.borderColor = 'var(--neon-cyan)';
        adminBtn.style.color = 'var(--neon-cyan)';
        adminBtn.textContent = 'ADMIN';
        adminBtn.onclick = () => openAdminMenu();
        // '방법 보기' 버튼 앞에 삽입
        const helpBtn = document.getElementById('btn-help') || controls.lastElementChild;
        controls.insertBefore(adminBtn, helpBtn);
    }
}
function openAdminMenu() {
    let adminModal = document.getElementById('admin-modal');
    if (!adminModal) {
        createAdminModalUI();
        adminModal = document.getElementById('admin-modal');
    }
    updateAdminUIByRank();
    if (adminModal)
        adminModal.hidden = false;
    S.setPaused(true);
}
function createAdminModalUI() {
    const modalHTML = `
    <div id="admin-modal" class="modal-backdrop" hidden>
        <div class="modal admin-panel">
            <h2>ADMIN PANEL <small id="admin-rank-label"></small></h2>
            
            <div class="admin-controls">
                <div class="admin-row rank-1">
                    <label>🛡️ 무적 모드</label>
                    <input type="checkbox" id="check-god-mode">
                </div>
                
                <div class="admin-row rank-2">
                    <label>🎁 아이템 드롭률 (-1: 기본)</label>
                    <input type="range" id="range-drop-rate" min="-1" max="1" step="0.1" value="-1">
                    <span id="label-drop-rate">기본</span>
                </div>
                
                <div class="admin-row rank-2">
                    <label>⚡ 패들 속도 배율</label>
                    <input type="range" id="range-paddle-speed" min="1" max="3" step="0.2" value="1">
                    <span id="label-paddle-speed">1.0x</span>
                </div>

                <div class="admin-row rank-2">
                    <label>💰 점수 획득 배율</label>
                    <input type="number" id="input-score-multiplier" min="1" step="0.5" value="1.0" 
                           style="width: 60px; background: #000; border: 1px solid var(--neon-cyan); color: #fff; text-align: center; border-radius: 4px;">
                </div>

                <div class="admin-row rank-3">
                    <label>🪄 아이템 즉시 소환</label>
                    <div class="spawn-btns">
                        <button onclick="window.applyAdminItem('XL')">XL</button>
                        <button onclick="window.applyAdminItem('MULTI2')">+2</button>
                        <button onclick="window.applyAdminItem('TRIPLE')">3X</button>
                        <button onclick="window.applyAdminItem('MAX')">MAX</button>
                    </div>
                </div>
            </div>

            <div class="modal-actions">
                <button id="admin-close" class="secondary">닫기</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // 이벤트 바인딩
    document.getElementById('admin-close')?.addEventListener('click', () => {
        document.getElementById('admin-modal').hidden = true;
        S.setPaused(false);
    });
    document.getElementById('check-god-mode')?.addEventListener('change', (e) => {
        S.setGodMode(e.target.checked);
    });
    document.getElementById('range-drop-rate')?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        S.setAdminDropRate(val);
        document.getElementById('label-drop-rate').textContent = val === -1 ? "기본" : `${Math.round(val * 100)}%`;
    });
    document.getElementById('range-paddle-speed')?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        S.setAdminPaddleSpeedScale(val);
        document.getElementById('label-paddle-speed').textContent = `${val.toFixed(1)}x`;
    });
    document.getElementById('input-score-multiplier')?.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 0) {
            S.setAdminScoreMultiplier(val);
        }
        else {
            // 잘못된 값 입력 시 기본값으로 리셋
            S.setAdminScoreMultiplier(1.0);
            e.target.value = "1.0";
        }
    });
    // 글로벌 함수 등록 (아이템 즉시 소환용)
    window.applyAdminItem = (type) => {
        const typeMap = {
            'XL': C.ITEM_TYPES.EXTEND,
            'MULTI2': C.ITEM_TYPES.MULTI2,
            'TRIPLE': C.ITEM_TYPES.TRIPLE,
            'MAX': C.ITEM_TYPES.FULLWIDTH
        };
        const actualType = typeMap[type];
        if (actualType) {
            M.applyItem(actualType);
            S.setShakeAmount(5);
        }
    };
}
function updateAdminUIByRank() {
    const rank = S.adminRank;
    const label = document.getElementById('admin-rank-label');
    if (label)
        label.textContent = `LV.${rank}`;
    // 권한에 따른 요소 가리기
    const rows = document.querySelectorAll('.admin-row');
    rows.forEach(row => {
        if (row.classList.contains('rank-2') && rank < 2)
            row.style.display = 'none';
        else if (row.classList.contains('rank-3') && rank < 3)
            row.style.display = 'none';
        else
            row.style.display = 'flex';
    });
}
//# sourceMappingURL=admin.js.map