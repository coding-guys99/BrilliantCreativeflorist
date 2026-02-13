export async function loadSiteConfig(){
  const res = await fetch("./data/site.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Failed to load site.json");
  return await res.json();
}

export function setWhatsAppLinks(waLink){
  const ids = ["waFab","waPrimaryBtn","waSecondaryBtn","waLinkText"];
  for(const id of ids){
    const el = document.getElementById(id);
    if(!el) continue;
    el.setAttribute("href", waLink);
  }
}

export function setFooterYear(){
  const y = new Date().getFullYear();
  const el = document.getElementById("year");
  if(el) el.textContent = String(y);
}
