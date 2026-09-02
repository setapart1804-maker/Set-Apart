/* =========================================================
   SET APART — COMPLETE JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       HEADER ELEMENTS
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

        if (!mobileMenu || !menuToggle) return;

        mobileMenu.classList.add("active");
        menuToggle.classList.add("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add("menu-open");

        if (pageOverlay) {
            pageOverlay.classList.add("active");
        }
    }


    function closeMenu() {

        if (!mobileMenu || !menuToggle) return;

        mobileMenu.classList.remove("active");
        menuToggle.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove("menu-open");

        if (
            pageOverlay &&
            !searchPanel?.classList.contains("active")
        ) {
            pageOverlay.classList.remove("active");
        }
    }


    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (
                    mobileMenu &&
                    mobileMenu.classList.contains("active")
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
       SEARCH
    ===================================================== */

    function openSearchPanel() {

        if (!searchPanel) return;

        closeMenu();

        searchPanel.classList.add("active");

        document.body.classList.add(
            "search-open"
        );

        if (pageOverlay) {
            pageOverlay.classList.add("active");
        }

        setTimeout(function () {

            if (searchInput) {
                searchInput.focus();
            }

        }, 100);
    }


    function closeSearchPanel() {

        if (!searchPanel) return;

        searchPanel.classList.remove("active");

        document.body.classList.remove(
            "search-open"
        );

        if (
            pageOverlay &&
            !mobileMenu?.classList.contains("active")
        ) {
            pageOverlay.classList.remove("active");
        }
    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (
                    searchPanel &&
                    searchPanel.classList.contains("active")
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

                if (!query) return;

                window.location.href =
                    "shop.html?search=" +
                    encodeURIComponent(query);
            }
        );
    }


    /* =====================================================
       PAGE OVERLAY
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
       WINDOW RESIZE
    ===================================================== */

    window.addEventListener(
        "resize",
        function () {

            if (window.innerWidth > 1024) {
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

        updateCartCount();
    }


    function updateCartCount() {

        if (!cartCount) return;

        const cart =
            getCart();

        let totalQuantity = 0;

        cart.forEach(function (item) {

            totalQuantity +=
                Number(item.quantity) || 1;

        });

        cartCount.textContent =
            totalQuantity;

        if (totalQuantity > 0) {

            cartCount.style.display =
                "flex";

        } else {

            cartCount.style.display =
                "none";

        }
    }


    window.updateSetApartCartCount =
        updateCartCount;


    updateCartCount();


    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key === "setApartCart"
            ) {

                updateCartCount();

            }
        }
    );


    /* =====================================================
       SHOP PRODUCTS
    ===================================================== */

    const productData = {


        /* =================================================
           PILGRIM
        ================================================= */

        pilgrim: {

            id: "pilgrim",

            name: "PILGRIM HOODIE",

            price: 44.99,

            images: {

                black: [
                    "PILGRIM BLACK FRONT 1.png",
                    "PILGRIM BLACK BACK.png"
                ],

                white: [
                    "PILGRIM WHITE FRONT.jpeg",
                    "PILGRIM WHITE BACK.jpeg"
                ],

                brown: [
                    "PILGRIM BROWN FRONT.jpeg",
                    "PILGRIM BROWN BLACK.jpeg"
                ],

                beige: [
                    "PILGRIM BEIGE FRONT.jpeg",
                    "PILGRIM BEIGE BACK.jpeg"
                ]

            }

        },


        /* =================================================
           GOD FIRST
        ================================================= */

        godfirst: {

            id: "godfirst",

            name: "GOD FIRST HOODIE",

            price: 44.99,

            images: {

                black: [
                    "GOD FIRST BLACK FRONT.jpeg",
                    "GOD FIRST BLACK BACK.jpeg"
                ],

                white: [
                    "GOD FIRST WHITE FRONT.jpeg",
                    "GOD FIRST WHITE BACK.jpeg"
                ],

                brown: [
                    "GOD FIRST BROWN FRONT.png",
                    "GOD FIRST BROWN BACK.png"
                ],

                beige: [
                    "GOD FIRST BEIGE FRONT.jpeg",
                    "GOD FIRST BEIGE BACK.jpeg"
                ]

            }

        }

    };


    /* =====================================================
       CURRENT PRODUCT STATE
    ===================================================== */

    const productState = {

        pilgrim: {
            color: "black",
            size: null
        },

        godfirst: {
            color: "black",
            size: null
        }

    };


 /* =========================================================
   SET APART — SHOP IMAGE SLIDER
   FRONT <-> BACK
========================================================= */

document.querySelectorAll(".shop-item-gallery").forEach((gallery) => {

    const slider = gallery.querySelector(".shop-image-slider");
    const slides = gallery.querySelectorAll(".shop-image-slide");

    const prevButton = gallery.querySelector(".prev-image");
    const nextButton = gallery.querySelector(".next-image");

    if (!slider || slides.length < 2) return;

    let currentSlide = 0;


    function goToSlide(index) {

        if (index < 0) {
            index = slides.length - 1;
        }

        if (index >= slides.length) {
            index = 0;
        }

        currentSlide = index;

        slider.scrollTo({
            left: slider.clientWidth * currentSlide,
            behavior: "smooth"
        });
    }


    /* LEFT < */

    if (prevButton) {

        prevButton.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            goToSlide(currentSlide - 1);

        });

    }


    /* RIGHT > */

    if (nextButton) {

        nextButton.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            goToSlide(currentSlide + 1);

        });

    }


    /* UPDATE POSITION AFTER MANUAL SWIPE */

    slider.addEventListener("scroll", function () {

        if (slider.clientWidth === 0) return;

        currentSlide = Math.round(
            slider.scrollLeft / slider.clientWidth
        );

    });

});

            if (next && slider) {

                next.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        slider.scrollBy({
                            left:
                                slider.clientWidth,
                            behavior: "smooth"
                        });
                    }
                );
            }
        });


    /* =====================================================
       UPDATE PRODUCT IMAGES
    ===================================================== */

    function updateProductImages(
        productId,
        color
    ) {

        const product =
            productData[productId];

        if (!product) return;


        const images =
            product.images[color];

        if (!images) return;


        const colorButton =
            document.querySelector(
                `.color-option[data-product="${productId}"]`
            );

        if (!colorButton) return;


        const shopItem =
            colorButton.closest(".shop-item");

        if (!shopItem) return;


        const imageElements =
            shopItem.querySelectorAll(
                ".shop-image-slide img"
            );


        imageElements.forEach(
            function (image, index) {

                if (images[index]) {

                    image.src =
                        images[index];

                }
            }
        );


        const slider =
            shopItem.querySelector(
                ".shop-image-slider"
            );

        if (slider) {

            slider.scrollTo({
                left: 0,
                behavior: "smooth"
            });
        }
    }


    /* =====================================================
       COLOR BUTTONS
    ===================================================== */

    document
        .querySelectorAll(".color-option")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const productId =
                        button.dataset.product;

                    const color =
                        button.dataset.color;


                    if (
                        !productId ||
                        !color ||
                        !productState[productId]
                    ) {
                        return;
                    }


                    productState[productId].color =
                        color;


                    document
                        .querySelectorAll(
                            `.color-option[data-product="${productId}"]`
                        )
                        .forEach(function (item) {

                            item.classList.remove(
                                "active"
                            );

                            item.classList.remove(
                                "selected"
                            );
                        });


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

                        if (selectedColor) {

                            selectedColor.textContent =
                                color.toUpperCase();

                        }
                    }


                    updateProductImages(
                        productId,
                        color
                    );
                }
            );
        });


    /* =====================================================
       SIZE BUTTONS
    ===================================================== */

    document
        .querySelectorAll(".size-option")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const productId =
                        button.dataset.product;

                    const size =
                        button.dataset.size;


                    if (
                        !productId ||
                        !size ||
                        !productState[productId]
                    ) {
                        return;
                    }


                    productState[productId].size =
                        size;


                    document
                        .querySelectorAll(
                            `.size-option[data-product="${productId}"]`
                        )
                        .forEach(function (item) {

                            item.classList.remove(
                                "active"
                            );

                            item.classList.remove(
                                "selected"
                            );
                        });


                    button.classList.add(
                        "active"
                    );

                    button.classList.add(
                        "selected"
                    );
                }
            );
        });


    /* =====================================================
       CREATE / ADD CART ITEM
    ===================================================== */

    function addProductToCart(productId) {

        const product =
            productData[productId];

        const state =
            productState[productId];


        if (!product || !state) {

            console.error(
                "Product not found:",
                productId
            );

            return false;
        }


        /* SIZE REQUIRED */

        if (!state.size) {

            alert(
                "Please select a size first."
            );

            return false;
        }


        const selectedImages =
            product.images[state.color] ||
            product.images.black ||
            [];


        const cartItem = {

            id: product.id,

            name: product.name,

            price: product.price,

            color: state.color,

            size: state.size,

            quantity: 1,

            image:
                selectedImages[0] || ""

        };


        const cart =
            getCart();


        const existingItem =
            cart.find(function (item) {

                return (
                    item.id === cartItem.id &&
                    item.color === cartItem.color &&
                    item.size === cartItem.size
                );

            });


        if (existingItem) {

            existingItem.quantity =
                (
                    Number(
                        existingItem.quantity
                    ) || 1
                ) + 1;

        } else {

            cart.push(cartItem);

        }


        saveCart(cart);

        return true;
    }


    /* =====================================================
       ADD TO CART
    ===================================================== */

    document
        .querySelectorAll(".add-to-cart")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const productId =
                        button.dataset.product;


                    const success =
                        addProductToCart(
                            productId
                        );


                    if (!success) return;


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
        });


    /* =====================================================
       BUY NOW
    ===================================================== */

    document
        .querySelectorAll(".product-buy-now")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const productId =
                        button.dataset.product;


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
        });


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
                        button.dataset.filter;


                    filterButtons.forEach(
                        function (item) {

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
                            function (product) {

                                if (
                                    filter === "all" ||
                                    product.dataset.category === filter
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
       SHOP URL SEARCH
    ===================================================== */

    const urlParameters =
        new URLSearchParams(
            window.location.search
        );


    const searchQuery =
        (
            urlParameters.get("search") ||
            ""
        )
            .trim()
            .toLowerCase();


    if (searchQuery) {

        document
            .querySelectorAll(".shop-item")
            .forEach(function (product) {

                const productName =
                    (
                        product.dataset.name ||
                        ""
                    ).toLowerCase();


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
            });
    }


    /* =====================================================
       MONEY FORMAT
    ===================================================== */

    function money(value) {

        return "$" +
            (
                Number(value) || 0
            ).toFixed(2);
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


        /* EMPTY CART */

        if (cart.length === 0) {

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


            return;
        }


        if (cartLayout) {

            cartLayout.style.display =
                "grid";

        }


        if (emptyCart) {

            emptyCart.classList.remove(
                "active"
            );

        }


        let subtotal = 0;


        cart.forEach(
            function (item, index) {

                const quantity =
                    Math.max(
                        1,
                        Number(item.quantity) || 1
                    );


                const price =
                    Number(item.price) || 0;


                const itemTotal =
                    price * quantity;


                subtotal +=
                    itemTotal;


                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
                    "cart-item";


                article.innerHTML = `

                    <div class="cart-product">

                        <div class="cart-product-image">

                            <img
                                src="${item.image || ""}"
                                alt="${item.name || "Product"}">

                        </div>


                        <div class="cart-product-info">

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

                            <p class="cart-product-price">
                                ${money(price)}
                            </p>

                            <button
                                type="button"
                                class="cart-remove"
                                data-index="${index}">
                                REMOVE
                            </button>

                        </div>

                    </div>


                    <div class="cart-quantity">

                        <div class="quantity-control">

                            <button
                                type="button"
                                class="quantity-button quantity-minus"
                                data-index="${index}">
                                −
                            </button>

                            <span class="quantity-number">
                                ${quantity}
                            </span>

                            <button
                                type="button"
                                class="quantity-button quantity-plus"
                                data-index="${index}">
                                +
                            </button>

                        </div>

                    </div>


                    <div class="cart-item-total">
                        ${money(itemTotal)}
                    </div>

                `;


                cartItemsContainer.appendChild(
                    article
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
    }


    /* =====================================================
       CART BUTTONS
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


                /* PLUS */

                if (plus) {

                    const index =
                        Number(
                            plus.dataset.index
                        );


                    if (cart[index]) {

                        cart[index].quantity =
                            (
                                Number(
                                    cart[index].quantity
                                ) || 1
                            ) + 1;


                        saveCart(cart);

                        renderCart();

                    }
                }


                /* MINUS */

                if (minus) {

                    const index =
                        Number(
                            minus.dataset.index
                        );


                    if (
                        cart[index] &&
                        Number(
                            cart[index].quantity
                        ) > 1
                    ) {

                        cart[index].quantity =
                            Number(
                                cart[index].quantity
                            ) - 1;


                        saveCart(cart);

                        renderCart();

                    }
                }


                /* REMOVE */

                if (remove) {

                    const index =
                        Number(
                            remove.dataset.index
                        );


                    if (cart[index]) {

                        cart.splice(
                            index,
                            1
                        );


                        saveCart(cart);

                        renderCart();

                    }
                }
            }
        );


        renderCart();
    }


    /* =====================================================
       GO TO CHECKOUT
    ===================================================== */

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                if (
                    getCart().length > 0
                ) {

                    window.location.href =
                        "checkout.html";

                }
            }
        );
    }


    /* =====================================================
       CHECKOUT
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


        let subtotal = 0;


        if (cart.length === 0) {

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
                    checkoutForm.querySelector(
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
                        Number(item.quantity) || 1
                    );


                const price =
                    Number(item.price) || 0;


                const itemTotal =
                    price * quantity;


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


                checkoutItems.appendChild(
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
    ===================================================== */

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                if (
                    !checkoutForm.checkValidity()
                ) {

                    checkoutForm.reportValidity();

                    return;
                }


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


                alert(
                    "Checkout information saved for testing. Payment is not active yet."
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
                    !contactForm.checkValidity()
                ) {

                    contactForm.reportValidity();

                    return;
                }


                if (contactMessage) {

                    contactMessage.textContent =
                        "MESSAGE READY — EMAIL SERVICE NOT CONNECTED YET.";

                }


                const submitButton =
                    contactForm.querySelector(
                        '[type="submit"]'
                    );


                if (submitButton) {

                    const originalText =
                        submitButton.textContent;


                    submitButton.textContent =
                        "MESSAGE READY ✓";


                    setTimeout(
                        function () {

                            submitButton.textContent =
                                originalText;

                        },
                        2000
                    );
                }
            }
        );
    }

/* =========================================================
   HOODIES — DRAG / SWIPE SLIDER
========================================================= */

const hoodieSliders = document.querySelectorAll(".hoodie-slider");

hoodieSliders.forEach((slider) => {

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;


    /* MOUSE DOWN */

    slider.addEventListener("mousedown", (event) => {

        isDragging = true;

        startX = event.pageX;

        startScrollLeft = slider.scrollLeft;

        slider.classList.add("dragging");

    });


    /* MOUSE MOVE */

    slider.addEventListener("mousemove", (event) => {

        if (!isDragging) {
            return;
        }

        event.preventDefault();

        const distance = event.pageX - startX;

        slider.scrollLeft = startScrollLeft - distance;

    });


    /* MOUSE UP */

    slider.addEventListener("mouseup", () => {

        isDragging = false;

        slider.classList.remove("dragging");

        snapHoodieSlider(slider);

    });


    /* MOUSE LEAVE */

    slider.addEventListener("mouseleave", () => {

        if (!isDragging) {
            return;
        }

        isDragging = false;

        slider.classList.remove("dragging");

        snapHoodieSlider(slider);

    });


    /* PREVENT IMAGE DRAG */

    slider.addEventListener("dragstart", (event) => {

        event.preventDefault();

    });

});


