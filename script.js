document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       MOBILE / TABLET MENU
    ========================== */

    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", function () {

            mainNav.classList.toggle("active");

            if (mainNav.classList.contains("active")) {
                menuToggle.setAttribute("aria-expanded", "true");
            } else {
                menuToggle.setAttribute("aria-expanded", "false");
            }

        });

    }


    /* =========================
       SEARCH
    ========================== */

    const searchButton = document.getElementById("searchButton");
    const searchBox = document.getElementById("searchBox");
    const searchInput = document.getElementById("searchInput");
    const closeSearch = document.getElementById("closeSearch");
    const searchForm = document.getElementById("searchForm");


    if (searchButton && searchBox && searchInput) {

        searchButton.addEventListener("click", function () {

            searchBox.classList.add("active");

            searchInput.focus();

        });

    }


    if (closeSearch && searchBox && searchInput) {

        closeSearch.addEventListener("click", function () {

            searchBox.classList.remove("active");

            searchInput.value = "";

        });

    }


    if (searchForm && searchInput) {

        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const query = searchInput.value.trim();

            if (query !== "") {

                window.location.href =
                    "shop.html?search=" +
                    encodeURIComponent(query);

            }

        });

    }

});

/* =========================
   CART COUNT
========================= */

function updateCartCount() {

    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) return;

    const cart =
        localStorage.getItem("setApartCart");

    if (!cart) {
        cartCount.style.display = "none";
        return;
    }

    try {

        const product = JSON.parse(cart);

        const quantity =
            Number(product.quantity) || 0;

        if (quantity > 0) {

            cartCount.textContent = quantity;
            cartCount.style.display = "flex";

        } else {

            cartCount.style.display = "none";

        }

    } catch (error) {

        cartCount.style.display = "none";

    }

}


/* =========================
   UPDATE CART COUNT
========================= */

updateCartCount();
