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
const conflictNotification = document.getElementById('conflictNotification');
const conflictResolution = document.getElementById('conflictResolution');
const conflictDetails = document.getElementById('conflictDetails');
const syncStatus = document.getElementById('syncStatus');

// Conflict resolution state
let conflictQueue = [];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadQuotesFromStorage();
    showRandomQuote();
    populateCategories();
    setupEventListeners();
    setInterval(syncQuotes, 60000);
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    categoryFilter.addEventListener('change', filterQuotes);
    document.getElementById('syncButton').addEventListener('click', syncQuotes);
    document.getElementById('addQuoteBtn').addEventListener('click', addQuote);
    document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importFromJsonFile);
    
    // Conflict resolution buttons
    document.getElementById('useServerBtn').addEventListener('click', () => resolveConflict('server'));
    document.getElementById('keepLocalBtn').addEventListener('click', () => resolveConflict('local'));
    document.getElementById('keepBothBtn').addEventListener('click', () => resolveConflict('both'));
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
            userId: 1
        }));

        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quotesToSend)
        });

        return await response.json();
    } catch (error) {
        console.error('Error posting quotes to server:', error);
        return null;
    }
}

async function syncQuotes() {
    try {
        syncStatus.textContent = 'Syncing with server...';
        let conflictsDetected = 0;
        
        // 1. Fetch quotes from server
        const serverQuotes = await fetchQuotesFromServer();
        
        // 2. Send our quotes to server
        const postResult = await postQuotesToServer();
        
        // 3. Merge with conflict detection
        const mergedQuotes = [...quotes];
        
        serverQuotes.forEach(serverQuote => {
            const localIndex = mergedQuotes.findIndex(q => 
                q.text === serverQuote.text
            );
            
            if (localIndex === -1) {
                // New quote from server
                mergedQuotes.push(serverQuote);
            } else {
                // Check for conflicts
                const localQuote = mergedQuotes[localIndex];
                if (localQuote.category !== serverQuote.category) {
                    conflictsDetected++;
                    conflictQueue.push({
                        local: localQuote,
                        server: serverQuote,
                        index: localIndex
                    });
                }
            }
        });
        
        // 4. Handle conflicts
        if (conflictQueue.length > 0) {
            showConflictUI(conflictQueue[0]);
        } else {
            // No conflicts, update quotes
            quotes = mergedQuotes;
            saveQuotes();
            populateCategories();
            
            syncStatus.textContent = `Sync successful at ${new Date().toLocaleTimeString()}`;
            showNotification(`Data synced! ${serverQuotes.length} quotes processed.`, 'success');
            
            if (postResult) {
                showNotification('Quotes sent to server successfully!', 'success');
            }
        }
        
    } catch (error) {
        syncStatus.textContent = 'Sync failed';
        showNotification('Sync error: ' + error.message, 'error');
    }
}

// Conflict Resolution UI
function showConflictUI(conflict) {
    conflictDetails.innerHTML = `
        <p><strong>Local Quote:</strong> "${conflict.local.text}" (${conflict.local.category})</p>
        <p><strong>Server Quote:</strong> "${conflict.server.text}" (${conflict.server.category})</p>
    `;
    
    conflictResolution.style.display = 'block';
    conflictNotification.textContent = 'Conflict detected! Please resolve.';
    conflictNotification.style.display = 'block';
}

function resolveConflict(resolutionType) {
    if (conflictQueue.length === 0) return;
    
    const conflict = conflictQueue.shift();
    const index = conflict.index;
    
    switch(resolutionType) {
        case 'server':
            // Replace local with server version
            quotes[index] = conflict.server;
            break;
        case 'local':
            // Keep local version (no change)
            break;
        case 'both':
            // Keep both (server version as new entry)
            quotes.push(conflict.server);
            break;
    }
    
    // Save changes
    saveQuotes();
    populateCategories();
    
    // Show resolution notification
    showNotification(`Conflict resolved (${resolutionType} version kept)`, 'success');
    
    // Process next conflict or finish
    if (conflictQueue.length > 0) {
        showConflictUI(conflictQueue[0]);
    } else {
        conflictResolution.style.display = 'none';
        conflictNotification.style.display = 'none';
        syncStatus.textContent = `Sync completed at ${new Date().toLocaleTimeString()}`;
        showNotification('All conflicts resolved!', 'success');
    }
}

// Notification System
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
