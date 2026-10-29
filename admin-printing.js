"use strict";
const path = require("path");

/**
 * Private print pages for genuine paid SET APART orders only.
 * Does not perform fulfillment, change database records or send emails.
 */
module.exports = function registerAdminPrinting(app, deps) {
  const { adminLimiter, adminBasicAuth, getStoredOrder, escapeHtml, setAdminSecurityHeaders } = deps;
  const esc = value => escapeHtml(String(value == null ? "" : value));
  const safeOrder = value => /^[A-Z0-9]{10,40}$/.test(String(value || ""));
  const row = (name,value) => '<div class="detail"><strong>'+esc(name)+'</strong><span>'+esc(value)+'</span></div>';

  app.get("/admin/print-logo.png",adminLimiter,adminBasicAuth,(req,res)=>{
    setAdminSecurityHeaders(res);
    res.type("image/png").sendFile(path.join(__dirname,"setapart_print_logo.png"));
  });

  app.get("/admin/print-action.js",adminLimiter,adminBasicAuth,(req,res)=>{
    setAdminSecurityHeaders(res);
    res.type("application/javascript").send(
      'document.getElementById("print-btn")?.addEventListener("click",function(){window.print()});'
    );
  });

  app.get("/admin/orders/:orderID/print/:kind",adminLimiter,adminBasicAuth,async(req,res)=>{
    setAdminSecurityHeaders(res);
    const orderID=String(req.params.orderID||"");
    const kind=String(req.params.kind||"");
    if (!safeOrder(orderID) || !["label","card"].includes(kind)) {
      return res.status(400).type("text/plain").send("Invalid print request");
    }
    try {
      const stored=await getStoredOrder(orderID);
      if (!stored) return res.status(404).type("text/plain").send("Order not found");
      const order=stored.order;
      if (String(order.payment_status)!=="COMPLETED") {
        return res.status(403).type("text/plain").send("Only paid orders can be printed");
      }

      const items=Array.isArray(stored.items)?stored.items:[];
      const productLines=items.map(item=>
        '<li><b>'+esc(item.product_name)+'</b><br><small>'+esc(String(item.color||"").toUpperCase())+
        ' / '+esc(item.size)+' &nbsp; × '+esc(item.quantity)+'</small></li>'
      ).join("");
      const customer=[order.first_name,order.last_name].filter(Boolean).join(" ");
      const pickup=String(order.country||"").toUpperCase()==="HT" ||
        String(order.shipping_method||"").toUpperCase().includes("PÉTION-VILLE PICKUP");
      const destination=pickup
        ? '<b>PÉTION-VILLE PICKUP — HAITI</b><br><small>Customer collects at the pickup point</small>'
        : [order.address,order.apartment,order.city,order.state,order.postal_code,order.country]
            .filter(Boolean).map(esc).join(", ");
      const recipient=pickup
        ? '<div class="address"><div class="meta">PICKUP NAME</div><b>'+esc(customer)+'</b><br>'+
          esc(order.phone||"")+'<br>'+destination+'</div>'
        : '<div class="address"><div class="meta">SHIP TO</div><b>'+esc(customer)+'</b><br>'+
          destination+'<br>'+esc(order.phone||"")+'</div>';

      const labelContent=
        '<div class="logo-wrap"><img alt="SET APART original cross and hands logo" src="/admin/print-logo.png"></div>'+
        '<div class="brand">SET APART-ht<sup>™</sup></div>'+
        '<div class="tagline">CALLED TO LIVE DIFFERENTLY.</div>'+
        '<div class="rule"></div>'+
        row("ORDER #",order.paypal_order_id)+
        '<div class="meta block-title">ITEMS</div><ul class="items">'+productLines+'</ul>'+
        '<div class="rule"></div>'+
        recipient+
        '<div class="footer-line">PACKED WITH PURPOSE.</div>';

      const cardContent=
        '<div class="logo-wrap"><img alt="SET APART original cross and hands logo" src="/admin/print-logo.png"></div>'+
        '<div class="brand">SET APART-ht<sup>™</sup></div>'+
        '<div class="tagline">CALLED TO LIVE DIFFERENTLY.</div>'+
        '<div class="rule"></div>'+
        '<div class="thanks">THANK YOU</div><div class="thanks-small">FOR YOUR ORDER.</div>'+
        '<p class="thank-message">Your support means a lot.<br>You are part of something greater.</p>'+
        '<div class="rule"></div>'+
        row("ORDER #",order.paypal_order_id)+
        '<div class="meta block-title">YOUR ITEMS</div><ul class="items">'+productLines+'</ul>'+
        '<div class="footer-line">PACKED WITH PURPOSE.</div>';

      const pageKind=kind==="label"?"PACKAGE LABEL":"THANK YOU CARD";
      const content=kind==="label"?labelContent:cardContent;
      const pageClass=kind==="label"?"label":"card";
      const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
        '<meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<meta name="robots" content="noindex,nofollow"><title>'+pageKind+' · '+esc(orderID)+'</title>'+
        '<style>'+
        '*{box-sizing:border-box}html,body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#e9e9e9}'+
        '.screen-controls{padding:16px;text-align:center;background:#151515;color:#fff;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}'+
        '.screen-controls button,.screen-controls a{background:#fff;color:#111;padding:12px 18px;border:1px solid #fff;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}'+
        '.screen-controls small{width:100%;font-size:11px;opacity:.9}'+
        '.sheet{background:white;width:100mm;min-height:140mm;margin:25px auto 50px;padding:7mm 7mm 9mm;border:1px solid #111;display:flex;flex-direction:column;text-align:center;overflow:hidden}'+
        '.sheet.card{width:105mm;min-height:148mm;padding:8mm 9mm}'+
        '.logo-wrap{margin:0 auto 3mm;min-height:48mm;display:flex;align-items:center;justify-content:center}'+
        '.logo-wrap img{height:47mm;width:auto;object-fit:contain;max-width:100%}'+
        '.card .logo-wrap{min-height:42mm}.card .logo-wrap img{height:41mm}'+
        '.brand{font-family:Georgia,"Times New Roman",serif;font-size:23pt;font-weight:400;letter-spacing:-.6px;white-space:nowrap}'+
        '.brand sup{font-family:Arial;font-size:9px;vertical-align:super}'+
        '.tagline{font-size:7px;letter-spacing:2px;margin:2mm 0 3mm}'+
        '.rule{border-top:1px solid #222;margin:3.5mm 0}'+
        '.detail{display:flex;text-align:left;gap:4mm;align-items:baseline;font-size:10px;margin:2mm 0;overflow-wrap:anywhere}'+
        '.detail strong{min-width:19mm;font-size:9px;letter-spacing:1px}'+
        '.meta{font-size:8px;letter-spacing:1.6px;font-weight:800}'+
        '.block-title{text-align:left;margin-top:2.5mm}'+
        '.items{padding:0;margin:2mm 0 3mm;list-style:none;text-align:left;font-size:11px}'+
        '.items li{margin-bottom:2mm;line-height:1.4}.items small{font-size:9px}'+
        '.address{font-size:10px;line-height:1.55;text-align:left;overflow-wrap:anywhere}.address .meta{margin-bottom:1mm}'+
        '.footer-line{font-size:9px;letter-spacing:2.1px;margin-top:auto;padding-top:4mm}'+
        '.thanks{font:normal 27pt Georgia,"Times New Roman",serif;letter-spacing:-1px;margin-top:1.8mm}'+
        '.thanks-small{font:normal 15pt Georgia,"Times New Roman",serif;letter-spacing:1px}'+
        '.thank-message{font:12pt/1.6 Georgia,"Times New Roman",serif;margin:3.5mm auto}'+
        '@page{size:A4 portrait;margin:8mm}'+
        '@media print{html,body{background:white}.screen-controls{display:none!important}'+
        '.sheet,.sheet.card{margin:0 auto;box-shadow:none;break-inside:avoid;page-break-inside:avoid}'+
        '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'+
        '@media(max-width:420px){.sheet{transform-origin:top center;max-width:calc(100vw - 20px);min-height:0}.sheet.card{max-width:calc(100vw - 20px)}}'+
        '</style></head><body><div class="screen-controls"><b>'+pageKind+'</b>'+
        '<button id="print-btn" type="button">PRINT / SAVE AS PDF</button>'+
        '<a href="/admin">BACK TO ADMIN</a>'+
        '<small>A4 paper · 100% scale · cut along the border. Print only after reviewing the order information.</small>'+
        '</div><main class="sheet '+pageClass+'">'+content+
        '</main><script src="/admin/print-action.js" defer></script></body></html>';

      res.set("Content-Security-Policy","default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      return res.type("html").send(html);
    } catch (e) {
      console.error("Admin printing error:",e.message);
      return res.status(500).type("text/plain").send("Could not render print page");
    }
  });
};
