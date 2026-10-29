// Isolated SET APART-ht PayPal SANDBOX test server.
// Run separately from production. No production DB, emails, or fulfilment.
"use strict";
const express = require("express");
const app = express();
const TESTING_PAUSED = true;
// Explicitly pause the old demo endpoint without touching production checkout.
app.use(function (req,res,next) {
  if (!TESTING_PAUSED) return next();
  res.set("Cache-Control","no-store");
  res.set("X-Robots-Tag","noindex, nofollow");
  if (req.path === "/" || req.path === "/sandbox-checkout.html") {
    return res.status(200).type("html").send(
      '<!doctype html><html lang="ht"><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>SET APART-ht | Tests paused</title>'+
      '<body style="font-family:Arial,sans-serif;background:#111;color:#fff;'+
      'max-width:560px;margin:10vh auto;padding:32px;text-align:center">'+
      '<h1>SET APART-ht&#8482;</h1><p>Tès kòmand yo fèmen.</p>'+
      '<p>Magazen ak Admin kòmand reyèl yo fonksyone nòmalman.</p>'+
      '<a style="color:#fff" href="https://setapart1804-maker.github.io/Set-Apart/index.html">'+
      'RETURN TO STORE</a></body></html>'
    );
  }
  return res.status(410).json({error:"Sandbox testing paused"});
});

app.set("trust proxy",1);
const rateLimit = require("express-rate-limit");
const demoLimiter = rateLimit({windowMs:15*60*1000,limit:25,standardHeaders:true,legacyHeaders:false});
app.use(express.json({limit:"20kb"}));
const PORT = Number(process.env.PORT || process.env.SANDBOX_PORT || 3101);
const CLIENT_ID = process.env.PAYPAL_SANDBOX_CLIENT_ID;
const SECRET = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
const API = "https://api-m.sandbox.paypal.com";
const SYNC_SECRET = process.env.SANDBOX_SYNC_SECRET;
const PAYPAL_READY = Boolean(CLIENT_ID && SECRET);
const auth = PAYPAL_READY ? Buffer.from(CLIENT_ID + ":" + SECRET).toString("base64") : null;
app.disable("x-powered-by");
app.use((_req,res,next)=>{ res.set("Cache-Control","no-store"); res.set("X-Robots-Tag","noindex, nofollow");next(); });
async function accessToken() {
  const response = await fetch(API + "/v1/oauth2/token", {
    method:"POST",
    headers:{"Authorization":"Basic "+auth,"Content-Type":"application/x-www-form-urlencoded"},
    body:"grant_type=client_credentials"
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Sandbox authentication failed");
  return data.access_token;
}
async function paypal(path, token, method, body, requestId) {
  const response = await fetch(API + path, {
    method,
    headers:{
      "Authorization":"Bearer "+token,
      "Content-Type":"application/json",
      "PayPal-Request-Id":requestId
    },
    ...(body ? {body:JSON.stringify(body)} : {})
  });
  const data = await response.json();
  if (!response.ok) throw new Error("PayPal sandbox operation failed: "+(data.name||response.status));
  return data;
}
app.get("/sandbox/config",(_req,res)=>res.json({
  clientId:PAYPAL_READY ? CLIENT_ID : null,
  currency:"USD", environment:"sandbox",
  mode:PAYPAL_READY ? "paypal-sandbox" : "simulation-only"
}));
app.post("/sandbox/demo",demoLimiter, async (req,res)=>{
  const color=String(req.body?.color||"Brown");
  const size=String(req.body?.size||"M");
  if (!["Brown","Black","White"].includes(color)||!["S","M","L","XL"].includes(size)) {
    return res.status(400).json({error:"Invalid sample variant"});
  }
  if (!SYNC_SECRET || SYNC_SECRET.length<32) {
    return res.status(503).json({error:"Test order sync is not configured"});
  }
  const id="SA-TEST-"+require("crypto").randomBytes(5).toString("hex").toUpperCase();
  try {
    const saved=await fetch("https://set-apart.onrender.com/internal/sandbox/test-orders",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-sandbox-sync-key":SYNC_SECRET},
      body:JSON.stringify({id,color,size}),
      signal:AbortSignal.timeout(12000)
    });
    if(!saved.ok)throw Error("Admin sync returned "+saved.status);
    const result=await saved.json();
    if(result.success!==true || result.testOrderID!==id)throw Error("Admin sync not confirmed");
    return res.json({id,status:"SIMULATED",product:"Pilgrim Hoodie",color,size,quantity:1,
      amount:"1.00",currency:"USD",persisted:true,paymentCaptured:false});
  }catch(error){
    console.error("Sandbox order was not synced:",error.message);
    return res.status(502).json({error:"Could not save the test order in Admin; retry later."});
  }
});
app.get("/",(_req,res)=>res.redirect("/sandbox-checkout.html"));
app.post("/sandbox/create",async(_req,res)=>{
  if (!PAYPAL_READY) return res.status(503).json({error:"PayPal sandbox credentials not yet configured"});
  try {
    const token=await accessToken();
    const data=await paypal("/v2/checkout/orders",token,"POST",{
      intent:"CAPTURE",
      purchase_units:[{
        reference_id:"SETAPART-SANDBOX-TEST",
        description:"TEST ONLY - SET APART-ht sample order",
        amount:{currency_code:"USD",value:"1.00"}
      }]
    },"sa-test-create-"+require("crypto").randomUUID());
    res.json({id:data.id,environment:"sandbox"});
  } catch(e){res.status(502).json({error:e.message});}
});
app.post("/sandbox/capture/:id",async(req,res)=>{
  if (!PAYPAL_READY) return res.status(503).json({error:"PayPal sandbox credentials not yet configured"});
  try {
    const id=String(req.params.id||"");
    if (!/^[A-Z0-9]{10,30}$/.test(id)) return res.status(400).json({error:"Invalid order ID"});
    const token=await accessToken();
    // Verify the order was created for this sandbox test before capture.
    const order=await paypal("/v2/checkout/orders/"+encodeURIComponent(id),token,"GET",null,"sa-test-get-"+id);
    if (order.purchase_units?.[0]?.reference_id!=="SETAPART-SANDBOX-TEST" ||
        order.purchase_units?.[0]?.amount?.value!=="1.00") {
      return res.status(403).json({error:"Not a test order"});
    }
    const captured=await paypal("/v2/checkout/orders/"+encodeURIComponent(id)+"/capture",token,"POST",{},"sa-test-capture-"+id);
    res.json({id:captured.id,status:captured.status,environment:"sandbox"});
  } catch(e){res.status(502).json({error:e.message});}
});
app.get("/sandbox-checkout.html",(_req,res)=>res.sendFile(require("path").join(__dirname,"sandbox-checkout.html")));
app.get("/sandbox-admin.html",(_req,res)=>res.sendFile(require("path").join(__dirname,"sandbox-admin.html")));
app.listen(PORT,()=>console.log("SET APART sandbox only: http://localhost:"+PORT+"/sandbox-checkout.html"));
