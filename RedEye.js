/* ===== TONE MEDINA'S REDEYE AI COMPANION (BOT UI & LOGIC) ===== */
(function() {
  // Use a IIFE to prevent variable collision with main.js
  const BOT_ENDPOINT = 'https://redeye.antsmedina.workers.dev/'; // Your specific worker endpoint

  let chatMessages = []; // Local history
  const botDiv = document.createElement('div');
  const chatWindowDiv = document.createElement('div');
  const botInputDiv = document.createElement('div');
  const closeChatBtn = document.createElement('div');
  let isBotMuted = false;

  // ===== 1. CORE BLACK HOLE BODY & GLOW =====
  function createBotUi() {
    // Style the main hollow circle bot
    botDiv.id = 'redeye-bot';
    botDiv.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      background: rgba(0, 0, 0, 0.9);
      border: 3px solid #8B0000; /* Deep Red Border */
      border-radius: 50%;
      cursor: pointer;
      z-index: 999999;
      pointer-events: auto; /* Allow mouse events */
      box-shadow: 0 0 25px 12px rgba(139, 0, 0, 0.7); /* Deep Red Glow */
      transition: box-shadow 0.3s ease;
    `;
    
    botDiv.title = 'Redeye'; // Tooltip

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
      border: 1px solid rgba(139, 0, 0, 0.5); /* Deep Red Hint */
      border-radius: 8px;
      display: none; /* Starts hidden */
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

    // Input Area (Textarea)
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

  // ===== 2. MOUSE FOLLOWING LOGIC =====
  function followMouse(e) {
    if (!botDiv || isBotMuted) return; // Don't move if not listening or open

    // Adjust position to center the bot
    const botX = e.clientX - 20; 
    const botY = e.clientY - 20;

    botDiv.style.transform = `translate(${botX}px, ${botY}px)`;
  }

  // ===== 3. CHAT INTERACTION LOGIC =====
  function addRedeyeListeners(historyArea, inputArea) {
    // Open chat on bot click
    botDiv.addEventListener('click', () => {
      chatWindowDiv.style.display = 'flex';
      isBotMuted = true; // Stop following mouse
    });

    // Close chat
    closeChatBtn.addEventListener('click', () => {
      chatWindowDiv.style.display = 'none';
      isBotMuted = false; // Resume mouse following
    });

    // Send input on Enter (Shift+Enter for newline)
    inputArea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendInputToWorker(inputArea, historyArea);
      }
    });
  }

  // Helper to append messages to UI
  function appendMessageToHistory(sender, text, historyArea) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `margin-bottom: 0.75rem; color: ${sender === 'user' ? '#eee' : '#A00'};`; // AI text is deep red
    msgDiv.innerHTML = `<strong style="text-transform: capitalize;">${sender}:</strong> ${text}`;
    historyArea.appendChild(msgDiv);
    historyArea.scrollTop = historyArea.scrollHeight; // Auto-scroll
  }

  // Talk to the worker brain
  async function sendInputToWorker(inputArea, historyArea) {
    const userInput = inputArea.value.trim();
    if (!userInput) return;

    inputArea.value = ''; // Clear input
    inputArea.disabled = true; // Lock while loading
    
    appendMessageToHistory('user', userInput, historyArea);
    chatMessages.push({ role: 'user', content: userInput }); // History for AI

    try {
      const response = await fetch(BOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages })
      });

      const data = await response.json();
      const botResponse = data.conceptDescription || 'I am processing that...';

      appendMessageToHistory('redeye', botResponse, historyArea);
      chatMessages.push({ role: 'assistant', content: botResponse }); // History for next time
    } catch (err) {
      appendMessageToHistory('redeye', 'Sorry, I lost my connection.', historyArea);
    } finally {
      inputArea.disabled = false; // Unlock
      inputArea.focus();
    }
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    createBotUi();
    document.addEventListener('mousemove', followMouse); // Start following
  });

})();
