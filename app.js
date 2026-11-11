
const CONFIG = {
  storeName: "Ma Boutique",
  whatsappNumber: "2290197578968", // format international, sans + ni espaces (ex : 22997000000)
  currency: "FCFA",
};
 
/* Les produits sont dans products.js (généré par admin.html). */
 
/* ============================================================
   Logique de la boutique
   ============================================================ */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => n.toLocaleString("fr-FR") + " " + CONFIG.currency;
 
let state = { cat: "Tout", q: "", sort: "default" };
let cart = JSON.parse(localStorage.getItem("cart") || "{}");
 
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
 
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}
 
/* ---- Catalogue ---- */
function renderChips() {
  const cats = ["Tout", ...new Set(PRODUCTS.map((p) => p.category))];
  $("#chips").innerHTML = cats
    .map((c) => `<button class="chip ${c === state.cat ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
}
 
function renderGrid() {
  let list = PRODUCTS.filter(
    (p) =>
      (state.cat === "Tout" || p.category === state.cat) &&
      (p.name + " " + (p.desc || "") + " " + p.category).toLowerCase().includes(state.q.toLowerCase())
  );
  if (state.sort === "asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "desc") list.sort((a, b) => b.price - a.price);
  if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
 
  $("#empty").hidden = list.length > 0;
  $("#grid").innerHTML = list
    .map(
      (p) => `
    <article class="card">
      <div class="thumb">${p.image ? `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy">` : esc(p.icon || "🛍️")}</div>
      <div class="card-body">
        <span class="cat">${esc(p.category)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="desc">${esc(p.desc)}</p>
        <div class="card-foot">
          <span class="price">${fmt(p.price)}</span>
          <button class="add" data-add="${p.id}">+ Ajouter</button>
        </div>
      </div>
    </article>`
    )
    .join("");
}
 
/* ---- Panier ---- */
function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find((x) => x.id == id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}
 
function renderCart() {
  const entries = Object.entries(cart).filter(([id]) => PRODUCTS.some((p) => p.id == id));
  $("#cartCount").textContent = entries.reduce((s, [, q]) => s + q, 0);
  $("#cartTotal").textContent = fmt(cartTotal());
 
  $("#cartItems").innerHTML = entries.length
    ? entries
        .map(([id, qty]) => {
          const p = PRODUCTS.find((x) => x.id == id);
          return `
        <div class="line-item">
          <div class="ico">${p.image ? `<img src="${p.image}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:10px">` : esc(p.icon || "🛍️")}</div>
          <div>
            <b>${esc(p.name)}</b><br><small>${fmt(p.price)}</small>
            <div class="qty">
              <button data-dec="${id}" aria-label="Moins">−</button>
              <span>${qty}</span>
              <button data-inc="${id}" aria-label="Plus">+</button>
            </div>
          </div>
          <div><b>${fmt(p.price * qty)}</b><br><button class="rm" data-rm="${id}">Retirer</button></div>
        </div>`;
        })
        .join("")
    : `<p class="empty">Votre panier est vide.</p>`;
  saveCart();
}
 
function openCart(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", !open);
  $("#overlay").hidden = !open;
}
 
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  toast("Ajouté au panier ✓");
}
 
/* ---- Commande WhatsApp ---- */
function sendOrder(e) {
  e.preventDefault();
  if (cartTotal() === 0) return toast("Votre panier est vide");
  const f = new FormData(e.target);
  const lines = Object.entries(cart)
    .map(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id == id);
      return p ? `• ${qty} x ${p.name} = ${fmt(p.price * qty)}` : "";
    })
    .filter(Boolean);
 
  const msg =
    `Bonjour ${CONFIG.storeName}, je souhaite passer commande :\n\n` +
    lines.join("\n") +
    `\n\nTotal : ${fmt(cartTotal())}\n\n` +
    `Nom : ${f.get("name")}\nTéléphone : ${f.get("phone")}\nAdresse : ${f.get("address")}`;
 
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
}
 
/* ---- Événements ---- */
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.cat) { state.cat = t.dataset.cat; renderChips(); renderGrid(); }
  if (t.dataset.add) addToCart(t.dataset.add);
  if (t.dataset.inc) { cart[t.dataset.inc]++; renderCart(); }
  if (t.dataset.dec) { if (--cart[t.dataset.dec] <= 0) delete cart[t.dataset.dec]; renderCart(); }
  if (t.dataset.rm) { delete cart[t.dataset.rm]; renderCart(); }
});
$("#search").addEventListener("input", (e) => { state.q = e.target.value; renderGrid(); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
$("#openCart").addEventListener("click", () => openCart(true));
$("#closeCart").addEventListener("click", () => openCart(false));
$("#overlay").addEventListener("click", () => openCart(false));
$("#clearCart").addEventListener("click", () => { cart = {}; renderCart(); });
$("#orderForm").addEventListener("submit", sendOrder);
 
/* ---- Initialisation ---- */
document.title = CONFIG.storeName + " – Boutique en ligne";
$("#brandName").textContent = CONFIG.storeName;
$("#footBrand").textContent = CONFIG.storeName;
$("#footWa").href = `https://wa.me/${CONFIG.whatsappNumber}`;
$("#year").textContent = new Date().getFullYear();
renderChips();
renderGrid();
renderCart();
 
