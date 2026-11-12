/* SET APART — public collection synchronized with Admin Product Catalog.
   Browse-only until the secure PayPal order calculation and stock reservation
   use the same database. Never trust browser-side prices for checkout. */
(function(){
  "use strict";
  const API="https://set-apart.onrender.com";
  const KNOWN=new Set(["pilgrim","godfirst","teepilgrim","teegodfirst"]);
  const section=document.getElementById("sa-live-catalog");
  const grid=document.getElementById("sa-live-catalog-grid");
  if(!section||!grid)return;

  function imageSource(raw){
    if(typeof raw!=="string"||!raw.trim())return "";
    try{
      const u=new URL(raw,API);
      if(u.protocol!=="https:")return "";
      if(u.origin===API&&u.pathname.startsWith("/api/catalog/images/"))return u.href;
      if(u.origin===location.origin&&u.pathname.startsWith("/assets/"))return u.href;
      if(u.origin!==API&&u.origin!==location.origin)return u.href;
    }catch(_){}
    return "";
  }
  function element(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!=null)node.textContent=String(text);
    return node;
  }
  function renderProduct(p,stock){
    const card=element("article","reference-collection-card sa-catalog-card");
    const visual=element("div","reference-collection-visual");
    const src=imageSource(p.image_url);
    if(src){
      const img=document.createElement("img");
      img.loading="lazy";img.decoding="async";img.src=src;
      img.alt=p.name||"SET APART clothing";
      img.addEventListener("error",function(){
        img.replaceWith(element("div","sa-catalog-no-photo","SET APART"));
      },{once:true});
      visual.appendChild(img);
    }else{
      visual.appendChild(element("div","sa-catalog-no-photo","SET APART"));
    }
    card.appendChild(visual);
    const meta=element("div","reference-collection-meta");
    const detail=document.createElement("div");
    detail.appendChild(element("h3","",p.name));
    const variants=[Array.isArray(p.colors)?p.colors.join(" / "):"",
                    Array.isArray(p.sizes)?p.sizes.join(" · "):""].filter(Boolean);
    detail.appendChild(element("p","sa-catalog-detail",variants.join(" — ")));
    const matching=stock.filter(s=>s.product_id===p.id);
    const total=matching.reduce((n,s)=>n+Math.max(0,Number(s.on_hand)||0),0);
    detail.appendChild(element("p","sa-catalog-status",
      matching.length&&total===0?"OUT OF STOCK":
      matching.length&&total>0?"CONTACT US TO ORDER":"ASK ABOUT AVAILABILITY"));
    const contact=document.createElement("a");
    contact.className="sa-catalog-contact";
    contact.href="/contact/";
    contact.textContent="ENQUIRE ABOUT THIS PIECE";
    contact.setAttribute("aria-label","Contact SET APART about "+p.name);
    detail.appendChild(contact);
    meta.appendChild(detail);
    const price=Number(p.price_usd);
    if(Number.isFinite(price)&&price>0)meta.appendChild(element("span","", "$"+price.toFixed(2)));
    card.appendChild(meta);
    return card;
  }
  async function loadCatalog(){
    try{
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),10000);
      let response;
      try{response=await fetch(API+"/api/catalog",{mode:"cors",credentials:"omit",signal:controller.signal,cache:"no-store"});}
      finally{clearTimeout(timeout);}
      if(!response.ok)throw new Error("Catalog unavailable");
      const data=await response.json();
      if(!data||data.success!==true||!Array.isArray(data.products))throw new Error("Invalid catalog");
      const products=data.products.filter(p=>p&&typeof p.id==="string"&&!KNOWN.has(p.id)&&typeof p.name==="string");
      if(!products.length)return;
      const stock=Array.isArray(data.stock)?data.stock:[];
      const fragment=document.createDocumentFragment();
      products.forEach(p=>fragment.appendChild(renderProduct(p,stock)));
      grid.replaceChildren(fragment);
      section.hidden=false;
    }catch(err){
      /* Keep the existing static collection fully usable if the backend is down. */
      console.warn("SET APART catalog could not load:",err.message);
    }
  }
  loadCatalog();
})();
