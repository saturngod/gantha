// State Management
let currentTheme = 'system';
let currentFont = 'system';
let currentAlignment = 'justify';

// DOM Elements
const menuBtn = document.getElementById('menuBtn');
const settingsBtn = document.getElementById('settingsBtn');
const tocSidebar = document.getElementById('tocSidebar');
const settingsSidebar = document.getElementById('settingsSidebar');
const closeTocBtn = document.getElementById('closeTocBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const backdrop = document.getElementById('backdrop');
const tocContent = document.getElementById('tocContent');
const fontOptions = document.getElementById('fontOptions');

// Theme Radio Buttons
const themeSystem = document.getElementById('themeSystem');
const themeLight = document.getElementById('themeLight');
const themeDark = document.getElementById('themeDark');

// Alignment Radio Buttons
const alignJustify = document.getElementById('alignJustify');
const alignStart = document.getElementById('alignStart');
const alignCenter = document.getElementById('alignCenter');
const alignEnd = document.getElementById('alignEnd');

// Initialize App
function init() {
    generateFontOptions();
    loadPreferences();
    applyTheme(currentTheme);
    applyFont(currentFont);
    applyAlignment(currentAlignment);

    // Initialize font size options if available
    if (window.fontSizeManager && window.fontSizeManager.initializeFontSizes) {
        window.fontSizeManager.initializeFontSizes();
    }

    // Initialize line height options if available
    if (window.lineHeightManager && window.lineHeightManager.initializeLineHeights) {
        window.lineHeightManager.initializeLineHeights();
    }

    generateTOC();
    attachEventListeners();
}

// Generate Font Options dynamically from fonts.js
function generateFontOptions() {
    fontOptions.innerHTML = '';

    fonts.forEach(font => {
        const settingOption = document.createElement('div');
        settingOption.className = 'setting-option';

        const label = document.createElement('label');
        label.className = 'radio-label';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'font';
        input.value = font.id;
        input.id = `font${font.id.charAt(0).toUpperCase() + font.id.slice(1)}`;

        const radioCustom = document.createElement('span');
        radioCustom.className = 'radio-custom';

        const labelContent = document.createElement('div');
        labelContent.className = 'label-content';

        const labelTitle = document.createElement('div');
        labelTitle.className = 'label-title';
        labelTitle.textContent = font.name;
        labelTitle.className = font.className || '';

        const labelDescription = document.createElement('div');
        labelDescription.className = 'label-description';
        const fontClass = font.className || '';
        labelDescription.innerHTML = `<span class="${fontClass}">${font.sample}</span>`;

        labelContent.appendChild(labelTitle);
        labelContent.appendChild(labelDescription);

        label.appendChild(input);
        label.appendChild(radioCustom);
        label.appendChild(labelContent);

        settingOption.appendChild(label);
        fontOptions.appendChild(settingOption);

        // Add event listener for this font option
        input.addEventListener('change', () => applyFont(font.id));
    });
}

// Load Preferences from localStorage
function loadPreferences() {
    const savedTheme = localStorage.getItem('theme');
    const savedFont = localStorage.getItem('font');
    const savedAlignment = localStorage.getItem('alignment');

    if (savedTheme) {
        currentTheme = savedTheme;
    }

    if (savedFont) {
        currentFont = savedFont;
    }

    if (savedAlignment) {
        currentAlignment = savedAlignment;
    }
}

// Apply Theme
function applyTheme(theme) {
    currentTheme = theme;

    // Update radio button
    if (theme === 'system') {
        themeSystem.checked = true;
        applySystemTheme();
    } else if (theme === 'light') {
        themeLight.checked = true;
        document.body.classList.remove('theme-dark');
    } else if (theme === 'dark') {
        themeDark.checked = true;
        document.body.classList.add('theme-dark');
    }

    localStorage.setItem('theme', theme);
}

// Apply System Theme based on user's OS preference
function applySystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
        document.body.classList.add('theme-dark');
    } else {
        document.body.classList.remove('theme-dark');
    }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (currentTheme === 'system') {
        applySystemTheme();
    }
});

// Apply Font
function applyFont(fontId) {
    currentFont = fontId;

    // Get the reading area element
    const readingArea = document.querySelector('.reading-area');
    
    if (!readingArea) {
        console.warn('Reading area not found');
        return;
    }

    // Remove all font classes from reading area
    fonts.forEach(font => {
        if (font.className) {
            readingArea.classList.remove(font.className);
        }
    });

    // Find the selected font
    const selectedFont = fonts.find(font => font.id === fontId);

    if (selectedFont) {
        // Update radio button
        const fontInput = document.getElementById(`font${fontId.charAt(0).toUpperCase() + fontId.slice(1)}`);
        if (fontInput) {
            fontInput.checked = true;
        }

        // Apply font class to reading area if it exists
        if (selectedFont.className) {
            readingArea.classList.add(selectedFont.className);
        }
    }

    localStorage.setItem('font', fontId);
}

// Apply Text Alignment
function applyAlignment(alignment) {
    currentAlignment = alignment;

    // Get the reading area element
    const readingArea = document.querySelector('.reading-area');
    
    if (!readingArea) {
        console.warn('Reading area not found');
        return;
    }

    // Remove all alignment classes
    readingArea.classList.remove('align-justify', 'align-start', 'align-center', 'align-end');

    // Apply the selected alignment class
    readingArea.classList.add(`align-${alignment}`);

    // Update radio button
    if (alignment === 'justify' && alignJustify) {
        alignJustify.checked = true;
    } else if (alignment === 'start' && alignStart) {
        alignStart.checked = true;
    } else if (alignment === 'center' && alignCenter) {
        alignCenter.checked = true;
    } else if (alignment === 'end' && alignEnd) {
        alignEnd.checked = true;
    }

    localStorage.setItem('alignment', alignment);
}

// Generate Table of Contents
function generateTOC() {
    tocContent.innerHTML = '';

    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    bookData.chapters.forEach((chapter) => {
        const tocItem = document.createElement('a');
        tocItem.className = 'toc-item';
        tocItem.href = chapter.file;

        // Highlight current chapter
        if (chapter.file === currentPage) {
            tocItem.classList.add('active');
        }

        const titleDiv = document.createElement('div');
        titleDiv.className = 'toc-item-title';
        titleDiv.textContent = chapter.title;

        tocItem.appendChild(titleDiv);

        if (chapter.subtitle) {
            const subtitleDiv = document.createElement('div');
            subtitleDiv.className = 'toc-item-subtitle';
            subtitleDiv.textContent = chapter.subtitle;
            tocItem.appendChild(subtitleDiv);
        }

        tocItem.addEventListener('click', () => {
            closeTOC();
        });

        tocContent.appendChild(tocItem);
    });
}

// Open/Close TOC
function openTOC() {
    tocSidebar.classList.add('active');
    backdrop.classList.add('active');
}

function closeTOC() {
    tocSidebar.classList.remove('active');
    backdrop.classList.remove('active');
}

// Open/Close Settings
function openSettings() {
    settingsSidebar.classList.add('active');
    backdrop.classList.add('active');
}

function closeSettings() {
    settingsSidebar.classList.remove('active');
    backdrop.classList.remove('active');
}

// Attach Event Listeners
function attachEventListeners() {
    // Menu and Settings buttons
    menuBtn.addEventListener('click', openTOC);
    settingsBtn.addEventListener('click', openSettings);

    // Close buttons
    closeTocBtn.addEventListener('click', closeTOC);
    closeSettingsBtn.addEventListener('click', closeSettings);

    // Backdrop
    backdrop.addEventListener('click', () => {
        closeTOC();
        closeSettings();
        if (window.searchManager) window.searchManager.closeSearch();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTOC();
            closeSettings();
            if (window.searchManager) window.searchManager.closeSearch();
        }
    });

    // Theme radio buttons
    themeSystem.addEventListener('change', () => applyTheme('system'));
    themeLight.addEventListener('change', () => applyTheme('light'));
    themeDark.addEventListener('change', () => applyTheme('dark'));

    // Alignment radio buttons
    if (alignJustify) alignJustify.addEventListener('change', () => applyAlignment('justify'));
    if (alignStart) alignStart.addEventListener('change', () => applyAlignment('start'));
    if (alignCenter) alignCenter.addEventListener('change', () => applyAlignment('center'));
    if (alignEnd) alignEnd.addEventListener('change', () => applyAlignment('end'));

    // Font radio buttons are now attached dynamically in generateFontOptions()
}

// Auto-hide header and navigation buttons on scroll
let lastScrollTop = 0;
let scrollTimeout;
const header = document.querySelector('.header');
const navButtons = document.querySelectorAll('.nav-btn');
const scrollThreshold = 5; // Minimum scroll amount to trigger hide/show

function handleScroll() {
    // Clear any existing timeout
    clearTimeout(scrollTimeout);
    
    // Debounce the scroll event
    scrollTimeout = setTimeout(() => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Don't hide header/buttons if we're at the top of the page
        if (currentScroll <= 10) {
            header.classList.remove('header-hidden');
            navButtons.forEach(btn => btn.classList.remove('nav-hidden'));
            lastScrollTop = currentScroll;
            return;
        }
        
        // Check scroll direction
        if (Math.abs(currentScroll - lastScrollTop) < scrollThreshold) {
            return; // Not enough movement
        }
        
        if (currentScroll > lastScrollTop) {
            // Scrolling down - hide header and nav buttons
            header.classList.add('header-hidden');
            navButtons.forEach(btn => btn.classList.add('nav-hidden'));
        } else {
            // Scrolling up - show header and nav buttons
            header.classList.remove('header-hidden');
            navButtons.forEach(btn => btn.classList.remove('nav-hidden'));
        }
        
        lastScrollTop = currentScroll;
    }, 10);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Attach scroll listener for auto-hide header
window.addEventListener('scroll', handleScroll, { passive: true });
