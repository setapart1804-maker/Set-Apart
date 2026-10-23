
/* =========================================================
   SET APART — JAVASCRIPT
   HOME + BAG + CART + CHECKOUT + CONTACT + PAYPAL
   NO SHOP PAGE
========================================================= */

"use strict";

const API_BASE = "https://set-apart.onrender.com";
const CART_KEY = "setApartCart";

const PRODUCTS = {
  pilgrim: {
    id: "pilgrim",
    name: "PILGRIM HOODIE",
    price: 34.99,
    message: "Walk by faith.",
    defaultColor: "brown",
    sideImage: "PILGRIM-BROWN-SIDE.png",
    images: {
      brown: {
        front: "PILGRIM BROWN FRONT.jpeg",
        back: "PILGRIM BROWN BLACK.jpeg"
      },
      black: {
        front: "PILGRIM BLACK FRONT.jpeg",
        back: "PILGRIM BLACK BACK.jpeg"
      },
      beige: {
        front: "PILGRIM BEIGE FRONT.jpeg",
        back: "PILGRIM BEIGE BACK.jpeg"
      },
      white: {
        front: "PILGRIM WHITE FRONT.jpeg",
        back: "PILGRIM WHITE BACK.jpeg"
      }
    }
  },

  godfirst: {
    id: "godfirst",
    name: "GOD FIRST HOODIE",
    price: 34.99,
    message: "Every day, the choice is simple: God first.",
    defaultColor: "black",
    sideImage: "GOD-FIRST-WHITE-SIDE.png",
    images: {
      black: {
        front: "GOD FIRST BLACK FRONT.jpeg",
        back: "GOD FIRST BLACK BACK.jpeg"
      },
      brown: {
        front: "GOD FIRST BROWN FRONT.jpeg",
        back: "GOD FIRST BROWN BACK.jpeg"
      },
      beige: {
        front: "GOD FIRST BEIGE FRONT.jpeg",
        back: "GOD FIRST BEIGE BACK.jpeg"
      },
      white: {
        front: "GOD FIRST WHITE FRONT.jpeg",
        back: "GOD FIRST WHITE BACK.jpeg"
      }
    }
  }
};

const COLORS = ["beige", "brown", "black", "white"];
const SIZES = ["S", "M", "L", "XL"];

function money(value) {
  return "$" + Number(value || 0).toFixed(2);
}

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const cart = JSON.parse(raw || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error("Cart read error:", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  window.dispatchEvent(new Event("setapart:cart"));
}

function cartQuantity() {
  return getCart().reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
}

function cartSubtotalValue() {
  return getCart().reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) *
      Number(item.price || 0),
    0
  );
}

function updateCartCount() {
  document.querySelectorAll("#cartCount").forEach((element) => {
    element.textContent = String(cartQuantity());
  });
}

window.updateSetApartCartCount = updateCartCount;

function getImage(id, color, side = "front") {
  return PRODUCTS[id]?.images[color]?.[side] || "";
}

function addToCart(id, color, size, quantity) {
  const product = PRODUCTS[id];
  const qty = Number(quantity);

  if (
    !product ||
    !product.images[color] ||
    !SIZES.includes(size) ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    qty > 20
  ) {
    return false;
  }

  const cart = getCart();

  const existing = cart.find(
    (item) =>
      item.id === id &&
      item.color === color &&
      item.size === size
  );

  if (existing) {
    if (Number(existing.quantity) + qty > 20) {
      alert("Maximum 20 pieces per variant.");
      return false;
    }
    existing.quantity += qty;
  } else {
    cart.push({
      id,
      name: product.name,
      price: product.price,
      color,
      size,
      quantity: qty,
      image: getImage(id, color)
    });
  }

  saveCart(cart);
  return true;
}

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* =========================================================
   HOME — REFERENCE EXPERIENCE
========================================================= */

function initHome() {
  const rack = document.getElementById("referenceRack");
  const stage = document.getElementById("referenceProductStage");
  const detailLayer = document.getElementById("referenceProductLayer");
  const bagLayer = document.getElementById("referenceBagLayer");

  if (!rack || !stage || !detailLayer || !bagLayer) return;

  const slides = Array.from(
    stage.querySelectorAll(".reference-look")
  );

  const detailImage = document.getElementById("referenceDetailImage");
  const detailInfo = detailLayer.querySelector(".reference-product-info");
  const gallery = detailLayer.querySelector(".reference-gallery-switch");
  const bagItems = document.getElementById("referenceBagItems");

  if (!slides.length || !detailImage || !detailInfo || !bagItems) {
    console.error("HOME reference elements missing.");
    return;
  }

  let activeIndex = 0;
  let activeSide = "front";
  let selectedSize = null;
  let selectedQuantity = 1;
  let detailSide = "front";
  let introTimer = null;

  const progress = document.querySelectorAll(".reference-progress span");
  const detailTitle = detailInfo.querySelector("h2");
  const detailMessage = detailInfo.querySelector(".reference-product-message");
  const detailPrice = detailInfo.querySelector(".reference-product-price");
  const detailColors = detailInfo.querySelector(".reference-color-row");
  const detailSizes = detailInfo.querySelector(".reference-size-row");
  const detailAdd = detailInfo.querySelector(".reference-add-button");
  const detailQuantity = detailInfo.querySelector(".reference-quantity-row");

  function currentSlide() {
    return slides[activeIndex];
  }

  function currentSelection() {
    const slide = currentSlide();
    return {
      id: slide.dataset.product,
      color: slide.dataset.color
    };
  }

  function findSlide(id, color) {
    return slides.findIndex(
      (slide) =>
        slide.dataset.product === id &&
        slide.dataset.color === color
    );
  }

  function openStage(id = "pilgrim") {
    clearTimeout(introTimer);

    const index = slides.findIndex(
      (slide) => slide.dataset.product === id
    );

    activeIndex = index >= 0 ? index : 0;
    activeSide = "front";

    rack.style.display = "none";
    rack.classList.remove("is-active");

    stage.classList.add("is-active");
    stage.setAttribute("aria-hidden", "false");

    renderStage();
  }

  function renderStage() {
    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle("is-active", active);

      if (!active) return;

      const id = slide.dataset.product;
      const color = slide.dataset.color;
      const product = PRODUCTS[id];
      if (!product) return;

      const image = slide.querySelector(".reference-main-garment");
      const title = slide.querySelector(".reference-look-info h1, .reference-look-info h2");
      const price = slide.querySelector(".reference-look-info > p");

      if (image) {
        image.src = getImage(id, color, activeSide);
        image.alt = `${product.name} ${color} ${activeSide}`;
      }

      if (title) {
        title.textContent = `${id === "godfirst" ? "GOD FIRST" : "PILGRIM"} — ${color.toUpperCase()}`;
      }

      if (price) price.textContent = money(product.price) + " USD";

      const info = slide.querySelector(".reference-look-info");
      if (!info) return;

      let controls = info.querySelector(".reference-look-controls");

      if (!controls) {
        controls = makeElement("div", "reference-look-controls");
        info.appendChild(controls);
      }

      controls.replaceChildren();

      ["front", "back"].forEach((side) => {
        const button = makeElement(
          "button",
          "reference-view-button" +
            (side === activeSide ? " is-active" : ""),
          side.toUpperCase()
        );

        button.type = "button";
        button.dataset.view = side;

        button.addEventListener("click", () => {
          activeSide = side;
          renderStage();
        });

        controls.appendChild(button);
      });

      let colorRow = info.querySelector(".reference-color-row");

      if (!colorRow) {
        colorRow = makeElement("div", "reference-color-row");
        info.appendChild(colorRow);
      }

      colorRow.replaceChildren();

      COLORS.forEach((option) => {
        const button = makeElement(
          "button",
          "reference-color " + option +
            (option === color ? " is-active" : "")
        );

        button.type = "button";
        button.setAttribute("aria-label", option);
        button.setAttribute("aria-pressed", String(option === color));

        button.addEventListener("click", () => {
          const next = findSlide(id, option);
          if (next >= 0) {
            activeIndex = next;
            activeSide = "front";
            renderStage();
          }
        });

        colorRow.appendChild(button);
      });

      let seeButton = info.querySelector(".reference-piece-button");

      if (!seeButton) {
        seeButton = makeElement(
          "button",
          "reference-piece-button",
          "SEE THE PIECE"
        );
        info.appendChild(seeButton);
      }

      seeButton.type = "button";
      seeButton.textContent = "SEE THE PIECE";
      seeButton.onclick = () => openDetail(id, color);
    });

    progress.forEach((item, index) => {
      item.classList.toggle(
        "is-active",
        index === Math.floor(activeIndex / 2) % progress.length
      );
    });
  }

  function changeSlide(direction) {
    activeIndex =
      (activeIndex + direction + slides.length) % slides.length;
    activeSide = "front";
    renderStage();
  }

  function openDetail(id, color) {
    const index = findSlide(id, color);

    if (index >= 0) activeIndex = index;

    selectedSize = null;
    selectedQuantity = 1;
    detailSide = "front";

    renderDetail();

    detailLayer.classList.add("is-active");
    detailLayer.setAttribute("aria-hidden", "false");
    document.body.classList.add("sa-lock");
  }

  function renderDetail() {
    const { id, color } = currentSelection();
    const product = PRODUCTS[id];
    if (!product) return;

    detailImage.src = getImage(id, color, detailSide);
    detailImage.alt = `${product.name} ${color} ${detailSide}`;

    if (detailTitle) {
      detailTitle.textContent = id === "godfirst" ? "GOD FIRST" : "PILGRIM";
    }

    if (detailMessage) detailMessage.textContent = product.message;
    if (detailPrice) detailPrice.textContent = money(product.price) + " USD";

    if (gallery) {
      gallery.replaceChildren();

      ["front", "back"].forEach((side) => {
        const button = makeElement(
          "button",
          side === detailSide ? "is-active" : "",
          side.toUpperCase()
        );

        button.type = "button";

        button.onclick = () => {
          detailSide = side;
          renderDetail();
        };

        gallery.appendChild(button);
      });
    }

    if (detailColors) {
      detailColors.replaceChildren();

      COLORS.forEach((option) => {
        const button = makeElement(
          "button",
          "reference-color " + option +
            (option === color ? " is-active" : "")
        );

        button.type = "button";
        button.setAttribute("aria-label", option);

        button.onclick = () => {
          const index = findSlide(id, option);
          if (index >= 0) {
            activeIndex = index;
            detailSide = "front";
            renderStage();
            renderDetail();
          }
        };

        detailColors.appendChild(button);
      });
    }

    const optionLabels = detailInfo.querySelectorAll(
      ".reference-option-heading span"
    );

    if (optionLabels.length >= 2) {
      optionLabels[1].textContent = color.toUpperCase();
    }

    if (detailSizes) {
      detailSizes.replaceChildren();

      SIZES.forEach((size) => {
        const button = makeElement(
          "button",
          size === selectedSize ? "is-active" : "",
          size
        );

        button.type = "button";
        button.setAttribute("aria-pressed", String(size === selectedSize));

        button.onclick = () => {
          selectedSize = size;
          renderDetail();
        };

        detailSizes.appendChild(button);
      });
    }

    if (detailQuantity) {
      let controls = detailQuantity.querySelector("div");

      if (!controls) {
        controls = makeElement("div");
        detailQuantity.appendChild(controls);
      }

      controls.replaceChildren();

      const minus = makeElement("button", "", "−");
      const number = makeElement("strong", "", String(selectedQuantity));
      const plus = makeElement("button", "", "+");

      minus.type = "button";
      plus.type = "button";

      minus.onclick = () => {
        selectedQuantity = Math.max(1, selectedQuantity - 1);
        renderDetail();
      };

      plus.onclick = () => {
        selectedQuantity = Math.min(20, selectedQuantity + 1);
        renderDetail();
      };

      controls.append(minus, number, plus);
    }

    if (detailAdd) {
      detailAdd.textContent =
        "ADD TO BAG — " + money(product.price * selectedQuantity);

      detailAdd.onclick = () => {
        if (!selectedSize) {
          alert("Please select a size first.");
          return;
        }

        if (addToCart(id, color, selectedSize, selectedQuantity)) {
          closeDetail();
          openBag();
        }
      };
    }
  }

  function closeDetail() {
    detailLayer.classList.remove("is-active");
    detailLayer.setAttribute("aria-hidden", "true");

    if (!bagLayer.classList.contains("is-active")) {
      document.body.classList.remove("sa-lock");
    }
  }

  function renderBag() {
    bagItems.replaceChildren();

    const cart = getCart();

    if (!cart.length) {
      bagItems.appendChild(
        makeElement("div", "reference-bag-empty", "YOUR BAG IS EMPTY.")
      );
    }

    cart.forEach((item, index) => {
      const article = makeElement("article", "sa-bag-item");

      const imageWrap = makeElement("div", "sa-bag-item-image");
      const img = makeElement("img");

      img.src = getImage(item.id, item.color) || item.image || "";
      img.alt = item.name || "SET APART";
      imageWrap.appendChild(img);

      const copy = makeElement("div");
      copy.appendChild(makeElement("h3", "", item.name));
      copy.appendChild(
        makeElement(
          "p",
          "",
          `${item.color.toUpperCase()} · ${item.size} · QTY ${item.quantity}`
        )
      );

      const remove = makeElement("button", "sa-bag-remove", "REMOVE");
      remove.type = "button";

      remove.onclick = () => {
        const next = getCart();
        next.splice(index, 1);
        saveCart(next);
        renderBag();
      };

      copy.appendChild(remove);

      article.append(
        imageWrap,
        copy,
        makeElement("strong", "", money(item.price * item.quantity))
      );

      bagItems.appendChild(article);
    });

    const bottom = bagLayer.querySelector(".reference-bag-bottom");
    const subtotal = bottom?.querySelector("strong");

    if (subtotal) {
      subtotal.textContent = money(cartSubtotalValue()) + " USD";
    }

    if (bottom) {
      const links = bottom.querySelectorAll("a");
      if (links[0]) links[0].href = "cart.html";
      if (links[1]) links[1].href = "checkout.html";
    }

    updateCartCount();
  }

  function openBag() {
    renderBag();
    bagLayer.classList.add("is-active");
    bagLayer.setAttribute("aria-hidden", "false");
    document.body.classList.add("sa-lock");
  }

  function closeBag() {
    bagLayer.classList.remove("is-active");
    bagLayer.setAttribute("aria-hidden", "true");

    if (!detailLayer.classList.contains("is-active")) {
      document.body.classList.remove("sa-lock");
    }
  }

  document.querySelectorAll("[data-reference-product]").forEach((button) => {
    button.addEventListener("click", () => {
      openStage(button.dataset.referenceProduct);
    });
  });

  document.querySelector(".reference-discover-button")
    ?.addEventListener("click", () => openStage("pilgrim"));

  stage.querySelector(".reference-stage-arrow-left")
    ?.addEventListener("click", () => changeSlide(-1));

  stage.querySelector(".reference-stage-arrow-right")
    ?.addEventListener("click", () => changeSlide(1));

  document.querySelectorAll(".reference-collection-card").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.openProduct;
      if (PRODUCTS[id]) {
        openDetail(id, PRODUCTS[id].defaultColor);
      }
    });
  });

  document.getElementById("homeBagButton")
    ?.addEventListener("click", openBag);

  detailLayer.querySelector(".reference-product-close")
    ?.addEventListener("click", closeDetail);

  detailLayer.querySelector(".reference-product-overlay")
    ?.addEventListener("click", closeDetail);

  bagLayer.querySelector(".reference-bag-close")
    ?.addEventListener("click", closeBag);

  bagLayer.querySelector(".reference-bag-overlay")
    ?.addEventListener("click", closeBag);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (detailLayer.classList.contains("is-active")) closeDetail();
      else if (bagLayer.classList.contains("is-active")) closeBag();
    }

    if (
      stage.classList.contains("is-active") &&
      !detailLayer.classList.contains("is-active") &&
      !bagLayer.classList.contains("is-active")
    ) {
      if (event.key === "ArrowLeft") changeSlide(-1);
      if (event.key === "ArrowRight") changeSlide(1);
    }
  });

  let startX = null;

  stage.addEventListener(
    "touchstart",
    (event) => {
      startX = event.touches[0]?.clientX ?? null;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchend",
    (event) => {
      if (startX === null) return;
      if (detailLayer.classList.contains("is-active")) return;

      const difference = event.changedTouches[0].clientX - startX;

      if (Math.abs(difference) >= 50) {
        changeSlide(difference < 0 ? 1 : -1);
      }

      startX = null;
    },
    { passive: true }
  );

  window.addEventListener("setapart:cart", () => {
    if (bagLayer.classList.contains("is-active")) renderBag();
  });

  renderStage();
  renderBag();

  // Initial hero scene before the product stage.
  introTimer = setTimeout(() => {
    if (!stage.classList.contains("is-active")) {
      openStage("pilgrim");
    }
  }, 4500);
}

/* =========================================================
   CART PAGE
========================================================= */

function initCartPage() {
  const container = document.getElementById("cartItems");
  if (!container) return;

  const layout = document.getElementById("cartLayout");
  const empty = document.getElementById("emptyCart");
  const subtotal = document.getElementById("cartSubtotal");
  const total = document.getElementById("cartTotal");

  function render() {
    const cart = getCart();
    container.replaceChildren();

    if (layout) layout.style.display = cart.length ? "" : "none";
    empty?.classList.toggle("active", !cart.length);

    if (subtotal) subtotal.textContent = money(cartSubtotalValue());
    if (total) total.textContent = money(cartSubtotalValue());

    cart.forEach((item, index) => {
      const row = makeElement("article", "cart-item");

      const product = makeElement("div", "cart-product");
      const imageBox = makeElement("div", "cart-product-image");
      const image = makeElement("img");

      image.src = getImage(item.id, item.color) || item.image || "";
      image.alt = item.name;

      imageBox.appendChild(image);

      const info = makeElement("div", "cart-product-info");
      info.appendChild(makeElement("h3", "", item.name));
      info.appendChild(
        makeElement("p", "", `COLOR: ${item.color.toUpperCase()}`)
      );
      info.appendChild(makeElement("p", "", `SIZE: ${item.size}`));
      info.appendChild(
        makeElement("div", "cart-product-price", money(item.price))
      );

      const remove = makeElement("button", "cart-remove", "REMOVE");
      remove.type = "button";
      remove.onclick = () => modify(index, "remove");

      info.appendChild(remove);
      product.append(imageBox, info);

      const qty = makeElement("div", "cart-quantity");
      const controls = makeElement("div", "quantity-control");

      const minus = makeElement("button", "quantity-button", "−");
      const number = makeElement("span", "quantity-number", String(item.quantity));
      const plus = makeElement("button", "quantity-button", "+");

      minus.type = "button";
      plus.type = "button";

      minus.onclick = () => modify(index, "minus");
      plus.onclick = () => modify(index, "plus");

      controls.append(minus, number, plus);
      qty.appendChild(controls);

      row.append(
        product,
        qty,
        makeElement(
          "strong",
          "cart-item-total",
          money(item.price * item.quantity)
        )
      );

      container.appendChild(row);
    });

    updateCartCount();
  }

  function modify(index, action) {
    const cart = getCart();
    if (!cart[index]) return;

    if (action === "remove") {
      cart.splice(index, 1);
    } else if (action === "plus") {
      cart[index].quantity = Math.min(
        20,
        Number(cart[index].quantity) + 1
      );
    } else if (action === "minus") {
      cart[index].quantity = Math.max(
        1,
        Number(cart[index].quantity) - 1
      );
    }

    saveCart(cart);
    render();
  }

  document.getElementById("checkoutButton")
    ?.addEventListener("click", () => {
      if (getCart().length) location.href = "checkout.html";
    });

  render();
}

/* =========================================================
   CHECKOUT + SHIPPING + PAYPAL
========================================================= */

function initCheckout() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const itemsBox = document.getElementById("checkoutItems");
  const subtotalEl = document.getElementById("checkoutSubtotal");
  const shippingEl = document.getElementById("checkoutShipping");
  const totalEl = document.getElementById("checkoutTotal");
  const methodLabel = document.getElementById("shippingMethodLabel");
  const methodPrice = document.getElementById("shippingMethodPrice");
  const methodNote = document.getElementById("shippingMethodNote");
  const paypalBox = document.getElementById("paypal-button-container");
  const submit = form.querySelector('[type="submit"]');

  const country = document.getElementById("country");
  const city = document.getElementById("city");
  const state = document.getElementById("state");

  let shippingQuote = null;
  let shippingTimer = null;
  let requestNumber = 0;
  let paypalReady = false;
  let paypalPromise = null;

  function getCustomer() {
    const data = new FormData(form);

    const fields = [
      "email", "firstName", "lastName", "address",
      "apartment", "country", "city", "state",
      "postalCode", "phone"
    ];

    const customer = {};

    fields.forEach((field) => {
      customer[field] = String(data.get(field) || "").trim();
    });

    return customer;
  }

  function paymentItems() {
    return getCart().map((item) => ({
      id: item.id,
      color: item.color,
      size: item.size,
      quantity: Number(item.quantity)
    }));
  }

  function renderCheckout() {
    if (!itemsBox) return;

    const cart = getCart();
    itemsBox.replaceChildren();

    if (!cart.length) {
      const box = makeElement("div", "checkout-empty");
      box.appendChild(makeElement("h3", "", "YOUR CART IS EMPTY."));

      const link = makeElement(
        "a",
        "button button-black",
        "VIEW COLLECTION"
      );
      link.href = "index.html#collection";
      box.appendChild(link);
      itemsBox.appendChild(box);

      if (submit) submit.disabled = true;
      return;
    }

    cart.forEach((item) => {
      const row = makeElement("div", "checkout-summary-item");

      const visual = makeElement("div", "checkout-summary-image");
      const image = makeElement("img");

      image.src = getImage(item.id, item.color) || item.image || "";
      image.alt = item.name;
      visual.appendChild(image);

      visual.appendChild(
        makeElement(
          "span",
          "checkout-summary-quantity",
          String(item.quantity)
        )
      );

      const info = makeElement("div", "checkout-summary-info");

      info.appendChild(makeElement("h3", "", item.name));
      info.appendChild(
        makeElement("p", "", `${item.color.toUpperCase()} / ${item.size}`)
      );

      row.append(
        visual,
        info,
        makeElement(
          "strong",
          "checkout-summary-price",
          money(item.price * item.quantity)
        )
      );

      itemsBox.appendChild(row);
    });

    if (subtotalEl) subtotalEl.textContent = money(cartSubtotalValue());
    if (totalEl) totalEl.textContent = money(cartSubtotalValue());
  }

  function resetShipping(message = "Enter your destination.") {
    shippingQuote = null;

    if (shippingEl) shippingEl.textContent = "—";
    if (methodPrice) methodPrice.textContent = "—";
    if (methodNote) methodNote.textContent = message;
    if (totalEl) totalEl.textContent = money(cartSubtotalValue());
  }

  async function refreshShipping() {
    const current = ++requestNumber;
    shippingQuote = null;

    const customer = getCustomer();

    if (!customer.country) {
      resetShipping("Select your country.");
      return null;
    }

    if (
      customer.country === "DO" &&
      !customer.city &&
      !customer.state
    ) {
      resetShipping("Enter your city or province.");
      return null;
    }

    const response = await fetch(API_BASE + "/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: customer.country,
        city: customer.city,
        state: customer.state
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Shipping unavailable.");
    }

    if (current !== requestNumber) return null;

    shippingQuote = result;

    if (shippingEl) shippingEl.textContent = result.displayPrice;
    if (methodLabel) methodLabel.textContent = result.method;
    if (methodPrice) methodPrice.textContent = result.displayPrice;
    if (methodNote) methodNote.textContent = result.note || "";

    if (totalEl) {
      totalEl.textContent = money(
        cartSubtotalValue() + Number(result.shippingUSD)
      );
    }

    return result;
  }

  function scheduleShipping() {
    ++requestNumber;
    resetShipping("Calculating shipping...");
    clearTimeout(shippingTimer);

    shippingTimer = setTimeout(() => {
      refreshShipping().catch((error) => {
        console.error("Shipping error:", error);
        resetShipping("Shipping could not be calculated.");
      });
    }, 350);
  }

  [country, city, state].forEach((field) => {
    field?.addEventListener("change", scheduleShipping);
    field?.addEventListener("input", scheduleShipping);
  });

  window.showSetApartPayPalButtons = function () {
    if (!paypalBox) {
      return Promise.reject(new Error("PayPal container missing."));
    }

    paypalBox.style.display = "block";

    if (paypalReady) return Promise.resolve();
    if (paypalPromise) return paypalPromise;

    if (!window.paypal?.Buttons) {
      return Promise.reject(new Error("PayPal SDK did not load."));
    }

    const buttons = window.paypal.Buttons({
      createOrder: async () => {
        if (!form.checkValidity()) {
          form.reportValidity();
          throw new Error("Complete checkout fields.");
        }

        if (!paymentItems().length) {
          throw new Error("Your bag is empty.");
        }

        const quote = await refreshShipping();
        if (!quote) {
          throw new Error("Shipping information is incomplete.");
        }

        const response = await fetch(API_BASE + "/api/paypal/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: getCustomer(),
            items: paymentItems()
          })
        });

        const result = await response.json();

        if (!response.ok || !result.id) {
          throw new Error(result.error || "Order creation failed.");
        }

        return result.id;
      },

      onApprove: async (data) => {
        const response = await fetch(
          API_BASE +
            "/api/paypal/orders/" +
            encodeURIComponent(data.orderID) +
            "/capture",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer: getCustomer(),
              items: paymentItems()
            })
          }
        );

        const result = await response.json();

        if (!response.ok || result.status !== "COMPLETED") {
          alert("Payment could not be confirmed. Please contact support if charged.");
          return;
        }

        localStorage.removeItem(CART_KEY);
        sessionStorage.removeItem("setApartCheckoutCustomer");

        sessionStorage.setItem(
          "setApartLastOrder",
          JSON.stringify({
            orderID: result.orderID || data.orderID,
            total: result.total,
            currency: result.currency || "USD"
          })
        );

        location.href = "order-success.html";
      },

      onCancel: () => {
        console.log("PayPal payment cancelled.");
      },

      onError: (error) => {
        console.error("PayPal error:", error);
        alert("PayPal encountered an error. Please try again.");
      }
    });

    paypalPromise = buttons.render("#paypal-button-container")
      .then(() => {
        paypalReady = true;
        paypalPromise = null;
      })
      .catch((error) => {
        paypalPromise = null;
        paypalBox.replaceChildren();
        throw error;
      });

    return paypalPromise;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!getCart().length) return;

    if (submit) {
      submit.disabled = true;
      submit.textContent = "CALCULATING SHIPPING...";
    }

    try {
      const quote = await refreshShipping();

      if (!quote) {
        throw new Error("Shipping information is incomplete.");
      }

      sessionStorage.setItem(
        "setApartCheckoutCustomer",
        JSON.stringify(getCustomer())
      );

      if (submit) submit.textContent = "LOADING SECURE PAYMENT...";

      await window.showSetApartPayPalButtons();

      if (submit) submit.style.display = "none";

      paypalBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } catch (error) {
      console.error("Checkout error:", error);

      if (submit) {
        submit.disabled = false;
        submit.textContent = "PLACE ORDER";
      }

      alert(error.message || "Checkout could not be prepared.");
    }
  });

  renderCheckout();

  // Payment guidance for Google App's in-app browser.
  if (/GSA\//i.test(navigator.userAgent || "")) {
    const notice = makeElement("div", "payment-browser-notice");
    notice.appendChild(
      makeElement("strong", "", "SECURE PAYMENT")
    );
    notice.appendChild(
      makeElement(
        "p",
        "",
        "For the best PayPal experience, open this page in Chrome or Safari."
      )
    );
    form.prepend(notice);
  }
}

/* =========================================================
   CONTACT FORM
========================================================= */

function initContact() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const feedback = document.getElementById("contactFormMessage");
  const button = form.querySelector('[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const original = button?.innerHTML || "SEND MESSAGE";

    if (button) {
      button.disabled = true;
      button.textContent = "SENDING...";
    }

    if (feedback) feedback.textContent = "";

    try {
      const data = Object.fromEntries(new FormData(form).entries());

      const response = await fetch(API_BASE + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Message could not be sent.");
      }

      if (feedback) {
        feedback.textContent = "MESSAGE SENT SUCCESSFULLY ✓";
      }

      if (button) button.textContent = "MESSAGE SENT ✓";

      form.reset();

      setTimeout(() => {
        if (button) {
          button.disabled = false;
          button.innerHTML = original;
        }
      }, 3000);

    } catch (error) {
      console.error("Contact error:", error);

      if (feedback) {
        feedback.textContent =
          "MESSAGE COULD NOT BE SENT. PLEASE TRY AGAIN.";
      }

      if (button) {
        button.disabled = false;
        button.innerHTML = original;
      }
    }
  });
}

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  initHome();
  initCartPage();
  initCheckout();
  initContact();

  window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY) updateCartCount();
  });
});
