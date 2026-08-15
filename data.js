/* ==========================================================
   Setl — data layer
   Everything in this file is the seam between "fake data in the
   browser" and "real data from a backend". Right now it reads and
   writes localStorage. To go live, replace the body of each
   function below with a fetch() call to your API — nothing in
   store.js or admin.js needs to change, because they only ever
   call these functions, never touch storage directly.
   ========================================================== */

const CATS = [
  {id:'sleep', name:'Sleep', ic:'🛏️'},
  {id:'study', name:'Study', ic:'📚'},
  {id:'power', name:'Power', ic:'🔌'},
  {id:'care', name:'Care', ic:'🧼'},
  {id:'carry', name:'Carry', ic:'🎒'},
  {id:'organize', name:'Organize', ic:'🧺'},
];

const SEED_PRODUCTS = [
  {id:'p1',name:'Double bedsheet set',cat:'sleep',price:449,mrp:599,stock:40,ic:'🛏️',badge:'Freshers\' favorite',tip:'Fits standard IIITM hostel cots.',status:'active'},
  {id:'p2',name:'Pillow with cover',cat:'sleep',price:299,mrp:399,stock:35,ic:'🪶',badge:'',tip:'',status:'active'},
  {id:'p3',name:'Single blanket',cat:'sleep',price:399,mrp:549,stock:22,ic:'🧣',badge:'',tip:'Manipur nights get cold — pack one.',status:'active'},
  {id:'p4',name:'A4 ruled notebooks (5)',cat:'study',price:199,mrp:249,stock:60,ic:'📓',badge:'',tip:'',status:'active'},
  {id:'p5',name:'Desk lamp, USB',cat:'study',price:349,mrp:449,stock:18,ic:'💡',badge:'Recommended by seniors',tip:'Hostel ceiling lights are dim after 10pm.',status:'active'},
  {id:'p6',name:'Scientific calculator',cat:'study',price:599,mrp:699,stock:12,ic:'🧮',badge:'',tip:'',status:'active'},
  {id:'p7',name:'6-socket extension board',cat:'power',price:399,mrp:499,stock:4,ic:'🔌',badge:'Don\'t skip this',tip:'Every senior mentions this first.',status:'active'},
  {id:'p8',name:'20000mAh power bank',cat:'power',price:899,mrp:1199,stock:15,ic:'🔋',badge:'',tip:'',status:'active'},
  {id:'p9',name:'USB-C cable, 1.5m',cat:'power',price:149,mrp:199,stock:50,ic:'🔗',badge:'',tip:'',status:'active'},
  {id:'p10',name:'Bathroom bucket + mug',cat:'care',price:249,mrp:329,stock:30,ic:'🪣',badge:'',tip:'',status:'active'},
  {id:'p11',name:'Toiletries starter pack',cat:'care',price:329,mrp:429,stock:25,ic:'🧴',badge:'90% of freshers buy this',tip:'Soap, toothpaste, sanitizer, tissues.',status:'active'},
  {id:'p12',name:'Padlock, 2 keys',cat:'care',price:179,mrp:229,stock:0,ic:'🔒',badge:'',tip:'',status:'active'},
  {id:'p13',name:'Laundry bag',cat:'carry',price:199,mrp:249,stock:20,ic:'🧺',badge:'Surprisingly useful',tip:'',status:'active'},
  {id:'p14',name:'Steel water bottle',cat:'carry',price:249,mrp:329,stock:28,ic:'🥤',badge:'',tip:'',status:'active'},
  {id:'p15',name:'Compact umbrella',cat:'carry',price:299,mrp:399,stock:16,ic:'☂️',badge:'Rain ready',tip:'Imphal monsoons arrive fast.',status:'active'},
  {id:'p16',name:'Wall hooks + hangers (6)',cat:'organize',price:149,mrp:199,stock:33,ic:'🪝',badge:'',tip:'',status:'active'},
  {id:'p17',name:'Fabric storage box',cat:'organize',price:299,mrp:379,stock:19,ic:'📦',badge:'',tip:'',status:'active'},
];

const SEED_KITS = [
  {id:'k1',name:'Hostel starter kit',ic:'🛏️',price:999,mrp:1349,items:['p1','p2','p3','p10'],desc:'Bedsheet, pillow, blanket, bucket + mug.'},
  {id:'k2',name:'Study setup kit',ic:'📚',price:699,mrp:899,items:['p4','p5','p6'],desc:'Notebooks, desk lamp, calculator.'},
  {id:'k3',name:'Complete fresher kit',ic:'🎓',price:2499,mrp:3299,items:['p1','p2','p3','p10','p11','p7','p13','p16'],desc:'Everything for week one, in one order.'},
];

const STORAGE_KEYS = {
  products: 'setl_products_v1',
  cart: 'setl_cart_v1',
  orders: 'setl_orders_v1',
};

const SetlData = {

  // ---- products ----
  // SWAP FOR LIVE: replace with `return (await fetch('/api/products')).json();`
  async getProducts(){
    const raw = localStorage.getItem(STORAGE_KEYS.products);
    if(raw) return JSON.parse(raw);
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(SEED_PRODUCTS));
    return SEED_PRODUCTS.slice();
  },

  // SWAP FOR LIVE: this whole function becomes a no-op — each admin
  // action (publish/hide/delete) should instead POST/PATCH/DELETE
  // straight to your API, and the storefront should re-fetch.
  async saveProducts(products){
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  },

  // ---- kits/bundles ----
  // SWAP FOR LIVE: `return (await fetch('/api/bundles')).json();`
  async getKits(){
    return SEED_KITS.slice();
  },

  // ---- categories ----
  getCategories(){
    return CATS.slice();
  },

  // ---- cart ----
  // SWAP FOR LIVE: cart should live server-side once auth exists
  // (see setl-schema.sql: carts / cart_items), keyed to the signed-in
  // user, so it survives across devices. Until then this is local
  // to the browser only.
  async getCart(){
    const raw = localStorage.getItem(STORAGE_KEYS.cart);
    return raw ? JSON.parse(raw) : {};
  },
  async saveCart(cart){
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  },

  // ---- orders ----
  // SWAP FOR LIVE: replaced entirely by POST /api/checkout, which
  // creates a Razorpay order + local `orders` row server-side.
  // Never trust a client-created "order" as paid — see
  // setl-production-plan.md section 5.
  async placeMockOrder(order){
    const raw = localStorage.getItem(STORAGE_KEYS.orders);
    const orders = raw ? JSON.parse(raw) : [];
    orders.push(order);
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    return order;
  },
};
