"use strict";
const path = require("path");
const QRCode = require("qrcode");

/**
 * Private print pages for genuine paid SET APART orders only.
 * Does not perform fulfillment, change database records or send emails.
 */
module.exports = function registerAdminPrinting(app, deps) {
  const { adminLimiter, adminBasicAuth, getStoredOrder, escapeHtml, setAdminSecurityHeaders } = deps;
  const esc = value => escapeHtml(String(value == null ? "" : value));
  const safeOrder = value => /^[A-Z0-9]{10,40}$/.test(String(value || ""));
  const row = (name,value) => '<div class="detail"><strong>'+esc(name)+'</strong><span>'+esc(value)+'</span></div>';

  // Public targets are intentionally hard-coded. No user-supplied redirect or QR URL.
  const destinations = Object.freeze({
    website: "https://setapart1804-maker.github.io/Set-Apart/index.html",
    instagram: "https://www.instagram.com/setapartht/"
  });
  app.get("/admin/print-qr/:target",adminLimiter,adminBasicAuth,async(req,res)=>{
    setAdminSecurityHeaders(res);
    const url = destinations[String(req.params.target||"")];
    if(!url)return res.status(404).type("text/plain").send("QR target unavailable");
    try{
      const svg=await QRCode.toString(url,{
        type:"svg",errorCorrectionLevel:"Q",margin:4,width:300,
        color:{dark:"#000000",light:"#FFFFFF"}
      });
      res.type("image/svg+xml").send(svg);
    }catch(e){
      console.error("Admin QR creation failed:",e.message);
      res.status(500).type("text/plain").send("Could not generate QR");
    }
  });

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

      const scannableLinks =
        '<div class="qr-section"><div class="qr-heading">SCAN & CONNECT WITH US</div>'+
        '<div class="qr-grid">'+
        '<div class="qr-cell"><img src="/admin/print-qr/website" alt="QR code: shop SET APART website">'+
        '<strong>SHOP WEBSITE</strong></div>'+
        '<div class="qr-cell"><img src="/admin/print-qr/instagram" alt="QR code: SET APART Instagram">'+
        '<strong>INSTAGRAM</strong></div>'+
        '</div></div>';

      const labelContent=
        '<div class="logo-wrap"><img alt="SET APART original cross and hands logo" src="/admin/print-logo.png"></div>'+
        '<div class="brand">SET APART-ht<sup>™</sup></div>'+
        '<div class="tagline">CALLED TO LIVE DIFFERENTLY.</div>'+
        '<div class="rule"></div>'+
        row("ORDER #",order.paypal_order_id)+
        '<div class="meta block-title">ITEMS</div><ul class="items">'+productLines+'</ul>'+
        '<div class="rule"></div>'+
        recipient+
        scannableLinks+
        '<div class="footer-line">PACKED WITH PURPOSE.</div>';

      // The approved THANK YOU card is the FRONT only. No QR codes on the front.
      // The BACK carries both scannable brand QR codes on a second print page.
      const cardRows=items.slice(0,2).map(item=>
        '<div class="order-detail-row"><span>PRODUCT:</span><b>'+esc(item.product_name)+'</b></div>'+
        '<div class="order-detail-row"><span>COLOR:</span><b>'+esc(String(item.color||"").toUpperCase())+'</b></div>'+
        '<div class="order-detail-row"><span>SIZE:</span><b>'+esc(item.size)+'</b></div>'+
        '<div class="order-detail-row"><span>QTY:</span><b>'+esc(item.quantity)+'</b></div>'
      ).join("");
      const cardMore=items.length>2
        ? '<p class="card-more">+'+(items.length-2)+' MORE PRODUCTS — SEE PACKAGE LABEL</p>' : "";
      const brandHeader=
        '<div class="logo-wrap"><img alt="SET APART original cross and hands logo" src="/admin/print-logo.png"></div>'+
        '<div class="brand">SET APART-ht<sup>™</sup></div>'+
        '<div class="tagline">CALLED TO LIVE DIFFERENTLY.</div>';
      const cardContent=
        brandHeader+
        '<div class="rule-short"></div>'+
        '<div class="thanks">THANK YOU</div><div class="thanks-small">FOR YOUR ORDER.</div>'+
        '<p class="thank-message">Your support means a lot.<br>You are part of something greater.</p>'+
        '<div class="decorated-rule"><span>✦</span></div>'+
        '<div class="card-details">'+
        '<div class="order-detail-row"><span>ORDER #</span><b>'+esc(order.paypal_order_id)+'</b></div>'+
        cardRows+cardMore+'</div>'+
        '<div class="decorated-rule"><span>✦</span></div>'+
        '<div class="footer-line">PACKED WITH PURPOSE.</div>';

      const cardBackContent=
        brandHeader+
        '<div class="rule-short"></div>'+
        '<div class="scan-title">SCAN TO CONNECT</div>'+
        '<div class="scan-subtitle">Stay connected with SET APART-ht.</div>'+
        '<div class="qr-grid card-back-qr">'+
        '<div class="qr-cell"><img src="/admin/print-qr/website" alt="QR to real SET APART online shop">'+
        '<strong>WEBSITE</strong><small>ONLINE SHOP</small></div>'+
        '<div class="qr-cell"><img src="/admin/print-qr/instagram" alt="QR to official Instagram setapartht">'+
        '<strong>INSTAGRAM</strong><small>@setapartht</small></div>'+
        '</div>'+
        '<div class="decorated-rule"><span>✦</span></div>'+
        '<div class="back-footer">THANK YOU FOR BEING PART OF THE JOURNEY.</div>';

      const pageKind=kind==="label"?"PACKAGE LABEL":"THANK YOU CARD";
      const content=kind==="label"
        ? '<main class="sheet label">'+labelContent+'</main>'
        : '<div class="duplex-page"><main class="sheet card card-front">'+cardContent+'</main></div>'+
          '<div class="duplex-page"><main class="sheet card card-back">'+cardBackContent+'</main></div>';

      const duplexCss=[
        '.duplex-page{width:210mm;min-height:297mm;margin:22px auto;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px #ccc}',
        '.duplex-page .sheet.card{position:relative;width:110mm;height:137.5mm;min-height:137.5mm;margin:0;padding:5mm 7mm;background:white;border:1px solid #111;outline:1px solid #111;outline-offset:-2mm;overflow:hidden}',
        '.card .logo-wrap{min-height:33mm;height:33mm;margin:0 auto 1mm}',
        '.card .logo-wrap img{height:33mm;max-width:100%}',
        '.card .brand{font:normal 21pt Georgia,"Times New Roman",serif;letter-spacing:0}',
        '.card .tagline{font-size:7px;letter-spacing:2px;margin:1.5mm 0 2mm}',
        '.card .rule-short{width:32mm;border-top:1px solid #222;margin:2mm auto 3mm}',
        '.card .thanks{font:normal 26pt Georgia,"Times New Roman",serif;margin:1mm 0 0}',
        '.card .thanks-small{font:normal 15pt Georgia,"Times New Roman",serif;letter-spacing:1px}',
        '.card .thank-message{font:11pt/1.4 Georgia,"Times New Roman",serif;margin:2.5mm auto}',
        '.card .decorated-rule{width:100%;height:5mm;display:flex;align-items:center;justify-content:center;font-size:12px;margin:1.5mm 0}',
        '.card .decorated-rule:before,.card .decorated-rule:after{content:"";height:1px;flex:1;background:#111}',
        '.card .decorated-rule span{padding:0 2mm}',
        '.card .card-details{width:100%;max-width:87mm;margin:0 auto;text-align:left;padding:0 3mm}',
        '.card .order-detail-row{display:grid;grid-template-columns:29mm minmax(0,1fr);font:10px Georgia,"Times New Roman",serif;letter-spacing:.6px;min-height:4.1mm;align-items:start}',
        '.card .order-detail-row span{font-weight:bold;letter-spacing:.8px}',
        '.card .order-detail-row b{font-weight:normal;overflow-wrap:anywhere;border-left:1px solid #888;padding-left:4mm}',
        '.card .card-more{font:8px Arial,sans-serif;margin:1mm 0}',
        '.card .footer-line{font:9pt Georgia,"Times New Roman",serif;letter-spacing:1.5px;margin-top:auto;padding-top:2mm}',
        '.card-back .scan-title{font:normal 24pt Georgia,"Times New Roman",serif;letter-spacing:-.3px;margin:5mm 0 1mm;white-space:nowrap}',
        '.card-back .scan-subtitle{font:10pt Georgia,"Times New Roman",serif;margin:1mm 0 7mm}',
        '.card-back .qr-grid{margin:0 auto;display:flex;gap:10mm;justify-content:center;align-items:center}',
        '.card-back .qr-cell{display:flex;flex-direction:column;align-items:center;gap:1.2mm}',
        '.card-back .qr-cell img{width:31mm;height:31mm;object-fit:contain}',
        '.card-back .qr-cell strong{font:11pt Georgia,"Times New Roman",serif;letter-spacing:1.2px}',
        '.card-back .qr-cell small{font:9px Arial,sans-serif;letter-spacing:.5px}',
        '.card-back .decorated-rule{margin-top:auto}',
        '.card-back .back-footer{font:8px Georgia,"Times New Roman",serif;letter-spacing:1.2px;white-space:nowrap;padding-bottom:2mm}',
        '@media print{.duplex-page{width:194mm;height:280mm;min-height:280mm;margin:0;box-shadow:none;break-after:page;page-break-after:always}.duplex-page:last-of-type{break-after:auto;page-break-after:auto}.duplex-page .sheet.card{margin:0;box-shadow:none}}',
        '@media screen and (max-width:850px){.duplex-page{width:100%;min-height:0;padding:24px 0;overflow-x:auto}.duplex-page .sheet.card{max-width:calc(100vw - 24px)}}'
      ].join("");

      const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
        '<meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<meta name="robots" content="noindex,nofollow"><title>'+pageKind+' · '+esc(orderID)+'</title>'+
        '<style>'+
        '*{box-sizing:border-box}html,body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#e9e9e9}'+
        '.screen-controls{padding:16px;text-align:center;background:#151515;color:#fff;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}'+
        '.screen-controls button,.screen-controls a{background:#fff;color:#111;padding:12px 18px;border:1px solid #fff;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}'+
        '.screen-controls small{width:100%;font-size:11px;opacity:.9}'+
        '.sheet{background:white;width:100mm;min-height:165mm;margin:25px auto 50px;padding:7mm 7mm 9mm;border:1px solid #111;display:flex;flex-direction:column;text-align:center;overflow:hidden}'+
        '.sheet.card{width:105mm;min-height:172mm;padding:8mm 9mm}'+
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
        '.qr-section{border-top:1px solid #bbb;margin-top:3mm;padding-top:2.5mm;break-inside:avoid;page-break-inside:avoid}'+
        '.qr-heading{font-size:8px;letter-spacing:1.3px;font-weight:800;margin-bottom:2mm}'+
        '.qr-grid{display:flex;justify-content:center;gap:10mm;text-align:center}'+
        '.qr-cell{display:flex;flex-direction:column;align-items:center;gap:1mm}'+
        '.qr-cell img{width:24mm;height:24mm;object-fit:contain}'+
        '.qr-cell strong{font-size:8px;letter-spacing:.7px}'+
        '.footer-line{font-size:9px;letter-spacing:2.1px;margin-top:auto;padding-top:4mm}'+
        '.thanks{font:normal 27pt Georgia,"Times New Roman",serif;letter-spacing:-1px;margin-top:1.8mm}'+
        '.thanks-small{font:normal 15pt Georgia,"Times New Roman",serif;letter-spacing:1px}'+
        '.thank-message{font:12pt/1.6 Georgia,"Times New Roman",serif;margin:3.5mm auto}'+
        '@page{size:A4 portrait;margin:8mm}'+
        '@media print{html,body{background:white}.screen-controls{display:none!important}'+
        '.sheet,.sheet.card{margin:0 auto;box-shadow:none;break-inside:avoid;page-break-inside:avoid}'+
        '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'+
        '@media(max-width:420px){.sheet{transform-origin:top center;max-width:calc(100vw - 20px);min-height:0}.sheet.card{max-width:calc(100vw - 20px)}}'+
        duplexCss+'</style></head><body><div class="screen-controls"><b>'+pageKind+'</b>'+
        '<button id="print-btn" type="button">PRINT / SAVE AS PDF</button>'+
        '<a href="/admin">BACK TO ADMIN</a>'+
        '<small>'+ (kind==="card"
          ? 'TWO SIDES · Page 1 FRONT / Page 2 BACK · A4 paper · 100% scale · duplex long-edge or manual double-sided printing.'
          : 'A4 paper · 100% scale · cut along the border. Print only after reviewing the order information.')+
        '</small>'+
        '</div>'+content+
        '<script src="/admin/print-action.js" defer></script></body></html>';

      res.set("Content-Security-Policy","default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      return res.type("html").send(html);
    } catch (e) {
      console.error("Admin printing error:",e.message);
      return res.status(500).type("text/plain").send("Could not render print page");
    }
  });
};
