// Web Audio API Synthesized Matrix Sound Effects
class MatrixAudio {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  public get muted(): boolean {
    return !this.isEnabled;
  }

  // Cyber Beep for button interaction
  public playBeep(freq: number = 880, duration: number = 0.06, type: OscillatorType = 'sine') {
    if (!this.isEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context may be blocked by browser policy
    }
  }

  // Quantum Vault Deposit Success Fanfare
  public playDepositSuccess() {
    if (!this.isEnabled) return;
    try {
      this.playBeep(523.25, 0.08, 'triangle'); // C5
      setTimeout(() => this.playBeep(659.25, 0.08, 'triangle'), 80); // E5
      setTimeout(() => this.playBeep(783.99, 0.12, 'sine'), 160); // G5
      setTimeout(() => this.playBeep(1046.5, 0.25, 'sine'), 240); // C6
    } catch {}
  }

  // 50% Profit Withdrawal Fanfare
  public playClaimSuccess() {
    if (!this.isEnabled) return;
    try {
      this.playBeep(440, 0.08, 'sine');
      setTimeout(() => this.playBeep(880, 0.08, 'sine'), 100);
      setTimeout(() => this.playBeep(1320, 0.2, 'triangle'), 200);
    } catch {}
  }

  // Admin Access Granted Fanfare
  public playAccessGranted() {
    if (!this.isEnabled) return;
    try {
      this.playBeep(587.33, 0.06, 'sine'); // D5
      setTimeout(() => this.playBeep(880.0, 0.08, 'sine'), 70); // A5
      setTimeout(() => this.playBeep(1174.66, 0.18, 'triangle'), 150); // D6
    } catch {}
  }

  // Admin Access Denied Buzzer
  public playAccessDenied() {
    if (!this.isEnabled) return;
    try {
      this.playBeep(220, 0.12, 'sawtooth');
      setTimeout(() => this.playBeep(164.81, 0.2, 'sawtooth'), 120);
    } catch {}
  }
  // Aliases for generic success and trade audio cues
  public playSuccess() {
    this.playDepositSuccess();
  }

  public playTradeWon() {
    this.playClaimSuccess();
  }
}

export const matrixAudio = new MatrixAudio();
