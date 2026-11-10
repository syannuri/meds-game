// Uji asap Rel Nusantara: menjalankan semua misi di tampilan luar & kokpit pada beberapa titik lintasan,
// lalu melaporkan galat halaman, layar kosong, dan waktu gambar per frame.
// Pakai: node tests/smoke.js [--misi 3-1,1-1] [--profil] [--batas-ms 0]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1] === undefined || process.argv[i + 1].startsWith('--') ? true : process.argv[i + 1]; };
const ROOT = path.join(__dirname, '..', 'www');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const server = http.createServer((q, r) => {
  const p = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')));
  if (!p.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
  fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(b); });
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const only = arg('--misi', null), profil = !!arg('--profil', false), batas = +arg('--batas-ms', 0);
  const fails = [], rows = [], prof = {};
  let ids = null;
  for (const view of ['side', 'cab']) {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.addInitScript((v) => { try { localStorage.setItem('rn.lang', 'id'); localStorage.setItem('rn.tutSkip', '1'); localStorage.setItem('rn.view', v); } catch (e) {} }, view);
    await page.goto(url); await page.waitForFunction(() => window.__rn && window.__rn.mode === 'title', null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    if (!ids) { ids = await page.evaluate(() => [...document.querySelectorAll('.ticket[data-id]')].map((t) => t.dataset.id)); if (only && only !== true) ids = ids.filter((i) => only.split(',').includes(i)); }
    if (!ids.length) fails.push('tidak ada misi di menu');
    const cdp = profil ? await page.context().newCDPSession(page) : null;
    if (cdp) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); }
    for (const id of ids) {
      const before = errs.length;
      await page.evaluate((id) => { __rn.select(id); __rn.start(); }, id); await page.waitForTimeout(500);
      const len = await page.evaluate(() => { const st = __rn.ROUTE.stations; return st[st.length - 1].x; });
      let worst = 0, sum = 0, n = 0;
      if (cdp) await cdp.send('Profiler.start');
      for (const f of [0.03, 0.2, 0.4, 0.6, 0.8, 0.97]) {
        await page.evaluate(([x]) => { const S = __rn.S, P = __rn.perf; S.doors = 'closed'; S.phase = 'run'; S.sig = {}; S.t = 100; S.panto = 'up'; S.x = x; S.v = Math.min(__rn.ROUTE.lineSpeed, 120) / 3.6; __rn.setNotch(0); P.ms = 0; P.max = 0; P.n = 0; }, [len * f]);
        await page.waitForFunction(() => __rn.perf.n >= 12, null, { timeout: 20000 }).catch(() => fails.push(`${id} ${view} @${f}: gambar tidak berjalan`));
        const r = await page.evaluate(() => { const P = __rn.perf, cv = document.getElementById('world'), g = cv.getContext('2d'), w = cv.width, h = cv.height; let lit = 0;
          for (let i = 0; i < 24; i++) { const d = g.getImageData((w * (0.1 + 0.8 * (i % 6) / 5)) | 0, (h * (0.1 + 0.6 * ((i / 6) | 0) / 3)) | 0, 1, 1).data; if (d[3] > 0 && d[0] + d[1] + d[2] > 24) lit++; }
          return { ms: P.ms, max: P.max, lit, mode: __rn.mode }; });
        if (r.lit < 4 && view === 'side') fails.push(`${id} ${view} @${f}: layar hampir kosong`);
        worst = Math.max(worst, r.max); sum += r.ms; n++;
      }
      if (cdp) { const { profile } = await cdp.send('Profiler.stop'); const dts = profile.timeDeltas || []; const self = {}; profile.samples.forEach((sid, i) => { self[sid] = (self[sid] || 0) + (dts[i] || 0); }); for (const nd of profile.nodes) { const nm = nd.callFrame.functionName || '(anonim)'; if (/game\.js/.test(nd.callFrame.url || '') || nm.startsWith('(')) prof[`${view} ${nm}`] = (prof[`${view} ${nm}`] || 0) + (self[nd.id] || 0) / 1000; } }
      for (const m of errs.slice(before)) fails.push(`${id} ${view}: ${m}`);
      const avg = sum / n; rows.push([id, view, avg.toFixed(1), worst.toFixed(1)]);
      if (batas && avg > batas) fails.push(`${id} ${view}: rata-rata ${avg.toFixed(1)} ms > batas ${batas} ms`);
      await page.evaluate(() => { const b = document.getElementById('btnPause'); if (b) b.click(); }); await page.goto(url); await page.waitForFunction(() => window.__rn && window.__rn.mode === 'title', null, { timeout: 20000 }); await page.waitForTimeout(600);
    }
    await page.close();
  }
  await browser.close(); server.close();
  console.log('misi  tampilan  rata2-ms  puncak-ms'); for (const r of rows) console.log(r[0].padEnd(5), r[1].padEnd(9), r[2].padStart(8), r[3].padStart(10));
  if (profil) { console.log('\nfungsi paling berat (ms waktu sendiri):'); for (const view of ['side', 'cab']) Object.entries(prof).filter(([k]) => k.startsWith(view + ' ')).sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log(k.padEnd(34), v.toFixed(0))); }
  if (fails.length) { console.error(`\nGAGAL (${fails.length}):`); fails.forEach((f) => console.error(' - ' + f)); process.exit(1); }
  console.log(`\nLULUS: ${rows.length} kombinasi misi × tampilan tanpa galat.`);
})().catch((e) => { console.error(e); process.exit(1); });
