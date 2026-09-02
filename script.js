/* =========================================================
   SET APART
   MAIN JAVASCRIPT
   Navbar + Mobile Menu + Search + Cart Count
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const body = document.body;

    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    const searchButton = document.getElementById("searchButton");
    const searchPanel = document.getElementById("searchPanel");
    const closeSearch = document.getElementById("closeSearch");
    const searchInput = document.getElementById("searchInput");
    const searchForm = document.getElementById("searchForm");

    const pageOverlay = document.getElementById("pageOverlay");

    const cartCount = document.getElementById("cartCount");


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function openMobileMenu() {

        if (!menuToggle || !mobileMenu) {
            return;
        }

        menuToggle.classList.add("active");
        mobileMenu.classList.add("active");

        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close menu");

        body.classList.add("menu-open");

        if (pageOverlay) {
            pageOverlay.classList.add("active");
        }

    }


    function closeMobileMenu() {

        if (!menuToggle || !mobileMenu) {
            return;
        }

        menuToggle.classList.remove("active");
        mobileMenu.classList.remove("active");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open menu");

        body.classList.remove("menu-open");

        if (
            pageOverlay &&
            !searchPanel?.classList.contains("active")
        ) {
            pageOverlay.classList.remove("active");
        }

    }


    function toggleMobileMenu() {

        if (!mobileMenu) {
            return;
        }

        if (mobileMenu.classList.contains("active")) {
            closeMobileMenu();
        } else {

            closeSearchPanel();
            openMobileMenu();

        }

    }


    if (menuToggle) {

        menuToggle.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            toggleMobileMenu();

        });

    }


    /* =====================================================
       CLOSE MOBILE MENU WHEN LINK IS CLICKED
    ===================================================== */

    if (mobileMenu) {

        const mobileLinks =
            mobileMenu.querySelectorAll("a");

        mobileLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                closeMobileMenu();

            });

        });

    }


    /* =====================================================
       SEARCH PANEL
    ===================================================== */

    function openSearchPanel() {

        if (!searchPanel) {
            return;
        }

        closeMobileMenu();

        searchPanel.classList.add("active");

        body.classList.add("search-open");

        if (pageOverlay) {
            pageOverlay.classList.add("active");
        }

        if (searchInput) {

            setTimeout(function () {

                searchInput.focus();

            }, 200);

        }

    }


    function closeSearchPanel() {

        if (!searchPanel) {
            return;
        }

        searchPanel.classList.remove("active");

        body.classList.remove("search-open");

        if (
            pageOverlay &&
            !mobileMenu?.classList.contains("active")
        ) {
            pageOverlay.classList.remove("active");
        }

    }


    if (searchButton) {

        searchButton.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (
                searchPanel &&
                searchPanel.classList.contains("active")
            ) {

                closeSearchPanel();

            } else {

                openSearchPanel();

            }

        });

    }


    if (closeSearch) {

        closeSearch.addEventListener("click", function (event) {

            event.preventDefault();

            closeSearchPanel();

        });

    }


    /* =====================================================
       SEARCH FORM
    ===================================================== */

    if (searchForm) {

        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const query =
                searchInput
                    ? searchInput.value.trim()
                    : "";

            if (!query) {

                if (searchInput) {
                    searchInput.focus();
                }

                return;

            }

            window.location.href =
                "shop.html?search=" +
                encodeURIComponent(query);

        });

    }


    /* =====================================================
       OVERLAY
    ===================================================== */

    if (pageOverlay) {

        pageOverlay.addEventListener("click", function () {

            closeMobileMenu();
            closeSearchPanel();

        });

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeMobileMenu();
            closeSearchPanel();

        }

    });


    /* =====================================================
       WINDOW RESIZE
    ===================================================== */

    window.addEventListener("resize", function () {

        if (window.innerWidth > 1024) {

            closeMobileMenu();

        }

    });


    /* =====================================================
       CART COUNT
    ===================================================== */

    function updateCartCount() {

        if (!cartCount) {
            return;
        }

        let totalQuantity = 0;

        try {

            const savedCart =
                localStorage.getItem("setApartCart");

            if (savedCart) {

                const cart =
                    JSON.parse(savedCart);


                /* =========================================
                   SUPPORT SINGLE PRODUCT CART
                ========================================= */

                if (
                    cart &&
                    !Array.isArray(cart)
                ) {

                    totalQuantity =
                        Number(cart.quantity) || 0;

                }


                /* =========================================
                   SUPPORT MULTIPLE PRODUCTS LATER
                ========================================= */

                if (
                    Array.isArray(cart)
                ) {

                    totalQuantity =
                        cart.reduce(
                            function (total, item) {

                                return total +
                                    (
                                        Number(item.quantity)
                                        || 0
                                    );

                            },
                            0
                        );

                }

            }

        } catch (error) {

            console.error(
                "Cart data error:",
                error
            );

        }


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


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updateCartCount();


    /* =====================================================
       UPDATE CART WHEN LOCAL STORAGE CHANGES
    ===================================================== */

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
       MAKE CART UPDATE AVAILABLE TO OTHER PAGES
    ===================================================== */

    window.updateSetApartCartCount =
        updateCartCount;

});

/* =========================================================
   SET APART — SHOP PAGE JAVASCRIPT
   Product Gallery + Colors + Sizes + Filters
   Search + Add To Cart + Buy Now
========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       PRODUCT INFORMATION
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
                ]
            }
        }

    };


    /* =====================================================
       PRODUCT STATE
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


    /* =====================================================
       PRODUCT GALLERY ARROWS
    ===================================================== */

    const productGalleries =
        document.querySelectorAll(".shop-item-gallery");


    productGalleries.forEach(function (gallery) {

        const slider =
            gallery.querySelector(".shop-image-slider");

        const previousButton =
            gallery.querySelector(".shop-arrow-prev");

        const nextButton =
            gallery.querySelector(".shop-arrow-next");


        if (!slider) {
            return;
        }


        function getSlideWidth() {

            return slider.clientWidth;

        }


        /* PREVIOUS */

        if (previousButton) {

            previousButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    slider.scrollBy({
                        left: -getSlideWidth(),
                        behavior: "smooth"
                    });

                }
            );

        }


        /* NEXT */

        if (nextButton) {

            nextButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    slider.scrollBy({
                        left: getSlideWidth(),
                        behavior: "smooth"
                    });

                }
            );

        }

    });


    /* =====================================================
       COLOR SELECTION
    ===================================================== */

    const colorButtons =
        document.querySelectorAll(".color-option");


    colorButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

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


                /* SAVE COLOR */

                productState[productId].color =
                    color;


                /* PRODUCT CONTAINER */

                const productElement =
                    button.closest(".shop-item");


                if (!productElement) {
                    return;
                }


                /* REMOVE OLD SELECTED COLOR */

                const productColorButtons =
                    productElement.querySelectorAll(
                        ".color-option"
                    );


                productColorButtons.forEach(
                    function (colorButton) {

                        colorButton.classList.remove(
                            "selected"
                        );

                    }
                );


                /* SELECT CURRENT COLOR */

                button.classList.add("selected");


                /* UPDATE COLOR NAME */

                const selectedColorText =
                    productElement.querySelector(
                        ".selected-color"
                    );


                if (selectedColorText) {

                    selectedColorText.textContent =
                        color.toUpperCase();

                }


                /* CHANGE IMAGES IF AVAILABLE */

                updateProductImages(
                    productId,
                    color,
                    productElement
                );

            }
        );

    });


    /* =====================================================
       UPDATE PRODUCT IMAGES
    ===================================================== */

    function updateProductImages(
        productId,
        color,
        productElement
    ) {

        const product =
            productData[productId];


        if (!product) {
            return;
        }


        const colorImages =
            product.images[color];


        /*
           IMPORTANT:

           Si nou poko ajoute foto pou yon koulè,
           sit la pap mete yon imaj ki kraze.

           Li ap kite foto aktyèl la anplas.
        */

        if (
            !colorImages ||
            colorImages.length === 0
        ) {

            return;

        }


        const images =
            productElement.querySelectorAll(
                ".shop-image-slide img"
            );


        images.forEach(
            function (image, index) {

                if (colorImages[index]) {

                    image.src =
                        colorImages[index];

                }

            }
        );


        /* RETURN TO FRONT IMAGE */

        const slider =
            productElement.querySelector(
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
       SIZE SELECTION
    ===================================================== */

    const sizeButtons =
        document.querySelectorAll(".size-option");


    sizeButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

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


                const productElement =
                    button.closest(".shop-item");


                if (!productElement) {
                    return;
                }


                /* REMOVE OLD SIZE */

                const productSizeButtons =
                    productElement.querySelectorAll(
                        ".size-option"
                    );


                productSizeButtons.forEach(
                    function (sizeButton) {

                        sizeButton.classList.remove(
                            "selected"
                        );

                    }
                );


                /* SELECT NEW SIZE */

                button.classList.add("selected");


                /* SAVE SIZE */

                productState[productId].size =
                    size;

            }
        );

    });


    /* =====================================================
       FILTER PRODUCTS
    ===================================================== */

    const filterButtons =
        document.querySelectorAll(".filter-button");

    const shopItems =
        document.querySelectorAll(".shop-item");


    filterButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const selectedFilter =
                    button.dataset.filter;


                /* ACTIVE FILTER */

                filterButtons.forEach(
                    function (filterButton) {

                        filterButton.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add("active");


                /* FILTER PRODUCTS */

                shopItems.forEach(
                    function (item) {

                        const category =
                            item.dataset.category;


                        if (
                            selectedFilter === "all" ||
                            category === selectedFilter
                        ) {

                            item.classList.remove(
                                "filter-hidden"
                            );

                        } else {

                            item.classList.add(
                                "filter-hidden"
                            );

                        }

                    }
                );

            }
        );

    });


    /* =====================================================
       SEARCH FROM URL
       Example:
       shop.html?search=pilgrim
    ===================================================== */

    function applyShopSearch() {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const searchTerm =
            params.get("search");


        if (!searchTerm) {
            return;
        }


        const normalizedSearch =
            searchTerm
                .toLowerCase()
                .trim();


        shopItems.forEach(
            function (item) {

                const productName =
                    (
                        item.dataset.name || ""
                    ).toLowerCase();


                if (
                    productName.includes(
                        normalizedSearch
                    )
                ) {

                    item.classList.remove(
                        "search-hidden"
                    );

                } else {

                    item.classList.add(
                        "search-hidden"
                    );

                }

            }
        );

    }


    applyShopSearch();


    /* =====================================================
       GET CART
    ===================================================== */

    function getCart() {

        try {

            const savedCart =
                localStorage.getItem(
                    "setApartCart"
                );


            if (!savedCart) {

                return [];

            }


            const parsedCart =
                JSON.parse(savedCart);


            if (Array.isArray(parsedCart)) {

                return parsedCart;

            }


            if (
                parsedCart &&
                typeof parsedCart === "object"
            ) {

                return [parsedCart];

            }


            return [];

        } catch (error) {

            console.error(
                "Unable to read cart:",
                error
            );

            return [];

        }

    }


    /* =====================================================
       SAVE CART
    ===================================================== */

    function saveCart(cart) {

        localStorage.setItem(
            "setApartCart",
            JSON.stringify(cart)
        );


        /*
           This function comes from our main
           SET APART JavaScript above.
        */

        if (
            typeof window.updateSetApartCartCount
            === "function"
        ) {

            window.updateSetApartCartCount();

        }

    }


    /* =====================================================
       CREATE CART PRODUCT
    ===================================================== */

    function createCartItem(productId) {

        const product =
            productData[productId];

        const state =
            productState[productId];


        if (
            !product ||
            !state
        ) {

            return null;

        }


        /* SIZE REQUIRED */

        if (!state.size) {

            alert(
                "Please select a size first."
            );

            return null;

        }


        return {

            id: product.id,

            name: product.name,

            price: product.price,

            color: state.color,

            size: state.size,

            quantity: 1,

            image:
                product.images[state.color]?.[0]
                ||
                product.images.black?.[0]
                ||
                ""

        };

    }


    /* =====================================================
       ADD PRODUCT TO CART
    ===================================================== */

    function addProductToCart(productId) {

        const newItem =
            createCartItem(productId);


        if (!newItem) {

            return false;

        }


        const cart =
            getCart();


        /*
           Check whether same product +
           same color + same size
           already exists.
        */

        const existingItem =
            cart.find(
                function (item) {

                    return (
                        item.id === newItem.id &&
                        item.color === newItem.color &&
                        item.size === newItem.size
                    );

                }
            );


        if (existingItem) {

            existingItem.quantity =
                (
                    Number(existingItem.quantity)
                    || 0
                ) + 1;

        } else {

            cart.push(newItem);

        }


        saveCart(cart);


        return true;

    }


    /* =====================================================
       ADD TO CART BUTTONS
    ===================================================== */

    const addToCartButtons =
        document.querySelectorAll(
            ".add-to-cart"
        );


    addToCartButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const productId =
                        button.dataset.product;


                    const added =
                        addProductToCart(
                            productId
                        );


                    if (!added) {
                        return;
                    }


                    /* BUTTON FEEDBACK */

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

    const buyNowButtons =
        document.querySelectorAll(
            ".product-buy-now"
        );


    buyNowButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const productId =
                        button.dataset.product;


                    const added =
                        addProductToCart(
                            productId
                        );


                    if (!added) {

                        return;

                    }


                    window.location.href =
                        "cart.html";

                }
            );

        }
    );


});

/* =========================================================
   SET APART — CART PAGE JAVASCRIPT
   Render Cart + Quantity + Remove + Totals
========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const cartItemsContainer =
        document.getElementById("cartItems");

    const cartLayout =
        document.getElementById("cartLayout");

    const emptyCart =
        document.getElementById("emptyCart");

    const cartSubtotal =
        document.getElementById("cartSubtotal");

    const cartTotal =
        document.getElementById("cartTotal");

    const checkoutButton =
        document.getElementById("checkoutButton");


    /*
       If we're not on cart.html,
       stop here.
    */

    if (!cartItemsContainer) {
        return;
    }


    /* =====================================================
       READ CART
    ===================================================== */

    function getCart() {

        try {

            const savedCart =
                localStorage.getItem("setApartCart");


            if (!savedCart) {
                return [];
            }


            const parsedCart =
                JSON.parse(savedCart);


            if (Array.isArray(parsedCart)) {
                return parsedCart;
            }


            if (
                parsedCart &&
                typeof parsedCart === "object"
            ) {
                return [parsedCart];
            }


            return [];

        } catch (error) {

            console.error(
                "Unable to read cart:",
                error
            );

            return [];

        }

    }


    /* =====================================================
       SAVE CART
    ===================================================== */

    function saveCart(cart) {

        localStorage.setItem(
            "setApartCart",
            JSON.stringify(cart)
        );


        if (
            typeof window.updateSetApartCartCount
            === "function"
        ) {

            window.updateSetApartCartCount();

        }

    }


    /* =====================================================
       MONEY FORMAT
    ===================================================== */

    function formatMoney(value) {

        const number =
            Number(value) || 0;


        return "$" + number.toFixed(2);

    }


    /* =====================================================
       SAFE TEXT
    ===================================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* =====================================================
       RENDER CART
    ===================================================== */

    function renderCart() {

        const cart =
            getCart();


        cartItemsContainer.innerHTML = "";


        /* =========================================
           EMPTY CART
        ========================================= */

        if (cart.length === 0) {

            if (cartLayout) {
                cartLayout.style.display = "none";
            }

            if (emptyCart) {
                emptyCart.classList.add("active");
            }

            if (cartSubtotal) {
                cartSubtotal.textContent = "$0.00";
            }

            if (cartTotal) {
                cartTotal.textContent = "$0.00";
            }


            return;

        }


        /* =========================================
           CART HAS PRODUCTS
        ========================================= */

        if (cartLayout) {
            cartLayout.style.display = "grid";
        }

        if (emptyCart) {
            emptyCart.classList.remove("active");
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


                subtotal += itemTotal;


                const productName =
                    escapeHTML(
                        item.name || "SET APART PRODUCT"
                    );


                const color =
                    escapeHTML(
                        item.color || ""
                    ).toUpperCase();


                const size =
                    escapeHTML(
                        item.size || ""
                    ).toUpperCase();


                const image =
                    escapeHTML(
                        item.image || ""
                    );


                const cartItem =
                    document.createElement("article");


                cartItem.className =
                    "cart-item";


                cartItem.dataset.index =
                    index;


                cartItem.innerHTML = `

                    <div class="cart-product">

                        <div class="cart-product-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${image}"
                                            alt="${productName}">
                                      `
                                    : ""
                            }

                        </div>


                        <div class="cart-product-info">

                            <h3>
                                ${productName}
                            </h3>

                            ${
                                color
                                    ? `
                                        <p>
                                            COLOR: ${color}
                                        </p>
                                      `
                                    : ""
                            }

                            ${
                                size
                                    ? `
                                        <p>
                                            SIZE: ${size}
                                        </p>
                                      `
                                    : ""
                            }

                            <p class="cart-product-price">
                                ${formatMoney(price)}
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
                                data-index="${index}"
                                aria-label="Decrease quantity">

                                −

                            </button>


                            <span class="quantity-number">

                                ${quantity}

                            </span>


                            <button
                                type="button"
                                class="quantity-button quantity-plus"
                                data-index="${index}"
                                aria-label="Increase quantity">

                                +

                            </button>

                        </div>

                    </div>



                    <div class="cart-item-total">

                        ${formatMoney(itemTotal)}

                    </div>

                `;


                cartItemsContainer.appendChild(
                    cartItem
                );

            }
        );


        /* =========================================
           TOTALS
        ========================================= */

        if (cartSubtotal) {

            cartSubtotal.textContent =
                formatMoney(subtotal);

        }


        if (cartTotal) {

            cartTotal.textContent =
                formatMoney(subtotal);

        }


        /* =========================================
           BUTTON EVENTS
        ========================================= */

        attachCartEvents();

    }


    /* =====================================================
       CART BUTTON EVENTS
    ===================================================== */

    function attachCartEvents() {


        /* =========================================
           PLUS
        ========================================= */

        const plusButtons =
            document.querySelectorAll(
                ".quantity-plus"
            );


        plusButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const cart =
                            getCart();


                        if (!cart[index]) {
                            return;
                        }


                        cart[index].quantity =
                            (
                                Number(
                                    cart[index].quantity
                                )
                                || 1
                            ) + 1;


                        saveCart(cart);

                        renderCart();

                    }
                );

            }
        );


        /* =========================================
           MINUS
        ========================================= */

        const minusButtons =
            document.querySelectorAll(
                ".quantity-minus"
            );


        minusButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const cart =
                            getCart();


                        if (!cart[index]) {
                            return;
                        }


                        const currentQuantity =
                            Number(
                                cart[index].quantity
                            )
                            || 1;


                        if (currentQuantity > 1) {

                            cart[index].quantity =
                                currentQuantity - 1;


                            saveCart(cart);

                            renderCart();

                        }

                    }
                );

            }
        );


        /* =========================================
           REMOVE
        ========================================= */

        const removeButtons =
            document.querySelectorAll(
                ".cart-remove"
            );


        removeButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const cart =
                            getCart();


                        if (!cart[index]) {
                            return;
                        }


                        cart.splice(
                            index,
                            1
                        );


                        saveCart(cart);

                        renderCart();

                    }
                );

            }
        );

    }


    /* =====================================================
       CHECKOUT
    ===================================================== */

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                const cart =
                    getCart();


                if (cart.length === 0) {

                    return;

                }


                /*
                   Checkout page will be built next.
                */

                window.location.href =
                    "checkout.html";

            }
        );

    }


    /* =====================================================
       FIRST LOAD
    ===================================================== */

    renderCart();

});
