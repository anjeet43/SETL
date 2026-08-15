/* ==========================================================
   Setl — store manager logic (admin.html)
   Reads/writes only through SetlData (see data.js).
   In production this page must sit behind real auth + a
   store_admin/super_admin role check — see setl-schema.sql
   and setl-production-plan.md section 33. Right now there is
   no login at all, which is fine for a local prototype and
   not fine for anything real.
   ========================================================== */

let products = [];
let cats = [];

async function init(){
  products = await SetlData.getProducts();
  cats = SetlData.getCategories();
  renderAdmin();
}

function fmt(n){ return '₹'+n.toLocaleString('en-IN'); }

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(()=>t.classList.remove('show'), 1800);
}

function statusFor(p){
  if(p.status==='hidden') return {cls:'', label:'Hidden'};
  if(p.stock<=0) return {cls:'out', label:'Out of stock'};
  if(p.stock<6) return {cls:'low', label:'Low stock'};
  return {cls:'active', label:'Active'};
}

function renderAdmin(){
  const el = document.getElementById('view-admin');
  const active = products.filter(p=>p.status==='active').length;
  const low = products.filter(p=>p.status==='active' && p.stock>0 && p.stock<6).length;
  const out = products.filter(p=>p.stock<=0).length;

  el.innerHTML = `
    <div class="admin-wrap">
      <div class="admin-head">
        <h2>Store manager</h2>
        <div class="room-sub" style="margin-top:6px;">Add a product here — it appears on the storefront immediately.</div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Total products</div><div class="val">${products.length}</div></div>
        <div class="stat-card"><div class="label">Active</div><div class="val">${active}</div></div>
        <div class="stat-card ${low?'warn':''}"><div class="label">Low stock</div><div class="val">${low}</div></div>
        <div class="stat-card ${out?'warn':''}"><div class="label">Out of stock</div><div class="val">${out}</div></div>
      </div>
      <div class="admin-grid">
        <div class="panel">
          <h3>+ Add product</h3>
          <div class="field">
            <label for="f-name">Product name</label>
            <input id="f-name" placeholder="Extension board">
            <div class="err" id="err-name" style="display:none;"></div>
          </div>
          <div class="field">
            <label for="f-icon">Icon</label>
            <input id="f-icon" placeholder="🔌" maxlength="2">
          </div>
          <div class="field">
            <label for="f-cat">Category</label>
            <select id="f-cat">${cats.map(c=>`<option value="${c.id}">${c.ic} ${c.name}</option>`).join('')}</select>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="f-price">Price (₹)</label>
              <input id="f-price" type="number" placeholder="399">
            </div>
            <div class="field">
              <label for="f-mrp">MRP (₹)</label>
              <input id="f-mrp" type="number" placeholder="499">
            </div>
          </div>
          <div class="field">
            <label for="f-stock">Stock</label>
            <input id="f-stock" type="number" placeholder="20">
          </div>
          <div class="err" id="err-general" style="display:none;"></div>
          <button class="btn block" onclick="publishProduct()">Publish product</button>
        </div>
        <div class="panel">
          <h3>Products (${products.length})</h3>
          <table class="table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${products.map(p=>{
                const s = statusFor(p);
                return `<tr class="${p.status==='hidden'?'tag-hidden':''}">
                  <td class="pname"><span class="mini-ic">${p.ic}</span>${p.name}</td>
                  <td>${cats.find(c=>c.id===p.cat)?.name||p.cat}</td>
                  <td>${fmt(p.price)}</td>
                  <td>${p.stock}</td>
                  <td><span class="status-pill ${s.cls}">${s.label}</span></td>
                  <td class="row-actions">
                    <button onclick="toggleHidden('${p.id}')">${p.status==='hidden'?'Show':'Hide'}</button>
                    <button class="danger" onclick="deleteProduct('${p.id}')">Delete</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function clearErrors(){
  ['err-name','err-general'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.style.display='none'; e.textContent=''; }
  });
}

async function publishProduct(){
  clearErrors();
  const name = document.getElementById('f-name').value.trim();
  const icon = document.getElementById('f-icon').value.trim() || '📦';
  const cat = document.getElementById('f-cat').value;
  const price = parseFloat(document.getElementById('f-price').value);
  const mrp = parseFloat(document.getElementById('f-mrp').value);
  const stock = parseInt(document.getElementById('f-stock').value);

  let hasError = false;
  if(!name){
    const e = document.getElementById('err-name');
    e.textContent = 'Enter a product name first.'; e.style.display='block';
    hasError = true;
  }
  if(isNaN(price) || price<=0 || isNaN(stock) || stock<0){
    const e = document.getElementById('err-general');
    e.textContent = 'Enter a valid price and stock.'; e.style.display='block';
    hasError = true;
  }
  if(hasError) return;

  const id = 'p'+Date.now();
  products.push({
    id, name, cat, price, mrp: isNaN(mrp)||mrp<price ? price : mrp,
    stock, ic: icon, badge:'', tip:'', status:'active'
  });
  await SetlData.saveProducts(products);
  ['f-name','f-icon','f-price','f-mrp','f-stock'].forEach(id=>document.getElementById(id).value='');
  renderAdmin();
  toast(name+' published to store');
}

async function toggleHidden(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  p.status = p.status==='hidden' ? 'active' : 'hidden';
  await SetlData.saveProducts(products);
  renderAdmin();
}
async function deleteProduct(id){
  products = products.filter(x=>x.id!==id);
  await SetlData.saveProducts(products);
  renderAdmin();
  toast('Product deleted');
}

init();
