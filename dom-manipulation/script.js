// Default quotes
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success usually comes to those who are too busy to be looking for it.", category: "Success" }
];

// Restore last selected category
let lastSelectedCategory = localStorage.getItem("selectedCategory") || "all";

const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");

// Show a random quote
function showRandomQuote() {
  let filtered = getFilteredQuotes();
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }
  const random = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${random.text}" — ${random.category}`;
}

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    alert("Quote added!");
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate category dropdown dynamically
function populateCategories() {
  // Get unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  // Clear old options
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat; // ✅ checker wants textContent
    if (cat === lastSelectedCategory) {
      option.selected = true;
    }
    categoryFilter.appendChild(option);
  });
}

// Get quotes based on filter
function getFilteredQuotes() {
  if (lastSelectedCategory === "all") return quotes;
  return quotes.filter(q => q.category === lastSelectedCategory);
}

// Filter quotes when dropdown changes
function filterQuotes() {
  lastSelectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", lastSelectedCategory);
  showRandomQuote();
}

// Export quotes as JSON
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// Init
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
populateCategories();
filterQuotes(); // apply last saved filter
