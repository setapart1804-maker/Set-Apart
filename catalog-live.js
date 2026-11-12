/* SET APART — Admin-managed products with live stock-aware shopping.
   Existing PILGRIM/GOD FIRST collection remains SOLD OUT.
   Display prices are informational; PayPal totals are recalculated server-side.
*/
(function(){
 "use strict";
 const API="https://set-apart.onrender.com";
 const CART_KEY="setApartCart";
 const ORIGINAL_IDS=new Set(["pilgrim","godfirst","teepilgrim","teegodfirst"]);
 const section=document.getElementById("sa-live-catalog");
 const grid=document.getElementById("sa-live-catalog-grid");
 if(!section||!grid)return;
 const el=(tag,cls,text)=>{
   const node=document.createElement(tag);
   if(cls)node.className=cls;
   if(text!==undefined)node.textContent=String(text);
   return node;
 };
 function source(raw){
   if(typeof raw!=="string"||!raw.trim())return "";
   try{
     const url=new URL(raw,API);
     if(url.protocol!=="https:")return "";
     if(url.origin===API&&url.pathname.startsWith("/api/catalog/images/"))return url.href;
     if(url.origin===location.origin&&url.pathname.startsWith("/assets/"))return url.href;
     if(url.origin!==API&&url.origin!==location.origin)return url.href;
   }catch(_){}
   return "";
 }
 function readCart(){
   try{const cart=JSON.parse(localStorage.getItem(CART_KEY)||"[]");return Array.isArray(cart)?cart:[]}
   catch(_){return []}
 }
 function addToBag(item,stockLeft){
   if(ORIGINAL_IDS.has(item.id))return {success:false,reason:"This piece is currently sold out."};
   const cart=readCart();
   const existing=cart.find(p=>p.id===item.id&&p.color===item.color&&p.size===item.size);
   const current=Number(existing?.quantity||0),quantity=Number(item.quantity);
   if(!Number.isInteger(quantity)||quantity<1||quantity>20||current+quantity>20)
     return {success:false,reason:"Maximum 20 pieces per variant."};
   if(current+quantity>stockLeft)
     return {success:false,reason:"Only "+Math.max(0,stockLeft-current)+" more pieces are available in this size."};
   if(existing)existing.quantity=current+quantity;
   else cart.push(item);
   try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}
   catch(_){return {success:false,reason:"Your bag could not be saved. Check your browser storage."}}
   window.updateSetApartCartCount?.();
   window.dispatchEvent(new Event("setapart:cart"));
   return {success:true};
 }
 function field(labelText,options){
   const label=el("label","sa-catalog-field");
   const labelSpan=el("span","",labelText);
   const select=el("select");
   select.setAttribute("aria-label",labelText);
   for(const val of options) {
     const option=el("option","",val);
     option.value=val;select.appendChild(option);
   }
   label.append(labelSpan,select);
   return {label,select};
 }
 function renderProduct(p,stock){
   const card=el("article","reference-collection-card sa-catalog-card");
   const visual=el("div","reference-collection-visual");
   const image=source(p.image_url);
   if(image){
     const img=el("img");
     img.loading="lazy";img.decoding="async";
     img.src=image;img.alt=p.name||"SET APART product";
     img.addEventListener("error",()=>img.replaceWith(el("div","sa-catalog-no-photo","SET APART")),{once:true});
     visual.appendChild(img);
   }else visual.appendChild(el("div","sa-catalog-no-photo","SET APART"));
   card.appendChild(visual);
   const meta=el("div","reference-collection-meta");
   const detail=el("div");
   detail.appendChild(el("h3","",p.name));
   const variantText=[Array.isArray(p.colors)?p.colors.join(" / "):"",
     Array.isArray(p.sizes)?p.sizes.join(" · "):""].filter(Boolean).join(" — ");
   detail.appendChild(el("p","sa-catalog-detail",variantText));
   const label=el("p","sa-catalog-status","");
   detail.appendChild(label);
   meta.appendChild(detail);
   const price=Number(p.price_usd);
   meta.appendChild(el("span","",Number.isFinite(price)&&price>0?"$"+price.toFixed(2):""));
   card.appendChild(meta);
   const variants=(Array.isArray(stock)?stock:[])
     .filter(s=>s&&s.product_id===p.id&&Number.isFinite(Number(s.on_hand))&&Number(s.on_hand)>0)
     .map(s=>({color:String(s.color).toLowerCase(),size:String(s.size).toUpperCase(),on_hand:Math.floor(Number(s.on_hand))}));
   const availableColors=[...new Set(variants.map(s=>s.color))];
   if(!availableColors.length){
     label.textContent="SOLD OUT";
     return card;
   }
   label.textContent="AVAILABLE";
   const controls=el("div","sa-catalog-controls");
   const color=field("COLOR",availableColors);
   const size=field("SIZE",[]);
   const qtyLabel=el("label","sa-catalog-field sa-catalog-quantity");
   qtyLabel.appendChild(el("span","","QTY"));
   const qty=el("input");
   qty.type="number";qty.min="1";qty.max="20";qty.step="1";qty.value="1";
   qty.setAttribute("aria-label","Quantity");qtyLabel.appendChild(qty);
   const status=el("p","sa-catalog-feedback","");
   status.setAttribute("role","status");
   const buy=el("button","sa-catalog-add","ADD TO BAG");
   buy.type="button";
   const goToBag=el("a","sa-catalog-view-bag","VIEW BAG");
   goToBag.href="/cart/";
   goToBag.hidden=true;
   function chosen(){
     return variants.find(v=>v.color===color.select.value&&v.size===size.select.value);
   }
   function updateVariants(){
     const options=[...new Set(variants.filter(v=>v.color===color.select.value).map(v=>v.size))];
     const previous=size.select.value;
     size.select.replaceChildren();
     for(const option of options){
       const node=el("option","",option);node.value=option;size.select.appendChild(node);
     }
     if(options.includes(previous))size.select.value=previous;
     const variant=chosen();
     const left=variant?.on_hand||0;
     qty.max=String(Math.min(left,20));
     qty.value=String(Math.max(1,Math.min(Number(qty.value)||1,left,20)));
     buy.disabled=!variant||left<=0;
     status.textContent=left>0?left+" in stock":"OUT OF STOCK";
     goToBag.hidden=true;
   }
   color.select.addEventListener("change",updateVariants);
   size.select.addEventListener("change",updateVariants);
   buy.addEventListener("click",function(){
     const variant=chosen();
     if(!variant){status.textContent="Select an available option.";return}
     const amount=Number(qty.value);
     if(!Number.isInteger(amount)||amount<1||amount>20){status.textContent="Choose a valid quantity.";return}
     const result=addToBag({
       id:p.id,name:p.name,price, color:variant.color,size:variant.size,
       quantity:amount,image:image,catalogManaged:true
     },variant.on_hand);
     if(result.success){
       status.textContent="ADDED TO BAG ✓";
       goToBag.hidden=false;
     }else{
       status.textContent=result.reason;
       goToBag.hidden=true;
     }
   });
   controls.append(color.label,size.label,qtyLabel,buy,goToBag,status);
   card.appendChild(controls);
   updateVariants();
   return card;
 }
 let loading=false;
 let lastRefresh=0;
 async function load(){
   if(loading)return;
   loading=true;
   try{
     const controller=new AbortController();
     const timer=setTimeout(()=>controller.abort(),12000);
     let response;
     try{
       // A fresh catalog read is essential after editing prices in Admin.
       // Cache-bust intermediate proxies as well as the browser cache.
       response=await fetch(API+"/api/catalog?refresh="+Date.now(),{
         mode:"cors",credentials:"omit",cache:"no-store",signal:controller.signal
       });
     }finally{clearTimeout(timer)}
     if(!response.ok)throw Error("Catalog HTTP "+response.status);
     const data=await response.json();
     if(!data||data.success!==true||!Array.isArray(data.products))throw Error("Invalid catalog");
     lastRefresh=Date.now();
     // Original T-shirt prices come from the admin database, not the
     // hard-coded HTML fallback. They remain SOLD OUT until launch.
     if(typeof window.setApartStaticCatalogPrices==="function"){
       window.setApartStaticCatalogPrices(data.products);
     }
     const products=data.products.filter(p=>p&&typeof p.id==="string"&&!ORIGINAL_IDS.has(p.id)&&typeof p.name==="string");
     const stock=Array.isArray(data.stock)?data.stock:[];
     const fragment=document.createDocumentFragment();
     for(const product of products)fragment.appendChild(renderProduct(product,stock));
     grid.replaceChildren(fragment);
     section.hidden=products.length===0;
   }catch(e){console.warn("SET APART catalog prices could not sync:",e.message)}
   finally{loading=false}
 }
 // Render free-tier services may wake slowly. Retry after an initial failure,
 // and refresh when customers return to an already-open tab.
 load();
 setTimeout(function(){if(!lastRefresh)load()},6000);
 setTimeout(function(){if(!lastRefresh)load()},18000);
 document.addEventListener("visibilitychange",function(){
   if(!document.hidden&&Date.now()-lastRefresh>15000)load();
 });
 window.addEventListener("focus",function(){
   if(Date.now()-lastRefresh>15000)load();
 });
})();
