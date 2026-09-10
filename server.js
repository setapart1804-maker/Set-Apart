/* =========================================================
   SET APART — PAYPAL BACKEND
   Sandbox Payment Server
========================================================= */

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com";


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json());

app.use(
    cors({
        origin: [
            "https://setapart1804-maker.github.io",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"]
    })
);


/* =========================================================
   HOME / HEALTH CHECK
========================================================= */

app.get("/", function (req, res) {

    res.json({
        success: true,
        message: "SET APART PayPal server is running."
    });

});


/* =========================================================
   GET PAYPAL ACCESS TOKEN
========================================================= */

async function generateAccessToken() {

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error("PayPal credentials are missing.");
    }

    const auth = Buffer.from(
        `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(
        `${PAYPAL_BASE_URL}/v1/oauth2/token`,
        {
            method: "POST",

            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },

            body: "grant_type=client_credentials"
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error("PayPal access token error:", data);
        throw new Error("Unable to authenticate with PayPal.");
    }

    return data.access_token;
}


/* =========================================================
   PRODUCT CATALOG
   SERVER CONTROLS THE REAL PRICE
========================================================= */

const PRODUCTS = {

    pilgrim: {
        name: "PILGRIM HOODIE",
        price: 44.99
    },

    godfirst: {
        name: "GOD FIRST HOODIE",
        price: 44.99
    }

};


/* =========================================================
   CALCULATE ORDER TOTAL
========================================================= */

function calculateOrder(items) {

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Cart is empty.");
    }

    let total = 0;

    const paypalItems = items.map(function (item) {

        const product = PRODUCTS[item.id];

        if (!product) {
            throw new Error("Invalid product.");
        }

        const quantity = Number(item.quantity);

        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 20
        ) {
            throw new Error("Invalid quantity.");
        }

        total += product.price * quantity;

        return {
            name: product.name,

            quantity: String(quantity),

            unit_amount: {
                currency_code: "USD",
                value: product.price.toFixed(2)
            }
        };

    });

    return {
        total: total.toFixed(2),
        paypalItems
    };
}


/* =========================================================
   CREATE PAYPAL ORDER
========================================================= */

app.post("/api/paypal/orders", async function (req, res) {

    try {

        const { items } = req.body;

        const order = calculateOrder(items);

        const accessToken = await generateAccessToken();

        const response = await fetch(
            `${PAYPAL_BASE_URL}/v2/checkout/orders`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },

                body: JSON.stringify({

                    intent: "CAPTURE",

                    purchase_units: [
                        {
                            amount: {
                                currency_code: "USD",
                                value: order.total,

                                breakdown: {
                                    item_total: {
                                        currency_code: "USD",
                                        value: order.total
                                    }
                                }
                            },

                            items: order.paypalItems
                        }
                    ]

                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error(
                "PayPal create order error:",
                data
            );

            return res.status(response.status).json({
                success: false,
                error: "Unable to create PayPal order."
            });

        }

        res.json({
            success: true,
            id: data.id
        });

    } catch (error) {

        console.error(
            "Create order error:",
            error
        );

        res.status(400).json({
            success: false,
            error: error.message
        });

    }

});


/* =========================================================
   CAPTURE PAYPAL ORDER
========================================================= */

app.post(
    "/api/paypal/orders/:orderID/capture",
    async function (req, res) {

        try {

            const orderID = req.params.orderID;

            if (!orderID) {

                return res.status(400).json({
                    success: false,
                    error: "Order ID is required."
                });

            }

            const accessToken =
                await generateAccessToken();

            const response = await fetch(
                `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.error(
                    "PayPal capture error:",
                    data
                );

                return res.status(response.status).json({
                    success: false,
                    error: "Unable to capture PayPal payment."
                });

            }

            res.json({
                success: true,
                orderID: data.id,
                status: data.status
            });

        } catch (error) {

            console.error(
                "Capture order error:",
                error
            );

            res.status(500).json({
                success: false,
                error: "Payment capture failed."
            });

        }

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, function () {

    console.log(
        `SET APART PayPal server running on port ${PORT}`
    );

});
