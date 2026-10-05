/* ===== TONE MEDINA'S REDEYE / ¡OJO! AI COMPANION ===== */

(function () {
  const BOT_ENDPOINT = 'https://redeye.antsmedina.workers.dev';
  let chatMessages = [];

  const botDiv = document.createElement('div');
  const chatWindowDiv = document.createElement('div');
  const botInputDiv = document.createElement('div');

  let isBotMuted = false;
  let typeWriterInterval = null;
  let placeholderTimer = null;

  // Web Audio Synthesizer (Zero External Files)
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playOjoSound(type) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'whisper') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      } else if (type === 'blip') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (type === 'whisper' ? 0.4 : 0.05));
    } catch (e) {
      // Autoplay fallback
    }
  }

  // Ambient speech messages & bubble element
  const OJO_WHISPERS = [
    "i'm watchin you",
    "still here?",
    "done yet?",
    "this all seems pointless",
    "are we friends?",
    "OJO sees everything",
    "chalk fades but the memories remain"
  ];
  const bubbleDiv = document.createElement('div');  

  // Mouse tracking targets & state variables
  const savedX = sessionStorage.getItem('ojo_x');
  const savedY = sessionStorage.getItem('ojo_y');

  let currentX = savedX !== null ? parseFloat(savedX) : window.innerWidth / 2;
  let currentY = savedY !== null ? parseFloat(savedY) : window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  // Movement Config
  const LERP_SPEED = 0.015;
  const BASE_OFFSET = 400; 
  let time = 0;
  let effectiveOffset = BASE_OFFSET;

  // ===== AMBIENT WHISPERS (MOBILE & DESKTOP) =====
  function initAmbientWhispers() {
    function speakAmbientWhisper() {
      if (chatWindowDiv.style.display !== 'flex') {
        const text = OJO_WHISPERS[Math.floor(Math.random() * OJO_WHISPERS.length)];
        const isMobileScreen = window.innerWidth <= 768;

        bubbleDiv.textContent = text;
        playOjoSound('whisper');

        if (isMobileScreen) {
          bubbleDiv.style.left = 'auto';
          bubbleDiv.style.right = '0';
          bubbleDiv.style.transform = 'translateY(-4px)';
        } else {
          bubbleDiv.style.left = '50%';
          bubbleDiv.style.right = 'auto';
          bubbleDiv.style.transform = 'translateX(-50%) translateY(-4px)';
        }

        bubbleDiv.style.opacity = '1';

        setTimeout(() => {
          bubbleDiv.style.opacity = '0';
          if (isMobileScreen) {
            bubbleDiv.style.transform = 'translateY(0)';
          } else {
            bubbleDiv.style.transform = 'translateX(-50%) translateY(0)';
          }
        }, 4000);
      }

      const nextDelay = Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;
      setTimeout(speakAmbientWhisper, nextDelay);
    }

    const initialDelay = Math.floor(Math.random() * 4000) + 6000;
    setTimeout(speakAmbientWhisper, initialDelay);
  }

  function injectCursorStyle() {
    if (document.getElementById('redeye-cursor-style')) return;
    const style = document.createElement('style');
    style.id = 'redeye-cursor-style';
    style.textContent = `
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
        bottom: -40px;
        left: 65%;
        transform: translateX(-50%);
        font-family: 'VT323', monospace;
        font-size: 20px;
        font-weight: bold;
        letter-spacing: 4px;
        color: #ff3333;
        text-shadow: 0 0 6px #000;
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
      ${isMobile ? 'bottom: 50px; right: 25px;' : 'top: 0; left: 0;'}
      ${isMobile ? 'transform: none;' : `transform: translate3d(${currentX}px,${currentY}px, 0);`}
      opacity: ${isMobile ? '1' : '0'};
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
      transition: opacity 0.4s ease, box-shadow 0.3s ease;
      will-change: transform;
      -webkit-tap-highlight-color: transparent;
    `;
    botDiv.title = '¡Ojo!';

    bubbleDiv.id = 'ojo-ambient-bubble';
    bubbleDiv.style.cssText = `
      position: absolute;
      bottom: 55px;
      ${isMobile ? 'right: 0; left: auto;' : 'left: 50%;'}
      background: rgba(15, 0, 0, 0.95);
      color: #ff4d4d;
      border: 1px solid #8B0000;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-family: monospace;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s ease;
      box-shadow: 0 0 10px rgba(139, 0, 0, 0.6);
      z-index: 1000000;
    `;
    
    botDiv.appendChild(bubbleDiv);
    
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

    const headerDiv = document.createElement('div');
    headerDiv.id = 'redeye-header';
    headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: bold; color: #ff3333;';
    headerDiv.innerHTML = '<span style="color: #ff3333; font-weight: bold;">¡OJO! ASSISTANT</span><span id="redeye-close-btn" style="color: #ff3333; cursor: pointer; font-size: 18px; padding: 0 4px; font-weight: bold;">✕</span>';
    chatWindowDiv.appendChild(headerDiv);

    headerDiv.querySelector('#redeye-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      chatWindowDiv.style.display = 'none';
      sessionStorage.removeItem('ojo_chat_open');
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
    restoreChatState(chatHistoryDiv);
    initAmbientWhispers();
  }

  // ===== 2. DESKTOP MOUSE TRACKING PHYSICS =====
  function initDesktopTracking() {
    requestAnimationFrame(() => {
      botDiv.style.opacity = '1';
    });

    let isHovered = false;
    let mouseIdleTimer = null;
    let isHesitating = true;

    botDiv.addEventListener('mouseenter', () => { isHovered = true; });
    botDiv.addEventListener('mouseleave', () => { isHovered = false; });

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      isHesitating = true;
      if (mouseIdleTimer) clearTimeout(mouseIdleTimer);
      mouseIdleTimer = setTimeout(() => {
        isHesitating = false;
      }, 300);
    });

    function animate(timestamp) {
      if (window.innerWidth > 768) {
        if (!isHovered && chatWindowDiv.style.display !== 'flex') {
          const time = timestamp * 0.001;

          const dx = targetX - currentX;
          const dy = targetY - currentY;
          const dist = Math.hypot(dx, dy);

          const driftX = Math.sin(time * 1.2) * 12 + Math.cos(time * 0.7) * 6;
          const driftY = Math.cos(time * 0.9) * 12 + Math.sin(time * 0.4) * 6;

          if (dist > 210 && !isHesitating) {
            const destX = targetX + 90 + driftX;
            const destY = targetY + 60 + driftY;
            const lerpSpeed = 0.012;
            currentX += (destX - currentX) * lerpSpeed;
            currentY += (destY - currentY) * lerpSpeed;
          } else {
            currentX += (driftX * 0.05);
            currentY += (driftY * 0.05);
          }

          botDiv.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
          sessionStorage.setItem('ojo_x', currentX);
          sessionStorage.setItem('ojo_y', currentY);
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
    const text = 'need help??';
    let i = 0;

    if (typeWriterInterval) clearInterval(typeWriterInterval);

    typeWriterInterval = setInterval(() => {
      if (i < text.length) {
        greetingOverlay.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeWriterInterval);
        placeholderTimer = setTimeout(() => {
          greetingOverlay.style.transition = 'opacity 0.5s ease';
          greetingOverlay.style.opacity = '0';
          setTimeout(() => {
            greetingOverlay.style.display = 'none';
            inputArea.placeholder = "talk to me";
          }, 500);
        }, 9000); 
      }
    }, 70);
  }

  // ===== CHAT PERSISTENCE HELPERS =====
  function saveChatState(historyArea) {
    sessionStorage.setItem('ojo_chat_history', historyArea.innerHTML);
    sessionStorage.setItem('ojo_chat_open', 'true');
  }

  function restoreChatState(historyArea) {
    const savedHistory = sessionStorage.getItem('ojo_chat_history');
    const wasOpen = sessionStorage.getItem('ojo_chat_open');
    if (savedHistory) {
      historyArea.innerHTML = savedHistory;
      historyArea.scrollTop = historyArea.scrollHeight;
    }
    if (wasOpen === 'true') {
      chatWindowDiv.style.display = 'flex';
    }
  }

  // ===== 4. WORKER API CALL =====
  async function sendInputToWorker(inputArea, historyArea) {
    const text = inputArea.value.trim();
    if (!text) return;
    playOjoSound('blip');

    inputArea.value = '';

    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'margin-bottom: 8px; color: #66ccff; word-break: break-word;';
    userMsg.textContent = `You: ${text}`;
    historyArea.appendChild(userMsg);
    historyArea.scrollTop = historyArea.scrollHeight;
    saveChatState(historyArea);

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
          location: {
            title: document.title,
            pathname: window.location.pathname,
            hash: window.location.hash || '#top'
          },
          pageContext: (document.querySelector('main') || document.body).innerText.replace(/SEND/g, '').substring(0, 1500)
        })
      });
    
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      let replyText = data.response || data.reply || "No response received.";

      const navMatch = replyText.match(/\[NAVIGATE:\s*([^\]]+)\]/i);
      if (navMatch) {
        replyText = replyText.replace(navMatch[0], '').trim(); 
        setTimeout(() => window.location.href = navMatch[1].trim(), 2000); 
      }

      const openMatch = replyText.match(/\[OPEN:\s*([^\]]+)\]/i);
      if (openMatch) {
        replyText = replyText.replace(openMatch[0], '').trim(); 
        setTimeout(() => window.open(openMatch[1].trim(), '_blank'), 1200); 
      }

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
                'calendar': 'contact.html#calendar',
                'social': 'links.html',
                'socials': 'links.html',
                'social media': 'links.html',
                'instagram': 'https://www.instagram.com/tonemedina',
                'bluesky': 'https://bsky.app/profile/tonemedina.bsky.social',
                'wordpress': 'https://tonemedina.wordpress.com',
                'bio': 'bio.html',
                'biography': 'bio.html',
                'home': 'index.html'
              };

              if (routeMap[targetAction]) {
                if (routeMap[targetAction].startsWith('http')) {
                  window.open(routeMap[targetAction], '_blank');
                } else {
                  window.location.href = routeMap[targetAction];
                }
              }
            }
          }
        }, 2000);
      }

      botMsg.textContent = `¡Ojo!: ${replyText}`;
    } catch (err) {
      console.error('¡Ojo! Error:', err);
      botMsg.textContent = '¡Ojo!: Connection lost... try again.';
    }
    historyArea.scrollTop = historyArea.scrollHeight;
    saveChatState(historyArea);
  }

  // ===== 5. INTERACTION & TOUCH EVENT LISTENERS =====
  let leaveTimer = null;

  function addRedeyeListeners(historyArea, inputArea, greetingOverlay, sendBtn, headerDiv) {
    const toggleChat = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      playOjoSound('blip');
      
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

// ===== THE CHALK DUST DISSOLVE EASTER EGG =====
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject the fiery CSS animations
  const dissolveStyle = document.createElement('style');
  dissolveStyle.textContent = `
    @keyframes chalkDissolve {
      0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); filter: blur(0px); }
      20% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); filter: blur(0px); text-shadow: 0 0 10px #ff4500, 0 0 20px #ff0000; }
      70% { opacity: 1; transform: translateX(-50%) translateY(-15px) scale(1.1); filter: blur(2px); text-shadow: 0 0 20px #ff4500, 0 0 40px #ff0000; }
      100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(1.3); filter: blur(8px); text-shadow: none; color: transparent; }
    }
    .ojo-glyph {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 50px;
      color: #ff4500;
      opacity: 0;
      pointer-events: none;
      z-index: 1000001;
    }
    .ojo-glyph.dissolve-active {
      animation: chalkDissolve 3s ease-out forwards;
    }
    .redeye-agitated {
      box-shadow: 0 0 30px 15px rgba(255, 69, 0, 0.9), inset 0 0 15px rgba(255, 0, 0, 1) !important;
      border-color: #ff4500 !important;
      transition: all 0.2s ease !important;
    }
  `;
  document.head.appendChild(dissolveStyle);

// ===== THE HIGH-FIDELITY CHALK DUST DISSOLVE =====
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject the core glowing spiral style
  const dissolveStyle = document.createElement('style');
  dissolveStyle.textContent = `
    @keyframes glyphEmerge {
      0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
      30% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.1); text-shadow: 0 0 15px #ff4500, 0 0 30px #ff0000; }
      100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(1.1); text-shadow: 0 0 15px #ff4500; }
    }
    .ojo-glyph {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 55px;
      color: #ff4500;
      opacity: 0;
      pointer-events: none;
      z-index: 1000001;
    }
    .ojo-glyph.dissolve-active {
      animation: glyphEmerge 2.5s ease-out forwards;
    }
    .redeye-agitated {
      box-shadow: 0 0 40px 20px rgba(255, 69, 0, 0.9), inset 0 0 20px rgba(255, 0, 0, 1) !important;
      border-color: #ff4500 !important;
      transition: all 0.2s ease !important;
    }
  `;
  document.head.appendChild(dissolveStyle);

  const botDiv = document.getElementById('redeye-bot');
  if (botDiv) {
    // Add the spiral glyph
    const glyphDiv = document.createElement('div');
    glyphDiv.className = 'ojo-glyph';
    glyphDiv.innerHTML = '꩜'; 
    botDiv.appendChild(glyphDiv);

    function triggerChalkDissolve() {
      if (glyphDiv.classList.contains('dissolve-active')) return; 

      // Trigger bot flare and spiral emerge
      botDiv.classList.add('redeye-agitated'); 
      glyphDiv.classList.add('dissolve-active'); 
      
      const bubbleDiv = document.getElementById('ojo-ambient-bubble');
      if (bubbleDiv) {
        bubbleDiv.textContent = "this too, shall pass";
        bubbleDiv.style.opacity = '1';
      }

      // --- THE PARTICLE SYSTEM EXPLOSION ---
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      canvas.style.cssText = 'position:absolute; bottom: 20px; left: 50%; transform: translateX(-50%); pointer-events:none; z-index:1000002;';
      botDiv.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      let particles = [];
      // Generate 120 particles
      for(let i=0; i<120; i++) {
        particles.push({
          x: 150, // Center of canvas
          y: 220, // Starting height (near the orb)
          vx: (Math.random() - 0.5) * 6, // Explode left/right
          vy: (Math.random() * -6) - 2,  // Explode upwards
          life: Math.random() * 0.8 + 0.5,
          size: Math.random() * 4 + 1.5,
          color: ['#ff4500', '#ff0000', '#ff8c00', '#ff3333'][Math.floor(Math.random() * 4)]
        });
      }

      function animateParticles() {
        ctx.clearRect(0, 0, 300, 300);
        let allDead = true;
        
        particles.forEach(p => {
          if (p.life > 0) {
            allDead = false;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
            
            // Apply physics: drift, rise, shrink, and fade
            p.x += p.vx + (Math.sin(p.life * 10) * 0.5); // Slight wind effect
            p.y += p.vy;
            p.life -= 0.015; // Speed of fade
            p.size *= 0.94;  // Speed of shrinking
          }
        });

        if (!allDead) {
          requestAnimationFrame(animateParticles);
        } else {
          canvas.remove(); // Cleanup when finished
        }
      }
      
      // Delay the particle explosion by a fraction of a second so the spiral emerges first
      setTimeout(() => { requestAnimationFrame(animateParticles); }, 300);

      // Reset bot state
      setTimeout(() => {
        botDiv.classList.remove('redeye-agitated');
        glyphDiv.classList.remove('dissolve-active');
        if (bubbleDiv) bubbleDiv.style.opacity = '0';
      }, 3500);
    }

    // Attach to subtitle
    const archiveTrigger = document.querySelector('.archive-trigger');
    if (archiveTrigger) {
      archiveTrigger.addEventListener('mouseenter', triggerChalkDissolve);
      archiveTrigger.addEventListener('click', triggerChalkDissolve);
    }

});
