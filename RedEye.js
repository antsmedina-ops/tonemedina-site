/* ===== TONE MEDINA'S REDEYE / ¡OJO! AI COMPANION ===== */

(function () {
  const BOT_ENDPOINT = 'https://redeye.antsmedina.workers.dev';
  let chatMessages = [];

  const botDiv = document.createElement('div');
  const chatWindowDiv = document.createElement('div');
  const botInputDiv = document.createElement('div');

  let isBotMuted = false;

  // Mouse tracking targets & state variables
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  // Movement Config
  const LERP_SPEED = 0.015;
  const BASE_OFFSET = 400; 
  let time = 0;
  let effectiveOffset = BASE_OFFSET;

  // State & Timer Variables for Typing Animation
  let typeWriterInterval = null;
  let placeholderTimer = null;

  // ===== Helper: Inject Cursor Blink Animation =====
  function injectCursorStyle() {
    if (document.getElementById('redeye-cursor-style')) return;
    const style = document.createElement('style');
    style.id = 'redeye-cursor-style';
    style.textContent = `
      #redeye-header {
        background: #1a0000;
        padding: 10px 14px;
        border-bottom: 1px solid #ff3333;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        color: #ff4d4d;
        letter-spacing: 1px;
      }
      #redeye-close-btn {
        cursor: pointer;
        color: #ff4d4d;
        font-size: 18px;
        padding: 0 4px;
      }
      @keyframes redeyeBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .redeye-blink-cursor {
        display: inline-block;
        width: 8px;
        height: 15px;
        background-color: #aaa;
        margin-left: 2px;
        vertical-align: middle;
        animation: redeyeBlink 0.8s infinite;
      }
      .redeye-mobile-idle {
        animation: redeyePulse 3s infinite ease-in-out;
      }
      @keyframes redeyePulse {
        0%, 100% {
          box-shadow: 0 0 12px 3px rgba(255, 0, 0, 0.5), inset 0 0 8px rgba(139, 0, 0, 0.8);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 22px 8px rgba(255, 0, 0, 0.85), inset 0 0 12px rgba(255, 50, 50, 0.9);
          transform: scale(1.06);
        }
      }
      .redeye-mobile-label {
        position: absolute;
        bottom: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'VT323', monospace;
        font-size: 14px;
        color: #ff3333;
        text-shadow: 0 0 4px #000;
        pointer-events: none;
        white-space: nowrap;
      }
      #redeye-chat-window textarea:focus {
        outline: none;
        border-color: rgba(139, 0, 0, 0.8) !important;
      }
      #redeye-history::-webkit-scrollbar {
        width: 6px;
      }
      #redeye-history::-webkit-scrollbar-thumb {
        background: rgba(139, 0, 0, 0.5);
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== 1. CORE BOT UI SETUP =====
  function createBotUi() {
    injectCursorStyle();

    if (!document.getElementById('wopr-font')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'wopr-font';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
      document.head.appendChild(fontLink);
    }

    const isMobile = window.innerWidth <= 768;

    botDiv.id = 'redeye-bot';
    if (isMobile) botDiv.classList.add('redeye-mobile-idle');

    botDiv.style.cssText = `
      position: fixed;
      ${isMobile ? 'bottom: 40px; right: 20px;' : 'top: 0; left: 0;'}
      width: 48px;
      height: 48px;
      background: rgba(0, 0, 0, 0.95);
      border: 3px solid #8B0000;
      border-radius: 50%;
      cursor: pointer;
      z-index: 999999;
      pointer-events: auto;
      touch-action: manipulation;
      -webkit-user-select: none;
      user-select: none;
      box-shadow: 0 0 20px 8px rgba(139, 0, 0, 0.75);
      transition: box-shadow 0.3s ease, transform 0.05s linear;
      will-change: transform;
      -webkit-tap-highlight-color: transparent;
    `;
    botDiv.title = '¡Ojo!';

    if (isMobile) {
      const mobileLabel = document.createElement('span');
      mobileLabel.className = 'redeye-mobile-label';
      mobileLabel.textContent = '¡OJO!';
      botDiv.appendChild(mobileLabel);
    }

    chatWindowDiv.id = 'redeye-chat-window';
    chatWindowDiv.style.cssText = `
      position: fixed;
      ${isMobile ? 'bottom: 95px; right: 12px; left: 12px; width: auto;' : 'bottom: 80px; right: 20px; width: 340px;'}
      height: 380px;
      max-height: calc(100dvh - 120px);
      background: rgba(10, 10, 10, 0.98);
      color: #fff;
      border: 1px solid rgba(139, 0, 0, 0.6);
      border-radius: 12px;
      display: none;
      z-index: 1000000;
      box-shadow: 0 5px 30px rgba(0,0,0,0.9);
      padding: 1rem;
      flex-direction: column;
      font-family: 'VT323', 'Courier New', monospace;
      font-size: 1.05rem;
      letter-spacing: 0.05em;
      box-sizing: border-box;
    `;

    // Clean single header with integrated close button
    const headerDiv = document.createElement('div');
    headerDiv.id = 'redeye-header';
    headerDiv.innerHTML = '<span>¡OJO! ASSISTANT</span><span id="redeye-close-btn">✕</span>';
    chatWindowDiv.appendChild(headerDiv);

    headerDiv.querySelector('#redeye-close-btn').addEventListener('click', () => {
      isChatOpen = false;
      chatWindowDiv.style.display = 'none';
      isBotMuted = false;
    });

    const chatHistoryDiv = document.createElement('div');
    chatHistoryDiv.id = 'redeye-history';
    chatHistoryDiv.style.cssText = 'flex-grow: 1; overflow-y: auto; margin-bottom: 0.75rem; padding-right: 5px; -webkit-overflow-scrolling: touch;';
    chatWindowDiv.appendChild(chatHistoryDiv);

    botInputDiv.id = 'redeye-input-container';
    botInputDiv.style.cssText = 'position: relative; width: 100%; height: 50px; display: flex; gap: 8px; align-items: center;';

    const greetingOverlay = document.createElement('div');
    greetingOverlay.id = 'redeye-greeting-overlay';
    greetingOverlay.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      color: #aaa;
      font-family: 'VT323', monospace;
      font-size: 1rem;
      letter-spacing: 0.05em;
      pointer-events: none;
      white-space: pre-wrap;
      z-index: 2;
    `;

    const inputArea = document.createElement('textarea');
    inputArea.id = 'redeye-textarea';
    inputArea.style.cssText = `
      flex-grow: 1;
      height: 100%;
      background: transparent;
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 8px;
      resize: none;
      font-family: inherit;
      font-size: 16px;
      display: block;
      box-sizing: border-box;
      z-index: 1;
    `;

    const sendBtn = document.createElement('button');
    sendBtn.id = 'redeye-send-btn';
    sendBtn.textContent = 'SEND';
    sendBtn.style.cssText = `
      height: 100%;
      padding: 0 12px;
      background: rgba(139, 0, 0, 0.4);
      color: #fff;
      border: 1px solid #8B0000;
      border-radius: 6px;
      font-family: 'VT323', monospace;
      font-size: 1rem;
      cursor: pointer;
      z-index: 2;
    `;

    const inputWrapper = document.createElement('div');
    inputWrapper.style.cssText = 'position: relative; flex-grow: 1; height: 100%;';
    inputWrapper.appendChild(inputArea);
    inputWrapper.appendChild(greetingOverlay);

    botInputDiv.appendChild(inputWrapper);
    botInputDiv.appendChild(sendBtn);
    chatWindowDiv.appendChild(botInputDiv);

    document.body.appendChild(botDiv);
    document.body.appendChild(chatWindowDiv);

    if (!isMobile) {
      initDesktopTracking();
    }

    addRedeyeListeners(chatHistoryDiv, inputArea, greetingOverlay, sendBtn, headerDiv);
  }

// ===== 2. DESKTOP MOUSE TRACKING PHYSICS =====
function initDesktopTracking() {
  let isHovered = false;

  // Lock ¡Ojo! in place instantly when hovered
  botDiv.addEventListener('mouseenter', () => { isHovered = true; });
  botDiv.addEventListener('mouseleave', () => { isHovered = false; });

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function animate(timestamp) {
    if (window.innerWidth > 768) {
      if (!isHovered && chatWindowDiv.style.display !== 'flex') {
        const time = timestamp * 0.0012;

        // Calculate distance between mouse cursor and ¡Ojo!
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        const dist = Math.hypot(dx, dy);

        // Smooth transition factor: stays far away until cursor gets close
        const approach = Math.min(1, Math.max(0, (dist - 50) / 200));

        // Gentle organic float wave
        const driftX = (Math.sin(time) * 14 + Math.cos(time * 0.7) * 7) * approach;
        const driftY = (Math.cos(time * 0.8) * 14 + Math.sin(time * 0.5) * 7) * approach;

        // OFFSETS: 420px right, 380px down so ¡Ojo! hovers comfortably clear of cursor
        const offsetX = (420 * approach) + driftX;
        const offsetY = (380 * approach) + driftY;

        const destX = targetX + offsetX;
        const destY = targetY + offsetY;

        const lerpSpeed = 0.045;
        currentX += (destX - currentX) * lerpSpeed;
        currentY += (destY - currentY) * lerpSpeed;

        botDiv.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
  // ===== 3. GREETING TYPEWRITER LOGIC =====
  function triggerGreeting(greetingOverlay, inputArea) {
    greetingOverlay.style.display = 'block';
    greetingOverlay.style.opacity = '1';
    greetingOverlay.textContent = '';
    const text = 'ask me anything...';
    let i = 0;

    if (typeWriterInterval) clearInterval(typeWriterInterval);

    typeWriterInterval = setInterval(() => {
      if (i < text.length) {
        greetingOverlay.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeWriterInterval);
        placeholderTimer = setTimeout(() => {
          greetingOverlay.style.transition = 'opacity 0.3s ease';
          greetingOverlay.style.opacity = '0';
          setTimeout(() => {
            greetingOverlay.style.display = 'none';
            inputArea.placeholder = "it's ok, talk to me";
          }, 300);
        }, 1500);
      }
    }, 60);
  }

  // ===== 4. WORKER API CALL =====
  async function sendInputToWorker(inputArea, historyArea) {
    const text = inputArea.value.trim();
    if (!text) return;

    inputArea.value = '';

    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'margin-bottom: 8px; color: #66ccff; word-break: break-word;';
    userMsg.textContent = `You: ${text}`;
    historyArea.appendChild(userMsg);
    historyArea.scrollTop = historyArea.scrollHeight;

    const botMsg = document.createElement('div');
    botMsg.style.cssText = 'margin-bottom: 12px; color: #ff6666; word-break: break-word;';
    botMsg.textContent = '¡Ojo!: thinking...';
    historyArea.appendChild(botMsg);
    historyArea.scrollTop = historyArea.scrollHeight;

    try {
      const response = await fetch(BOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          pageContext: document.body.innerText.substring(0, 1500)
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      let replyText = data.response || data.reply || "No response received.";

      // 1. Check if the AI wants to navigate to a page on your site
      const navMatch = replyText.match(/\[NAVIGATE:\s*([^\]]+)\]/i);
      if (navMatch) {
        replyText = replyText.replace(navMatch[0], '').trim(); 
        setTimeout(() => window.location.href = navMatch[1].trim(), 1200); 
      }

      // 2. Check if the AI wants to open an external link in a new tab
      const openMatch = replyText.match(/\[OPEN:\s*([^\]]+)\]/i);
      if (openMatch) {
        replyText = replyText.replace(openMatch[0], '').trim(); 
        setTimeout(() => window.open(openMatch[1].trim(), '_blank'), 1200); 
      }

// 3. Check if the AI wants to trigger an action or scroll to a section
      const actionMatch = replyText.match(/\[ACTION:\s*([^\]]+)\]/i);

      if (actionMatch) {
        const targetAction = actionMatch[1].trim().toLowerCase();
        replyText = replyText.replace(actionMatch[0], '').trim();

        setTimeout(() => {
          const navLinks = Array.from(document.querySelectorAll('header a, nav a, .nav-link, button, a'));
          const matchedEl = navLinks.find(el => {
            const linkText = el.textContent.trim().toLowerCase();
            return linkText === targetAction || linkText.replace(/\s+/g, '') === targetAction.replace(/\s+/g, '');
          });

          if (matchedEl) {
            matchedEl.click();
          } else {
           // Fallback: Search page elements and details accordions to open and smooth-scroll
            const targetEl = document.getElementById(targetAction) || Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, details')).find(el => {
              return el.textContent.trim().toLowerCase().includes(targetAction);
            });

            if (targetEl) {
              const detailsEl = targetEl.closest('details') || (targetEl.tagName === 'DETAILS' ? targetEl : null);
              if (detailsEl) {
                detailsEl.open = true;
              }
              targetEl.scrollIntoView({ behavior: 'smooth' });
            } else {
const routeMap = {
  'art': 'works.html',
  'artwork': 'works.html',
  'works': 'works.html',
  'gallery': 'works.html',
  'archive': 'works.html#archives',
  'archives': 'works.html#archives',
  'music': 'index.html',
  'news': 'news.html',
  'contact': 'contact.html',
  'links': 'links.html',
  'bio': 'bio.html',
  'biography': 'bio.html',
  'home': 'index.html'
};

              if (routeMap[targetAction]) {
                window.location.href = routeMap[targetAction];
              }
            }
          }
        }, 1200);
      }

      botMsg.textContent = `¡Ojo!: ${replyText}`;
    } catch (err) {
      console.error('¡Ojo! Error:', err);
      botMsg.textContent = '¡Ojo!: Connection lost... try again.';
    }
    historyArea.scrollTop = historyArea.scrollHeight;
  }

  // ===== 5. INTERACTION & TOUCH EVENT LISTENERS =====
  let leaveTimer = null;

  function addRedeyeListeners(historyArea, inputArea, greetingOverlay, sendBtn, headerDiv) {
    const toggleChat = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (leaveTimer) clearTimeout(leaveTimer);
      const isOpening = chatWindowDiv.style.display !== 'flex';
      chatWindowDiv.style.display = isOpening ? 'flex' : 'none';
      isBotMuted = isOpening;

      if (isOpening) {
        triggerGreeting(greetingOverlay, inputArea);
      }
    };

    let touchMoved = false;
    botDiv.addEventListener('touchstart', () => {
      touchMoved = false;
    }, { passive: true });

    botDiv.addEventListener('touchmove', () => {
      touchMoved = true;
    }, { passive: true });

    botDiv.addEventListener('touchend', (e) => {
      if (!touchMoved) {
        toggleChat(e);
      }
    });

    botDiv.addEventListener('click', (e) => {
      if (!('ontouchstart' in window)) {
        toggleChat(e);
      }
    });

    chatWindowDiv.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    chatWindowDiv.addEventListener('click', (e) => e.stopPropagation());

    const handleSend = (e) => {
      if (e) e.preventDefault();
      if (leaveTimer) clearTimeout(leaveTimer);
      sendInputToWorker(inputArea, historyArea);
    };

    sendBtn.addEventListener('click', handleSend);

    inputArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(e);
      }
    });

    const clearOverlayOnInteraction = () => {
      if (greetingOverlay.style.display !== 'none') {
        if (typeWriterInterval) clearInterval(typeWriterInterval);
        if (placeholderTimer) clearTimeout(placeholderTimer);
        greetingOverlay.style.transition = 'opacity 0.2s ease';
        greetingOverlay.style.opacity = '0';
        setTimeout(() => {
          greetingOverlay.style.display = 'none';
          inputArea.placeholder = "it's ok, talk to me";
        }, 200);
      }
    };

    inputArea.addEventListener('focus', clearOverlayOnInteraction);
    inputArea.addEventListener('touchstart', clearOverlayOnInteraction, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBotUi);
  } else {
    createBotUi();
  }
})();
