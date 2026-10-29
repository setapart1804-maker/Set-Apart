// Isolated SET APART-ht PayPal SANDBOX test server.
// Run separately from production. No production DB, emails, or fulfilment.
"use strict";
const express = require("express");
const app = express();
app.use(express.json({limit:"20kb"}));
const PORT = Number(process.env.SANDBOX_PORT || 3101);
const CLIENT_ID = process.env.PAYPAL_SANDBOX_CLIENT_ID;
const SECRET = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
const API = "https://api-m.sandbox.paypal.com";
if (!CLIENT_ID || !SECRET) {
  console.error("Set PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET.");
  process.exit(1);
}
const auth = Buffer.from(CLIENT_ID + ":" + SECRET).toString("base64");
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
app.get("/sandbox/config",(_req,res)=>res.json({clientId:CLIENT_ID,currency:"USD",environment:"sandbox"}));
app.post("/sandbox/create",async(_req,res)=>{
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
app.use(express.static(__dirname,{index:false}));
app.listen(PORT,()=>console.log("SET APART sandbox only: http://localhost:"+PORT+"/sandbox-checkout.html"));
