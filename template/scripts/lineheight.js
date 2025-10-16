// Line height management
const lineHeights = [
    { name: 'Compact', value: '1.5', description: 'Tighter spacing' },
    { name: 'Normal', value: '1.8', description: 'Default spacing' },
    { name: 'Relaxed', value: '2.2', description: 'Comfortable spacing' },
    { name: 'Spacious', value: '2.5', description: 'Maximum spacing' }
];

let currentLineHeight = localStorage.getItem('lineHeight') || '1.8';

// Apply saved line height on page load
function applyLineHeight(height) {
    // Apply line height to reading area
    const readingArea = document.querySelector('.reading-area');
    if (readingArea) {
        readingArea.style.lineHeight = height;
    }

    currentLineHeight = height;
    localStorage.setItem('lineHeight', height);

    // Update radio button states
    const radios = document.querySelectorAll('input[name="lineHeight"]');
    radios.forEach(radio => {
        radio.checked = radio.value === height;
    });
}

// Initialize line height options
function initializeLineHeights() {
    const lineHeightOptionsContainer = document.getElementById('lineHeightOptions');

    if (!lineHeightOptionsContainer) {
        return;
    }

    lineHeightOptionsContainer.innerHTML = '';

    lineHeights.forEach(lineHeight => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'setting-option';

        optionDiv.innerHTML = `
            <label class="radio-label">
                <input type="radio" name="lineHeight" value="${lineHeight.value}"
                       ${lineHeight.value === currentLineHeight ? 'checked' : ''}>
                <span class="radio-custom"></span>
                <div class="label-content">
                    <div class="label-title">${lineHeight.name}</div>
                    <div class="label-description">${lineHeight.description}</div>
                </div>
            </label>
        `;

        lineHeightOptionsContainer.appendChild(optionDiv);
    });

    // Add event listeners
    const radios = document.querySelectorAll('input[name="lineHeight"]');

    radios.forEach((radio) => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                applyLineHeight(e.target.value);
            }
        });
    });

    // Apply current line height
    applyLineHeight(currentLineHeight);
}

// Initialize when DOM is ready
function initLineHeight() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLineHeights);
    } else {
        initializeLineHeights();
    }
}

// Export for potential external use
window.lineHeightManager = {
    applyLineHeight,
    getCurrentLineHeight: () => currentLineHeight,
    getAvailableLineHeights: () => lineHeights,
    initializeLineHeights
};
