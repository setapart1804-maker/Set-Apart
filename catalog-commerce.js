"use strict";
/*
 * SET APART — server-authoritative checkout for NEW admin-managed products.
 * Existing original collection products remain sold out and are excluded.
 * Stock is held for 30 minutes before capture, then deducted exactly once
 * when payment is recorded (including PayPal webhook reconciliation).
 */
const crypto=require("crypto");
const LEGACY_IDS=new Set(["pilgrim","godfirst","teepilgrim","teegodfirst"]);
const HOLD_MINUTES=30;
const number=v=>Number(v);
function error(message,status=409){const e=new Error(message);e.status=status;return e}
function cents(v){
 const n=number(v);
 if(!Number.isFinite(n)||n<=0||n>10000)throw error("Invalid catalog price.",400);
 return Math.round(n*100);
}
function usd(value){return (value/100).toFixed(2)}
module.exports=function createCatalogCommerce({pool,db,calculateShipping,ensureCatalogSchema}){
 let init=null;
 async function ensure(){
  if(!init){
   init=(async()=>{
    await ensureCatalogSchema();
    await db([
      "CREATE TABLE IF NOT EXISTS admin_catalog_checkout_holds (",
      " id BIGSERIAL PRIMARY KEY,",
      " hold_group UUID NOT NULL,",
      " paypal_order_id VARCHAR(100),",
      " product_id VARCHAR(40) NOT NULL,",
      " color VARCHAR(45) NOT NULL,",
      " size VARCHAR(20) NOT NULL,",
      " quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 1000),",
      " state VARCHAR(12) NOT NULL DEFAULT 'HELD'",
      "   CHECK(state IN ('HELD','CONSUMED','RELEASED')),",
      " expires_at TIMESTAMPTZ NOT NULL,",
      " created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),",
      " UNIQUE(hold_group,product_id,color,size)",
      ")"
    ].join(" "));
    await db("CREATE INDEX IF NOT EXISTS idx_catalog_holds_product ON admin_catalog_checkout_holds(product_id,color,size,state,expires_at)");
    await db("CREATE INDEX IF NOT EXISTS idx_catalog_holds_order ON admin_catalog_checkout_holds(paypal_order_id)");
   })().catch(e=>{init=null;throw e});
  }
  return init;
 }
 function normalizeCart(items){
  if(!Array.isArray(items)||!items.length||items.length>30)throw error("Your bag is empty or too large.",400);
  const rows=new Map();
  for(const item of items){
   const id=String(item&&item.id||"").trim().toLowerCase();
   const color=String(item&&item.color||"").trim().toLowerCase();
   const size=String(item&&item.size||"").trim().toUpperCase();
   const qty=Number(item&&item.quantity);
   if(!/^[a-z0-9-]{2,40}$/.test(id)||LEGACY_IDS.has(id))
    throw error("This original collection item is currently SOLD OUT.",409);
   if(!color||color.length>45||!size||size.length>20||!Number.isInteger(qty)||qty<1||qty>20)
    throw error("Invalid product option or quantity.",400);
   const k=id+"\0"+color+"\0"+size;
   if(rows.has(k)){rows.get(k).quantity+=qty;if(rows.get(k).quantity>20)throw error("Maximum 20 pieces per variant.",400)}
   else rows.set(k,{id,color,size,quantity:qty});
  }
  return [...rows.values()].sort((a,b)=>(a.id+"\0"+a.color+"\0"+a.size).localeCompare(b.id+"\0"+b.color+"\0"+b.size));
 }
 async function prepare(items,customer){
  await ensure();
  const lines=normalizeCart(items);
  const ids=[...new Set(lines.map(x=>x.id))];
  const found=await db("SELECT id,name,price_usd,colors,sizes FROM admin_catalog WHERE active=TRUE AND id=ANY($1::text[])",[ids]);
  const products=new Map(found.rows.map(p=>[p.id,p]));
  let subtotal=0;
  const paypalItems=[],validatedItems=[];
  for(const line of lines){
   const p=products.get(line.id);
   if(!p)throw error("This product is not available for purchase.",409);
   if(!p.colors.includes(line.color)||!p.sizes.includes(line.size))
    throw error("The selected color or size is unavailable.",409);
   const unitCents=cents(p.price_usd),lineCents=unitCents*line.quantity;
   subtotal+=lineCents;
   const unitPrice=usd(unitCents),lineTotal=usd(lineCents);
   validatedItems.push({id:p.id,name:p.name,color:line.color,size:line.size,quantity:line.quantity,unitPrice,lineTotal});
   paypalItems.push({name:p.name.slice(0,118),quantity:String(line.quantity),unit_amount:{currency_code:"USD",value:unitPrice}});
  }
  const shipping=calculateShipping(customer);
  const shippingCents=Math.round(Number(shipping.usd)*100);
  if(!Number.isInteger(shippingCents)||shippingCents<0)throw error("Shipping quote is unavailable.",400);
  return {managed:true,itemTotal:usd(subtotal),shipping,total:usd(subtotal+shippingCents),paypalItems,validatedItems};
 }
 async function transaction(fn){
  if(!pool)throw error("Checkout database is not available.",503);
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const result=await fn(client);
   await client.query("COMMIT");
   return result;
  }catch(e){
   try{await client.query("ROLLBACK")}catch(_){}
   throw e;
  }finally{client.release()}
 }
 async function lockVariant(client,line){
  const result=await client.query(
   "SELECT on_hand FROM admin_stock WHERE product_id=$1 AND color=$2 AND size=$3 FOR UPDATE",
   [line.id,line.color,line.size]);
  if(!result.rows.length)throw error("This size/color is out of stock.",409);
  return Number(result.rows[0].on_hand);
 }
 async function otherHolds(client,line,excludeGroup){
  const q=[
   "SELECT COALESCE(SUM(quantity),0)::int AS qty FROM admin_catalog_checkout_holds",
   "WHERE product_id=$1 AND color=$2 AND size=$3",
   "AND state='HELD' AND expires_at>NOW()",
   "AND ($4::uuid IS NULL OR hold_group<>$4::uuid)"
  ].join(" ");
  const r=await client.query(q,[line.id,line.color,line.size,excludeGroup||null]);
  return Number(r.rows[0].qty);
 }
 async function reserve(order){
  await ensure();
  const group=crypto.randomUUID();
  await transaction(async client=>{
   for(const item of order.validatedItems){
    // Lock the published catalog row so admins cannot change its price/variants
    // between the authoritative quote and the stock reservation.
    const current=await client.query(
     "SELECT price_usd,active,colors,sizes FROM admin_catalog WHERE id=$1 FOR SHARE",[item.id]);
    const product=current.rows[0];
    if(!product||!product.active||usd(cents(product.price_usd))!==item.unitPrice||
       !product.colors.includes(item.color)||!product.sizes.includes(item.size))
       throw error("Product details changed. Refresh your bag and try again.",409);
    const line={id:item.id,color:item.color,size:item.size,quantity:item.quantity};
    const onHand=await lockVariant(client,line);
    const reserved=await otherHolds(client,line,null);
    if(onHand-reserved<line.quantity)throw error("Insufficient stock for "+item.name+" ("+line.color+" / "+line.size+").",409);
    await client.query([
      "INSERT INTO admin_catalog_checkout_holds",
      "(hold_group,product_id,color,size,quantity,expires_at)",
      "VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '30 minutes')"
     ].join(" "),[group,line.id,line.color,line.size,line.quantity]);
   }
  });
  return group;
 }
 async function bind(group,paypalOrderID){
  if(!group||!paypalOrderID)throw error("Missing stock reservation.",500);
  const r=await db("UPDATE admin_catalog_checkout_holds SET paypal_order_id=$2 WHERE hold_group=$1 AND state='HELD' RETURNING id",[group,paypalOrderID]);
  if(!r.rows.length)throw error("Stock reservation could not be linked to payment.",500);
 }
 async function release(group){
  if(!group)return;
  await ensure();
  await db("UPDATE admin_catalog_checkout_holds SET state='RELEASED' WHERE hold_group=$1 AND state='HELD'",[group]);
 }
 async function ensureEligible(paypalOrderID){
  await ensure();
  return transaction(async client=>{
   const r=await client.query(
    "SELECT id,hold_group,product_id AS id_product,color,size,quantity FROM admin_catalog_checkout_holds WHERE paypal_order_id=$1 AND state='HELD' ORDER BY product_id,color,size FOR UPDATE",
    [paypalOrderID]);
   if(!r.rows.length){
    const i=await client.query(
      "SELECT oi.product_id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.paypal_order_id=$1 LIMIT 30",
      [paypalOrderID]);
    if(i.rows.some(x=>!LEGACY_IDS.has(x.product_id)))throw error("Stock reservation for this order has expired or is unavailable.",409);
    return;
   }
   const group=r.rows[0].hold_group;
   for(const h of r.rows){
    const line={id:h.id_product,color:h.color,size:h.size,quantity:Number(h.quantity)};
    const count=await lockVariant(client,line);
    const others=await otherHolds(client,line,group);
    if(count-others<line.quantity)throw error("Item is no longer available. Please contact support before paying.",409);
   }
   await client.query("UPDATE admin_catalog_checkout_holds SET expires_at=NOW()+INTERVAL '15 minutes' WHERE paypal_order_id=$1 AND state='HELD'",[paypalOrderID]);
  });
 }
 async function finalize(client,paypalOrderID){
  const r=await client.query(
   "SELECT id,hold_group,product_id,color,size,quantity FROM admin_catalog_checkout_holds WHERE paypal_order_id=$1 AND state='HELD' ORDER BY product_id,color,size FOR UPDATE",
   [paypalOrderID]);
  if(!r.rows.length){
   const items=await client.query(
    "SELECT oi.product_id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.paypal_order_id=$1",
    [paypalOrderID]);
   if(items.rows.some(x=>!LEGACY_IDS.has(x.product_id)))throw error("Paid catalog order has no active stock holds. Manual reconciliation required.",500);
   return;
  }
  const group=r.rows[0].hold_group;
  for(const line of r.rows){
   const stock={id:line.product_id,color:line.color,size:line.size,quantity:Number(line.quantity)};
   const count=await lockVariant(client,stock);
   const other=await otherHolds(client,stock,group);
   if(count-other<stock.quantity)
    throw error("Stock reconciliation needs manual review for "+stock.id+".",500);
   const changed=await client.query(
    "UPDATE admin_stock SET on_hand=on_hand-$4,updated_at=NOW() WHERE product_id=$1 AND color=$2 AND size=$3 AND on_hand>=$4 RETURNING on_hand",
    [stock.id,stock.color,stock.size,stock.quantity]);
   if(!changed.rows.length)throw error("Stock could not be deducted.",500);
  }
  await client.query("UPDATE admin_catalog_checkout_holds SET state='CONSUMED' WHERE paypal_order_id=$1 AND state='HELD'",[paypalOrderID]);
 }
 async function setStock({id,color,size,amount}){
  await ensure();
  return transaction(async client=>{
   // Serialize edits against reservations and payment settlement.
   await client.query("SELECT id FROM admin_catalog WHERE id=$1 FOR UPDATE",[id]);
   const existing=await client.query("SELECT on_hand FROM admin_stock WHERE product_id=$1 AND color=$2 AND size=$3 FOR UPDATE",[id,color,size]);
   const reserved=await otherHolds(client,{id,color,size},null);
   if(amount<reserved)throw error("Cannot set stock below the quantity reserved by pending orders.",409);
   await client.query([
    "INSERT INTO admin_stock(product_id,color,size,on_hand,updated_at)",
    "VALUES($1,$2,$3,$4,NOW())",
    "ON CONFLICT(product_id,color,size) DO UPDATE",
    "SET on_hand=EXCLUDED.on_hand,updated_at=NOW()"
   ].join(" "),[id,color,size,amount]);
   return existing.rows.length?Number(existing.rows[0].on_hand):null;
  });
 }
 return {ensure,prepare,reserve,bind,release,ensureEligible,finalize,setStock};
};
