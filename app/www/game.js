/* Rel Nusantara — prototipe Misi 1-4 "Pagi Pertama Pasar Minggu"
 * Satu berkas, tanpa dependensi. Dunia 1 dimensi sepanjang rel (satuan meter),
 * digambar 2.5D ke <canvas>. Bisa dibungkus Capacitor menjadi aplikasi iOS/Android.
 */
(() => {
  'use strict';

  // ---------- util ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function mix(c1, c2, t) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(lerp(a >> 16, b >> 16, t));
    const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
    const bl = Math.round(lerp(a & 255, b & 255, t));
    return `rgb(${r},${g},${bl})`;
  }
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };

  // ---------- data rute ----------
  const TIME_SCALE = 5;            // 1 detik nyata = 5 detik jam game
  const START_CLOCK = 6 * 3600;    // 06.00
  const LOCO_LEN = 14, COACH_LEN = 18, GAP = 1.2;
  const TRAIN_LEN = LOCO_LEN + 2 * (COACH_LEN + GAP);
  const WINDOW_BEFORE = 40, WINDOW_AFTER = 55; // jendela berhenti di peron (m)

  const ROUTE = {
    lineSpeed: 80,
    stations: [
      { name: 'SUKAMAJU', elev: '+386 m', x: 0, sched: 0, waiting: 0 },
      { name: 'CIBENING', elev: '+412 m', x: 1200, sched: 780, waiting: 14, traders: true },
      { name: 'PASAR LAMA', elev: '+371 m', x: 2600, sched: 1560, waiting: 5, final: true },
    ],
    zones: [
      { from: -120, to: 200, limit: 40, label: 'area Stasiun Sukamaju' },
      { from: 380, to: 620, limit: 30, label: 'Tikungan Bukit' },
      { from: 1000, to: 1400, limit: 40, label: 'area Stasiun Cibening' },
      { from: 1900, to: 2050, limit: 50, label: 'Jembatan Ci Leuleuy' },
      { from: 2450, to: 2760, limit: 40, label: 'area Stasiun Pasar Lama' },
    ],
    signals: [
      { id: 'S1', x: 60, start: 0 },
      { id: 'J1', x: 1000 },
      { id: 'S2', x: 1260, start: 1 },
      { id: 'B1', x: 2250 },
      { id: 'J2', x: 2450 },
    ],
    crossing: { x: 820, hornFrom: 520 },
    goat: { x: 1650, hornFrom: 1430 },
    fog: { from: 1480, to: 2330 },
    bridge: { from: 1900, to: 2050 },
    bufferStop: 2700,
  };

  // Tuas: indeks 0 (atas) .. 9 (bawah); notch = 4 - indeks
  const NOTCHES = ['P4', 'P3', 'P2', 'P1', 'N', 'B1', 'B2', 'B3', 'B4', 'EB'];
  const notchLabel = (n) => NOTCHES[4 - n];

  // ---------- audio (WebAudio sintetis, tanpa berkas) ----------
  // Tiga jalur: efek (sfx), suasana (amb), musik. Semua bunyi dibuat dari osilator & noise.
  const Sound = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ac = null, master = null, sfx = null, amb = null, music = null;
    let white = null, brown = null, panOk = false;
    let muted = store.get('rn.mute') === '1';
    let musicOn = store.get('rn.music') !== '0';
    const L = {};                    // lapisan bunyi kontinu
    let nextBird = 0, nextBell = 0, nextCricket = 0, duckUntil = 0;
    let musicTimer = null, nextBeat = 0, beat = 0, musicLevel = 0.16;
    let idVoice = null;

    function g(v) { const n = ac.createGain(); n.gain.value = v; return n; }
    function set(param, v, tc = 0.15) { param.setTargetAtTime(v, ac.currentTime, tc); }
    function makeNoise(sec, isBrown) {
      const len = Math.floor(ac.sampleRate * sec);
      const b = ac.createBuffer(1, len, ac.sampleRate);
      const d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (isBrown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
      return b;
    }
    function loop(buf, type, freq, q, bus) {
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const gn = g(0);
      src.connect(f).connect(gn).connect(bus);
      src.start(0, Math.random() * buf.duration);
      return { f, g: gn };
    }
    function panner(p) {
      if (!panOk) return null;
      const n = ac.createStereoPanner(); n.pan.value = p; return n;
    }

    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      if (!AC) return;
      try {
        ac = new AC();
        panOk = typeof ac.createStereoPanner === 'function';
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
        master = g(muted ? 0 : 0.8); master.connect(comp).connect(ac.destination);
        sfx = g(1); sfx.connect(master);
        amb = g(1); amb.connect(master);
        music = g(musicOn ? musicLevel : 0); music.connect(master);
        white = makeNoise(2.2, false); brown = makeNoise(3.1, true);

        L.rumble = loop(brown, 'lowpass', 140, 0.7, sfx);      // gemuruh roda
        L.hiss = loop(white, 'highpass', 4200, 0.5, sfx);       // desis uap saat diam
        L.squeal = loop(white, 'bandpass', 3300, 28, sfx);      // decit rem
        L.wind = loop(brown, 'bandpass', 520, 0.6, amb);        // angin
        L.river = loop(white, 'bandpass', 900, 0.6, amb);       // sungai di bawah jembatan
        L.crowd = loop(brown, 'bandpass', 520, 1.3, amb);       // riuh penumpang di peron
        // embusan angin pelan
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.11;
        const lg = g(0.025); lfo.connect(lg).connect(L.wind.g.gain); lfo.start();
        // gumam kerumunan: modulasi seperti suku kata
        const mod = ac.createOscillator(); mod.frequency.value = 3.3;
        const mg = g(0.03); mod.connect(mg).connect(L.crowd.g.gain); mod.start();

        loadVoice();
        startMusic();
      } catch (e) { ac = null; }
    }

    function loadVoice() {
      if (!('speechSynthesis' in window)) return;
      const pick = () => {
        const vs = window.speechSynthesis.getVoices() || [];
        idVoice = vs.find((v) => /^(id|in)[-_]/i.test(v.lang)) || null;
      };
      pick();
      try { window.speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) { /* old webview */ }
    }

    // ---- bunyi sesaat ----
    function burst(freq, q, vol, dur, type, bus, delay = 0) {
      if (!ac || muted) return;
      const t = ac.currentTime + delay;
      const src = ac.createBufferSource(); src.buffer = white;
      const f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(gn).connect(bus || sfx);
      src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
    }
    function tone(freq, vol, dur, opts = {}) {
      if (!ac || muted) return;
      const t = ac.currentTime + (opts.delay || 0);
      const o = ac.createOscillator(); o.type = opts.type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + (opts.glide || dur));
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + (opts.attack || 0.008));
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let out = o.connect(gn);
      const pn = opts.pan !== undefined ? panner(opts.pan) : null;
      if (pn) out = out.connect(pn);
      out.connect(opts.bus || sfx);
      o.start(t); o.stop(t + dur + 0.05);
    }
    // logam berbilah (saron/bonang/bel): nada dasar + parsial tak harmonis + "ombak" (detak)
    function metal(freq, vol, dur, bus, delay = 0) {
      tone(freq, vol, dur, { bus, delay });
      tone(freq + 2.6, vol * 0.6, dur * 0.9, { bus, delay });
      tone(freq * 2.76, vol * 0.18, dur * 0.35, { bus, delay });
      tone(freq * 4.1, vol * 0.06, dur * 0.18, { bus, delay });
    }

    // ---- musik latar bernuansa gamelan (laras slendro, buatan sendiri) ----
    const SL = { 1: 1, 2: 1.147, 3: 1.318, 5: 1.512, 6: 1.737, 7: 2 }; // 7 = 1 tinggi
    const BALUNGAN = [2, 1, 2, 6, 2, 1, 2, 6, 3, 5, 6, 7, 6, 5, 3, 2, 5, 3, 5, 6, 7, 6, 5, 3, 6, 5, 3, 2, 3, 5, 3, 2];
    const BASE = 233;
    const BEAT = 0.62;
    function startMusic() {
      if (musicTimer) return;
      nextBeat = ac.currentTime + 0.3;
      musicTimer = setInterval(scheduleMusic, 90);
    }
    function scheduleMusic() {
      if (!ac || ac.state !== 'running') return;
      while (nextBeat < ac.currentTime + 0.4) { playBeat(beat, nextBeat - ac.currentTime); nextBeat += BEAT; beat++; }
    }
    function playBeat(i, d) {
      if (muted || !musicOn) return;
      const n = BALUNGAN[i % BALUNGAN.length];
      const nx = BALUNGAN[(i + 1) % BALUNGAN.length];
      const pos = i % 16;
      metal(BASE * SL[n], 0.22, 1.5, music, d);                       // saron
      metal(BASE * 2 * SL[n], 0.07, 0.5, music, d + BEAT * 0.5);      // bonang (imbal)
      metal(BASE * 2 * SL[nx], 0.05, 0.4, music, d + BEAT * 0.75);
      if (pos % 4 === 3) metal(BASE * 0.5 * SL[n] * 2, 0.12, 2.2, music, d);   // kenong
      if (pos === 5 || pos === 9 || pos === 13) metal(BASE * 0.5 * SL[n], 0.1, 2.6, music, d); // kempul
      if (pos === 15) {                                                // gong ageng
        tone(62, 0.45, 6, { bus: music, delay: d, attack: 0.03 });
        tone(63.3, 0.3, 6, { bus: music, delay: d, attack: 0.03 });
        tone(130, 0.08, 3, { bus: music, delay: d, attack: 0.03 });
      }
      // kendang: "dhung" dan "tak" sederhana
      if (pos % 2 === 0) tone(110, 0.16, 0.22, { bus: music, delay: d, to: 70, glide: 0.18 });
      if (pos % 4 === 1) burst(2200, 1.5, 0.05, 0.06, 'bandpass', music, d + BEAT * 0.5);
    }

    // ---- satwa & suasana ----
    function bird(vol) {
      const pan = Math.random() * 1.6 - 0.8;
      if (Math.random() < 0.5) { // cuitan cepat
        const k = 2 + Math.floor(Math.random() * 3), f0 = 2600 + Math.random() * 1400;
        for (let i = 0; i < k; i++) tone(f0, vol, 0.08, { to: f0 * 1.45, glide: 0.06, delay: i * 0.12, bus: amb, pan });
      } else { // siulan tiga nada ala kutilang
        const f0 = 1700 + Math.random() * 500;
        [[1, 0], [1.33, 0.16], [1.18, 0.3]].forEach(([m, dl]) => tone(f0 * m, vol, 0.16, { to: f0 * m * 1.06, delay: dl, bus: amb, pan }));
      }
    }
    function cricket(vol) {
      const f = 4300 + Math.random() * 500, pan = Math.random() * 1.4 - 0.7;
      for (let i = 0; i < 4; i++) tone(f, vol, 0.03, { type: 'square', delay: i * 0.045, bus: amb, pan });
    }
    function crossingBell(vol) { // "teng" palang pintu perlintasan
      tone(1180, vol, 0.45, { bus: amb, pan: 0.35 });
      tone(2830, vol * 0.35, 0.25, { bus: amb, pan: 0.35 });
      burst(5000, 2, vol * 0.25, 0.03, 'highpass', amb);
    }

    // ---- dipanggil tiap frame ----
    function update(info) {
      if (!ac) return;
      const t = ac.currentTime;
      const live = !muted;
      const run = live && info.running;
      const v = info.v || 0;
      set(L.rumble.g.gain, run ? Math.min(0.55, v * 0.032) * (info.onBridge ? 1.7 : 1) : 0, 0.2);
      L.rumble.f.frequency.setTargetAtTime(100 + v * 9 + (info.onBridge ? 70 : 0), t, 0.25);
      set(L.hiss.g.gain, live && info.scene ? (v < 0.4 ? 0.022 : 0.006) : 0, 0.3);
      set(L.squeal.g.gain, run && info.braking && v > 0.25 && v < 5 ? 0.05 * (1.1 - v / 5) : 0, 0.08);
      set(L.wind.g.gain, live && info.scene ? 0.045 + v * 0.004 + info.fog * 0.03 : 0, 0.5);
      set(L.river.g.gain, live && info.scene ? info.river * 0.13 : 0, 0.4);
      set(L.crowd.g.gain, live && info.scene ? info.crowd * 0.08 : 0, 0.5);
      // musik turun saat bermain, makin turun saat pengumuman
      const want = !musicOn || muted ? 0 : t < duckUntil ? 0.04 : info.running ? 0.09 : 0.16;
      if (Math.abs(want - musicLevel) > 0.001) { musicLevel = want; set(music.gain, want, 0.6); }
      if (!live || !info.scene) return;
      if (info.bell > 0 && t >= nextBell) { crossingBell(0.05 + info.bell * 0.12); nextBell = t + 0.55; }
      if (t >= nextBird) {
        if (info.fog < 0.6) bird(0.02 + Math.random() * 0.025);
        nextBird = t + 0.8 + Math.random() * (info.fog > 0.3 ? 6 : 2.6);
      }
      if (info.dawn && t >= nextCricket) { cricket(0.012); nextCricket = t + 0.35 + Math.random() * 0.5; }
    }

    // ---- pengumuman stasiun ----
    function chime() { [784, 659, 523, 659].forEach((f, i) => metal(f, 0.13, 1.1, sfx, i * 0.42)); }
    function announce(text) {
      if (!ac || muted) return;
      chime();
      duckUntil = ac.currentTime + 2 + text.length * 0.07;
      if (!idVoice || !('speechSynthesis' in window)) return;
      setTimeout(() => {
        try {
          const u = new SpeechSynthesisUtterance(text);
          u.voice = idVoice; u.lang = idVoice.lang; u.rate = 0.95; u.pitch = 1.05; u.volume = 0.9;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch (e) { /* speech not available */ }
      }, 1700);
    }

    return {
      init, update, announce,
      chuff(vol) { burst(380 + Math.random() * 140, 0.9, vol, 0.2); },
      click(vol) { burst(2600, 2.5, vol, 0.05, 'highpass'); },
      squeal(vol) { burst(3400, 18, vol, 0.35); },
      tick() { burst(3200, 3, 0.05, 0.03, 'bandpass'); tone(140, 0.08, 0.06); },
      airApply() { burst(2400, 0.7, 0.05, 0.25, 'highpass'); },
      airRelease(vol = 0.11) { burst(1800, 0.6, vol, 0.8, 'highpass'); },
      doorSlide(open) {
        if (!ac || muted) return;
        const t = ac.currentTime;
        const src = ac.createBufferSource(); src.buffer = white;
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(open ? 500 : 1300, t); f.frequency.linearRampToValueAtTime(open ? 1300 : 500, t + 0.55);
        const gn = g(0); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.06, t + 0.05); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        src.connect(f).connect(gn).connect(sfx); src.start(t); src.stop(t + 0.65);
        tone(90, 0.18, 0.12, { delay: 0.58 });
      },
      whistle() {
        if (!ac || muted) return;
        const t = ac.currentTime;
        const gn = ac.createGain();
        gn.gain.setValueAtTime(0.0001, t);
        gn.gain.exponentialRampToValueAtTime(0.16, t + 0.07);
        gn.gain.setValueAtTime(0.16, t + 0.8);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        gn.connect(lp).connect(sfx);
        [466.16, 587.33, 698.46].forEach((fr) => {
          const o = ac.createOscillator(); o.type = 'triangle';
          o.frequency.setValueAtTime(fr * 0.96, t); o.frequency.linearRampToValueAtTime(fr, t + 0.1);
          o.connect(gn); o.start(t); o.stop(t + 1.1);
        });
        burst(1700, 1.2, 0.04, 0.6);
        // gema dari bukit
        tone(587.33, 0.025, 0.7, { delay: 0.45, type: 'triangle', attack: 0.1, bus: amb });
      },
      ding() {
        [[988, 0], [784, 0.28]].forEach(([fr, dt]) => tone(fr, 0.15, 0.6, { delay: dt }));
      },
      bleat() {
        if (!ac || muted) return;
        const t = ac.currentTime;
        const o = ac.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(360, t + 0.55);
        const vib = ac.createOscillator(); vib.frequency.value = 9;
        const vg = g(28); vib.connect(vg).connect(o.frequency);
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 2.5;
        const gn = g(0);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
        gn.gain.setValueAtTime(0.1, t + 0.4); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
        const pn = panner(0.4);
        let out = o.connect(f).connect(gn); if (pn) out = out.connect(pn); out.connect(amb);
        o.start(t); vib.start(t); o.stop(t + 0.7); vib.stop(t + 0.7);
      },
      crash() {
        burst(180, 0.5, 0.5, 1.4, 'lowpass');
        burst(900, 4, 0.2, 0.9, 'bandpass', sfx, 0.05);
        metal(310, 0.2, 1.6, sfx, 0.02);
      },
      stars(n) {
        const notes = [523.25, 659.25, 783.99];
        for (let i = 0; i < n; i++) metal(notes[i] * 2, 0.16, 1.4, sfx, 0.35 + i * 0.3);
        if (n === 3) metal(1046.5 * 2, 0.12, 2, sfx, 1.4);
      },
      failSting() { [392, 311, 233].forEach((f, i) => tone(f, 0.12, 0.7, { type: 'triangle', delay: i * 0.3 })); },
      toggleMute() {
        muted = !muted; store.set('rn.mute', muted ? '1' : '0');
        if (master) set(master.gain, muted ? 0 : 0.8, 0.05);
        if (muted && 'speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
        return muted;
      },
      toggleMusic() { musicOn = !musicOn; store.set('rn.music', musicOn ? '1' : '0'); return musicOn; },
      get muted() { return muted; },
      get musicOn() { return musicOn; },
    };
  })();

  // ---------- state ----------
  let S = null;
  function newState() {
    return {
      mode: 'play',
      x: 0, v: 0, aCmd: -0.5, aAct: 0, aPrev: 0, jerkF: 0,
      notch: -2,
      t: 0, clock: 0,
      comfort: 100, coins: 0,
      violations: [], violKeys: {}, stops: [],
      phase: 'dwell', st: 0, doors: 'open',
      dwell: { step: 'close', timer: 0 },
      waiting: ROUTE.stations.map((s) => s.waiting),
      aboard: 9,
      sig: { S1: 'R', J1: 'Y', S2: 'R', B1: 'G', J2: 'G' },
      b1: { trig: false, t: 0 },
      yellowLimit: false,
      horned: { crossing: false },
      goat: { state: 'idle', t: 0 },
      overT: 0,
      shake: 0,
      chuffPhase: 0, lastJoint: 0,
      smoke: [],
      hints: {},
      stoppedShortShown: false,
      failReason: null,
    };
  }

  // ---------- DOM ----------
  const cv = $('world'), ctx = cv.getContext('2d');
  const sv = $('strip'), sctx = sv.getContext('2d');
  let W = 0, H = 0, DPR = 1, SW = 0, SH = 0;
  let mode = 'title';
  let rotateSkipped = false;

  const ui = {
    hud: $('hud'), toast: $('toast'),
    clock: $('clock'), nextName: $('nextName'), nextSched: $('nextSched'),
    comfortBar: $('comfortBar'), comfortVal: $('comfortVal'), coins: $('coins'),
    speed: $('speed'), speedo: $('speedo'), limit: $('limit'), nextLimit: $('nextLimit'),
    stopDist: $('stopDist'), stopBox: $('stopBox'),
    btnHorn: $('btnHorn'), btnDoor: $('btnDoor'), doorLbl: $('doorLbl'),
    lever: $('lever'), leverRows: $('leverRows'), thumb: $('leverThumb'),
    screens: { title: $('screenTitle'), brief: $('screenBrief'), pause: $('screenPause'), result: $('screenResult') },
  };
  const textCache = new Map();
  function setText(el, txt) { if (textCache.get(el) !== txt) { textCache.set(el, txt); el.textContent = txt; } }
  function setClass(el, cls, on) { el.classList.toggle(cls, !!on); }

  // build lever rows
  const rowEls = NOTCHES.map((lab, i) => {
    const s = document.createElement('span');
    s.textContent = lab;
    s.className = i < 4 ? 'p' : i === 4 ? 'n' : i === 9 ? 'eb' : 'b';
    ui.leverRows.appendChild(s);
    return s;
  });

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    checkOrientation();
  }
  function fitStrip() {
    const w = sv.clientWidth, h = sv.clientHeight;
    if (w !== SW || h !== SH) { SW = w; SH = h; sv.width = Math.round(w * DPR); sv.height = Math.round(h * DPR); }
  }
  function checkOrientation() {
    const portrait = window.innerHeight > window.innerWidth;
    $('rotate').hidden = !(portrait && !rotateSkipped);
  }

  // ---------- toast ----------
  let toastTimer = 0, toastPri = 0;
  const toastCool = {};
  function toast(msg, kind = 'info', dur = 2.8, key = null, pri = 1) {
    if (key) {
      const now = performance.now();
      if (toastCool[key] && now - toastCool[key] < 6000) return;
      toastCool[key] = now;
    }
    if (toastTimer > 0 && pri < toastPri) return;
    ui.toast.textContent = msg;
    ui.toast.className = 'show ' + kind;
    toastTimer = dur; toastPri = pri;
  }
  function hintOnce(key, msg, kind = 'info', dur = 3.4) {
    if (S.hints[key]) return;
    S.hints[key] = true;
    toast(msg, kind, dur, null, 2);
  }

  // ---------- route helpers ----------
  function zoneAt(x) {
    let best = null;
    for (const z of ROUTE.zones) {
      if (x >= z.from && x - TRAIN_LEN < z.to) { if (!best || z.limit < best.limit) best = z; }
    }
    return best;
  }
  function currentLimit() {
    const z = zoneAt(S.x);
    let lim = z ? z.limit : ROUTE.lineSpeed, key = z ? z.label : 'jalur bebas';
    if (S.yellowLimit && lim > 40) { lim = 40; key = 'sinyal kuning'; }
    return { lim, key };
  }
  function nextLimitAhead() {
    let best = null;
    for (const z of ROUTE.zones) {
      if (z.from > S.x && z.from - S.x < 600) { if (!best || z.from < best.from) best = z; }
    }
    return best;
  }
  function fogAt(x) {
    const f = ROUTE.fog;
    return smooth(f.from, f.from + 140, x) * (1 - smooth(f.to - 140, f.to, x));
  }
  const nextStation = () => ROUTE.stations[S.st + 1];
  const fmtClock = (s) => {
    const t = START_CLOCK + Math.floor(s);
    return `${String(Math.floor(t / 3600)).padStart(2, '0')}.${String(Math.floor(t / 60) % 60).padStart(2, '0')}`;
  };
  const fmtDur = (gs) => { const s = Math.round(Math.abs(gs)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const fmtM = (m) => (Math.abs(m) < 10 ? m.toFixed(1) : Math.round(m).toString()).replace('.', ',');

  // ---------- gameplay ----------
  function violation(key, text, comfortHit) {
    if (S.violKeys[key]) return;
    S.violKeys[key] = true;
    S.violations.push(text);
    S.comfort = clamp(S.comfort - comfortHit, 0, 100);
    toast(text, 'bad', 3.2, null, 3);
  }
  function fail(reason) {
    if (S.mode !== 'play') return;
    S.failReason = reason;
    S.mode = 'fail';
    S.shake = 1.4;
    Sound.crash();
    setTimeout(() => showResult(), 1100);
  }

  function setNotch(n, fromUser = true) {
    n = clamp(Math.round(n), -5, 4);
    if (n === S.notch) return;
    const prev = S.notch;
    S.notch = n;
    Sound.tick();
    if (prev < 0 && n > prev) Sound.airRelease(n >= 0 ? 0.11 : 0.05);
    else if (n < 0 && n < prev) Sound.airApply();
    if (n === -5 && prev !== -5 && S.v > 1) {
      S.comfort = clamp(S.comfort - 10, 0, 100);
      S.shake = 0.8;
      Sound.squeal(0.1);
      toast('Rem darurat! Penumpang terguncang.', 'bad', 2.6, 'eb', 3);
    }
    if (n > 0 && S.doors === 'open') toast('Tutup pintu dulu sebelum menambah tenaga.', 'warn', 2.4, 'doorpower', 2);
    if (fromUser) { try { navigator.vibrate && navigator.vibrate(8); } catch (e) { /* no haptics */ } }
    renderLever();
  }

  function horn() {
    if (!S || S.mode !== 'play') return;
    Sound.whistle();
    for (let i = 0; i < 14; i++) S.smoke.push(puff(S.x - 9.5, 4.9, true));
    const c = ROUTE.crossing, g = ROUTE.goat;
    if (S.x >= c.hornFrom && S.x < c.x && !S.horned.crossing) {
      S.horned.crossing = true;
      toast('Klakson dibunyikan. Perlintasan aman.', 'good', 2, null, 2);
    }
    if (S.goat.state === 'idle' && S.x >= g.hornFrom && S.x < g.x - 25) {
      S.goat.state = 'flee'; S.goat.t = 0;
      setTimeout(() => Sound.bleat(), 350);
      toast('Kambing menyingkir dari rel.', 'good', 2, null, 2);
    }
  }

  function door() {
    if (!S || S.mode !== 'play') return;
    if (S.phase === 'dwell') {
      const step = S.dwell.step;
      if (step === 'open') {
        S.doors = 'open'; Sound.ding(); Sound.doorSlide(true);
        S.dwell.step = ROUTE.stations[S.st].final ? 'alight' : 'board';
        S.dwell.timer = 0;
        return;
      }
      if (step === 'close') {
        S.doors = 'closed'; Sound.ding(); Sound.doorSlide(false);
        S.dwell.step = 'signal'; S.dwell.timer = 0;
        toast('Pintu tertutup. Tunggu sinyal berangkat hijau.', 'info', 2.4, null, 2);
        return;
      }
      if (step === 'board' || step === 'alight') { toast('Tunggu penumpang selesai.', 'info', 1.8, 'wait', 1); return; }
      toast('Pintu sudah tertutup.', 'info', 1.6, 'closed', 1);
      return;
    }
    const ns = nextStation();
    if (ns && S.v < 0.05) {
      const d = S.x - ns.x;
      if (d < -WINDOW_BEFORE) toast(`Belum sampai peron. Maju ${fmtM(-d)} m lagi.`, 'warn', 2.4, null, 2);
      else toast('Pintu hanya bisa dibuka saat berhenti di peron.', 'warn', 2.2, null, 2);
    } else {
      toast('Pintu hanya bisa dibuka saat kereta berhenti di peron.', 'warn', 2.2, 'doorrun', 2);
    }
  }

  function rateStop(d) {
    const a = Math.abs(d);
    if (a <= 1) return { r: 'Perfect', c: 'perfect', coins: 50 };
    if (a <= 4) return { r: 'Good', c: 'good', coins: 30 };
    if (a <= 10) return { r: 'OK', c: 'ok', coins: 10 };
    return { r: 'Miss', c: 'miss', coins: 0 };
  }

  function arrive(stIdx) {
    const st = ROUTE.stations[stIdx];
    const d = S.x - st.x;
    const rating = rateStop(d);
    S.stops.push({ name: st.name, offset: d, rating, clock: S.clock, sched: st.sched });
    S.coins += rating.coins;
    S.st = stIdx;
    S.phase = 'dwell';
    S.dwell = { step: 'open', timer: 0 };
    S.yellowLimit = false;
    const where = d > 0 ? 'lewat' : 'kurang';
    const kind = rating.c === 'miss' ? 'bad' : rating.c === 'ok' ? 'info' : 'good';
    toast(`${rating.r.toUpperCase()}! ${fmtM(Math.abs(d))} m ${where} dari marka. Buka pintu.`, kind, 3.2, null, 3);
    if (st.final) setTimeout(() => Sound.announce('Kereta telah tiba di Stasiun Pasar Lama, stasiun akhir. Terima kasih telah bepergian bersama Si Gagah.'), 900);
  }

  function updateDwell(dt) {
    const st = ROUTE.stations[S.st];
    const dw = S.dwell;
    dw.timer += dt;
    if (dw.step === 'board') {
      const total = 4.5;
      const startWaiting = st.waiting;
      const left = Math.max(0, Math.round(startWaiting * (1 - dw.timer / total)));
      if (left < S.waiting[S.st]) { S.aboard += S.waiting[S.st] - left; S.waiting[S.st] = left; }
      if (dw.timer >= total) {
        dw.step = 'close'; dw.timer = 0;
        toast(st.traders ? 'Para pedagang sudah naik dengan keranjangnya. Tutup pintu.' : 'Penumpang sudah naik. Tutup pintu.', 'info', 3, null, 2);
      }
    } else if (dw.step === 'alight') {
      if (dw.timer > 1) S.aboard = Math.max(0, S.aboard - Math.ceil(dt * 12));
      if (dw.timer >= 3.2) finish();
    } else if (dw.step === 'signal') {
      if (dw.timer >= 2) {
        const sig = ROUTE.signals.find((s) => s.start === S.st);
        if (sig) S.sig[sig.id] = 'G';
        S.phase = 'run';
        S.stoppedShortShown = false;
        Sound.ding();
        toast(S.st === 0 ? 'Sinyal hijau! Dorong tuas ke P untuk berangkat.' : 'Sinyal berangkat hijau. Lanjutkan perjalanan.', 'good', 3, null, 3);
      }
    }
  }

  function step(dt) {
    const prevX = S.x, prevV = S.v;
    S.t += dt; S.clock += dt * TIME_SCALE;

    // --- dinamika kereta ---
    const n = S.notch;
    let target;
    const powerLocked = S.doors === 'open' || S.phase === 'dwell';
    if (n > 0) target = powerLocked ? 0 : n * 0.26 * Math.max(0, 1 - S.v / 26);
    else if (n === 0) target = 0;
    else if (n === -5) target = -1.6;
    else target = n * 0.25;
    const rate = n === -5 ? 3.2 : 0.9;
    S.aCmd += clamp(target - S.aCmd, -rate * dt, rate * dt);
    const resist = S.v > 0.01 ? 0.012 + 0.00032 * S.v * S.v : 0;
    let a = S.aCmd - resist;
    if (S.v <= 0 && a < 0) a = 0;
    S.v = Math.max(0, S.v + a * dt);
    S.x += S.v * dt;
    S.aAct = (S.v - prevV) / dt;

    // --- kenyamanan: sentakan ---
    if (S.v > 0 && prevV > 0) {
      const jerk = Math.abs(S.aAct - S.aPrev) / dt;
      S.jerkF = lerp(S.jerkF, jerk, 0.08);
      if (S.jerkF > 1.05) S.comfort -= (S.jerkF - 1.05) * dt * 3;
    }
    S.aPrev = S.v > 0 ? S.aAct : 0;
    if (prevV > 0 && S.v === 0 && S.aCmd < -0.5 && S.notch !== -5) {
      const hit = (-S.aCmd - 0.45) * 9;
      S.comfort -= hit;
      toast('Kereta berhenti menyentak. Kurangi rem ke B1 sesaat sebelum berhenti.', 'warn', 3, 'jerkstop', 2);
    }

    // --- batas kecepatan ---
    const { lim, key } = currentLimit();
    const kmh = S.v * 3.6;
    if (kmh > lim + 2) {
      S.comfort -= (kmh - lim) * dt * 0.08;
      S.overT += dt;
      toast(`Terlalu cepat! Batas ${lim} km/h.`, 'warn', 2, 'over' + key, 2);
      if (S.overT > 1.2 && kmh > lim + 5) violation('over:' + key, `Melebihi batas kecepatan di ${key}`, 6);
      if (lim === 30 && kmh > 60) fail(`Kereta anjlok di Tikungan Bukit karena melaju ${Math.round(kmh)} km/h di batas 30 km/h.`);
    } else {
      S.overT = Math.max(0, S.overT - dt);
    }

    // --- sinyal ---
    for (const sig of ROUTE.signals) {
      if (prevX < sig.x && S.x >= sig.x) {
        const asp = S.sig[sig.id];
        if (asp === 'R') { fail(`Melanggar sinyal merah ${sig.id}. Dalam dunia nyata ini pelanggaran paling berat bagi masinis.`); return; }
        S.yellowLimit = asp === 'Y';
        if (asp === 'Y') toast(`Sinyal ${sig.id} kuning: maksimal 40 km/h sampai sinyal berikutnya.`, 'warn', 3, null, 2);
        S.sig[sig.id] = 'R'; // petak di belakang kereta tertutup
      }
    }
    // sinyal blok B1: kereta barang di petak depan
    if (!S.b1.trig && S.x > 1980) {
      S.b1.trig = true; S.sig.B1 = 'R';
      toast('Sinyal blok B1 MERAH! Kereta barang masih di petak depan. Siap berhenti.', 'bad', 3.6, null, 3);
    }
    if (S.b1.trig) {
      S.b1.t += dt;
      if (S.sig.B1 === 'R' && S.b1.t > 18 && S.x < 2250) { S.sig.B1 = 'Y'; toast('B1 berubah kuning. Jalan pelan, maks 40 km/h.', 'warn', 2.6, null, 2); }
      if (S.sig.B1 === 'Y' && S.b1.t > 27 && S.x < 2250) S.sig.B1 = 'G';
    }

    // --- perlintasan & kambing ---
    const c = ROUTE.crossing, g = ROUTE.goat;
    if (prevX < c.hornFrom && S.x >= c.hornFrom) hintOnce('crossing', 'Perlintasan sebidang 300 m lagi. Bunyikan klakson!', 'warn');
    if (prevX < c.x && S.x >= c.x && !S.horned.crossing) violation('crossing', 'Tidak membunyikan klakson sebelum perlintasan', 8);
    if (prevX < g.hornFrom && S.x >= g.hornFrom && S.goat.state === 'idle') hintOnce('goat', 'Ada kambing di rel! Bunyikan klakson.', 'warn');
    if (S.goat.state === 'idle' && S.x >= g.x - 25) { S.goat.state = 'flee'; S.goat.t = 0; Sound.bleat(); violation('goat', 'Hampir menabrak kambing. Klakson lebih awal.', 6); }
    if (S.goat.state === 'flee') { S.goat.t += dt; if (S.goat.t > 2.2) S.goat.state = 'gone'; }

    // --- petunjuk ---
    if (S.x > 260) hintOnce('curve', 'Tikungan Bukit di depan: batas 30 km/h. Rem lebih awal.');
    if (S.x > ROUTE.fog.from) hintOnce('fog', 'Kabut menebal. Sinyal jauh tidak terlihat di peta jalur.', 'info');
    const ns = nextStation();
    if (ns && S.phase === 'run' && ns.x - S.x < 420 && ns.x - S.x > 0 && !S.hints['ann' + S.st]) {
      S.hints['ann' + S.st] = true;
      const nm = ns.name.charAt(0) + ns.name.slice(1).toLowerCase().replace(/ (\w)/g, (m0, c1) => ' ' + c1.toUpperCase());
      Sound.announce(`Sesaat lagi kereta akan tiba di Stasiun ${nm}. Periksa kembali barang bawaan Anda.`);
    }
    if (ns && S.phase === 'run' && ns.x - S.x < 260 && ns.x - S.x > 0) hintOnce('stop' + S.st, `Stasiun ${ns.name}: berhenti tepat di marka kuning "3".`);

    // --- tiba di stasiun ---
    if (S.phase === 'run' && ns && S.v === 0 && prevV === 0) {
      const d = S.x - ns.x;
      if (d >= -WINDOW_BEFORE && d <= WINDOW_AFTER) arrive(S.st + 1);
      else if (d < -WINDOW_BEFORE && d > -250 && !S.stoppedShortShown) {
        S.stoppedShortShown = true;
        toast(`Belum sampai peron. Maju ${fmtM(-d)} m lagi.`, 'warn', 2.6, null, 2);
      }
    }
    if (S.v > 0.3) S.stoppedShortShown = false;
    if (S.phase === 'dwell') updateDwell(dt);

    if (S.x >= ROUTE.bufferStop - 0.5) fail('Kereta menabrak penahan di ujung rel Pasar Lama.');

    S.comfort = clamp(S.comfort, 0, 100);

    // --- suara roda & uap ---
    if (S.v > 0.15) {
      S.chuffPhase += (S.v / (2 * Math.PI * 0.85)) * 4 * dt;
      if (S.chuffPhase >= 1) {
        S.chuffPhase -= 1;
        const pw = S.notch > 0 && !powerLocked ? S.notch / 4 : 0.1;
        Sound.chuff(0.03 + 0.12 * pw);
      }
      const joint = Math.floor(S.x / 25);
      if (joint !== S.lastJoint) { S.lastJoint = joint; Sound.click(0.05); setTimeout(() => Sound.click(0.04), 120); }
    }

    // --- asap ---
    const power = S.notch > 0 && !powerLocked ? S.notch / 4 : 0;
    const rateSmoke = 5 + power * 22 + S.v * 0.4;
    if (Math.random() < rateSmoke * dt) S.smoke.push(puff(S.x - 2.6, 5.4, false, power));
    if (power > 0 && S.v < 4 && Math.random() < 20 * dt) S.smoke.push(steamPuff(S.x - 3.5));
    for (const p of S.smoke) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.995; p.r += p.grow * dt;
    }
    S.smoke = S.smoke.filter((p) => p.life < p.max);
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 1.6);
  }

  function puff(x, y, white, power = 0) {
    return { x, y, r: white ? 0.3 : 0.45, grow: white ? 1.4 : 1.1 + power, vx: (Math.random() - 0.5) * 0.6 - 0.8, vy: white ? 1.2 + Math.random() : 2 + power * 2 + Math.random(), life: 0, max: white ? 1.2 : 3.2 + Math.random(), white, a: white ? 0.7 : 0.38 + power * 0.25 };
  }
  function steamPuff(x) {
    return { x: x + (Math.random() - 0.5) * 1.5, y: 0.6, r: 0.3, grow: 1.6, vx: (Math.random() - 0.5) * 2, vy: 0.4 + Math.random() * 0.4, life: 0, max: 0.9, white: true, a: 0.55 };
  }

  // ---------- akhir misi ----------
  function finish() {
    S.mode = 'done';
    showResult();
  }

  function computeResult() {
    const failed = !!S.failReason;
    const final = S.stops.find((s) => s.name === 'PASAR LAMA');
    const onTime = final ? final.clock - final.sched <= 30 : false;
    const goodStops = S.stops.length === 2 && S.stops.every((s) => s.rating.c === 'perfect' || s.rating.c === 'good');
    let stars = 0;
    if (!failed && final) {
      stars = 1;
      if (onTime) stars++;
      if (S.comfort >= 80 && goodStops) stars++;
    }
    const base = failed ? 0 : 100;
    const comfortBonus = failed ? 0 : Math.round(S.comfort * 0.5);
    const penalty = S.violations.length * 20;
    const total = Math.max(0, base + S.coins + comfortBonus - penalty);
    return { failed, stars, onTime, total, base, comfortBonus, penalty };
  }

  const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

  function showResult() {
    const r = computeResult();
    const best = Number(store.get('relnusantara.best.1-4') || 0);
    if (r.stars > best) store.set('relnusantara.best.1-4', String(r.stars));
    if (r.failed) Sound.failSting(); else Sound.stars(r.stars);
    $('resTitle').textContent = r.failed ? 'Misi gagal' : 'Misi selesai';
    $('resEyebrow').textContent = r.failed ? 'Misi 1-4 · Pagi Pertama Pasar Minggu' : `Misi 1-4 · tiba ${fmtClock(S.clock)}`;
    $('resStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < r.stars ? 'on' : 'off'}">${STAR_SVG}</span>`).join('');
    $('resStars').setAttribute('aria-label', `${r.stars} dari 3 bintang`);
    const fr = $('resFail');
    fr.hidden = !r.failed;
    fr.textContent = r.failed ? S.failReason : '';
    $('btnAgain').textContent = r.failed ? 'Coba lagi' : 'Main lagi';

    const rows = S.stops.map((s) => {
      const late = s.clock - s.sched;
      const timeCell = late > 30 ? `<span class="late">terlambat ${fmtDur(late)}</span>` : `<span class="ontime">tepat waktu</span>`;
      return `<tr><td>${s.name}</td><td><span class="tag ${s.rating.c}">${s.rating.r}</span> ${fmtM(Math.abs(s.offset))} m</td><td>${fmtClock(s.clock)} / ${fmtClock(s.sched)}<br>${timeCell}</td></tr>`;
    }).join('') || '<tr><td colspan="3">Belum ada pemberhentian.</td></tr>';
    const viol = S.violations.length ? `<ul class="viol">${S.violations.map((v) => `<li>${v}</li>`).join('')}</ul>` : '';
    const reward = !r.failed && r.stars >= 1 ? `<div class="reward"><strong>Terbuka:</strong> Kios Sarapan di Stasiun Cibening. Penumpang di Cibening bertambah di misi berikutnya.</div>` : '';
    $('resCard').innerHTML = `
      <table class="rtable">
        <thead><tr><th>Stasiun</th><th>Berhenti</th><th>Tiba / jadwal</th></tr></thead>
        <tbody>${rows}
          <tr><td>Kenyamanan</td><td colspan="2">${Math.round(S.comfort)}%${S.comfort >= 80 ? '' : ' (target 80%)'}</td></tr>
          <tr><td>Koin</td><td colspan="2"><strong>${r.total}</strong> <span style="color:var(--muted)">(misi ${r.base} + berhenti ${S.coins} + nyaman ${r.comfortBonus} − pelanggaran ${r.penalty})</span></td></tr>
        </tbody>
      </table>${viol}${reward}`;
    showScreen('result');
  }

  // ---------- screen flow ----------
  function showScreen(name) {
    mode = name;
    for (const [k, el] of Object.entries(ui.screens)) el.hidden = k !== name;
    ui.hud.hidden = !(name === 'play' || name === 'pause');
    if (name !== 'play') { toastTimer = 0; ui.toast.className = ''; }
    if (name === 'title') updateBest();
  }
  function updateBest() {
    const b = Number(store.get('relnusantara.best.1-4') || 0);
    $('bestLine').textContent = b ? `Rekor terbaik: ${'★'.repeat(b)}${'☆'.repeat(3 - b)}` : '';
  }
  function startMission() {
    S = newState();
    textCache.clear();
    showScreen('play');
    fitStrip();
    renderLever();
    toast('Selamat pagi, Masinis Raka! Tutup pintu untuk bersiap berangkat.', 'info', 4, null, 3);
    setTimeout(() => { if (S && S.st === 0) Sound.announce('Perhatian. Kereta lokal Si Gagah tujuan Pasar Lama di jalur satu akan segera diberangkatkan.'); }, 600);
  }

  // ---------- input ----------
  function bindPress(el, fn) {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); Sound.init(); el.classList.add('pressed'); fn(); });
    const up = () => el.classList.remove('pressed');
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  }
  bindPress(ui.btnHorn, horn);
  bindPress(ui.btnDoor, door);

  function leverFromY(clientY) {
    const r = ui.leverRows.getBoundingClientRect();
    const idx = clamp(Math.floor(((clientY - r.top) / r.height) * NOTCHES.length), 0, NOTCHES.length - 1);
    if (S && S.mode === 'play') setNotch(4 - idx);
  }
  let leverDrag = false;
  ui.lever.addEventListener('pointerdown', (e) => {
    e.preventDefault(); Sound.init();
    leverDrag = true;
    try { ui.lever.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    leverFromY(e.clientY);
  });
  ui.lever.addEventListener('pointermove', (e) => { if (leverDrag) leverFromY(e.clientY); });
  const endDrag = () => { leverDrag = false; };
  ui.lever.addEventListener('pointerup', endDrag);
  ui.lever.addEventListener('pointercancel', endDrag);
  ui.lever.addEventListener('keydown', (e) => {
    if (!S || S.mode !== 'play') return;
    if (e.key === 'ArrowUp') { e.preventDefault(); setNotch(S.notch + 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setNotch(S.notch - 1); }
  });

  function renderLever() {
    if (!S) return;
    const idx = 4 - S.notch;
    ui.thumb.style.top = `${idx * 10}%`;
    ui.thumb.className = 'thumb' + (S.notch < 0 ? ' brake' : S.notch === 0 ? ' neutral' : '');
    rowEls.forEach((el, i) => el.classList.toggle('on', i === idx));
    ui.lever.setAttribute('aria-valuenow', String(S.notch));
    ui.lever.setAttribute('aria-valuetext', notchLabel(S.notch));
  }

  window.addEventListener('keydown', (e) => {
    if (mode !== 'play' || !S || S.mode !== 'play') {
      if ((e.key === 'Escape' || e.key === 'p') && mode === 'pause') resume();
      return;
    }
    if (e.target === ui.lever) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') { e.preventDefault(); setNotch(S.notch + 1); }
    else if (k === 'arrowdown' || k === 's') { e.preventDefault(); setNotch(S.notch - 1); }
    else if (k === ' ') { e.preventDefault(); setNotch(-5); }
    else if (k === 'h') horn();
    else if (k === 'd' || k === 'enter') door();
    else if (k === 'escape' || k === 'p') pause();
    Sound.init();
  });

  function pause() { if (mode === 'play') { showScreen('pause'); } }
  function resume() { if (mode === 'pause') { showScreen('play'); last = performance.now(); } }
  $('btnPause').addEventListener('click', pause);
  $('btnResume').addEventListener('click', resume);
  $('btnRestart').addEventListener('click', () => { Sound.init(); startMission(); });
  $('btnQuit').addEventListener('click', () => { S = null; showScreen('title'); });
  $('btnStart').addEventListener('click', () => { Sound.init(); showScreen('brief'); });
  $('btnBack').addEventListener('click', () => showScreen('title'));
  $('btnGo').addEventListener('click', () => { Sound.init(); startMission(); });
  $('btnAgain').addEventListener('click', () => { Sound.init(); startMission(); });
  $('btnMenu').addEventListener('click', () => { S = null; showScreen('title'); });
  const SPK_ON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const SPK_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function syncAudioButtons() {
    const m = Sound.muted, mu = Sound.musicOn;
    $('btnMute').innerHTML = m ? SPK_OFF : SPK_ON;
    $('btnMute').setAttribute('aria-label', m ? 'Nyalakan suara' : 'Matikan semua suara');
    $('btnMusic').classList.toggle('off', !mu);
    $('btnMusic').setAttribute('aria-label', mu ? 'Matikan musik' : 'Nyalakan musik');
    $('btnMusicTitle').textContent = `Musik: ${mu ? 'nyala' : 'mati'}`;
    $('btnSoundTitle').textContent = `Suara: ${m ? 'mati' : 'nyala'}`;
  }
  $('btnMute').addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncAudioButtons(); });
  $('btnSoundTitle').addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncAudioButtons(); });
  $('btnMusic').addEventListener('click', () => { Sound.init(); Sound.toggleMusic(); syncAudioButtons(); });
  $('btnMusicTitle').addEventListener('click', () => { Sound.init(); Sound.toggleMusic(); syncAudioButtons(); });
  syncAudioButtons();
  // browser hanya mengizinkan audio setelah sentuhan pertama
  document.addEventListener('pointerdown', () => Sound.init(), { once: true });
  document.addEventListener('keydown', () => Sound.init(), { once: true });
  $('btnRotateSkip').addEventListener('click', () => { rotateSkipped = true; checkOrientation(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('resize', resize);

  // ---------- HUD ----------
  function updateHud() {
    setText(ui.clock, fmtClock(S.clock));
    const ns = S.phase === 'dwell' ? ROUTE.stations[S.st] : nextStation();
    if (ns) {
      setText(ui.nextName, ns.name);
      if (S.phase === 'dwell' && S.st === 0) setText(ui.nextSched, 'berangkat 06.00');
      else if (S.phase === 'dwell') setText(ui.nextSched, 'berhenti di peron');
      else {
        const rem = ns.sched - S.clock;
        setText(ui.nextSched, `jadwal ${fmtClock(ns.sched)} · ${rem >= 0 ? 'sisa ' + fmtDur(rem) : 'terlambat ' + fmtDur(rem)}`);
      }
    }
    const cf = Math.round(S.comfort);
    ui.comfortBar.style.width = cf + '%';
    ui.comfortBar.style.backgroundColor = cf >= 80 ? 'var(--sig-green)' : cf >= 55 ? 'var(--saffron)' : 'var(--sig-red)';
    setText(ui.comfortVal, cf + '%');
    setText(ui.coins, String(S.coins));

    const kmh = S.v * 3.6;
    const { lim } = currentLimit();
    setText(ui.speed, String(Math.round(kmh)));
    setText(ui.limit, String(lim));
    setClass(ui.speedo, 'over', kmh > lim + 2);
    const nl = nextLimitAhead();
    setText(ui.nextLimit, nl ? `${nl.limit} km/h dalam ${Math.round(nl.from - S.x)} m` : S.yellowLimit ? 'Sinyal kuning: maks 40' : 'Kecepatan jalur 80');

    // titik henti
    let stopTxt = '—', near = false, over = false;
    const tgt = S.phase === 'run' ? nextStation() : null;
    if (tgt) {
      const d = tgt.x - S.x;
      if (d < 700) {
        if (d >= 0) { stopTxt = `${fmtM(d)} m`; near = d < 60; }
        else { stopTxt = `+${fmtM(-d)} m`; over = true; }
      }
    } else if (S.phase === 'dwell') {
      const last = S.stops[S.stops.length - 1];
      if (last && S.st > 0) stopTxt = last.rating.r;
    }
    setText(ui.stopDist, stopTxt);
    setClass(ui.stopBox, 'near', near); setClass(ui.stopBox, 'over', over);

    // pintu
    const dw = S.phase === 'dwell' ? S.dwell.step : null;
    setText(ui.doorLbl, S.doors === 'open' ? 'Tutup pintu' : 'Buka pintu');
    setClass(ui.btnDoor, 'cue', dw === 'open' || dw === 'close');
    const c = ROUTE.crossing, g = ROUTE.goat;
    const hornCue = (S.x >= c.hornFrom && S.x < c.x && !S.horned.crossing) || (S.goat.state === 'idle' && S.x >= g.hornFrom && S.x < g.x - 25);
    setClass(ui.btnHorn, 'cue', hornCue);
  }

  // ---------- render dunia ----------
  function render(dtReal) {
    const c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const st = S || idleState;
    const ppm = clamp(H / 52, 3.4, 12);
    const gy = Math.round(H * 0.64);
    const shake = st.shake > 0 ? (Math.random() - 0.5) * st.shake * 7 : 0;
    const anchor = mode === 'play' || mode === 'pause' ? 0.6 : 0.78;
    const camX = st.x - (W * anchor) / ppm;
    const X = (wx) => (wx - camX) * ppm + shake;
    const wx0 = camX - 30, wx1 = camX + W / ppm + 30;
    const p = clamp(st.clock / 1500, 0, 1); // fajar -> pagi
    const V = { c, ppm, gy, camX, X, wx0, wx1, p, st };

    drawSky(V);
    drawRidges(V);
    drawBackProps(V);
    drawGround(V);
    drawStations(V);
    drawTrackside(V);
    drawGoat(V);
    drawTrain(V);
    drawSmoke(V);
    drawBridgeTruss(V);
    drawFrontProps(V);
    drawFog(V);
  }

  function drawSky(V) {
    const { c, gy, p } = V;
    const g = c.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, mix('#2c3a6b', '#5d9fd3', p));
    g.addColorStop(0.65, mix('#c97a7a', '#a8d2ea', p));
    g.addColorStop(1, mix('#f7b36d', '#e3f0f0', p));
    c.fillStyle = g; c.fillRect(0, 0, W, gy + 4);
    // matahari terbit
    const sx = W * 0.8, sy = lerp(gy - 10, gy * 0.25, p);
    const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 90);
    sg.addColorStop(0, 'rgba(255,236,190,0.95)'); sg.addColorStop(0.18, 'rgba(255,214,150,0.8)'); sg.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 90, 0, Math.PI * 2); c.fill();
  }

  function ridgePath(V, par, base, amp, fn, color) {
    const { c, camX, ppm } = V;
    const off = camX * ppm * par;
    c.beginPath(); c.moveTo(0, V.gy + 2);
    for (let sx = 0; sx <= W + 8; sx += 6) c.lineTo(sx, base - amp * fn(sx + off));
    c.lineTo(W, V.gy + 2); c.closePath();
    c.fillStyle = color; c.fill();
  }
  function drawRidges(V) {
    const { gy, p } = V;
    // gunung berapi jauh
    ridgePath(V, 0.05, gy - 8, gy * 0.42, (u) => {
      const k = ((u % 2600) + 2600) % 2600;
      const vol = Math.max(0, 1 - Math.abs(k - 1300) / 520);
      const cone = Math.min(0.92, Math.pow(vol, 1.25)) * 1.05;
      return Math.max(cone, 0.18 + 0.1 * Math.sin(u * 0.004) + 0.06 * Math.sin(u * 0.011));
    }, mix('#5b4f7e', '#86a2bd', p));
    ridgePath(V, 0.16, gy - 4, gy * 0.26, (u) => 0.45 + 0.3 * Math.sin(u * 0.0031 + 1) + 0.18 * Math.sin(u * 0.009 + 2), mix('#3c5a52', '#5f8f6c', p));
    // sawah terasering
    const par = 0.42, off = V.camX * V.ppm * par;
    const fn = (u) => 0.35 + 0.28 * Math.sin(u * 0.0045 + 4) + 0.12 * Math.sin(u * 0.013);
    const base = gy, amp = gy * 0.16;
    ridgePath(V, par, base, amp, fn, mix('#46703c', '#6c9e48', p));
    const c = V.c;
    c.save();
    c.strokeStyle = mix('#76a056', '#a6cf6b', p); c.lineWidth = 1.4; c.globalAlpha = 0.6;
    for (let k = 1; k <= 5; k++) {
      c.beginPath();
      for (let sx = 0; sx <= W + 8; sx += 6) {
        const top = base - amp * fn(sx + off);
        const y = top + (base - top) * (k / 6) + Math.sin((sx + off) * 0.03 + k) * 1.2;
        if (sx === 0) c.moveTo(sx, y); else c.lineTo(sx, y);
      }
      c.stroke();
    }
    c.restore();
  }

  function inBridge(x) { return x > ROUTE.bridge.from && x < ROUTE.bridge.to; }
  function nearStation(x) { return ROUTE.stations.some((s) => x > s.x - 95 && x < s.x + 25); }

  function drawBackProps(V) {
    const { c, ppm, gy, X, wx0, wx1, p } = V;
    // tiang telegraf dan kabel
    const poleY = gy - 1.4 * ppm;
    const first = Math.floor(wx0 / 50) * 50 + 20;
    c.strokeStyle = 'rgba(40,36,30,0.75)'; c.lineWidth = 1;
    for (let px = first; px < wx1 + 50; px += 50) {
      if (inBridge(px)) continue;
      const sx = X(px), top = poleY - 7 * ppm;
      c.fillStyle = '#4a3b2c'; c.fillRect(sx - 0.12 * ppm, top, 0.24 * ppm, 7 * ppm);
      c.fillRect(sx - 0.7 * ppm, top + 0.4 * ppm, 1.4 * ppm, 0.15 * ppm);
      const nx = X(px + 50);
      for (let k = -1; k <= 1; k += 2) {
        c.beginPath(); c.moveTo(sx + k * 0.6 * ppm, top + 0.4 * ppm);
        c.quadraticCurveTo((sx + nx) / 2, top + 1.6 * ppm, nx + k * 0.6 * ppm, top + 0.4 * ppm); c.stroke();
      }
    }
    // pepohonan
    const slot = 13;
    for (let i = Math.floor(wx0 / slot) - 1; i < wx1 / slot + 1; i++) {
      const h = hash(i);
      if (h > 0.5) continue;
      const tx = i * slot + hash(i + 0.37) * 9;
      if (nearStation(tx) || inBridge(tx) || Math.abs(tx - ROUTE.crossing.x) < 12) continue;
      const sx = X(tx), base = gy - 1.2 * ppm - hash(i + 0.9) * 1.2 * ppm;
      const kind = hash(i + 0.11);
      const col = mix('#24402c', '#335c35', p), col2 = mix('#2f5235', '#3f7040', p);
      if (kind < 0.45) { // kelapa
        const ht = (8 + hash(i + 2) * 5) * ppm, lean = (hash(i + 3) - 0.5) * 2 * ppm;
        c.strokeStyle = mix('#4b3a2a', '#6a523a', p); c.lineWidth = 0.35 * ppm;
        c.beginPath(); c.moveTo(sx, base); c.quadraticCurveTo(sx + lean * 0.3, base - ht * 0.6, sx + lean, base - ht); c.stroke();
        c.strokeStyle = col2; c.lineWidth = 0.32 * ppm; c.lineCap = 'round';
        for (let f = 0; f < 7; f++) {
          const ang = -Math.PI / 2 + (f - 3) * 0.5;
          const len = 3.4 * ppm;
          const ex = sx + lean + Math.cos(ang) * len, ey = base - ht + Math.sin(ang) * len * 0.6 + 1.6 * ppm;
          c.beginPath(); c.moveTo(sx + lean, base - ht);
          c.quadraticCurveTo(sx + lean + Math.cos(ang) * len * 0.6, base - ht - 0.9 * ppm, ex, ey); c.stroke();
        }
        c.lineCap = 'butt';
      } else if (kind < 0.75) { // pisang
        c.fillStyle = mix('#4b5a2e', '#5f7a35', p);
        c.fillRect(sx - 0.2 * ppm, base - 3 * ppm, 0.4 * ppm, 3 * ppm);
        c.fillStyle = col2;
        for (let f = 0; f < 4; f++) {
          c.save(); c.translate(sx, base - 3 * ppm); c.rotate(-1.2 + f * 0.8);
          c.beginPath(); c.ellipse(1.4 * ppm, 0, 1.6 * ppm, 0.45 * ppm, 0, 0, Math.PI * 2); c.fill(); c.restore();
        }
      } else { // semak
        c.fillStyle = col;
        c.beginPath(); c.ellipse(sx, base - 0.8 * ppm, 2.4 * ppm, 1.4 * ppm, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(sx + 1.5 * ppm, base - 1.2 * ppm, 1.6 * ppm, 1.2 * ppm, 0, 0, Math.PI * 2); c.fill();
      }
    }
  }

  function drawGround(V) {
    const { c, ppm, gy, X, p } = V;
    // tanah depan (sawah)
    const g = c.createLinearGradient(0, gy, 0, H);
    g.addColorStop(0, mix('#4f7a36', '#6f9e45', p)); g.addColorStop(1, mix('#2f4f26', '#46703a', p));
    c.fillStyle = g; c.fillRect(0, gy, W, H - gy);
    // pematang sawah
    c.strokeStyle = mix('#5f8a3e', '#86b456', p); c.globalAlpha = 0.55; c.lineWidth = 1.2;
    for (let k = 1; k < 5; k++) {
      const y = gy + (H - gy) * (0.22 + k * 0.16);
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    c.globalAlpha = 1;
    // sungai di bawah jembatan
    const b = ROUTE.bridge;
    const bx0 = X(b.from + 6), bx1 = X(b.to - 6);
    if (bx1 > 0 && bx0 < W) {
      c.fillStyle = mix('#6b5a43', '#7b6a4e', p);
      c.beginPath(); c.moveTo(bx0 - 4 * ppm, gy); c.lineTo(bx1 + 4 * ppm, gy); c.lineTo(bx1 - 6 * ppm, H); c.lineTo(bx0 + 6 * ppm, H); c.closePath(); c.fill();
      const wg = c.createLinearGradient(0, gy + 3 * ppm, 0, H);
      wg.addColorStop(0, mix('#5d7d8f', '#7fb4c8', p)); wg.addColorStop(1, mix('#30505e', '#3f7a8f', p));
      c.fillStyle = wg;
      c.beginPath(); c.moveTo(bx0 + 2 * ppm, gy + 3 * ppm); c.lineTo(bx1 - 2 * ppm, gy + 3 * ppm); c.lineTo(bx1 - 8 * ppm, H); c.lineTo(bx0 + 8 * ppm, H); c.closePath(); c.fill();
      // pilar batu
      c.fillStyle = mix('#6e6a63', '#8d877c', p);
      const mid = X((b.from + b.to) / 2);
      c.fillRect(mid - 1.2 * ppm, gy + 0.4 * ppm, 2.4 * ppm, H - gy);
      c.fillRect(bx0 - 3 * ppm, gy, 3 * ppm, 3 * ppm);
      c.fillRect(bx1, gy, 3 * ppm, 3 * ppm);
    }
    // ballast
    c.fillStyle = mix('#6d6359', '#8a7f72', p);
    c.beginPath(); c.moveTo(0, gy + 0.25 * ppm); c.lineTo(W, gy + 0.25 * ppm); c.lineTo(W, gy + 1.3 * ppm); c.lineTo(0, gy + 1.3 * ppm); c.closePath(); c.fill();
    if (bx1 > 0 && bx0 < W) {
      c.fillStyle = '#39424a'; c.fillRect(bx0, gy + 0.2 * ppm, bx1 - bx0, 1.0 * ppm);
    }
    // bantalan & rel
    c.fillStyle = mix('#3b3029', '#4e4036', p);
    const step = 1.5;
    for (let sx = Math.floor(V.wx0 / step) * step; sx < V.wx1; sx += step) c.fillRect(X(sx), gy + 0.1 * ppm, 0.7 * ppm, 0.35 * ppm);
    c.fillStyle = '#9aa0a2'; c.fillRect(0, gy - 0.12 * ppm, W, 0.24 * ppm);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, gy - 0.12 * ppm, W, 1);
    // ujung rel (penahan)
    const bs = X(ROUTE.bufferStop);
    if (bs > -20 && bs < W + 20) {
      c.fillStyle = '#c23b2e'; c.fillRect(bs, gy - 1.6 * ppm, 1 * ppm, 1.5 * ppm);
      c.fillStyle = '#f1e9d6'; c.fillRect(bs, gy - 1.2 * ppm, 1 * ppm, 0.3 * ppm);
      c.fillStyle = '#5e5248'; c.fillRect(bs + 0.2 * ppm, gy - 0.1 * ppm, 3 * ppm, 0.4 * ppm);
    }
  }

  function person(c, x, y, s, seed, basket) {
    const cols = ['#c0392b', '#2e86ab', '#e1a63b', '#6c4f9e', '#3c8d5a', '#d35f8d', '#e4d6b8'];
    c.fillStyle = cols[Math.floor(hash(seed) * cols.length)];
    c.fillRect(x - 0.28 * s, y - 1.25 * s, 0.56 * s, 0.75 * s);
    c.fillStyle = '#2b2b33'; c.fillRect(x - 0.24 * s, y - 0.5 * s, 0.2 * s, 0.5 * s); c.fillRect(x + 0.04 * s, y - 0.5 * s, 0.2 * s, 0.5 * s);
    c.fillStyle = '#c99a72'; c.beginPath(); c.arc(x, y - 1.47 * s, 0.22 * s, 0, Math.PI * 2); c.fill();
    if (basket) {
      c.fillStyle = '#a77b3f'; c.beginPath(); c.ellipse(x, y - 1.78 * s, 0.42 * s, 0.17 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5fa04a'; c.beginPath(); c.arc(x - 0.12 * s, y - 1.9 * s, 0.13 * s, 0, Math.PI * 2); c.arc(x + 0.14 * s, y - 1.88 * s, 0.12 * s, 0, Math.PI * 2); c.fill();
    }
  }

  function drawStations(V) {
    const { c, ppm, gy, X, st } = V;
    ROUTE.stations.forEach((s, i) => {
      const a = X(s.x - 95), b = X(s.x + 25);
      if (b < -50 || a > W + 50) return;
      // bangunan stasiun
      const cx = X(s.x - 48), bw = 24 * ppm, bh = 4.6 * ppm, by = gy - 1.0 * ppm;
      c.fillStyle = '#efe6d2'; c.fillRect(cx - bw / 2, by - bh, bw, bh);
      c.fillStyle = '#2e6b6a'; c.fillRect(cx - bw / 2, by - 0.6 * ppm, bw, 0.6 * ppm);
      for (let k = 0; k < 6; k++) {
        const wx = cx - bw / 2 + (k + 0.5) * (bw / 6);
        c.fillStyle = '#3d4a4f';
        c.beginPath(); c.moveTo(wx - 0.8 * ppm, by - 0.9 * ppm); c.lineTo(wx - 0.8 * ppm, by - 3 * ppm);
        c.arc(wx, by - 3 * ppm, 0.8 * ppm, Math.PI, 0); c.lineTo(wx + 0.8 * ppm, by - 0.9 * ppm); c.closePath(); c.fill();
      }
      // atap bersusun (gaya joglo)
      c.fillStyle = '#8f4330';
      c.beginPath(); c.moveTo(cx - bw / 2 - 2.5 * ppm, by - bh); c.lineTo(cx + bw / 2 + 2.5 * ppm, by - bh);
      c.lineTo(cx + bw / 2 - 3 * ppm, by - bh - 2 * ppm); c.lineTo(cx - bw / 2 + 3 * ppm, by - bh - 2 * ppm); c.closePath(); c.fill();
      c.fillStyle = '#a5513a';
      c.beginPath(); c.moveTo(cx - bw / 4, by - bh - 2 * ppm); c.lineTo(cx + bw / 4, by - bh - 2 * ppm);
      c.lineTo(cx + 2 * ppm, by - bh - 4.2 * ppm); c.lineTo(cx - 2 * ppm, by - bh - 4.2 * ppm); c.closePath(); c.fill();
      // kanopi peron
      c.fillStyle = 'rgba(70,60,50,0.9)';
      c.fillRect(X(s.x - 82), gy - 5.2 * ppm, (60) * ppm, 0.35 * ppm);
      for (let k = 0; k <= 5; k++) c.fillRect(X(s.x - 80 + k * 11.5), gy - 5 * ppm, 0.18 * ppm, 4 * ppm);
      // peron
      c.fillStyle = '#b8b1a2'; c.fillRect(a, gy - 1.0 * ppm, b - a, 0.8 * ppm);
      c.fillStyle = '#e8c33a'; c.fillRect(a, gy - 1.0 * ppm, b - a, 0.14 * ppm);
      // papan nama stasiun (dengan ketinggian, seperti di stasiun Indonesia)
      const bx = X(s.x - 14), bwid = 9 * ppm, bht = 2.2 * ppm, btop = gy - 1 * ppm - 4.4 * ppm;
      c.fillStyle = '#3a3a3a'; c.fillRect(bx - bwid / 2 + 0.6 * ppm, btop + bht, 0.25 * ppm, 4.4 * ppm - bht); c.fillRect(bx + bwid / 2 - 0.85 * ppm, btop + bht, 0.25 * ppm, 4.4 * ppm - bht);
      c.fillStyle = '#fbfaf5'; c.fillRect(bx - bwid / 2, btop, bwid, bht);
      c.strokeStyle = '#1d2a2b'; c.lineWidth = Math.max(1, 0.12 * ppm); c.strokeRect(bx - bwid / 2, btop, bwid, bht);
      c.fillStyle = '#1d2a2b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${Math.round(1.05 * ppm)}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
      c.fillText(s.name, bx, btop + bht * 0.4);
      c.font = `700 ${Math.round(0.6 * ppm)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      c.fillText(s.elev, bx, btop + bht * 0.8);
      // marka henti "3" (jumlah kereta = lokomotif + 2 gerbong)
      const mx = X(s.x);
      c.fillStyle = '#333'; c.fillRect(mx - 0.1 * ppm, gy - 2.6 * ppm, 0.2 * ppm, 1.8 * ppm);
      c.fillStyle = '#f2c230'; c.fillRect(mx - 0.6 * ppm, gy - 3.8 * ppm, 1.2 * ppm, 1.2 * ppm);
      c.fillStyle = '#111'; c.font = `900 ${Math.round(1.0 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText('3', mx, gy - 3.17 * ppm);
      // calon penumpang
      const n = st.waiting ? st.waiting[i] : s.waiting;
      for (let k = 0; k < n; k++) {
        const px = X(s.x - 72 + k * 4.1 + hash(k + i * 7) * 1.8);
        person(c, px, gy - 1.0 * ppm, ppm, k + i * 13, s.traders && hash(k + 3.3) < 0.6);
      }
    });
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }

  function signalHead(c, sx, gy, ppm, asp, id, dim) {
    const top = gy - 6.2 * ppm;
    c.fillStyle = '#4b4f52'; c.fillRect(sx - 0.15 * ppm, top, 0.3 * ppm, 6.2 * ppm - 1.0 * ppm);
    c.fillStyle = '#16191b';
    c.beginPath(); c.roundRect ? c.roundRect(sx - 0.6 * ppm, top - 2.6 * ppm, 1.2 * ppm, 2.8 * ppm, 0.3 * ppm) : c.rect(sx - 0.6 * ppm, top - 2.6 * ppm, 1.2 * ppm, 2.8 * ppm); c.fill();
    const lamps = [['R', '#ff4b3a'], ['Y', '#ffc42b'], ['G', '#3bff8a']];
    lamps.forEach(([k, col], i) => {
      const ly = top - 2.1 * ppm + i * 0.9 * ppm;
      const on = asp === k;
      c.fillStyle = on ? col : '#2b2f31';
      c.beginPath(); c.arc(sx, ly, 0.32 * ppm, 0, Math.PI * 2); c.fill();
      if (on && !dim) {
        const g = c.createRadialGradient(sx, ly, 0, sx, ly, 2.2 * ppm);
        g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00');
        c.fillStyle = g; c.beginPath(); c.arc(sx, ly, 2.2 * ppm, 0, Math.PI * 2); c.fill();
      }
    });
    c.fillStyle = '#f4f1e8'; c.fillRect(sx - 0.55 * ppm, top + 0.4 * ppm, 1.1 * ppm, 0.7 * ppm);
    c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${Math.round(0.55 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText(id, sx, top + 0.76 * ppm);
  }

  function drawTrackside(V) {
    const { c, ppm, gy, X, wx0, wx1, st } = V;
    // rambu batas kecepatan
    for (const z of ROUTE.zones) {
      if (z.from > wx0 && z.from < wx1 && z.from > -60) {
        const sx = X(z.from);
        c.fillStyle = '#444'; c.fillRect(sx - 0.1 * ppm, gy - 3.2 * ppm, 0.2 * ppm, 2.4 * ppm);
        c.fillStyle = '#f2c230'; c.fillRect(sx - 0.8 * ppm, gy - 4.4 * ppm, 1.6 * ppm, 1.3 * ppm);
        c.strokeStyle = '#111'; c.lineWidth = 1; c.strokeRect(sx - 0.8 * ppm, gy - 4.4 * ppm, 1.6 * ppm, 1.3 * ppm);
        c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `900 ${Math.round(0.95 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText(String(z.limit / 10), sx, gy - 3.73 * ppm);
      }
      const ex = z.to + TRAIN_LEN;
      if (ex > wx0 && ex < wx1 && z.to < 2700) {
        const sx = X(ex);
        c.fillStyle = '#444'; c.fillRect(sx - 0.1 * ppm, gy - 3.2 * ppm, 0.2 * ppm, 2.4 * ppm);
        c.fillStyle = '#f4f1e8'; c.fillRect(sx - 0.7 * ppm, gy - 4.3 * ppm, 1.4 * ppm, 1.1 * ppm);
        c.strokeStyle = '#111'; c.lineWidth = Math.max(1, 0.18 * ppm);
        c.beginPath(); c.moveTo(sx - 0.6 * ppm, gy - 3.3 * ppm); c.lineTo(sx + 0.6 * ppm, gy - 4.2 * ppm); c.stroke();
      }
    }
    // sinyal
    for (const sig of ROUTE.signals) {
      if (sig.x < wx0 || sig.x > wx1) continue;
      signalHead(c, X(sig.x), gy, ppm, st.sig ? st.sig[sig.id] : 'R', sig.id, false);
    }
    // perlintasan sebidang
    const cr = ROUTE.crossing;
    if (cr.x > wx0 - 20 && cr.x < wx1 + 20) {
      const sx = X(cr.x);
      c.fillStyle = '#55524d';
      c.beginPath(); c.moveTo(sx - 2.2 * ppm, gy - 2.2 * ppm); c.lineTo(sx + 2.2 * ppm, gy - 2.2 * ppm); c.lineTo(sx + 5 * ppm, H); c.lineTo(sx - 5 * ppm, H); c.closePath(); c.fill();
      c.fillStyle = '#5f5b55'; c.fillRect(sx - 3 * ppm, gy - 0.1 * ppm, 6 * ppm, 1.2 * ppm);
      const near = st.x > cr.x - 320 && st.x - TRAIN_LEN < cr.x + 5;
      const blink = near && Math.floor(performance.now() / 400) % 2 === 0;
      // tiang lampu dan palang
      const postX = sx - 4.2 * ppm, postY = gy + 3 * ppm;
      c.fillStyle = '#ddd'; c.fillRect(postX - 0.12 * ppm, postY - 4 * ppm, 0.24 * ppm, 4 * ppm);
      c.fillStyle = blink ? '#ff4b3a' : '#5a2320'; c.beginPath(); c.arc(postX - 0.4 * ppm, postY - 3.3 * ppm, 0.3 * ppm, 0, 7); c.fill();
      c.fillStyle = !blink && near ? '#ff4b3a' : '#5a2320'; c.beginPath(); c.arc(postX + 0.4 * ppm, postY - 3.3 * ppm, 0.3 * ppm, 0, 7); c.fill();
      c.save(); c.translate(postX, postY - 2.2 * ppm); c.rotate(near ? 0 : -1.3);
      for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#f4f1e8' : '#d0392b'; c.fillRect(k * 1.2 * ppm, -0.15 * ppm, 1.2 * ppm, 0.3 * ppm); }
      c.restore();
      // motor menunggu
      if (near) {
        for (let k = 0; k < 2; k++) {
          const mx = sx - (1.4 - k * 2.6) * ppm, my = gy + (5 + k * 1.4) * ppm;
          c.fillStyle = '#222'; c.beginPath(); c.ellipse(mx, my, 0.35 * ppm, 0.55 * ppm, 0, 0, 7); c.fill();
          c.fillStyle = k ? '#2e86ab' : '#c0392b'; c.fillRect(mx - 0.5 * ppm, my - 1.6 * ppm, 1 * ppm, 1.1 * ppm);
          c.fillStyle = k ? '#e7e2d6' : '#f2c230'; c.beginPath(); c.arc(mx, my - 2 * ppm, 0.38 * ppm, 0, 7); c.fill();
        }
      }
    }
  }

  function drawGoat(V) {
    const { c, ppm, gy, X, st } = V;
    const g = ROUTE.goat;
    const gs = st.goat ? st.goat.state : 'idle';
    if (gs === 'gone') return;
    const t = gs === 'flee' ? st.goat.t : 0;
    const sx = X(g.x + t * 2.5), sy = gy - 0.2 * ppm + t * t * 2.2 * ppm;
    if (sx < -30 || sx > W + 30) return;
    c.save(); c.globalAlpha = clamp(1 - t / 2.2, 0, 1);
    c.fillStyle = '#ece6da';
    c.beginPath(); c.ellipse(sx, sy - 1.0 * ppm, 0.65 * ppm, 0.38 * ppm, 0, 0, 7); c.fill();
    c.fillRect(sx - 0.5 * ppm, sy - 0.8 * ppm, 0.12 * ppm, 0.8 * ppm); c.fillRect(sx + 0.38 * ppm, sy - 0.8 * ppm, 0.12 * ppm, 0.8 * ppm);
    c.beginPath(); c.ellipse(sx + 0.75 * ppm, sy - 1.45 * ppm, 0.26 * ppm, 0.2 * ppm, -0.4, 0, 7); c.fill();
    c.strokeStyle = '#6b5a45'; c.lineWidth = Math.max(1, 0.08 * ppm);
    c.beginPath(); c.moveTo(sx + 0.7 * ppm, sy - 1.6 * ppm); c.quadraticCurveTo(sx + 0.5 * ppm, sy - 2 * ppm, sx + 0.35 * ppm, sy - 1.8 * ppm); c.stroke();
    c.restore();
  }

  function wheel(c, x, y, r, ang, col) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = '#8b8f92'; c.lineWidth = Math.max(1, r * 0.12);
    c.beginPath(); c.arc(x, y, r * 0.85, 0, 7); c.stroke();
    c.lineWidth = Math.max(1, r * 0.08);
    for (let k = 0; k < 8; k++) {
      const a = ang + (k * Math.PI) / 4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85); c.stroke();
    }
    c.fillStyle = '#b9bdbf'; c.beginPath(); c.arc(x, y, r * 0.18, 0, 7); c.fill();
  }

  function drawTrain(V) {
    const { c, ppm, gy, X, st } = V;
    const fx = X(st.x);
    const L = (m) => fx - m * ppm; // m meter di belakang moncong
    // --- gerbong ---
    for (let k = 0; k < 2; k++) {
      const front = LOCO_LEN + GAP + k * (COACH_LEN + GAP);
      const x1 = L(front), x0 = L(front + COACH_LEN);
      if (x1 < -20 || x0 > W + 20) continue;
      const top = gy - 4.5 * ppm, bot = gy - 1.05 * ppm;
      // bogie
      [2.8, COACH_LEN - 2.8].forEach((bp) => {
        const bx = L(front + bp);
        c.fillStyle = '#222'; c.fillRect(bx - 1.6 * ppm, bot - 0.1 * ppm, 3.2 * ppm, 0.45 * ppm);
        wheel(c, bx - 1 * ppm, gy - 0.45 * ppm, 0.45 * ppm, st.x / 0.45, '#2a2d30');
        wheel(c, bx + 1 * ppm, gy - 0.45 * ppm, 0.45 * ppm, st.x / 0.45, '#2a2d30');
      });
      c.fillStyle = '#2e6b6a'; c.fillRect(x0, top, x1 - x0, bot - top);
      c.fillStyle = '#efe3c4'; c.fillRect(x0, top + 0.75 * ppm, x1 - x0, 1.25 * ppm);
      c.fillStyle = '#5d6567';
      c.beginPath(); c.moveTo(x0, top); c.quadraticCurveTo((x0 + x1) / 2, top - 0.9 * ppm, x1, top); c.closePath(); c.fill();
      // jendela
      const midDoor = (x0 + x1) / 2;
      for (let w = 0; w < 8; w++) {
        const wx = x0 + (1.0 + w * 2.1) * ppm;
        if (Math.abs(wx + 0.6 * ppm - midDoor) < 1.3 * ppm) continue;
        c.fillStyle = '#25333a'; c.fillRect(wx, top + 0.9 * ppm, 1.25 * ppm, 0.95 * ppm);
        if (hash(w + k * 9) * 30 < st.aboard) {
          c.fillStyle = '#c99a72'; c.beginPath(); c.arc(wx + 0.62 * ppm, top + 1.6 * ppm, 0.24 * ppm, 0, 7); c.fill();
        }
      }
      // pintu
      c.fillStyle = st.doors === 'open' ? '#121a1e' : '#245757';
      c.fillRect(midDoor - 0.6 * ppm, top + 0.6 * ppm, 1.2 * ppm, bot - top - 0.6 * ppm);
      if (st.doors !== 'open') { c.fillStyle = '#25333a'; c.fillRect(midDoor - 0.4 * ppm, top + 0.9 * ppm, 0.8 * ppm, 0.8 * ppm); }
      c.fillStyle = '#d9c99c'; c.font = `700 ${Math.round(0.5 * ppm)}px "Plus Jakarta Sans", sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(`K3 · SM-${k + 1}`, x0 + 1 * ppm, bot - 0.55 * ppm);
      c.fillStyle = '#1b1f22'; c.fillRect(x1, top + 0.6 * ppm, GAP * ppm, bot - top - 0.9 * ppm);
    }

    // --- lokomotif "Si Gagah" ---
    const frameY = gy - 1.6 * ppm;
    c.fillStyle = '#1b1d1f'; c.fillRect(L(14), frameY, 14 * ppm, 0.55 * ppm);
    // roda penggerak + batang
    const drivers = [10, 8, 6];
    const ang = st.x / 0.85;
    drivers.forEach((d) => wheel(c, L(d), gy - 0.85 * ppm, 0.85 * ppm, ang, '#7c1f1a'));
    wheel(c, L(3), gy - 0.5 * ppm, 0.5 * ppm, st.x / 0.5, '#7c1f1a');
    wheel(c, L(12.8), gy - 0.5 * ppm, 0.5 * ppm, st.x / 0.5, '#7c1f1a');
    const crank = (d) => [L(d) + Math.cos(ang) * 0.38 * ppm, gy - 0.85 * ppm + Math.sin(ang) * 0.38 * ppm];
    c.strokeStyle = '#c9ccce'; c.lineWidth = Math.max(2, 0.2 * ppm);
    c.beginPath(); const p0 = crank(10), p2 = crank(6); c.moveTo(p0[0], p0[1]); c.lineTo(p2[0], p2[1]); c.stroke();
    const cylX = L(3.2), cylY = gy - 1.25 * ppm;
    c.beginPath(); c.moveTo(p2[0], p2[1]); c.lineTo(cylX - 0.8 * ppm + Math.cos(ang) * 0.38 * ppm, cylY); c.stroke();
    c.fillStyle = '#2b2e31'; c.fillRect(cylX - 0.9 * ppm, cylY - 0.45 * ppm, 1.6 * ppm, 0.9 * ppm);
    // ketel
    const bTop = gy - 3.75 * ppm, bBot = frameY;
    c.fillStyle = '#202427';
    c.beginPath(); c.moveTo(L(11), bTop); c.lineTo(L(1.4), bTop); c.quadraticCurveTo(L(0.9), (bTop + bBot) / 2, L(1.4), bBot); c.lineTo(L(11), bBot); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(L(11), bTop + 0.25 * ppm, 9.6 * ppm, 0.35 * ppm);
    c.fillStyle = '#c9a24a';
    [9.5, 7, 4.5].forEach((b) => c.fillRect(L(b), bTop, 0.18 * ppm, bBot - bTop));
    // kotak asap & cerobong
    c.fillStyle = '#16181a'; c.fillRect(L(2.6), bTop - 0.05 * ppm, 1.4 * ppm, bBot - bTop + 0.05 * ppm);
    c.fillStyle = '#1a1c1e'; c.fillRect(L(2.95), bTop - 1.5 * ppm, 0.9 * ppm, 1.5 * ppm);
    c.fillRect(L(3.1), bTop - 1.75 * ppm, 1.2 * ppm, 0.3 * ppm);
    // dome & peluit
    c.fillStyle = '#c9a24a'; c.beginPath(); c.ellipse(L(6.4), bTop, 0.75 * ppm, 0.6 * ppm, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#d7b35a'; c.fillRect(L(9.6), bTop - 0.8 * ppm, 0.22 * ppm, 0.8 * ppm);
    // kabin
    const cabTop = gy - 4.9 * ppm;
    c.fillStyle = '#6e1d1a'; c.fillRect(L(14), cabTop, 3.2 * ppm, frameY - cabTop);
    c.fillStyle = '#1b1d1f'; c.fillRect(L(14.3), cabTop - 0.35 * ppm, 3.8 * ppm, 0.4 * ppm);
    c.fillStyle = '#f6d38a'; c.fillRect(L(13.3), cabTop + 0.6 * ppm, 1.6 * ppm, 1.2 * ppm);
    c.fillStyle = '#2a2622'; c.beginPath(); c.arc(L(12.5), cabTop + 1.35 * ppm, 0.35 * ppm, 0, 7); c.fill();
    c.fillStyle = '#c9a24a'; c.font = `800 ${Math.round(0.6 * ppm)}px "Big Shoulders Display", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('SI GAGAH', L(7.2), (bTop + bBot) / 2 + 0.1 * ppm);
    // balok penyangga & lampu
    c.fillStyle = '#c23b2e'; c.fillRect(L(0.4), frameY - 0.1 * ppm, 0.6 * ppm, 0.75 * ppm);
    c.fillStyle = '#4a4d50';
    c.beginPath(); c.moveTo(L(0.6), frameY + 0.6 * ppm); c.lineTo(fx + 0.5 * ppm, gy - 0.15 * ppm); c.lineTo(L(1.8), gy - 0.15 * ppm); c.closePath(); c.fill();
    c.fillStyle = '#f9e7a6'; c.fillRect(L(1.9), bTop - 0.7 * ppm, 0.7 * ppm, 0.6 * ppm);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }

  function drawSmoke(V) {
    const { c, ppm, gy, X, st, p } = V;
    for (const s of st.smoke || []) {
      const t = s.life / s.max;
      const a = s.a * (1 - t);
      if (a <= 0.01) continue;
      c.fillStyle = s.white ? `rgba(245,245,245,${a})` : `rgba(${Math.round(lerp(70, 110, p))},${Math.round(lerp(66, 108, p))},${Math.round(lerp(70, 112, p))},${a})`;
      c.beginPath(); c.arc(X(s.x), gy - s.y * ppm, s.r * ppm, 0, 7); c.fill();
    }
  }

  function drawBridgeTruss(V) {
    const { c, ppm, gy, X } = V;
    const b = ROUTE.bridge;
    const x0 = X(b.from + 4), x1 = X(b.to - 4);
    if (x1 < 0 || x0 > W) return;
    const top = gy - 6.5 * ppm, bot = gy + 0.1 * ppm;
    c.strokeStyle = '#4f5c66'; c.lineWidth = Math.max(2, 0.3 * ppm);
    c.beginPath(); c.moveTo(x0, bot); c.lineTo(x0 + 6 * ppm, top); c.lineTo(x1 - 6 * ppm, top); c.lineTo(x1, bot); c.stroke();
    c.lineWidth = Math.max(1, 0.16 * ppm);
    const span = (b.to - 4) - (b.from + 4);
    const n = Math.round(span / 7.25);
    for (let k = 1; k < n; k++) {
      const xa = X(b.from + 4 + k * (span / n));
      c.beginPath(); c.moveTo(xa, top); c.lineTo(xa, bot); c.stroke();
      const xb = X(b.from + 4 + (k + (k < n / 2 ? -1 : 1)) * (span / n));
      if (k > 1 && k < n - 1) { c.beginPath(); c.moveTo(xa, top); c.lineTo(xb, bot); c.stroke(); }
    }
  }

  function drawFrontProps(V) {
    const { c, ppm, gy, X, wx0, wx1, p } = V;
    // rumpun padi di latar depan
    const slot = 9;
    c.fillStyle = mix('#355a2a', '#4f7e36', p);
    for (let i = Math.floor(wx0 / slot); i < wx1 / slot; i++) {
      if (hash(i * 1.7) > 0.55) continue;
      const tx = i * slot + hash(i) * 6;
      if (inBridge(tx) || Math.abs(tx - ROUTE.crossing.x) < 8) continue;
      const sx = X(tx), sy = H - (0.06 + hash(i + 5) * 0.12) * (H - gy);
      for (let k = -2; k <= 2; k++) {
        c.beginPath(); c.moveTo(sx + k * 0.25 * ppm, sy);
        c.quadraticCurveTo(sx + k * 0.6 * ppm, sy - 1.2 * ppm, sx + k * 1.0 * ppm, sy - 1.8 * ppm);
        c.lineTo(sx + k * 0.25 * ppm + 2, sy); c.fill();
      }
    }
  }

  function drawFog(V) {
    const { c, ppm, gy, X, st, p } = V;
    const f = fogAt(st.x + 30);
    // kabut pagi tipis selalu ada di dekat cakrawala
    const base = 0.22 * (1 - p);
    if (base > 0.01) {
      const g = c.createLinearGradient(0, gy - 60, 0, gy + 20);
      g.addColorStop(0, 'rgba(235,225,215,0)'); g.addColorStop(1, `rgba(235,225,215,${base})`);
      c.fillStyle = g; c.fillRect(0, gy - 60, W, 80);
    }
    if (f > 0.01) {
      const fx = X(st.x);
      const g = c.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(214,222,224,${0.35 * f})`);
      g.addColorStop(clamp(fx / W, 0, 1), `rgba(214,222,224,${0.55 * f})`);
      g.addColorStop(1, `rgba(214,222,224,${0.95 * f})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // sorot lampu depan
      c.save(); c.globalCompositeOperation = 'lighter';
      const lx = X(st.x - 1.6), ly = gy - 4.4 * ppm;
      const lg = c.createRadialGradient(lx, ly, 0, lx, ly, 34 * ppm);
      lg.addColorStop(0, `rgba(255,236,170,${0.35 * f})`); lg.addColorStop(1, 'rgba(255,236,170,0)');
      c.fillStyle = lg;
      c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 34 * ppm, ly - 6 * ppm); c.lineTo(lx + 34 * ppm, ly + 5 * ppm); c.closePath(); c.fill();
      c.restore();
    }
  }

  // ---------- peta jalur (strip) ----------
  function renderStrip() {
    fitStrip();
    const c = sctx, w = SW, h = SH;
    if (!w || !h) return;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, w, h);
    const x0 = S.x - 60, x1 = S.x + 640;
    const M = (wx) => ((wx - x0) / (x1 - x0)) * w;
    const ly = Math.round(h * 0.6);
    const fog = fogAt(S.x + 30);
    const visible = (wx) => !(fog > 0.4 && wx - S.x > 220);
    c.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif';
    c.textBaseline = 'middle';
    // tanda jarak tiap 100 m
    c.fillStyle = 'rgba(239,233,218,0.35)';
    for (let d = 100; d <= 600; d += 100) { const sx = M(S.x + d); c.fillRect(sx, ly + 6, 1, 4); c.fillText(`${d}`, sx + 3, h - 6); }
    // zona batas
    for (const z of ROUTE.zones) {
      const a = Math.max(M(z.from), 0), b = Math.min(M(z.to + TRAIN_LEN), w);
      if (b <= 0 || a >= w) continue;
      c.fillStyle = z.limit <= 30 ? 'rgba(229,72,59,0.55)' : z.limit <= 40 ? 'rgba(242,165,22,0.45)' : 'rgba(239,233,218,0.25)';
      c.fillRect(a, ly - 15, b - a, 8);
      c.fillStyle = '#efe9da'; c.fillText(String(z.limit), a + 3, ly - 22);
    }
    if (S.yellowLimit) {
      const nxt = ROUTE.signals.find((s) => s.x > S.x);
      const b = nxt ? M(nxt.x) : w;
      c.fillStyle = 'rgba(255,196,43,0.5)'; c.fillRect(M(S.x), ly - 15, Math.max(0, b - M(S.x)), 8);
    }
    // rel
    c.fillStyle = 'rgba(239,233,218,0.5)'; c.fillRect(0, ly - 1, w, 2);
    // stasiun
    for (const s of ROUTE.stations) {
      const a = M(s.x - 95), b = M(s.x + 25);
      if (b < 0 || a > w) continue;
      c.fillStyle = 'rgba(46,107,106,0.9)'; c.fillRect(a, ly + 3, b - a, 7);
      c.fillStyle = '#f2c230'; c.fillRect(M(s.x) - 1, ly - 8, 3, 18);
      c.fillStyle = '#efe9da'; c.fillText(s.name, Math.max(2, a), ly + 17 > h - 2 ? h - 4 : ly + 17);
    }
    // perlintasan & kambing
    const cr = ROUTE.crossing;
    if (M(cr.x) > 0 && M(cr.x) < w) {
      const sx = M(cr.x); c.strokeStyle = '#efe9da'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(sx - 4, ly - 5); c.lineTo(sx + 4, ly + 5); c.moveTo(sx + 4, ly - 5); c.lineTo(sx - 4, ly + 5); c.stroke();
    }
    const gt = ROUTE.goat;
    if (S.goat.state === 'idle' && M(gt.x) > 0 && M(gt.x) < w) {
      if (visible(gt.x)) { c.fillStyle = '#ece6da'; c.beginPath(); c.arc(M(gt.x), ly, 4, 0, 7); c.fill(); c.fillText('kambing', M(gt.x) - 18, ly - 22); }
    }
    // sinyal
    for (const sig of ROUTE.signals) {
      const sx = M(sig.x);
      if (sx < 0 || sx > w) continue;
      c.fillStyle = '#16191b'; c.fillRect(sx - 1, ly - 2, 2, 8);
      if (visible(sig.x) || sig.x < S.x) {
        const asp = S.sig[sig.id];
        c.fillStyle = asp === 'R' ? '#ff4b3a' : asp === 'Y' ? '#ffc42b' : '#3bff8a';
        c.beginPath(); c.arc(sx, ly - 6, 5, 0, 7); c.fill();
        c.fillStyle = '#efe9da'; c.fillText(sig.id, sx + 7, ly - 6);
      } else {
        c.fillStyle = 'rgba(200,205,205,0.6)'; c.beginPath(); c.arc(sx, ly - 6, 5, 0, 7); c.fill();
        c.fillStyle = '#16191b'; c.fillText('?', sx - 3, ly - 6);
      }
    }
    // kereta
    const ta = M(S.x - TRAIN_LEN), tb = M(S.x);
    c.fillStyle = '#efe9da'; c.fillRect(ta, ly - 3, tb - ta, 6);
    c.beginPath(); c.moveTo(tb, ly - 6); c.lineTo(tb + 7, ly); c.lineTo(tb, ly + 6); c.closePath(); c.fill();
    // kabut menutupi pandangan jauh
    if (fog > 0.4) {
      const fx = M(S.x + 220);
      const g = c.createLinearGradient(fx, 0, fx + 30, 0);
      g.addColorStop(0, 'rgba(160,170,172,0)'); g.addColorStop(1, 'rgba(160,170,172,0.35)');
      c.fillStyle = g; c.fillRect(fx, 0, w - fx, h);
    }
  }

  // ---------- info untuk audio ----------
  function audioInfo() {
    const st = S || idleState;
    const scene = mode !== 'pause';
    const running = !!S && mode === 'play' && S.mode === 'play';
    const b = ROUTE.bridge, c = ROUTE.crossing;
    const onBridge = st.x > b.from && st.x - TRAIN_LEN < b.to;
    const river = clamp(1 - Math.abs(st.x - 25 - (b.from + b.to) / 2) / 240, 0, 1);
    let crowd = 0;
    ROUTE.stations.forEach((s, i) => {
      const prox = clamp(1 - Math.abs(st.x - 25 - (s.x - 40)) / 170, 0, 1);
      const people = (st.waiting ? st.waiting[i] : s.waiting) > 0 ? 1 : 0.35;
      crowd = Math.max(crowd, prox * people);
    });
    if (S && S.phase === 'dwell' && (S.dwell.step === 'board' || S.dwell.step === 'alight')) crowd = 1.3;
    const bell = st.x > c.x - 320 && st.x - TRAIN_LEN < c.x + 5 ? clamp(1 - Math.abs(c.x - st.x) / 320, 0.15, 1) : 0;
    return {
      scene, running, v: st.v, braking: st.aCmd < -0.3, onBridge, river, crowd, bell,
      fog: fogAt(st.x + 30), dawn: st.clock < 420,
    };
  }

  // ---------- loop ----------
  const idleState = (() => { const s = newState(); s.x = 30; s.notch = 0; return s; })();
  let last = performance.now();
  const PHYS_DT = 1 / 120;
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (mode === 'play' && S && (S.mode === 'play' || S.mode === 'fail')) {
      const speed = window.__rn ? window.__rn.speed : 1;
      acc += dt * speed;
      let guard = 0;
      while (acc >= PHYS_DT && guard++ < 2000) {
        if (S.mode === 'play') {
          if (window.__rn && window.__rn.ctrl) window.__rn.ctrl(S);
          step(PHYS_DT);
        } else {
          // tetap animasikan asap/guncangan saat gagal
          S.shake = Math.max(0, S.shake - PHYS_DT);
        }
        acc -= PHYS_DT;
      }
    } else {
      // latar menu: asap pelan dari lokomotif yang diam
      idleState.t += dt;
      if (Math.random() < 6 * dt) idleState.smoke.push(puff(idleState.x - 2.6, 5.4, false, 0));
      for (const pp of idleState.smoke) { pp.life += dt; pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.r += pp.grow * dt; }
      idleState.smoke = idleState.smoke.filter((pp) => pp.life < pp.max);
    }
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) ui.toast.className = ''; }
    if (W && H) render(dt);
    Sound.update(audioInfo());
    if (S && (mode === 'play' || mode === 'pause')) { updateHud(); renderStrip(); }
    requestAnimationFrame(frame);
  }

  // kait untuk pengujian otomatis (tidak dipakai saat bermain)
  window.__rn = {
    speed: 1, ctrl: null, ROUTE, TRAIN_LEN,
    get S() { return S; },
    get mode() { return mode; },
    setNotch: (n) => setNotch(n, false), horn, door, start: startMission,
  };

  resize();
  showScreen('title');
  idleState.sig = { S1: 'R', J1: 'Y', S2: 'R', B1: 'G', J2: 'G' };
  idleState.doors = 'open';
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { textCache.clear(); });
  requestAnimationFrame(frame);
})();
