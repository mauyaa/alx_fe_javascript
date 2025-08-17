// Initialize quotes array
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
    { text: "Stay hungry, stay foolish.", category: "Motivation" }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const notification = document.getElementById('notification');
const syncStatus = document.getElementById('syncStatus');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadQuotesFromStorage();
    showRandomQuote();
    populateCategories();
    createAddQuoteForm();
    setupEventListeners();
    setInterval(syncQuotes, 60000);
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    categoryFilter.addEventListener('change', filterQuotes);
    document.getElementById('syncButton').addEventListener('click', syncQuotes);
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
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
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

// Quote Addition Form
function createAddQuoteForm() {
    const formContainer = document.createElement('div');
    formContainer.innerHTML = `
        <h2>Add New Quote</h2>
        <div class="form-group">
            <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
        </div>
        <div class="form-group">
            <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
        </div>
        <button id="addQuoteBtn">Add Quote</button>
    `;
    document.body.insertBefore(formContainer, document.querySelector('h2:nth-of-type(1)'));
    
    document.getElementById('addQuoteBtn').addEventListener('click', addQuote);
}

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
    
    textInput.value = '';
    categoryInput.value = '';
}

// JSON Import/Export
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Quotes exported successfully!', 'success');
    }, 0);
}

function importFromJsonFile(event) {
    const file = event.target.files[0];
    
    if (!file) {
        showNotification('Please select a JSON file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedQuotes)) {
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

// ... (previous code remains the same until server sync functions)

// Server Sync Functions
async function fetchQuotesFromServer() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        const data = await response.json();
        
        return data.slice(0, 5).map(post => ({
            text: post.title,
            category: 'Server'
        }));
    } catch (error) {
        console.error('Error fetching quotes from server:', error);
        return [];
    }
}

async function postQuotesToServer() {
    try {
        // Prepare data to send
        const quotesToSend = quotes.map(quote => ({
            title: quote.text,
            body: quote.category,
            userId: 1  // Required by JSONPlaceholder
        }));

        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quotesToSend)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error posting quotes to server:', error);
        return null;
    }
}

async function syncQuotes() {
    try {
        syncStatus.textContent = 'Syncing with server...';
        let conflictResolved = false;
        
        // Step 1: Fetch quotes from server
        const serverQuotes = await fetchQuotesFromServer();
        
        // Step 2: Send our quotes to server
        const postResult = await postQuotesToServer();
        
        // Conflict resolution: server data takes precedence
        const mergedQuotes = [...quotes];
        
        serverQuotes.forEach(serverQuote => {
            const existingIndex = mergedQuotes.findIndex(q => 
                q.text === serverQuote.text && q.category === serverQuote.category
            );
            
            if (existingIndex === -1) {
                // New quote from server - add it
                mergedQuotes.push(serverQuote);
            } else {
                // Potential conflict - server data takes precedence
                if (JSON.stringify(mergedQuotes[existingIndex]) !== JSON.stringify(serverQuote)) {
                    conflictResolved = true;
                    mergedQuotes[existingIndex] = serverQuote;
                }
            }
        });
        
        // Update local quotes
        quotes = mergedQuotes;
        saveQuotes();
        populateCategories();
        
        // Update UI with sync results
        syncStatus.textContent = `Sync successful at ${new Date().toLocaleTimeString()}`;
        
        if (conflictResolved) {
            showNotification('Data synced. Conflicts resolved (server data used).', 'warning');
        } else {
            showNotification('Data synced successfully! ' + 
                             serverQuotes.length + ' quotes processed.', 'success');
        }
        
        // Show notification about server post
        if (postResult) {
            showNotification('Quotes sent to server successfully!', 'success');
        }
        
    } catch (error) {
        syncStatus.textContent = 'Sync failed';
        showNotification('Sync error: ' + error.message, 'error');
    }
}

// ... (rest of the code remains the same)
