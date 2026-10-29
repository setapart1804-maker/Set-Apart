"use strict";
// SET APART branding documents are shown only behind authenticated Admin routes.
const QRCode=require("qrcode");
const SITE="https://setapart1804-maker.github.io/Set-Apart/index.html";
const IG="https://www.instagram.com/setapartht/";
const LOGO="https://setapart1804-maker.github.io/Set-Apart/SET%20APART-ht%20logo.png";
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function brand(){return '<img class="logo" src="'+LOGO+'" alt="Official SET APART-ht logo">'+
  '<div class="brand">SET APART-ht<sup>&trade;</sup></div><div class="slogan">CALLED TO LIVE DIFFERENTLY.</div>';}
function itemList(items,max){return items.slice(0,max).map(x=>'<div class="item"><strong>'+esc(x.product_name)+
  '</strong><small>'+esc(String(x.color||"").toUpperCase())+' / '+esc(x.size)+' / QTY '+Number(x.quantity||0)+'</small></div>').join("")+
  (items.length>max?'<div class="more">+'+(items.length-max)+' MORE PRODUCT VARIANTS - SEE ADMIN</div>':"");}
function qrPair(a,b){return '<div class="qr-group"><div class="qr"><img src="'+a+'" alt="Website QR"><span>SHOP WEBSITE</span></div>'+
  '<div class="qr"><img src="'+b+'" alt="Instagram QR"><span>INSTAGRAM</span></div></div>';}
const CSS=`
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
body,html{margin:0;background:#eee;color:#111;font-family:Arial,Helvetica,sans-serif}
.toolbar{background:#111;color:white;padding:14px;text-align:center}
.toolbar button{border:0;background:white;color:#111;padding:12px 24px;font-weight:800;cursor:pointer}
.toolbar p{font-size:12px;margin:8px 0 0}
.page{width:210mm;min-height:297mm;margin:0 auto;background:white;display:flex;align-items:center;justify-content:center}
.cut{width:105mm;height:148mm;border:.35mm solid #777;padding:6mm;display:flex;flex-direction:column;align-items:center;text-align:center;overflow:hidden;background:white}
.logo{height:49mm;width:55mm;object-fit:contain;filter:invert(1);margin:-5mm 0 -6mm}
.brand{font:24px Georgia,serif;white-space:nowrap}
.brand sup{font:9px Arial,sans-serif}
.slogan{font-size:7px;letter-spacing:.22em;margin:2mm 0 0;white-space:nowrap}
.rule{width:100%;border-top:1px solid #111;margin:4mm 0}
.field{font-size:10px;letter-spacing:.13em;font-weight:800}
.number{font-size:13px;font-weight:800;margin:2mm 0;overflow-wrap:anywhere}
.date{font-size:8px;color:#555}
.products{width:100%;text-align:left;margin:3mm 0 0;flex:1;overflow:hidden}
.item{font-size:10px;padding:2mm 0;border-bottom:1px solid #ddd}
.item small{font-size:8px;color:#555;display:block;margin-top:1mm}
.more{font-size:8px}
.foot{font-size:9px;letter-spacing:.16em;margin-top:auto}
.card .logo{height:32mm;width:42mm;margin:-3mm 0 -4mm}
.card .brand{font-size:20px}
.card .slogan{font-size:6px}
.card .rule{margin:3mm 0}
.thanks{font:26px Georgia,serif;margin:1mm 0 0}
.subthanks{font:14px Georgia,serif;margin:0}
.message{font:11px Georgia,serif;line-height:1.4;margin:3mm 0}
.card .number{font-size:12px;margin:1mm 0}
.card .products{flex:0 0 auto;max-height:24mm;margin:1mm 0}
.card .item{font-size:8px;padding:1mm 0}
.card .item small{font-size:7px}
.card .foot{font-size:7px}
.qr-group{display:flex;gap:10mm;justify-content:center;align-items:center;margin:3mm 0;width:100%}
.qr{display:flex;align-items:center;flex-direction:column;gap:1mm}
.qr img{width:22mm;height:22mm;object-fit:contain}
.qr span{font-size:7px;font-weight:bold;letter-spacing:.05em}
.stickers{display:grid;grid-template-columns:90mm 90mm;gap:8mm;justify-content:center;align-content:center}
.sticker{height:65mm;width:90mm;border:.35mm solid #777;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4mm;text-align:center}
.sticker .brand{font-size:21px}
.sticker .slogan{font-size:7px}
.sticker .qr img{width:29mm;height:29mm}
.sticker .qr span{font-size:8px}
.sticker .foot{font-size:7px;margin:2mm 0 0}
@media screen{.page{box-shadow:0 4px 15px #ccc}}
@media print{html,body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:none}.page{min-height:297mm;box-shadow:none}.cut,.sticker{border:.25mm solid #777}}
`;
async function renderPackaging(order,items,kind){
  if(!["label","card","qr"].includes(kind))throw Error("Unknown print format");
  const orderID=esc(order.paypal_order_id);
  const date=new Date(order.created_at).toLocaleDateString("en-US",{timeZone:"America/Santo_Domingo"});
  let qrA="",qrB="";
  if(kind!=="label"){
    [qrA,qrB]=await Promise.all([
      QRCode.toDataURL(SITE,{errorCorrectionLevel:"M",margin:1,width:400}),
      QRCode.toDataURL(IG,{errorCorrectionLevel:"M",margin:1,width:400})
    ]);
  }
  let body="";
  if(kind==="qr"){
    body='<div class="stickers">'+Array.from({length:4},()=>'<section class="sticker">'+
      '<div class="brand">SET APART-ht<sup>&trade;</sup></div>'+
      '<div class="slogan">CALLED TO LIVE DIFFERENTLY.</div>'+
      qrPair(qrA,qrB)+'<div class="foot">SCAN &amp; STAY CONNECTED.</div></section>').join("")+'</div>';
  }else if(kind==="label"){
    body='<section class="cut label">'+brand()+'<div class="rule"></div>'+
      '<div class="field">PACKAGING LABEL</div><div class="field" style="margin-top:4mm">ORDER #</div>'+
      '<div class="number">'+orderID+'</div><div class="date">'+esc(date)+'</div>'+
      '<div class="products">'+itemList(items,5)+'</div><div class="rule"></div>'+
      '<div class="foot">PACKED WITH PURPOSE.</div></section>';
  }else{
    body='<section class="cut card">'+brand()+'<div class="rule"></div>'+
      '<div class="thanks">THANK YOU</div><div class="subthanks">FOR YOUR ORDER.</div>'+
      '<p class="message">Your support means a lot.<br>You are part of something greater.</p>'+
      '<div class="rule"></div><div class="field">ORDER #</div>'+
      '<div class="number">'+orderID+'</div><div class="products">'+itemList(items,3)+'</div>'+
      qrPair(qrA,qrB)+'<div class="foot">PACKED WITH PURPOSE.</div></section>';
  }
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>SET APART - '+esc(kind)+' - '+orderID+'</title><style>'+CSS+'</style></head><body>'+
    '<div class="toolbar"><button type="button" onclick="window.print()">PRINT / IMPRIMER</button>'+
    '<p>A4 portrait, 100% scale, no margins. Cut on border. Black and white laser printer.</p></div>'+
    '<main class="page">'+body+'</main></body></html>';
}
module.exports={renderPackaging};
