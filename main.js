// ===== CORE MODAL AND UTILITY LOGIC =====
const contactTrigger = document.getElementById("contactCard");
const modal = document.getElementById("modal");
const spotifyModal = document.getElementById("spotifyModal");
const calendarCard = document.getElementById("calendarCard");
const calendarModal = document.getElementById("calendarModal");

if (contactTrigger && modal) {
    const contactModalContent = modal.querySelector(".modal-content");
    contactTrigger.addEventListener("mouseenter", () => { modal.classList.add("active"); document.body.classList.add("modal-open"); });
    if (contactModalContent) { contactModalContent.addEventListener("mouseleave", () => { closeModal(); }); }
}

function closeModal() { if (modal) { modal.classList.remove("active"); document.body.classList.remove("modal-open"); } }

if (calendarCard && calendarModal) {
    const calendarModalContent = calendarModal.querySelector(".modal-content");
    calendarCard.addEventListener("mouseenter", () => { calendarModal.classList.add("active"); document.body.classList.add("modal-open"); });
    if (calendarModalContent) { calendarModalContent.addEventListener("mouseleave", () => { closeCalendar(); }); }
}

function closeCalendar() { if (calendarModal) { calendarModal.classList.remove("active"); document.body.classList.remove("modal-open"); } }

function openSpotify() { if (spotifyModal) { spotifyModal.classList.add("active"); document.body.classList.add("modal-open"); } }

function closeSpotify() { if (spotifyModal) { spotifyModal.classList.remove("active"); document.body.classList.remove("modal-open"); } }

window.addEventListener("click", (e) => {
    if (modal && e.target === modal) closeModal();
    if (spotifyModal && e.target === spotifyModal) closeSpotify();
    if (calendarModal && e.target === calendarModal) closeCalendar();
});

// ===== PAGE LOAD UTILITIES =====
window.addEventListener("load", () => {
    if (window.instgrm) { window.instgrm.Embeds.process(); }
    
    // Typewriter Observer (Triggered on Load)
   const typewriter = document.querySelector('.typewriter-container');
if (typewriter) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('start-typing');
                
                // Once the typing finishes (e.g., after 4 seconds), add the fade-out class
                setTimeout(() => {
                    entry.target.classList.add('fade-out');
                }, 4000); 

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0 });
    observer.observe(typewriter);
}
            });
        }, { threshold: 0 });
        observer.observe(typewriter);
    }
});

// ===== GLOBAL SEARCH & LIVE FILTERING ENGINE =====
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    const isLinksPage = window.location.pathname.includes('links');
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('q');
    if (urlQuery && isLinksPage) { searchInput.value = urlQuery; filterLinkCards(urlQuery.toLowerCase()); }

    searchInput.addEventListener('input', (e) => { const value = e.target.value.toLowerCase().trim(); if (isLinksPage) filterLinkCards(value); });
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = searchInput.value.trim();
            if (!isLinksPage && value) window.location.href = `links?q=${encodeURIComponent(value)}`;
        }
    });
});

function filterLinkCards(searchTerm) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const items = card.querySelectorAll('.link-item, h3, p, a, li, em, strong, span');
        let cardHasMatches = false;
        if (searchTerm === '') { card.style.display = ''; items.forEach(item => item.style.display = ''); return; }
        items.forEach(item => {
            if (item.tagName === 'H2' || item.classList.contains('card-title')) return;
            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) { item.style.display = ''; cardHasMatches = true; }
            else if (item.tagName === 'A' || item.parentElement.classList.contains('link-item') || item.tagName === 'P' || item.tagName === 'LI' || item.tagName === 'SPAN') { item.style.display = 'none'; }
        });
        card.style.display = cardHasMatches ? '' : 'none';
    });
}

// ===== ANALOG STATIC HOVER AUDIO ENGINE =====
document.addEventListener("DOMContentLoaded", () => {
    const soundCards = document.querySelectorAll(".hover-sound");
    let audioCtx = null, noiseSource = null, filterNode = null, gainNode = null;
    function initStaticNoise() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        noiseSource = audioCtx.createBufferSource(); noiseSource.buffer = buffer; noiseSource.loop = true;
        filterNode = audioCtx.createBiquadFilter(); filterNode.type = "lowpass"; filterNode.frequency.value = 650;
        gainNode = audioCtx.createGain(); gainNode.gain.value = 0;
        noiseSource.connect(filterNode); filterNode.connect(gainNode); gainNode.connect(audioCtx.destination); noiseSource.start();
    }
    soundCards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            try { if (!audioCtx) initStaticNoise(); if (audioCtx.state === "suspended") audioCtx.resume(); gainNode.gain.linearRampToValueAtTime(0.018, audioCtx.currentTime + 0.05); } catch (e) {}
        });
        card.addEventListener("mouseleave", () => { if (gainNode && audioCtx) gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05); });
    });
});

function copyText(text, element) {
  navigator.clipboard.writeText(text).then(() => {
    if (element) {
      element.classList.add('copied');
      const originalText = element.innerText;
      element.innerText = 'Copied!';
      
      setTimeout(() => {
        element.classList.remove('copied');
        element.innerText = originalText;
      }, 1500);
    }
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

/* --- Floating AI Companion & Concept Generator --- */

let companionBubble = null;
let mouseX = 0;
let mouseY = 0;
let bubbleX = window.innerWidth - 90;
let bubbleY = window.innerHeight - 90;

document.addEventListener("DOMContentLoaded", () => {
    companionBubble = document.getElementById("companion-bubble");
    if (companionBubble) {
        companionBubble.style.left = bubbleX + "px";
        companionBubble.style.top = bubbleY + "px";
    }

    // Track cursor for floating follow effect
    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    animate();

    const userInput = document.getElementById("user-input");
    if (userInput) {
        userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendInput();
            }
        });
    }
});

function animate() {
    if (!companionBubble) return;

    let dx = mouseX - bubbleX;
    let dy = mouseY - bubbleY;

    // Smooth floating delay
    bubbleX += dx * 0.05;
    bubbleY += dy * 0.05;

    const bubbleSize = companionBubble.offsetWidth || 60;
    if (bubbleX < 0) bubbleX = 0;
    if (bubbleY < 0) bubbleY = 0;
    if (bubbleX > window.innerWidth - bubbleSize) bubbleX = window.innerWidth - bubbleSize;
    if (bubbleY > window.innerHeight - bubbleSize) bubbleY = window.innerHeight - bubbleSize;

    companionBubble.style.left = bubbleX + "px";
    companionBubble.style.top = bubbleY + "px";

    requestAnimationFrame(animate);
}

function toggleChat() {
    const chatContainer = document.getElementById("companion-container");
    const chatBubble = document.getElementById("companion-bubble");

    if (!chatContainer || !chatBubble) return;

    if (chatContainer.style.display === "none" || chatContainer.style.display === "") {
        chatContainer.style.display = "flex";
        chatBubble.style.display = "none";
    } else {
        chatContainer.style.display = "none";
        chatBubble.style.display = "flex";
    }
}

// Hook up the click event to your bubble so it opens the chat
document.addEventListener("DOMContentLoaded", () => {
    const companionBubbleEl = document.getElementById("companion-bubble");
    if (companionBubbleEl) {
        companionBubbleEl.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleChat();
        });
    }
});
function addMessage(text, sender, id = null) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = sender + "-message";
    if (id) messageDiv.id = id;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingMessage(id) {
    const loadingEl = document.getElementById(id);
    if (loadingEl) {
        loadingEl.remove();
    }
}

async function sendInput() {
  const userInputField = document.getElementById("user-input");
  if (!userInputField) return;
  const userInput = userInputField.value;
  if (userInput.trim() === "") return;

  addMessage(userInput, "user");
  userInputField.value = "";

  const loadingMessageId = "loading-" + Date.now();
  addMessage("Hmm, let me sketch a concept...", "bot", loadingMessageId);

  // Gather past conversation messages from the chat box DOM
  const chatMessagesEl = document.getElementById("chat-messages");
  const messageDivs = chatMessagesEl.querySelectorAll(".user-message, .bot-message");
  const history = [];
  
  messageDivs.forEach(div => {
    if (div.id && div.id.startsWith("loading-")) return;
    const role = div.classList.contains("user-message") ? "user" : "assistant";
    history.push({ role: role, content: div.textContent });
  });

  try {
    const backendURL = "https://redeye.antsmedina.workers.dev";
    const response = await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    });

    const data = await response.json();
    removeLoadingMessage(loadingMessageId);

    if (data.conceptDescription) {
      addMessage(data.conceptDescription, "bot");
    } else if (data.error) {
      addMessage("Error: " + data.error, "bot");
    } else {
      addMessage("Received an unexpected response. Please try again.", "bot");
    }
  } catch (error) {
    console.error("Error calling AI API:", error);
    removeLoadingMessage(loadingMessageId);
    addMessage("Apologies, my creative energy is momentarily blocked. Try again in a bit?", "bot");
  }
}
