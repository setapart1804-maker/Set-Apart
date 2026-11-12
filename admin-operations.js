"use strict";
const express = require("express");
module.exports=function adminOperations(app, deps) {
  "use strict";
  const {db, adminBasicAuth, adminLimiter, setAdminSecurityHeaders,
    createAdminCsrfToken, verifyAdminCsrfToken, catalog, adminUsername, stockCommerce} = deps;
  const auth = [adminLimiter, adminBasicAuth, (req,res,next)=>{setAdminSecurityHeaders(res);next();}];
  const clean = v => String(v == null ? "" : v).trim();
  const fail = (res,code,message) => res.status(code).json({success:false,error:message});
  const tokenValid = req => verifyAdminCsrfToken("admin-ops","mutation",clean(req.body&&req.body.csrf));
  const asyncRoute = fn => async (req,res) => {
    try {await fn(req,res)} catch (err) {
      console.error("Admin operations error:",err);
      if(!res.headersSent) fail(res,500,"Operasyon an pa reyisi. Verifye koneksyon bazdone a.");
    }
  };
  const splitList = v => Array.isArray(v)?v.map(clean).filter(Boolean):
    clean(v).split(",").map(clean).filter(Boolean);
  let schemaPromise=null;
  function ensureSchema(){
    if(!schemaPromise){
      schemaPromise=(async()=>{
        await db(`CREATE TABLE IF NOT EXISTS admin_catalog (
          id VARCHAR(40) PRIMARY KEY,
          name VARCHAR(160) NOT NULL,
          price_usd NUMERIC(10,2) NOT NULL CHECK(price_usd > 0),
          colors TEXT[] NOT NULL DEFAULT '{}',
          sizes TEXT[] NOT NULL DEFAULT '{}',
          image_url TEXT NOT NULL DEFAULT '',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        await db(`CREATE TABLE IF NOT EXISTS admin_catalog_images (
          product_id VARCHAR(40) PRIMARY KEY REFERENCES admin_catalog(id) ON DELETE CASCADE,
          content_type VARCHAR(24) NOT NULL,
          image_bytes BYTEA NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        await db(`CREATE TABLE IF NOT EXISTS admin_stock (
          product_id VARCHAR(40) NOT NULL REFERENCES admin_catalog(id) ON DELETE CASCADE,
          color VARCHAR(45) NOT NULL,
          size VARCHAR(20) NOT NULL,
          on_hand INTEGER NOT NULL DEFAULT 0 CHECK(on_hand >= 0),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY(product_id,color,size)
        )`);
        await db(`CREATE TABLE IF NOT EXISTS admin_service_cases (
          id BIGSERIAL PRIMARY KEY,
          paypal_order_id VARCHAR(100) NOT NULL REFERENCES orders(paypal_order_id),
          kind VARCHAR(20) NOT NULL CHECK(kind IN ('RETURN','EXCHANGE','REFUND')),
          status VARCHAR(24) NOT NULL DEFAULT 'OPEN'
            CHECK(status IN ('OPEN','REVIEWING','AWAITING_PAYPAL','RESOLVED','CLOSED')),
          notes TEXT NOT NULL DEFAULT '',
          resolution_reference TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        await db(`CREATE TABLE IF NOT EXISTS admin_order_costs (
          paypal_order_id VARCHAR(100) PRIMARY KEY REFERENCES orders(paypal_order_id),
          production_usd NUMERIC(12,2) NOT NULL CHECK(production_usd>=0),
          paypal_fee_usd NUMERIC(12,2) NOT NULL CHECK(paypal_fee_usd>=0),
          packing_usd NUMERIC(12,2) NOT NULL CHECK(packing_usd>=0),
          delivery_usd NUMERIC(12,2) NOT NULL CHECK(delivery_usd>=0),
          other_usd NUMERIC(12,2) NOT NULL CHECK(other_usd>=0),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        await db(`CREATE TABLE IF NOT EXISTS admin_audit_log (
          id BIGSERIAL PRIMARY KEY,
          actor VARCHAR(160) NOT NULL,
          action VARCHAR(90) NOT NULL,
          target VARCHAR(180) NOT NULL,
          details JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        for(const [id,p] of Object.entries(catalog||{})){
          await db(`INSERT INTO admin_catalog(id,name,price_usd,colors,sizes)
            VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING`,
            [id,p.name,p.price,p.colors,p.sizes]);
        }
        // The storefront also has these two T-shirts in script.js.
        // Seed them in the admin catalog without changing the checkout product
        // whitelist or overwriting products already edited in the dashboard.
        const existingStorefrontTShirts = [
          {
            id:"teepilgrim",name:"PILGRIM T-SHIRT",price:24.99,
            colors:["beige","brown","black","white"],sizes:["S","M","L","XL"],
            image_url:"https://setapart-ht.com/t-shirt%20pilgrim%20brown%20front.png"
          },
          {
            id:"teegodfirst",name:"GOD FIRST T-SHIRT",price:24.99,
            colors:["beige","brown","black","white"],sizes:["S","M","L","XL"],
            image_url:"https://setapart-ht.com/t-shirt%20god%20first%20white%20front.png"
          }
        ];
        for(const p of existingStorefrontTShirts){
          await db(`INSERT INTO admin_catalog(id,name,price_usd,colors,sizes,image_url,active)
            VALUES($1,$2,$3,$4,$5,$6,TRUE) ON CONFLICT(id) DO NOTHING`,
            [p.id,p.name,p.price,p.colors,p.sizes,p.image_url]);
        }
      })().catch(e=>{schemaPromise=null;throw e});
    }
    return schemaPromise;
  }
  async function audit(action,target,details){
    await ensureSchema();
    await db(`INSERT INTO admin_audit_log(actor,action,target,details)
      VALUES($1,$2,$3,$4::jsonb)`,
      [clean(adminUsername||"admin").slice(0,150),action.slice(0,90),clean(target).slice(0,180),JSON.stringify(details||{})]);
  }
  const requireMutation = (req,res) => {
    if (!tokenValid(req)) {fail(res,403,"Jeton sekirite admin lan pa valab.");return false}
    return true;
  };
  function parseDate(value){
    const v=clean(value);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;
    const d=new Date(v+"T00:00:00.000Z");
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:null;
  }
  function range(req,res){
    const today=new Date().toISOString().slice(0,10);
    let from=parseDate(req.query.from),to=parseDate(req.query.to);
    if(!from||!to){
      to=today;
      from=new Date(Date.now()-29*86400000).toISOString().slice(0,10);
    }
    const duration=(Date.parse(to)-Date.parse(from))/86400000;
    if(duration<0||duration>3660){fail(res,400,"Peryòd la pa valab (maksimòm 10 lane).");return null}
    const tomorrow=new Date(Date.parse(to)+86400000).toISOString().slice(0,10);
    return {from,to,tomorrow};
  }
  const csvCell = value => {
    let v=String(value==null?"":value).replace(/[\r\n]+/g," ");
    if(/^[\t =+\-@]/.test(v)) v="'"+v;
    return '"'+v.replace(/"/g,'""')+'"';
  };
  app.get("/admin/ops/alerts",...auth,asyncRoute(async(req,res)=>{
    const r=await db(`SELECT paypal_order_id,first_name,last_name,created_at,total_usd,
      order_status FROM orders WHERE payment_status='COMPLETED'
      AND order_status IN ('PAID','PROCESSING','READY_FOR_PICKUP')
      ORDER BY created_at DESC LIMIT 12`);
    const count=await db(`SELECT order_status,COUNT(*)::int AS total FROM orders
      WHERE payment_status='COMPLETED'
      AND order_status IN ('PAID','PROCESSING','READY_FOR_PICKUP')
      GROUP BY order_status`);
    await ensureSchema();
    // Count all recorded low-stock variants separately from the bounded preview.
    const lowTotal=await db(`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER(WHERE s.on_hand=0)::int AS sold_out,
      COUNT(*) FILTER(WHERE s.on_hand BETWEEN 1 AND 3)::int AS low_remaining
      FROM admin_stock s JOIN admin_catalog p ON p.id=s.product_id
      WHERE p.active=TRUE AND s.on_hand<=3`);
    const low=await db(`SELECT p.name,s.product_id,s.color,s.size,s.on_hand
      FROM admin_stock s JOIN admin_catalog p ON p.id=s.product_id
      WHERE p.active=TRUE AND s.on_hand<=3
      ORDER BY s.on_hand,p.name,s.color,s.size LIMIT 30`);
    const counts={PAID:0,PROCESSING:0,READY_FOR_PICKUP:0};
    for(const row of count.rows)if(Object.prototype.hasOwnProperty.call(counts,row.order_status))
      counts[row.order_status]=Number(row.total)||0;
    res.json({success:true,total:Object.values(counts).reduce((a,b)=>a+b,0),
      counts,orders:r.rows,low_stock:low.rows,low_stock_total:Number(lowTotal.rows[0]?.total||0),
      sold_out_total:Number(lowTotal.rows[0]?.sold_out||0),
      low_remaining_total:Number(lowTotal.rows[0]?.low_remaining||0)});
  }));
  app.get("/admin/ops/analytics",...auth,asyncRoute(async(req,res)=>{
    const p=range(req,res);if(!p)return;
    const args=[p.from,p.tomorrow];
    const totals=await db(`SELECT COUNT(*)::int AS orders,
      COUNT(*) FILTER(WHERE payment_status='COMPLETED')::int AS paid_orders,
      COALESCE(SUM(total_usd) FILTER(WHERE payment_status='COMPLETED'),0) AS revenue,
      COALESCE(SUM(shipping_usd) FILTER(WHERE payment_status='COMPLETED'),0) AS shipping
      FROM orders WHERE created_at >= $1::date AND created_at < $2::date`,args);
    const daily=await db(`SELECT (created_at AT TIME ZONE 'UTC')::date AS day,
      COALESCE(SUM(total_usd) FILTER(WHERE payment_status='COMPLETED'),0) AS revenue,
      COUNT(*) FILTER(WHERE payment_status='COMPLETED')::int AS orders
      FROM orders WHERE created_at >= $1::date AND created_at < $2::date
      GROUP BY (created_at AT TIME ZONE 'UTC')::date ORDER BY day`,args);
    const products=await db(`SELECT oi.product_name AS name,
      SUM(oi.quantity)::int AS quantity,
      COALESCE(SUM(oi.line_total_usd),0) AS revenue
      FROM order_items oi JOIN orders o ON o.id=oi.order_id
      WHERE o.payment_status='COMPLETED' AND o.created_at >= $1::date
        AND o.created_at < $2::date
      GROUP BY oi.product_name ORDER BY quantity DESC LIMIT 25`,args);
    await ensureSchema();
    const costs=await db(`SELECT
      COUNT(*)::int AS paid_orders,
      COUNT(c.paypal_order_id)::int AS costed_orders,
      COALESCE(SUM(o.total_usd) FILTER(WHERE c.paypal_order_id IS NOT NULL),0) AS costed_revenue,
      COALESCE(SUM(c.production_usd+c.paypal_fee_usd+c.packing_usd+c.delivery_usd+c.other_usd),0) AS expenses
      FROM orders o LEFT JOIN admin_order_costs c ON c.paypal_order_id=o.paypal_order_id
      WHERE o.payment_status='COMPLETED'
        AND o.created_at >= $1::date AND o.created_at < $2::date`,args);
    const row=costs.rows[0],complete=Number(row.costed_orders)===Number(row.paid_orders);
    const margin=(Number(row.costed_revenue)-Number(row.expenses)).toFixed(2);
    res.json({success:true,from:p.from,to:p.to,totals:totals.rows[0],daily:daily.rows,products:products.rows,
      finance:{paid_orders:Number(row.paid_orders),costed_orders:Number(row.costed_orders),
        expenses_usd:row.expenses,
        net_profit_usd:complete?margin:null,order_margin_usd:complete?margin:null,fully_recorded:complete},
      note:complete?"Recorded order margin = paid order totals minus entered production, PayPal, packaging, delivery and other order costs. It is NOT company net profit: overhead, taxes, refunds and unrecorded costs may be excluded. Verify entries against receipts.":
      "Order margin unavailable until every paid order in the period has actual cost entries. This is not company net profit."});
  }));
  // Read-only worklist: paid orders that still need expense entries in this date range.
  app.get("/admin/ops/uncosted-orders",...auth,asyncRoute(async(req,res)=>{
    const p=range(req,res);if(!p)return;
    await ensureSchema();
    const result=await db(`SELECT o.paypal_order_id,o.created_at,o.total_usd,
      COUNT(*) OVER()::int AS missing_total
      FROM orders o LEFT JOIN admin_order_costs c ON c.paypal_order_id=o.paypal_order_id
      WHERE o.payment_status='COMPLETED' AND c.paypal_order_id IS NULL
        AND o.created_at >= $1::date AND o.created_at < $2::date
      ORDER BY o.created_at DESC LIMIT 25`,[p.from,p.tomorrow]);
    res.json({success:true,from:p.from,to:p.to,
      missing_total:Number(result.rows[0]?.missing_total||0),
      orders:result.rows.map(o=>({paypal_order_id:o.paypal_order_id,
        created_at:o.created_at,total_usd:o.total_usd}))});
  }));
  // Read-only verified PayPal fee lookup. No payment capture, refund or database write.
  app.get("/admin/ops/paypal-fee",...auth,asyncRoute(async(req,res)=>{
    const id=clean(req.query.order_id);
    if(!/^[a-zA-Z0-9-]{5,100}$/.test(id))return fail(res,400,"Invalid PayPal order ID.");
    const record=await db("SELECT paypal_capture_id FROM orders WHERE paypal_order_id=$1 AND payment_status='COMPLETED' LIMIT 1",[id]);
    if(!record.rows.length)return fail(res,404,"Paid order not found.");
    const capture=clean(record.rows[0].paypal_capture_id);
    if(!/^[A-Za-z0-9]{8,100}$/.test(capture))
      return res.json({success:true,available:false,reason:"No verified capture ID recorded for this order. Enter the fee from your PayPal statement."});
    const clientId=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;
    if(!clientId||!secret)
      return res.json({success:true,available:false,reason:"PayPal credentials unavailable. Check your PayPal statement."});
    try{
      const authHeader="Basic "+Buffer.from(clientId+":"+secret).toString("base64");
      const tokenResponse=await fetch("https://api-m.paypal.com/v1/oauth2/token",{
        method:"POST",headers:{Authorization:authHeader,"Content-Type":"application/x-www-form-urlencoded"},
        body:"grant_type=client_credentials",signal:AbortSignal.timeout(8000)});
      if(!tokenResponse.ok)throw Error("PayPal token unavailable");
      const token=await tokenResponse.json();
      if(!token.access_token)throw Error("PayPal access token missing");
      const feeResponse=await fetch("https://api-m.paypal.com/v2/payments/captures/"+encodeURIComponent(capture),{
        headers:{Authorization:"Bearer "+token.access_token},signal:AbortSignal.timeout(8000)});
      if(!feeResponse.ok)throw Error("PayPal capture lookup unavailable");
      const data=await feeResponse.json();
      const fee=data.seller_receivable_breakdown?.paypal_fee;
      if(data.id!==capture||data.status!=="COMPLETED"||fee?.currency_code!=="USD"||
         !/^\d+(\.\d{1,2})?$/.test(String(fee.value||"")))
        return res.json({success:true,available:false,reason:"No confirmed USD PayPal fee found. Check your PayPal statement."});
      res.json({success:true,available:true,fee_usd:Number(fee.value).toFixed(2),
        source:"PayPal verified capture",capture_id:capture});
    }catch(e){
      console.warn("PayPal fee read-only lookup unavailable:",e.message);
      res.json({success:true,available:false,reason:"Could not verify PayPal fee now. Check your PayPal statement."});
    }
  }));
  // Manual cost entries are independent of PayPal, order status and stock.
  app.post("/admin/ops/order-costs",...auth,asyncRoute(async(req,res)=>{
    if(!requireMutation(req,res))return;
    const id=clean(req.body.order_id);
    const keys=["production_usd","paypal_fee_usd","packing_usd","delivery_usd","other_usd"];
    const raw=keys.map(k=>req.body[k]);
    if(!/^[a-zA-Z0-9-]{5,100}$/.test(id))return fail(res,400,"Invalid PayPal order ID.");
    if(raw.some(v=>v==null||String(v).trim()===""))
      return fail(res,400,"Enter all 5 expenses; zero is valid only when the cost is really zero.");
    if(raw.some(v=>!/^\d+(\.\d{1,2})?$/.test(String(v).trim())))
      return fail(res,400,"Use positive USD amounts with at most 2 decimal places.");
    const amounts=raw.map(Number);
    if(amounts.some(n=>!Number.isFinite(n)||n>1000000))
      return fail(res,400,"Expense amount out of range.");
    await ensureSchema();
    const found=await db("SELECT paypal_order_id FROM orders WHERE paypal_order_id=$1 AND payment_status='COMPLETED' LIMIT 1",[id]);
    if(!found.rows.length)return fail(res,404,"Paid order not found.");
    await db(`INSERT INTO admin_order_costs
      (paypal_order_id,production_usd,paypal_fee_usd,packing_usd,delivery_usd,other_usd)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(paypal_order_id) DO UPDATE SET
      production_usd=EXCLUDED.production_usd,paypal_fee_usd=EXCLUDED.paypal_fee_usd,
      packing_usd=EXCLUDED.packing_usd,delivery_usd=EXCLUDED.delivery_usd,
      other_usd=EXCLUDED.other_usd,updated_at=NOW()`,[id,...amounts]);
    try{await audit("ORDER_COSTS_SAVED",id,{cost_recorded:true})}catch(e){console.error("Audit cost record",e)}
    res.json({success:true,message:"Actual expenses saved; no payment, stock or order status changed."});
  }));
  app.get("/admin/ops/customers",...auth,asyncRoute(async(req,res)=>{
    const q=clean(req.query.q).slice(0,100);
    const r=await db(`SELECT LOWER(customer_email) AS email,
      MAX(first_name) AS first_name,MAX(last_name) AS last_name,
      MAX(phone) AS phone,MAX(city) AS city,MAX(country) AS country,
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER(WHERE payment_status='COMPLETED')::int AS paid_orders,
      COALESCE(SUM(total_usd) FILTER(WHERE payment_status='COMPLETED'),0) AS spend
      FROM orders WHERE ($1='' OR customer_email ILIKE '%'||$1||'%'
         OR first_name ILIKE '%'||$1||'%' OR last_name ILIKE '%'||$1||'%')
      GROUP BY LOWER(customer_email) ORDER BY total_orders DESC LIMIT 100`,[q]);
    res.json({success:true,customers:r.rows});
  }));
  app.get("/admin/ops/customer-history",...auth,asyncRoute(async(req,res)=>{
    const email=clean(req.query.email).toLowerCase().slice(0,255);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail(res,400,"Imèl kliyan an pa valab.");
    const rows=await db(`SELECT paypal_order_id,created_at,order_status,payment_status,
      total_usd,city,country,shipping_method,carrier,tracking_number
      FROM orders WHERE LOWER(customer_email)=$1 ORDER BY created_at DESC LIMIT 200`,[email]);
    res.json({success:true,email,orders:rows.rows});
  }));
  app.get("/admin/ops/export.csv",...auth,asyncRoute(async(req,res)=>{
    const p=range(req,res);if(!p)return;
    const status=clean(req.query.status).toUpperCase().slice(0,32);
    if(status&&!/^[A-Z_]{3,32}$/.test(status))return fail(res,400,"Estati sa a pa valab.");
    const r=await db(`SELECT paypal_order_id,created_at,first_name,last_name,
      customer_email,country,city,shipping_method,payment_status,order_status,total_usd
      FROM orders WHERE created_at >= $1::date AND created_at < $2::date
       AND ($3='' OR order_status=$3) ORDER BY created_at DESC LIMIT 5000`,
      [p.from,p.tomorrow,status]);
    const names=["Order ID","Date UTC","First name","Last name","Email","Country","City","Delivery method","Payment status","Order status","Total USD"];
    const lines=[names.map(csvCell).join(",")];
    for(const row of r.rows){
      lines.push(["paypal_order_id","created_at","first_name","last_name","customer_email","country","city","shipping_method","payment_status","order_status","total_usd"].map(k=>csvCell(row[k] instanceof Date?row[k].toISOString():row[k])).join(","));
    }
    res.set("Content-Type","text/csv; charset=utf-8");
    res.set("Content-Disposition",`attachment; filename="setapart-orders-${p.from}-${p.to}.csv"`);
    res.send("\uFEFF"+lines.join("\r\n")+"\r\n");
  }));
  /* Public storefront reads only published catalog records and available stock.
     Administrative endpoints and credentials never appear here. */
  app.get("/api/catalog",asyncRoute(async(req,res)=>{
    await stockCommerce.ensure();
    const rows=await db(`SELECT p.id,p.name,p.price_usd,p.colors,p.sizes,
      CASE WHEN i.product_id IS NOT NULL THEN '/api/catalog/images/'||p.id
           ELSE p.image_url END AS image_url,
      p.updated_at,
      EXISTS(SELECT 1 FROM admin_catalog_images x WHERE x.product_id=p.id) AS has_uploaded_image
      FROM admin_catalog p
      LEFT JOIN admin_catalog_images i ON i.product_id=p.id
      WHERE p.active=TRUE
      ORDER BY p.updated_at DESC,p.name LIMIT 300`);
    const inventory=await db(`SELECT s.product_id,s.color,s.size,
      GREATEST(0,s.on_hand-COALESCE((
        SELECT SUM(h.quantity) FROM admin_catalog_checkout_holds h
        WHERE h.product_id=s.product_id AND h.color=s.color AND h.size=s.size
          AND h.state='HELD' AND h.expires_at>NOW()
      ),0))::int AS on_hand
      FROM admin_stock s JOIN admin_catalog p ON p.id=s.product_id
      WHERE p.active=TRUE ORDER BY s.product_id,s.color,s.size LIMIT 4000`);
    res.json({success:true,products:rows.rows.map(p=>({
      id:p.id,name:p.name,price_usd:Number(p.price_usd),
      colors:p.colors,sizes:p.sizes,image_url:p.image_url,
      updated_at:p.updated_at
    })),stock:inventory.rows});
  }));
  app.get("/api/catalog/images/:id",asyncRoute(async(req,res)=>{
    const id=clean(req.params.id);
    if(!/^[a-z0-9-]{2,40}$/.test(id))return res.status(404).end();
    await ensureSchema();
    const r=await db(`SELECT i.content_type,i.image_bytes
      FROM admin_catalog_images i JOIN admin_catalog p ON p.id=i.product_id
      WHERE p.active=TRUE AND p.id=$1 LIMIT 1`,[id]);
    if(!r.rows.length)return res.status(404).end();
    res.set("Content-Type",r.rows[0].content_type);
    res.set("Content-Disposition","inline");
    res.set("X-Content-Type-Options","nosniff");
    return res.send(r.rows[0].image_bytes);
  }));
  app.post("/admin/ops/products/:id/image",
    ...auth,express.raw({type:["image/png","image/jpeg","image/webp"],limit:"2mb"}),
    asyncRoute(async(req,res)=>{
      if(!verifyAdminCsrfToken("admin-ops","mutation",clean(req.headers["x-admin-csrf"])))
        return fail(res,403,"Invalid admin security token.");
      const id=clean(req.params.id).toLowerCase();
      const body=req.body;
      const ct=clean(req.headers["content-type"]).split(";")[0];
      if(!/^[a-z0-9-]{2,40}$/.test(id)||!Buffer.isBuffer(body)||body.length<100||body.length>2097152)
        return fail(res,400,"Invalid product photo or size (maximum 2 MB).");
      const valid=(ct==="image/png"&&body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||
       (ct==="image/jpeg"&&body[0]===255&&body[1]===216&&body[2]===255)||
       (ct==="image/webp"&&body.toString("ascii",0,4)==="RIFF"&&body.toString("ascii",8,12)==="WEBP");
      if(!valid)return fail(res,400,"Only valid PNG, JPEG and WebP images are supported.");
      await ensureSchema();
      const product=await db("SELECT id FROM admin_catalog WHERE id=$1",[id]);
      if(!product.rows.length)return fail(res,404,"Save the product before uploading its photo.");
      await db(`INSERT INTO admin_catalog_images(product_id,content_type,image_bytes)
        VALUES($1,$2,$3) ON CONFLICT(product_id)
        DO UPDATE SET content_type=EXCLUDED.content_type,image_bytes=EXCLUDED.image_bytes,
                      updated_at=NOW()`,[id,ct,body]);
      try{await audit("CATALOG_IMAGE",id,{type:ct,bytes:body.length})}catch(e){console.error("Photo audit:",e)}
      res.json({success:true,image_url:"/api/catalog/images/"+id});
    }));
  /* Remove an admin catalog photo without deleting the product or storefront assets. */
  app.post("/admin/ops/products/:id/remove-image",...auth,asyncRoute(async(req,res)=>{
    if(!requireMutation(req,res))return;
    const id=clean(req.params.id).toLowerCase();
    if(!/^[a-z0-9-]{2,40}$/.test(id))return fail(res,400,"Invalid product ID.");
    await ensureSchema();
    const existing=await db("SELECT id FROM admin_catalog WHERE id=$1",[id]);
    if(!existing.rows.length)return fail(res,404,"Product not found.");
    await db("DELETE FROM admin_catalog_images WHERE product_id=$1",[id]);
    await db("UPDATE admin_catalog SET image_url='',updated_at=NOW() WHERE id=$1",[id]);
    try{await audit("CATALOG_IMAGE_REMOVED",id,{})}catch(e){console.error("Photo removal audit:",e)}
    res.json({success:true,message:"Product photo removed from admin catalog."});
  }));
  app.get("/admin/ops/products",...auth,asyncRoute(async(req,res)=>{
    await ensureSchema();
    const a=await db(`SELECT p.*, CASE WHEN i.product_id IS NOT NULL THEN '/api/catalog/images/'||p.id ELSE p.image_url END AS published_image_url FROM admin_catalog p LEFT JOIN admin_catalog_images i ON i.product_id=p.id ORDER BY p.name`);
    const b=await db(`SELECT * FROM admin_stock ORDER BY product_id,color,size`);
    res.json({success:true,products:a.rows,stock:b.rows,
      warning:"Active admin products appear on the storefront. New products use server-verified pricing, checkout, and available stock."});
  }));
  app.post("/admin/ops/products",...auth,asyncRoute(async(req,res)=>{
    if(!requireMutation(req,res))return;
    const id=clean(req.body.id).toLowerCase(), name=clean(req.body.name);
    const price=Number(req.body.price),colors=splitList(req.body.colors).map(v=>v.toLowerCase()),
      sizes=splitList(req.body.sizes).map(v=>v.toUpperCase());
    const url=clean(req.body.image_url),active=req.body.active===true||req.body.active==="true";
    if(!/^[a-z0-9-]{2,40}$/.test(id)||name.length<2||name.length>160||
       !Number.isFinite(price)||price<=0||price>10000||
       colors.length<1||colors.length>20||sizes.length<1||sizes.length>20||
       colors.some(v=>v.length>45)||sizes.some(v=>v.length>20)||
       url.length>500|| (url&&!/^(https:\/\/|\/assets\/)[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/.test(url)))
      return fail(res,400,"Non, ID, pri, koulè, gwosè oswa URL foto a pa valab.");
    await ensureSchema();
    const r=await db(`INSERT INTO admin_catalog(id,name,price_usd,colors,sizes,image_url,active,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,NOW())
      ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,price_usd=EXCLUDED.price_usd,
      colors=EXCLUDED.colors,sizes=EXCLUDED.sizes,image_url=EXCLUDED.image_url,
      active=EXCLUDED.active,updated_at=NOW() RETURNING *`,
      [id,name,price,colors,sizes,url,active]);
    try{await audit("CATALOG_SAVE",id,{name,price,active})}catch(e){console.error("Audit catalog failed:",e)}
    res.json({success:true,product:r.rows[0],warning:"Active new products appear on the storefront; PayPal uses the price and available stock from the database."});
  }));
  app.post("/admin/ops/stock",...auth,asyncRoute(async(req,res)=>{
    if(!requireMutation(req,res))return;
    const id=clean(req.body.product_id).toLowerCase(),color=clean(req.body.color).toLowerCase(),
      size=clean(req.body.size).toUpperCase(),amount=Number(req.body.on_hand);
    if(!/^[a-z0-9-]{2,40}$/.test(id)||!color||color.length>45||!size||
       size.length>20||!Number.isSafeInteger(amount)||amount<0||amount>100000)
      return fail(res,400,"Variant oswa kantite a pa valab.");
    await ensureSchema();
    const product=await db(`SELECT id FROM admin_catalog WHERE id=$1 AND $2=ANY(colors) AND $3=ANY(sizes)`,
      [id,color,size]);
    if(!product.rows.length)return fail(res,404,"Pwodwi oswa variant lan pa egziste.");
    try{
      await stockCommerce.setStock({id,color,size,amount});
    }catch(error){
      if(error.status===409)return fail(res,409,error.message);
      throw error;
    }
    try{await audit("STOCK_SET",id,{color,size,on_hand:amount})}catch(e){console.error("Audit stock failed:",e)}
    res.json({success:true,warning:"Stock is checked at PayPal checkout for new catalog products."});
  }));
  app.get("/admin/ops/cases",...auth,asyncRoute(async(req,res)=>{
    await ensureSchema();
    const r=await db(`SELECT id,paypal_order_id,kind,status,notes,resolution_reference,
      created_at,updated_at FROM admin_service_cases ORDER BY created_at DESC LIMIT 150`);
    res.json({success:true,cases:r.rows});
  }));
  app.post("/admin/ops/cases",...auth,asyncRoute(async(req,res)=>{
    if(!requireMutation(req,res))return;
    const id=clean(req.body.order_id),kind=clean(req.body.kind).toUpperCase(),notes=clean(req.body.notes);
    if(!id||id.length>100||!["RETURN","EXCHANGE","REFUND"].includes(kind)||notes.length>2000)
      return fail(res,400,"Kòmann, tip dosye oswa nòt la pa valab.");
    await ensureSchema();
    const exists=await db(`SELECT paypal_order_id FROM orders WHERE paypal_order_id=$1 LIMIT 1`,[id]);
    if(!exists.rows.length)return fail(res,404,"Kòmann sa a pa egziste.");
    const r=await db(`INSERT INTO admin_service_cases(paypal_order_id,kind,notes)
      VALUES($1,$2,$3) RETURNING *`,[id,kind,notes]);
    try{await audit("CASE_OPEN",id,{case_id:r.rows[0].id,kind})}catch(e){console.error("Audit case failed:",e)}
    res.json({success:true,record:r.rows[0],warning:"Sa pa lanse okenn ranbousman PayPal."});
  }));
  app.post("/admin/ops/cases/:id/status",...auth,asyncRoute(async(req,res)=>{
    if(!requireMutation(req,res))return;
    const id=Number(req.params.id),status=clean(req.body.status).toUpperCase(),
      ref=clean(req.body.resolution_reference);
    if(!Number.isSafeInteger(id)||id<1||!["OPEN","REVIEWING","AWAITING_PAYPAL","RESOLVED","CLOSED"].includes(status)||ref.length>200)
      return fail(res,400,"ID dosye oswa estati a pa valab.");
    await ensureSchema();
    const r=await db(`UPDATE admin_service_cases SET status=$2,resolution_reference=$3,updated_at=NOW()
      WHERE id=$1 RETURNING *`,[id,status,ref]);
    if(!r.rows.length)return fail(res,404,"Dosye sa a pa egziste.");
    try{await audit("CASE_STATUS",r.rows[0].paypal_order_id,{case_id:id,status,reference:ref})}catch(e){console.error("Audit case status failed:",e)}
    res.json({success:true,record:r.rows[0]});
  }));
  app.get("/admin/ops/audit",...auth,asyncRoute(async(req,res)=>{
    await ensureSchema();
    const r=await db(`SELECT id,actor,action,target,details,created_at
      FROM admin_audit_log ORDER BY created_at DESC LIMIT 100`);
    res.json({success:true,entries:r.rows});
  }));
  app.get("/admin/logged-out",(req,res)=>{
    setAdminSecurityHeaders(res);
    res.type("html").send('<!doctype html><html lang="ht"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SET APART-ht — Sesyon fèmen</title><body style="font:16px system-ui;max-width:620px;margin:12vh auto;padding:24px"><h1>Sesyon sou aparèy sa a fèmen.</h1><p>Bonbon sesyon pèmanan an efase. Si navigatè a toujou sonje HTTP Basic Auth, fèmen navigatè a nèt pou w pa retounen otomatikman nan administrasyon an.</p><a href="https://setapart-ht.com">Ale sou sit SET APART-ht™</a></body></html>');
  });
  return {ensureSchema,audit};
};
