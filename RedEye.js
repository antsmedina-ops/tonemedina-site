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

    // ===== Helper: Inject Cursor Blink Animation =====
    function injectCursorStyle() {
        if (!document.getElementById('redeye-cursor-style')) {
            const style = document.createElement('style');
            style.id = 'redeye-cursor-style';
            style.textContent = `
                @keyframes redeyeBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .redeye-blink-cursor {
                    display: inline-block;
                    margin-left: 3px;
                    color: #ff3333;
                    font-weight: bold;
                    animation: redeyeBlink 0.8s infinite;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== Helper: Typing Animation with Blinking Cursor =====
    function typeWriter(element, text, speed, callback) {
        if (typeWriterInterval) clearInterval(typeWriterInterval);
        let charIndex = 0;
        element.innerHTML = '<span class="redeye-blink-cursor">█</span>';
        
        typeWriterInterval = setInterval(() => {
            if (charIndex < text.length) {
                element.innerHTML = text.substring(0, charIndex + 1) + '<span class="redeye-blink-cursor">█</span>';
                charIndex++;
            } else {
                clearInterval(typeWriterInterval);
                if (callback) callback();
            }
        }, speed);
    }

    // ===== Helper: Page-Specific Greeting Transition =====
    function triggerGreeting(greetingOverlay, inputArea) {
        if (placeholderTimer) clearTimeout(placeholderTimer);
        if (typeWriterInterval) clearInterval(typeWriterInterval);

        greetingOverlay.innerHTML = '';
        greetingOverlay.style.transition = 'none';
        greetingOverlay.style.opacity = '1';
        greetingOverlay.style.display = 'block';
        inputArea.placeholder = '';

        const path = window.location.pathname.toLowerCase();
        let greetingText = "I'm watching you...";
        if (path.includes('works')) greetingText = "looking at the works?";
        else if (path.includes('bio')) greetingText = "curious about Tone?";
        else if (path.includes('news')) greetingText = "checking what's next?";
        else if (path.includes('contact')) greetingText = "ready to reach out?";

        typeWriter(greetingOverlay, greetingText, 70);
    }

    // ===== 1. CORE BLACK HOLE BODY & GLOW & UI =====
    function createBotUi() {
        injectCursorStyle();

        if (!document.getElementById('wopr-font')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'wopr-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
            document.head.appendChild(fontLink);
        }

        botDiv.id = 'redeye-bot';
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

        const chatHistoryDiv = document.createElement('div');
        chatHistoryDiv.id = 'redeye-history';
        chatHistoryDiv.style.cssText = 'flex-grow: 1; overflow-y: auto; margin-bottom: 1rem; padding-right: 5px;';
        chatWindowDiv.appendChild(chatHistoryDiv);

        botInputDiv.id = 'redeye-input-container';
        botInputDiv.style.cssText = 'position: relative; width: 100%; height: 60px;';

        const greetingOverlay = document.createElement('div');
        greetingOverlay.id = 'redeye-greeting-overlay';
        greetingOverlay.style.cssText = `
            position: absolute;
            top: 6px;
            left: 6px;
            color: #aaa;
            font-family: 'VT323', monospace;
            font-size: 0.95rem;
            letter-spacing: 0.05em;
            pointer-events: none;
            white-space: pre-wrap;
            z-index: 2;
        `;

        const inputArea = document.createElement('textarea');
        inputArea.id = 'redeye-textarea';
        inputArea.style.cssText = 'width: 100%; height: 100%; background: transparent; color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; resize: none; font-family: inherit; font-size: 0.95rem; display: block; box-sizing: border-box; position: absolute; top: 0; left: 0; z-index: 1;';
        inputArea.placeholder = '';

        botInputDiv.appendChild(inputArea);
        botInputDiv.appendChild(greetingOverlay);
        chatWindowDiv.appendChild(botInputDiv);

        document.body.appendChild(botDiv);
        document.body.appendChild(chatWindowDiv);

        addRedeyeListeners(chatHistoryDiv, inputArea, greetingOverlay);
    }

    // ===== 2. MOUSE TRACKING =====
    function trackMouse(e) {
        if (isBotMuted || window.innerWidth <= 768) return;
        const dx = e.clientX - currentX;
        const dy = e.clientY - currentY;
        const distanceToCursor = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const breathingOffset = BASE_OFFSET + Math.sin(time * 0.02) * 25;

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
                triggerGreeting(greetingOverlay, inputArea);
            }
        };

        botDiv.addEventListener('click', toggleChat);
        botDiv.addEventListener('touchstart', toggleChat, { passive: true });

        closeChatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (leaveTimer) clearTimeout(leaveTimer);
            chatWindowDiv.style.display = 'none';
            isBotMuted = false;
        });

        chatWindowDiv.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        chatWindowDiv.addEventListener('mouseleave', () => {
            leaveTimer = setTimeout(() => {
                chatWindowDiv.style.display = 'none';
                isBotMuted = false;
            }, 4000);
        });

        chatWindowDiv.addEventListener('mouseenter', () => {
            if (leaveTimer) clearTimeout(leaveTimer);
        });

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
        inputArea.addEventListener('click', clearOverlayOnInteraction);
    }

    function appendMessageToHistory(sender, text, historyArea) {
        const msgDiv = document.createElement('div');
        const isUser = sender === 'user';
        const displayName = isUser ? 'You' : '¡Ojo!';

        const userColor = '#aaa';
        const botColor = '#e0e0e0';

        msgDiv.style.cssText = `margin-bottom: 0.75rem; color: ${isUser ? userColor : botColor}; font-size: 1.05rem; line-height: 1.35;`;
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

            let rawResponse = '';
            if (data.conceptDescription) {
                rawResponse = data.conceptDescription;
            } else if (data.response) {
                rawResponse = typeof data.response === 'string' ? data.response : data.response.response;
            } else if (data.text) {
                rawResponse = data.text;
            } else if (data.error) {
                rawResponse = `Error: ${data.error}`;
            } else {
                rawResponse = JSON.stringify(data);
            }

            // ===== REAL-TIME NAVIGATION & LINK PARSING =====
            let navTarget = null;
            let openTarget = null;

            // Check for [NAVIGATE: url] tag
            const navMatch = rawResponse.match(/\[NAVIGATE:\s*([^\]]+)\]/i);
            if (navMatch) {
                navTarget = navMatch[1].trim();
                rawResponse = rawResponse.replace(navMatch[0], '').trim();
            }

            // Check for [OPEN: url] tag
            const openMatch = rawResponse.match(/\[OPEN:\s*([^\]]+)\]/i);
            if (openMatch) {
                openTarget = openMatch[1].trim();
                rawResponse = rawResponse.replace(openMatch[0], '').trim();
            }

            // Display clean message to user
            appendMessageToHistory('redeye', rawResponse, historyArea);
            chatMessages.push({ role: 'assistant', content: rawResponse });

            // Execute navigation after short reading delay
            if (navTarget) {
                setTimeout(() => {
                    window.location.href = navTarget;
                }, 1200); // 1.2s delay to let visitor read message
            } else if (openTarget) {
                setTimeout(() => {
                    window.open(openTarget, '_blank');
                }, 800);
            }

        } catch (err) {
            appendMessageToHistory('redeye', 'Sorry, I lost my connection.', historyArea);
        } finally {
            inputArea.disabled = false;
            inputArea.focus();
        }
    }

    // Initialize DOM
    document.addEventListener('DOMContentLoaded', () => {
        createBotUi();
        document.addEventListener('mousemove', trackMouse);
        requestAnimationFrame(animateLoop);
    });
})();
