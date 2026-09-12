/* Monedas · educación financiera para chicos
   Estado: un "store" con varios chicos. Cada chico es un perfil completo
   (monedas, misiones, frascos, meta, historial y sus propios ajustes). */

const KEY = 'monedas:estado:v2';
const KEY_V1 = 'monedas:estado';

const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthLabel = d => new Date(d).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- ALMACENAMIENTO ----------
   En la app nativa usa Capacitor Preferences (no se borra al limpiar el navegador).
   En la web / PWA usa localStorage. */
const store = {
  async get(k) {
    const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
    if (P) { const r = await P.get({ key: k }); return r.value; }
    return localStorage.getItem(k);
  },
  async set(k, v) {
    const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
    if (P) { await P.set({ key: k, value: v }); return; }
    localStorage.setItem(k, v);
  }
};

/* ---------- DATOS POR DEFECTO ---------- */
const defaultTasks = () => ([
  { id: 't1', emoji: '🍽️', name: 'Poner la mesa', coins: 2 },
  { id: 't2', emoji: '🛒', name: 'Ayudar con las compras', coins: 3 },
  { id: 't3', emoji: '🌱', name: 'Regar las plantas', coins: 2 },
  { id: 't4', emoji: '🐶', name: 'Darle de comer a la mascota', coins: 2 },
  { id: 't5', emoji: '🧹', name: 'Barrer el patio', coins: 4 },
  { id: 't6', emoji: '🧺', name: 'Guardar la ropa limpia', coins: 3 },
]);

/* base: otro chico del que copiar los ajustes (valor de moneda, reparto, interés) */
const newKid = (name, avatar, base) => ({
  id: uid('k'),
  name: name || 'Campeón',
  avatar: avatar || '🦊',
  coinValue: base ? base.coinValue : 100,        // pesos por moneda
  split: base ? { ...base.split } : { ahorro: 50, inversion: 25, gustos: 25 },
  interest: base ? base.interest : 10,           // % mensual del "Banco de Papá y Mamá"
  tasks: base ? base.tasks.map(t => ({ ...t })) : defaultTasks(),
  log: [],                                       // {date, taskId, name, coins}
  jars: { ahorro: 0, inversion: 0, gustos: 0 },
  goal: { emoji: '🚲', name: 'Una bicicleta', price: 150000 },
  lifetimeCoins: 0,
  history: [],                                   // cierres de mes
  monthStart: todayStr(),
});

function defaults() {
  const k = newKid('Campeón', '🦊');
  return { version: 2, kids: [k], activeKid: k.id };
}

/* Estado viejo (un solo chico) -> nuevo formato */
function migrateV1(old) {
  const k = newKid(old.childName || 'Campeón', '🦊');
  Object.assign(k, {
    coinValue: old.coinValue ?? k.coinValue,
    split: old.split || k.split,
    interest: old.interest ?? k.interest,
    tasks: old.tasks || k.tasks,
    log: old.log || [],
    jars: old.jars || k.jars,
    goal: old.goal || k.goal,
    lifetimeCoins: old.lifetimeCoins || 0,
    history: old.history || [],
    monthStart: old.monthStart || todayStr(),
  });
  return { version: 2, kids: [k], activeKid: k.id };
}

let DB = null;      // todo el estado
let S = null;       // el chico activo (referencia dentro de DB)
let view = 'misiones', parentOpen = false, modal = null;

function syncS() {
  if (!DB.kids.length) DB.kids.push(newKid());
  S = DB.kids.find(k => k.id === DB.activeKid) || DB.kids[0];
  DB.activeKid = S.id;
}

async function load() {
  try {
    const raw = await store.get(KEY);
    if (raw) DB = { ...defaults(), ...JSON.parse(raw) };
    else {
      const old = await store.get(KEY_V1);
      DB = old ? migrateV1(JSON.parse(old)) : defaults();
    }
  } catch (e) { DB = defaults(); }
  syncS();
  render();
}

async function save() {
  try { await store.set(KEY, JSON.stringify(DB)); }
  catch (e) { console.error('No se pudo guardar', e); }
}

/* ---------- CÁLCULOS ---------- */
const monthCoins = () => S.log.reduce((a, l) => a + l.coins, 0);
const level = () => Math.floor(S.lifetimeCoins / 50) + 1;
const levelPct = () => (S.lifetimeCoins % 50) / 50 * 100;
const doneToday = id => S.log.filter(l => l.taskId === id && l.date === todayStr()).length;

function buzz() {
  const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
  if (H) { H.impact({ style: 'LIGHT' }).catch(() => {}); return; }
  if (navigator.vibrate) navigator.vibrate(15);
}

function earn(task, ev) {
  S.log.push({ date: todayStr(), taskId: task.id, name: task.name, coins: task.coins });
  S.lifetimeCoins += task.coins;
  save();
  buzz();
  const f = document.createElement('div'); f.className = 'fly'; f.textContent = '+' + task.coins + ' 🪙';
  f.style.left = (ev.clientX - 30) + 'px'; f.style.top = (ev.clientY - 20) + 'px'; document.body.appendChild(f);
  setTimeout(() => f.remove(), 1000);
  render();
  const bc = document.querySelector('.bigcoin'); if (bc) { bc.classList.remove('pop'); void bc.offsetWidth; bc.classList.add('pop'); }
}
function undo(i) { S.lifetimeCoins -= S.log[i].coins; S.log.splice(i, 1); save(); render(); }

function closeMonth() {
  const coins = monthCoins();
  const total = coins * S.coinValue;
  const a = total * S.split.ahorro / 100, inv = total * S.split.inversion / 100, g = total * S.split.gustos / 100;
  const interest = S.jars.inversion * S.interest / 100;
  S.jars.ahorro += a; S.jars.inversion += inv + interest; S.jars.gustos += g;
  S.history.unshift({ month: monthLabel(S.monthStart), coins, total, ahorro: a, inversion: inv, gustos: g, interest });
  S.log = []; S.monthStart = todayStr();
  save();
  modal = { type: 'celebrate', coins, total, a, inv, g, interest };
  render();
}
function spend(jar, amount) {
  amount = Math.min(amount, S.jars[jar]); if (!(amount > 0)) return;
  S.jars[jar] -= amount; save(); render();
}

/* ---------- CHICOS ---------- */
const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐵', '🐸', '🐧', '🦉', '🐝', '🦄', '🐙', '🐢', '🐨', '🐰', '🐻', '🐲', '🦕', '🐳', '🦖', '🐺', '🦔', '🐥', '🦋', '⭐'];

function pickKid(id) {
  if (id === DB.activeKid) return;
  DB.activeKid = id; syncS(); save(); modal = null; render(); window.scrollTo(0, 0);
}
function editKid(id) {
  const k = id ? DB.kids.find(x => x.id === id) : null;
  const used = DB.kids.map(x => x.avatar);
  modal = {
    type: 'kid', id,
    avatar: k ? k.avatar : (AVATARS.find(a => !used.includes(a)) || '⭐'),
    name: k ? k.name : ''
  };
  render();
  setTimeout(() => { const n = document.getElementById('kn'); if (n && !k) n.focus(); }, 50);
}
function pickAvatar(a) { modal.avatar = a; modal.name = document.getElementById('kn').value; render(); }
function saveKid() {
  const name = document.getElementById('kn').value.trim();
  if (!name) return;
  if (modal.id) {
    const k = DB.kids.find(x => x.id === modal.id);
    k.name = name; k.avatar = modal.avatar;
  } else {
    const k = newKid(name, modal.avatar, S);  // copia los ajustes del chico activo
    DB.kids.push(k); DB.activeKid = k.id; syncS();
  }
  modal = null; save(); render();
}
function deleteKid() {
  if (DB.kids.length <= 1) { modal = null; render(); return; }
  DB.kids = DB.kids.filter(x => x.id !== modal.id);
  syncS(); modal = null; save(); render();
}

/* ---------- RENDER ---------- */
function render() {
  const app = document.getElementById('app');
  const c = monthCoins();
  app.innerHTML = `
    <nav>
      <button class="${view === 'misiones' ? 'on' : ''}" onclick="go('misiones')"><span class="i">🎯</span>Misiones</button>
      <button class="${view === 'frascos' ? 'on' : ''}" onclick="go('frascos')"><span class="i">🫙</span>Frascos</button>
      <button class="${view === 'padres' ? 'on' : ''}" onclick="go('padres')"><span class="i">🔒</span>Papá y Mamá</button>
    </nav>
    ${DB.kids.length > 1 ? `<div class="kids">${DB.kids.map(k => `
      <button class="kidchip ${k.id === S.id ? 'on' : ''}" onclick="pickKid('${k.id}')">
        <span class="av">${k.avatar}</span>${esc(k.name)}</button>`).join('')}</div>` : ''}
    <div class="hero">
      <div class="hello">¡Hola, ${esc(S.name)}! Este mes juntaste</div>
      <div class="bigcoin"><div class="n">${c}</div><div class="l">${c === 1 ? 'moneda' : 'monedas'}</div></div>
      <div class="ars">Eso vale <b>${fmt(c * S.coinValue)}</b></div>
      <div class="level">
        <div class="row"><span>⭐ Nivel ${level()}</span><span>${S.lifetimeCoins % 50} / 50 al siguiente</span></div>
        <div class="bar"><i style="width:${levelPct()}%"></i></div>
      </div>
    </div>
    ${view === 'misiones' ? renderTasks() : view === 'frascos' ? renderJars() : renderParent()}
    ${modal ? renderModal() : ''}`;
}
function go(v) {
  if (v === 'padres' && !parentOpen) { modal = { type: 'gate', a: Math.floor(Math.random() * 7) + 3, b: Math.floor(Math.random() * 7) + 3 }; render(); return; }
  view = v; render(); window.scrollTo(0, 0);
}

function renderTasks() {
  return `<section><h2>Misiones de hoy <small>tocá una cuando la termines</small></h2>
    <div class="tasks">${S.tasks.map(t => `
      <button class="task" onclick="earn(S.tasks.find(x=>x.id==='${t.id}'),event)">
        ${doneToday(t.id) ? `<span class="today">✓ ${doneToday(t.id)}</span>` : ''}
        <div class="e">${t.emoji}</div><div class="t">${esc(t.name)}</div>
        <div class="c">🪙 ${t.coins}</div>
      </button>`).join('')}
    </div>
    ${S.log.length ? `<div class="card log"><h2 style="font-size:17px">Últimas monedas</h2>
      ${S.log.slice(-5).reverse().map(l => `<div class="item"><span>${esc(l.name)}</span><span>+${l.coins} 🪙</span></div>`).join('')}</div>` : ''}
  </section>`;
}

function renderJars() {
  const J = S.jars, max = Math.max(S.goal.price, J.ahorro, J.inversion, J.gustos, 1);
  const jar = (k, color, label) => `<div class="jar">
      <div class="glass"><div class="fill" style="height:${Math.min(100, J[k] / max * 100)}%;background:${color}"></div><div class="amt">${fmt(J[k])}</div></div>
      <div class="name">${label}</div><div class="pct">${S.split[k]}% de cada mes</div></div>`;
  const gp = Math.min(100, J.ahorro / S.goal.price * 100);
  return `<section><h2>Tus frascos</h2>
    <div class="jars">${jar('ahorro', 'var(--ahorro)', 'Ahorro')}${jar('inversion', 'var(--inversion)', 'Inversión')}${jar('gustos', 'var(--gustos)', 'Gustos')}</div>
    <div class="goal">
      <div class="row"><span>${S.goal.emoji} ${esc(S.goal.name)}</span><span>${Math.round(gp)}%</span></div>
      <div class="bar"><i style="width:${gp}%"></i></div>
      <p style="margin-top:8px;font-size:14px;color:var(--muted)">Te faltan ${fmt(Math.max(0, S.goal.price - J.ahorro))} de ${fmt(S.goal.price)}</p>
      ${gp >= 100 ? `<button class="btn green" onclick="modal={type:'buy'};render()">🎉 ¡Ya lo podés comprar!</button>` : ''}
    </div>
    <div class="card"><b>🏦 Banco de Papá y Mamá</b><p>Por cada mes que dejás la plata en el frasco de inversión, el banco te regala un ${S.interest}% más. Sin hacer nada. Así crece la plata.</p></div>
    <div class="card"><b>🍦 Frasco de gustos</b><p>Esta plata es para gastar en lo que quieras. Tenés ${fmt(J.gustos)}.</p>
      <button class="btn pink" ${J.gustos <= 0 ? 'disabled' : ''} onclick="modal={type:'spend',jar:'gustos'};render()">Usar plata de gustos</button></div>
  </section>`;
}

function renderParent() {
  const sum = S.split.ahorro + S.split.inversion + S.split.gustos;
  return `<section><h2>Panel de Papá y Mamá</h2>

    <div class="card tlist"><b>👦 Chicos</b><p>Tocá uno para cambiarle el nombre o el dibujito.</p>
      ${DB.kids.map(k => `<div class="item" style="gap:8px">
        <button style="flex:1;display:flex;align-items:center;gap:10px;text-align:left;font-size:16px;font-weight:${k.id === S.id ? 700 : 400}" onclick="pickKid('${k.id}')">
          <span style="font-size:26px">${k.avatar}</span><span>${esc(k.name)}${k.id === S.id ? ' <span style="color:var(--coin)">•</span>' : ''}</span></button>
        <button style="flex:0;color:var(--muted);padding:4px 8px" onclick="editKid('${k.id}')">✎</button>
      </div>`).join('')}
      <button class="btn ghost" onclick="editKid(null)">Agregar un chico</button>
    </div>

    <div class="card">
      <b>⚙️ Ajustes de ${esc(S.name)}</b>
      <div class="field"><label>Valor de cada moneda (pesos)</label><input type="number" inputmode="numeric" value="${S.coinValue}" onchange="S.coinValue=+this.value||0;save();render()"></div>
      <div class="field"><label>Reparto al cerrar el mes (%)</label>
        <div class="split">
          ${['ahorro', 'inversion', 'gustos'].map(k => `<div><input type="number" inputmode="numeric" value="${S.split[k]}" onchange="S.split.${k}=+this.value||0;save();render()"><div class="pct" style="font-size:13px;text-align:center;color:var(--muted);text-transform:capitalize">${k}</div></div>`).join('')}
        </div>${sum !== 100 ? `<div class="warn">La suma da ${sum}%. Tiene que dar 100.</div>` : ''}
      </div>
      <div class="field"><label>Interés mensual del Banco de Papá y Mamá (%)</label><input type="number" inputmode="numeric" value="${S.interest}" onchange="S.interest=+this.value||0;save();render()"></div>
    </div>

    <div class="card">
      <b>🎁 La meta de ahorro</b>
      <button class="item" style="display:flex;align-items:center;gap:12px;width:100%;background:rgba(255,255,255,.07);border-radius:12px;padding:10px;margin-top:10px;text-align:left" onclick="editGoal()">
        <span style="font-size:36px">${S.goal.emoji}</span><span style="flex:1;font-size:17px;font-weight:600">${esc(S.goal.name)}<br><span style="font-size:14px;font-weight:400;color:var(--muted)">${fmt(S.goal.price)}</span></span><span style="color:var(--muted)">✎</span>
      </button>
    </div>

    <div class="card tlist"><b>🎯 Misiones</b><p>Tocá una para cambiarla.</p>
      ${S.tasks.map(t => `<button class="item" onclick="editTask('${t.id}')"><span style="flex:0;font-size:22px">${t.emoji}</span><span style="text-align:left">${esc(t.name)}</span><span style="flex:0">🪙 ${t.coins}</span><span style="flex:0;color:var(--muted)">✎</span></button>`).join('')}
      <button class="btn ghost" onclick="editTask(null)">Agregar misión</button>
    </div>

    <div class="card log"><b>📋 Monedas de este mes (${monthCoins()} 🪙 · ${fmt(monthCoins() * S.coinValue)})</b>
      ${S.log.length ? S.log.map((l, i) => `<div class="item"><span>${l.date.slice(8)}/${l.date.slice(5, 7)} · ${esc(l.name)}</span><span>+${l.coins} <button class="x" title="Borrar" onclick="undo(${i})">×</button></span></div>`).reverse().join('') : '<p>Todavía no hay monedas este mes.</p>'}
      <button class="btn" ${monthCoins() === 0 || sum !== 100 ? 'disabled' : ''} onclick="modal={type:'confirmClose'};render()">Cerrar el mes y repartir</button>
      <p style="margin-top:8px">Mes empezado el ${new Date(S.monthStart).toLocaleDateString('es-AR')}. Al cerrar, las monedas se convierten a pesos, se reparten en los frascos y el banco paga el interés.</p>
    </div>

    <div class="card">
      <b>🫙 Ajustar frascos a mano</b><p>Por si pagaron algo o cargan plata de regalo.</p>
      <div class="split" style="margin-top:8px">${['ahorro', 'inversion', 'gustos'].map(k => `<input type="number" inputmode="numeric" value="${Math.round(S.jars[k])}" onchange="S.jars.${k}=+this.value||0;save();render()">`).join('')}</div>
    </div>

    ${S.history.length ? `<div class="card hist"><b>📅 Meses cerrados</b>
      ${S.history.map(h => `<div class="item"><span>${h.month}</span><span>${h.coins} 🪙 · ${fmt(h.total)}${h.interest ? ` · +${fmt(h.interest)} interés` : ''}</span></div>`).join('')}</div>` : ''}

    <button class="btn ghost" style="margin-top:16px" onclick="parentOpen=false;go('misiones')">Salir del panel</button>
    <button class="btn ghost" style="margin-top:8px;font-size:14px;opacity:.7" onclick="modal={type:'reset'};render()">Borrar todo y empezar de cero</button>
  </section>`;
}

const EMOJIS = ['🍽️', '🛒', '🌱', '🐶', '🐱', '🧹', '🧺', '🧸', '📚', '🎒', '🍳', '🥕', '🧽', '🛏️', '🚗', '🗑️', '👕', '🪴', '🐟', '🎨', '🎸', '⚽', '🚲', '🧩', '🪥', '💧', '🧦', '🧃', '🎁', '🌟', '🏆', '🚀'];
const GOAL_EMOJIS = ['🚲', '🛴', '⚽', '🏀', '🎮', '🧩', '🧸', '🪁', '🎨', '📚', '🎸', '🥁', '🎧', '📷', '⌚', '👟', '🎒', '🏊', '⛺', '🎡', '🎢', '🎬', '🍕', '🎂', '🐠', '🐹', '🚀', '🤖', '🦖', '🏰', '✈️', '🎁'];
function editGoal() { modal = { type: 'goal', emoji: S.goal.emoji, name: S.goal.name, price: S.goal.price }; render(); }
function pickGoalEmoji(e) { modal.emoji = e; modal.name = document.getElementById('gn').value; modal.price = +document.getElementById('gp').value; render(); }
function saveGoal() {
  const name = document.getElementById('gn').value.trim(), price = +document.getElementById('gp').value;
  if (!name || price <= 0) return;
  S.goal = { emoji: modal.emoji, name, price }; modal = null; save(); render();
}
function editTask(id) {
  const t = id ? S.tasks.find(x => x.id === id) : null;
  modal = { type: 'task', id, emoji: t ? t.emoji : '⭐', name: t ? t.name : '', coins: t ? t.coins : 2 }; render();
  setTimeout(() => { const n = document.getElementById('tn'); if (n && !t) n.focus(); }, 50);
}
function saveTask() {
  const name = document.getElementById('tn').value.trim(), coins = +document.getElementById('tc').value;
  if (!name || coins <= 0) return;
  if (modal.id) { const t = S.tasks.find(x => x.id === modal.id); t.emoji = modal.emoji; t.name = name; t.coins = coins; }
  else S.tasks.push({ id: uid('t'), emoji: modal.emoji, name, coins });
  modal = null; save(); render();
}
function deleteTask() { S.tasks = S.tasks.filter(x => x.id !== modal.id); modal = null; save(); render(); }
function pickEmoji(e) { modal.emoji = e; modal.name = document.getElementById('tn').value; modal.coins = +document.getElementById('tc').value; render(); }

function resetAll() { DB = defaults(); syncS(); modal = null; parentOpen = false; view = 'misiones'; save(); render(); }

function renderModal() {
  const m = modal;
  if (m.type === 'gate') return `<div class="overlay"><div class="modal"><h3>🔒 Solo para grandes</h3><p>¿Cuánto es ${m.a} × ${m.b}?</p>
    <input id="gate" type="number" inputmode="numeric" autofocus onkeydown="if(event.key==='Enter')checkGate()">
    <button class="btn" onclick="checkGate()">Entrar</button><button class="btn ghost" onclick="modal=null;render()">Volver</button></div></div>`;
  if (m.type === 'confirmClose') { const c = monthCoins(), t = c * S.coinValue; return `<div class="overlay"><div class="modal"><h3>Cerrar ${monthLabel(S.monthStart)}</h3>
    <p>${esc(S.name)} · ${c} monedas = <b>${fmt(t)}</b><br>🟩 Ahorro ${fmt(t * S.split.ahorro / 100)}<br>🟦 Inversión ${fmt(t * S.split.inversion / 100)} + interés ${fmt(S.jars.inversion * S.interest / 100)}<br>🟪 Gustos ${fmt(t * S.split.gustos / 100)}</p>
    <button class="btn" onclick="modal=null;closeMonth()">Sí, repartir</button><button class="btn ghost" onclick="modal=null;render()">Todavía no</button></div></div>`; }
  if (m.type === 'celebrate') return `<div class="overlay"><div class="modal"><div class="celebrate">🎉</div><h3>¡${m.coins} monedas!</h3>
    <p>Este mes ganaste <b>${fmt(m.total)}</b>.<br>Ahorro +${fmt(m.a)}<br>Inversión +${fmt(m.inv)}${m.interest ? ` y el banco te regaló <b>${fmt(m.interest)}</b>` : ''}<br>Gustos +${fmt(m.g)}</p>
    <button class="btn" onclick="modal=null;parentOpen=false;go('frascos')">Ver mis frascos</button></div></div>`;
  if (m.type === 'spend') return `<div class="overlay"><div class="modal"><h3>🍦 ¿Cuánto vas a usar?</h3><p>Tenés ${fmt(S.jars[m.jar])}</p>
    <input id="sp" type="number" inputmode="numeric" placeholder="Pesos"><button class="btn pink" onclick="spend('${m.jar}',+document.getElementById('sp').value);modal=null;render()">Usar</button>
    <button class="btn ghost" onclick="modal=null;render()">Mejor no</button></div></div>`;
  if (m.type === 'buy') return `<div class="overlay"><div class="modal"><div class="celebrate">${S.goal.emoji}</div><h3>¡Lo lograste!</h3><p>Ahorraste ${fmt(S.goal.price)} para ${esc(S.goal.name)}. Cuando lo compren, tocá el botón y elegí la próxima meta con Papá y Mamá.</p>
    <button class="btn green" onclick="spend('ahorro',S.goal.price);modal=null;render()">¡Ya lo compramos!</button><button class="btn ghost" onclick="modal=null;render()">Seguir ahorrando</button></div></div>`;
  if (m.type === 'kid') return `<div class="overlay"><div class="modal" style="text-align:left"><h3 style="text-align:center">${m.id ? 'Cambiar chico' : 'Nuevo chico'}</h3>
    <div class="egrid">${AVATARS.map(a => `<button class="eb ${a === m.avatar ? 'on' : ''}" onclick="pickAvatar('${a}')">${a}</button>`).join('')}</div>
    <div class="field" style="display:grid;grid-template-columns:56px 1fr;gap:8px;align-items:center">
      <div style="font-size:36px;text-align:center">${m.avatar}</div>
      <input id="kn" placeholder="¿Cómo se llama?" value="${esc(m.name)}" style="margin:0;text-align:left;font-size:18px">
    </div>
    ${!m.id ? `<p style="font-size:14px;margin-top:10px;color:#6B6288">Arranca con las mismas misiones y ajustes que ${esc(S.name)}, pero con sus propias monedas y frascos.</p>` : ''}
    <button class="btn" onclick="saveKid()">${m.id ? 'Guardar cambios' : 'Agregar chico'}</button>
    ${m.id && DB.kids.length > 1 ? `<button class="btn ghost" style="color:#B3261E" onclick="modal={type:'delKid',id:'${m.id}'};render()">Borrar este chico</button>` : ''}
    <button class="btn ghost" onclick="modal=null;render()">Cancelar</button></div></div>`;
  if (m.type === 'delKid') { const k = DB.kids.find(x => x.id === m.id) || {}; return `<div class="overlay"><div class="modal"><h3>¿Borrar a ${esc(k.name || '')}?</h3>
    <p>Se pierden sus monedas, sus frascos y su historial. No se puede deshacer.</p>
    <button class="btn pink" onclick="deleteKid()">Sí, borrarlo</button><button class="btn ghost" onclick="modal=null;render()">Cancelar</button></div></div>`; }
  if (m.type === 'task') return `<div class="overlay"><div class="modal" style="text-align:left"><h3 style="text-align:center">${m.id ? 'Cambiar misión' : 'Nueva misión'}</h3>
    <div class="egrid">${EMOJIS.map(e => `<button class="eb ${e === m.emoji ? 'on' : ''}" onclick="pickEmoji('${e}')">${e}</button>`).join('')}</div>
    <div class="field" style="display:grid;grid-template-columns:56px 1fr;gap:8px;align-items:center">
      <div style="font-size:36px;text-align:center">${m.emoji}</div>
      <input id="tn" placeholder="¿Qué hay que hacer?" value="${esc(m.name)}" style="margin:0;text-align:left;font-size:18px">
    </div>
    <div class="field" style="display:flex;align-items:center;gap:10px"><label style="margin:0;flex:1">Monedas que vale</label><input id="tc" type="number" inputmode="numeric" min="1" value="${m.coins}" style="width:90px;margin:0;font-size:22px"></div>
    <button class="btn" onclick="saveTask()">${m.id ? 'Guardar cambios' : 'Agregar misión'}</button>
    ${m.id ? `<button class="btn ghost" style="color:#B3261E" onclick="deleteTask()">Borrar esta misión</button>` : ''}
    <button class="btn ghost" onclick="modal=null;render()">Cancelar</button></div></div>`;
  if (m.type === 'goal') return `<div class="overlay"><div class="modal" style="text-align:left"><h3 style="text-align:center">La meta de ahorro</h3>
    <div class="egrid">${GOAL_EMOJIS.map(e => `<button class="eb ${e === m.emoji ? 'on' : ''}" onclick="pickGoalEmoji('${e}')">${e}</button>`).join('')}</div>
    <div class="field" style="display:grid;grid-template-columns:56px 1fr;gap:8px;align-items:center">
      <div style="font-size:36px;text-align:center">${m.emoji}</div>
      <input id="gn" placeholder="¿Qué quiere comprar?" value="${esc(m.name)}" style="margin:0;text-align:left;font-size:18px">
    </div>
    <div class="field" style="display:flex;align-items:center;gap:10px"><label style="margin:0;flex:1">Precio en pesos</label><input id="gp" type="number" inputmode="numeric" min="1" value="${m.price}" style="width:140px;margin:0;font-size:20px"></div>
    <button class="btn green" onclick="saveGoal()">Guardar meta</button>
    <button class="btn ghost" onclick="modal=null;render()">Cancelar</button></div></div>`;
  if (m.type === 'reset') return `<div class="overlay"><div class="modal"><h3>¿Borrar todo?</h3><p>Se pierden los chicos, las monedas, los frascos y el historial. No se puede deshacer.</p>
    <button class="btn pink" onclick="resetAll()">Sí, borrar todo</button><button class="btn ghost" onclick="modal=null;render()">Cancelar</button></div></div>`;
  return '';
}
function checkGate() {
  const v = +document.getElementById('gate').value;
  if (v === modal.a * modal.b) { parentOpen = true; modal = null; view = 'padres'; render(); window.scrollTo(0, 0); }
  else { modal.a = Math.floor(Math.random() * 7) + 3; modal.b = Math.floor(Math.random() * 7) + 3; render(); }
}

/* PWA: solo en el navegador. En la app nativa no hace falta. */
if ('serviceWorker' in navigator && !window.Capacitor && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

load();
