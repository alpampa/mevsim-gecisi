/**
 * Sayfa çevirme sesi — yumuşak bir "hışırtı + şıp" efekti.
 * Harici ses dosyası gerektirmez; Web Audio API ile anında sentezlenir.
 * Mute açıkken çağrılmaz (App tarafından kontrol edilir).
 */
let ctx = null;

export function playPageFlipSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    if (ctx.state !== 'running') return;

    const now = ctx.currentTime;

    // Kağıt hışırtısı: kısa, yüksek frekanslı yumuşak gürültü
    const dur = 0.16;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.16;
    src.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    src.start(now);

    // Alttan gelen yumuşak "şıp" tonu
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Ses çalınamazsa sorun değil — kitabın kendisi etkilenmez
  }
}
