/* ===== TONE MEDINA'S REDEYE / ¡OJO! AI COMPANION ===== */
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

    // State & Timer Variables for Typing Animation
    let typeWriterInterval = null;
    let placeholderTimer = null;

    // ===== Helper: Typing Animation =====
    function typeWriter(element, text, speed, callback) {
        if (typeWriterInterval) clearInterval(typeWriterInterval);
        let charIndex = 0;
        element.innerHTML = ''; // Clear before starting
        typeWriterInterval = setInterval(() => {
            if (charIndex < text.length) {
                element.innerHTML += text.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typeWriterInterval);
                if (callback) callback(); // Run transition after finish
            }
        }, speed); // `speed` in ms per char
    }

    // ===== Helper: Page-Specific Greeting Transition =====
    function triggerGreeting(greetingOverlay, inputArea) {
        // 1. Clear all animation timers immediately
        if (placeholderTimer) clearTimeout(placeholderTimer);
        if (typeWriterInterval) clearInterval(typeWriterInterval);

        // 2. Reset visual elements
        greetingOverlay.innerHTML = '';
        greetingOverlay.style.transition = 'none'; // remove fade transition
        greetingOverlay.style.opacity = '1';
        greetingOverlay.style.display = 'block'; // Show overlay
        inputArea.placeholder = ''; // Clear textarea placeholder while typing

        // 3. Get the dynamic greeting
        const path = window.location.pathname.toLowerCase();
        let greetingText = "I'm watching you...";
        if (path.includes('works')) greetingText = "looking at the works?";
        else if (path.includes('bio')) greetingText = "curious about Tone?";
        else if (path.includes('news')) greetingText = "checking what's next?";
        else if (path.includes('contact')) greetingText = "ready to reach out?";

        // 4. Start typing animation on the overlay
        typeWriter(greetingOverlay, greetingText, 100, () => { // callback runs after finish
            // 5. Short pause after typing finishes, then initiate transition
            placeholderTimer = setTimeout(() => {
                // optional: fade out overlay for smoothness
                greetingOverlay.style.transition = 'opacity 0.5s ease';
                greetingOverlay.style.opacity = '0';

                // 6. Set final textarea placeholder and completely hide overlay
                placeholderTimer = setTimeout(() => {
                    greetingOverlay.style.display = 'none'; // remove from display
                    inputArea.placeholder = "it's ok, talk to me"; // reveal main placeholder
                }, 500); // must match fade transition duration
            }, 1200); // 1.2s human breath pause
        });
    }

    // ===== 1. CORE BLACK HOLE BODY & GLOW & UI =====
    function createBotUi() {
        // Load VT323 WOPR mainframe font dynamically
        if (!document.getElementById('wopr-font')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'wopr-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
            document.head.appendChild(fontLink);
        }

        botDiv.id = 'redeye-bot';

        // Check if device is mobile width
        const isMobile = window.innerWidth <= 768;

        botDiv.style.cssText = `
            position: fixed;
            ${isMobile ? 'bottom: 25px; right: 25px;' : 'top: 0; left: 0;'}
            width: 44px;
            height: 44px;
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #8B0000;
            border-radius: 50%;
            cursor: pointer;
            z-index: 999999;
            pointer-events: auto;
            box-shadow: 0 0 20px 8px rgba(139, 0, 0, 0.75);
            transition: box-shadow 0.3s ease, transform 0.05s linear;
            will-change: transform;
        `;
        botDiv.title = '¡Ojo!';

        // Responsive Chat Window Container
        chatWindowDiv.id = 'redeye-chat-window';
        chatWindowDiv.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: calc(100vw - 40px);
            max-width: 340px;
            height: 380px;
            max-height: 65vh;
            background: rgba(10, 10, 10, 0.95);
            color: #fff;
            border: 1px solid rgba(139, 0, 0, 0.5);
            border-radius: 12px;
            display: none;
            z-index: 1000000;
            box-shadow: 0 5px 30px rgba(0,0,0,0.85);
            padding: 1rem;
            flex-direction: column;
            font-family: 'VT323', 'Courier New', monospace;
            font-size: 1.05rem;
            letter-spacing: 0.05em;
            box-sizing: border-box;
        `;

        closeChatBtn.innerHTML = '✕';
        closeChatBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; cursor: pointer; color: #aaa; font-size: 16px; padding: 5px;';
        chatWindowDiv.appendChild(closeChatBtn);

        // Chat History Area
        const chatHistoryDiv = document.createElement('div');
        chatHistoryDiv.id = 'redeye-history';
        chatHistoryDiv.style.cssText = 'flex-grow: 1; overflow-y: auto; margin-bottom: 1rem; padding-right: 5px;';
        chatWindowDiv.appendChild(chatHistoryDiv);

        // Input Area Container for absolute positioning
        botInputDiv.id = 'redeye-input-container';
        botInputDiv.style.cssText = 'position: relative; width: 100%; height: 60px;';

        // 1. New: Absolutely Positioned Greeting Overlay Div
        const greetingOverlay = document.createElement('div');
        greetingOverlay.id = 'redeye-greeting-overlay';
        // Matches inputArea typography and padding, positioned at TOP-LEFT
        greetingOverlay.style.cssText = `
            position: absolute;
            top: 6px; /* Match input padding to align with text start */
            left: 6px;
            color: #aaa; /* classic terminal silver-gray */
            font-family: 'VT323', monospace;
            font-size: 0.95rem;
            letter-spacing: 0.05em;
            pointer-events: none; /* Let clicks pass through to the textarea */
            white-space: pre-wrap; /* handle potential newlines */
            z-index: 2; /* ensure it is over the textarea */
        `;

        // 2. The standard textarea for user input
        const inputArea = document.createElement('textarea');
        inputArea.id = 'redeye-textarea';
        // Base styles with NO placeholder and matching padding
        inputArea.style.cssText = 'width: 100%; height: 100%; background: transparent; color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; resize: none; font-family: inherit; font-size: 0.95rem; display: block; box-sizing: border-box; position: absolute; top: 0; left: 0; z-index: 1;';
        inputArea.placeholder = ''; // start empty

        botInputDiv.appendChild(inputArea);
        botInputDiv.appendChild(greetingOverlay); // overlay is conceptually "on top"
        chatWindowDiv.appendChild(botInputDiv);

        document.body.appendChild(botDiv);
        document.body.appendChild(chatWindowDiv);

        addRedeyeListeners(chatHistoryDiv, inputArea, greetingOverlay);
    }

    // ===== 2. MOUSE TRACKING WITH DYNAMIC NATURAL DISTANCE & CURIOSITY =====
    function trackMouse(e) {
        if (isBotMuted || window.innerWidth <= 768) return; // Skip tracking on mobile
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
        if (!isBotMuted && botDiv && window.innerWidth > 768) {
            const currentLerp = effectiveOffset < 100 ? 0.008 : LERP_SPEED;
            currentX += (targetX - currentX) * currentLerp;
            currentY += (targetY - currentY) * currentLerp;
            botDiv.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
        requestAnimationFrame(animateLoop);
    }

    // ===== 3. CHAT INTERACTION LOGIC =====
    let leaveTimer = null;

    function addRedeyeListeners(historyArea, inputArea, greetingOverlay) {
        const toggleChat = (e) => {
            e.stopPropagation();
            if (leaveTimer) clearTimeout(leaveTimer);
            const isOpening = chatWindowDiv.style.display !== 'flex';
            chatWindowDiv.style.display = isOpening ? 'flex' : 'none';
            isBotMuted = isOpening;

            if (isOpening) {
                // Re-trigger the page-aware typing animation on open
                triggerGreeting(greetingOverlay, inputArea);
            }
        };

        botDiv.addEventListener('click', toggleChat);
        botDiv.addEventListener('touchstart', toggleChat, { passive: true });

        // Close button
        closeChatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (leaveTimer) clearTimeout(leaveTimer);
            chatWindowDiv.style.display = 'none';
            isBotMuted = false;
        });

        // Prevent clicks inside chat window from bubbling up
        chatWindowDiv.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Mouse leaves the chat window -> Start 4-second delay before closing
        chatWindowDiv.addEventListener('mouseleave', () => {
            leaveTimer = setTimeout(() => {
                chatWindowDiv.style.display = 'none';
                isBotMuted = false;
            }, 4000);
        });

        // Mouse re-enters the chat window -> Cancel the closing timer
        chatWindowDiv.addEventListener('mouseenter', () => {
            if (leaveTimer) clearTimeout(leaveTimer);
        });

        // Click anywhere outside on document to close immediately
        document.addEventListener('click', () => {
            if (chatWindowDiv.style.display === 'flex') {
                if (leaveTimer) clearTimeout(leaveTimer);
                chatWindowDiv.style.display = 'none';
                isBotMuted = false;
            }
        });

        inputArea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (leaveTimer) clearTimeout(leaveTimer);
                sendInputToWorker(inputArea, historyArea);
            }
        });

        // 2. New: Listener to clear greeting overlay if user clicks to type
        const clearOverlayOnInteraction = () => {
            if (greetingOverlay.style.display !== 'none') {
                // Halt typing and transition immediately
                if (typeWriterInterval) clearInterval(typeWriterInterval);
                if (placeholderTimer) clearTimeout(placeholderTimer);

                // Hide overlay and reveal standard placeholder
                greetingOverlay.style.display = 'none';
                inputArea.placeholder = "it's ok, talk to me";
            }
        };

        inputArea.addEventListener('focus', clearOverlayOnInteraction);
        inputArea.addEventListener('click', clearOverlayOnInteraction);
    }

    function appendMessageToHistory(sender, text, historyArea) {
        const msgDiv = document.createElement('div');
        const isUser = sender === 'user';
        const displayName = isUser ? 'You' : '¡Ojo!';

        // Light gray for ¡Ojo! text, silver gray for user prompt
        const userColor = '#aaa';
        const botColor = '#e0e0e0';

        // Set response font size to 1.05rem
        msgDiv.style.cssText = `margin-bottom: 0.75rem; color: ${isUser ? userColor : botColor}; font-size: 1.05rem; line-height: 1.35;`;

        // ¡Ojo! label is highlighted in red (#ff3333)
        msgDiv.innerHTML = `<strong style="color: ${isUser ? '#888' : '#ff3333'};">${displayName}:</strong> ${text}`;

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

        // Scrape visible page text so ¡Ojo! knows what the user is looking at
        const pageContext = document.body.innerText.substring(0, 3000);

        try {
            const response = await fetch(BOT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: chatMessages,
                    pageContext: pageContext
                })
            });

            const data = await response.json();

            let botResponse = '';
            if (data.conceptDescription) {
                botResponse = data.conceptDescription;
            } else if (data.response) {
                botResponse = typeof data.response === 'string' ? data.response : data.response.response;
            } else if (data.text) {
                botResponse = data.text;
            } else if (data.error) {
                botResponse = `Error: ${data.error}`;
            } else {
                botResponse = JSON.stringify(data);
            }

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
