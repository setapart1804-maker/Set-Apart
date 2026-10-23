
function animateStage(direction = 1) {
  const selected = slides[activeIndex];

  slides.forEach((item) =>
    item.classList.remove(
      "sa-slide-next",
      "sa-slide-prev",
      "sa-slide-enter"
    )
  );

  if (!selected || motionReduced.matches) return;

  void selected.offsetWidth;

  selected.classList.add(
    direction === 0
      ? "sa-slide-enter"
      : direction < 0
        ? "sa-slide-prev"
        : "sa-slide-next"
  );
}

function openStage(id = "pilgrim", color = null) {
  if (
    clothesTransitioning ||
    stage.classList.contains("is-active")
  ) return;

  let index = slides.findIndex((slide) =>
    slide.dataset.product === id &&
    (!color || slide.dataset.color === color)
  );

  if (index < 0) index = 0;

  activeIndex = index;
  activeSide = "front";
  clothesTransitioning = true;

  const garments = Array.from(
    rack.querySelectorAll("[data-reference-product]")
  );

  const selectedButton = garments.find((button) =>
    button.dataset.referenceProduct === id &&
    (!color || button.dataset.referenceColor === color)
  );

  garments.forEach((button) => {
    button.classList.toggle(
      "sa-selected",
      button === selectedButton
    );
  });

  const rail = document.getElementById("saClothesRail");

  if (rail && selectedButton) {
    const target =
      selectedButton.offsetLeft +
      selectedButton.offsetWidth / 2 -
      rail.clientWidth / 2;

    rail.scrollTo({
      left: Math.max(0, target),
      behavior: motionReduced.matches ? "instant" : "smooth"
    });
  }

  setTimeout(() => {
    rack.classList.add("sa-leaving");

    setTimeout(() => {
      rack.style.display = "none";
      rack.classList.remove("is-active");

      stage.classList.add("is-active");
      stage.setAttribute("aria-hidden", "false");

      renderStage();
      animateStage(0);

      clothesTransitioning = false;
    }, motionReduced.matches ? 0 : 550);

  }, motionReduced.matches ? 0 : 500);
}

function changeSlide(direction) {
  if (!stage.classList.contains("is-active")) return;

  activeIndex =
    (activeIndex + direction + slides.length) %
    slides.length;

  activeSide = "front";

  renderStage();
  animateStage(direction);
}
