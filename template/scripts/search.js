// Search functionality using elasticlunr
let searchIndex = null;
let searchDocs = null;
let isSearchLoaded = false;
let isSearchLoading = false;

// Myanmar syllable breaking patterns
const myConsonant = "\u1000-\u1021"; // "က-အ"
const enChar = "a-zA-Z0-9";
const otherChar = "\u1023\u1024\u1025\u1026\u1027\u1029\u102a\u103f\u104c\u104d\u104f\u1040-\u1049\u104a\u104b!-/:-@\\[-`\\{-~\\s";
const ssSymbol = "\u1039";
const aThat = "\u103a";

// Myanmar syllable break pattern
const BREAK_PATTERN = new RegExp("((?!" + ssSymbol + ")[" + myConsonant + "](?![" + aThat + ssSymbol + "])" + "|[" + enChar + otherChar + "])", "mg");

// Segment Myanmar text into syllables
function segmentMyanmar(text) {
    const outArray = text.replace(BREAK_PATTERN, "𝕊$1").split('𝕊');
    if (outArray.length > 0) {
        outArray.shift();
    }
    return outArray;
}

// Custom tokenizer that handles both Myanmar and English
function myanmarTokenizer(str) {
    if (!str) return [];
    
    const text = str.toString().toLowerCase().trim();
    if (!text) return [];
    
    // Segment the text using Myanmar syllable breaking
    const segments = segmentMyanmar(text);
    
    // Filter out empty segments and whitespace-only segments
    return segments
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const searchSidebar = document.getElementById('searchSidebar');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchLoading = document.getElementById('searchLoading');

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load search index on demand
async function loadSearchIndex() {
    if (isSearchLoaded || isSearchLoading) return;
    
    isSearchLoading = true;
    searchLoading.style.display = 'block';
    searchResults.innerHTML = '';
    
    try {
        // Load both files in parallel
        const [indexResponse, docsResponse] = await Promise.all([
            fetch('search-index.json'),
            fetch('search-docs.json')
        ]);
        
        if (!indexResponse.ok || !docsResponse.ok) {
            throw new Error('Failed to load search index');
        }
        
        const indexData = await indexResponse.json();
        searchDocs = await docsResponse.json();
        
        // Register Myanmar tokenizer so search queries are tokenized into syllables
        elasticlunr.tokenizer = myanmarTokenizer;
        
        // Load the pre-built index (built at build time with Myanmar tokenizer)
        searchIndex = elasticlunr.Index.load(indexData);
        
        isSearchLoaded = true;
        
    } catch (error) {
        console.error('Failed to load search index:', error);
        searchResults.innerHTML = '<div class="search-error">Failed to load search index</div>';
    } finally {
        isSearchLoading = false;
        searchLoading.style.display = 'none';
    }
}

// Perform search
function performSearch(query) {
    if (!searchIndex || !query.trim()) {
        searchResults.innerHTML = '';
        return;
    }
    
    const results = searchIndex.search(query, {
        fields: {
            title: { boost: 2 },
            body: { boost: 1 }
        },
        expand: true
    });
    
    renderResults(results, query);
}

// Render search results
function renderResults(results, query) {
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">No results found</div>';
        return;
    }
    
    const html = results.slice(0, 20).map(result => {
        const doc = searchDocs[result.ref];
        if (!doc) return '';
        
        // Create snippet with highlighted terms
        const snippet = createSnippet(doc.body, query);
        
        return `
            <a href="${doc.file}" class="search-result-item">
                <div class="search-result-title">${highlightTerms(doc.title, query)}</div>
                <div class="search-result-snippet">${snippet}</div>
            </a>
        `;
    }).join('');
    
    searchResults.innerHTML = html;
}

// Create a snippet from body text
function createSnippet(body, query) {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const lowerBody = body.toLowerCase();
    
    // Find the first occurrence of any term
    let startIndex = 0;
    for (const term of terms) {
        const index = lowerBody.indexOf(term);
        if (index !== -1) {
            startIndex = Math.max(0, index - 50);
            break;
        }
    }
    
    // Extract snippet around the match
    let snippet = body.substring(startIndex, startIndex + 150);
    
    // Clean up the snippet
    if (startIndex > 0) snippet = '...' + snippet;
    if (startIndex + 150 < body.length) snippet = snippet + '...';
    
    return highlightTerms(snippet, query);
}

// Highlight search terms in text
function highlightTerms(text, query) {
    const terms = query.split(/\s+/).filter(t => t.length > 1);
    let result = text;
    
    terms.forEach(term => {
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
    });
    
    return result;
}

// Escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Open search sidebar
function openSearch() {
    searchSidebar.classList.add('active');
    backdrop.classList.add('active');
    searchInput.focus();
    loadSearchIndex();
}

// Close search sidebar
function closeSearch() {
    searchSidebar.classList.remove('active');
    backdrop.classList.remove('active');
}

// Attach event listeners
if (searchBtn) {
    searchBtn.addEventListener('click', openSearch);
}

if (closeSearchBtn) {
    closeSearchBtn.addEventListener('click', closeSearch);
}

if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
        performSearch(e.target.value);
    }, 300));
    
    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const firstResult = searchResults.querySelector('.search-result-item');
            if (firstResult) {
                firstResult.click();
            }
        }
    });
}

// Keyboard shortcut: Ctrl/Cmd + K to open search
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
    }
});

// Export for use in other scripts
window.searchManager = {
    openSearch,
    closeSearch
};
