import { i18nInit, i18nGetLang, i18nSetLang, t } from "./i18n.js";
import { toast } from "./toast.js";
import { fetchPhotos, publicUrl } from "./gallery.js";
import { initLightbox } from "./lightbox.js";

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

async function main(){
  const y = document.getElementById("year");
  if(y) y.textContent = String(new Date().getFullYear());

  await i18nInit();

  const langSelect = document.getElementById("langSelect");
  if(langSelect){
    langSelect.value = i18nGetLang();
    langSelect.addEventListener("change", async (e) => {
      await i18nSetLang(e.target.value);
      applyMiniText();
    });
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

  const lb = initLightbox();
  const gridEl = document.getElementById("galleryGrid");
  const emptyEl = document.getElementById("emptyState");

  const rows = await fetchPhotos();
  const items = rows.map(r => ({ ...r, url: publicUrl(r.file_path) }));

  emptyEl.classList.toggle("hidden", items.length !== 0);
  renderGrid(gridEl, items, (arr, idx) => lb.open(arr, idx));
}

main().catch(err => {
  console.error(err);
  toast("Load failed. Check console.");
});
