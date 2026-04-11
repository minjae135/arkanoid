// js/sound.js

let audioCtx;
let isInitialized = false;

// 오디오 컨텍스트 초기화 (사용자 상호작용 시 호출되어야 함)
function initAudio() {
    if (isInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        isInitialized = true;
    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
    }
}

// 지정된 이름의 사운드를 생성하고 재생합니다.
function playSound(soundName) {
    if (!isInitialized || !audioCtx) return;

    let oscillator, gainNode;

    switch (soundName) {
        case 'bounce':
            oscillator = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
            break;

        case 'break':
            const bufferSize = audioCtx.sampleRate * 0.1;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            noise.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            noise.start(audioCtx.currentTime);
            noise.stop(audioCtx.currentTime + 0.1);
            break;

        case 'item':
            oscillator = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.15);
            break;

        case 'laser':
            oscillator = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
    }
}

export { initAudio, playSound };
