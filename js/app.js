import { i18nInit, i18nGetLang, i18nSetLang, t } from "./i18n.js";
import { toast } from "./toast.js";
import { fetchPhotos, fetchCategories, publicUrl } from "./gallery.js";
import { initLightbox } from "./lightbox.js";

let ALL_ITEMS = [];
let ALL_CATEGORIES = [];
let CURRENT_CATEGORY = "all";

function renderGrid(gridEl, items, onOpen){
  gridEl.innerHTML = items.map((it, idx) => `
    <article class="gallery-item" data-idx="${idx}" tabindex="0" role="button" aria-label="photo">
      <div class="thumb">
        <img loading="lazy" src="${it.url}" alt="" />
      </div>
    </article>
  `).join("");

  gridEl.querySelectorAll(".gallery-item").forEach(card => {
    const idx = Number(card.dataset.idx);
    card.addEventListener("click", () => onOpen(items, idx));
    card.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        onOpen(items, idx);
      }
    });
  });
}

function filterItems(category){
  if(category === "all") return ALL_ITEMS;
  return ALL_ITEMS.filter(item => item.category === category);
}

function getCategoryName(cat){
  const lang = i18nGetLang();

  if(lang === "zh-TW") return cat.name_zh_tw || cat.name || cat.slug;
  if(lang === "zh-CN") return cat.name_zh_cn || cat.name || cat.slug;
  if(lang === "en") return cat.name_en || cat.name || cat.slug;

  return cat.name_zh_tw || cat.name || cat.slug;
}

function getAllLabel(){
  const lang = i18nGetLang();

  if(lang === "zh-TW") return "全部";
  if(lang === "zh-CN") return "全部";
  if(lang === "en") return "All";

  return "全部";
}

function renderCategoryBar(categoryBar){
  if(!categoryBar) return;

  const html = [
    `<button class="category-chip ${CURRENT_CATEGORY === "all" ? "active" : ""}" data-category="all">${getAllLabel()}</button>`,
    ...ALL_CATEGORIES.map(cat => `
      <button
        class="category-chip ${CURRENT_CATEGORY === cat.slug ? "active" : ""}"
        data-category="${cat.slug}"
      >
        ${getCategoryName(cat)}
      </button>
    `)
  ].join("");

  categoryBar.innerHTML = html;
}

async function main(){
  const y = document.getElementById("year");
  if(y) y.textContent = String(new Date().getFullYear());

  await i18nInit();

  const lb = initLightbox();
  const gridEl = document.getElementById("galleryGrid");
  const emptyEl = document.getElementById("emptyState");
  const categoryBar = document.getElementById("categoryBar");

  // 先抓分類，再抓圖片
  const [categoriesRows, photosRows] = await Promise.all([
    fetchCategories(),
    fetchPhotos()
  ]);

  ALL_CATEGORIES = categoriesRows || [];
  ALL_ITEMS = (photosRows || []).map(r => ({
    ...r,
    url: publicUrl(r.file_path)
  }));

  function renderCurrentCategory(){
    const filtered = filterItems(CURRENT_CATEGORY);

    emptyEl.classList.toggle("hidden", filtered.length !== 0);
    renderGrid(gridEl, filtered, (arr, idx) => lb.open(arr, idx));
    renderCategoryBar(categoryBar);
  }

  function applyMiniText(){
    const subtitle = document.getElementById("subtitleText");
    const waText = document.getElementById("waText");
    const emptyTitle = document.getElementById("emptyTitle");
    const emptyDesc  = document.getElementById("emptyDesc");
    const cap = document.getElementById("lbCaption");

    if(subtitle) subtitle.textContent = t("subtitle");
    if(waText) waText.textContent = "WhatsApp";
    if(emptyTitle) emptyTitle.textContent = t("emptyTitle");
    if(emptyDesc) emptyDesc.textContent = t("emptyDesc");
    if(cap) cap.textContent = t("swipeTip");
  }

  applyMiniText();

  const langSelect = document.getElementById("langSelect");
  if(langSelect){
    langSelect.value = i18nGetLang();
    langSelect.addEventListener("change", async (e) => {
      await i18nSetLang(e.target.value);
      applyMiniText();
      renderCurrentCategory();
    });
  }

  if(categoryBar){
    categoryBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-chip");
      if(!btn) return;

      CURRENT_CATEGORY = btn.dataset.category || "all";
      renderCurrentCategory();
    });
  }

  renderCurrentCategory();
}

main().catch(err => {
  console.error(err);
  toast("Load failed. Check console.");
});