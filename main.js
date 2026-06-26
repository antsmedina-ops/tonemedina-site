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
