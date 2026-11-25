/**
 * Sistem Efek Suara Prosedural Laboratorium Virtual GC-FID
 * Menggunakan Web Audio API (AudioContext) murni tanpa ketergantungan file audio eksternal.
 */

class LabSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private scheduledTimeouts: number[] = [];

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.clearScheduled();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public clearScheduled() {
    this.scheduledTimeouts.forEach((id) => window.clearTimeout(id));
    this.scheduledTimeouts = [];
  }

  private schedule(fn: () => void, delayMs: number) {
    const id = window.setTimeout(() => {
      if (!this.isMuted) fn();
    }, delayMs);
    this.scheduledTimeouts.push(id);
  }

  /**
   * Suara klik halus saat tombol UI atau langkah diklik
   */
  public playUiClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.035);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Suara transisi fokus kamera yang halus
   */
  public playCameraFocus() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * LANGKAH 1: Suara klik mekanik memutar katup regulator diikuti desisan gas bertekanan
   * (white noise dengan bandpass filter fade-in lalu fade-out selama 1.5 detik)
   */
  public playGasValveOpen() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Klik mekanik putaran keran logam
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(240, now);
    clickOsc.frequency.exponentialRampToValueAtTime(95, now + 0.08);
    clickGain.gain.setValueAtTime(0.22, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.09);

    // 2. Desisan gas bertekanan (White noise + Bandpass filter selama 1.5 detik)
    const duration = 1.55;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2600, now + 0.05);
    bandpass.frequency.exponentialRampToValueAtTime(1450, now + duration);
    bandpass.Q.setValueAtTime(2.4, now);

    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.001, now);
    hissGain.gain.linearRampToValueAtTime(0.18, now + 0.35);
    hissGain.gain.setValueAtTime(0.16, now + 0.75);
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(bandpass);
    bandpass.connect(hissGain);
    hissGain.connect(ctx.destination);

    whiteNoise.start(now + 0.04);
    whiteNoise.stop(now + duration);
  }

  /**
   * LANGKAH 2: Suara beep digital panel instrumen (880Hz -> 1320Hz) diikuti
   * dengungan halus kipas/pemanas oven GC (low frequency hum)
   */
  public playGCHeatingStart() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Beep digital dua nada (880 Hz -> 1320 Hz)
    const beep1 = ctx.createOscillator();
    const beep1Gain = ctx.createGain();
    beep1.type = 'sine';
    beep1.frequency.setValueAtTime(880, now);
    beep1Gain.gain.setValueAtTime(0.14, now);
    beep1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    beep1.connect(beep1Gain);
    beep1Gain.connect(ctx.destination);
    beep1.start(now);
    beep1.stop(now + 0.12);

    const beep2 = ctx.createOscillator();
    const beep2Gain = ctx.createGain();
    beep2.type = 'triangle';
    beep2.frequency.setValueAtTime(1320, now + 0.13);
    beep2Gain.gain.setValueAtTime(0.14, now + 0.13);
    beep2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    beep2.connect(beep2Gain);
    beep2Gain.connect(ctx.destination);
    beep2.start(now + 0.13);
    beep2.stop(now + 0.29);

    // 2. Dengungan halus kipas & pemanas oven GC (Low-frequency thermal hum)
    const humDuration = 2.4;
    const humOsc1 = ctx.createOscillator();
    const humOsc2 = ctx.createOscillator();
    const lowpass = ctx.createBiquadFilter();
    const humGain = ctx.createGain();

    humOsc1.type = 'sawtooth';
    humOsc1.frequency.setValueAtTime(95, now + 0.25);
    humOsc1.frequency.linearRampToValueAtTime(125, now + humDuration);

    humOsc2.type = 'sine';
    humOsc2.frequency.setValueAtTime(190, now + 0.25);
    humOsc2.frequency.linearRampToValueAtTime(250, now + humDuration);

    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(280, now + 0.25);

    humGain.gain.setValueAtTime(0.001, now + 0.25);
    humGain.gain.linearRampToValueAtTime(0.065, now + 0.7);
    humGain.gain.setValueAtTime(0.06, now + 1.7);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + humDuration);

    humOsc1.connect(lowpass);
    humOsc2.connect(lowpass);
    lowpass.connect(humGain);
    humGain.connect(ctx.destination);

    humOsc1.start(now + 0.25);
    humOsc2.start(now + 0.25);
    humOsc1.stop(now + humDuration);
    humOsc2.stop(now + humDuration);
  }

  /**
   * Helper internal untuk suara gesekan plunger & hisapan/semprotan cairan
   */
  private playLiquidDrawOrSquirt(direction: 'draw' | 'squirt', durationSec = 0.42) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const startFreq = direction === 'draw' ? 310 : 780;
    const endFreq = direction === 'draw' ? 790 : 260;

    // Nada gesekan/aliran cairan
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + durationSec);

    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.075, now + 0.06);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);

    // Desiran fluida halus (filtered noise)
    const bufLen = Math.floor(ctx.sampleRate * durationSec);
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4.0, now);
    filter.frequency.setValueAtTime(startFreq * 1.8, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq * 1.8, now + durationSec);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, now);
    nGain.gain.linearRampToValueAtTime(0.09, now + 0.06);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + durationSec);
  }

  /**
   * Suara tusukan jarum menembus karet septum (short low thud)
   */
  public playSeptumPierce() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.085);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  /**
   * LANGKAH 3: Urutan suara membilas suntikan mikro dengan Aseton & membuang ke Botol Limbah
   */
  public playSyringeWashSequence() {
    this.playUiClick();
    // Tusuk septum botol Aseton (t = 0.85s)
    this.schedule(() => this.playSeptumPierce(), 850);
    // Hisap pelarut Aseton pertama (t = 1.25s)
    this.schedule(() => this.playLiquidDrawOrSquirt('draw', 0.45), 1250);
    // Kocok turun-naik di botol Aseton (t = 1.85s)
    this.schedule(() => this.playLiquidDrawOrSquirt('squirt', 0.25), 1850);
    this.schedule(() => this.playLiquidDrawOrSquirt('draw', 0.32), 2150);
    // Semprotkan bilasan ke Botol Limbah (t = 3.4s)
    this.schedule(() => this.playLiquidDrawOrSquirt('squirt', 0.48), 3400);
  }

  /**
   * LANGKAH 4: Urutan suara mengambil 1,0 µL sampel dari Botol Sampel
   */
  public playSyringeSampleUptakeSequence() {
    this.playUiClick();
    // Tusuk septum Botol Sampel (t = 0.7s)
    this.schedule(() => this.playSeptumPierce(), 700);
    // Hisap 1,0 µL cairan sampel (t = 1.25s)
    this.schedule(() => this.playLiquidDrawOrSquirt('draw', 0.55), 1250);
  }

  /**
   * LANGKAH 5: Urutan suara injeksi ke Port Injektor GC
   * (Tusukan karet septum -> Klik tekan plunger -> Double-beep konfirmasi mesin GC)
   */
  public playGCInjectionSequence() {
    this.playCameraFocus();
    // 1. Tusukan jarum menembus karet septum Port Injektor (t = 0.95s)
    this.schedule(() => this.playSeptumPierce(), 950);

    // 2. Tekan plunger cepat (click + semprotan penguapan) (t = 1.6s)
    this.schedule(() => {
      this.playUiClick();
      this.playLiquidDrawOrSquirt('squirt', 0.22);
    }, 1600);

    // 3. Double-beep konfirmasi dari mesin GC tanda analisis dimulai (t = 2.4s)
    this.schedule(() => {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [0, 0.14].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 1046.5 : 1318.5, now + offset);
        gain.gain.setValueAtTime(0.14, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    }, 2400);
  }

  /**
   * LANGKAH 6: Bunyi soft ping saat masing-masing senyawa (Heksana, Oktana, Dekana) mencapai detektor FID
   */
  public playPeakPing(peakNumber: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Nada harmonis naik untuk Puncak 1 (C6), Puncak 2 (E6), Puncak 3 (G6)
    const freqs = [1046.5, 1318.5, 1567.98];
    const freq = freqs[(peakNumber - 1) % freqs.length] || 1046.5;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  /**
   * LANGKAH 7: Suara chime sukses saat analisis kromatogram selesai
   */
  public playAnalysisCompleteChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.56);
    });
  }

  /**
   * Suara peringatan / alarm interlock instrumen saat prosedur dilanggar
   * atau pintu oven dibuka saat pemanasan/analisis
   */
  public playWarningBeep() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.16].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 420 : 310, now + offset);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now + offset);

      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.13);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.14);
    });
  }

  /**
   * Suara mekanis buka/tutup pintu oven kolom GC
   */
  public playOvenDoorToggle(isOpen: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOpen ? 190 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(isOpen ? 110 : 260, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }
}

export const soundEffects = new LabSoundEngine();
export default soundEffects;
