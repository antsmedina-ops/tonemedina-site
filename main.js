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
