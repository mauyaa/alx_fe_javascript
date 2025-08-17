let quotes = [];

// ===== STORAGE HELPERS =====
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem("quotes");
  if (saved) {
    quotes = JSON.parse(saved);
  } else {
    quotes = [
      { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspiration" },
      { text: "In the middle of difficulty lies opportunity.", category: "motivation" }
    ];
  }
}

// ===== DISPLAY FUNCTIONS =====
function showRandomQuote() {
  const filter = document.getElementById("categoryFilter").value;
  let filtered = quotes;
  if (filter !== "all") {
    filtered = quotes.filter(q => q.category === filter);
  }
  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes in this category.";
    return;
  }
  const random = filtered[Math.floor(Math.random() * filtered.length)];
  document.getElementById("quoteDisplay").textContent = `"${random.text}" — [${random.category}]`;
  sessionStorage.setItem("lastQuote", JSON.stringify(random));
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) {
    alert("Please enter both text and category!");
    return;
  }
  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  postQuoteToServer(newQuote);
  showNotification("Quote added and synced with server.");
}

// ===== CATEGORY FILTER =====
function populateCategories() {
  const filter = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  filter.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });
  const lastFilter = localStorage.getItem("lastFilter");
  if (lastFilter) filter.value = lastFilter;
}

function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastFilter", selected);
  showRandomQuote();
}

// ===== IMPORT / EXPORT =====
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      showNotification("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ===== SERVER SYNC =====
async function fetchQuotesFromServer() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const serverQuotes = await res.json();
    return serverQuotes.map(post => ({ text: post.title, category: "server" }));
  } catch {
    return [];
  }
}

async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
  } catch {
    console.warn("Failed to post to server");
  }
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length > 0) {
    const localTexts = new Set(quotes.map(q => q.text));
    let conflicts = 0;
    serverQuotes.forEach(sq => {
      if (!localTexts.has(sq.text)) {
        quotes.push(sq);
      } else {
        conflicts++;
      }
    });
    saveQuotes();
    populateCategories();
    if (conflicts > 0) {
      showNotification(`Sync complete with ${conflicts} conflicts (server skipped duplicates).`);
    } else {
      showNotification("Quotes synced with server.");
    }
  }
}

// ===== NOTIFICATION =====
function showNotification(msg) {
  const div = document.createElement("div");
  div.className = "notification";
  div.textContent = msg;
  document.body.prepend(div);
  setTimeout(() => div.remove(), 3000);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  loadQuotes();
  populateCategories();

  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").textContent = `"${q.text}" — [${q.category}]`;
  }

  syncQuotes();
  setInterval(syncQuotes, 30000);
});
