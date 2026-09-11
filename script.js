/* =========================================================
   SET APART — COMPLETE JAVASCRIPT
   NO ARROWS / NO SWIPE / NO IMAGE SLIDER
========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       HEADER
    ===================================================== */

    const menuToggle =
        document.getElementById("menuToggle");

    const mobileMenu =
        document.getElementById("mobileMenu");

    const searchButton =
        document.getElementById("searchButton");

    const searchPanel =
        document.getElementById("searchPanel");

    const closeSearch =
        document.getElementById("closeSearch");

    const searchForm =
        document.getElementById("searchForm");

    const searchInput =
        document.getElementById("searchInput");

    const pageOverlay =
        document.getElementById("pageOverlay");

    const cartCount =
        document.getElementById("cartCount");


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function openMenu() {

        if (!mobileMenu || !menuToggle) {
            return;
        }

        mobileMenu.classList.add("active");

        menuToggle.classList.add("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add(
            "menu-open"
        );

        if (pageOverlay) {

            pageOverlay.classList.add(
                "active"
            );

        }

    }


    function closeMenu() {

        if (!mobileMenu || !menuToggle) {
            return;
        }

        mobileMenu.classList.remove(
            "active"
        );

        menuToggle.classList.remove(
            "active"
        );

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove(
            "menu-open"
        );

        if (
            pageOverlay &&
            !searchPanel?.classList.contains(
                "active"
            )
        ) {

            pageOverlay.classList.remove(
                "active"
            );

        }

    }


    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (
                    mobileMenu &&
                    mobileMenu.classList.contains(
                        "active"
                    )
                ) {

                    closeMenu();

                } else {

                    closeSearchPanel();

                    openMenu();

                }

            }
        );

    }


    if (mobileMenu) {

        mobileMenu
            .querySelectorAll("a")
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    closeMenu
                );

            });

    }

   /* =====================================================
   ACCESSIBILITY — ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }

        if (
            mobileMenu &&
            mobileMenu.classList.contains("active")
        ) {
            closeMenu();

            if (menuToggle) {
                menuToggle.focus();
            }
        }

        if (
            searchPanel &&
            searchPanel.classList.contains("active")
        ) {
            closeSearchPanel();

            if (searchButton) {
                searchButton.focus();
            }
        }
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

        searchPanel.classList.add(
            "active"
        );

        document.body.classList.add(
            "search-open"
        );

        if (pageOverlay) {

            pageOverlay.classList.add(
                "active"
            );

        }

        setTimeout(
            function () {

                if (searchInput) {

                    searchInput.focus();

                }

            },
            100
        );

    }


    function closeSearchPanel() {

        if (!searchPanel) {
            return;
        }

        searchPanel.classList.remove(
            "active"
        );

        document.body.classList.remove(
            "search-open"
        );

        if (
            pageOverlay &&
            !mobileMenu?.classList.contains(
                "active"
            )
        ) {

            pageOverlay.classList.remove(
                "active"
            );

        }

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (
                    searchPanel &&
                    searchPanel.classList.contains(
                        "active"
                    )
                ) {

                    closeSearchPanel();

                } else {

                    openSearchPanel();

                }

            }
        );

    }


    if (closeSearch) {

        closeSearch.addEventListener(
            "click",
            closeSearchPanel
        );

    }


    if (searchForm) {

        searchForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const query =
                    searchInput
                        ? searchInput.value.trim()
                        : "";

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

    }


    /* =====================================================
       OVERLAY
    ===================================================== */

    if (pageOverlay) {

        pageOverlay.addEventListener(
            "click",
            function () {

                closeMenu();

                closeSearchPanel();

            }
        );

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeMenu();

                closeSearchPanel();

            }

        }
    );


    /* =====================================================
       RESIZE
    ===================================================== */

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
       CART HELPERS
    ===================================================== */

    function getCart() {

        try {

            const saved =
                localStorage.getItem(
                    "setApartCart"
                );

            if (!saved) {

                return [];

            }

            const parsed =
                JSON.parse(saved);

            if (
                Array.isArray(parsed)
            ) {

                return parsed;

            }

            if (
                parsed &&
                typeof parsed ===
                    "object"
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

        updateCartCount();

    }


    function updateCartCount() {

        if (!cartCount) {
            return;
        }

        const cart =
            getCart();

        let totalQuantity = 0;

        cart.forEach(
            function (item) {

                totalQuantity +=
                    Number(
                        item.quantity
                    ) || 1;

            }
        );

        cartCount.textContent =
            totalQuantity;

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
       PRODUCTS
       FRONT IMAGE ONLY
    ===================================================== */

    const productData = {


        pilgrim: {

            id: "pilgrim",

            name:
                "PILGRIM HOODIE",

            price:
               34.99,

            images: {

                black:
                    "PILGRIM BLACK FRONT 1.png",

                white:
                    "PILGRIM WHITE FRONT.jpeg",

                brown:
                    "PILGRIM BROWN FRONT.jpeg",

                beige:
                    "PILGRIM BEIGE FRONT.jpeg"

            }

        },


        godfirst: {

            id: "godfirst",

            name:
                "GOD FIRST HOODIE",

            price:
                34.99,

            images: {

                black:
                    "GOD FIRST BLACK FRONT.jpeg",

                white:
                    "GOD FIRST WHITE FRONT.jpeg",

                brown:
                    "GOD FIRST BROWN FRONT.png",

                beige:
                    "GOD FIRST BEIGE FRONT.jpeg"

            }

        }

    };


    /* =====================================================
       PRODUCT STATE
    ===================================================== */

    const productState = {

        pilgrim: {

            color:
                "beige",

            size:
                null

        },


        godfirst: {

            color:
                "brown",

            size:
                null

        }

    };


    /* =====================================================
       UPDATE PRODUCT IMAGE
    ===================================================== */

    function updateProductImage(
        productId,
        color
    ) {

        const product =
            productData[
                productId
            ];

        if (!product) {
            return;
        }


        const imageSource =
            product.images[
                color
            ];

        if (!imageSource) {
            return;
        }


        const colorButton =
            document.querySelector(
                `.color-option[data-product="${productId}"]`
            );

        if (!colorButton) {
            return;
        }


        const shopItem =
            colorButton.closest(
                ".shop-item"
            );

        if (!shopItem) {
            return;
        }


        const image =
            shopItem.querySelector(
                ".shop-product-image"
            );

        if (!image) {
            return;
        }


        image.src =
            imageSource;


        image.alt =
            product.name +
            " " +
            color.toUpperCase() +
            " Front";

    }


    /* =====================================================
       COLORS
    ===================================================== */

    document
        .querySelectorAll(
            ".color-option"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const productId =
                            button.dataset
                                .product;


                        const color =
                            button.dataset
                                .color;


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
                            color;


                        document
                            .querySelectorAll(
                                `.color-option[data-product="${productId}"]`
                            )
                            .forEach(
                                function (
                                    item
                                ) {

                                    item.classList.remove(
                                        "active"
                                    );

                                    item.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );

                        button.classList.add(
                            "selected"
                        );


                        const shopItem =
                            button.closest(
                                ".shop-item"
                            );


                        if (shopItem) {

                            const selectedColor =
                                shopItem.querySelector(
                                    ".selected-color"
                                );


                            if (
                                selectedColor
                            ) {

                                selectedColor
                                    .textContent =
                                    color
                                        .toUpperCase();

                            }

                        }


                        updateProductImage(
                            productId,
                            color
                        );

                    }
                );

            }
        );


    /* =====================================================
       SIZE
    ===================================================== */

    document
        .querySelectorAll(
            ".size-option"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const productId =
                            button.dataset
                                .product;


                        const size =
                            button.dataset
                                .size;


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
                            size;


                        document
                            .querySelectorAll(
                                `.size-option[data-product="${productId}"]`
                            )
                            .forEach(
                                function (
                                    item
                                ) {

                                    item.classList.remove(
                                        "active"
                                    );

                                    item.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );

                        button.classList.add(
                            "selected"
                        );

                    }
                );

            }
        );


    /* =====================================================
       ADD PRODUCT TO CART
    ===================================================== */

    function addProductToCart(
        productId
    ) {

        const product =
            productData[
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

            return false;

        }


        if (!state.size) {

            alert(
                "Please select a size first."
            );

            return false;

        }


        const selectedImage =
            product.images[
                state.color
            ] ||
            product.images.black ||
            "";


        const cartItem = {

            id:
                product.id,

            name:
                product.name,

            price:
                product.price,

            color:
                state.color,

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

                        item.color ===
                            cartItem.color &&

                        item.size ===
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


        saveCart(cart);

        return true;

    }


    /* =====================================================
       ADD TO CART BUTTON
    ===================================================== */

    document
        .querySelectorAll(
            ".add-to-cart"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const productId =
                            button.dataset
                                .product;


                        const success =
                            addProductToCart(
                                productId
                            );


                        if (!success) {

                            return;

                        }


                        const originalText =
                            button.textContent;


                        button.textContent =
                            "ADDED ✓";


                        setTimeout(
                            function () {

                                button.textContent =
                                    originalText;

                            },
                            1200
                        );

                    }
                );

            }
        );


    /* =====================================================
       BUY NOW
    ===================================================== */

    document
        .querySelectorAll(
            ".product-buy-now"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const productId =
                            button.dataset
                                .product;


                        const success =
                            addProductToCart(
                                productId
                            );


                        if (success) {

                            window.location.href =
                                "cart.html";

                        }

                    }
                );

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
                        button.dataset
                            .filter;


                    filterButtons
                        .forEach(
                            function (
                                item
                            ) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
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

                                if (
                                    filter ===
                                        "all" ||

                                    product
                                        .dataset
                                        .category ===
                                        filter
                                ) {

                                    product.classList.remove(
                                        "filter-hidden"
                                    );

                                } else {

                                    product.classList.add(
                                        "filter-hidden"
                                    );

                                }

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
            ) || ""
        )
            .trim()
            .toLowerCase();


    if (searchQuery) {

        document
            .querySelectorAll(
                ".shop-item"
            )
            .forEach(
                function (product) {

                    const productName =
                        (
                            product.dataset
                                .name ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        productName.includes(
                            searchQuery
                        )
                    ) {

                        product.classList.remove(
                            "search-hidden"
                        );

                    } else {

                        product.classList.add(
                            "search-hidden"
                        );

                    }

                }
            );

    }


    /* =====================================================
       MONEY
    ===================================================== */

    function money(value) {

        return (
            "$" +
            (
                Number(value) ||
                0
            ).toFixed(2)
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


            if (emptyCart) {

                emptyCart.classList.add(
                    "active"
                );

            }


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


        if (emptyCart) {

            emptyCart.classList.remove(
                "active"
            );

        }


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
                money(subtotal);

        }


        if (cartTotal) {

            cartTotal.textContent =
                money(subtotal);

        }


        updateCartCount();

    }


    /* =====================================================
       CART QUANTITY + REMOVE
    ===================================================== */

    if (cartItemsContainer) {

        cartItemsContainer.addEventListener(
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


                const cart =
                    getCart();


                if (plus) {

                    const index =
                        Number(
                            plus.dataset
                                .index
                        );


                    if (
                        cart[index]
                    ) {

                        cart[index]
                            .quantity =
                            (
                                Number(
                                    cart[
                                        index
                                    ].quantity
                                ) || 1
                            ) + 1;


                        saveCart(
                            cart
                        );

                        renderCart();

                    }

                }


                if (minus) {

                    const index =
                        Number(
                            minus.dataset
                                .index
                        );


                    if (
                        cart[index] &&
                        Number(
                            cart[
                                index
                            ].quantity
                        ) > 1
                    ) {

                        cart[index]
                            .quantity =
                            Number(
                                cart[
                                    index
                                ].quantity
                            ) - 1;


                        saveCart(
                            cart
                        );

                        renderCart();

                    }

                }


                if (remove) {

                    const index =
                        Number(
                            remove.dataset
                                .index
                        );


                    if (
                        cart[index]
                    ) {

                        cart.splice(
                            index,
                            1
                        );


                        saveCart(
                            cart
                        );

                        renderCart();

                    }

                }

            }
        );


        renderCart();

    }


    /* =====================================================
       CHECKOUT BUTTON
    ===================================================== */

    if (checkoutButton) {

        checkoutButton.addEventListener(
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

    }


    /* =====================================================
       CHECKOUT PAGE
    ===================================================== */

    const checkoutItems =
        document.getElementById(
            "checkoutItems"
        );


    const checkoutSubtotal =
        document.getElementById(
            "checkoutSubtotal"
        );


    const checkoutTotal =
        document.getElementById(
            "checkoutTotal"
        );


    const checkoutForm =
        document.getElementById(
            "checkoutForm"
        );


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


        if (checkoutSubtotal) {

            checkoutSubtotal.textContent =
                money(subtotal);

        }


        if (checkoutTotal) {

            checkoutTotal.textContent =
                money(subtotal);

        }

    }


   /* =====================================================
   CHECKOUT FORM
   COMPLETE ORDER → SHOW PAYPAL PAYMENT OPTIONS
===================================================== */

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* =========================================
               VALIDATE CHECKOUT INFORMATION
            ========================================= */

            if (
                !checkoutForm.checkValidity()
            ) {

                checkoutForm.reportValidity();
                return;

            }


            /* =========================================
               SAVE CUSTOMER INFORMATION
            ========================================= */

            const formData =
                new FormData(
                    checkoutForm
                );


            const customerData =
                Object.fromEntries(
                    formData.entries()
                );


            sessionStorage.setItem(
                "setApartCheckoutCustomer",
                JSON.stringify(
                    customerData
                )
            );


            /* =========================================
               SHOW PAYPAL PAYMENT OPTIONS
            ========================================= */

            const paypalContainer =
                document.getElementById(
                    "paypal-button-container"
                );


            if (!paypalContainer) {

                alert(
                    "Payment options could not be loaded. Please try again."
                );

                return;

            }


            paypalContainer.style.display =
                "block";


            /* =========================================
               HIDE COMPLETE ORDER BUTTON
            ========================================= */

            const completeOrderButton =
                checkoutForm.querySelector(
                    'button[type="submit"]'
                );


            if (completeOrderButton) {

                completeOrderButton.style.display =
                    "none";

            }


            /* =========================================
               SCROLL TO PAYMENT OPTIONS
            ========================================= */

            setTimeout(
                function () {

                    paypalContainer.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                },
                100
            );

        }
    );

}

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
            function (event) {

                event.preventDefault();


                if (
                    !contactForm
                        .checkValidity()
                ) {

                    contactForm
                        .reportValidity();

                    return;

                }


                if (
                    contactMessage
                ) {

                    contactMessage
                        .textContent =
                        "MESSAGE READY — EMAIL SERVICE NOT CONNECTED YET.";

                }


                const submitButton =
                    contactForm
                        .querySelector(
                            '[type="submit"]'
                        );


                if (
                    submitButton
                ) {

                    const originalText =
                        submitButton
                            .textContent;


                    submitButton
                        .textContent =
                        "MESSAGE READY ✓";


                    setTimeout(
                        function () {

                            submitButton
                                .textContent =
                                originalText;

                        },
                        2000
                    );

                }

            }
        );

    }


});
/* =========================================================
   SET APART — PRODUCT FRONT / BACK BUTTONS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const productImages = {

        pilgrim: {

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

        },


        godfirst: {

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

    };


    document
        .querySelectorAll(
            ".shop-item"
        )
        .forEach(
            function (productCard) {


                const gallery =
                    productCard.querySelector(
                        ".shop-item-gallery"
                    );


                const image =
                    productCard.querySelector(
                        ".shop-product-image"
                    );


                const leftButton =
                    productCard.querySelector(
                        ".product-image-btn-left"
                    );


                const rightButton =
                    productCard.querySelector(
                        ".product-image-btn-right"
                    );


                if (
                    !gallery ||
                    !image ||
                    !leftButton ||
                    !rightButton
                ) {

                    return;

                }


                /* =========================================
                   DETECT PRODUCT
                ========================================= */

                let productName =
                    "";


                const title =
                    productCard
                        .querySelector(
                            "h2"
                        )
                        ?.textContent
                        .toLowerCase() ||
                    "";


                if (
                    title.includes(
                        "pilgrim"
                    )
                ) {

                    productName =
                        "pilgrim";

                }


                if (
                    title.includes(
                        "god first"
                    )
                ) {

                    productName =
                        "godfirst";

                }


                if (
                    !productImages[
                        productName
                    ]
                ) {

                    return;

                }


                /* =========================================
                   GET CURRENT COLOR
                ========================================= */

                function getCurrentColor() {

                    const selected =
                        productCard
                            .querySelector(
                                ".color-option.selected"
                            );


                    if (
                        selected &&
                        selected.dataset.color
                    ) {

                        return selected
                            .dataset
                            .color
                            .toLowerCase();

                    }


                    return (
                        productName ===
                        "pilgrim"
                    )
                        ? "beige"
                        : "brown";

                }


                /* =========================================
                   LEFT = FRONT
                ========================================= */

                leftButton
                    .addEventListener(
                        "click",
                        function () {

                            const color =
                                getCurrentColor();


                            const frontImage =
                                productImages[
                                    productName
                                ]?.[
                                    color
                                ]?.front;


                            if (
                                frontImage
                            ) {

                                image.src =
                                    frontImage;

                            }

                        }
                    );


                /* =========================================
                   RIGHT = BACK
                ========================================= */

                rightButton
                    .addEventListener(
                        "click",
                        function () {

                            const color =
                                getCurrentColor();


                            const backImage =
                                productImages[
                                    productName
                                ]?.[
                                    color
                                ]?.back;


                            if (
                                backImage
                            ) {

                                image.src =
                                    backImage;

                            }

                        }
                    );

            }
        );

});


/* =========================================================
   SET APART — PAYPAL CHECKOUT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const PAYPAL_BACKEND =
        "https://set-apart.onrender.com";


    const paypalContainer =
        document.getElementById(
            "paypal-button-container"
        );


    const paymentMethods =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    const checkoutForm =
        document.getElementById(
            "checkoutForm"
        );


    if (!paypalContainer) {
        return;
    }


    /* =====================================================
       SHOW / HIDE PAYPAL
    ===================================================== */

    paymentMethods.forEach(
        function (radio) {

            radio.addEventListener(
                "change",
                function () {

                    if (
                        this.value ===
                        "paypal"
                    ) {

                        paypalContainer
                            .style
                            .display =
                            "block";

                    } else {

                        paypalContainer
                            .style
                            .display =
                            "none";

                    }

                }
            );

        }
    );


    /* =====================================================
       GET FULL CART
    ===================================================== */

    function getPayPalCart() {

        let cart =
            [];


        try {

            cart =
                JSON.parse(
                    localStorage.getItem(
                        "setApartCart"
                    ) || "[]"
                );

        } catch (error) {

            console.error(
                "Unable to read cart:",
                error
            );

            return [];

        }


        return cart.map(
            function (item) {

                return {

                    id:
                        item.id,

                    quantity:
                        Number(
                            item.quantity
                        ) || 1,

                    color:
                        item.color || "",

                    size:
                        item.size || ""

                };

            }
        );

    }


    /* =====================================================
       GET CUSTOMER INFORMATION
    ===================================================== */

    function getCheckoutCustomer() {

        if (!checkoutForm) {

            return {};

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


    /* =====================================================
       PAYPAL SDK CHECK
    ===================================================== */

    if (
        typeof paypal ===
        "undefined"
    ) {

        console.error(
            "PayPal SDK did not load."
        );

        return;

    }


    /* =====================================================
       PAYPAL BUTTONS
    ===================================================== */

    paypal.Buttons({


        /* =================================================
           CREATE ORDER
        ================================================= */

        createOrder:
            async function () {

                if (
                    checkoutForm &&
                    !checkoutForm
                        .reportValidity()
                ) {

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


                sessionStorage.setItem(
                    "setApartCheckoutCustomer",
                    JSON.stringify(
                        customer
                    )
                );


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


        /* =================================================
           PAYMENT APPROVED
        ================================================= */

        onApprove:
            async function (data) {

                const items =
                    getPayPalCart();


                const customer =
                    getCheckoutCustomer();


                const response =
                    await fetch(

                        `${PAYPAL_BACKEND}/api/paypal/orders/${data.orderID}/capture`,

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


                /* =========================================
                   PAYMENT SUCCESS
                ========================================= */

                localStorage.removeItem(
                    "setApartCart"
                );


                sessionStorage.removeItem(
                    "setApartCheckoutCustomer"
                );


                alert(
                    "Payment successful! Thank you for your SET APART order."
                );


                window.location.href =
                    "index.html";

            },


        /* =================================================
           CANCEL
        ================================================= */

        onCancel:
            function () {

                console.log(
                    "Customer cancelled PayPal checkout."
                );

            },


        /* =================================================
           ERROR
        ================================================= */

        onError:
            function (error) {

                console.error(
                    "PayPal checkout error:",
                    error
                );


                alert(
                    "Something went wrong with PayPal. Please try again."
                );

            }


    }).render(
        "#paypal-button-container"
    );

});


/* =========================================================
   SET APART — PAYMENT METHOD DISPLAY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const paymentRadios =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    const completeOrderButton =
        document.querySelector(
            '#checkoutForm button[type="submit"]'
        );


    const paypalContainer =
        document.getElementById(
            "paypal-button-container"
        );


    function updatePaymentDisplay() {

        const selectedPayment =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );


        if (!selectedPayment) {

            return;

        }


        /* =================================================
           PAYPAL
        ================================================= */

        if (
            selectedPayment.value ===
            "paypal"
        ) {

            if (
                completeOrderButton
            ) {

                completeOrderButton
                    .style
                    .display =
                    "none";

            }


            if (
                paypalContainer
            ) {

                paypalContainer
                    .style
                    .display =
                    "block";

            }

        }


        /* =================================================
           CARD
        ================================================= */

        else {

            if (
                completeOrderButton
            ) {

                completeOrderButton
                    .style
                    .display =
                    "";

            }


            if (
                paypalContainer
            ) {

                paypalContainer
                    .style
                    .display =
                    "none";

            }

        }

    }


    paymentRadios.forEach(
        function (radio) {

            radio.addEventListener(
                "change",
                updatePaymentDisplay
            );

        }
    );


    updatePaymentDisplay();

});

/* =========================================================
   SET APART — ORDER ON WHATSAPP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const whatsappButton =
            document.getElementById(
                "whatsappOrderButton"
            );

        if (!whatsappButton) {
            return;
        }

        whatsappButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                const cart =
                    JSON.parse(
                        localStorage.getItem(
                            "setApartCart"
                        ) || "[]"
                    );

                if (
                    !Array.isArray(cart) ||
                    cart.length === 0
                ) {

                    alert("Your cart is empty.");
                    return;

                }

                let total = 0;

                const orderDetails =
                    cart.map(
                        function (item) {

                            const quantity =
                                Number(
                                    item.quantity || 1
                                );

                            const price =
                                Number(
                                    item.price || 0
                                );

                            total +=
                                price * quantity;

                            return [
                                `Product: ${item.name || item.id || "-"}`,
                                `Color: ${item.color || "-"}`,
                                `Size: ${item.size || "-"}`,
                                `Quantity: ${quantity}`,
                                `Price: $${price.toFixed(2)}`
                            ].join("\n");

                        }
                    );


                const message = [

                    "Hello SET APART,",
                    "",
                    "I would like to place this order:",
                    "",
                    orderDetails.join("\n\n"),
                    "",
                    `TOTAL: $${total.toFixed(2)} USD`,
                    "",
                    "Please let me know how I can complete my order."

                ].join("\n");


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

    }
);
