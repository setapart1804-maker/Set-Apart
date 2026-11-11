"use strict";

/*
 * SET APART Admin Studio.
 * Separate, read-only visual experience using the existing authenticated
 * Render admin session and the existing order database.
 * Never exposes API credentials, customer PII, or admin mutations.
 */
module.exports = function registerAdminStudio(app, deps) {
  const { adminLimiter, adminBasicAuth, setAdminSecurityHeaders, getAdminDashboardData, escapeHtml } = deps;
  const safe = (x) => escapeHtml(String(x == null ? "" : x));
  const num = (x) => Number(x) || 0;
  const money = (x) => "$" + num(x).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const validStatus = (x) => String(x || "").replace(/[^a-zA-Z_]/g, "").slice(0, 30);
  const fmtDate = (x) => { const d=new Date(x); return Number.isNaN(d.getTime())?"—":d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}); };

  app.get("/admin/studio", adminLimiter, adminBasicAuth, async (req, res) => {
    try {
      setAdminSecurityHeaders(res);
      const data = await getAdminDashboardData();
      const summary = data.summary || {};
      const orders = Array.isArray(data.orders) ? data.orders : [];
      // Only reveal operational values already available to the existing private admin.
      const statusCounts = [
        ["Paid", num(summary.paid)],
        ["Processing", num(summary.processing)],
        ["Ready for pickup", num(summary.ready_for_pickup)],
        ["Shipped", num(summary.shipped)],
        ["Completed", num(summary.completed)]
      ];
      const maxCount = Math.max(1, ...statusCounts.map(x=>x[1]));
      const bars = statusCounts.map(([name,value],i)=>'<div class="bar-item" style="--delay:'+(.12+i*.09)+'s"><span class="bar-name">'+safe(name)+'</span><div class="bar-track"><div class="bar-fill" style="--w:'+Math.round(value/maxCount*100)+'%"></div></div><strong>'+value+'</strong></div>').join("");
      const q = String(req.query.q || "").trim().slice(0, 80).toLowerCase();
      const state = String(req.query.status || "all").slice(0, 40);
      const filtered = orders.filter(order => {
        const matchesStatus = state === "all" || String(order.order_status || "").toUpperCase() === state;
        const matchesText = !q || [order.paypal_order_id, order.order_status, ...(Array.isArray(order.items)?order.items.map(i=>i.product_name):[])].some(x=>String(x||"").toLowerCase().includes(q));
        return matchesStatus && matchesText;
      });
      const rows = filtered.slice(0, 80).map(order => {
        const id = String(order.paypal_order_id || "—");
        const itemNames = (Array.isArray(order.items)?order.items:[]).map(i=>String(i.product_name||"Product")).join(", ");
        const status = validStatus(order.order_status || "UNKNOWN");
        return '<tr><td><span class="order-id">'+safe(id.slice(0,24))+'</span><small>'+safe(fmtDate(order.created_at))+'</small></td><td>'+safe(itemNames.slice(0,110)||"—")+'</td><td>'+money(order.total_usd)+'</td><td><span class="status">'+safe(status.replaceAll("_"," "))+'</span></td><td><a class="subtle-link" href="/admin">Manage ↗</a></td></tr>';
      }).join("") || '<tr><td colspan="5">No matching orders.</td></tr>';
      const options = ["all","PAID","PROCESSING","READY_FOR_PICKUP","SHIPPED","COMPLETED","CANCELLED","EXPIRED"].map(v=>'<option value="'+v+'"'+(v===state?' selected':'')+'>'+safe(v==="all"?"All statuses":v.replaceAll("_"," "))+'</option>').join("");
      const totalOrders = num(summary.total_orders);
      const paidOrders = orders.filter(o=>String(o.payment_status||"").toUpperCase()==="COMPLETED").length;

      // Actual last 7 days of completed payments (UTC; limited to latest 250 orders).
      const now = new Date();
      const chartDays = Array.from({length:7},(_,j)=>{
        const t = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-6+j));
        const day=t.toISOString().slice(0,10);
        const value=orders.filter(o=>String(o.payment_status||"").toUpperCase()==="COMPLETED" && String(o.created_at||"").slice(0,10)===day).reduce((a,o)=>a+num(o.total_usd),0);
        return {day,value,label:["D","L","M","M","J","V","S"][t.getUTCDay()]};
      });
      const graphMax = Math.max(1,...chartDays.map(x=>x.value));
      const graphBars = chartDays.map((x,i)=>'<div class="sale-bar '+(x.value?'active':'empty')+'" style="--height:'+Math.max(2,Math.round(x.value/graphMax*100))+'%;--delay:'+(.1+i*.1)+'s" tabindex="0" title="'+safe(x.day+': '+money(x.value))+'"></div>').join("");
      const graphLabels = chartDays.map(x=>'<span>'+x.label+'</span>').join("");
      const recentList = filtered.slice(0,4).map((o,i)=>'<li style="--delay:'+(.15+i*.09)+'s"><span class="avatar">#</span><div><b>'+safe(String(o.paypal_order_id||"—").slice(0,14))+'</b><small>'+safe(fmtDate(o.created_at))+' · '+money(o.total_usd)+'</small></div><span class="status">'+safe(validStatus(o.order_status).replaceAll("_"," "))+'</span></li>').join("") || '<li>Pa gen kòmann pou montre.</li>';
      const popular = new Map();
      orders.filter(o=>String(o.payment_status||"").toUpperCase()==="COMPLETED").forEach(o=>(Array.isArray(o.items)?o.items:[]).forEach(item=>{const k=String(item.product_name||"Product");popular.set(k,(popular.get(k)||0)+num(item.quantity));}));
      const productList = [...popular.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name,qty],i)=>'<li style="--delay:'+(.15+i*.08)+'s"><span class="dot"></span><div><b>'+safe(name.slice(0,65))+'</b><small>'+qty+' inite vann nan dosye ki disponib yo</small></div></li>').join("") || '<li>Pa gen lavant pwodwi nan dosye yo; stock pa konekte.</li>';
      const shippedDone = num(summary.shipped)+num(summary.completed);
      const fulfilmentAll = shippedDone + num(summary.paid)+num(summary.processing)+num(summary.ready_for_pickup);
      const fulfilmentPercent = fulfilmentAll ? Math.round(shippedDone/fulfilmentAll*100) : 0;
      const followUpCount = num(summary.paid)+num(summary.processing);
      const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0a1233">
<title>Admin Studio | SET APART</title>
<style>
:root{--forest:#073b2b;--forest2:#0d513b;--lime:#dff4de;--cream:#f7faf5;--ink:#163229;--muted:#738379;--stroke:#e0e9df;--white:#fff;--ease:cubic-bezier(.2,.75,.22,1)}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}a{text-decoration:none;color:inherit}button,input,select{font:inherit}button{cursor:pointer}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #92cda1;outline-offset:2px}
.layout{display:grid;grid-template-columns:235px minmax(0,1fr);min-height:100dvh}.sidebar{background:#fff;border-right:1px solid var(--stroke);padding:28px 17px;display:flex;flex-direction:column;gap:7px}.brand{padding:0 13px 26px;margin-bottom:18px;border-bottom:1px solid var(--stroke)}.brand strong{font-size:25px;font-weight:900;letter-spacing:-1.3px}.brand small{display:block;font-size:10px;letter-spacing:2.6px;color:var(--muted);font-weight:800}.sidebar .nav{border-radius:12px;padding:13px 14px;color:#5e7569;font-weight:700;transition:.2s}.sidebar .nav:hover{background:#edf5ee;transform:translateX(2px)}.sidebar .nav.active{background:var(--forest);color:white}.sidebar .label{font-size:10px;letter-spacing:2px;color:#96a89c;padding:20px 13px 7px;font-weight:800}.sidebar .bottom{margin-top:auto;border-top:1px solid var(--stroke);padding-top:18px}.main{min-width:0;padding:24px clamp(18px,4.3vw,66px) 60px;max-width:1740px;width:100%;margin:auto}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--stroke);padding-bottom:21px}.breadcrumb{font-weight:750;font-size:12px;color:#879b8b;letter-spacing:1px}.breadcrumb b{color:var(--forest)}.toplinks{display:flex;gap:9px;flex-wrap:wrap}.button{border-radius:100px;border:1px solid var(--stroke);padding:10px 17px;background:white;font-weight:750;font-size:12px;transition:.2s}.button:hover{transform:translateY(-2px);box-shadow:0 8px 25px #0c47321a}.button.primary{background:var(--forest);color:white;border-color:var(--forest)}.intro{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:36px 0 25px}.intro h1{font-size:clamp(30px,4.5vw,53px);line-height:1.07;letter-spacing:-2px;margin:7px 0}.intro p{margin:0;color:var(--muted)}.pill{background:#e7f3e8;color:#236444;font-size:11px;padding:9px 14px;border-radius:999px;font-weight:800;white-space:nowrap}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.kpi{position:relative;min-height:148px;border-radius:19px;background:white;border:1px solid var(--stroke);padding:22px;overflow:hidden;animation:rise .6s var(--ease) both}.kpi:nth-child(2){animation-delay:.08s}.kpi:nth-child(3){animation-delay:.16s}.kpi:nth-child(4){animation-delay:.24s}.kpi.feature{background:var(--forest);color:white;border-color:var(--forest)}.k-label{font-size:11px;font-weight:750;opacity:.72}.k-val{font-size:clamp(24px,3vw,38px);letter-spacing:-1.6px;font-weight:850;margin-top:20px}.k-foot{font-size:10px;opacity:.65;margin-top:6px}.kpi.feature:after{content:"";position:absolute;width:300px;height:300px;top:-100px;right:-190px;border:1px solid #ffffff35;border-radius:46%;box-shadow:0 0 0 28px #ffffff08,0 0 0 55px #ffffff08;transform:rotate(-25deg);pointer-events:none}.blocks{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;margin-top:16px}.panel{background:#fff;border:1px solid var(--stroke);border-radius:19px;padding:25px;min-width:0;animation:rise .6s .2s var(--ease) both}.panel h2{font-size:17px;letter-spacing:-.5px;margin:0}.panel .sub{color:var(--muted);font-size:12px;margin:4px 0 23px}.bar-item{display:grid;grid-template-columns:115px minmax(0,1fr) 30px;align-items:center;gap:11px;margin:21px 0}.bar-name{font-weight:650;font-size:11px;color:#637e6d}.bar-track{height:10px;border-radius:99px;background:#edf3eb;overflow:hidden}.bar-fill{width:var(--w);height:100%;border-radius:99px;background:linear-gradient(90deg,#0d5a3f,#4ca679);transform:scaleX(0);transform-origin:left;animation:grow 1s var(--ease) forwards;animation-delay:var(--delay)}.bar-item strong{text-align:right;font-size:11px}.timer{background:var(--forest);border-radius:18px;color:white;padding:24px;position:relative;overflow:hidden;min-height:174px}.timer:before{content:"";position:absolute;inset:0;background:repeating-radial-gradient(ellipse at 90% 120%,transparent 0 21px,#ffffff15 22px 23px);pointer-events:none}.timer>*{position:relative}.timer h3{margin:0 0 8px;font-size:15px}.timer .clock{font-variant-numeric:tabular-nums;font-size:28px;font-weight:780;letter-spacing:1px;margin:11px 0}.timer small{color:#b7d8c5}.notice{border-radius:15px;background:#eaf4e9;padding:16px;color:#335843;font-size:12px;margin-top:14px}.orders{margin-top:16px}.panelhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.controls{display:flex;gap:8px;flex-wrap:wrap}.controls input,.controls select{border:1px solid var(--stroke);border-radius:9px;background:#fff;padding:10px 12px;color:var(--ink);font-size:12px;min-height:39px}.table-scroll{overflow:auto;margin-top:16px}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{text-transform:uppercase;font-size:10px;letter-spacing:1px;color:#90a296;text-align:left;padding:15px 12px;border-bottom:1px solid var(--stroke)}td{padding:15px 12px;border-bottom:1px solid #edf2ec;font-size:12px}td small{display:block;color:#9ba9a0;font-size:10px;margin-top:3px}.order-id{font-weight:750}.status{background:#edf5ea;border-radius:30px;padding:6px 10px;font-size:10px;font-weight:750;color:#286344}.subtle-link{color:#1d7952;font-weight:750}.footer{color:#8aa092;margin-top:24px;font-size:11px}.mini-menu{display:none}
@keyframes rise{from{opacity:0;transform:translateY(17px)}to{opacity:1;transform:translateY(0)}}@keyframes grow{to{transform:scaleX(1)}}@media(max-width:1150px){.kpis{grid-template-columns:repeat(2,1fr)}.blocks{grid-template-columns:1fr}}@media(max-width:760px){.layout{grid-template-columns:1fr}.sidebar{position:static;display:flex;flex-direction:row;gap:8px;overflow-x:auto;padding:12px;border-bottom:1px solid var(--stroke)}.sidebar .brand{margin:0;border:0;padding:4px 12px;white-space:nowrap}.sidebar .brand small,.sidebar .label,.sidebar .bottom{display:none}.sidebar .nav{white-space:nowrap;padding:12px}.main{padding:19px}.intro{align-items:start;flex-direction:column}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi{padding:17px;min-height:133px}.bar-item{grid-template-columns:85px minmax(0,1fr) 27px}.panel{padding:18px}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}

/* User reference: royal-blue / navy / white layout */
:root{--forest:#12307a;--forest2:#2b55c4;--lime:#9fb6ee;--cream:#f3f4f1;--ink:#102a20;--muted:#6b7a72;--stroke:#e3e7e2}
body{background:radial-gradient(ellipse at 50% 0,#16276b,#0a1233 70%);padding:24px;display:flex;justify-content:center;align-items:flex-start;font-family:"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif}
.layout{grid-template-columns:190px minmax(0,1fr);gap:16px;background:#f3f4f1;border-radius:22px;padding:16px;max-width:1100px;width:100%;min-height:720px;box-shadow:0 30px 90px #0004}
.sidebar{background:transparent;border:0;padding:2px;gap:4px}.brand{padding:0 7px 14px;margin:0;border:0}.brand strong{font-size:16px;letter-spacing:-.5px;white-space:nowrap}.brand small{letter-spacing:1.2px;font-size:9px}.brandmark{display:inline-grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#12307a;color:white;font-size:10px;font-style:normal;letter-spacing:0}
.sidebar .nav{font-size:13px;padding:9px 10px;border-radius:10px;color:#6b7a72}.sidebar .nav.active{background:#fff;color:#102a20;box-shadow:inset 3px 0 0 #2b55c4}.sidebar .nav:hover{background:white;transform:none}
.sidebar .label{font-size:11px;padding:12px 10px 2px;letter-spacing:0}.sidebar .bottom{border:0}.promo{background:#12307a;color:white;padding:14px;border-radius:16px;font-size:12px}.promo .button{display:inline-block;color:#12307a;background:white}
.main{padding:8px 2px 18px}.top{border:0;padding-bottom:12px}.breadcrumb{font-size:11px}.toplinks{gap:7px}.button{padding:9px 14px}.button.primary{background:#12307a;border-color:#12307a}.button:hover{box-shadow:0 6px 19px #12307a26}
.intro{margin:2px 0 13px}.intro h1{font-size:26px;letter-spacing:-.5px}.intro p{font-size:13px}.pill{background:#e1e8fb;color:#12307a}
.kpis{gap:12px}.kpi{min-height:124px;border-radius:16px;padding:14px}.kpi.feature{background:linear-gradient(135deg,#12307a,#2b55c4);border:0}.kpi.feature:after{display:none}.k-label{font-weight:700;font-size:13px;opacity:1}.k-val{margin-top:12px;font-size:34px}.k-foot{font-size:11px;margin-top:1px}.kpi.feature .k-foot{color:#c7d4f5}
.blocks{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:12px;margin-top:12px}.panel{padding:14px;border-radius:16px;animation:rise .6s both}.panel h2{font-size:14px;letter-spacing:0;margin:0 0 11px}.panel .sub{font-size:11px;margin:9px 0}.sales-bars{display:flex;align-items:flex-end;justify-content:space-between;height:130px;gap:8px}.sale-bar{flex:1;border-radius:99px 99px 5px 5px;height:var(--height);transform:scaleY(0);transform-origin:bottom;animation:grow 1.05s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:var(--delay)}.sale-bar.active{background:#12307a}.sale-bar.empty{background:repeating-linear-gradient(135deg,#d5dbd6 0 3px,#eef0ed 3px 7px)}.day-labels{display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:#6b7a72}.day-labels span{flex:1;text-align:center}.reminder h3{font-size:20px;line-height:1.25;margin:12px 0;font-weight:750}.reminder .button{border-radius:99px;margin-top:8px}
.mini-list{list-style:none;padding:0;margin:0;font-size:12px;display:flex;flex-direction:column;gap:11px}.mini-list li{display:flex;align-items:center;gap:8px;min-width:0;animation:rise .55s both;animation-delay:var(--delay)}.mini-list small{display:block;font-size:11px;color:#6b7a72}.mini-list .dot{flex:none;width:8px;height:8px;border-radius:50%;background:#2b55c4}.avatar{flex:none;width:30px;height:30px;border-radius:50%;background:#2b55c4;color:white;display:grid;place-items:center;font-weight:800}.mini-list .status{margin-left:auto;font-size:9px;white-space:nowrap;max-width:92px;overflow:hidden;text-overflow:ellipsis}.gauge{position:relative;width:170px;max-width:100%;margin:0 auto 19px}.gauge svg{display:block;width:100%}.gauge b{font-size:26px;position:absolute;left:0;right:0;bottom:6px;text-align:center}.gauge span{position:absolute;left:0;right:0;bottom:-12px;text-align:center;color:#6b7a72;font-size:11px}.progress-arc{stroke-dasharray:var(--value) 100;animation:arcEnter 1.25s ease-out both}.revenue{background:#12307a;color:white;display:flex;flex-direction:column;justify-content:space-between}.revenue h2{color:#c7d4f5}.revenue p{color:#c7d4f5;font-size:12px}.revenue .button{background:white;color:#12307a;align-self:flex-start}.big-money{font-size:clamp(24px,3vw,34px);font-weight:750;letter-spacing:-1px}
.orders{margin-top:12px}.orders .sub{margin:0 0 12px}.status{background:#e1e8fb;color:#12307a}.subtle-link{color:#12307a}
@keyframes grow{to{transform:scaleY(1)}}@keyframes arcEnter{from{stroke-dasharray:0 100}}
@media(max-width:1000px){.blocks{grid-template-columns:1fr 1fr}.blocks .panel:first-child{grid-column:1/-1}}@media(max-width:760px){body{padding:10px}.layout{grid-template-columns:1fr;padding:12px}.sidebar{flex-direction:row;overflow-x:auto;flex-wrap:nowrap}.sidebar .brand,.sidebar .label,.sidebar .bottom{display:none}.main{padding:5px}.blocks,.blocks.second{grid-template-columns:1fr}.blocks .panel:first-child{grid-column:auto}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi{min-height:110px;padding:11px}.k-val{font-size:28px}.intro{margin-top:8px}}
@media(prefers-reduced-motion:reduce){.sale-bar{animation:none;transform:none}.progress-arc{animation:none}}
</style></head><body>
<div class="layout"><nav class="sidebar" aria-label="Admin navigation"><div class="brand"><strong><i class="brandmark">SA</i> SET APART</strong><small>ADMIN CONTROL CENTER</small></div><div class="label">MENI</div><a class="nav active" href="/admin/studio">◈ &nbsp; Tablo</a><a class="nav" href="#orders">▤ &nbsp; Kòmann</a><a class="nav" href="#sales">▥ &nbsp; Vant</a><a class="nav" href="#products">◉ &nbsp; Pwodwi</a><div class="label">JENERAL</div><a class="nav" href="/admin">⚙ &nbsp; Jesyon kòmann</a><a class="nav" href="https://setapart-ht.com/" target="_blank" rel="noopener">↗ &nbsp; Sit piblik la</a><div class="bottom"><div class="promo"><b>SET APART — ADMIN</b>Done reyèl ki sòti nan sistèm kòmann aktyèl la.<br><br><a class="button" href="/admin">Wè jesyon</a></div></div></nav>
<main class="main"><header class="top"><span class="breadcrumb">SET APART / <b>TABLO</b></span><div class="toplinks"><a class="button" href="/admin">Admin klasik</a><a class="button primary" href="/admin/studio">↻ Rafrechi</a></div></header>
<div class="intro"><div><div class="breadcrumb">DASHBOARD PRIVE · DONE AKTYÈL</div><h1>Tablo<span style="color:#9fb6ee">.</span></h1><p>Mayo ak hoodie: swiv kòmann ou yo nan yon sèl kote.</p></div><span class="pill">● CONNECTED</span></div>
<section class="kpis" aria-label="Statistik"><article class="kpi feature"><div class="k-label">Total kòmann</div><div class="k-val">${totalOrders}</div><div class="k-foot">Tout estati</div></article><article class="kpi"><div class="k-label">Ekspedye / fini</div><div class="k-val">${shippedDone}</div><div class="k-foot">Livrezon fini oswa ekspedye</div></article><article class="kpi"><div class="k-label">Nan preparasyon</div><div class="k-val">${num(summary.processing)}</div><div class="k-foot">Estati PROCESSING</div></article><article class="kpi"><div class="k-label">An atant peman</div><div class="k-val">${num(summary.pending_payment)}</div><div class="k-foot">Peman ki poko valide</div></article></section>
<div class="blocks" id="sales"><article class="panel sales"><h2>Vant — 7 dènye jou</h2><div class="sales-bars">${graphBars}</div><div class="day-labels">${graphLabels}</div><p class="sub">USD · Kòmann peye nan 250 dènye dosye yo (UTC).</p></article>
<article class="panel reminder"><h2>Rapèl</h2><h3>${followUpCount} kòmann pou swiv</h3><p class="sub">${num(summary.paid)} peye ap tann tretman · ${num(summary.processing)} nan preparasyon</p><a class="button primary" href="/admin">Wè kòmann yo</a></article>
<article class="panel products" id="products"><h2>Pwodwi ki vann</h2><ul class="mini-list">${productList}</ul></article></div>
<div class="blocks second"><article class="panel"><h2>Dènye kòmann</h2><ul class="mini-list">${recentList}</ul></article>
<article class="panel progress"><h2>Pwogrè ekspedisyon</h2><div class="gauge"><svg viewBox="0 0 200 110" role="img" aria-label="${fulfilmentPercent}% ekspedye oswa fini"><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#e3e7e2" stroke-width="22" stroke-linecap="round"/><path class="progress-arc" d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#12307a" stroke-width="22" stroke-linecap="round" pathLength="100" style="--value:${fulfilmentPercent}"/></svg><b>${fulfilmentPercent}%</b><span>Ekspedye / fini</span></div><p class="sub">Sou ${fulfilmentAll} kòmann nan pwosesis livrezon.</p></article>
<article class="panel revenue"><h2>Revni konfime</h2><div class="big-money">${money(summary.total_sales)}</div><p>Peman ki gen estati COMPLETED.</p><a class="button" href="/admin">Detay kòmann</a></article></div>
<section class="panel orders" id="orders"><div class="panelhead"><div><h2>Recent orders</h2><p class="sub" style="margin-bottom:0">Up to 250 newest orders · Displaying ${filtered.length} matching</p></div><form class="controls" method="get" action="/admin/studio"><input aria-label="Search order" name="q" value="${safe(String(req.query.q||"").slice(0,80))}" placeholder="Search order or product"><select name="status" aria-label="Order status">${options}</select><button class="button primary" type="submit">Filter</button></form></div><div class="table-scroll"><table><thead><tr><th>ORDER / DATE</th><th>PRODUCT</th><th>AMOUNT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${rows}</tbody></table></div></section>
<div class="footer">© SET APART · Private interface · Read-only · Data is rendered server-side and never cached.</div>
</main></div></body></html>`;
      return res.status(200).type("html").send(html);
    } catch (error) {
      console.error("Admin Studio error:", error);
      setAdminSecurityHeaders(res);
      return res.status(500).type("text").send("Admin Studio could not be loaded. The classic dashboard remains available at /admin.");
    }
  });
};
