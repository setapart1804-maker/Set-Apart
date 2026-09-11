/* =========================================================
   SET APART — PAYPAL + EMAIL BACKEND
   Sandbox Payment Server
========================================================= */

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");


const app = express();

const PORT =
    process.env.PORT || 3000;


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

/* =========================================================
   PAYPAL
========================================================= */

const PAYPAL_BASE_URL =
    "https://api-m.paypal.com";


/* =========================================================
   RESEND
========================================================= */

const resend =
    new Resend(
        RESEND_API_KEY
    );


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
   HOME / HEALTH CHECK
========================================================= */

app.get(
    "/",
    function (req, res) {

        res.json({

            success: true,

            message:
                "SET APART PayPal + Email server is running."

        });

    }
);


/* =========================================================
   PRODUCT CATALOG
   SERVER CONTROLS REAL PRICES
========================================================= */

const PRODUCTS = {

    pilgrim: {

        name:
            "PILGRIM HOODIE",

        price:
           34.99

    },


    godfirst: {

        name:
            "GOD FIRST HOODIE",

        price:
            34.99

    }

};


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)

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


/* =========================================================
   GET PAYPAL ACCESS TOKEN
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

                    "Authorization":
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


    if (!response.ok) {

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


/* =========================================================
   CALCULATE ORDER
========================================================= */

function calculateOrder(items) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        throw new Error(
            "Cart is empty."
        );

    }


    let total = 0;


    const paypalItems =
        items.map(
            function (item) {

                const product =
                    PRODUCTS[item.id];


                if (!product) {

                    throw new Error(
                        "Invalid product."
                    );

                }


                const quantity =
                    Number(
                        item.quantity
                    );


                if (
                    !Number.isInteger(quantity) ||
                    quantity < 1 ||
                    quantity > 20
                ) {

                    throw new Error(
                        "Invalid quantity."
                    );

                }


                total +=
                    product.price *
                    quantity;


                return {

                    name:
                        product.name,

                    quantity:
                        String(quantity),

                    unit_amount: {

                        currency_code:
                            "USD",

                        value:
                            product.price.toFixed(
                                2
                            )

                    }

                };

            }
        );


    return {

        total:
            total.toFixed(
                2
            ),

        paypalItems

    };

}


/* =========================================================
   CREATE PAYPAL ORDER
========================================================= */

app.post(
    "/api/paypal/orders",

    async function (req, res) {

        try {

            const { items } =
                req.body;


            const order =
                calculateOrder(
                    items
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

                            "Authorization":
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
                                                        order.total

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


            if (!response.ok) {

                console.error(
                    "PayPal create order error:",
                    data
                );


                return res
                    .status(
                        response.status
                    )
                    .json({

                        success:
                            false,

                        error:
                            "Unable to create PayPal order."

                    });

            }


            res.json({

                success:
                    true,

                id:
                    data.id

            });

        }


        catch (error) {

            console.error(
                "Create order error:",
                error
            );


            res
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
   SEND ORDER NOTIFICATION EMAIL
========================================================= */

async function sendOrderNotification({

    orderID,
    total,
    customer,
    items

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


    const safeCustomer =
        customer || {};


    const customerName =
        `${safeCustomer.firstName || ""} ${safeCustomer.lastName || ""}`
            .trim();


    const productsHtml =
        items.map(
            function (item) {

                const product =
                    PRODUCTS[item.id];


                if (!product) {
                    return "";
                }


                return `
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(product.name)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(item.color || "-")}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(item.size || "-")}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(item.quantity)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            $${product.price.toFixed(2)}
                        </td>
                    </tr>
                `;

            }
        )
        .join("");


    const addressParts = [

        safeCustomer.address,

        safeCustomer.apartment,

        safeCustomer.city,

        safeCustomer.state,

        safeCustomer.postalCode,

        safeCustomer.country

    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join(", ");


    const html = `

        <div
            style="
                font-family: Arial, sans-serif;
                max-width: 700px;
                margin: auto;
                color: #111111;
            "
        >

            <h1
                style="
                    font-size: 28px;
                    margin-bottom: 5px;
                "
            >
                NEW SET APART ORDER
            </h1>


            <p
                style="
                    margin-top: 0;
                    color: #666666;
                "
            >
                A PayPal payment was completed successfully.
            </p>


            <hr
                style="
                    border: 0;
                    border-top: 1px solid #dddddd;
                    margin: 25px 0;
                "
            >


            <h2>
                ORDER
            </h2>


            <p>
                <strong>PayPal Order ID:</strong>
                ${escapeHtml(orderID)}
            </p>


            <p>
                <strong>Total Paid:</strong>
                $${escapeHtml(total)} USD
            </p>


            <hr
                style="
                    border: 0;
                    border-top: 1px solid #dddddd;
                    margin: 25px 0;
                "
            >


            <h2>
                CUSTOMER
            </h2>


            <p>
                <strong>Name:</strong>
                ${escapeHtml(customerName || "-")}
            </p>


            <p>
                <strong>Email:</strong>
                ${escapeHtml(safeCustomer.email || "-")}
            </p>


            <p>
                <strong>Phone:</strong>
                ${escapeHtml(safeCustomer.phone || "-")}
            </p>


            <p>
                <strong>Shipping Address:</strong>
                ${addressParts || "-"}
            </p>


            <hr
                style="
                    border: 0;
                    border-top: 1px solid #dddddd;
                    margin: 25px 0;
                "
            >


            <h2>
                PRODUCTS
            </h2>


            <table
                style="
                    width: 100%;
                    border-collapse: collapse;
                "
            >

                <thead>

                    <tr>

                        <th
                            style="
                                text-align:left;
                                padding:10px;
                                border-bottom:2px solid #111;
                            "
                        >
                            PRODUCT
                        </th>

                        <th
                            style="
                                text-align:left;
                                padding:10px;
                                border-bottom:2px solid #111;
                            "
                        >
                            COLOR
                        </th>

                        <th
                            style="
                                text-align:left;
                                padding:10px;
                                border-bottom:2px solid #111;
                            "
                        >
                            SIZE
                        </th>

                        <th
                            style="
                                text-align:left;
                                padding:10px;
                                border-bottom:2px solid #111;
                            "
                        >
                            QTY
                        </th>

                        <th
                            style="
                                text-align:left;
                                padding:10px;
                                border-bottom:2px solid #111;
                            "
                        >
                            PRICE
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${productsHtml}

                </tbody>

            </table>


            <div
                style="
                    margin-top: 30px;
                    padding: 20px;
                    background: #111111;
                    color: #ffffff;
                "
            >

                <strong
                    style="
                        font-size: 20px;
                    "
                >
                    TOTAL: $${escapeHtml(total)} USD
                </strong>

            </div>


            <p
                style="
                    margin-top: 30px;
                    color: #777777;
                    font-size: 12px;
                "
            >
                SET APART — Faith-Inspired Streetwear
            </p>

        </div>

    `;


    const result =
        await resend.emails.send({

            from:
                "SET APART Orders <onboarding@resend.dev>",

            to:
                [ORDER_NOTIFICATION_EMAIL],

            subject:
                `NEW SET APART ORDER — $${total}`,

            html:
                html

        });


    if (result.error) {

        console.error(
            "Resend email error:",
            result.error
        );

        throw new Error(
            "Order email could not be sent."
        );

    }


    console.log(
        "Order notification email sent:",
        result.data
    );

}

async function sendCustomerConfirmation({
    orderID,
    total,
    customer,
    items
}) {

    if (!customer?.email) {
        console.log(
            "Customer email missing. Confirmation email skipped."
        );

        return;
    }


    const safeCustomer =
        customer || {};


    const customerName =
        `${safeCustomer.firstName || ""} ${safeCustomer.lastName || ""}`
            .trim();


    const productsHtml =
        items.map(
            function (item) {

                const product =
                    PRODUCTS[item.id];


                if (!product) {
                    return "";
                }


                return `
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(product.name)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(item.color || "-")}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(item.size || "-")}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            ${escapeHtml(item.quantity)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #ddd;">
                            $${product.price.toFixed(2)}
                        </td>
                    </tr>
                `;

            }
        )
        .join("");


    const addressParts = [

        safeCustomer.address,

        safeCustomer.apartment,

        safeCustomer.city,

        safeCustomer.state,

        safeCustomer.postalCode,

        safeCustomer.country

    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join(", ");


    const html = `

        <div
            style="
                font-family: Arial, sans-serif;
                max-width: 700px;
                margin: auto;
                color: #111111;
            "
        >

            <div
                style="
                    background:#111111;
                    color:#ffffff;
                    padding:30px;
                    text-align:center;
                "
            >

                <h1
                    style="
                        margin:0;
                        font-size:30px;
                        letter-spacing:4px;
                    "
                >
                    SET APART
                </h1>

                <p
                    style="
                        margin:10px 0 0;
                        font-size:12px;
                        letter-spacing:2px;
                    "
                >
                    CALLED TO LIVE DIFFERENTLY.
                </p>

            </div>


            <div style="padding:35px 10px;">

                <h2
                    style="
                        font-size:26px;
                        margin-bottom:10px;
                    "
                >
                    ORDER CONFIRMED
                </h2>


                <p
                    style="
                        color:#555555;
                        line-height:1.7;
                    "
                >
                    Hi ${escapeHtml(
                        safeCustomer.firstName || "there"
                    )},
                    thank you for your order.
                    Your PayPal payment was completed successfully,
                    and we are now preparing your SET APART order.
                </p>


                <hr
                    style="
                        border:0;
                        border-top:1px solid #dddddd;
                        margin:30px 0;
                    "
                >


                <h3>
                    ORDER DETAILS
                </h3>


                <p>
                    <strong>Order ID:</strong>
                    ${escapeHtml(orderID)}
                </p>


                <p>
                    <strong>Total Paid:</strong>
                    $${escapeHtml(total)} USD
                </p>


                <hr
                    style="
                        border:0;
                        border-top:1px solid #dddddd;
                        margin:30px 0;
                    "
                >


                <h3>
                    YOUR ITEMS
                </h3>


                <table
                    style="
                        width:100%;
                        border-collapse:collapse;
                    "
                >

                    <thead>

                        <tr>

                            <th
                                style="
                                    text-align:left;
                                    padding:10px;
                                    border-bottom:2px solid #111111;
                                "
                            >
                                PRODUCT
                            </th>

                            <th
                                style="
                                    text-align:left;
                                    padding:10px;
                                    border-bottom:2px solid #111111;
                                "
                            >
                                COLOR
                            </th>

                            <th
                                style="
                                    text-align:left;
                                    padding:10px;
                                    border-bottom:2px solid #111111;
                                "
                            >
                                SIZE
                            </th>

                            <th
                                style="
                                    text-align:left;
                                    padding:10px;
                                    border-bottom:2px solid #111111;
                                "
                            >
                                QTY
                            </th>

                            <th
                                style="
                                    text-align:left;
                                    padding:10px;
                                    border-bottom:2px solid #111111;
                                "
                            >
                                PRICE
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${productsHtml}

                    </tbody>

                </table>


                <hr
                    style="
                        border:0;
                        border-top:1px solid #dddddd;
                        margin:30px 0;
                    "
                >


                <h3>
                    SHIPPING TO
                </h3>


                <p>
                    <strong>
                        ${escapeHtml(customerName || "-")}
                    </strong>
                </p>


                <p
                    style="
                        color:#555555;
                        line-height:1.7;
                    "
                >
                    ${addressParts || "-"}
                </p>


                <div
                    style="
                        margin-top:30px;
                        padding:20px;
                        background:#111111;
                        color:#ffffff;
                    "
                >

                    <strong
                        style="
                            font-size:20px;
                        "
                    >
                        TOTAL: $${escapeHtml(total)} USD
                    </strong>

                </div>


                <p
                    style="
                        margin-top:30px;
                        color:#555555;
                        line-height:1.7;
                    "
                >
                    We'll contact you again when your order is ready to ship.
                </p>


                <p
                    style="
                        margin-top:35px;
                        color:#777777;
                        font-size:12px;
                    "
                >
                    SET APART — Faith-Inspired Streetwear
                </p>

            </div>

        </div>

    `;


    const result =
        await resend.emails.send({

            from:
                "SET APART Orders <onboarding@resend.dev>",

            to:
                [safeCustomer.email],

            subject:
                "ORDER CONFIRMED — SET APART",

            html:
                html

        });


    if (result.error) {

        console.error(
            "Customer confirmation email error:",
            result.error
        );

        throw new Error(
            "Customer confirmation email could not be sent."
        );

    }


    console.log(
        "Customer confirmation email sent:",
        result.data
    );

}

async function sendShippingConfirmation({
    orderID,
    customerEmail,
    customerName,
    carrier,
    trackingNumber
}) {

    if (!customerEmail) {
        throw new Error("Customer email is required.");
    }

    if (!trackingNumber) {
        throw new Error("Tracking number is required.");
    }


    const safeCarrier =
        carrier || "Shipping Carrier";


    const html = `

        <div
            style="
                font-family: Arial, sans-serif;
                max-width: 700px;
                margin: auto;
                color: #111111;
            "
        >

            <div
                style="
                    background:#111111;
                    color:#ffffff;
                    padding:30px;
                    text-align:center;
                "
            >

                <h1
                    style="
                        margin:0;
                        font-size:30px;
                        letter-spacing:4px;
                    "
                >
                    SET APART
                </h1>

                <p
                    style="
                        margin:10px 0 0;
                        font-size:12px;
                        letter-spacing:2px;
                    "
                >
                    CALLED TO LIVE DIFFERENTLY.
                </p>

            </div>


            <div style="padding:35px 10px;">

                <h2
                    style="
                        font-size:26px;
                        margin-bottom:10px;
                    "
                >
                    YOUR ORDER HAS SHIPPED
                </h2>


                <p
                    style="
                        color:#555555;
                        line-height:1.7;
                    "
                >
                    Hi ${escapeHtml(customerName || "there")},
                    your SET APART order is on the way.
                </p>


                <hr
                    style="
                        border:0;
                        border-top:1px solid #dddddd;
                        margin:30px 0;
                    "
                >


                <p>
                    <strong>Order ID:</strong>
                    ${escapeHtml(orderID || "-")}
                </p>


                <p>
                    <strong>Carrier:</strong>
                    ${escapeHtml(safeCarrier)}
                </p>


                <p>
                    <strong>Tracking Number:</strong>
                    ${escapeHtml(trackingNumber)}
                </p>


                <div
                    style="
                        margin-top:30px;
                        padding:20px;
                        background:#f5f5f5;
                    "
                >
                    <strong>
                        Keep this tracking number so you can follow your delivery.
                    </strong>
                </div>


                <p
                    style="
                        margin-top:35px;
                        color:#777777;
                        font-size:12px;
                    "
                >
                    SET APART — Faith-Inspired Streetwear
                </p>

            </div>

        </div>

    `;


    const result =
        await resend.emails.send({

            from:
                "SET APART Orders <onboarding@resend.dev>",

            to:
                [customerEmail],

            subject:
                "YOUR ORDER HAS SHIPPED — SET APART",

            html:
                html

        });


    if (result.error) {

        console.error(
            "Shipping confirmation email error:",
            result.error
        );

        throw new Error(
            "Shipping confirmation email could not be sent."
        );

    }


    console.log(
        "Shipping confirmation email sent:",
        result.data
    );

}
/* =========================================================
   CAPTURE PAYPAL ORDER
========================================================= */

app.post(

    "/api/paypal/orders/:orderID/capture",

    async function (req, res) {

        try {

            const orderID =
                req.params.orderID;


            const {
                customer,
                items
            } =
                req.body || {};


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


            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        error:
                            "Order items are required."

                    });

            }


            /*
               Recalculate price again on server.
               Never trust a price sent by browser.
            */

            const validatedOrder =
                calculateOrder(
                    items
                );


            const accessToken =
                await generateAccessToken();


            const response =
                await fetch(

                    `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${accessToken}`

                        }

                    }

                );


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "PayPal capture error:",
                    data
                );


                return res
                    .status(
                        response.status
                    )
                    .json({

                        success:
                            false,

                        error:
                            "Unable to capture PayPal payment."

                    });

            }


            if (
                data.status !==
                "COMPLETED"
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        orderID:
                            data.id,

                        status:
                            data.status,

                        error:
                            "Payment was not completed."

                    });

            }


            /* =================================================
               VERIFY CAPTURED AMOUNT
            ================================================= */

            const capture =
                data
                    ?.purchase_units?.[0]
                    ?.payments
                    ?.captures?.[0];


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
                    validatedOrder.total ||
                capturedCurrency !==
                    "USD"
            ) {

                console.error(
                    "Captured amount mismatch.",
                    {
                        expected:
                            validatedOrder.total,
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
               SEND EMAIL NOTIFICATION
            ================================================= */

            try {

                await sendOrderNotification({

                    orderID:
                        data.id,

                    total:
                        capturedAmount,

                    customer:
                        customer || {},

                    items:
                        items

                });

               await sendCustomerConfirmation({
                   orderID,
                   total,
                   customer,
                   items
               });

            }


            catch (emailError) {

                /*
                   PAYMENT IS ALREADY SUCCESSFUL.
                   Do not mark payment failed just because
                   email notification failed.
                */

                console.error(
                    "Payment completed but email failed:",
                    emailError
                );

            }


            /* =================================================
               SUCCESS RESPONSE
            ================================================= */

            res.json({

                success:
                    true,

                orderID:
                    data.id,

                status:
                    data.status,

                total:
                    capturedAmount,

                currency:
                    capturedCurrency

            });

        }


        catch (error) {

            console.error(
                "Capture order error:",
                error
            );


            res
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

app.post(
    "/api/orders/shipped",
    async function (req, res) {

        try {

           const adminKey =
    req.headers["x-admin-key"];


if (
    !ADMIN_SHIPPING_KEY ||
    adminKey !== ADMIN_SHIPPING_KEY
) {

    return res
        .status(401)
        .json({
            success: false,
            error: "Unauthorized."
        });

}

            const {
                orderID,
                customerEmail,
                customerName,
                carrier,
                trackingNumber
            } = req.body || {};


            if (
                !orderID ||
                !customerEmail ||
                !trackingNumber
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        error:
                            "Order ID, customer email and tracking number are required."
                    });

            }


            await sendShippingConfirmation({
                orderID,
                customerEmail,
                customerName,
                carrier,
                trackingNumber
            });


            return res.json({
                success: true,
                message:
                    "Shipping confirmation email sent successfully."
            });

        }

        catch (error) {

            console.error(
                "Shipping email route error:",
                error
            );


            return res
                .status(500)
                .json({
                    success: false,
                    error:
                        "Shipping confirmation email could not be sent."
                });

        }

    }
);

/* =========================================================
   PAYPAL WEBHOOK
========================================================= */

app.post(
    "/api/paypal/webhook",
    async function (req, res) {

        try {

            console.log(
                "PayPal webhook received:",
                req.body?.event_type || "UNKNOWN EVENT"
            );

            return res.status(200).json({
                success: true
            });

        }

        catch (error) {

            console.error(
                "PayPal webhook error:",
                error
            );

            return res.status(500).json({
                success: false
            });

        }

    }
);
/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,

    function () {

        console.log(
            `SET APART PayPal + Email server running on port ${PORT}`
        );

    }
);
