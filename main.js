const contactTrigger = document.getElementById("contactCard");
const modal = document.getElementById("modal");
const spotifyModal = document.getElementById("spotifyModal");
const calendarCard = document.getElementById("calendarCard");
const calendarModal = document.getElementById("calendarModal");
const contactModalContent = modal.querySelector(".modal-content");
const calendarModalContent = calendarModal.querySelector(".modal-content");

// Open modal on mouse hover (mouseenter)
contactTrigger.addEventListener("mouseenter", () => {
  modal.classList.add("active");
  document.body.classList.add("modal-open");
});

contactModalContent.addEventListener("mouseleave", () => {
  closeModal();
});

function closeModal() {
  modal.classList.remove("active");
  document.body.classList.remove("modal-open");
}

calendarCard.addEventListener("mouseenter", () => {
  calendarModal.classList.add("active");
  document.body.classList.add("modal-open");
});

calendarModalContent.addEventListener("mouseleave", () => {
  closeCalendar();
});

function closeCalendar() {
  calendarModal.classList.remove("active");
  document.body.classList.remove("modal-open");
}

function openSpotify() {
  spotifyModal.classList.add("active");
  document.body.classList.add("modal-open");
}

function closeSpotify() {
  spotifyModal.classList.remove("active");
  document.body.classList.remove("modal-open");
}

// Close on clicking outside the content
window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
  if (e.target === spotifyModal) closeSpotify();
  if (e.target === calendarModal) closeCalendar();
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
