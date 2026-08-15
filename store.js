/* ==========================================================
   Setl — storefront logic (index.html)
   Reads/writes only through SetlData (see data.js).
   ========================================================== */

let products = [];
let kits = [];
let cats = [];
let cart = {};
let activeCats = new Set();
let orderPlaced = false;

async function init(){
  products = await SetlData.getProducts();
  kits = await SetlData.getKits();
  cats = SetlData.getCategories();
  cart = await SetlData.getCart();
  renderStore();
  renderDrawer();
  document.getElementById('cart-open').onclick = openDrawer;
  document.getElementById('overlay').onclick = closeDrawer;
}

function fmt(n){ return '₹'+n.toLocaleString('en-IN'); }

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(()=>t.classList.remove('show'), 1800);
}

function cartCount(){ return Object.values(cart).reduce((a,b)=>a+b,0); }
function cartSubtotal(){
  return Object.entries(cart).reduce((sum,[id,qty])=>{
    const p = products.find(x=>x.id===id);
    return p ? sum + p.price*qty : sum;
  },0);
}
function cartSavings(){
  return Object.entries(cart).reduce((sum,[id,qty])=>{
    const p = products.find(x=>x.id===id);
    return p ? sum + (p.mrp-p.price)*qty : sum;
  },0);
}
function catFillCount(catId){
  return Object.keys(cart).filter(id=>{
    const p = products.find(x=>x.id===id);
    return p && p.cat===catId && cart[id]>0;
  }).length;
}
function roomProgress(){
  const filled = cats.filter(c=>catFillCount(c.id)>0).length;
  return Math.round((filled/cats.length)*100);
}

async function addToCart(id, qty=1){
  const p = products.find(x=>x.id===id);
  if(!p || p.status!=='active' || p.stock<=0) return;
  cart[id] = (cart[id]||0)+qty;
  await SetlData.saveCart(cart);
  renderStore(); renderDrawer();
  toast(p.name+' added');
}
async function removeFromCart(id){
  delete cart[id];
  await SetlData.saveCart(cart);
  renderStore(); renderDrawer();
}
async function addKit(kit){
  kit.items.forEach(id=>{ cart[id] = (cart[id]||0)+1; });
  await SetlData.saveCart(cart);
  renderStore(); renderDrawer();
  toast(kit.name+' added to cart');
  openDrawer();
}
function toggleCatFilter(id){
  if(activeCats.has(id)) activeCats.delete(id); else activeCats.add(id);
  renderStore();
}
function clearCatFilter(){ activeCats.clear(); renderStore(); }

function openDrawer(){
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  renderDrawer();
}
function closeDrawer(){
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}

function productCard(p){
  const inCart = cart[p.id]>0;
  const outOfStock = p.stock<=0;
  return `<div class="card">
    ${p.badge ? `<div class="badge">${p.badge}</div>` : (outOfStock ? `<div class="badge out">Out of stock</div>` : '')}
    <div class="card-img">${p.ic}</div>
    <div class="p-name">${p.name}</div>
    <div class="p-tip">${p.tip||''}</div>
    <div class="p-price-row"><span class="p-price">${fmt(p.price)}</span><span class="p-mrp">${fmt(p.mrp)}</span></div>
    <button class="add-btn ${inCart?'added':''}" ${outOfStock?'disabled':''} onclick="addToCart('${p.id}')">
      ${outOfStock ? 'Out of stock' : inCart ? '✓ Added — add another' : '+ Add'}
    </button>
  </div>`;
}

function renderStore(){
  const el = document.getElementById('view-store');
  const visible = products.filter(p=>p.status!=='hidden');
  const filtered = activeCats.size ? visible.filter(p=>activeCats.has(p.cat)) : visible;
  const pct = roomProgress();

  el.innerHTML = `
    <div class="hero">
      <div class="eyebrow">For IIIT Manipur freshers</div>
      <h1>Your room, ready<br>before you are.</h1>
      <p>Everything for hostel life, curated by seniors, delivered to your room before you land on campus.</p>
      <div class="hero-ctas">
        <button class="btn" onclick="document.getElementById('kits-section').scrollIntoView({behavior:'smooth'})">Build my starter kit</button>
        <button class="btn secondary" onclick="document.getElementById('room-section').scrollIntoView({behavior:'smooth'})">Explore essentials</button>
      </div>
    </div>

    <div class="room-section" id="room-section">
      <div class="room-head">
        <div>
          <h2>Build your room</h2>
          <div class="room-sub">Tap a category to see what you need — and what you've already got.</div>
        </div>
        <div class="ring-wrap">
          <span class="ring-label">Room setup</span>
          <span class="ring-pct">${pct}%</span>
        </div>
      </div>
      <div class="room-chips">
        ${cats.map(c=>{
          const n = catFillCount(c.id);
          const active = activeCats.has(c.id);
          return `<button class="room-chip ${n>0?'filled':''} ${active?'active':''}" onclick="toggleCatFilter('${c.id}')">
            <span class="ic">${c.ic}</span>
            <span class="name">${c.name}</span>
            <span class="count">${n>0?n+' added':'not started'}</span>
          </button>`;
        }).join('')}
      </div>
    </div>

    <div class="section" id="kits-section">
      <div class="section-head"><h2>Starter kits</h2></div>
      <div class="kits-row">
        ${kits.map(k=>`<div class="kit-card">
          <span class="ic">${k.ic}</span>
          <h3>${k.name}</h3>
          <div class="kit-desc">${k.desc}</div>
          <div class="kit-price-row"><span class="kit-price">${fmt(k.price)}</span><span class="kit-mrp">${fmt(k.mrp)}</span></div>
          <button class="btn block small" onclick='addKit(${JSON.stringify(k)})'>Add whole kit</button>
        </div>`).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2>Shop essentials</h2></div>
      <div class="filter-row">
        <button class="filter-chip ${activeCats.size===0?'active':''}" onclick="clearCatFilter()">All</button>
        ${cats.map(c=>`<button class="filter-chip ${activeCats.has(c.id)?'active':''}" onclick="toggleCatFilter('${c.id}')">${c.ic} ${c.name}</button>`).join('')}
      </div>
      <div class="grid">
        ${filtered.length ? filtered.map(productCard).join('') : `<div class="empty" style="grid-column:1/-1;">No essentials in this category yet — check back soon.</div>`}
      </div>
    </div>
  `;
  document.getElementById('cart-count').textContent = cartCount();
}

function renderDrawer(){
  const d = document.getElementById('drawer');
  const items = Object.entries(cart).map(([id,qty])=>({p:products.find(x=>x.id===id),qty})).filter(x=>x.p);
  const missing = cats.filter(c=>catFillCount(c.id)===0);
  const subtotal = cartSubtotal();
  const savings = cartSavings();

  if(orderPlaced){
    d.innerHTML = `
      <div class="drawer-head"><h3>Order confirmed 🎉</h3><button class="btn small secondary" onclick="closeDrawer()">Close</button></div>
      <div class="drawer-body">
        <p style="font-size:13px;color:var(--ink-soft);margin-top:0;">Delivery to your hostel room, tracked below. This is a demo tracker — no real order was placed or paid for.</p>
        <div class="tracker">
          <div class="t-step done"><div class="t-dot">✓</div><div class="t-label">Confirmed</div></div>
          <div class="t-step done"><div class="t-dot">✓</div><div class="t-label">Packing</div></div>
          <div class="t-step"><div class="t-dot">🚚</div><div class="t-label">Out for delivery</div></div>
          <div class="t-step"><div class="t-dot">🎉</div><div class="t-label">Delivered</div></div>
        </div>
        <button class="btn block" style="margin-top:14px;" onclick="resetOrder()">Start a new order</button>
      </div>
    `;
    return;
  }

  d.innerHTML = `
    <div class="drawer-head"><h3>Your setup</h3><button class="btn small secondary" onclick="closeDrawer()">Close</button></div>
    <div class="drawer-body">
      ${items.length ? items.map(({p,qty})=>`
        <div class="cart-line">
          <div class="ic">${p.ic}</div>
          <div class="meta"><div class="n">${p.name}</div><div class="p">${fmt(p.price)} × ${qty}</div></div>
          <button class="qty-x" onclick="removeFromCart('${p.id}')">✕</button>
        </div>
      `).join('') : `<div class="empty">Your cart is empty. Add a kit or a few essentials to get started.</div>`}
      ${items.length && missing.length ? `<div class="nudge">You're missing ${missing.length} common ${missing.length===1?'essential':'essentials'}: ${missing.map(c=>c.name.toLowerCase()).join(', ')}.</div>` : ''}
    </div>
    <div class="drawer-foot">
      ${items.length ? `
        <div class="sum-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        ${savings>0?`<div class="sum-row" style="color:var(--sage);"><span>You saved</span><span>${fmt(savings)}</span></div>`:''}
        <div class="sum-row total"><span>Total</span><span>${fmt(subtotal)}</span></div>
        <button class="btn block" style="margin-top:10px;" onclick="checkout()">Checkout (demo)</button>
      ` : `<button class="btn block secondary" disabled>Checkout</button>`}
    </div>
  `;
}

async function checkout(){
  // DEMO ONLY. Replace entirely with POST /api/checkout — see
  // setl-production-plan.md section 5 for the real Razorpay flow.
  await SetlData.placeMockOrder({
    id: 'demo-'+Date.now(),
    items: {...cart},
    total: cartSubtotal(),
    placedAt: new Date().toISOString(),
  });
  orderPlaced = true;
  renderDrawer();
}
function resetOrder(){
  orderPlaced = false;
  cart = {};
  SetlData.saveCart(cart);
  renderStore(); renderDrawer(); closeDrawer();
}

init();
