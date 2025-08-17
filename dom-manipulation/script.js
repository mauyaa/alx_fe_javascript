// Initialize quotes array
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
    { text: "Stay hungry, stay foolish.", category: "Motivation" }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const notification = document.getElementById('notification');
const syncButton = document.getElementById('syncButton');
const syncStatus = document.getElementById('syncStatus');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadQuotesFromStorage();
    showRandomQuote();
    populateCategories();
    setupEventListeners();
    
    // Set up periodic sync (every 60 seconds)
    setInterval(syncWithServer, 60000);
});

// Event Listeners
function setupEventListeners() {
    newQuoteBtn.addEventListener('click', showRandomQuote);
    categoryFilter.addEventListener('change', filterQuotes);
    syncButton.addEventListener('click', syncWithServer);
}

// Web Storage Functions
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    sessionStorage.setItem('lastQuote', JSON.stringify(quotes[0]));
}

function loadQuotesFromStorage() {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
    }
    
    const lastFilter = localStorage.getItem('lastFilter');
    if (lastFilter) {
        categoryFilter.value = lastFilter;
    }
}

// Quote Functions
function showRandomQuote() {
    const filteredQuotes = getFilteredQuotes();
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = "No quotes available in this category.";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    quoteDisplay.innerHTML = `
        <blockquote>${quote.text}</blockquote>
        <p><em>— ${quote.category}</em></p>
    `;
    
    // Save last viewed quote in session storage
    sessionStorage.setItem('lastQuote', JSON.stringify(quote));
}

function getFilteredQuotes() {
    const selectedCategory = categoryFilter.value;
    return selectedCategory === 'all' 
        ? quotes 
        : quotes.filter(quote => quote.category === selectedCategory);
}

// Category Functions
function populateCategories() {
    // Clear existing options
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Get unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Add to dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function filterQuotes() {
    localStorage.setItem('lastFilter', categoryFilter.value);
    showRandomQuote();
}

// Quote Addition
function addQuote() {
    const textInput = document.getElementById('newQuoteText');
    const categoryInput = document.getElementById('newQuoteCategory');
    
    const text = textInput.value.trim();
    const category = categoryInput.value.trim();
    
    if (!text || !category) {
        showNotification('Please enter both quote text and category', 'error');
        return;
    }
    
    const newQuote = { text, category };
    quotes.push(newQuote);
    
    saveQuotes();
    populateCategories();
    showRandomQuote();
    showNotification('Quote added successfully!', 'success');
    
    // Clear inputs
    textInput.value = '';
    categoryInput.value = '';
}

// JSON Import/Export
function exportToJson() {
    const dataStr = JSON.stringify(quotes);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = 'quotes.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    showNotification('Quotes exported successfully!', 'success');
}

function importFromJson() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a JSON file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedQuotes) {
                throw new Error('Invalid JSON format');
            }
            
            quotes = importedQuotes;
            saveQuotes();
            populateCategories();
            showRandomQuote();
            showNotification('Quotes imported successfully!', 'success');
        } catch (error) {
            showNotification('Error parsing JSON file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Server Sync Functions
async function syncWithServer() {
    try {
        syncStatus.textContent = 'Syncing with server...';
        
        // Simulate server request
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
        const serverData = await response.json();
        
        // In a real app, we would compare server and local data
        // For simulation purposes, we'll just update with placeholder
        const serverQuotes = serverData 
            ? [{ text: "Simulated server quote", category: "Server" }] 
            : [];
        
        // Conflict resolution strategy: server data takes precedence
        const mergedQuotes = [...quotes];
        serverQuotes.forEach(serverQuote => {
            const exists = mergedQuotes.some(q => 
                q.text === serverQuote.text && q.category === serverQuote.category
            );
            if (!exists) {
                mergedQuotes.push(serverQuote);
            }
        });
        
        quotes = mergedQuotes;
        saveQuotes();
        populateCategories();
        
        syncStatus.textContent = `Sync successful at ${new Date().toLocaleTimeString()}`;
        showNotification('Data synced with server', 'success');
    } catch (error) {
        syncStatus.textContent = 'Sync failed';
        showNotification('Sync error: ' + error.message, 'error');
    }
}

// UI Helpers
function showNotification(message, type) {
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.borderLeftColor = type === 'error' ? '#e74c3c' : '#2ecc71';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
