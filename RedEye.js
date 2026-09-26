/* ===== TONE MEDINA'S REDEYE AI COMPANION (SMOOTH FLOAT & TEASE) ===== */
(function() {
  const BOT_ENDPOINT = 'https://redeye.antsmedina.workers.dev/';

  let chatMessages = [];
  const botDiv = document.createElement('div');
  const chatWindowDiv = document.createElement('div');
  const botInputDiv = document.createElement('div');
  const closeChatBtn = document.createElement('div');
  let isBotMuted = false;

  // Mouse tracking targets vs current bot positions (for smooth lerp)
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  // Config parameters for "watching/teasing" motion:
  const LERP_SPEED = 0.035; // Lower number = slower, smoother float (e.g. 0.02 - 0.05)
  const OFFSET_DISTANCE = 45; // Distance (px) the bot stays away from exact cursor center

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
    inputArea.placeholder = 'How can I help you today?';
    botInputDiv.appendChild(inputArea);
    chatWindowDiv.appendChild(botInputDiv);

    document.body.appendChild(botDiv);
    document.body.appendChild(chatWindowDiv);
    
    addRedeyeListeners(chatHistoryDiv, inputArea);
  }

  // ===== 2. MOUSE TRACKING & SMOOTH LERP ANIMATION =====
  function trackMouse(e) {
    if (isBotMuted) return;

    // Calculate angle from bot to cursor so it hovers slightly off-center
    const dx = e.clientX - currentX;
    const dy = e.clientY - currentY;
    const angle = Math.atan2(dy, dx);

    // Target position maintains an offset distance so it doesn't sit underfoot
    targetX = e.clientX - Math.cos(angle) * OFFSET_DISTANCE - 20;
    targetY = e.clientY - Math.sin(angle) * OFFSET_DISTANCE - 20;
  }

  function animateLoop() {
    if (!isBotMuted && botDiv) {
      // Smoothly interpolate current position toward target position
      currentX += (targetX - currentX) * LERP_SPEED;
      currentY += (targetY - currentY) * LERP_SPEED;

      botDiv.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
    requestAnimationFrame(animateLoop);
  }

  // ===== 3. CHAT INTERACTION LOGIC =====
  function addRedeyeListeners(historyArea, inputArea) {
    botDiv.addEventListener('click', () => {
      chatWindowDiv.style.display = 'flex';
      isBotMuted = true;
    });

    closeChatBtn.addEventListener('click', () => {
      chatWindowDiv.style.display = 'none';
      isBotMuted = false;
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
    msgDiv.style.cssText = `margin-bottom: 0.75rem; color: ${sender === 'user' ? '#eee' : '#A00'};`;
    msgDiv.innerHTML = `<strong style="text-transform: capitalize;">${sender}:</strong> ${text}`;
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
    requestAnimationFrame(animateLoop); // Continuous smooth movement loop
  });

})();
