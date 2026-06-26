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
108    document.addEventListener("DOMContentLoaded", () => {
109        // --- PASTE NEW TYPEWRITER CODE HERE ---
110        const typewriter = document.querySelector('.typewriter-container');
111        if (typewriter) {
112            const observer = new IntersectionObserver((entries) => {
113                entries.forEach(entry => {
114                    if (entry.isIntersecting) {
115                        entry.target.classList.add('start-typing');
116                        observer.unobserve(entry.target); 
117                    }
118                });
119            }, { threshold: 0.5 });
120            observer.observe(typewriter);
121        }
122
123        // --- YOUR EXISTING CODE STARTS HERE ---
124        const typeElements = document.querySelectorAll(".typewriter");
...
    
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
        // FIXED: Now looks for list items (li) and styled text (em, strong, span)
        const items = card.querySelectorAll('.link-item, h3, p, a, li, em, strong, span');
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
                // FIXED: Added LI and SPAN to the list of items that should hide if they don't match
                if (item.tagName === 'A' || item.parentElement.classList.contains('link-item') || item.tagName === 'P' || item.tagName === 'LI' || item.tagName === 'SPAN') {
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

// ==========================================================================
// 7. ANALOG STATIC HOVER AUDIO ENGINE (WEB AUDIO API)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  const soundCards = document.querySelectorAll(".hover-sound");
  let audioCtx = null;
  let noiseSource = null;
  let filterNode = null;
  let gainNode = null;

  // Synthesizes a raw analog static texture purely via code
  function initStaticNoise() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Generate 2 seconds of unique random static data
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Analog Filter: Cuts high frequencies so it sounds like an old tube TV, not harsh computer noise
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = 650; // Gritty, muffled frequency floor

    // Volume Master: Kept subtle and atmospheric so it doesn't jar the user
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0; // Starts silent

    // Route the audio matrix: Source -> Filter -> Volume -> Speakers
    noiseSource.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();
  }

  soundCards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      try {
        if (!audioCtx) {
          initStaticNoise();
        }
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        // Smoothly fade the volume in over 0.05 seconds to prevent ugly popping sounds
        gainNode.gain.linearRampToValueAtTime(0.018, audioCtx.currentTime + 0.05);
      } catch (error) {
        // Safe fail if the browser blocks audio before the user's first click
        console.log("Audio waiting for initial user interaction gesture.");
      }
    });

    card.addEventListener("mouseleave", () => {
      if (gainNode && audioCtx) {
        // Smoothly fade the volume back down to absolute zero
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
      }
    });
  });
});
