/* =====================================================
   CHECKOUT PAGE + SHIPPING
===================================================== */

const checkoutItems =
    document.getElementById(
        "checkoutItems"
    );


const checkoutSubtotal =
    document.getElementById(
        "checkoutSubtotal"
    );


const checkoutShipping =
    document.getElementById(
        "checkoutShipping"
    );


const checkoutTotal =
    document.getElementById(
        "checkoutTotal"
    );


const checkoutForm =
    document.getElementById(
        "checkoutForm"
    );


const checkoutCountry =
    document.getElementById(
        "country"
    );


const checkoutCity =
    document.getElementById(
        "city"
    );


const checkoutState =
    document.getElementById(
        "state"
    );


const shippingMethodLabel =
    document.getElementById(
        "shippingMethodLabel"
    );


const shippingMethodPrice =
    document.getElementById(
        "shippingMethodPrice"
    );


const shippingMethodNote =
    document.getElementById(
        "shippingMethodNote"
    );


const SHIPPING_BACKEND =
    "https://set-apart.onrender.com";


let checkoutSubtotalValue =
    0;


let currentShippingQuote =
    null;


let shippingRequestTimer =
    null;


function setShippingPending() {

    currentShippingQuote =
        null;

    if (checkoutShipping) {
        checkoutShipping.textContent =
            "—";
    }

    if (shippingMethodPrice) {
        shippingMethodPrice.textContent =
            "—";
    }

    if (checkoutTotal) {
        checkoutTotal.textContent =
            money(
                checkoutSubtotalValue
            );
    }

}


function updateShippingCopy(
    quote
) {

    if (!quote) {
        return;
    }

    if (shippingMethodLabel) {
        shippingMethodLabel.textContent =
            quote.method ||
            "SHIPPING";
    }

    if (shippingMethodPrice) {
        shippingMethodPrice.textContent =
            quote.displayPrice ||
            money(
                quote.shippingUSD
            );
    }

    if (checkoutShipping) {
        checkoutShipping.textContent =
            quote.displayPrice ||
            money(
                quote.shippingUSD
            );
    }

    if (shippingMethodNote) {
        shippingMethodNote.textContent =
            quote.note ||
            "Shipping calculated for your destination.";
    }

    if (checkoutTotal) {

        const shippingUSD =
            Number(
                quote.shippingUSD
            ) || 0;

        checkoutTotal.textContent =
            money(
                checkoutSubtotalValue +
                shippingUSD
            );
    }

}


async function refreshShippingQuote() {

    if (
        !checkoutForm ||
        !checkoutCountry
    ) {
        return null;
    }

    const country =
        checkoutCountry.value;

    const city =
        checkoutCity
            ? checkoutCity.value.trim()
            : "";

    const state =
        checkoutState
            ? checkoutState.value.trim()
            : "";


    if (!country) {

        setShippingPending();

        if (shippingMethodLabel) {
            shippingMethodLabel.textContent =
                "SELECT YOUR COUNTRY";
        }

        if (shippingMethodNote) {
            shippingMethodNote.textContent =
                "Shipping will be calculated from your destination.";
        }

        return null;
    }


    if (
        country === "DO" &&
        !city &&
        !state
    ) {

        setShippingPending();

        if (shippingMethodLabel) {
            shippingMethodLabel.textContent =
                "STANDARD SHIPPING";
        }

        if (shippingMethodNote) {
            shippingMethodNote.textContent =
                "Enter your city or province to calculate shipping.";
        }

        return null;
    }


    try {

        const response =
            await fetch(
                `${SHIPPING_BACKEND}/api/shipping/quote`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            country,
                            city,
                            state
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to calculate shipping."
            );
        }


        currentShippingQuote =
            data;

        updateShippingCopy(
            data
        );

        return data;

    } catch (error) {

        console.error(
            "Shipping quote error:",
            error
        );

        setShippingPending();

        if (shippingMethodLabel) {
            shippingMethodLabel.textContent =
                "SHIPPING UNAVAILABLE";
        }

        if (shippingMethodNote) {
            shippingMethodNote.textContent =
                "Shipping could not be calculated. Please try again.";
        }

        throw error;
    }

}


function scheduleShippingQuote() {

    clearTimeout(
        shippingRequestTimer
    );

    shippingRequestTimer =
        setTimeout(
            function () {

                refreshShippingQuote()
                    .catch(function () {
                        // Checkout UI already shows the error.
                    });

            },
            350
        );

}


if (checkoutItems) {

    const cart =
        getCart();


    checkoutItems.innerHTML =
        "";


    let subtotal =
        0;


    if (
        cart.length ===
        0
    ) {

        checkoutItems.innerHTML = `

            <div class="checkout-empty">

                <h3>
                    YOUR CART IS EMPTY
                </h3>

                <a
                    href="shop.html"
                    class="button button-black">

                    SHOP NOW

                </a>

            </div>

        `;


        if (checkoutForm) {

            const submit =
                checkoutForm
                    .querySelector(
                        '[type="submit"]'
                    );


            if (submit) {

                submit.disabled =
                    true;

            }

        }

    }


    cart.forEach(
        function (item) {

            const quantity =
                Math.max(
                    1,
                    Number(
                        item.quantity
                    ) || 1
                );


            const price =
                Number(
                    item.price
                ) || 0;


            const itemTotal =
                price *
                quantity;


            subtotal +=
                itemTotal;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "checkout-summary-item";


            element.innerHTML = `

                <div class="checkout-summary-image">

                    <img
                        src="${item.image || ""}"
                        alt="${item.name || "Product"}">

                    <span class="checkout-summary-quantity">
                        ${quantity}
                    </span>

                </div>


                <div class="checkout-summary-info">

                    <h3>
                        ${item.name || ""}
                    </h3>

                    <p>
                        COLOR:
                        ${(item.color || "").toUpperCase()}
                    </p>

                    <p>
                        SIZE:
                        ${(item.size || "").toUpperCase()}
                    </p>

                </div>


                <div class="checkout-summary-price">

                    ${money(itemTotal)}

                </div>

            `;


            checkoutItems
                .appendChild(
                    element
                );

        }
    );


    checkoutSubtotalValue =
        subtotal;


    if (checkoutSubtotal) {

        checkoutSubtotal.textContent =
            money(subtotal);

    }


    if (checkoutTotal) {

        checkoutTotal.textContent =
            money(subtotal);

    }

}


if (checkoutCountry) {

    checkoutCountry.addEventListener(
        "change",
        scheduleShippingQuote
    );

}


if (checkoutCity) {

    checkoutCity.addEventListener(
        "input",
        scheduleShippingQuote
    );

}


if (checkoutState) {

    checkoutState.addEventListener(
        "input",
        scheduleShippingQuote
    );

}


/* =====================================================
   CHECKOUT FORM
   PLACE ORDER → SHOW PAYPAL PAYMENT OPTIONS
===================================================== */

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (!checkoutForm.checkValidity()) {
                checkoutForm.reportValidity();
                return;
            }

            const completeOrderButton =
                checkoutForm.querySelector(
                    'button[type="submit"]'
                );

            if (completeOrderButton) {
                completeOrderButton.disabled = true;
                completeOrderButton.textContent =
                    "CALCULATING SHIPPING...";
            }

            try {

                const quote =
                    await refreshShippingQuote();

                if (!quote) {
                    throw new Error(
                        "Shipping information is incomplete."
                    );
                }

                const formData =
                    new FormData(checkoutForm);

                const customerData =
                    Object.fromEntries(
                        formData.entries()
                    );

                sessionStorage.setItem(
                    "setApartCheckoutCustomer",
                    JSON.stringify(customerData)
                );

                if (completeOrderButton) {
                    completeOrderButton.textContent =
                        "LOADING SECURE PAYMENT...";
                }

                if (
                    typeof window.showSetApartPayPalButtons !==
                    "function"
                ) {
                    throw new Error(
                        "PayPal payment system is not ready."
                    );
                }

                await window.showSetApartPayPalButtons();

                if (completeOrderButton) {
                    completeOrderButton.style.display =
                        "none";
                }

                const paypalContainer =
                    document.getElementById(
                        "paypal-button-container"
                    );

                if (paypalContainer) {

                    setTimeout(function () {

                        paypalContainer.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                    }, 100);

                }

            } catch (error) {

                console.error(
                    "Unable to prepare checkout:",
                    error
                );

                if (completeOrderButton) {

                    completeOrderButton.disabled =
                        false;

                    completeOrderButton.textContent =
                        "PLACE ORDER";
                }

                alert(
                    error.message ||
                    "Checkout could not be prepared. Please try again."
                );
            }
        }
    );
}
