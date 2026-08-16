/* =========================================================
   SET APART — GLOBAL JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       MOBILE MENU
    ===================================================== */

    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", function () {

            const isOpen = mainNav.classList.toggle("active");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close menu" : "Open menu"
            );

            menuToggle.textContent = isOpen ? "×" : "☰";
        });


        /* Close menu when a link is clicked */

        mainNav.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                menuToggle.setAttribute(
                    "aria-label",
                    "Open menu"
                );

                menuToggle.textContent = "☰";
            });

        });


        /* Close menu when clicking outside */

        document.addEventListener("click", function (event) {

            if (
                mainNav.classList.contains("active") &&
                !mainNav.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                menuToggle.setAttribute(
                    "aria-label",
                    "Open menu"
                );

                menuToggle.textContent = "☰";
            }

        });
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchButton = document.getElementById("searchButton");
    const searchBox = document.getElementById("searchBox");
    const closeSearch = document.getElementById("closeSearch");
    const searchInput = document.getElementById("searchInput");
    const searchForm = document.getElementById("searchForm");

    if (searchButton && searchBox) {

        searchButton.addEventListener("click", function () {

            searchBox.classList.toggle("active");

            if (searchBox.classList.contains("active") && searchInput) {
                setTimeout(function () {
                    searchInput.focus();
                }, 100);
            }
        });
    }

    if (closeSearch && searchBox) {

        closeSearch.addEventListener("click", function () {
            searchBox.classList.remove("active");
        });
    }

    if (searchForm) {

        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const query = searchInput
                ? searchInput.value.trim().toLowerCase()
                : "";

            if (!query) {
                return;
            }

            /*
              Shop page search:
              if the user searches "hoodie", go to shop.
            */

            window.location.href =
                "shop.html?search=" +
                encodeURIComponent(query);
        });
    }


    /* =====================================================
       CART
    ===================================================== */

    const cartButton = document.getElementById("cartButton");
    const cartCount = document.getElementById("cartCount");

    function getCart() {

        try {
            return JSON.parse(
                localStorage.getItem("setApartCart")
            );
        } catch (error) {
            return null;
        }
    }


    function updateCartCount() {

        if (!cartCount) {
            return;
        }

        const cart = getCart();

        const quantity =
            cart && Number(cart.quantity)
                ? Number(cart.quantity)
                : 0;

        if (quantity > 0) {

            cartCount.textContent = quantity;
            cartCount.style.display = "flex";

        } else {

            cartCount.textContent = "0";
            cartCount.style.display = "none";
        }
    }


    updateCartCount();


    if (cartButton) {

        cartButton.addEventListener("click", function () {

            const cart = getCart();

            if (!cart) {

                alert("YOUR CART IS EMPTY.");
                return;
            }

            window.location.href = "cart.html";
        });
    }


    /* =====================================================
       SHOP — SIZE SELECTION
    ===================================================== */

    const selectedSizes = {
        black: "",
        beige: ""
    };


    document.querySelectorAll(".size-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const product = button.dataset.product;

            document
                .querySelectorAll(
                    '.size-btn[data-product="' +
                    product +
                    '"]'
                )
                .forEach(function (btn) {

                    btn.classList.remove("selected");
                });


            button.classList.add("selected");

            selectedSizes[product] = button.dataset.size;
        });

    });


    /* =====================================================
       SHOP — ADD TO CART
    ===================================================== */

    document.querySelectorAll(".add-to-cart").forEach(function (button) {

        button.addEventListener("click", function () {

            const type = button.dataset.product;

            const size = selectedSizes[type];

            if (!size) {

                alert("PLEASE SELECT A SIZE.");
                return;
            }


            const image =
                type === "beige"
                    ? "GOD FIRST BEIGE FRONT.png"
                    : "PILGRIM BLACK FRONT 1.png";


            let quantity = 1;

            const oldCart = getCart();


            if (
                oldCart &&
                oldCart.name === "SET APART HOODIE" &&
                oldCart.size === size &&
                oldCart.image === image
            ) {

                quantity =
                    (Number(oldCart.quantity) || 0) + 1;
            }


            const product = {

                name: "SET APART HOODIE",

                price: 44.99,

                size: size,

                quantity: quantity,

                image: image
            };


            localStorage.setItem(
                "setApartCart",
                JSON.stringify(product)
            );


            updateCartCount();


            if (typeof showMiniCart === "function") {

                showMiniCart(product);
            }


            alert(
                "SET APART HOODIE ADDED TO CART."
            );
        });

    });


    /* =====================================================
       SHOP — MOBILE / TABLET SLIDER
       FRONT <----> BACK
       NO ARROWS
    ===================================================== */

    document
        .querySelectorAll(".product-gallery")
        .forEach(function (gallery) {

            const slider =
                gallery.querySelector(".product-slider");

            const slides =
                gallery.querySelectorAll(".product-slide");

            const dots =
                gallery.querySelectorAll(".slider-dot");


            if (!slider || slides.length === 0) {
                return;
            }


            function updateDots() {

                if (!dots.length) {
                    return;
                }


                const slideWidth =
                    slider.clientWidth;

                if (!slideWidth) {
                    return;
                }


                const index =
                    Math.round(
                        slider.scrollLeft /
                        slideWidth
                    );


                dots.forEach(function (dot, i) {

                    dot.classList.toggle(
                        "active",
                        i === index
                    );

                });
            }


            slider.addEventListener(
                "scroll",
                updateDots,
                {
                    passive: true
                }
            );


            /* DOT NAVIGATION */

            dots.forEach(function (dot, index) {

                dot.addEventListener(
                    "click",
                    function () {

                        slider.scrollTo({

                            left:
                                slider.clientWidth *
                                index,

                            behavior: "smooth"
                        });

                    }
                );

            });


            /* Prevent image dragging */

            slides.forEach(function (slide) {

                const image =
                    slide.querySelector("img");

                if (!image) {
                    return;
                }


                image.addEventListener(
                    "dragstart",
                    function (event) {

                        event.preventDefault();
                    }
                );

            });


            /* Initial dot state */

            updateDots();
        });


    /* =====================================================
       CONTACT FORM
       MAILTO
    ===================================================== */

    const contactForm =
        document.getElementById("contactForm");


    if (contactForm) {

        contactForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const name =
                    document
                        .getElementById("name")
                        ?.value
                        .trim() || "";


                const email =
                    document
                        .getElementById("email")
                        ?.value
                        .trim() || "";


                const message =
                    document
                        .getElementById("message")
                        ?.value
                        .trim() || "";


                const subject =
                    encodeURIComponent(
                        "SET APART Contact — " +
                        name
                    );


                const body =
                    encodeURIComponent(

                        "Name: " +
                        name +

                        "\nEmail: " +
                        email +

                        "\n\nMessage:\n" +
                        message
                    );


                window.location.href =
                    "mailto:setapart1804@gmail.com" +
                    "?subject=" +
                    subject +
                    "&body=" +
                    body;
            }
        );
    }


    /* =====================================================
       SHOP SEARCH FILTER
       ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const searchQuery =
        params.get("search");


    if (
        searchQuery &&
        document.querySelector(".shop-products")
    ) {

        const normalized =
            searchQuery.toLowerCase();


        const products =
            document.querySelectorAll(
                ".single-product"
            );


        products.forEach(function (product) {

            const text =
                product.textContent.toLowerCase();


            if (!text.includes(normalized)) {

                product.style.display = "none";

            } else {

                product.style.display = "";
            }

        });

    }

});
