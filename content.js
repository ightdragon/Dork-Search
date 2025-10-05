console.log("[CS] Loaded ✅");

// ===== Overlay UI =====
function showLoadingOverlay() {
  let overlay = document.getElementById("dork-search-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "dork-search-overlay";
  overlay.textContent = "🔍 Refining your search...";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#fff4e6",
    color: "#222",
    padding: "8px 14px",
    border: "1px solid #e0b080",
    borderRadius: "6px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    fontSize: "14px",
    fontFamily: "sans-serif",
    zIndex: 999999,
    opacity: "0",
    transition: "opacity 0.2s"
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });
  return overlay;
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("dork-search-overlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 200);
  }
}

// ===== Messaging to background.js =====

function handleQueryRewrite(original) {
  if (!original) return;
  console.log("[CS] handleQueryRewrite:", original);
  showLoadingOverlay();
  chrome.runtime.sendMessage({ type: "REWRITE", query: original }, (resp) => {
    hideLoadingOverlay();
    if (chrome.runtime.lastError) {
      console.error("[CS] runtime error:", chrome.runtime.lastError.message);
      location.href = "https://www.google.com/search?q=" + encodeURIComponent(original);
      return;
    }
    const rewritten = resp?.rewritten || original;
    console.log("[CS] Rewritten:", rewritten);
    location.href = "https://www.google.com/search?q=" + encodeURIComponent(rewritten);
  });
}




// ===== Typed input handling =====
// === Init for TYPED input ===
function initTyped() {
  const box = document.querySelector("input[name='q'],textarea[name='q']");
  if (!box) {
    setTimeout(initTyped, 300);
    return;
  }

  // Keydown Enter
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (!box.matches(":focus")) return;
    const query = box.value.trim();
    if (!query) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log("[CS] Keydown Enter:", query);
    handleQueryRewrite(query);
  }, true);

  // Form submit
  const form = box.closest("form");
  if (form && !form.__typedAttached) {
    form.__typedAttached = true;
    form.addEventListener("submit", (e) => {
      const query = box.value.trim();
      if (!query) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      console.log("[CS] Intercepted submit:", query);
      handleQueryRewrite(query);
    }, true);
  }
}



// === Run both ===
initTyped();

