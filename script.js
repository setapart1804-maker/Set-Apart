/* =========================================================
   SET APART — COMPLETE JAVASCRIPT
   SHOP + CART + CHECKOUT + SHIPPING + PAYPAL
========================================================= */

"use strict";


/* =========================================================
   GLOBAL HELPERS
========================================================= */

function money(value) {
    return "$" + (Number(value) || 0).toFixed(2);
}


function getCart() {

    try {

        const saved =
            localStorage.getItem("setApartCart");

        if (!saved) {
            return [];
        }

        const parsed =
            JSON.parse(saved);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (
            parsed &&
            typeof parsed === "object"
        ) {
            return [parsed];
        }

        return [];

    } catch (error) {

        console.error(
            "Cart data error:",
            error
        );

        return [];
    }
}


function saveCart(cart) {

    localStorage.setItem(
        "setApartCart",
        JSON.stringify(cart)
    );

    if (
        typeof window.updateSetApartCartCount ===
        "function"
    ) {

        window.updateSetApartCartCount();

    }
}


/* =========================================================
   PRODUCTS
========================================================= */

const SET_APART_PRODUCTS = {

    pilgrim: {

        id:
            "pilgrim",

        name:
            "PILGRIM HOODIE",

        price:
            34.99,

        defaultColor:
            "beige",

        images: {

            black: {
                front:
                    "PILGRIM BLACK FRONT 1.png",
                back:
                    "PILGRIM BLACK BACK.png"
            },

            white: {
                front:
                    "PILGRIM WHITE FRONT.jpeg",
                back:
                    "PILGRIM WHITE BACK.jpeg"
            },

            brown: {
                front:
                    "PILGRIM BROWN FRONT.jpeg",
                back:
                    "PILGRIM BROWN BLACK.jpeg"
            },

            beige: {
                front:
                    "PILGRIM BEIGE FRONT.jpeg",
                back:
                    "PILGRIM BEIGE BACK.jpeg"
            }

        }

    },


    godfirst: {

        id:
            "godfirst",

        name:
            "GOD FIRST HOODIE",

        price:
            34.99,

        defaultColor:
            "brown",

        images: {

            black: {
                front:
                    "GOD FIRST BLACK FRONT.jpeg",
                back:
                    "GOD FIRST BLACK BACK.jpeg"
            },

            white: {
                front:
                    "GOD FIRST WHITE FRONT.jpeg",
                back:
                    "GOD FIRST WHITE BACK.jpeg"
            },

            brown: {
                front:
                    "GOD FIRST BROWN FRONT.png",
                back:
                    "GOD FIRST BROWN BACK.png"
            },

            beige: {
                front:
                    "GOD FIRST BEIGE FRONT.jpeg",
                back:
                    "GOD FIRST BEIGE BACK.jpeg"
            }

        }

    }

};


const productState = {

    pilgrim: {
        color: "beige",
        size: null,
        side: "front"
    },

    godfirst: {
        color: "brown",
        size: null,
        side: "front"
    }

};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =====================================================
           HEADER
        ===================================================== */

        const menuToggle =
            document.getElementById(
                "menuToggle"
            );

        const mobileMenu =
            document.getElementById(
                "mobileMenu"
            );

        const searchButton =
            document.getElementById(
                "searchButton"
            );

        const searchPanel =
            document.getElementById(
                "searchPanel"
            );

        const closeSearch =
            document.getElementById(
                "closeSearch"
            );

        const searchForm =
            document.getElementById(
                "searchForm"
            );

        const searchInput =
            document.getElementById(
                "searchInput"
            );

        const pageOverlay =
            document.getElementById(
                "pageOverlay"
            );

        const cartCount =
            document.getElementById(
                "cartCount"
            );


        /* =====================================================
           OVERLAY
        ===================================================== */

        function syncOverlay() {

            if (!pageOverlay) {
                return;
            }

            const menuOpen =
                mobileMenu
                    ?.classList
                    .contains("active");

            const searchOpen =
                searchPanel
                    ?.classList
                    .contains("active");

            pageOverlay
                .classList
                .toggle(
                    "active",
                    Boolean(
                        menuOpen ||
                        searchOpen
                    )
                );

        }


        /* =====================================================
           MOBILE MENU
        ===================================================== */

        function openMenu() {

            if (
                !mobileMenu ||
                !menuToggle
            ) {
                return;
            }

            closeSearchPanel();

            mobileMenu
                .classList
                .add("active");

            menuToggle
                .classList
                .add("active");

            menuToggle
                .setAttribute(
                    "aria-expanded",
                    "true"
                );

            document.body
                .classList
                .add("menu-open");

            syncOverlay();

        }


        function closeMenu() {

            if (
                !mobileMenu ||
                !menuToggle
            ) {
                return;
            }

            mobileMenu
                .classList
                .remove("active");

            menuToggle
                .classList
                .remove("active");

            menuToggle
                .setAttribute(
                    "aria-expanded",
                    "false"
                );

            document.body
                .classList
                .remove("menu-open");

            syncOverlay();

        }


        menuToggle
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    if (
                        mobileMenu
                            ?.classList
                            .contains(
                                "active"
                            )
                    ) {

                        closeMenu();

                    } else {

                        openMenu();

                    }

                }
            );


        mobileMenu
            ?.querySelectorAll("a")
            .forEach(
                function (link) {

                    link.addEventListener(
                        "click",
                        closeMenu
                    );

                }
            );


        /* =====================================================
           SEARCH
        ===================================================== */

        function openSearchPanel() {

            if (!searchPanel) {
                return;
            }

            closeMenu();

            searchPanel
                .classList
                .add("active");

            document.body
                .classList
                .add("search-open");

            syncOverlay();

            setTimeout(
                function () {

                    searchInput
                        ?.focus();

                },
                100
            );

        }


        function closeSearchPanel() {

            if (!searchPanel) {
                return;
            }

            searchPanel
                .classList
                .remove("active");

            document.body
                .classList
                .remove("search-open");

            syncOverlay();

        }


        searchButton
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    if (
                        searchPanel
                            ?.classList
                            .contains(
                                "active"
                            )
                    ) {

                        closeSearchPanel();

                    } else {

                        openSearchPanel();

                    }

                }
            );


        closeSearch
            ?.addEventListener(
                "click",
                closeSearchPanel
            );


        searchForm
            ?.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const query =
                        searchInput
                            ?.value
                            .trim() ||
                        "";

                    if (!query) {
                        return;
                    }

                    window.location.href =
                        "shop.html?search=" +
                        encodeURIComponent(
                            query
                        );

                }
            );


        pageOverlay
            ?.addEventListener(
                "click",
                function () {

                    closeMenu();
                    closeSearchPanel();

                }
            );


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                closeMenu();
                closeSearchPanel();

            }
        );


        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth >
                    1024
                ) {

                    closeMenu();

                }

            }
        );


        /* =====================================================
           CART COUNT
        ===================================================== */

        function updateCartCount() {

            if (!cartCount) {
                return;
            }

            const totalQuantity =
                getCart()
                    .reduce(
                        function (
                            total,
                            item
                        ) {

                            return (
                                total +
                                Math.max(
                                    1,
                                    Number(
                                        item.quantity
                                    ) || 1
                                )
                            );

                        },
                        0
                    );


            cartCount.textContent =
                String(
                    totalQuantity
                );


            cartCount.style.display =
                totalQuantity > 0
                    ? "flex"
                    : "none";

        }


        window.updateSetApartCartCount =
            updateCartCount;


        updateCartCount();


        window.addEventListener(
            "storage",
            function (event) {

                if (
                    event.key ===
                    "setApartCart"
                ) {

                    updateCartCount();

                }

            }
        );


        /* =====================================================
           SHOP
        ===================================================== */

        function getProductCard(
            productId
        ) {

            const trigger =
                document.querySelector(

                    `.color-option[data-product="${productId}"], ` +

                    `.size-option[data-product="${productId}"], ` +

                    `.add-to-cart[data-product="${productId}"], ` +

                    `.product-buy-now[data-product="${productId}"]`

                );


            return (
                trigger
                    ?.closest(
                        ".shop-item"
                    ) ||
                null
            );

        }


        function updateProductImage(
            productId,
            side = "front"
        ) {

            const product =
                SET_APART_PRODUCTS[
                    productId
                ];

            const state =
                productState[
                    productId
                ];


            if (
                !product ||
                !state
            ) {
                return;
            }


            const card =
                getProductCard(
                    productId
                );

            if (!card) {
                return;
            }


            const image =
                card.querySelector(
                    ".shop-product-image"
                );

            if (!image) {
                return;
            }


            const color =
                state.color ||
                product.defaultColor;


            const imageSource =
                product.images
                    ?.[color]
                    ?.[side];


            if (!imageSource) {
                return;
            }


            image.src =
                imageSource;


            image.alt =
                `${product.name} ${color.toUpperCase()} ${side.toUpperCase()}`;


            state.side =
                side;

        }


        function selectColor(
            button
        ) {

            const productId =
                button.dataset.product;

            const color =
                button.dataset.color;


            if (
                !productId ||
                !color ||
                !productState[
                    productId
                ]
            ) {
                return;
            }


            productState[
                productId
            ].color =
                color.toLowerCase();


            productState[
                productId
            ].side =
                "front";


            const card =
                button.closest(
                    ".shop-item"
                );


            if (!card) {
                return;
            }


            card
                .querySelectorAll(
                    ".color-option"
                )
                .forEach(
                    function (item) {

                        item.classList.remove(
                            "active",
                            "selected"
                        );

                    }
                );


            button.classList.add(
                "active",
                "selected"
            );


            const selectedColor =
                card.querySelector(
                    ".selected-color"
                );


            if (selectedColor) {

                selectedColor.textContent =
                    color.toUpperCase();

            }


            updateProductImage(
                productId,
                "front"
            );

        }


        function selectSize(
            button
        ) {

            const productId =
                button.dataset.product;

            const size =
                button.dataset.size;


            if (
                !productId ||
                !size ||
                !productState[
                    productId
                ]
            ) {
                return;
            }


            productState[
                productId
            ].size =
                size.toUpperCase();


            const card =
                button.closest(
                    ".shop-item"
                );


            if (!card) {
                return;
            }


            card
                .querySelectorAll(
                    ".size-option"
                )
                .forEach(
                    function (item) {

                        item.classList.remove(
                            "active",
                            "selected"
                        );

                    }
                );


            button.classList.add(
                "active",
                "selected"
            );

        }


        function addProductToCart(
            productId
        ) {

            const product =
                SET_APART_PRODUCTS[
                    productId
                ];

            const state =
                productState[
                    productId
                ];


            if (
                !product ||
                !state
            ) {

                console.error(
                    "Unknown product:",
                    productId
                );

                return false;

            }


            if (!state.size) {

                alert(
                    "Please select a size first."
                );

                return false;

            }


            const color =
                state.color ||
                product.defaultColor;


            const selectedImage =
                product.images
                    ?.[color]
                    ?.front ||
                "";


            const cartItem = {

                id:
                    product.id,

                name:
                    product.name,

                price:
                    product.price,

                color:
                    color,

                size:
                    state.size,

                quantity:
                    1,

                image:
                    selectedImage

            };


            const cart =
                getCart();


            const existing =
                cart.find(
                    function (item) {

                        return (

                            item.id ===
                                cartItem.id &&

                            String(
                                item.color
                            ).toLowerCase() ===
                                cartItem.color &&

                            String(
                                item.size
                            ).toUpperCase() ===
                                cartItem.size

                        );

                    }
                );


            if (existing) {

                existing.quantity =
                    (
                        Number(
                            existing.quantity
                        ) || 1
                    ) + 1;

            } else {

                cart.push(
                    cartItem
                );

            }


            saveCart(
                cart
            );


            updateCartCount();


            return true;

        }


        /* =====================================================
           SHOP BUTTONS
        ===================================================== */

        document.addEventListener(
            "click",
            function (event) {


                const colorButton =
                    event.target.closest(
                        ".color-option"
                    );


                if (colorButton) {

                    event.preventDefault();

                    selectColor(
                        colorButton
                    );

                    return;

                }


                const sizeButton =
                    event.target.closest(
                        ".size-option"
                    );


                if (sizeButton) {

                    event.preventDefault();

                    selectSize(
                        sizeButton
                    );

                    return;

                }


                const addButton =
                    event.target.closest(
                        ".add-to-cart"
                    );


                if (addButton) {

                    event.preventDefault();


                    const productId =
                        addButton.dataset.product;


                    if (!productId) {
                        return;
                    }


                    if (
                        addProductToCart(
                            productId
                        )
                    ) {

                        const originalText =
                            addButton.textContent;


                        addButton.textContent =
                            "ADDED ✓";


                        setTimeout(
                            function () {

                                addButton.textContent =
                                    originalText;

                            },
                            1200
                        );

                    }


                    return;

                }


                const buyNowButton =
                    event.target.closest(
                        ".product-buy-now"
                    );


                if (buyNowButton) {

                    event.preventDefault();


                    const productId =
                        buyNowButton
                            .dataset
                            .product;


                    if (!productId) {
                        return;
                    }


                    if (
                        addProductToCart(
                            productId
                        )
                    ) {

                        window.location.href =
                            "cart.html";

                    }


                    return;

                }


                const frontButton =
                    event.target.closest(
                        ".product-image-btn-left, .show-front, .front-image"
                    );


                if (frontButton) {

                    event.preventDefault();


                    const card =
                        frontButton.closest(
                            ".shop-item"
                        );


                    const productId =
                        card
                            ?.querySelector(
                                "[data-product]"
                            )
                            ?.dataset
                            .product;


                    if (productId) {

                        updateProductImage(
                            productId,
                            "front"
                        );

                    }


                    return;

                }


                const backButton =
                    event.target.closest(
                        ".product-image-btn-right, .show-back, .back-image"
                    );


                if (backButton) {

                    event.preventDefault();


                    const card =
                        backButton.closest(
                            ".shop-item"
                        );


                    const productId =
                        card
                            ?.querySelector(
                                "[data-product]"
                            )
                            ?.dataset
                            .product;


                    if (productId) {

                        updateProductImage(
                            productId,
                            "back"
                        );

                    }

                }

            }
        );


        /* =====================================================
           SHOP FILTERS
        ===================================================== */

        const filterButtons =
            document.querySelectorAll(
                ".filter-button"
            );


        filterButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const filter =
                            button
                                .dataset
                                .filter;


                        filterButtons
                            .forEach(
                                function (item) {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button
                            .classList
                            .add(
                                "active"
                            );


                        document
                            .querySelectorAll(
                                ".shop-item"
                            )
                            .forEach(
                                function (
                                    product
                                ) {

                                    const matches =

                                        filter ===
                                            "all" ||

                                        product
                                            .dataset
                                            .category ===
                                            filter;


                                    product
                                        .classList
                                        .toggle(
                                            "filter-hidden",
                                            !matches
                                        );

                                }
                            );

                    }
                );

            }
        );


        /* =====================================================
           SEARCH FROM URL
        ===================================================== */

        const urlParameters =
            new URLSearchParams(
                window.location.search
            );


        const searchQuery =
            (
                urlParameters.get(
                    "search"
                ) ||
                ""
            )
                .trim()
                .toLowerCase();


        if (searchQuery) {

            document
                .querySelectorAll(
                    ".shop-item"
                )
                .forEach(
                    function (
                        product
                    ) {

                        const productName =
                            (
                                product
                                    .dataset
                                    .name ||
                                ""
                            )
                                .toLowerCase();


                        product
                            .classList
                            .toggle(

                                "search-hidden",

                                !productName
                                    .includes(
                                        searchQuery
                                    )

                            );

                    }
                );

        }


        /* =====================================================
           CART PAGE
        ===================================================== */

        const cartItemsContainer =
            document.getElementById(
                "cartItems"
            );


        const cartLayout =
            document.getElementById(
                "cartLayout"
            );


        const emptyCart =
            document.getElementById(
                "emptyCart"
            );


        const cartSubtotal =
            document.getElementById(
                "cartSubtotal"
            );


        const cartTotal =
            document.getElementById(
                "cartTotal"
            );


        const checkoutButton =
            document.getElementById(
                "checkoutButton"
            );


        function renderCart() {

            if (!cartItemsContainer) {
                return;
            }


            const cart =
                getCart();


            cartItemsContainer.innerHTML =
                "";


            if (
                cart.length ===
                0
            ) {

                if (cartLayout) {

                    cartLayout.style.display =
                        "none";

                }


                emptyCart
                    ?.classList
                    .add(
                        "active"
                    );


                if (cartSubtotal) {

                    cartSubtotal.textContent =
                        "$0.00";

                }


                if (cartTotal) {

                    cartTotal.textContent =
                        "$0.00";

                }


                updateCartCount();

                return;

            }


            if (cartLayout) {

                cartLayout.style.display =
                    "";

            }


            emptyCart
                ?.classList
                .remove(
                    "active"
                );


            let subtotal =
                0;


            cart.forEach(
                function (
                    item,
                    index
                ) {

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


                    const cartItem =
                        document.createElement(
                            "article"
                        );


                    cartItem.className =
                        "cart-item";


                    cartItem.innerHTML = `

                        <div class="cart-item-image">

                            <img
                                src="${item.image || ""}"
                                alt="${item.name || "Product"}">

                        </div>


                        <div class="cart-item-info">

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

                            <p class="cart-item-price">
                                ${money(price)}
                            </p>

                        </div>


                        <div class="cart-item-controls">

                            <div class="cart-quantity">

                                <button
                                    type="button"
                                    class="quantity-minus"
                                    data-index="${index}"
                                    aria-label="Decrease quantity">
                                    −
                                </button>

                                <span>
                                    ${quantity}
                                </span>

                                <button
                                    type="button"
                                    class="quantity-plus"
                                    data-index="${index}"
                                    aria-label="Increase quantity">
                                    +
                                </button>

                            </div>


                            <button
                                type="button"
                                class="cart-remove"
                                data-index="${index}">

                                REMOVE

                            </button>

                        </div>


                        <div class="cart-item-total">

                            ${money(itemTotal)}

                        </div>

                    `;


                    cartItemsContainer
                        .appendChild(
                            cartItem
                        );

                }
            );


            if (cartSubtotal) {

                cartSubtotal.textContent =
                    money(
                        subtotal
                    );

            }


            if (cartTotal) {

                cartTotal.textContent =
                    money(
                        subtotal
                    );

            }


            updateCartCount();

        }


        cartItemsContainer
            ?.addEventListener(
                "click",
                function (event) {


                    const plus =
                        event.target.closest(
                            ".quantity-plus"
                        );


                    const minus =
                        event.target.closest(
                            ".quantity-minus"
                        );


                    const remove =
                        event.target.closest(
                            ".cart-remove"
                        );


                    const control =
                        plus ||
                        minus ||
                        remove;


                    if (!control) {
                        return;
                    }


                    const index =
                        Number(
                            control
                                .dataset
                                .index
                        );


                    const cart =
                        getCart();


                    if (
                        !Number.isInteger(
                            index
                        ) ||
                        !cart[index]
                    ) {
                        return;
                    }


                    if (plus) {

                        cart[index]
                            .quantity =

                            (
                                Number(
                                    cart[index]
                                        .quantity
                                ) ||
                                1
                            ) + 1;

                    }


                    if (minus) {

                        const current =
                            Math.max(
                                1,
                                Number(
                                    cart[index]
                                        .quantity
                                ) ||
                                1
                            );


                        if (
                            current >
                            1
                        ) {

                            cart[index]
                                .quantity =
                                current - 1;

                        }

                    }


                    if (remove) {

                        cart.splice(
                            index,
                            1
                        );

                    }


                    saveCart(
                        cart
                    );


                    renderCart();

                }
            );


        if (cartItemsContainer) {

            renderCart();

        }


        checkoutButton
            ?.addEventListener(
                "click",
                function () {

                    if (
                        getCart()
                            .length >
                        0
                    ) {

                        window.location.href =
                            "checkout.html";

                    }

                }
            );


        /* =====================================================
           CHECKOUT + SHIPPING
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


        const PAYPAL_BACKEND =
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


            const shippingUSD =
                Number(
                    quote.shippingUSD
                ) || 0;


            if (shippingMethodLabel) {

                shippingMethodLabel.textContent =
                    quote.method ||
                    "SHIPPING";

            }


            if (shippingMethodPrice) {

                shippingMethodPrice.textContent =
                    quote.displayPrice ||
                    money(
                        shippingUSD
                    );

            }


            if (checkoutShipping) {

                checkoutShipping.textContent =
                    quote.displayPrice ||
                    money(
                        shippingUSD
                    );

            }


            if (shippingMethodNote) {

                shippingMethodNote.textContent =
                    quote.note ||
                    "Shipping calculated for your destination.";

            }


            if (checkoutTotal) {

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
                    ?.value
                    .trim() ||
                "";


            const state =
                checkoutState
                    ?.value
                    .trim() ||
                "";


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
                country ===
                    "DO" &&
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


            const response =
                await fetch(

                    `${PAYPAL_BACKEND}/api/shipping/quote`,

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

        }


        function scheduleShippingQuote() {

            clearTimeout(
                shippingRequestTimer
            );


            shippingRequestTimer =
                setTimeout(

                    function () {

                        refreshShippingQuote()

                            .catch(
                                function (
                                    error
                                ) {

                                    console.error(
                                        "Shipping quote error:",
                                        error
                                    );


                                    setShippingPending();


                                    if (
                                        shippingMethodLabel
                                    ) {

                                        shippingMethodLabel.textContent =
                                            "SHIPPING UNAVAILABLE";

                                    }


                                    if (
                                        shippingMethodNote
                                    ) {

                                        shippingMethodNote.textContent =
                                            "Shipping could not be calculated. Please try again.";

                                    }

                                }
                            );

                    },

                    350

                );

        }


        if (checkoutItems) {

            const cart =
                getCart();


            checkoutItems.innerHTML =
                "";


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


                const submit =
                    checkoutForm
                        ?.querySelector(
                            '[type="submit"]'
                        );


                if (submit) {

                    submit.disabled =
                        true;

                }

            }


            let subtotal =
                0;


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
                    money(
                        subtotal
                    );

            }


            if (checkoutTotal) {

                checkoutTotal.textContent =
                    money(
                        subtotal
                    );

            }

        }


        checkoutCountry
            ?.addEventListener(
                "change",
                scheduleShippingQuote
            );


        checkoutCity
            ?.addEventListener(
                "input",
                scheduleShippingQuote
            );


        checkoutState
            ?.addEventListener(
                "input",
                scheduleShippingQuote
            );


/* =====================================================
   CONTACT FORM
===================================================== */

const contactForm =
    document.getElementById(
        "contactForm"
    );


const contactMessage =
    document.getElementById(
        "contactFormMessage"
    );


if (contactForm) {

    contactForm.addEventListener(
        "submit",

        async function (event) {

            event.preventDefault();


            if (
                !contactForm
                    .checkValidity()
            ) {

                contactForm
                    .reportValidity();

                return;

            }


            const submitButton =
                contactForm
                    .querySelector(
                        '[type="submit"]'
                    );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "SEND MESSAGE";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "SENDING...";

            }


            if (contactMessage) {

                contactMessage.textContent =
                    "";

            }


            try {

                const formData =
                    new FormData(
                        contactForm
                    );


                const contactData =
                    Object.fromEntries(
                        formData.entries()
                    );


                const response =
                    await fetch(

                        "https://set-apart.onrender.com/api/contact",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    contactData
                                )

                        }

                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.error ||
                        "Message could not be sent."
                    );

                }


                if (contactMessage) {

                    contactMessage.textContent =
                        "MESSAGE SENT SUCCESSFULLY ✓";

                }


                if (submitButton) {

                    submitButton.textContent =
                        "MESSAGE SENT ✓";

                }


                contactForm.reset();


                setTimeout(
                    function () {

                        if (submitButton) {

                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                originalText;

                        }

                    },
                    3000
                );

            }

            catch (error) {

                console.error(
                    "Contact form error:",
                    error
                );


                if (contactMessage) {

                    contactMessage.textContent =
                        "MESSAGE COULD NOT BE SENT. PLEASE TRY AGAIN.";

                }


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        originalText;

                }

            }

        }
    );

}


        /* =====================================================
           PAYPAL
        ===================================================== */

        const paypalContainer =
            document.getElementById(
                "paypal-button-container"
            );


        function getPayPalCart() {

            return getCart()
                .map(
                    function (item) {

                        return {

                            id:
                                item.id,

                            quantity:
                                Number(
                                    item.quantity
                                ) || 1,

                            color:
                                item.color ||
                                "",

                            size:
                                item.size ||
                                ""

                        };

                    }
                );

        }


        function getCheckoutCustomer() {

           if (searchForm) {

    searchForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const rawQuery =
                searchInput
                    ? searchInput.value.trim()
                    : "";

            if (!rawQuery) {
                if (searchInput) {
                    searchInput.focus();
                }

                return;
            }

            const query =
                rawQuery.toLowerCase();

            const products =
                Array.from(
                    document.querySelectorAll(
                        ".shop-item"
                    )
                );


            /* If customer searches from HOME or another page */
            if (products.length === 0) {

                window.location.href =
                    "shop.html?search=" +
                    encodeURIComponent(
                        rawQuery
                    );

                return;
            }


            /* If customer is already on SHOP */
            let firstMatch = null;
            let matchCount = 0;

            products.forEach(
                function (product) {

                    const productName =
                        (
                            product.dataset.name ||
                            ""
                        ).toLowerCase();

                    const category =
                        (
                            product.dataset.category ||
                            ""
                        ).toLowerCase();

                    const title =
                        (
                            product
                                .querySelector("h2")
                                ?.textContent ||
                            ""
                        ).toLowerCase();

                    const searchableText =
                        productName +
                        " " +
                        category +
                        " " +
                        title;


                    const isMatch =
                        searchableText.includes(
                            query
                        );


                    product.classList.toggle(
                        "search-hidden",
                        !isMatch
                    );


                    if (isMatch) {

                        matchCount++;

                        if (!firstMatch) {
                            firstMatch =
                                product;
                        }
                    }
                }
            );


            closeSearchPanel();


            if (firstMatch) {

                setTimeout(
                    function () {

                        firstMatch.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    },
                    150
                );

            } else {

                alert(
                    "NO PRODUCTS FOUND."
                );
            }


            const currentUrl =
                new URL(
                    window.location.href
                );

            currentUrl.searchParams.set(
                "search",
                rawQuery
            );

            window.history.replaceState(
                {},
                "",
                currentUrl
            );

        }
    );

}

            const formData =
                new FormData(
                    checkoutForm
                );


            return {

                email:
                    formData.get(
                        "email"
                    ) || "",

                firstName:
                    formData.get(
                        "firstName"
                    ) || "",

                lastName:
                    formData.get(
                        "lastName"
                    ) || "",

                address:
                    formData.get(
                        "address"
                    ) || "",

                apartment:
                    formData.get(
                        "apartment"
                    ) || "",

                country:
                    formData.get(
                        "country"
                    ) || "",

                city:
                    formData.get(
                        "city"
                    ) || "",

                state:
                    formData.get(
                        "state"
                    ) || "",

                postalCode:
                    formData.get(
                        "postalCode"
                    ) || "",

                phone:
                    formData.get(
                        "phone"
                    ) || ""

            };

        }


        let paypalButtonsRendered =
            false;


        let paypalRenderPromise =
            null;


        window.showSetApartPayPalButtons =
            function () {

                return new Promise(

                    function (
                        resolve,
                        reject
                    ) {


                        if (
                            !paypalContainer
                        ) {

                            reject(
                                new Error(
                                    "PayPal container is missing."
                                )
                            );

                            return;

                        }


                        closeMenu();
                        closeSearchPanel();


                        paypalContainer.style.display =
                            "block";


                        if (
                            paypalButtonsRendered
                        ) {

                            resolve();

                            return;

                        }


                        if (
                            paypalRenderPromise
                        ) {

                            paypalRenderPromise

                                .then(
                                    resolve
                                )

                                .catch(
                                    reject
                                );


                            return;

                        }


                        if (
                            typeof window.paypal ===
                            "undefined"
                        ) {

                            reject(
                                new Error(
                                    "PayPal SDK did not load."
                                )
                            );

                            return;

                        }


                        const buttons =
                            window.paypal.Buttons({


                                createOrder:
                                    async function () {


                                        if (
                                            checkoutForm &&
                                            !checkoutForm
                                                .checkValidity()
                                        ) {

                                            checkoutForm
                                                .reportValidity();


                                            throw new Error(
                                                "Complete checkout information first."
                                            );

                                        }


                                        const items =
                                            getPayPalCart();


                                        if (
                                            items.length ===
                                            0
                                        ) {

                                            alert(
                                                "Your cart is empty."
                                            );


                                            throw new Error(
                                                "Cart is empty."
                                            );

                                        }


                                        const customer =
                                            getCheckoutCustomer();


                                        const response =
                                            await fetch(

                                                `${PAYPAL_BACKEND}/api/paypal/orders`,

                                                {

                                                    method:
                                                        "POST",

                                                    headers: {

                                                        "Content-Type":
                                                            "application/json"

                                                    },

                                                    body:
                                                        JSON.stringify({

                                                            customer:
                                                                customer,

                                                            items:
                                                                items

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
                                                "Create order error:",
                                                data
                                            );


                                            throw new Error(

                                                data.error ||

                                                "Unable to create PayPal order."

                                            );

                                        }


                                        return data.id;

                                    },


                                onApprove:
                                    async function (
                                        data
                                    ) {


                                        const items =
                                            getPayPalCart();


                                        const customer =
                                            getCheckoutCustomer();


                                        const response =
                                            await fetch(

                                                `${PAYPAL_BACKEND}/api/paypal/orders/${encodeURIComponent(data.orderID)}/capture`,

                                                {

                                                    method:
                                                        "POST",

                                                    headers: {

                                                        "Content-Type":
                                                            "application/json"

                                                    },

                                                    body:
                                                        JSON.stringify({

                                                            customer:
                                                                customer,

                                                            items:
                                                                items

                                                        })

                                                }

                                            );


                                        const result =
                                            await response.json();


                                        if (
                                            !response.ok ||
                                            result.status !==
                                                "COMPLETED"
                                        ) {

                                            console.error(
                                                "Capture error:",
                                                result
                                            );


                                            alert(
                                                "Payment could not be completed."
                                            );


                                            return;

                                        }


                                        localStorage.removeItem(
                                            "setApartCart"
                                        );


                                        sessionStorage.removeItem(
                                            "setApartCheckoutCustomer"
                                        );


                                       sessionStorage.setItem(
    "setApartLastOrder",
    JSON.stringify({
        orderID:
            result.orderID || data.orderID,

        total:
            result.total,

        currency:
            result.currency || "USD"
    })
);

window.location.href =
    "order-success.html";

},

onCancel:
    function () {

        console.log(
            "Customer cancelled PayPal checkout."
        );

    },


                                onError:
                                    function (
                                        error
                                    ) {

                                        console.error(
                                            "PayPal checkout error:",
                                            error
                                        );


                                        alert(
                                            "Something went wrong with PayPal. Please try again."
                                        );

                                    }

                            });


                        paypalRenderPromise =
                            buttons.render(
                                "#paypal-button-container"
                            );


                        paypalRenderPromise

                            .then(
                                function () {

                                    paypalButtonsRendered =
                                        true;


                                    paypalRenderPromise =
                                        null;


                                    resolve();

                                }
                            )

                            .catch(
                                function (
                                    error
                                ) {

                                    paypalButtonsRendered =
                                        false;


                                    paypalRenderPromise =
                                        null;


                                    paypalContainer.innerHTML =
                                        "";


                                    reject(
                                        error
                                    );

                                }
                            );

                    }

                );

            };


        /* =====================================================
           CHECKOUT FORM
        ===================================================== */

        checkoutForm
            ?.addEventListener(
                "submit",
                async function (event) {


                    event.preventDefault();


                    if (
                        !checkoutForm
                            .checkValidity()
                    ) {

                        checkoutForm
                            .reportValidity();

                        return;

                    }


                    const completeOrderButton =
                        checkoutForm
                            .querySelector(
                                'button[type="submit"]'
                            );


                    if (
                        completeOrderButton
                    ) {

                        completeOrderButton.disabled =
                            true;


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


                        currentShippingQuote =
                            quote;


                        const customerData =
                            getCheckoutCustomer();


                        sessionStorage.setItem(

                            "setApartCheckoutCustomer",

                            JSON.stringify(
                                customerData
                            )

                        );


                        if (
                            completeOrderButton
                        ) {

                            completeOrderButton.textContent =
                                "LOADING SECURE PAYMENT...";

                        }


                        await window
                            .showSetApartPayPalButtons();


                        if (
                            completeOrderButton
                        ) {

                            completeOrderButton.style.display =
                                "none";

                        }


                        setTimeout(

                            function () {

                                paypalContainer
                                    ?.scrollIntoView({

                                        behavior:
                                            "smooth",

                                        block:
                                            "center"

                                    });

                            },

                            100

                        );


                    } catch (
                        error
                    ) {


                        console.error(
                            "Unable to prepare checkout:",
                            error
                        );


                        if (
                            completeOrderButton
                        ) {

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


        /* =====================================================
           WHATSAPP ORDER
        ===================================================== */

        const whatsappButton =
            document.getElementById(
                "whatsappOrderButton"
            );


        whatsappButton
            ?.addEventListener(
                "click",
                function (event) {


                    event.preventDefault();


                    const cart =
                        getCart();


                    if (
                        cart.length ===
                        0
                    ) {

                        alert(
                            "Your cart is empty."
                        );

                        return;

                    }


                    let total =
                        0;


                    const orderDetails =
                        cart.map(
                            function (
                                item
                            ) {


                                const quantity =
                                    Number(
                                        item.quantity
                                    ) || 1;


                                const price =
                                    Number(
                                        item.price
                                    ) || 0;


                                total +=
                                    price *
                                    quantity;


                                return [

                                    `Product: ${item.name || item.id || "-"}`,

                                    `Color: ${item.color || "-"}`,

                                    `Size: ${item.size || "-"}`,

                                    `Quantity: ${quantity}`,

                                    `Price: $${price.toFixed(2)}`

                                ].join(
                                    "\n"
                                );

                            }
                        );


                    const message = [

                        "Hello SET APART,",

                        "",

                        "I would like to place this order:",

                        "",

                        orderDetails.join(
                            "\n\n"
                        ),

                        "",

                        `TOTAL: $${total.toFixed(2)} USD`,

                        "",

                        "Please let me know how I can complete my order."

                    ].join(
                        "\n"
                    );


                    const whatsappNumber =
                        "18494861203";


                    const whatsappUrl =
                        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


                    window.open(

                        whatsappUrl,

                        "_blank",

                        "noopener,noreferrer"

                    );

                }
            );


        /* =====================================================
           GOOGLE APP / IN-APP BROWSER NOTICE
        ===================================================== */

        const userAgent =
            navigator.userAgent ||
            "";


        const isGoogleApp =
            /GSA\//i
                .test(
                    userAgent
                );


        if (
            isGoogleApp &&
            checkoutForm
        ) {


            const notice =
                document.createElement(
                    "div"
                );


            notice.className =
                "payment-browser-notice";


            notice.innerHTML = `

                <strong>
                    SECURE PAYMENT
                </strong>

                <p>

                    PayPal and Debit/Credit Card payments work best
                    in a supported browser.

                </p>

                <div class="payment-browser-buttons">

                    <span class="browser-button">
                        OPEN IN CHROME
                    </span>

                    <span class="browser-button">
                        OPEN IN SAFARI
                    </span>

                </div>

                <small>

                    Open this page in Chrome or Safari to continue payment.

                </small>

            `;


            checkoutForm.prepend(
                notice
            );

        }

    }
);
