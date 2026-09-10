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
                44.99,

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
                44.99,

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
