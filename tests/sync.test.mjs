import fs from 'node:fs';
const html = fs.readFileSync(process.argv[2] || new URL('../index.html', import.meta.url), 'utf8');
const grab = (a, b) => { const i = html.indexOf(a); const j = html.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker missing: ' + a); return html.slice(i, j); };
const consts = grab('    let saveCounter = 0;', '    let sb = null;');
const saveData = grab('    function saveData() {', '    const SUPABASE_URL');
const syncCode = grab('    // <sync-merge>', "    document.addEventListener('visibilitychange'");

function makeCloud() {
  const c = { row: null, tick: 0, hook: null, updates: 0 };
  const ts = () => new Date(Date.UTC(2026, 9, 22, 12, 0, 0, ++c.tick * 7)).toISOString().replace('Z', '+00:00');
  c.from = () => {
    const q = { op: null, filters: [], payload: null };
    const run = async () => {
      if (q.op === 'select') return { data: c.row ? { data: c.row.data, updated_at: c.row.updated_at } : null, error: null };
      if (q.op === 'update') {
        if (c.hook) { const h = c.hook; c.hook = null; h(); }
        const base = q.filters.find(f => f[0] === 'updated_at')[1];
        if (!c.row || c.row.updated_at !== base) return { data: [], error: null };
        c.row = { data: JSON.parse(JSON.stringify(q.payload.data)), updated_at: ts() }; c.updates++;
        return { data: [{ updated_at: c.row.updated_at }], error: null };
      }
      if (q.op === 'insert') {
        if (c.row) return { data: null, error: { code: '23505' } };
        c.row = { data: JSON.parse(JSON.stringify(q.payload.data)), updated_at: ts() }; c.updates++;
        return { data: [{ updated_at: c.row.updated_at }], error: null };
      }
    };
    const b = {
      select() { if (!q.op) q.op = 'select'; return b; },
      update(p) { q.op = 'update'; q.payload = p; return b; },
      insert(p) { q.op = 'insert'; q.payload = p; return b; },
      eq(k, v) { q.filters.push([k, v]); return b; },
      maybeSingle() { return run(); },
      then(res, rej) { return run().then(res, rej); },
    };
    return b;
  };
  return c;
}

function makeDevice(cloud, name) {
  const store = new Map();
  const ls = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const env = { confirmAnswer: true, toasts: [] };
  const body = `
    const STORAGE_KEY='K', LOCAL_UPDATED_KEY='LU', SYNCED_USER_KEY='SU';
    let appData = { piggies: [], activePiggyId: null, darkMode: false };
    ${consts}
    const scheduleCloudPush = () => {};
    let sb = { from: cloud.from }; let cloudUser = { id: 'u1' };
    const setSyncStatus = (m, s) => { env.status = m; };
    const renderApp = () => {}, renderAccountState = () => {}, showToast = (m) => env.toasts.push(m);
    const confirm = () => env.confirmAnswer;
    ${saveData}
    ${syncCode}
    return { get appData() { return appData; }, set appData(v) { appData = v; }, saveData, syncOnLogin, restoreSyncBackup };`;
  const dev = new Function('cloud', 'localStorage', 'env', 'document', 'window', body)(cloud, ls, env,
    { documentElement: { classList: { toggle() {}, add() {} } }, addEventListener() {} }, { addEventListener() {} });
  dev.ls = ls; dev.env = env; dev.name = name;
  return dev;
}

let fails = 0;
const ok = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) fails++; };
const pig = (id, ws = []) => ({ id, name: id, baselineWeight: 1000, weights: ws.map(i => ({ id: i, date: '2026-10-2' + i.length, weight: 990 })), stasisLogs: [] });
const wids = d => d.appData.piggies.flatMap(p => p.weights.map(w => w.id)).sort().join();
const cids = c => c.row.data.piggies.flatMap(p => p.weights.map(w => w.id)).sort().join();
const addW = (d, id) => { d.appData.piggies[0].weights.push({ id, date: '2026-10-22', weight: 980 }); d.saveData(); };

// 1-4: basic flows and concurrent edits
{
  const c = makeCloud(), A = makeDevice(c, 'A'), B = makeDevice(c, 'B');
  A.appData = { piggies: [pig('p1', ['w1'])], activePiggyId: 'p1' }; A.saveData(); await A.syncOnLogin();
  ok('1a first device uploads', c.row && cids(c) === 'w1' && A.ls.getItem('WHEEKLY_DIRTY') === null);
  await B.syncOnLogin();
  ok('1b empty device adopts cloud', wids(B) === 'w1' && B.ls.getItem('WHEEKLY_DIRTY') === null);

  addW(A, 'wOff');                                   // edit while "offline": no sync yet
  await A.syncOnLogin();                             // later reload: cloud unchanged, A dirty
  ok('2 offline edit pushed, not lost', cids(c) === 'w1,wOff' && wids(A) === 'w1,wOff');

  const before = c.updates; await B.syncOnLogin();
  ok('3 clean device adopts newer cloud without writing', wids(B) === 'w1,wOff' && c.updates === before);

  addW(A, 'wA'); addW(B, 'wB');
  await A.syncOnLogin();                             // A pushes first
  await B.syncOnLogin();                             // B is dirty and stale: must merge
  ok('4a stale dirty device merges instead of overwriting', cids(c) === 'w1,wA,wB,wOff');
  ok('4b merged device has everything and a backup exists', wids(B) === 'w1,wA,wB,wOff' && !!B.ls.getItem('WHEEKLY_PRE_SYNC_BACKUP'));
  await A.syncOnLogin();
  ok('4c other device converges', wids(A) === 'w1,wA,wB,wOff');
}
// 5: edit while a push is in flight
{
  const c = makeCloud(), A = makeDevice(c, 'A');
  A.appData = { piggies: [pig('p1', ['w1'])] }; A.saveData(); await A.syncOnLogin();
  addW(A, 'w2');
  c.hook = () => addW(A, 'w3');                      // lands during the update call
  await A.syncOnLogin();
  ok('5a mid-sync edit keeps the dirty flag', A.ls.getItem('WHEEKLY_DIRTY') !== null);
  await A.syncOnLogin();
  ok('5b mid-sync edit reaches the cloud', cids(c) === 'w1,w2,w3' && A.ls.getItem('WHEEKLY_DIRTY') === null);
}
// 6: cloud changes between our read and our write
{
  const c = makeCloud(), A = makeDevice(c, 'A'), B = makeDevice(c, 'B');
  A.appData = { piggies: [pig('p1', ['w1'])] }; A.saveData(); await A.syncOnLogin(); await B.syncOnLogin();
  addW(A, 'wA');
  c.hook = () => { const r = JSON.parse(JSON.stringify(c.row.data)); r.piggies[0].weights.push({ id: 'wX', date: '2026-10-25', weight: 960 }); c.row = { data: r, updated_at: '2026-10-22T13:00:00.000+00:00' }; };
  await A.syncOnLogin();
  ok('6 write race retried, third-party edit kept', ['w1', 'wA', 'wX'].every(id => cids(c).includes(id)));
}
// 7: older app version had no base recorded
{
  const c = makeCloud(), A = makeDevice(c, 'A');
  A.appData = { piggies: [pig('p1', ['w1'])] }; A.saveData(); await A.syncOnLogin();
  A.ls.removeItem('WHEEKLY_CLOUD_BASE'); A.ls.removeItem('WHEEKLY_DIRTY');
  await A.syncOnLogin();
  ok('7a unknown base + same data: quiet, base recorded', !A.ls.getItem('WHEEKLY_PRE_SYNC_BACKUP') && !!A.ls.getItem('WHEEKLY_CLOUD_BASE'));
  A.ls.removeItem('WHEEKLY_CLOUD_BASE'); A.appData.piggies[0].weights.push({ id: 'wL', date: '2026-10-26', weight: 950 });
  await A.syncOnLogin();
  ok('7b unknown base + different data: merged and pushed', cids(c) === 'w1,wL');
}
// 8: first link with data on both sides
{
  const c = makeCloud(), A = makeDevice(c, 'A'), B = makeDevice(c, 'B');
  A.appData = { piggies: [pig('p1', ['w1'])] }; A.saveData(); await A.syncOnLogin();
  B.appData = { piggies: [pig('p9', ['w9'])] }; B.saveData(); B.env.confirmAnswer = false;
  await B.syncOnLogin();
  ok('8a Cancel keeps device data and backs up the cloud copy', cids(c) === 'w9' && JSON.parse(B.ls.getItem('WHEEKLY_PRE_SYNC_BACKUP')).data.piggies[0].id === 'p1');
  const D = makeDevice(c, 'D'); D.appData = { piggies: [pig('p5', ['w5'])] }; D.saveData(); D.env.confirmAnswer = true;
  await D.syncOnLogin();
  ok('8b OK adopts cloud and backs up this device', wids(D) === 'w9' && JSON.parse(D.ls.getItem('WHEEKLY_PRE_SYNC_BACKUP')).data.piggies[0].id === 'p5');
}
console.log('FAILURES: ' + fails);
process.exit(fails ? 1 : 0);
