const contactTrigger = document.getElementById("contactCard");
const modal = document.getElementById("modal");
const spotifyModal = document.getElementById("spotifyModal");
const calendarCard = document.getElementById("calendarCard");
const calendarModal = document.getElementById("calendarModal");

// Open/Close Contact Modal (Only runs if elements exist on the current page)
if (contactTrigger && modal) {
  const contactModalContent = modal.querySelector(".modal-content");
  
  contactTrigger.addEventListener("mouseenter", () => {
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  });

  if (contactModalContent) {
    contactModalContent.addEventListener("mouseleave", () => {
      closeModal();
    });
  }
}

function closeModal() {
  if (modal) {
    modal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
}

// Open/Close Calendar Modal (Only runs if elements exist on the current page)
if (calendarCard && calendarModal) {
  const calendarModalContent = calendarModal.querySelector(".modal-content");

  calendarCard.addEventListener("mouseenter", () => {
    calendarModal.classList.add("active");
    document.body.classList.add("modal-open");
  });

  if (calendarModalContent) {
    calendarModalContent.addEventListener("mouseleave", () => {
      closeCalendar();
    });
  }
}

function closeCalendar() {
  if (calendarModal) {
    calendarModal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
}

function openSpotify() {
  if (spotifyModal) {
    spotifyModal.classList.add("active");
    document.body.classList.add("modal-open");
  }
}

function closeSpotify() {
  if (spotifyModal) {
    spotifyModal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
}

// Close on clicking outside the content windows
window.addEventListener("click", (e) => {
  if (modal && e.target === modal) closeModal();
  if (spotifyModal && e.target === spotifyModal) closeSpotify();
  if (calendarModal && e.target === calendarModal) closeCalendar();
});

// Re-process Instagram embeds after page load
window.addEventListener("load", () => {
  if (window.instgrm) {
    window.instgrm.Embeds.process();
  }
});

// Copy text function with visual feedback
function copyText(text) {
  navigator.clipboard.writeText(text);
  const flash = document.createElement("div");
  flash.textContent = "> copied: " + text;
  flash.style.position = "fixed";
  flash.style.bottom = "20px";
  flash.style.left = "50%";
  flash.style.transform = "translateX(-50%)";
  flash.style.background = "#050805";
  flash.style.color = "#00ff66";
  flash.style.fontFamily = "monospace";
  flash.style.fontSize = "12px";
  flash.style.padding = "8px 12px";
  flash.style.border = "1px solid #00ff66";
  flash.style.boxShadow = "0 0 12px rgba(0,255,102,0.4)";
  flash.style.borderRadius = "6px";
  flash.style.zIndex = "9999";
  document.body.appendChild(flash);
  setTimeout(() => {
    flash.style.opacity = "0";
    flash.style.transition = "opacity 0.5s ease";
    setTimeout(() => flash.remove(), 500);
  }, 1200);
}

// ===== HAND-TYPED ANIMATION =====
document.addEventListener("DOMContentLoaded", () => {
  const typeElements = document.querySelectorAll(".typewriter");
  
  typeElements.forEach(el => {
    const text = el.textContent;
    el.textContent = ""; // Clears the text instantly on load
    let i = 0;
    
    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        // Randomizes speed between 50ms and 120ms for realism
        const typingSpeed = Math.floor(Math.random() * 70) + 50; 
        setTimeout(type, typingSpeed);
      }
    }
    
    setTimeout(type, 500); // Waits half a second before starting to type
  });
});


// ==========================================================================
// 6. GLOBAL SEARCH & LIVE FILTERING ENGINE
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    // Fixed: Looks for just 'links' to support modern, clean URLs
    const isLinksPage = window.location.pathname.includes('links');

    // 1. On-Load Check: Read URL parameters (e.g., ?q=chalk)
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('q');

    if (urlQuery && isLinksPage) {
        searchInput.value = urlQuery;
        filterLinkCards(urlQuery.toLowerCase());
    }

    // 2. Typing Event: Filter live if on links page
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase().trim();
        if (isLinksPage) {
            filterLinkCards(value);
        }
    });

    // 3. Enter Key Event: Redirect to links page if searching from elsewhere
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = searchInput.value.trim();
            if (!isLinksPage && value) {
                // Fixed: Redirects to 'links' instead of 'links.html'
                window.location.href = `links?q=${encodeURIComponent(value)}`;
            }
        }
    });
});

// Filtering engine that handles individual link items and entire cards
function filterLinkCards(searchTerm) {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        // Looks for paragraphs, headers, and links inside the card
        const items = card.querySelectorAll('.link-item, h3, p, a');
        let cardHasMatches = false;

        // If the user cleared the search, show everything instantly
        if (searchTerm === '') {
            card.style.display = '';
            items.forEach(item => item.style.display = '');
            return;
        }

        items.forEach(item => {
            // Only filter actual individual links or list items, don't hide card headers
            if (item.tagName === 'H2' || item.classList.contains('card-title')) return;

            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) {
                item.style.display = ''; 
                cardHasMatches = true;
            } else {
                // Only hide it if it's an actionable item or specific description
                if (item.tagName === 'A' || item.parentElement.classList.contains('link-item') || item.tagName === 'P') {
                    item.style.display = 'none';
                }
            }
        });

        // Hide the entire card panel if absolutely nothing matches inside it
        if (cardHasMatches) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}
