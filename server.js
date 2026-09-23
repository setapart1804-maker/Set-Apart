/* =========================================================
SET APART — PAYPAL + EMAIL + NEON BACKEND
========================================================= */
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
const { Pool } = require("pg");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);

const PORT =
process.env.PORT ||
3000;


/* =========================================================
ENVIRONMENT VARIABLES
========================================================= */

const PAYPAL_CLIENT_ID =
process.env.PAYPAL_CLIENT_ID;

const PAYPAL_CLIENT_SECRET =
process.env.PAYPAL_CLIENT_SECRET;

const RESEND_API_KEY =
process.env.RESEND_API_KEY;

const ORDER_NOTIFICATION_EMAIL =
process.env.ORDER_NOTIFICATION_EMAIL;

const ADMIN_SHIPPING_KEY =
process.env.ADMIN_SHIPPING_KEY;

const PAYPAL_WEBHOOK_ID =
process.env.PAYPAL_WEBHOOK_ID;

const DOP_PER_USD =
Number(
process.env.DOP_PER_USD
);

const DATABASE_URL =
process.env.DATABASE_URL;

const ADMIN_USERNAME =
process.env.ADMIN_USERNAME;

const ADMIN_PASSWORD =
process.env.ADMIN_PASSWORD;


const PAYPAL_BASE_URL =
"https://api-m.paypal.com";


/* =========================================================
SERVICES
========================================================= */

const resend =
new Resend(
RESEND_API_KEY
);


const pool =
DATABASE_URL

? new Pool({

connectionString:
DATABASE_URL

})

: null;


async function db(
text,
params = []
) {

if (!pool) {

throw new Error(
"DATABASE_URL environment variable is missing."
);

}

return pool.query(
text,
params
);

}


/* =========================================================
MIDDLEWARE
========================================================= */

app.use(

express.json({

limit:
"1mb"

})

);


app.use(

express.urlencoded({

extended:
false

})

);


app.use(

cors({

origin: [

"https://setapart1804-maker.github.io",

"http://localhost:3000",

"http://127.0.0.1:3000"

],

methods: [

"GET",
"POST",
"OPTIONS"

],

allowedHeaders: [

"Content-Type",

"x-admin-key",

"Authorization"

]

})

);


/* =========================================================
PRODUCTS — SERVER IS SOURCE OF TRUTH
========================================================= */

const PRODUCTS = {

pilgrim: {

name:
"PILGRIM HOODIE",

price:
34.99,

colors: [

"beige",
"white",
"brown",
"black"

],

sizes: [

"S",
"M",
"L",
"XL"

]

},


godfirst: {

name:
"GOD FIRST HOODIE",

price:
34.99,

colors: [

"brown",
"white",
"black",
"beige"

],

sizes: [

"S",
"M",
"L",
"XL"

]

}

};


/* =========================================================
GENERAL HELPERS
========================================================= */

function escapeHtml(
value
) {

return String(
value ?? ""
)

.replace(
/&/g,
"&amp;"
)

.replace(
/</g,
"&lt;"
)

.replace(
/>/g,
"&gt;"
)

.replace(
/"/g,
"&quot;"
)

.replace(
/'/g,
"&#039;"
);

}


function normalizePlace(
value
) {

return String(
value || ""
)

.normalize(
"NFD"
)

.replace(
/[\u0300-\u036f]/g,
""
)

.trim()

.toLowerCase();

}


function getDopPerUsd() {

if (

!Number.isFinite(
DOP_PER_USD
) ||

DOP_PER_USD <= 0

) {

throw new Error(
"DOP_PER_USD environment variable is missing or invalid."
);

}


return DOP_PER_USD;

}


/* =========================================================
OLD ADMIN API KEY HELPER
========================================================= */

function requireAdmin(
req,
res
) {

const adminKey =
req.headers[
"x-admin-key"
];


if (

!ADMIN_SHIPPING_KEY ||

adminKey !==
ADMIN_SHIPPING_KEY

) {

res
.status(401)
.json({

success:
false,

error:
"Unauthorized."

});


return false;

}


return true;

}


/* =========================================================
CUSTOMER VALIDATION
========================================================= */

function validateCustomer(
customer
) {

const source =
customer ||
{};


const clean = {

email:
String(
source.email ||
""
).trim(),

firstName:
String(
source.firstName ||
""
).trim(),

lastName:
String(
source.lastName ||
""
).trim(),

address:
String(
source.address ||
""
).trim(),

apartment:
String(
source.apartment ||
""
).trim(),

country:
String(
source.country ||
""
)
.trim()
.toUpperCase(),

city:
String(
source.city ||
""
).trim(),

state:
String(
source.state ||
""
).trim(),

postalCode:
String(
source.postalCode ||
""
).trim(),

phone:
String(
source.phone ||
""
).trim()

};


const required = [

"email",
"firstName",
"lastName",
"address",
"country",
"city",
"phone"

];


const missing =
required.find(

function (
field
) {

return !clean[
field
];

}

);


if (missing) {

throw new Error(
`Missing customer field: ${missing}`
);

}


const emailPattern =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;


if (
!emailPattern.test(
clean.email
)
) {

throw new Error(
"Invalid customer email address."
);

}


if (

![
"DO",
"HT"
].includes(
clean.country
)

) {

throw new Error(
"SET APART currently ships only to Dominican Republic and Haiti."
);

}


return clean;

}


/* =========================================================
SHIPPING
========================================================= */

function calculateShipping(
customer
) {

const safeCustomer =
customer ||
{};


const country =
String(
safeCustomer.country ||
""
)

.trim()

.toUpperCase();


if (!country) {

throw new Error(
"Shipping country is required."
);

}


/* =====================================================
HAITI
===================================================== */

if (
country ===
"HT"
) {

return {

method:
"PÉTION-VILLE PICKUP",

localCurrency:
"USD",

localAmount:
10,

usd:
"10.00",

displayPrice:
"$10.00 USD",

note:
"Orders for Haiti are collected at our pickup point in Pétion-Ville."

};

}


/* =====================================================
DOMINICAN REPUBLIC
===================================================== */

if (
country ===
"DO"
) {

const city =
normalizePlace(
safeCustomer.city
);


const state =
normalizePlace(
safeCustomer.state
);


const destination =
`${city} ${state}`;


if (
!destination.trim()
) {

throw new Error(
"City or province is required for Dominican Republic shipping."
);

}


const isCapitalArea =

destination.includes(
"santo domingo"
) ||

destination.includes(
"distrito nacional"
);


const shippingDOP =
    isCapitalArea
        ? 300
        : 500;


const shippingUSD =
Math.round(

(
shippingDOP /
getDopPerUsd()
) *

100

) / 100;


return {

method:
"STANDARD SHIPPING",

localCurrency:
"DOP",

localAmount:
shippingDOP,

usd:
shippingUSD
.toFixed(
2
),

displayPrice:
`RD$${shippingDOP} / $${shippingUSD.toFixed(2)} USD`,

note:
isCapitalArea

? "Santo Domingo / capital area shipping."

: "Shipping to other cities in the Dominican Republic."

};

}


throw new Error(
"SET APART currently ships only to Dominican Republic and Haiti."
);

}


/* =========================================================
ORDER CALCULATION
========================================================= */

function calculateOrder(
items,
customer
) {

if (

!Array.isArray(
items
) ||

items.length === 0

) {

throw new Error(
"Cart is empty."
);

}


let itemTotal =
0;


const validatedItems =
[];


const paypalItems =
items.map(

function (
item
) {

const product =
PRODUCTS[
item.id
];


if (!product) {

throw new Error(
"Invalid product."
);

}


const color =
String(
item.color ||
""
)

.trim()

.toLowerCase();


const size =
String(
item.size ||
""
)

.trim()

.toUpperCase();


const quantity =
Number(
item.quantity
);


if (

!product.colors.includes(
color
)

) {

throw new Error(
"Invalid product color."
);

}


if (

!product.sizes.includes(
size
)

) {

throw new Error(
"Invalid product size."
);

}


if (

!Number.isInteger(
quantity
) ||

quantity < 1 ||

quantity > 20

) {

throw new Error(
"Invalid quantity."
);

}


const lineTotal =
product.price *
quantity;


itemTotal +=
lineTotal;


validatedItems.push({

id:
item.id,

name:
product.name,

color:
color,

size:
size,

quantity:
quantity,

unitPrice:
product.price
.toFixed(
2
),

lineTotal:
lineTotal
.toFixed(
2
)

});


return {

name:
product.name,

quantity:
String(
quantity
),

unit_amount: {

currency_code:
"USD",

value:
product.price
.toFixed(
2
)

}

};

}

);


const shipping =
calculateShipping(
customer
);


const total =
itemTotal +
Number(
shipping.usd
);


return {

itemTotal:
itemTotal.toFixed(
2
),

shipping:
shipping,

total:
total.toFixed(
2
),

paypalItems:
paypalItems,

validatedItems:
validatedItems

};

}


/* =========================================================
PAYPAL HELPERS
========================================================= */

async function generateAccessToken() {

if (

!PAYPAL_CLIENT_ID ||

!PAYPAL_CLIENT_SECRET

) {

throw new Error(
"PayPal credentials are missing."
);

}


const auth =
Buffer.from(

`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`

).toString(
"base64"
);


const response =
await fetch(

`${PAYPAL_BASE_URL}/v1/oauth2/token`,

{

method:
"POST",

headers: {

Authorization:
`Basic ${auth}`,

"Content-Type":
"application/x-www-form-urlencoded"

},

body:
"grant_type=client_credentials"

}

);


const data =
await response.json();


if (
!response.ok
) {

console.error(
"PayPal access token error:",
data
);


throw new Error(
"Unable to authenticate with PayPal."
);

}


return data.access_token;

}


async function getPayPalOrderDetails(
orderID,
accessToken
) {

const response =
await fetch(

`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}`,

{

method:
"GET",

headers: {

Authorization:
`Bearer ${accessToken}`,

"Content-Type":
"application/json"

}

}

);


const data =
await response.json();


if (
!response.ok
) {

console.error(
"PayPal get order error:",
data
);


throw new Error(
"Unable to verify PayPal order."
);

}


return data;

}


async function getPayPalCaptureDetails(
captureID,
accessToken
) {

const response =
await fetch(

`${PAYPAL_BASE_URL}/v2/payments/captures/${encodeURIComponent(
captureID
)}`,

{

method:
"GET",

headers: {

Authorization:
`Bearer ${accessToken}`,

"Content-Type":
"application/json"

}

}

);


const data =
await response.json();


if (
!response.ok
) {

console.error(
"PayPal capture details error:",
data
);


throw new Error(
"Unable to retrieve PayPal capture details."
);

}


return data;

}


function getCompletedCaptureFromPayPalOrder(
paypalOrder
) {

return (

paypalOrder
?.purchase_units
?.[0]
?.payments
?.captures
?.find(

function (
capture
) {

return (
capture.status ===
"COMPLETED"
);

}

) ||

null

);

}


async function verifyPayPalWebhook(
req
) {

if (
!PAYPAL_WEBHOOK_ID
) {

throw new Error(
"PAYPAL_WEBHOOK_ID is missing."
);

}


const requiredHeaders = [

"paypal-auth-algo",
"paypal-cert-url",
"paypal-transmission-id",
"paypal-transmission-sig",
"paypal-transmission-time"

];


const missing =
requiredHeaders.find(

function (
header
) {

return !req.headers[
header
];

}

);


if (missing) {

console.error(
"Missing PayPal webhook header:",
missing
);


return false;

}


const accessToken =
await generateAccessToken();


const response =
await fetch(

`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,

{

method:
"POST",

headers: {

"Content-Type":
"application/json",

Authorization:
`Bearer ${accessToken}`

},

body:
JSON.stringify({

auth_algo:
req.headers[
"paypal-auth-algo"
],

cert_url:
req.headers[
"paypal-cert-url"
],

transmission_id:
req.headers[
"paypal-transmission-id"
],

transmission_sig:
req.headers[
"paypal-transmission-sig"
],

transmission_time:
req.headers[
"paypal-transmission-time"
],

webhook_id:
PAYPAL_WEBHOOK_ID,

webhook_event:
req.body

})

}

);


const data =
await response.json();


if (
!response.ok
) {

console.error(
"PayPal webhook verification error:",
data
);


return false;

}


return (
data.verification_status ===
"SUCCESS"
);

}


/* =========================================================
DATABASE HELPERS
========================================================= */

async function savePendingOrder({

paypalOrderID,
customer,
order

}) {

if (!pool) {

throw new Error(
"Database connection is not configured."
);

}


const client =
await pool.connect();


try {

await client.query(
"BEGIN"
);


const result =
await client.query(

`
INSERT INTO orders (

paypal_order_id,
paypal_capture_id,

customer_email,
first_name,
last_name,
phone,

address,
apartment,
city,
state,
postal_code,
country,

shipping_method,
shipping_local_currency,
shipping_local_amount,
shipping_usd,

subtotal_usd,
total_usd,

payment_status,
order_status

)

VALUES (

$1,
NULL,

$2,
$3,
$4,
$5,

$6,
$7,
$8,
$9,
$10,
$11,

$12,
$13,
$14,
$15,

$16,
$17,

'PENDING_PAYMENT',
'PENDING'

)

RETURNING id
`,

[

paypalOrderID,

customer.email,
customer.firstName,
customer.lastName,
customer.phone,

customer.address,

customer.apartment ||
null,

customer.city,

customer.state ||
null,

customer.postalCode ||
null,

customer.country,

order.shipping.method,
order.shipping.localCurrency,
order.shipping.localAmount,
order.shipping.usd,

order.itemTotal,
order.total

]

);


const databaseOrderID =
result.rows[0].id;


for (
const item
of order.validatedItems
) {

await client.query(

`
INSERT INTO order_items (

order_id,

product_id,
product_name,

color,
size,

quantity,

unit_price_usd,
line_total_usd

)

VALUES (

$1,
$2,
$3,
$4,
$5,
$6,
$7,
$8

)
`,

[

databaseOrderID,

item.id,
item.name,

item.color,
item.size,

item.quantity,

item.unitPrice,
item.lineTotal

]

);

}


await client.query(
"COMMIT"
);


return databaseOrderID;

}


catch (
error
) {

await client.query(
"ROLLBACK"
);


throw error;

}


finally {

client.release();

}

}


async function getStoredOrder(
paypalOrderID
) {

const orderResult =
await db(

`
SELECT *

FROM orders

WHERE paypal_order_id = $1

LIMIT 1
`,

[
paypalOrderID
]

);


if (
orderResult.rows.length ===
0
) {

return null;

}


const order =
orderResult.rows[0];


const itemResult =
await db(

`
SELECT *

FROM order_items

WHERE order_id = $1

ORDER BY id ASC
`,

[
order.id
]

);


return {

order:
order,

items:
itemResult.rows

};

}


function customerFromStoredOrder(
row
) {

return {

email:
row.customer_email,

firstName:
row.first_name,

lastName:
row.last_name,

phone:
row.phone,

address:
row.address,

apartment:
row.apartment ||
"",

city:
row.city,

state:
row.state ||
"",

postalCode:
row.postal_code ||
"",

country:
row.country

};

}


function shippingFromStoredOrder(
row
) {

const localAmount =
Number(
row.shipping_local_amount
);


const shippingUSD =
Number(
row.shipping_usd
);


const displayPrice =

row.shipping_local_currency ===
"DOP"

? `RD$${Math.round(localAmount)} / $${shippingUSD.toFixed(2)} USD`

: `$${shippingUSD.toFixed(2)} USD`;


return {

method:
row.shipping_method,

localCurrency:
row.shipping_local_currency,

localAmount:
localAmount,

usd:
shippingUSD
.toFixed(
2
),

displayPrice:
displayPrice,

note:
row.shipping_method ===
"PÉTION-VILLE PICKUP"

? "Orders for Haiti are collected at our pickup point in Pétion-Ville."

: "SET APART shipping."

};

}


function itemsFromStoredOrder(
rows
) {

return rows.map(

function (
item
) {

return {

id:
item.product_id,

name:
item.product_name,

color:
item.color,

size:
item.size,

quantity:
Number(
item.quantity
),

price:
Number(
item.unit_price_usd
)

};

}

);

}


async function markOrderPaid({

paypalOrderID,
captureID

}) {

const result =
await db(

`
UPDATE orders

SET

paypal_capture_id = $1,

payment_status = 'COMPLETED',

order_status = 'PAID',

updated_at = NOW()

WHERE paypal_order_id = $2

AND payment_status <> 'COMPLETED'

RETURNING *
`,

[
captureID,
paypalOrderID
]

);


if (
result.rows.length > 0
) {

return {

order:
result.rows[0],

newlyPaid:
true

};

}


const existingResult =
await db(

`
SELECT *

FROM orders

WHERE paypal_order_id = $1

LIMIT 1
`,

[
paypalOrderID
]

);


if (
existingResult.rows.length === 0
) {

throw new Error(
"Order could not be found in database."
);

}


const existingOrder =
existingResult.rows[0];


if (
existingOrder.payment_status ===
"COMPLETED"
) {

if (

existingOrder.paypal_capture_id &&

existingOrder.paypal_capture_id !==
captureID

) {

throw new Error(
"PayPal capture ID does not match the capture already stored for this order."
);

}


return {

order:
existingOrder,

newlyPaid:
false

};

}


throw new Error(
"Order could not be marked as paid."
);

}


async function markOrderShipped({

paypalOrderID,
carrier,
trackingNumber

}) {

const result =
await db(

`
UPDATE orders

SET

carrier = $1,

tracking_number = $2,

order_status =
'SHIPPED',

shipped_at =
NOW(),

updated_at =
NOW()

WHERE paypal_order_id = $3

RETURNING *
`,

[

carrier ||
null,

trackingNumber,

paypalOrderID

]

);


if (
result.rows.length ===
0
) {

throw new Error(
"Order not found."
);

}


return result.rows[0];

}


/* =========================================================
EMAIL FAILURE DATABASE HELPERS
========================================================= */

async function ensureEmailFailuresTable() {

await db(`

CREATE TABLE IF NOT EXISTS email_failures (

id BIGSERIAL PRIMARY KEY,

paypal_order_id VARCHAR(100) NOT NULL
REFERENCES orders(paypal_order_id)
ON DELETE CASCADE,

email_type VARCHAR(50) NOT NULL,

recipient_email VARCHAR(255) NOT NULL,

error_message TEXT NOT NULL,

retry_count INTEGER NOT NULL DEFAULT 0,

resolved BOOLEAN NOT NULL DEFAULT FALSE,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

last_retry_at TIMESTAMPTZ,

resolved_at TIMESTAMPTZ

)

`);


await db(`

ALTER TABLE email_failures

ADD COLUMN IF NOT EXISTS updated_at
TIMESTAMPTZ NOT NULL DEFAULT NOW()

`);


await db(`

CREATE INDEX IF NOT EXISTS
idx_email_failures_resolved

ON email_failures(resolved)

`);


await db(`

CREATE INDEX IF NOT EXISTS
idx_email_failures_order

ON email_failures(paypal_order_id)

`);

}


function emailErrorMessage(
error
) {

if (!error) {

return "Unknown email error.";

}


if (
typeof error ===
"string"
) {

return error;

}


if (
error.message
) {

return String(
error.message
);

}


try {

return JSON.stringify(
error
);

}


catch {

return String(
error
);

}

}


async function recordEmailFailure({

orderID,
emailType,
recipientEmail,
errorMessage

}) {

await ensureEmailFailuresTable();


const recipient =
String(
recipientEmail ||
"NOT_CONFIGURED"
).trim();


const existing =
await db(

`
SELECT id

FROM email_failures

WHERE paypal_order_id = $1
AND email_type = $2
AND recipient_email = $3
AND resolved = FALSE

ORDER BY id DESC

LIMIT 1
`,

[
orderID,
emailType,
recipient
]

);


if (
existing.rows.length >
0
) {

await db(

`
UPDATE email_failures

SET
error_message = $1,
updated_at = NOW()

WHERE id = $2
`,

[

String(
errorMessage ||
"Unknown email error."
),

existing.rows[0].id

]

);


return existing.rows[0].id;

}


const inserted =
await db(

`
INSERT INTO email_failures (

paypal_order_id,

email_type,

recipient_email,

error_message

)

VALUES (
$1,
$2,
$3,
$4
)

RETURNING id
`,

[

orderID,

emailType,

recipient,

String(
errorMessage ||
"Unknown email error."
)

]

);


return inserted.rows[0].id;

}


async function resolveEmailFailures({

orderID,
emailType,
recipientEmail

}) {

await ensureEmailFailuresTable();


await db(

`
UPDATE email_failures

SET

resolved = TRUE,

resolved_at = NOW(),

updated_at = NOW()

WHERE paypal_order_id = $1

AND email_type = $2

AND recipient_email = $3

AND resolved = FALSE
`,

[

orderID,

emailType,

String(
recipientEmail ||
"NOT_CONFIGURED"
).trim()

]

);

}


async function attemptTrackedEmail({

orderID,
emailType,
recipientEmail,
send

}) {

try {

await send();


await resolveEmailFailures({

orderID:
orderID,

emailType:
emailType,

recipientEmail:
recipientEmail

});


return {

success:
true

};

}


catch (
error
) {

console.error(

`${emailType} email failed:`,

error

);


try {

await recordEmailFailure({

orderID:
orderID,

emailType:
emailType,

recipientEmail:
recipientEmail,

errorMessage:
emailErrorMessage(
error
)

});

}


catch (
databaseError
) {

console.error(

"Could not save failed email:",

databaseError

);

}


return {

success:
false,

error:
error

};

}

}


/* =========================================================
EMAIL HELPERS
========================================================= */

function orderItemsHtml(
items
) {

return items

.map(

function (
item
) {

const product =
PRODUCTS[
item.id
];


const name =
product?.name ||
item.name ||
item.id;


const price =
product?.price ??
Number(
item.price ||
0
);


return `

<tr>

<td
style="
padding:10px;
border-bottom:1px solid #ddd;
"
>
${escapeHtml(name)}
</td>


<td
style="
padding:10px;
border-bottom:1px solid #ddd;
"
>
${escapeHtml(
item.color ||
"-"
)}
</td>


<td
style="
padding:10px;
border-bottom:1px solid #ddd;
"
>
${escapeHtml(
item.size ||
"-"
)}
</td>


<td
style="
padding:10px;
border-bottom:1px solid #ddd;
"
>
${escapeHtml(
item.quantity ||
1
)}
</td>


<td
style="
padding:10px;
border-bottom:1px solid #ddd;
"
>
$${Number(price).toFixed(2)}
</td>

</tr>

`;

}

)

.join("");

}


/* =========================================================
ADMIN ORDER EMAIL
========================================================= */

async function sendOrderNotification({

orderID,
total,
customer,
items,
shipping

}) {

if (

!RESEND_API_KEY ||

!ORDER_NOTIFICATION_EMAIL

) {

throw new Error(
"Resend environment variables are missing."
);

}


const customerName =

`${customer.firstName || ""} ${customer.lastName || ""}`

.trim();


const address = [

customer.address,
customer.apartment,
customer.city,
customer.state,
customer.postalCode,
customer.country

]

.filter(
Boolean
)

.map(
escapeHtml
)

.join(
", "
);


const html = `

<div
style="
font-family:Arial,sans-serif;
max-width:700px;
margin:auto;
color:#111;
"
>

<h1>
NEW SET APART ORDER
</h1>


<p>
A PayPal payment was completed successfully.
</p>


<hr>


<p>

<strong>
PayPal Order ID:
</strong>

${escapeHtml(
orderID
)}

</p>


<p>

<strong>
Total Paid:
</strong>

$${escapeHtml(
total
)} USD

</p>


<p>

<strong>
Shipping Method:
</strong>

${escapeHtml(
shipping?.method ||
"-"
)}

</p>


<p>

<strong>
Shipping Fee:
</strong>

${escapeHtml(
shipping?.displayPrice ||
"-"
)}

</p>


<hr>


<h2>
CUSTOMER
</h2>


<p>

<strong>
Name:
</strong>

${escapeHtml(
customerName ||
"-"
)}

</p>


<p>

<strong>
Email:
</strong>

${escapeHtml(
customer.email ||
"-"
)}

</p>


<p>

<strong>
Phone:
</strong>

${escapeHtml(
customer.phone ||
"-"
)}

</p>


<p>

<strong>
Address:
</strong>

${address || "-"}

</p>


<hr>


<h2>
PRODUCTS
</h2>


<table
style="
width:100%;
border-collapse:collapse;
"
>

<tbody>

${orderItemsHtml(
items
)}

</tbody>

</table>


<div
style="
margin-top:30px;
padding:20px;
background:#111;
color:#fff;
"
>

<strong>

TOTAL:
$${escapeHtml(
total
)} USD

</strong>

</div>

</div>

`;


const result =
await resend.emails.send({

from:
"SET APART Orders <onboarding@resend.dev>",

to: [
ORDER_NOTIFICATION_EMAIL
],

subject:
`NEW SET APART ORDER — $${total}`,

html:
html

});


if (
result.error
) {

console.error(

"Resend order email error:",

result.error

);


throw new Error(

result.error?.message ||

"Order email could not be sent."

);

}

}


/* =========================================================
CUSTOMER CONFIRMATION EMAIL
========================================================= */

async function sendCustomerConfirmation({

orderID,
total,
customer,
items,
shipping

}) {

if (
!RESEND_API_KEY
) {

throw new Error(
"RESEND_API_KEY is missing."
);

}


if (
!customer?.email
) {

throw new Error(
"Customer email is required."
);

}


const isHaitiPickup =

shipping?.method ===
"PÉTION-VILLE PICKUP";


const html = `

<div
style="
font-family:Arial,sans-serif;
max-width:700px;
margin:auto;
color:#111;
"
>

<div
style="
background:#111;
color:#fff;
padding:30px;
text-align:center;
"
>

<h1
style="
margin:0;
letter-spacing:4px;
"
>
SET APART
</h1>


<p
style="
letter-spacing:2px;
"
>
CALLED TO LIVE DIFFERENTLY.
</p>

</div>


<div
style="
padding:35px 10px;
"
>

<h2>
ORDER CONFIRMED
</h2>


<p>

Hi

${escapeHtml(
customer.firstName ||
"there"
)},

thank you for your order.

</p>


<p>

<strong>
Order ID:
</strong>

${escapeHtml(
orderID
)}

</p>


<p>

<strong>
Total Paid:
</strong>

$${escapeHtml(
total
)} USD

</p>


<p>

<strong>
Shipping Method:
</strong>

${escapeHtml(
shipping?.method ||
"-"
)}

</p>


<p>

<strong>
Shipping Fee:
</strong>

${escapeHtml(
shipping?.displayPrice ||
"-"
)}

</p>


<hr>


<h3>
YOUR ITEMS
</h3>


<table
style="
width:100%;
border-collapse:collapse;
"
>

<tbody>

${orderItemsHtml(
items
)}

</tbody>

</table>


${
isHaitiPickup

? `

<hr>

<h3>
PICKUP INFORMATION
</h3>

<p>
Your order will be delivered to our pickup point in Pétion-Ville.
</p>

<p>
We will contact you when your parcel is ready for pickup.
</p>

`

: ""
}


<div
style="
margin-top:30px;
padding:20px;
background:#111;
color:#fff;
"
>

<strong>

TOTAL:

$${escapeHtml(
total
)} USD

</strong>

</div>

</div>

</div>

`;


const result =
await resend.emails.send({

from:
"SET APART Orders <onboarding@resend.dev>",

to: [
customer.email
],

subject:
"ORDER CONFIRMED — SET APART",

html:
html

});


if (
result.error
) {

console.error(

"Customer confirmation email error:",

result.error

);


throw new Error(

result.error?.message ||

"Customer confirmation email could not be sent."

);

}

}


/* =========================================================
SHIPPING CONFIRMATION EMAIL
========================================================= */

async function sendShippingConfirmation({

orderID,
customerEmail,
customerName,
carrier,
trackingNumber

}) {

if (
!RESEND_API_KEY
) {

throw new Error(
"RESEND_API_KEY is missing."
);

}


if (

!customerEmail ||

!trackingNumber

) {

throw new Error(
"Customer email and tracking number are required."
);

}


const html = `

<div
style="
font-family:Arial,sans-serif;
max-width:700px;
margin:auto;
color:#111;
"
>

<div
style="
background:#111;
color:#fff;
padding:30px;
text-align:center;
"
>

<h1>
SET APART
</h1>

<p>
CALLED TO LIVE DIFFERENTLY.
</p>

</div>


<div
style="
padding:35px 10px;
"
>

<h2>
YOUR ORDER HAS SHIPPED
</h2>


<p>

Hi

${escapeHtml(
customerName ||
"there"
)},

your SET APART order is on the way.

</p>


<p>

<strong>
Order ID:
</strong>

${escapeHtml(
orderID
)}

</p>


<p>

<strong>
Carrier:
</strong>

${escapeHtml(
carrier ||
"Shipping Carrier"
)}

</p>


<p>

<strong>
Tracking Number:
</strong>

${escapeHtml(
trackingNumber
)}

</p>

</div>

</div>

`;


const result =
await resend.emails.send({

from:
"SET APART Orders <onboarding@resend.dev>",

to: [
customerEmail
],

subject:
"YOUR ORDER HAS SHIPPED — SET APART",

html:
html

});


if (
result.error
) {

console.error(

"Shipping confirmation email error:",

result.error

);


throw new Error(

result.error?.message ||

"Shipping confirmation email could not be sent."

);

}

}


/* =========================================================
HEALTH ROUTE
========================================================= */

app.get(

"/",

function (
req,
res
) {

res.json({

success:
true,

message:
"SET APART PayPal + Email + Database server is running.",

databaseConfigured:
Boolean(
DATABASE_URL
)

});

}

);


/* =========================================================
SHIPPING QUOTE ROUTE
========================================================= */

app.post(

"/api/shipping/quote",

function (
req,
res
) {

try {

const shipping =
calculateShipping(
req.body ||
{}
);


return res.json({

success:
true,

method:
shipping.method,

shippingUSD:
shipping.usd,

localCurrency:
shipping.localCurrency,

localAmount:
shipping.localAmount,

displayPrice:
shipping.displayPrice,

note:
shipping.note

});

}


catch (
error
) {

return res

.status(400)

.json({

success:
false,

error:
error.message

});

}

}

);


/* =========================================================
CREATE PAYPAL ORDER
========================================================= */

app.post(

"/api/paypal/orders",

async function (
req,
res
) {

try {

const {

items,
customer

} =
req.body ||
{};


const validatedCustomer =
validateCustomer(
customer
);


const order =
calculateOrder(

items,

validatedCustomer

);


const accessToken =
await generateAccessToken();


const response =
await fetch(

`${PAYPAL_BASE_URL}/v2/checkout/orders`,

{

method:
"POST",

headers: {

"Content-Type":
"application/json",

Authorization:
`Bearer ${accessToken}`

},

body:
JSON.stringify({

intent:
"CAPTURE",

purchase_units: [

{

amount: {

currency_code:
"USD",

value:
order.total,

breakdown: {

item_total: {

currency_code:
"USD",

value:
order.itemTotal

},

shipping: {

currency_code:
"USD",

value:
order.shipping.usd

}

}

},

items:
order.paypalItems

}

]

})

}

);


const data =
await response.json();


if (

!response.ok ||

!data.id

) {

console.error(

"PayPal create order error:",

data

);


return res

.status(
response.status ||
500
)

.json({

success:
false,

error:
"Unable to create PayPal order."

});

}


await savePendingOrder({

paypalOrderID:
data.id,

customer:
validatedCustomer,

order:
order

});


return res.json({

success:
true,

id:
data.id,

total:
order.total,

shipping:
order.shipping

});

}


catch (
error
) {

console.error(

"Create order error:",

error

);


return res

.status(400)

.json({

success:
false,

error:
error.message

});

}

}

);


/* =========================================================
CAPTURE PAYPAL ORDER
========================================================= */

app.post(

"/api/paypal/orders/:orderID/capture",

async function (
req,
res
) {

try {

const orderID =
String(
req.params.orderID ||
""
).trim();


if (!orderID) {

return res

.status(400)

.json({

success:
false,

error:
"Order ID is required."

});

}


const stored =
await getStoredOrder(
orderID
);


if (!stored) {

return res

.status(404)

.json({

success:
false,

error:
"Order was not found in the SET APART database."

});

}


if (

stored.order.payment_status ===
"COMPLETED"

) {

return res.json({

success:
true,

duplicate:
true,

orderID:
stored.order
.paypal_order_id,

captureID:
stored.order
.paypal_capture_id,

status:
"COMPLETED",

total:
Number(
stored.order
.total_usd
).toFixed(
2
),

currency:
"USD"

});

}


const accessToken =
await generateAccessToken();


const paypalOrderBeforeCapture =
await getPayPalOrderDetails(

orderID,

accessToken

);


const expectedTotal =
Number(
stored.order
.total_usd
).toFixed(
2
);


const paypalAmount =
paypalOrderBeforeCapture
?.purchase_units
?.[0]
?.amount;


if (

paypalAmount?.value !==
expectedTotal ||

paypalAmount?.currency_code !==
"USD"

) {

console.error(

"PayPal amount mismatch before capture.",

{

expected:
expectedTotal,

paypal:
paypalAmount

}

);


return res

.status(400)

.json({

success:
false,

error:
"PayPal order amount verification failed."

});

}


let capture =
getCompletedCaptureFromPayPalOrder(
paypalOrderBeforeCapture
);


if (!capture) {

const captureResponse =
await fetch(

`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,

{

method:
"POST",

headers: {

"Content-Type":
"application/json",

Authorization:
`Bearer ${accessToken}`,

"PayPal-Request-Id":
`setapart-capture-${orderID}`

}

}

);


const captureData =
await captureResponse
.json();


if (
!captureResponse.ok
) {

const recoveredOrder =
await getPayPalOrderDetails(

orderID,

accessToken

);


capture =
getCompletedCaptureFromPayPalOrder(
recoveredOrder
);


if (!capture) {

console.error(

"PayPal capture error:",

captureData

);


return res

.status(
captureResponse.status
)

.json({

success:
false,

error:
"Unable to capture PayPal payment."

});

}

}


else {

if (

captureData.status !==
"COMPLETED"

) {

return res

.status(400)

.json({

success:
false,

orderID:
captureData.id,

status:
captureData.status,

error:
"Payment was not completed."

});

}


capture =

captureData
?.purchase_units
?.[0]
?.payments
?.captures
?.[0] ||

null;

}

}


if (
!capture?.id
) {

return res

.status(400)

.json({

success:
false,

error:
"PayPal capture information is missing."

});

}


const capturedAmount =
capture
?.amount
?.value;


const capturedCurrency =
capture
?.amount
?.currency_code;


if (

capturedAmount !==
expectedTotal ||

capturedCurrency !==
"USD"

) {

console.error(

"Captured amount mismatch.",

{

expected:
expectedTotal,

captured:
capturedAmount,

currency:
capturedCurrency

}

);


return res

.status(400)

.json({

success:
false,

error:
"Payment amount verification failed."

});

}


const paidResult =
await markOrderPaid({

paypalOrderID:
orderID,

captureID:
capture.id

});


const paidOrder =
paidResult.order;


const customer =
customerFromStoredOrder(
paidOrder
);


const shipping =
shippingFromStoredOrder(
paidOrder
);


const orderItems =
itemsFromStoredOrder(
stored.items
);


let adminEmailResult = {

success:
true,

skipped:
true

};


let customerEmailResult = {

success:
true,

skipped:
true

};


if (
paidResult.newlyPaid
) {

adminEmailResult =
await attemptTrackedEmail({

orderID:
orderID,

emailType:
"ADMIN_ORDER",

recipientEmail:
ORDER_NOTIFICATION_EMAIL ||
"NOT_CONFIGURED",

send:
function () {

return sendOrderNotification({

orderID:
orderID,

total:
capturedAmount,

customer:
customer,

items:
orderItems,

shipping:
shipping

});

}

});


customerEmailResult =
await attemptTrackedEmail({

orderID:
orderID,

emailType:
"CUSTOMER_CONFIRMATION",

recipientEmail:
customer.email,

send:
function () {

return sendCustomerConfirmation({

orderID:
orderID,

total:
capturedAmount,

customer:
customer,

items:
orderItems,

shipping:
shipping

});

}

});

}


return res.json({

success:
true,

orderID:
orderID,

captureID:
capture.id,

status:
"COMPLETED",

total:
capturedAmount,

currency:
capturedCurrency,

emails: {

admin:
adminEmailResult.success,

customer:
customerEmailResult.success

},

shipping:
shipping

});

}


catch (
error
) {

console.error(

"Capture order error:",

error

);


return res

.status(500)

.json({

success:
false,

error:
"Payment capture failed."

});

}

}

);


/* =========================================================
FAILED EMAILS — ADMIN API
========================================================= */

app.get(

"/api/admin/failed-emails",

async function (
req,
res
) {

if (

!requireAdmin(
req,
res
)

) {

return;

}


try {

await ensureEmailFailuresTable();


const result =
await db(`

SELECT

id,

paypal_order_id,

email_type,

recipient_email,

error_message,

retry_count,

created_at,

last_retry_at

FROM email_failures

WHERE resolved = FALSE

ORDER BY created_at DESC

LIMIT 100

`);


return res.json({

success:
true,

count:
result.rows.length,

failures:
result.rows

});

}


catch (
error
) {

console.error(

"Failed email admin API error:",

error

);


return res

.status(500)

.json({

success:
false,

error:
"Unable to load failed emails."

});

}

}

);


/* =========================================================
MARK ORDER SHIPPED API
========================================================= */

app.post(

"/api/orders/shipped",

async function (
req,
res
) {

if (

!requireAdmin(
req,
res
)

) {

return;

}


try {

const {

orderID,
carrier,
trackingNumber

} =
req.body ||
{};


if (

!orderID ||

!trackingNumber

) {

return res

.status(400)

.json({

success:
false,

error:
"Order ID and tracking number are required."

});

}


const stored =
await getStoredOrder(
orderID
);


if (!stored) {

return res

.status(404)

.json({

success:
false,

error:
"Order not found."

});

}


if (

stored.order.payment_status !==
"COMPLETED" ||

stored.order.order_status !==
"PROCESSING"

) {

return res

.status(400)

.json({

success:
false,

error:
"Only paid PROCESSING orders can be marked as shipped."

});

}


const customerName =

`${stored.order.first_name} ${stored.order.last_name}`

.trim();


const updated =
await markOrderShipped({

paypalOrderID:
orderID,

carrier:
String(
carrier ||
""
).trim(),

trackingNumber:
String(
trackingNumber
).trim()

});


const emailResult =
await attemptTrackedEmail({

orderID:
orderID,

emailType:
"SHIPPING_CONFIRMATION",

recipientEmail:
stored.order.customer_email,

send:
function () {

return sendShippingConfirmation({

orderID:
orderID,

customerEmail:
stored.order.customer_email,

customerName:
customerName,

carrier:
carrier,

trackingNumber:
trackingNumber

});

}

});


return res.json({

success:
true,

emailSent:
emailResult.success,

message:
emailResult.success

? "Order marked SHIPPED and shipping email sent successfully."

: "Order marked SHIPPED, but the shipping email failed and was added to FAILED EMAILS.",

orderStatus:
updated.order_status

});

}


catch (
error
) {

console.error(

"Shipping confirmation error:",

error

);


return res

.status(500)

.json({

success:
false,

error:
"Shipping confirmation could not be completed."

});

}

}

);


/* =========================================================
PAYPAL WEBHOOK DATABASE HELPER
========================================================= */

async function registerPayPalWebhookEvent(
event
) {

const eventID =
String(
event?.id ||
""
).trim();


const eventType =
String(
event?.event_type ||
"UNKNOWN"
).trim();


const resourceID =
event?.resource?.id

? String(
event.resource.id
)

: null;


if (!eventID) {

throw new Error(
"PayPal webhook event ID is missing."
);

}


const result =
await db(

`
INSERT INTO paypal_webhook_events (

paypal_event_id,
event_type,
resource_id

)

VALUES (
$1,
$2,
$3
)

ON CONFLICT (
paypal_event_id
)

DO NOTHING

RETURNING paypal_event_id
`,

[
eventID,
eventType,
resourceID
]

);


return (
result.rows.length > 0
);

}


async function removePayPalWebhookEvent(
eventID
) {

await db(

`
DELETE FROM paypal_webhook_events

WHERE paypal_event_id = $1
`,

[
eventID
]

);

}


async function reconcileCompletedCaptureWebhook(
event
) {

let capture =
event?.resource ||
{};


const captureID =
String(
capture?.id ||
""
).trim();


if (!captureID) {

throw new Error(
"PayPal webhook capture ID is missing."
);

}


let orderID =
String(
capture
?.supplementary_data
?.related_ids
?.order_id ||
""
).trim();


let capturedAmount =
capture
?.amount
?.value;


let capturedCurrency =
capture
?.amount
?.currency_code;


if (
!orderID ||
!capturedAmount ||
!capturedCurrency
) {

const accessToken =
await generateAccessToken();


capture =
await getPayPalCaptureDetails(
captureID,
accessToken
);


orderID =
String(
capture
?.supplementary_data
?.related_ids
?.order_id ||
""
).trim();


capturedAmount =
capture
?.amount
?.value;


capturedCurrency =
capture
?.amount
?.currency_code;

}


if (!orderID) {

console.warn(
"PayPal capture has no related SET APART order ID:",
captureID
);


return {

ignored:
true,

reason:
"MISSING_ORDER_ID"

};

}


const stored =
await getStoredOrder(
orderID
);


if (!stored) {

console.warn(
"PayPal webhook references an order not stored by SET APART:",
orderID
);


return {

ignored:
true,

reason:
"ORDER_NOT_FOUND"

};

}


const expectedTotal =
Number(
stored.order.total_usd
).toFixed(
2
);


if (
capturedAmount !==
expectedTotal ||

capturedCurrency !==
"USD"
) {

throw new Error(
"Webhook payment amount verification failed."
);

}


const paidResult =
await markOrderPaid({

paypalOrderID:
orderID,

captureID:
captureID

});


if (
!paidResult.newlyPaid
) {

return {

success:
true,

alreadyPaid:
true,

orderID:
orderID,

captureID:
captureID

};

}


const customer =
customerFromStoredOrder(
paidResult.order
);


const shipping =
shippingFromStoredOrder(
paidResult.order
);


const orderItems =
itemsFromStoredOrder(
stored.items
);


await attemptTrackedEmail({

orderID:
orderID,

emailType:
"ADMIN_ORDER",

recipientEmail:
ORDER_NOTIFICATION_EMAIL ||
"NOT_CONFIGURED",

send:
function () {

return sendOrderNotification({

orderID:
orderID,

total:
capturedAmount,

customer:
customer,

items:
orderItems,

shipping:
shipping

});

}

});


await attemptTrackedEmail({

orderID:
orderID,

emailType:
"CUSTOMER_CONFIRMATION",

recipientEmail:
customer.email,

send:
function () {

return sendCustomerConfirmation({

orderID:
orderID,

total:
capturedAmount,

customer:
customer,

items:
orderItems,

shipping:
shipping

});

}

});


return {

success:
true,

newlyPaid:
true,

orderID:
orderID,

captureID:
captureID

};

}


/* =========================================================
PAYPAL WEBHOOK
========================================================= */

app.post(

"/api/paypal/webhook",

async function (
req,
res
) {

let registeredEventID =
null;


try {

/* =============================================
VERIFY PAYPAL WEBHOOK SIGNATURE
============================================= */

const verified =
await verifyPayPalWebhook(
req
);


if (!verified) {

return res
.status(400)
.json({

success:
false,

error:
"Invalid PayPal webhook signature."

});

}


const event =
req.body;


const eventID =
String(
event?.id ||
""
).trim();


if (!eventID) {

return res
.status(400)
.json({

success:
false,

error:
"PayPal webhook event ID is missing."

});

}


/* =============================================
REGISTER EVENT IN NEON
============================================= */

const isNewEvent =
await registerPayPalWebhookEvent(
event
);


if (!isNewEvent) {

console.log(
"Duplicate PayPal webhook ignored:",
eventID
);


return res
.status(200)
.json({

success:
true,

duplicate:
true

});

}


registeredEventID =
eventID;


const eventType =
String(
event?.event_type ||
"UNKNOWN"
);


console.log(
"Verified PayPal webhook:",
eventType,
eventID
);


let reconciliation =
null;


/* =============================================
PAYMENT COMPLETED
============================================= */

if (
eventType ===
"PAYMENT.CAPTURE.COMPLETED"
) {

reconciliation =
await reconcileCompletedCaptureWebhook(
event
);


console.log(
"PayPal capture reconciliation:",
reconciliation
);

}


return res
.status(200)
.json({

success:
true,

duplicate:
false,

reconciliation:
reconciliation

});

}


catch (
error
) {

console.error(
"PayPal webhook error:",
error
);


/*
* If processing failed,
* remove the event from Neon.
*
* This allows PayPal to retry it later.
*/

if (
registeredEventID
) {

try {

await removePayPalWebhookEvent(
registeredEventID
);

}

catch (
cleanupError
) {

console.error(
"Could not release failed PayPal webhook event:",
cleanupError
);

}

}


return res
.status(500)
.json({

success:
false

});

}

}

);


/* =========================================================
SET APART — ADMIN DASHBOARD
========================================================= */

function secureTextEqual(
a,
b
) {

const left =
Buffer.from(

String(
a ?? ""
),

"utf8"

);


const right =
Buffer.from(

String(
b ?? ""
),

"utf8"

);


if (

left.length !==
right.length

) {

return false;

}


return crypto.timingSafeEqual(
left,
right
);

}


/* =========================================================
ADMIN LOGIN
========================================================= */

function adminBasicAuth(
req,
res,
next
) {

if (

!ADMIN_USERNAME ||

!ADMIN_PASSWORD

) {

return res

.status(503)

.send(
"Admin login is not configured."
);

}


const authorization =
String(
req.headers.authorization ||
""
);


if (

!authorization.startsWith(
"Basic "
)

) {

res.set(

"WWW-Authenticate",

'Basic realm="SET APART Admin", charset="UTF-8"'

);


return res

.status(401)

.send(
"Authentication required."
);

}


let decoded =
"";


try {

decoded =
Buffer.from(

authorization.slice(
6
),

"base64"

).toString(
"utf8"
);

}


catch {

res.set(

"WWW-Authenticate",

'Basic realm="SET APART Admin", charset="UTF-8"'

);


return res

.status(401)

.send(
"Authentication required."
);

}


const separator =
decoded.indexOf(
":"
);


if (
separator < 0
) {

res.set(

"WWW-Authenticate",

'Basic realm="SET APART Admin", charset="UTF-8"'

);


return res

.status(401)

.send(
"Authentication required."
);

}


const username =
decoded.slice(
0,
separator
);


const password =
decoded.slice(
separator + 1
);


const validUsername =
secureTextEqual(
username,
ADMIN_USERNAME
);


const validPassword =
secureTextEqual(
password,
ADMIN_PASSWORD
);


if (

!validUsername ||

!validPassword

) {

res.set(

"WWW-Authenticate",

'Basic realm="SET APART Admin", charset="UTF-8"'

);


return res

.status(401)

.send(
"Invalid admin credentials."
);

}


next();

}


/* =========================================================
ADMIN RATE LIMIT
========================================================= */

const adminLimiter =
rateLimit({

windowMs:
15 * 60 * 1000,

limit:
20,

standardHeaders:
true,

legacyHeaders:
false,

skipSuccessfulRequests:
true,

message:
"Too many admin login attempts. Please try again later."

});


/* =========================================================
ADMIN CSRF SECURITY
========================================================= */

function createAdminCsrfToken(
identifier,
action
) {

return crypto

.createHmac(

"sha256",

ADMIN_PASSWORD ||
""

)

.update(

`${identifier}:${action}:set-apart-admin`

)

.digest(
"hex"
);

}


function verifyAdminCsrfToken(
identifier,
action,
token
) {

const expected =
createAdminCsrfToken(
identifier,
action
);


return secureTextEqual(
token,
expected
);

}


/* =========================================================
ADMIN SECURITY HEADERS
========================================================= */

function setAdminSecurityHeaders(
res
) {

res.set(
"Cache-Control",
"no-store, max-age=0"
);


res.set(
"Pragma",
"no-cache"
);


res.set(
"X-Robots-Tag",
"noindex, nofollow, noarchive"
);


res.set(
"X-Content-Type-Options",
"nosniff"
);


res.set(
"X-Frame-Options",
"DENY"
);


res.set(
"Referrer-Policy",
"no-referrer"
);


res.set(

"Content-Security-Policy",

"default-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"

);

}


/* =========================================================
ADMIN MONEY
========================================================= */

function adminMoney(
value
) {

return (

"$" +

Number(
value ||
0
).toFixed(
2
)

);

}


/* =========================================================
EXPIRE OLD PENDING ORDERS
========================================================= */

async function expireOldPendingOrders() {

await db(`

UPDATE orders

SET

payment_status =
'EXPIRED',

order_status =
'EXPIRED',

updated_at =
NOW()

WHERE payment_status =
'PENDING_PAYMENT'

AND created_at <
NOW() - INTERVAL '24 hours'

`);

}


/* =========================================================
GET ADMIN DASHBOARD DATA
========================================================= */

async function getAdminDashboardData() {

await expireOldPendingOrders();


await ensureEmailFailuresTable();


const summaryResult =
await db(`

SELECT

COUNT(*)::int
AS total_orders,


COALESCE(

SUM(total_usd)

FILTER (

WHERE payment_status =
'COMPLETED'

),

0

)
AS total_sales,


COUNT(*)

FILTER (

WHERE payment_status =
'PENDING_PAYMENT'

)::int
AS pending_payment,


COUNT(*)

FILTER (

WHERE payment_status =
'EXPIRED'

)::int
AS expired,


COUNT(*)

FILTER (

WHERE order_status =
'PAID'

)::int
AS paid,


COUNT(*)

FILTER (

WHERE order_status =
'PROCESSING'

)::int
AS processing,


COUNT(*)

FILTER (

WHERE order_status =
'SHIPPED'

)::int
AS shipped,


COUNT(*)

FILTER (

WHERE order_status =
'COMPLETED'

)::int
AS completed


FROM orders

`);


const ordersResult =
await db(`

SELECT

o.*,


COALESCE(

json_agg(

json_build_object(

'id',
oi.id,

'product_id',
oi.product_id,

'product_name',
oi.product_name,

'color',
oi.color,

'size',
oi.size,

'quantity',
oi.quantity,

'unit_price_usd',
oi.unit_price_usd,

'line_total_usd',
oi.line_total_usd

)

ORDER BY
oi.id ASC

)

FILTER (

WHERE oi.id
IS NOT NULL

),

'[]'::json

)
AS items


FROM orders o


LEFT JOIN order_items oi

ON oi.order_id =
o.id


GROUP BY
o.id


ORDER BY
o.created_at DESC


LIMIT 250

`);


const failedEmailsResult =
await db(`

SELECT

ef.id,

ef.paypal_order_id,

ef.email_type,

ef.recipient_email,

ef.error_message,

ef.retry_count,

ef.created_at,

ef.last_retry_at,

o.payment_status,

o.order_status


FROM email_failures ef


JOIN orders o

ON o.paypal_order_id =
ef.paypal_order_id


WHERE ef.resolved =
FALSE


ORDER BY
ef.created_at DESC


LIMIT 100

`);


return {

summary: {

...(
summaryResult.rows[0] ||
{}
),

failed_emails:
failedEmailsResult
.rows
.length

},


orders:
ordersResult.rows,


failedEmails:
failedEmailsResult.rows

};

}


/* =========================================================
RETRY FAILED EMAIL
========================================================= */

async function retryFailedEmail(
failureID
) {

await ensureEmailFailuresTable();


const failureResult =
await db(

`
SELECT *

FROM email_failures

WHERE id = $1

AND resolved =
FALSE

LIMIT 1
`,

[
failureID
]

);


if (

failureResult.rows.length ===
0

) {

throw new Error(
"Failed email record was not found or is already resolved."
);

}


const failure =
failureResult.rows[0];


const stored =
await getStoredOrder(
failure.paypal_order_id
);


if (!stored) {

throw new Error(
"Order linked to this failed email was not found."
);

}


const customer =
customerFromStoredOrder(
stored.order
);


const shipping =
shippingFromStoredOrder(
stored.order
);


const items =
itemsFromStoredOrder(
stored.items
);


const total =
Number(
stored.order.total_usd
).toFixed(
2
);


try {

if (

failure.email_type ===
"ADMIN_ORDER"

) {

await sendOrderNotification({

orderID:
failure.paypal_order_id,

total:
total,

customer:
customer,

items:
items,

shipping:
shipping

});

}


else if (

failure.email_type ===
"CUSTOMER_CONFIRMATION"

) {

await sendCustomerConfirmation({

orderID:
failure.paypal_order_id,

total:
total,

customer:
customer,

items:
items,

shipping:
shipping

});

}


else if (

failure.email_type ===
"SHIPPING_CONFIRMATION"

) {

if (
!stored.order.tracking_number
) {

throw new Error(
"Tracking number is missing for this shipped order."
);

}


await sendShippingConfirmation({

orderID:
failure.paypal_order_id,

customerEmail:
stored.order.customer_email,

customerName:
`${stored.order.first_name} ${stored.order.last_name}`
.trim(),

carrier:
stored.order.carrier,

trackingNumber:
stored.order.tracking_number

});

}


else {

throw new Error(
"Unknown email type."
);

}


await db(

`
UPDATE email_failures

SET

resolved =
TRUE,

resolved_at =
NOW(),

last_retry_at =
NOW(),

retry_count =
retry_count + 1,

updated_at =
NOW()

WHERE id = $1
`,

[
failureID
]

);


return failure;

}


catch (
error
) {

await db(

`
UPDATE email_failures

SET

error_message = $1,

last_retry_at =
NOW(),

retry_count =
retry_count + 1,

updated_at =
NOW()

WHERE id = $2
`,

[

emailErrorMessage(
error
),

failureID

]

);


throw error;

}

}


/* =========================================================
RENDER ADMIN DASHBOARD
========================================================= */

function renderAdminDashboard(
data,
notice = ""
) {

const summary =
data.summary ||
{};


const orders =
Array.isArray(
data.orders
)

? data.orders

: [];


const failedEmails =
Array.isArray(
data.failedEmails
)

? data.failedEmails

: [];


const orderCards =
orders.length

? orders.map(

function (
order
) {

const items =
Array.isArray(
order.items
)

? order.items

: [];


const paymentStatus =
String(
order.payment_status ||
""
)
.trim()
.toUpperCase();


const orderStatus =
String(
order.order_status ||
""
)
.trim()
.toUpperCase();


const isPaid =
paymentStatus ===
"COMPLETED";


const canProcess =

isPaid &&

orderStatus ===
"PAID";


const canShip =

isPaid &&

orderStatus ===
"PROCESSING";


const canComplete =

isPaid &&

orderStatus ===
"SHIPPED";


const canDelete =

[

"PENDING_PAYMENT",

"EXPIRED"

].includes(
paymentStatus
)

||

orderStatus ===
"CANCELLED";


const processToken =
createAdminCsrfToken(

order.paypal_order_id,

"process"

);


const shipToken =
createAdminCsrfToken(

order.paypal_order_id,

"ship"

);


const completeToken =
createAdminCsrfToken(

order.paypal_order_id,

"complete"

);


const deleteToken =
createAdminCsrfToken(

order.paypal_order_id,

"delete"

);


const productsHtml =
items.map(

function (
item
) {

return `

<tr>

<td>
${escapeHtml(
item.product_name
)}
</td>

<td>
${escapeHtml(
String(
item.color ||
""
).toUpperCase()
)}
</td>

<td>
${escapeHtml(
item.size
)}
</td>

<td>
${escapeHtml(
item.quantity
)}
</td>

<td>
${adminMoney(
item.unit_price_usd
)}
</td>

<td>
${adminMoney(
item.line_total_usd
)}
</td>

</tr>

`;

}

).join(
""
);


const shippingPrice =

order.shipping_local_currency ===
"DOP"

? `RD$${Number(
order.shipping_local_amount ||
0
).toFixed(0)} / ${adminMoney(
order.shipping_usd
)} USD`

: `${adminMoney(
order.shipping_usd
)} USD`;


return `

<article class="order-card">

<div class="order-top">

<div>

<div class="order-id">

${escapeHtml(
order.paypal_order_id
)}

</div>


<div class="order-date">

${escapeHtml(

new Date(
order.created_at
)

.toLocaleString(
"en-US"
)

)}

</div>

</div>


<div class="badges">

<span
class="badge ${
isPaid
? "paid"
: ""
}"
>

${escapeHtml(
paymentStatus
)}

</span>


<span class="badge">

${escapeHtml(
orderStatus
)}

</span>

</div>

</div>


<div class="order-grid">


<section>

<h3>
CUSTOMER
</h3>


<p>

<strong>

${escapeHtml(
order.first_name
)}

${escapeHtml(
order.last_name
)}

</strong>

</p>


<p>
${escapeHtml(
order.customer_email
)}
</p>


<p>
${escapeHtml(
order.phone
)}
</p>


<p>

${escapeHtml(
order.address
)}

${
order.apartment

? ", " +
escapeHtml(
order.apartment
)

: ""
}

</p>


<p>

${escapeHtml(
order.city
)}

${
order.state

? ", " +
escapeHtml(
order.state
)

: ""
}

—

${escapeHtml(
order.country
)}

</p>

</section>


<section>

<h3>
PAYMENT
</h3>


<p>

Subtotal:

<strong>

${adminMoney(
order.subtotal_usd
)}

</strong>

</p>


<p>

Shipping:

<strong>

${escapeHtml(
shippingPrice
)}

</strong>

</p>


<p>

Total:

<strong>

${adminMoney(
order.total_usd
)}

</strong>

</p>


<p>

Capture:

${escapeHtml(

order.paypal_capture_id ||

"Not captured"

)}

</p>

</section>


<section>

<h3>
SHIPPING
</h3>


<p>

<strong>

${escapeHtml(
order.shipping_method
)}

</strong>

</p>


<p>

Carrier:

${escapeHtml(

order.carrier ||

"—"

)}

</p>


<p>

Tracking:

${escapeHtml(

order.tracking_number ||

"—"

)}

</p>

</section>


</div>


<details>

<summary>

VIEW PRODUCTS
(${items.length})

</summary>


<div class="table-wrap">

<table>

<thead>

<tr>

<th>
PRODUCT
</th>

<th>
COLOR
</th>

<th>
SIZE
</th>

<th>
QTY
</th>

<th>
UNIT
</th>

<th>
TOTAL
</th>

</tr>

</thead>


<tbody>

${productsHtml}

</tbody>

</table>

</div>

</details>


<div class="actions">


${
canProcess

? `

<form

method="post"

action="/admin/orders/${encodeURIComponent(
order.paypal_order_id
)}/action"

>

<input
type="hidden"
name="action"
value="process"
>


<input
type="hidden"
name="csrf"
value="${processToken}"
>


<button
type="submit"
>
MARK PROCESSING
</button>

</form>

`

: ""
}


${
canShip

? `

<form

class="ship-form"

method="post"

action="/admin/orders/${encodeURIComponent(
order.paypal_order_id
)}/action"

>

<input
type="hidden"
name="action"
value="ship"
>


<input
type="hidden"
name="csrf"
value="${shipToken}"
>


<input

type="text"

name="carrier"

maxlength="100"

placeholder="Carrier"

>


<input

type="text"

name="trackingNumber"

maxlength="255"

placeholder="Tracking number"

required

>


<button
type="submit"
>
MARK SHIPPED
</button>

</form>

`

: ""
}


${
canComplete

? `

<form

method="post"

action="/admin/orders/${encodeURIComponent(
order.paypal_order_id
)}/action"

>

<input
type="hidden"
name="action"
value="complete"
>


<input
type="hidden"
name="csrf"
value="${completeToken}"
>


<button

type="submit"

class="secondary"

>
MARK COMPLETED
</button>

</form>

`

: ""
}


${
canDelete

? `

<form

method="post"

action="/admin/orders/${encodeURIComponent(
order.paypal_order_id
)}/action"

onsubmit="return confirm('Are you sure you want to permanently delete this order?');"

>

<input
type="hidden"
name="action"
value="delete"
>


<input
type="hidden"
name="csrf"
value="${deleteToken}"
>


<button

type="submit"

class="danger"

>
DELETE ORDER
</button>

</form>

`

: ""
}


</div>

</article>

`;

}

).join(
""
)


: `

<div class="empty">

NO ORDERS YET.

</div>

`;


const failedEmailsHtml =
failedEmails.length

? failedEmails.map(

function (
failure
) {

const retryToken =
createAdminCsrfToken(

`email-${failure.id}`,

"retry-email"

);


return `

<article class="failed-email-card">

<div>

<strong>

${escapeHtml(
failure.email_type
)}

</strong>


<div class="small-line">

Order:

${escapeHtml(
failure.paypal_order_id
)}

</div>


<div class="small-line">

Recipient:

${escapeHtml(
failure.recipient_email
)}

</div>


<div
class="small-line error-text"
>

${escapeHtml(
failure.error_message
)}

</div>


<div class="small-line">

Retries:

${Number(
failure.retry_count ||
0
)}

</div>

</div>


<form

method="post"

action="/admin/email-failures/${encodeURIComponent(
failure.id
)}/retry"

>

<input

type="hidden"

name="csrf"

value="${retryToken}"

>


<button

type="submit"

class="secondary"

>

RETRY EMAIL

</button>

</form>

</article>

`;

}

).join(
""
)


: `

<div class="empty compact-empty">

NO FAILED EMAILS.

</div>

`;


return `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">


<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>


<meta
name="robots"
content="noindex, nofollow, noarchive"
>


<title>
SET APART — ADMIN
</title>


<style>

* {

box-sizing:
border-box;

}


body {

margin:
0;

font-family:
Arial,
Helvetica,
sans-serif;

background:
#f5f5f5;

color:
#111111;

}


.admin-header {

background:
#000000;

color:
#ffffff;

padding:
25px
4%;

display:
flex;

justify-content:
space-between;

align-items:
center;

gap:
20px;

}


.admin-logo {

font-size:
22px;

font-weight:
900;

letter-spacing:
4px;

}


.admin-header small {

color:
#aaaaaa;

}


.admin-container {

width:
min(
1450px,
calc(
100% - 32px
)
);

margin:
30px
auto
70px;

}


.stats {

display:
grid;

grid-template-columns:
repeat(
auto-fit,
minmax(
150px,
1fr
)
);

gap:
12px;

margin-bottom:
30px;

}


.stat {

background:
#ffffff;

border:
1px solid
#dddddd;

padding:
20px;

min-width:
0;

}


.stat span {

display:
block;

color:
#777777;

font-size:
10px;

font-weight:
800;

letter-spacing:
1.3px;

margin-bottom:
10px;

}


.stat strong {

font-size:
24px;

}


.notice {

background:
#111111;

color:
#ffffff;

padding:
14px
18px;

margin-bottom:
20px;

}


.section-title {

display:
flex;

justify-content:
space-between;

align-items:
center;

gap:
20px;

margin:
30px
0
15px;

}


.section-title h1 {

margin:
0;

font-size:
24px;

}


.section-title a {

color:
#111111;

font-size:
11px;

font-weight:
900;

}


.order-card,
.failed-email-card {

background:
#ffffff;

border:
1px solid
#dddddd;

padding:
22px;

margin-bottom:
18px;

}


.order-top {

display:
flex;

justify-content:
space-between;

align-items:
flex-start;

gap:
20px;

padding-bottom:
18px;

margin-bottom:
20px;

border-bottom:
1px solid
#eeeeee;

}


.order-id {

font-size:
14px;

font-weight:
900;

word-break:
break-all;

}


.order-date,
.small-line {

color:
#777777;

font-size:
12px;

line-height:
1.55;

margin-top:
6px;

word-break:
break-word;

}


.error-text {

color:
#9b1c1c;

}


.badges {

display:
flex;

gap:
7px;

flex-wrap:
wrap;

}


.badge {

border:
1px solid
#111111;

padding:
7px
10px;

font-size:
10px;

font-weight:
900;

}


.badge.paid {

background:
#111111;

color:
#ffffff;

}


.order-grid {

display:
grid;

grid-template-columns:
repeat(
3,
1fr
);

gap:
25px;

margin-bottom:
20px;

}


.order-grid h3 {

font-size:
11px;

letter-spacing:
1.3px;

}


.order-grid p {

font-size:
13px;

line-height:
1.5;

margin:
6px
0;

}


details {

padding-top:
15px;

border-top:
1px solid
#eeeeee;

}


summary {

cursor:
pointer;

font-size:
11px;

font-weight:
900;

letter-spacing:
1px;

}


.table-wrap {

overflow-x:
auto;

margin-top:
15px;

}


table {

width:
100%;

border-collapse:
collapse;

min-width:
650px;

}


th,
td {

text-align:
left;

padding:
11px;

border-bottom:
1px solid
#eeeeee;

font-size:
12px;

}


th {

background:
#f7f7f7;

font-size:
10px;

}


.actions {

display:
flex;

flex-wrap:
wrap;

gap:
10px;

align-items:
end;

border-top:
1px solid
#eeeeee;

margin-top:
18px;

padding-top:
18px;

}


form {

margin:
0;

}


.ship-form {

display:
grid;

grid-template-columns:
160px
220px
auto;

gap:
8px;

}


input {

min-height:
42px;

border:
1px solid
#bbbbbb;

padding:
0
11px;

}


button {

min-height:
42px;

border:
1px solid
#111111;

background:
#111111;

color:
#ffffff;

padding:
0
15px;

font-size:
10px;

font-weight:
900;

cursor:
pointer;

}


button.secondary {

background:
#ffffff;

color:
#111111;

}


button.danger {

background:
#b91c1c;

border-color:
#b91c1c;

color:
#ffffff;

}


.failed-email-card {

display:
flex;

align-items:
center;

justify-content:
space-between;

gap:
24px;

}


.failed-email-card > div {

min-width:
0;

flex:
1;

}


.empty {

background:
#ffffff;

padding:
50px;

text-align:
center;

border:
1px solid
#dddddd;

}


.compact-empty {

padding:
24px;

}


@media (
max-width:
1050px
) {

.order-grid {

grid-template-columns:
1fr
1fr;

}

}


@media (
max-width:
700px
) {

.admin-header,
.order-top,
.failed-email-card {

flex-direction:
column;

align-items:
flex-start;

}


.order-grid {

grid-template-columns:
1fr;

}


.ship-form {

grid-template-columns:
1fr;

width:
100%;

}


.actions form,
.actions button,
.failed-email-card form,
.failed-email-card button {

width:
100%;

}

}

</style>

</head>


<body>


<header class="admin-header">

<div>

<div class="admin-logo">
SET APART
</div>

<small>
PRIVATE ADMIN DASHBOARD
</small>

</div>


<small>
ORDERS • PAYMENTS • SHIPPING • EMAILS
</small>

</header>


<main class="admin-container">


${
notice

? `

<div class="notice">

${escapeHtml(
notice
)}

</div>

`

: ""
}


<section class="stats">


<div class="stat">

<span>
TOTAL ORDERS
</span>

<strong>

${Number(
summary.total_orders ||
0
)}

</strong>

</div>


<div class="stat">

<span>
PAID SALES
</span>

<strong>

${adminMoney(
summary.total_sales
)}

</strong>

</div>


<div class="stat">

<span>
PENDING / EXPIRED
</span>

<strong>

${Number(
summary.pending_payment ||
0
)}

/

${Number(
summary.expired ||
0
)}

</strong>

</div>


<div class="stat">

<span>
PAID
</span>

<strong>

${Number(
summary.paid ||
0
)}

</strong>

</div>


<div class="stat">

<span>
PROCESSING
</span>

<strong>

${Number(
summary.processing ||
0
)}

</strong>

</div>


<div class="stat">

<span>
SHIPPED / COMPLETED
</span>

<strong>

${Number(
summary.shipped ||
0
)}

/

${Number(
summary.completed ||
0
)}

</strong>

</div>


<div class="stat">

<span>
FAILED EMAILS
</span>

<strong>

${Number(
summary.failed_emails ||
0
)}

</strong>

</div>


</section>


<div class="section-title">

<h1>
FAILED EMAILS
</h1>

<a href="/admin">
REFRESH
</a>

</div>


${failedEmailsHtml}


<div class="section-title">

<h1>
ORDERS
</h1>

<a href="/admin">
REFRESH
</a>

</div>


${orderCards}


</main>


</body>

</html>

`;

}


/* =========================================================
ADMIN PAGE
========================================================= */

app.get(

"/admin",

adminLimiter,

adminBasicAuth,

async function (
req,
res
) {

try {

setAdminSecurityHeaders(
res
);


const data =
await getAdminDashboardData();


const notice =
String(
req.query.notice ||
""
).slice(
0,
300
);


return res

.type(
"html"
)

.send(

renderAdminDashboard(
data,
notice
)

);

}


catch (
error
) {

console.error(

"Admin dashboard error:",

error

);


return res

.status(500)

.send(
"Admin dashboard could not be loaded."
);

}

}

);


/* =========================================================
RETRY FAILED EMAIL — ADMIN
========================================================= */

app.post(

"/admin/email-failures/:failureID/retry",

adminLimiter,

adminBasicAuth,

async function (
req,
res
) {

try {

setAdminSecurityHeaders(
res
);


const failureID =
Number(
req.params.failureID
);


const csrf =
String(
req.body.csrf ||
""
);


if (

!Number.isInteger(
failureID
) ||

failureID < 1

) {

return res

.status(400)

.send(
"Invalid failed email ID."
);

}


if (

!verifyAdminCsrfToken(

`email-${failureID}`,

"retry-email",

csrf

)

) {

return res

.status(403)

.send(
"Invalid admin security token."
);

}


const failure =
await retryFailedEmail(
failureID
);


return res.redirect(

303,

`/admin?notice=${encodeURIComponent(
`Email for order ${failure.paypal_order_id} was sent successfully.`
)}`

);

}


catch (
error
) {

console.error(

"Retry failed email error:",

error

);


return res.redirect(

303,

`/admin?notice=${encodeURIComponent(
`Email retry failed: ${emailErrorMessage(error)}`
)}`

);

}

}

);


/* =========================================================
ADMIN ORDER ACTIONS
========================================================= */

app.post(

"/admin/orders/:orderID/action",

adminLimiter,

adminBasicAuth,

async function (
req,
res
) {

try {

setAdminSecurityHeaders(
res
);


const orderID =
String(
req.params.orderID ||
""
).trim();


const action =
String(
req.body.action ||
""
)
.trim()
.toLowerCase();


const csrf =
String(
req.body.csrf ||
""
);


if (

!orderID ||

![
"process",
"ship",
"complete",
"delete"
].includes(
action
)

) {

return res

.status(400)

.send(
"Invalid admin action."
);

}


if (

!verifyAdminCsrfToken(

orderID,

action,

csrf

)

) {

return res

.status(403)

.send(
"Invalid admin security token."
);

}


const stored =
await getStoredOrder(
orderID
);


if (!stored) {

return res

.status(404)

.send(
"Order not found."
);

}


if (

action !==
"delete" &&

stored.order.payment_status !==
"COMPLETED"

) {

return res

.status(400)

.send(
"This order has not completed payment and cannot be fulfilled."
);

}


let notice =
"";


/* =================================================
DELETE ORDER
================================================= */

if (
action ===
"delete"
) {

const result =
await db(

`
DELETE FROM orders

WHERE paypal_order_id = $1

AND (

payment_status =
'PENDING_PAYMENT'

OR payment_status =
'EXPIRED'

OR order_status =
'CANCELLED'

)

RETURNING paypal_order_id
`,

[
orderID
]

);


if (

result.rows.length ===
0

) {

return res

.status(400)

.send(
"Only PENDING, EXPIRED, or CANCELLED orders can be deleted."
);

}


notice =
`Order ${orderID} was deleted.`;

}


/* =================================================
PROCESSING
================================================= */

if (
action ===
"process"
) {

const result =
await db(

`
UPDATE orders

SET

order_status =
'PROCESSING',

updated_at =
NOW()

WHERE paypal_order_id = $1

AND payment_status =
'COMPLETED'

AND order_status =
'PAID'

RETURNING *
`,

[
orderID
]

);


if (

result.rows.length ===
0

) {

return res

.status(400)

.send(
"Only PAID orders can be marked as PROCESSING."
);

}


notice =
`Order ${orderID} is now PROCESSING.`;

}


/* =================================================
COMPLETE
================================================= */

if (
action ===
"complete"
) {

const result =
await db(

`
UPDATE orders

SET

order_status =
'COMPLETED',

updated_at =
NOW()

WHERE paypal_order_id = $1

AND payment_status =
'COMPLETED'

AND order_status =
'SHIPPED'

RETURNING *
`,

[
orderID
]

);


if (

result.rows.length ===
0

) {

return res

.status(400)

.send(
"Only SHIPPED orders can be marked as COMPLETED."
);

}


notice =
`Order ${orderID} is now COMPLETED.`;

}


/* =================================================
SHIP
================================================= */

if (
action ===
"ship"
) {

const currentOrderStatus =
String(
stored.order.order_status ||
""
)
.trim()
.toUpperCase();


if (

currentOrderStatus !==
"PROCESSING"

) {

return res

.status(400)

.send(
"Only PROCESSING orders can be marked as SHIPPED."
);

}


const carrier =
String(
req.body.carrier ||
""
).trim();


const trackingNumber =
String(
req.body.trackingNumber ||
""
).trim();


if (
!trackingNumber
) {

return res

.status(400)

.send(
"Tracking number is required."
);

}


const customerName =

`${stored.order.first_name} ${stored.order.last_name}`

.trim();


await markOrderShipped({

paypalOrderID:
orderID,

carrier:
carrier,

trackingNumber:
trackingNumber

});


const shippingEmailResult =
await attemptTrackedEmail({

orderID:
orderID,

emailType:
"SHIPPING_CONFIRMATION",

recipientEmail:
stored.order.customer_email,

send:
function () {

return sendShippingConfirmation({

orderID:
orderID,

customerEmail:
stored.order.customer_email,

customerName:
customerName,

carrier:
carrier,

trackingNumber:
trackingNumber

});

}

});


notice =

shippingEmailResult.success

? `Order ${orderID} is now SHIPPED.`

: `Order ${orderID} is now SHIPPED. Shipping email failed and was added to FAILED EMAILS.`;

}


return res.redirect(

303,

`/admin?notice=${encodeURIComponent(
notice
)}`

);

}


catch (
error
) {

console.error(

"Admin order action error:",

error

);


return res

.status(500)

.send(
"Unable to update order."
);

}

}

);


/* =========================================================
DATABASE STARTUP CHECK
========================================================= */

if (pool) {

pool.query(
"SELECT 1 AS ok"
)

.then(

async function () {

await ensureEmailFailuresTable();


console.log(
"SET APART database connected successfully."
);

}

)

.catch(

function (
error
) {

console.error(

"SET APART database connection failed:",

error.message

);

}

);

}


else {

console.error(
"DATABASE_URL is missing. Orders cannot be saved to Neon."
);

}


/* =========================================================
START SERVER
========================================================= */

app.listen(

PORT,

function () {

console.log(

`SET APART server running on port ${PORT}`

);

}

);
