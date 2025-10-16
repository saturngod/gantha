# Fonts and Styling

Gantha provides flexible font and styling options to ensure your book looks great, especially for Myanmar content. This guide covers how to customize fonts, adjust typography, and modify the visual appearance of your book.

## Font Configuration

### Font List Configuration

The available fonts are defined in `template/scripts/fonts.js`. This file contains an array of font objects that appear in the font selector.

**Current structure in `template/scripts/fonts.js`**:
```javascript
var fonts = [
    {
        id: 'system',
        name: 'System Font',
        className: '',
        sample: 'နမူနာ Sample ABC 123'
    },
    {
        id: 'sanpya',
        name: 'Myanmar Sanpya',
        className: 'font-sanpya',
        sample: 'နမူနာ Sample ABC 123'
    },
    {
        id: 'stadium',
        name: 'Masterpiece Stadium',
        className: 'font-masterpiece-stadium',
        sample: 'နမူနာ Sample ABC 123'
    },
    {
        id: 'unitype',
        name: 'Masterpiece UniType',
        className: 'font-masterpiece-unitype',
        sample: 'နမူနာ Sample ABC 123'
    },
    {
        id: 'sanpro',
        name: 'Myanmar San Pro',
        className: 'font-sanpro',
        sample: 'နမူနာ Sample ABC 123'
    }
];
```

**Font object properties**:
- `id`: Unique identifier for the font
- `name`: Display name shown in the font selector
- `className`: CSS class applied when this font is selected
- `sample`: Preview text showing how the font looks (includes Myanmar text)

**Adding new fonts**:
1. Add a new font object to the array in `fonts.js`
2. Create corresponding CSS class in `styles/fonts.css`
3. Rebuild your project to see the changes

**Example of adding a new font**:
```javascript
{
    id: 'noto-myanmar',
    name: 'Noto Sans Myanmar',
    className: 'font-noto-myanmar',
    sample: 'နမူနာ Sample ABC 123'
}
```

### Font Size Adjustment

Font size controls are handled in `template/scripts/fontsize.js`. This script provides dynamic font size adjustment for better readability.

**Default font size settings**:
```javascript
// Font size ranges and defaults
const minFontSize = 12;
const maxFontSize = 24;
const defaultFontSize = 16;
```

**Customizing font size behavior**:
- Modify the min/max ranges for font size controls
- Change the default font size
- Adjust the increment steps for font size changes

### Line Height Configuration

Line height settings are managed in `template/scripts/lineheight.js`. Proper line height is crucial for readability, especially for Myanmar text.

**Line height settings**:
```javascript
// Line height options
const lineHeights = [1.2, 1.4, 1.6, 1.8, 2.0];
const defaultLineHeight = 1.6;
```

## CSS Font Configuration

### Main Font Styles

Font definitions are located in `template/styles/fonts.css`. This file contains the CSS rules for all typography.

**Basic font structure**:
```css
/* Myanmar font classes corresponding to fonts.js */
.font-sanpya {
    font-family: 'Myanmar Sanpya', 'Myanmar Text', sans-serif;
}

.font-masterpiece-stadium {
    font-family: 'Masterpiece Stadium', 'Myanmar Text', sans-serif;
}

.font-masterpiece-unitype {
    font-family: 'Masterpiece UniType', 'Myanmar Text', sans-serif;
}

.font-sanpro {
    font-family: 'Myanmar San Pro', 'Myanmar Text', sans-serif;
}

/* Base typography */
body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    line-height: 1.6;
}
```

### Myanmar Font Support

For optimal Myanmar language support, include appropriate fonts:

```css
/* Myanmar fonts */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@300;400;500;600;700&display=swap');

.myanmar-text {
    font-family: 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', sans-serif;
    font-feature-settings: 'liga' 1, 'kern' 1;
}
```

### Custom Font Integration

**Adding a new font**:
1. Add the font object to `fonts.js`
2. Define CSS class for the new font in `fonts.css`
3. Include font files or imports as needed

**Example - Adding Noto Sans Myanmar**:

*Step 1: Add to `template/scripts/fonts.js`*:
```javascript
{
    id: 'noto-myanmar',
    name: 'Noto Sans Myanmar',
    className: 'font-noto-myanmar',
    sample: 'နမူနာ Sample ABC 123'
}
```

*Step 2: Add CSS class to `template/styles/fonts.css`*:
```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@300;400;500;600;700&display=swap');

.font-noto-myanmar {
    font-family: 'Noto Sans Myanmar', 'Myanmar Text', sans-serif;
    font-feature-settings: 'liga' 1, 'kern' 1;
}
```

## Typography Settings

### Headings

Customize heading styles for better hierarchy:

```css
h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.3;
    margin-top: 2em;
    margin-bottom: 0.5em;
}

h1 { font-size: 2.5em; }
h2 { font-size: 2em; }
h3 { font-size: 1.5em; }
```

### Body Text

Optimize body text for readability:

```css
p {
    margin-bottom: 1em;
    text-align: justify; /* For book-like appearance */
    hyphens: auto; /* Automatic hyphenation */
}

/* Myanmar text specific */
.myanmar p {
    text-align: left; /* Left align for Myanmar */
    word-break: keep-all;
}
```

## Responsive Typography

Ensure your fonts work well across different screen sizes:

```css
/* Mobile adjustments */
@media (max-width: 768px) {
    body {
        font-size: 14px;
        line-height: 1.5;
    }
    
    h1 { font-size: 2em; }
    h2 { font-size: 1.75em; }
}

/* Large screens */
@media (min-width: 1200px) {
    body {
        font-size: 18px;
        line-height: 1.7;
    }
}
```

## Theme Customization

### Template Modification

For advanced customization, edit the main template at `template/index.html`:

1. **Font selector interface** - Modify the font dropdown
2. **Typography controls** - Add new font size/line height options
3. **Theme switching** - Implement dark/light mode

### CSS Variables

Use CSS custom properties for easier theme management:

```css
:root {
    --font-primary: 'Inter', sans-serif;
    --font-secondary: 'Georgia', serif;
    --font-myanmar: 'Noto Sans Myanmar', sans-serif;
    
    --font-size-base: 16px;
    --line-height-base: 1.6;
    
    --color-text: #333;
    --color-background: #fff;
}
```

## Best Practices

### For Myanmar Content

1. **Use Unicode fonts** - Ensure proper Myanmar Unicode support
2. **Appropriate line spacing** - Myanmar text often needs more line height
3. **Font stacking** - Provide fallback fonts for Myanmar text
4. **Feature settings** - Enable proper ligatures and kerning

### For English Content

1. **Font pairing** - Combine serif and sans-serif thoughtfully
2. **Reading comfort** - Optimize for long-form reading
3. **Performance** - Limit the number of font weights loaded

### General Typography

1. **Hierarchy** - Use consistent heading sizes and spacing
2. **Contrast** - Ensure sufficient color contrast for accessibility
3. **Line length** - Keep text columns at readable widths (45-75 characters)
4. **Responsive design** - Scale typography appropriately for different screens

## Testing Fonts

After making changes:

1. **Rebuild** the project: `bun run build`
2. **Test rendering** - Check both English and Myanmar text
3. **Verify selectors** - Ensure font dropdown works correctly
4. **Check responsiveness** - Test on different screen sizes

## Troubleshooting

**Font not loading**:
- Check font import statements in CSS
- Verify font names match exactly
- Ensure internet connection for web fonts

**Myanmar text rendering issues**:
- Use Unicode-compliant Myanmar fonts
- Check font-feature-settings for proper rendering
- Test with different Myanmar font stacks

**Performance issues**:
- Limit font weights and styles
- Use font-display: swap for better loading
- Consider hosting fonts locally for better performance

Remember to rebuild your project after making any font or styling changes to see the updates in your generated website.