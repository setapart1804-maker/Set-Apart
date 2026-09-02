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
