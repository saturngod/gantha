// Font size management
const fontSizes = [
  { name: "Small", size: "0.8rem" },
  { name: "Normal", size: "1rem" },
  { name: "Big", size: "1.5rem" },
  { name: "Extra Big", size: "2rem" },
];

let currentFontSize = localStorage.getItem("fontSize") || "1rem";

// Apply saved font size on page load
function applyFontSize(size) {
  // Apply font size to reading area
  const readingArea = document.querySelector(".reading-area");
  if (readingArea) {
    readingArea.style.fontSize = size;
  }

  currentFontSize = size;
  localStorage.setItem("fontSize", size);

  // Update radio button states
  const radios = document.querySelectorAll('input[name="fontSize"]');
  radios.forEach((radio) => {
    radio.checked = radio.value === size;
  });
}

// Initialize font size options
function initializeFontSizes() {
  const fontOptionsContainer = document.getElementById("fontSizeOptions");

  if (!fontOptionsContainer) {
    return;
  }

  fontOptionsContainer.innerHTML = "";

  fontSizes.forEach((font) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "setting-option";

    optionDiv.innerHTML = `
            <label class="radio-label">
                <input type="radio" name="fontSize" value="${font.size}"
                       ${font.size === currentFontSize ? "checked" : ""}>
                <span class="radio-custom"></span>
                <div class="label-content">
                    <div class="label-title">${font.name}</div>
                    <div class="label-description">${font.size}</div>
                </div>
            </label>
        `;

    fontOptionsContainer.appendChild(optionDiv);
  });

  // Add event listeners
  const radios = document.querySelectorAll('input[name="fontSize"]');

  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.checked) {
        applyFontSize(e.target.value);
      }
    });
  });

  // Apply current font size
  applyFontSize(currentFontSize);
}

// Initialize when DOM is ready
function initFontSize() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeFontSizes);
  } else {
    initializeFontSizes();
  }
}

// Export for potential external use
window.fontSizeManager = {
  applyFontSize,
  getCurrentFontSize: () => currentFontSize,
  getAvailableSizes: () => fontSizes,
  initializeFontSizes,
};
