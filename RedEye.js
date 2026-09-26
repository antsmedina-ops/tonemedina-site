/* ===== TONE MEDINA'S REDEYE AI COMPANION ===== */
(function() {
  const BOT_ENDPOINT = 'https://redeye.antsmedina.workers.dev/';

  let chatMessages = [];
  const botDiv = document.createElement('div');
  const chatWindowDiv = document.createElement('div');
  const botInputDiv = document.createElement('div');
  const closeChatBtn = document.createElement('div');
  let isBotMuted = false;

  // Mouse tracking targets & state variables
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  // Movement Config
  const LERP_SPEED = 0.015;
  const BASE_OFFSET = 400; // Hovering distance

  let time = 0;
  let effectiveOffset = BASE_OFFSET;

  // ===== 1. CORE BLACK HOLE BODY & GLOW =====
  function createBotUi() {
    botDiv.id = 'redeye-bot';
    botDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 40px;
      height: 40px;
      background: rgba(0, 0, 0, 0.95);
      border: 3px solid #8B0000;
      border-radius: 50%;
      cursor: pointer;
      z-index: 999999;
      pointer-events: auto;
      box-shadow: 0 0 25px 12px rgba(139, 0, 0, 0.75);
      transition: box-shadow 0.3s ease, transform 0.05s linear;
      will-change: transform;
    `;
    
    botDiv.title = 'Redeye';

    // Chat Window Container
    chatWindowDiv.id = 'redeye-chat-window';
    chatWindowDiv.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 30px;
      width: 320px;
      height: 400px;
      background: rgba(10, 10, 10, 0.95);
      color: #fff;
      border: 1px solid rgba(139, 0, 0, 0.5);
      border-radius: 8px;
      display: none;
      z-index: 1000000;
      box-shadow: 0 5px 30px rgba(0,0,0,0.8);
      padding: 1rem;
      flex-direction: column;
      font-family: 'SFMono-Regular', Consolas, monospace;
    `;
    
    closeChatBtn.innerHTML = '✕';
    closeChatBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; cursor: pointer; color: #aaa;';
    chatWindowDiv.appendChild(closeChatBtn);

    // Chat History Area
    const chatHistoryDiv = document.createElement('div');
    chatHistoryDiv.id = 'redeye-history';
    chatHistoryDiv.style.cssText = 'flex-grow: 1; overflow-y: auto; margin-bottom: 1rem; padding-right: 5px;';
    chatWindowDiv.appendChild(chatHistoryDiv);

    // Input Area
    botInputDiv.id = 'redeye-input';
    const inputArea = document.createElement('textarea');
    inputArea.style.cssText = 'width: 100%; height: 60px; background: transparent; color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 5px; resize: none;';
    
    // Dynamic organic placeholder sequence
    inputArea.placeholder = "I've been watching you";
    setTimeout(() => {
      inputArea.placeholder = ""; // Brief clear pause
      setTimeout(() => {
        inputArea.placeholder = "have a question?";
      }, 500);
    }, 7500);

    botInputDiv.appendChild(inputArea);
    chatWindowDiv.appendChild(botInputDiv);

    document.body.appendChild(botDiv);
    document.body.appendChild(chatWindowDiv);
    
    addRedeyeListeners(chatHistoryDiv, inputArea);
  }

  // ===== 2. MOUSE TRACKING WITH DYNAMIC NATURAL DISTANCE & CURIOSITY =====
  function trackMouse(e) {
    if (isBotMuted) return;

    const dx = e.clientX - currentX;
    const dy = e.clientY - currentY;
    const distanceToCursor = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const breathingOffset = BASE_OFFSET + Math.sin(time * 0.02) * 25;

    // Curiosity detection: collapse offset toward 30px when cursor approaches
    if (distanceToCursor < 450) {
      effectiveOffset += (30 - effectiveOffset) * 0.08;
    } else {
      effectiveOffset += (breathingOffset - effectiveOffset) * 0.03;
    }

    const wanderX = Math.cos(time * 0.015) * 15;
    const wanderY = Math.sin(time * 0.025) * 15;

    targetX = e.clientX - Math.cos(angle) * effectiveOffset + wanderX - 20;
    targetY = e.clientY - Math.sin(angle) * effectiveOffset + wanderY - 20;
  }

  function animateLoop() {
    time++;
    if (!isBotMuted && botDiv) {
      const currentLerp = effectiveOffset < 100 ? 0.008 : LERP_SPEED;
      currentX += (targetX - currentX) * currentLerp;
      currentY += (targetY - currentY) * currentLerp;
      botDiv.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
    requestAnimationFrame(animateLoop);
  }

 // ===== 3. CHAT INTERACTION LOGIC =====
  function addRedeyeListeners(historyArea, inputArea) {
    botDiv.addEventListener('click', (e) => {
      e.stopPropagation(); // Stops click from bubbling up to document
      chatWindowDiv.style.display = 'flex';
      isBotMuted = true;
    });

    closeChatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chatWindowDiv.style.display = 'none';
      isBotMuted = false;
    });

    // Prevent clicks inside the chat window from closing it
    chatWindowDiv.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Clicks anywhere else on the document will close the window
    document.addEventListener('click', () => {
      if (chatWindowDiv.style.display === 'flex') {
        chatWindowDiv.style.display = 'none';
        isBotMuted = false;
      }
    });

    inputArea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendInputToWorker(inputArea, historyArea);
      }
    });
  }
 function appendMessageToHistory(sender, text, historyArea) {
  const msgDiv = document.createElement('div');
  const isUser = sender === 'user';
  const displayName = isUser ? 'You' : '¡Ojo!';
  
  msgDiv.style.cssText = `margin-bottom: 0.75rem; color: ${isUser ? '#eee' : '#A00'};`;
  msgDiv.innerHTML = `<strong>${displayName}:</strong> ${text}`;
  historyArea.appendChild(msgDiv);
  historyArea.scrollTop = historyArea.scrollHeight;
}

  async function sendInputToWorker(inputArea, historyArea) {
    const userInput = inputArea.value.trim();
    if (!userInput) return;

    inputArea.value = '';
    inputArea.disabled = true;
    
    appendMessageToHistory('user', userInput, historyArea);
    chatMessages.push({ role: 'user', content: userInput });

    try {
      const response = await fetch(BOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages })
      });

      const data = await response.json();
      const botResponse = data.conceptDescription || 'I am processing that...';

      appendMessageToHistory('redeye', botResponse, historyArea);
      chatMessages.push({ role: 'assistant', content: botResponse });
    } catch (err) {
      appendMessageToHistory('redeye', 'Sorry, I lost my connection.', historyArea);
    } finally {
      inputArea.disabled = false;
      inputArea.focus();
    }
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    createBotUi();
    document.addEventListener('mousemove', trackMouse);
    requestAnimationFrame(animateLoop);
  });

})();
