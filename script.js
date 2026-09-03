/* =========================================================
   SET APART — COMPLETE JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       HEADER
    ===================================================== */

    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const searchButton = document.getElementById("searchButton");
    const searchPanel = document.getElementById("searchPanel");
    const closeSearch = document.getElementById("closeSearch");
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const pageOverlay = document.getElementById("pageOverlay");
    const cartCount = document.getElementById("cartCount");


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
       ESC KEY
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

        const cart = getCart();

        let totalQuantity = 0;

        cart.forEach(function (item) {

            totalQuantity +=
                Number(item.quantity) || 1;

        });

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
    ===================================================== */

    const productData = {

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
       PRODUCT STATE
    ===================================================== */

    const productState = {

        pilgrim: {
            color: "beige",
            size: null
        },

        godfirst: {
            color: "brown",
            size: null
        }

    };


/* =====================================================
   SHOP IMAGE SLIDER — FINAL FIX
   ARROWS + SWIPE
===================================================== */

document.querySelectorAll(".shop-item-gallery").forEach(function (gallery) {

    const slider = gallery.querySelector(".shop-image-slider");

    const slides = gallery.querySelectorAll(".shop-image-slide");

    const prevButton = gallery.querySelector(".prev-image");

    const nextButton = gallery.querySelector(".next-image");

    if (!slider || slides.length < 2) {
        return;
    }

    let currentSlide = 0;
    let startX = 0;


    /* -----------------------------------------
       PREPARE SLIDES
    ----------------------------------------- */

    slider.style.overflow = "hidden";

    slides.forEach(function (slide) {

        slide.style.transition =
            "transform 0.35s ease";

    });


    /* -----------------------------------------
       SHOW FRONT / BACK
    ----------------------------------------- */

    function showSlide(index) {

        if (index < 0) {
            index = slides.length - 1;
        }

        if (index >= slides.length) {
            index = 0;
        }

        currentSlide = index;

        slides.forEach(function (slide) {

            slide.style.transform =
                "translateX(-" +
                (currentSlide * 100) +
                "%)";

        });

    }


    /* -----------------------------------------
       RIGHT >
    ----------------------------------------- */

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                showSlide(
                    currentSlide + 1
                );

            }
        );

    }


    /* -----------------------------------------
       LEFT <
    ----------------------------------------- */

    if (prevButton) {

        prevButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                showSlide(
                    currentSlide - 1
                );

            }
        );

    }


    /* -----------------------------------------
       SWIPE — PHONE / TABLET
    ----------------------------------------- */

    slider.addEventListener(
        "touchstart",
        function (event) {

            startX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );


    slider.addEventListener(
        "touchend",
        function (event) {

            const endX =
                event.changedTouches[0].clientX;

            const distance =
                endX - startX;


            if (Math.abs(distance) < 40) {
                return;
            }


            if (distance < 0) {

                showSlide(
                    currentSlide + 1
                );

            } else {

                showSlide(
                    currentSlide - 1
                );

            }

        },
        {
            passive: true
        }
    );


    /* -----------------------------------------
       RESET TO FRONT AFTER COLOR CHANGE
    ----------------------------------------- */

    gallery.resetShopSlider =
        function () {

            currentSlide = 0;

            slides.forEach(function (slide) {

                slide.style.transition =
                    "none";

                slide.style.transform =
                    "translateX(0)";

            });


            requestAnimationFrame(function () {

                requestAnimationFrame(function () {

                    slides.forEach(function (slide) {

                        slide.style.transition =
                            "transform 0.35s ease";

                    });

                });

            });

        };


    /* START ON FRONT */

    gallery.resetShopSlider();

});


        /* =================================================
           RESET TO FRONT
        ================================================= */

        gallery.resetShopSlider =
            function () {

                currentSlide = 0;

                showSlide(
                    0,
                    false
                );
            };


        /* =================================================
           ALWAYS START ON FRONT
        ================================================= */

        gallery.resetShopSlider();

    });

            /* =================================================
               TOUCH START
            ================================================= */

            slider.addEventListener(
                "touchstart",
                function (event) {

                    if (
                        !event.touches ||
                        !event.touches.length
                    ) {
                        return;
                    }

                    startX =
                        event.touches[0]
                            .clientX;

                },
                {
                    passive: true
                }
            );


            /* =================================================
               TOUCH END
            ================================================= */

            slider.addEventListener(
                "touchend",
                function (event) {

                    if (
                        !event.changedTouches ||
                        !event.changedTouches.length
                    ) {
                        return;
                    }


                    const endX =
                        event
                            .changedTouches[0]
                            .clientX;


                    const distance =
                        endX - startX;


                    if (
                        Math.abs(
                            distance
                        ) < 45
                    ) {
                        return;
                    }


                    if (
                        distance < 0
                    ) {

                        showSlide(
                            currentSlide + 1
                        );

                    } else {

                        showSlide(
                            currentSlide - 1
                        );

                    }

                },
                {
                    passive: true
                }
            );


            /* =================================================
               DESKTOP DRAG
            ================================================= */

            let mouseStartX = 0;
            let mouseDown = false;


            slider.addEventListener(
                "mousedown",
                function (event) {

                    if (
                        event.target.closest(
                            ".shop-arrow"
                        )
                    ) {
                        return;
                    }

                    mouseDown = true;

                    mouseStartX =
                        event.clientX;

                }
            );


            slider.addEventListener(
                "mouseup",
                function (event) {

                    if (!mouseDown) {
                        return;
                    }

                    mouseDown = false;


                    const distance =
                        event.clientX -
                        mouseStartX;


                    if (
                        Math.abs(
                            distance
                        ) < 50
                    ) {
                        return;
                    }


                    if (
                        distance < 0
                    ) {

                        showSlide(
                            currentSlide + 1
                        );

                    } else {

                        showSlide(
                            currentSlide - 1
                        );

                    }

                }
            );


            slider.addEventListener(
                "mouseleave",
                function () {

                    mouseDown = false;

                }
            );


            slider.addEventListener(
                "dragstart",
                function (event) {

                    event.preventDefault();

                }
            );


            /* START FRONT */

            gallery.resetShopSlider();

        });


    /* =====================================================
       UPDATE PRODUCT IMAGE
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
            colorButton.closest(
                ".shop-item"
            );


        if (!shopItem) return;


        const imageElements =
            shopItem.querySelectorAll(
                ".shop-image-slide img"
            );


        imageElements.forEach(
            function (image, index) {

                if (
                    images[index]
                ) {

                    image.src =
                        images[index];

                }
            }
        );


        /* RETURN TO FRONT */

        const gallery =
            shopItem.querySelector(
                ".shop-item-gallery"
            );


        if (
            gallery &&
            typeof gallery.resetShopSlider ===
                "function"
        ) {

            gallery.resetShopSlider();

        }
    }


    /* =====================================================
       COLORS
    ===================================================== */

    document
        .querySelectorAll(
            ".color-option"
        )
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
                            function (item) {

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
       SIZE
    ===================================================== */

    document
        .querySelectorAll(
            ".size-option"
        )
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
                            function (item) {

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
        });


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


        if (
            !state.size
        ) {

            alert(
                "Please select a size first."
            );

            return false;

        }


        const selectedImages =
            product.images[
                state.color
            ] ||
            product.images.black ||
            [];


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
                selectedImages[0] || ""

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
        });


    /* =====================================================
       BUY NOW
    ===================================================== */

    document
        .querySelectorAll(
            ".product-buy-now"
        )
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
       FILTERS
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
                                    filter ===
                                        "all" ||

                                    product.dataset
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
                                .name || ""
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

        if (
            !cartItemsContainer
        ) {
            return;
        }


        const cart =
            getCart();


        cartItemsContainer.innerHTML =
            "";


        if (
            cart.length === 0
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


                cartItemsContainer
                    .appendChild(
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
       CART CONTROLS
    ===================================================== */

    if (
        cartItemsContainer
    ) {

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


                    if (cart[index]) {

                        cart[index]
                            .quantity =
                            (
                                Number(
                                    cart[index]
                                        .quantity
                                ) || 1
                            ) + 1;


                        saveCart(cart);

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
                            cart[index]
                                .quantity
                        ) > 1
                    ) {

                        cart[index]
                            .quantity =
                            Number(
                                cart[index]
                                    .quantity
                            ) - 1;


                        saveCart(cart);

                        renderCart();

                    }
                }


                if (remove) {

                    const index =
                        Number(
                            remove.dataset
                                .index
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
       CHECKOUT BUTTON
    ===================================================== */

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                if (
                    getCart().length >
                    0
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


        if (
            cart.length === 0
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


            if (
                checkoutForm
            ) {

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


                checkoutItems.appendChild(
                    element
                );

            }
        );


        if (
            checkoutSubtotal
        ) {

            checkoutSubtotal.textContent =
                money(subtotal);

        }


        if (
            checkoutTotal
        ) {

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
                    !checkoutForm
                        .checkValidity()
                ) {

                    checkoutForm
                        .reportValidity();

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
       CONTACT
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

                    contactMessage.textContent =
                        "MESSAGE READY — EMAIL SERVICE NOT CONNECTED YET.";

                }


                const submitButton =
                    contactForm.querySelector(
                        '[type="submit"]'
                    );


                if (
                    submitButton
                ) {

                    const originalText =
                        submitButton
                            .textContent;


                    submitButton.textContent =
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
