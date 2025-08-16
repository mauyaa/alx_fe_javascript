// ======================
// INITIAL DATA & STORAGE
// ======================
let quotes = [
  { text: "The journey of a thousand miles begins with one step.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" }
];

// Load quotes from local storage
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) quotes = JSON.parse(storedQuotes);
}
loadQuotes();

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
}

// ======================
// DOM MANIPULATION
// ======================
function showRandomQuote(filteredQuotes = quotes) {
  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerText = "No quotes to display.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  document.getElementById("quoteDisplay").innerText = `"${quote.text}" - ${quote.category}`;
}

document.getElementById("newQuote").addEventListener("click", () => {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const filtered = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
  showRandomQuote(filtered);
});

// ======================
// ADD NEW QUOTE
// ======================
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Both fields are required!");

  quotes.push({ text, category });
  saveQuotes();
  filterQuotes(); // Show filtered result if applicable

  document.getElementById("newQuoteText").value = '';
  document.getElementById("newQuoteCategory").value = '';
}

// ======================
// CATEGORY FILTER
// ======================
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map(q => q.category))];
  select.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.innerText = cat;
    select.appendChild(option);
  });
}

function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastCategory", selected);
  const filtered = selected === "all" ? quotes : quotes.filter(q => q.category === selected);
  showRandomQuote(filtered);
}

// Restore last selected category
document.addEventListener("DOMContentLoaded", () => {
  const last = localStorage.getItem("lastCategory") || "all";
  document.getElementById("categoryFilter").value = last;
  populateCategories();
  filterQuotes();
});

// ======================
// JSON IMPORT / EXPORT
// ======================
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      alert('Quotes imported successfully!');
      filterQuotes();
    } catch (err) {
      alert('Invalid JSON file!');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ======================
// SIMULATED SERVER SYNC
// ======================
async function syncWithServer() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const serverData = await res.json();
    // Map server data to our format
    const serverQuotes = serverData.map(q => ({ text: q.title, category: "Server" }));
    // Merge server quotes, avoid duplicates
    serverQuotes.forEach(sq => {
      if (!quotes.some(q => q.text === sq.text && q.category === sq.category)) quotes.push(sq);
    });
    saveQuotes();
    console.log("Synced with server!");
  } catch (err) {
    console.error("Server sync failed:", err);
  }
}

// Sync every 1 minute
setInterval(syncWithServer, 60000);
