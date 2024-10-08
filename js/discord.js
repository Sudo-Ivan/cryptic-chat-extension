window.CrypticChat = window.CrypticChat || {};

// Memoization for escapeRegExp function
CrypticChat.memoEscapeRegExp = (function() {
    const cache = new Map();
    return function(string) {
        if (cache.has(string)) {
            return cache.get(string);
        }
        const result = string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cache.set(string, result);
        return result;
    };
})();

// Lazy loading of control icons
CrypticChat.lazyLoadControlIcons = function() {
    if (CrypticChat.iconsLoaded) return;

    const chatArea = document.querySelector('[class^="chatContent_"]');
    if (!chatArea) return;

    const iconContainer = document.createElement('div');
    iconContainer.className = 'cryptic-chat-icons';
    iconContainer.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 9999;';

    const reloadIcon = document.createElement('img');
    reloadIcon.src = chrome.runtime.getURL('icons/reload-light.png');
    reloadIcon.title = 'Reload';
    reloadIcon.style.cssText = 'width: 24px; height: 24px; margin-right: 10px; cursor: pointer;';
    reloadIcon.onclick = CrypticChat.reloadMessages;

    const settingsIcon = document.createElement('img');
    settingsIcon.src = chrome.runtime.getURL('icons/settings-light.png');
    settingsIcon.title = 'Options';
    settingsIcon.style.cssText = 'width: 24px; height: 24px; cursor: pointer;';
    settingsIcon.onclick = CrypticChat.openOptions;

    iconContainer.appendChild(reloadIcon);
    iconContainer.appendChild(settingsIcon);
    chatArea.appendChild(iconContainer);

    CrypticChat.iconsLoaded = true;
};

// Use IntersectionObserver for efficient DOM updates
CrypticChat.setupMessageObserver = function() {
    const chatArea = document.querySelector('[class^="chatContent_"]');
    if (!chatArea) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                CrypticChat.decryptElement(entry.target, CrypticChat.codebook);
            }
        });
    }, { threshold: 0.5 });

    chatArea.querySelectorAll('[id^="chat-messages-"]').forEach(message => {
        observer.observe(message);
    });

    // Observe new messages
    const messageObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE && node.id.startsWith('chat-messages-')) {
                    observer.observe(node);
                }
            });
        });
    });

    messageObserver.observe(chatArea, { childList: true, subtree: true });
};

// Batch DOM updates
CrypticChat.batchDecrypt = function(messages, codebook) {
    const fragment = document.createDocumentFragment();
    messages.forEach(message => {
        const decrypted = CrypticChat.decryptElement(message, codebook);
        if (decrypted) {
            const decryptedElement = document.createElement('div');
            decryptedElement.textContent = decrypted;
            decryptedElement.className = 'cryptic-decrypted-message';
            fragment.appendChild(decryptedElement);
        }
    });
    return fragment;
};

// Use Web Worker for heavy computations
CrypticChat.setupDecryptWorker = function() {
    CrypticChat.decryptWorker = new Worker(chrome.runtime.getURL('js/decryptWorker.js'));
};

// Modified decryptElement to use Web Worker
CrypticChat.decryptElement = function(messageElement, codebook) {
    try {
        const contentElement = messageElement.querySelector('[id^="message-content-"]');
        if (!contentElement) return null;

        const originalText = contentElement.textContent.trim();

        return new Promise((resolve) => {
            CrypticChat.decryptWorker.onmessage = function(e) {
                const decryptedText = e.data;
                if (decryptedText !== originalText) {
                    let username = 'Unknown User';
                    let timestamp = '';

                    let usernameElement = messageElement.querySelector('[class*="username_"]');
                    let timestampElement = messageElement.querySelector('time');

                    if (usernameElement) {
                        username = usernameElement.textContent.trim();
                    }
                    if (timestampElement) {
                        timestamp = timestampElement.getAttribute('aria-label') || timestampElement.textContent.trim();
                    }

                    const decryptedElement = document.createElement('div');
                    decryptedElement.textContent = `${username}: ${decryptedText} - ${timestamp}`;
                    decryptedElement.className = 'cryptic-decrypted-message';
                    messageElement.appendChild(decryptedElement);
                }
                resolve(decryptedText);
            };

            CrypticChat.decryptWorker.postMessage({ text: originalText, codebook: codebook });
        });
    } catch (error) {
        console.error("Error in decryptElement: ", error);
        return Promise.resolve(null);
    }
};

CrypticChat.reloadMessages = function() {
  chrome.runtime.sendMessage({ action: 'reloadMessages' });
};

CrypticChat.openOptions = function() {
  chrome.runtime.sendMessage({ action: 'openOptions' });
};

CrypticChat.setDiscordMessage = function(message) {
    const messageInput = document.querySelector('div[role="textbox"][data-slate-editor="true"]');
    if (!messageInput) {
        console.error('Discord message input not found');
        return;
    }

    messageInput.focus();

    const insertText = (text) => {
        const textEvent = new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text
        });
        messageInput.dispatchEvent(textEvent);
    };

    while (messageInput.firstChild) {
        messageInput.removeChild(messageInput.firstChild);
    }

    insertText(message);

    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: message
    });
    messageInput.dispatchEvent(inputEvent);

    messageInput.textContent = message;

    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(messageInput);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
};

CrypticChat.syncScroll = function() {
  const discordScroller = document.querySelector('[class^="scroller_"]');
  const crypticChatScroller = document.getElementById('crypticChatScroller');

  if (!discordScroller || !crypticChatScroller) return;

  discordScroller.addEventListener('scroll', () => {
    const scrollPercentage = discordScroller.scrollTop / (discordScroller.scrollHeight - discordScroller.clientHeight);
    crypticChatScroller.scrollTop = scrollPercentage * (crypticChatScroller.scrollHeight - crypticChatScroller.clientHeight);
  });

  crypticChatScroller.addEventListener('scroll', () => {
    const scrollPercentage = crypticChatScroller.scrollTop / (crypticChatScroller.scrollHeight - crypticChatScroller.clientHeight);
    discordScroller.scrollTop = scrollPercentage * (discordScroller.scrollHeight - discordScroller.clientHeight);
  });
};

// Initialize
CrypticChat.init = function() {
    CrypticChat.setupDecryptWorker();
    CrypticChat.lazyLoadControlIcons();
    CrypticChat.setupMessageObserver();
    CrypticChat.syncScroll();
};

// Call init when the script loads
CrypticChat.init();