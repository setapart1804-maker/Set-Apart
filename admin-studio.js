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
      const html = \`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#073b2b">
<title>Admin Studio | SET APART</title>
<style>
:root{--forest:#073b2b;--forest2:#0d513b;--lime:#dff4de;--cream:#f7faf5;--ink:#163229;--muted:#738379;--stroke:#e0e9df;--white:#fff;--ease:cubic-bezier(.2,.75,.22,1)}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}a{text-decoration:none;color:inherit}button,input,select{font:inherit}button{cursor:pointer}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #92cda1;outline-offset:2px}
.layout{display:grid;grid-template-columns:235px minmax(0,1fr);min-height:100dvh}.sidebar{background:#fff;border-right:1px solid var(--stroke);padding:28px 17px;display:flex;flex-direction:column;gap:7px}.brand{padding:0 13px 26px;margin-bottom:18px;border-bottom:1px solid var(--stroke)}.brand strong{font-size:25px;font-weight:900;letter-spacing:-1.3px}.brand small{display:block;font-size:10px;letter-spacing:2.6px;color:var(--muted);font-weight:800}.sidebar .nav{border-radius:12px;padding:13px 14px;color:#5e7569;font-weight:700;transition:.2s}.sidebar .nav:hover{background:#edf5ee;transform:translateX(2px)}.sidebar .nav.active{background:var(--forest);color:white}.sidebar .label{font-size:10px;letter-spacing:2px;color:#96a89c;padding:20px 13px 7px;font-weight:800}.sidebar .bottom{margin-top:auto;border-top:1px solid var(--stroke);padding-top:18px}.main{min-width:0;padding:24px clamp(18px,4.3vw,66px) 60px;max-width:1740px;width:100%;margin:auto}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--stroke);padding-bottom:21px}.breadcrumb{font-weight:750;font-size:12px;color:#879b8b;letter-spacing:1px}.breadcrumb b{color:var(--forest)}.toplinks{display:flex;gap:9px;flex-wrap:wrap}.button{border-radius:100px;border:1px solid var(--stroke);padding:10px 17px;background:white;font-weight:750;font-size:12px;transition:.2s}.button:hover{transform:translateY(-2px);box-shadow:0 8px 25px #0c47321a}.button.primary{background:var(--forest);color:white;border-color:var(--forest)}.intro{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:36px 0 25px}.intro h1{font-size:clamp(30px,4.5vw,53px);line-height:1.07;letter-spacing:-2px;margin:7px 0}.intro p{margin:0;color:var(--muted)}.pill{background:#e7f3e8;color:#236444;font-size:11px;padding:9px 14px;border-radius:999px;font-weight:800;white-space:nowrap}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.kpi{position:relative;min-height:148px;border-radius:19px;background:white;border:1px solid var(--stroke);padding:22px;overflow:hidden;animation:rise .6s var(--ease) both}.kpi:nth-child(2){animation-delay:.08s}.kpi:nth-child(3){animation-delay:.16s}.kpi:nth-child(4){animation-delay:.24s}.kpi.feature{background:var(--forest);color:white;border-color:var(--forest)}.k-label{font-size:11px;font-weight:750;opacity:.72}.k-val{font-size:clamp(24px,3vw,38px);letter-spacing:-1.6px;font-weight:850;margin-top:20px}.k-foot{font-size:10px;opacity:.65;margin-top:6px}.kpi.feature:after{content:"";position:absolute;width:300px;height:300px;top:-100px;right:-190px;border:1px solid #ffffff35;border-radius:46%;box-shadow:0 0 0 28px #ffffff08,0 0 0 55px #ffffff08;transform:rotate(-25deg);pointer-events:none}.blocks{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;margin-top:16px}.panel{background:#fff;border:1px solid var(--stroke);border-radius:19px;padding:25px;min-width:0;animation:rise .6s .2s var(--ease) both}.panel h2{font-size:17px;letter-spacing:-.5px;margin:0}.panel .sub{color:var(--muted);font-size:12px;margin:4px 0 23px}.bar-item{display:grid;grid-template-columns:115px minmax(0,1fr) 30px;align-items:center;gap:11px;margin:21px 0}.bar-name{font-weight:650;font-size:11px;color:#637e6d}.bar-track{height:10px;border-radius:99px;background:#edf3eb;overflow:hidden}.bar-fill{width:var(--w);height:100%;border-radius:99px;background:linear-gradient(90deg,#0d5a3f,#4ca679);transform:scaleX(0);transform-origin:left;animation:grow 1s var(--ease) forwards;animation-delay:var(--delay)}.bar-item strong{text-align:right;font-size:11px}.timer{background:var(--forest);border-radius:18px;color:white;padding:24px;position:relative;overflow:hidden;min-height:174px}.timer:before{content:"";position:absolute;inset:0;background:repeating-radial-gradient(ellipse at 90% 120%,transparent 0 21px,#ffffff15 22px 23px);pointer-events:none}.timer>*{position:relative}.timer h3{margin:0 0 8px;font-size:15px}.timer .clock{font-variant-numeric:tabular-nums;font-size:28px;font-weight:780;letter-spacing:1px;margin:11px 0}.timer small{color:#b7d8c5}.notice{border-radius:15px;background:#eaf4e9;padding:16px;color:#335843;font-size:12px;margin-top:14px}.orders{margin-top:16px}.panelhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.controls{display:flex;gap:8px;flex-wrap:wrap}.controls input,.controls select{border:1px solid var(--stroke);border-radius:9px;background:#fff;padding:10px 12px;color:var(--ink);font-size:12px;min-height:39px}.table-scroll{overflow:auto;margin-top:16px}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{text-transform:uppercase;font-size:10px;letter-spacing:1px;color:#90a296;text-align:left;padding:15px 12px;border-bottom:1px solid var(--stroke)}td{padding:15px 12px;border-bottom:1px solid #edf2ec;font-size:12px}td small{display:block;color:#9ba9a0;font-size:10px;margin-top:3px}.order-id{font-weight:750}.status{background:#edf5ea;border-radius:30px;padding:6px 10px;font-size:10px;font-weight:750;color:#286344}.subtle-link{color:#1d7952;font-weight:750}.footer{color:#8aa092;margin-top:24px;font-size:11px}.mini-menu{display:none}
@keyframes rise{from{opacity:0;transform:translateY(17px)}to{opacity:1;transform:translateY(0)}}@keyframes grow{to{transform:scaleX(1)}}@media(max-width:1150px){.kpis{grid-template-columns:repeat(2,1fr)}.blocks{grid-template-columns:1fr}}@media(max-width:760px){.layout{grid-template-columns:1fr}.sidebar{position:static;display:flex;flex-direction:row;gap:8px;overflow-x:auto;padding:12px;border-bottom:1px solid var(--stroke)}.sidebar .brand{margin:0;border:0;padding:4px 12px;white-space:nowrap}.sidebar .brand small,.sidebar .label,.sidebar .bottom{display:none}.sidebar .nav{white-space:nowrap;padding:12px}.main{padding:19px}.intro{align-items:start;flex-direction:column}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi{padding:17px;min-height:133px}.bar-item{grid-template-columns:85px minmax(0,1fr) 27px}.panel{padding:18px}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
</style></head><body>
<div class="layout"><nav class="sidebar" aria-label="Admin navigation"><div class="brand"><strong>SET APART</strong><small>ADMIN STUDIO</small></div><a class="nav active" href="/admin/studio">◈ &nbsp; Overview</a><a class="nav" href="#orders">▤ &nbsp; Orders</a><a class="nav" href="/admin">◎ &nbsp; Order management</a><div class="label">STORE</div><a class="nav" href="https://setapart-ht.com/" target="_blank" rel="noopener">↗ &nbsp; Storefront</a><div class="bottom"><div class="notice">Private admin · Read-only<br>Existing admin access is preserved.</div></div></nav>
<main class="main"><header class="top"><span class="breadcrumb">SET APART / <b>ADMIN STUDIO</b></span><div class="toplinks"><a class="button" href="/admin">Classic admin</a><a class="button primary" href="/admin/studio">↻ Refresh live data</a></div></header>
<div class="intro"><div><div class="breadcrumb">LIVE ORDER DATABASE</div><h1>Business overview<span style="color:#9abe9f">.</span></h1><p>Connected to existing order records · No sample figures</p></div><span class="pill">● PRIVATE ADMIN</span></div>
<section class="kpis" aria-label="Key figures"><article class="kpi feature"><div class="k-label">Confirmed sales (USD)</div><div class="k-val">\${money(summary.total_sales)}</div><div class="k-foot">Completed PayPal payments</div></article><article class="kpi"><div class="k-label">All orders</div><div class="k-val">\${totalOrders}</div><div class="k-foot">All payment states</div></article><article class="kpi"><div class="k-label">Paid records (recent)</div><div class="k-val">\${paidOrders}</div><div class="k-foot">Based on up to 250 newest orders</div></article><article class="kpi"><div class="k-label">Pending payment</div><div class="k-val">\${num(summary.pending_payment)}</div><div class="k-foot">Awaiting payment confirmation</div></article></section>
<div class="blocks"><article class="panel"><h2>Fulfilment pipeline</h2><p class="sub">Current order status counts</p>\${bars}</article><section class="panel"><h2>Operations pulse</h2><p class="sub">A live snapshot of the store</p><div class="timer"><h3>SET APART operations</h3><div class="clock">\${num(summary.paid)+num(summary.processing)} awaiting / in progress</div><small>Orders requiring attention</small></div><p class="notice">Storefront stock and web visits are not included: no unverified inventory or visitor metrics will be invented.</p></section></div>
<section class="panel orders" id="orders"><div class="panelhead"><div><h2>Recent orders</h2><p class="sub" style="margin-bottom:0">Up to 250 newest orders · Displaying \${filtered.length} matching</p></div><form class="controls" method="get" action="/admin/studio"><input aria-label="Search order" name="q" value="\${safe(String(req.query.q||"").slice(0,80))}" placeholder="Search order or product"><select name="status" aria-label="Order status">\${options}</select><button class="button primary" type="submit">Filter</button></form></div><div class="table-scroll"><table><thead><tr><th>ORDER / DATE</th><th>PRODUCT</th><th>AMOUNT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>\${rows}</tbody></table></div></section>
<div class="footer">© SET APART · Private interface · Read-only · Data is rendered server-side and never cached.</div>
</main></div></body></html>\`;
      return res.status(200).type("html").send(html);
    } catch (error) {
      console.error("Admin Studio error:", error);
      setAdminSecurityHeaders(res);
      return res.status(500).type("text").send("Admin Studio could not be loaded. The classic dashboard remains available at /admin.");
    }
  });
};
