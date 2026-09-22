/* =========================================================
   SET APART — PAYPAL + EMAIL + NEON BACKEND
========================================================= */

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;


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
    Number(process.env.DOP_PER_USD);

const DATABASE_URL =
    process.env.DATABASE_URL;


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
        limit: "1mb"
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
            "x-admin-key"
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


const failedEmailCaptures =
    new Set();


const processedPayPalWebhookEvents =
    new Set();


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {

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


function normalizePlace(value) {

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


function validateCustomer(
    customer
) {

    const source =
        customer || {};


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
        customer || {};


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

                payment_status =
                    'COMPLETED',

                order_status =
                    CASE

                        WHEN order_status =
                            'PENDING'

                        THEN 'PAID'

                        ELSE order_status

                    END,

                updated_at =
                    NOW()

            WHERE paypal_order_id = $2

            RETURNING *
            `,

            [
                captureID,
                paypalOrderID
            ]

        );


    if (
        result.rows.length ===
        0
    ) {

        throw new Error(
            "Order could not be updated in database."
        );

    }


    return result.rows[0];

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

        console.error(
            "Resend environment variables are missing."
        );


        return;

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

                ${escapeHtml(orderID)}
            </p>


            <p>
                <strong>
                    Total Paid:
                </strong>

                $${escapeHtml(total)} USD
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

                    ${orderItemsHtml(items)}

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
                    $${escapeHtml(total)} USD

                </strong>

            </div>

        </div>

    `;


    const result =
        await resend.emails.send({

            from:
                "SET APART Orders <onboarding@resend.dev>",

            to:
                [
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
        !customer?.email
    ) {

        return;

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

                    ${escapeHtml(orderID)}

                </p>


                <p>

                    <strong>
                        Total Paid:
                    </strong>

                    $${escapeHtml(total)} USD

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

                        ${orderItemsHtml(items)}

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
                        $${escapeHtml(total)} USD

                    </strong>

                </div>

            </div>

        </div>

    `;


    const result =
        await resend.emails.send({

            from:
                "SET APART Orders <onboarding@resend.dev>",

            to:
                [
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

                    ${escapeHtml(orderID)}

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

            to:
                [
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
   SAVE PENDING ORDER TO NEON
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


            /* =================================================
               ALREADY PAID
            ================================================= */

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


            /* =================================================
               VERIFY PAYPAL ORDER BEFORE CAPTURE
            ================================================= */

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


            /* =================================================
               CAPTURE PAYMENT
            ================================================= */

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


                /* =================================================
                   IF PAYPAL SAYS CAPTURE ERROR,
                   CHECK WHETHER IT WAS ALREADY CAPTURED
                ================================================= */

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


            /* =================================================
               VERIFY CAPTURED AMOUNT
            ================================================= */

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


            /* =================================================
               UPDATE DATABASE
            ================================================= */

            const paidOrder =
                await markOrderPaid({

                    paypalOrderID:
                        orderID,

                    captureID:
                        capture.id

                });


            const customer =
                customerFromStoredOrder(
                    paidOrder
                );


            const shipping =
                shippingFromStoredOrder(
                    paidOrder
                );


            const items =
                itemsFromStoredOrder(
                    stored.items
                );


            /* =================================================
               EMAILS
            ================================================= */

            try {

                await sendOrderNotification({

                    orderID:
                        orderID,

                    total:
                        capturedAmount,

                    customer:
                        customer,

                    items:
                        items,

                    shipping:
                        shipping

                });


                await sendCustomerConfirmation({

                    orderID:
                        orderID,

                    total:
                        capturedAmount,

                    customer:
                        customer,

                    items:
                        items,

                    shipping:
                        shipping

                });

            }


            catch (
                emailError
            ) {

                console.error(
                    "Payment completed but email failed:",
                    emailError
                );


                failedEmailCaptures.add(
                    capture.id
                );

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
   FAILED EMAILS — ADMIN
========================================================= */

app.get(

    "/api/admin/failed-emails",

    function (
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


        return res.json({

            success:
                true,

            count:
                failedEmailCaptures.size,

            captureIDs:
                Array.from(
                    failedEmailCaptures
                )

        });

    }

);


/* =========================================================
   MARK ORDER SHIPPED
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
                "COMPLETED"
            ) {

                return res

                    .status(400)

                    .json({

                        success:
                            false,

                        error:
                            "Only paid orders can be marked as shipped."

                    });

            }


            const customerName =

                `${stored.order.first_name} ${stored.order.last_name}`

                    .trim();


            await sendShippingConfirmation({

                orderID:
                    orderID,

                customerEmail:
                    stored.order
                        .customer_email,

                customerName:
                    customerName,

                carrier:
                    carrier,

                trackingNumber:
                    trackingNumber

            });


            const updated =
                await markOrderShipped({

                    paypalOrderID:
                        orderID,

                    carrier:
                        carrier,

                    trackingNumber:
                        trackingNumber

                });


            return res.json({

                success:
                    true,

                message:
                    "Shipping confirmation email sent successfully.",

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
   PAYPAL WEBHOOK
========================================================= */

app.post(

    "/api/paypal/webhook",

    async function (
        req,
        res
    ) {

        try {

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
                event?.id;


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


            if (
                processedPayPalWebhookEvents.has(
                    eventID
                )
            ) {

                return res

                    .status(200)

                    .json({

                        success:
                            true,

                        duplicate:
                            true

                    });

            }


            processedPayPalWebhookEvents.add(
                eventID
            );


            console.log(

                "Verified PayPal webhook:",

                event?.event_type ||
                "UNKNOWN EVENT"

            );


            if (
                event?.event_type ===
                "PAYMENT.CAPTURE.COMPLETED"
            ) {

                console.log(

                    "Verified PayPal payment capture:",

                    event.resource?.id

                );

            }


            return res

                .status(200)

                .json({

                    success:
                        true

                });

        }


        catch (
            error
        ) {

            console.error(
                "PayPal webhook error:",
                error
            );


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
   DATABASE STARTUP CHECK
========================================================= */

if (pool) {

    pool.query(
        "SELECT 1 AS ok"
    )

        .then(

            function () {

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
