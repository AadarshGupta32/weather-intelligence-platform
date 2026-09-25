/**
 * Audio Notification and Speech Synthesis Service
 * Provides audible emergency cues for critical incidents
 */

class AudioService {
    constructor() {
        this.enabled = true;
        this.audioCtx = null;
    }

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    initAudioContext() {
        if (!this.audioCtx && typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playEmergencyChime() {
        if (!this.enabled) return;
        try {
            this.initAudioContext();
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5

            gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.35);
        } catch (e) {
            console.warn('[AudioService] Chime play failed:', e);
        }
    }

    speak(text) {
        if (!this.enabled || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('[AudioService] Speech synthesis failed:', e);
        }
    }
}

export const audioService = new AudioService();
