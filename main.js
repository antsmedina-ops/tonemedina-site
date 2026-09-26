// ===== CORE MODAL AND UTILITY LOGIC =====
document.addEventListener("DOMContentLoaded", () => {
    // Find the Contact navigation item dynamically by text content if ID isn't present
    const navLinks = document.querySelectorAll("nav a, header a, .nav-links a");
    let contactTrigger = document.getElementById("contactCard");
    
    if (!contactTrigger) {
        navLinks.forEach(link => {
            if (link.textContent.trim().toLowerCase() === "contact") {
                contactTrigger = link;
            }
        });
    }

    const modal = document.getElementById("modal");
    
    if (contactTrigger && modal) {
        contactTrigger.addEventListener("mouseenter", () => {
            modal.classList.add("active");
            document.body.classList.add("modal-open");
        });
        
        contactTrigger.addEventListener("click", (e) => {
            e.preventDefault();
            modal.classList.toggle("active");
            document.body.classList.toggle("modal-open");
        });

        const contactModalContent = modal.querySelector(".modal-content");
        if (contactModalContent) {
            contactModalContent.addEventListener("mouseleave", () => {
                closeModal();
            });
        }
    }

    // Calendar Card Modal Setup
    const calendarCard = document.getElementById("calendarCard");
    const calendarModal = document.getElementById("calendarModal");
    
    if (calendarCard && calendarModal) {
        calendarCard.addEventListener("mouseenter", () => {
            calendarModal.classList.add("active");
            document.body.classList.add("modal-open");
        });
        
        calendarCard.addEventListener("click", (e) => {
            e.preventDefault();
            calendarModal.classList.toggle("active");
            document.body.classList.toggle("modal-open");
        });
    }
});

function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) {
        modal.classList.remove("active");
        document.body.classList.remove("modal-open");
    }
}

function closeCalendar() {
    const calendarModal = document.getElementById("calendarModal");
    if (calendarModal) {
        calendarModal.classList.remove("active");
        document.body.classList.remove("modal-open");
    }
}

function openSpotify() {
    const spotifyModal = document.getElementById("spotifyModal");
    if (spotifyModal) {
        spotifyModal.classList.add("active");
        document.body.classList.add("modal-open");
    }
}

function closeSpotify() {
    const spotifyModal = document.getElementById("spotifyModal");
    if (spotifyModal) {
        spotifyModal.classList.remove("active");
        document.body.classList.remove("modal-open");
    }
}

window.addEventListener("click", (e) => {
    const modal = document.getElementById("modal");
    const spotifyModal = document.getElementById("spotifyModal");
    const calendarModal = document.getElementById("calendarModal");
    if (modal && e.target === modal) closeModal();
    if (spotifyModal && e.target === spotifyModal) closeSpotify();
    if (calendarModal && e.target === calendarModal) closeCalendar();
});

// ===== PAGE LOAD UTILITIES (Typewriter fade-out & embeds) =====
window.addEventListener("load", () => {
    if (window.instgrm) {
        window.instgrm.Embeds.process();
    }

    const typewriter = document.querySelector('.typewriter-container');
    if (typewriter) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('start-typing');
                    setTimeout(() => {
                        entry.target.classList.add('fade-out');
                    }, 9500);
                    observer.unobserve(entry.target);
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

    if (urlQuery && isLinksPage) {
        searchInput.value = urlQuery;
        filterLinkCards(urlQuery.toLowerCase());
    }

    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase().trim();
        if (isLinksPage) filterLinkCards(value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = searchInput.value.trim();
            if (!isLinksPage && value) {
                window.location.href = `links?q=${encodeURIComponent(value)}`;
            }
        }
    });
});

function filterLinkCards(searchTerm) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const items = card.querySelectorAll('.link-item, h3, p, a, li, em, strong, span');
        let cardHasMatches = false;

        if (searchTerm === '') {
            card.style.display = '';
            items.forEach(item => item.style.display = '');
            return;
        }

        items.forEach(item => {
            if (item.tagName === 'H2' || item.classList.contains('card-title')) return;
            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) {
                item.style.display = '';
                cardHasMatches = true;
            } else {
                item.style.display = 'none';
            }
        });

        card.style.display = cardHasMatches ? '' : 'none';
    });
}

// ===== ANALOG STATIC HOVER AUDIO ENGINE =====
document.addEventListener("DOMContentLoaded", () => {
    const soundCards = document.querySelectorAll(".hover-sound");
    let audioCtx = null, noiseSource = null, filterNode = null, gainNode = null;

    function initStaticNoise() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = audioCtx.sampleRate * 2;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;

            filterNode = audioCtx.createBiquadFilter();
            filterNode.type = "lowpass";
            filterNode.frequency.value = 650;

            gainNode = audioCtx.createGain();
            gainNode.gain.value = 0;

            noiseSource.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            noiseSource.start();
        } catch (e) {}
    }

    soundCards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            try {
                if (!audioCtx) initStaticNoise();
                if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
                if (gainNode && audioCtx) gainNode.gain.linearRampToValueAtTime(0.018, audioCtx.currentTime + 0.05);
            } catch (e) {}
        });
        card.addEventListener("mouseleave", () => {
            try {
                if (gainNode && audioCtx) gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
            } catch (e) {}
        });
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

// ===== FLOATING AI COMPANION & CHAT ENGINE =====
let mouseX = window.innerWidth - 90;
let mouseY = window.innerHeight - 90;
let bubbleX = window.innerWidth - 90;
let bubbleY = window.innerHeight - 90;

function animate() {
    const companionBubble = document.getElementById("companion-bubble");
    if (companionBubble) {
        let dx = mouseX - 25 - bubbleX;
        let dy = mouseY - 25 - bubbleY;
        bubbleX += dx * 0.1;
        bubbleY += dy * 0.1;
        companionBubble.style.left = bubbleX + "px";
        companionBubble.style.top = bubbleY + "px";
    }
    requestAnimationFrame(animate);
}

document.addEventListener("DOMContentLoaded", () => {
    const companionBubble = document.getElementById("companion-bubble");
    if (companionBubble) {
        companionBubble.style.left = bubbleX + "px";
        companionBubble.style.top = bubbleY + "px";
        
        companionBubble.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleChat();
        });
    }

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    requestAnimationFrame(animate);

    const userInput = document.getElementById("user-input");
    if (userInput) {
        userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendInput();
            }
        });
    }
});

function toggleChat() {
    const chatContainer = document.getElementById("companion-container");
    const chatBubble = document.getElementById("companion-bubble");
    
    if (!chatContainer) return;
    
    const currentDisplay = window.getComputedStyle(chatContainer).display;
    
    if (currentDisplay === "none" || currentDisplay === "") {
        chatContainer.style.display = "flex";
        if (chatBubble) chatBubble.style.display = "none";
    } else {
        chatContainer.style.display = "none";
        if (chatBubble) chatBubble.style.display = "flex";
    }
}

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
    
    const chatMessagesEl = document.getElementById("chat-messages");
    if (!chatMessagesEl) return;
    
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
