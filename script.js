document.addEventListener("DOMContentLoaded", function () {

    const searchButton = document.getElementById("searchButton");
    const searchBox = document.getElementById("searchBox");
    const searchInput = document.getElementById("searchInput");
    const closeSearch = document.getElementById("closeSearch");
    const searchForm = document.getElementById("searchForm");

    /* OPEN SEARCH */
    if (searchButton && searchBox && searchInput) {
        searchButton.addEventListener("click", function () {
            searchBox.classList.add("active");
            searchInput.focus();
        });
    }

    /* CLOSE SEARCH */
    if (closeSearch && searchBox && searchInput) {
        closeSearch.addEventListener("click", function () {
            searchBox.classList.remove("active");
            searchInput.value = "";
        });
    }

    /* SEARCH */
    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const query = searchInput.value.trim();

            if (query !== "") {
                window.location.href =
                    "shop.html?search=" + encodeURIComponent(query);
            }
        });
    }

});
