/* ===== TONE MEDINA'S REDEYE / ¡OJO! AI COMPANION ===== */
(function () {
  const BOT_ENDPOINT = 'https://redeye.antsmedina.workers.dev';
  let chatMessages = [];
  let isChatOpen = false;

  // ===== Helper: Inject CSS Styles =====
  function injectStyles() {
    if (document.getElementById('redeye-styles')) return;
    const style = document.createElement('style');
    style.id = 'redeye-styles';
    style.textContent = `
      @keyframes redeyeBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .redeye-blink-cursor {
        display: inline-block;
        width: 8px;
        height: 15px;
        background-color: #ff0000;
        margin-left: 2px;
        vertical-align: middle;
        animation: redeyeBlink 0.8s infinite;
      }
      #redeye-widget {
        position: fixed;
        bottom: 25px;
        right: 25px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: radial-gradient(circle, #ff3333 20%, #990000 70%, #330000 100%);
        box-shadow: 0 0 15px rgba(255, 0, 0, 0.7), inset 0 0 10px rgba(0, 0, 0, 0.8);
        cursor: pointer;
        z-index: 99999;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #redeye-widget:hover {
        transform: scale(1.1);
        box-shadow: 0 0 25px rgba(255, 0, 0, 0.9), inset 0 0 12px rgba(255, 50, 50, 0.9);
      }
      #redeye-pupil {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #000;
        box-shadow: inset 0 0 4px #ff0000;
        pointer-events: none;
        transition: transform 0.05s ease-out;
      }
      #redeye-chat-window {
        position: fixed;
        bottom: 90px;
        right: 25px;
        width: 340px;
        max-width: calc(100vw - 40px);
        height: 440px;
        background: rgba(10, 10, 10, 0.95);
        border: 1px solid #ff3333;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.4);
        display: none;
        flex-direction: column;
        z-index: 99998;
        font-family: 'Courier New', monospace;
        color: #eee;
        overflow: hidden;
      }
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
      #redeye-messages {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-size: 13px;
        line-height: 1.4;
      }
      .redeye-msg {
        max-width: 85%;
        padding: 8px 12px;
        border-radius: 6px;
        word-wrap: break-word;
      }
      .redeye-msg-user {
        align-self: flex-end;
        background: #330000;
        color: #fff;
        border: 1px solid #660000;
      }
      .redeye-msg-bot {
        align-self: flex-start;
        background: #111;
        color: #ffb3b3;
        border: 1px solid #440000;
      }
      #redeye-input-container {
        display: flex;
        padding: 10px;
        border-top: 1px solid #333;
        background: #050505;
      }
      #redeye-input {
        flex: 1;
        background: #111;
        border: 1px solid #444;
        color: #fff;
        padding: 8px;
        border-radius: 4px;
        font-family: inherit;
        font-size: 13px;
        outline: none;
      }
      #redeye-input:focus {
        border-color: #ff3333;
      }
      #redeye-send-btn {
        background: #800000;
        color: #fff;
        border: none;
        padding: 8px 14px;
        margin-left: 8px;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        font-weight: bold;
      }
      #redeye-send-btn:hover {
        background: #b30000;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== Create Widget DOM Elements =====
  function initWidget() {
    injectStyles();

    const botDiv = document.createElement('div');
    botDiv.id = 'redeye-widget';
    botDiv.title = '¡Ojo!';

    const pupilDiv = document.createElement('div');
    pupilDiv.id = 'redeye-pupil';
    botDiv.appendChild(pupilDiv);

    const chatWindowDiv = document.createElement('div');
    chatWindowDiv.id = 'redeye-chat-window';

    const headerDiv = document.createElement('div');
    headerDiv.id = 'redeye-header';
    headerDiv.innerHTML = '<span>¡OJO! ASSISTANT</span><span id="redeye-close-btn">✕</span>';

    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'redeye-messages';

    const inputContainer = document.createElement('div');
    inputContainer.id = 'redeye-input-container';

    const inputEl = document.createElement('input');
    inputEl.id = 'redeye-input';
    inputEl.type = 'text';
    inputEl.placeholder = 'Ask ¡Ojo!...';

    const sendBtn = document.createElement('button');
    sendBtn.id = 'redeye-send-btn';
    sendBtn.textContent = 'Send';

    inputContainer.appendChild(inputEl);
    inputContainer.appendChild(sendBtn);

    chatWindowDiv.appendChild(headerDiv);
    chatWindowDiv.appendChild(messagesDiv);
    chatWindowDiv.appendChild(inputContainer);

    document.body.appendChild(botDiv);
    document.body.appendChild(chatWindowDiv);

    // Toggle Chat Window
    botDiv.addEventListener('click', () => {
      isChatOpen = !isChatOpen;
      chatWindowDiv.style.display = isChatOpen ? 'flex' : 'none';
      if (isChatOpen) inputEl.focus();
    });

    headerDiv.querySelector('#redeye-close-btn').addEventListener('click', () => {
      isChatOpen = false;
      chatWindowDiv.style.display = 'none';
    });

    // Eye Pupil Mouse Tracking
    window.addEventListener('mousemove', (e) => {
      const rect = botDiv.getBoundingClientRect();
      const eyeX = rect.left + rect.width / 2;
      const eyeY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
      const distance = Math.min(10, Math.hypot(e.clientX - eyeX, e.clientY - eyeY) / 15);
      const pupilX = Math.cos(angle) * distance;
      const pupilY = Math.sin(angle) * distance;
      pupilDiv.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
    });

    // Message Sending Logic
    async function sendMessage() {
      const text = inputEl.value.trim();
      if (!text) return;

      // Add user message to UI
      const userMsgEl = document.createElement('div');
      userMsgEl.className = 'redeye-msg redeye-msg-user';
      userMsgEl.textContent = text;
      messagesDiv.appendChild(userMsgEl);

      chatMessages.push({ role: 'user', content: text });
      inputEl.value = '';
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      // Add Bot Loading Placeholder
      const botMsgEl = document.createElement('div');
      botMsgEl.className = 'redeye-msg redeye-msg-bot';
      botMsgEl.textContent = 'Thinking...';
      messagesDiv.appendChild(botMsgEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      try {
        const response = await fetch(BOT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chatMessages })
        });

        const data = await response.json();
        let replyText = data.reply || data.response || 'No response received.';
        chatMessages.push({ role: 'assistant', content: replyText });

        // Check if the AI wants to trigger an action or navigate to a header link
        const actionMatch = replyText.match(/\[ACTION:\s*([^\]]+)\]/i);
        if (actionMatch) {
          const targetAction = actionMatch[1].trim().toLowerCase();
          replyText = replyText.replace(actionMatch[0], '').trim();

          setTimeout(() => {
            // 1. Search for any matching navigation link or button by text content
            const navLinks = Array.from(document.querySelectorAll('header a, nav a, .nav-link, button, a'));
            const matchedEl = navLinks.find(el => {
              const text = el.textContent.trim().toLowerCase();
              return text === targetAction || text.replace(/\s+/g, '') === targetAction.replace(/\s+/g, '');
            });

            if (matchedEl) {
              matchedEl.click();
            } else {
              // 2. Fallback routing if text matching isn't exact or target is a page section
              const routeMap = {
                'art': 'works.html',
                'artwork': 'works.html',
                'works': 'works.html',
                'gallery': 'works.html',
                'archives': 'works.html#archives',
                'archive': 'works.html#archives',
                'news': 'news.html',
                'contact': 'contact.html',
                'links': 'links.html',
                'bio': 'bio.html',
                'biography': 'bio.html',
                'home': 'index.html'
              };

              if (routeMap[targetAction]) {
                const dest = routeMap[targetAction];
                if (dest.includes('#')) {
                  const [page, hash] = dest.split('#');
                  const targetSection = document.getElementById(hash) || document.querySelector(`.${hash}`);
                  if (window.location.pathname.endsWith(page) && targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = dest;
                  }
                } else {
                  window.location.href = dest;
                }
              }
            }
          }, 1200);
        }

        botMsgEl.textContent = replyText;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } catch (err) {
        botMsgEl.textContent = 'Error connecting to ¡Ojo!. Please try again.';
        console.error('¡Ojo! error:', err);
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
