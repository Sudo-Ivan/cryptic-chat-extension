window.CrypticChat = window.CrypticChat || {};

CrypticChat.escapeRegExp = function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

CrypticChat.createCrypticChatWindow = function() {
    let crypticChatWindow = document.getElementById('crypticChatWindow');
    if (crypticChatWindow) return crypticChatWindow;

    const styles = `
        .cryptic-chat-box {
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 450px;
            height: 400px;
            background-color: rgba(15, 15, 35, 0.9);
            border: 1px solid #30305a;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            padding: 0;
            z-index: 9999;
            color: #c5c8c6;
            font-family: 'Roboto', Arial, sans-serif;
            resize: both;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: height 0.3s ease-in-out;
            font-size: 14px;
            line-height: 1.5;
            user-select: text;
        }
        .cryptic-chat-header {
            cursor: move;
            padding: 10px;
            background-color: #1a1a40;
            color: #ffffff;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            flex-shrink: 0;
        }
        .cryptic-chat-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
            background-color: #141422;
            scrollbar-width: thin;
            scrollbar-color: #30305a #141422;
            --message-spacing: 5px;
        }
        .cryptic-chat-input {
            width: calc(100% - 20px);
            height: 60px;
            margin: 10px;
            resize: none;
            background-color: #1e1e3f;
            color: #c5c8c6;
            border: 1px solid #30305a;
            border-radius: 5px;
            padding: 5px;
            font-size: 14px;
        }
        .cryptic-chat-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            margin-left: 10px;
        }
        .cryptic-chat-icon {
            width: 20px;
            height: 20px;
            cursor: pointer;
            margin-left: 10px;
            opacity: 0.7;
            transition: opacity 0.2s ease-in-out;
        }
        .cryptic-chat-icon:hover {
            opacity: 1;
        }
        .cryptic-chat-minimized {
            height: 40px !important;
        }
        .cryptic-chat-scroll-btn {
            position: absolute;
            bottom: 80px;
            right: 20px;
            background-color: #1a1a40;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            font-size: 20px;
            cursor: pointer;
            display: none;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        .cryptic-chat-scroll-btn:hover {
            opacity: 1;
        }
        .cryptic-chat-minimized {
            height: 40px !important;
        }
        .cryptic-chat-minimized .cryptic-chat-content,
        .cryptic-chat-minimized .cryptic-chat-input {
            display: none;
        }
        .cryptic-chat-scroll-btn {
            position: absolute;
            bottom: 80px;
            right: 20px;
            background-color: #4ecca3;
            color: #ffffff;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.3s;
        }
        .cryptic-chat-scroll-btn:hover {
            opacity: 1;
        }
        .cryptic-chat-image {
            max-width: 100%;
            max-height: 200px;
            border-radius: 5px;
            margin-top: 5px;
        }
        .cryptic-chat-message {
            border-radius: 8px;
            padding: 8px 12px;
            margin-bottom: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .cryptic-chat-message:hover {
            background-color: rgba(30, 30, 63, 0.9);
        }
        .cryptic-chat-username {
            font-weight: bold;
            margin-right: 8px;
        }
        .cryptic-chat-timestamp {
            font-size: 0.8em;
            color: #a0a0a0;
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    crypticChatWindow = document.createElement('div');
    crypticChatWindow.id = 'crypticChatWindow';
    crypticChatWindow.className = 'cryptic-chat-box';

    const header = document.createElement('div');
    header.className = 'cryptic-chat-header';
    header.innerHTML = '<span>Cryptic Chat</span><div class="cryptic-chat-controls"></div>';

    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'cryptic-chat-content';

    const inputArea = document.createElement('textarea');
    inputArea.className = 'cryptic-chat-input';
    inputArea.placeholder = 'Type your message here... (Press Enter to encrypt and send to Discord input)';

    const scrollButton = document.createElement('button');
    scrollButton.textContent = '↓';
    scrollButton.className = 'cryptic-chat-btn';
    scrollButton.style.position = 'absolute';
    scrollButton.style.bottom = '80px';
    scrollButton.style.right = '20px';
    scrollButton.style.display = 'none';
    scrollButton.onclick = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    crypticChatWindow.appendChild(scrollButton);

    messagesContainer.onscroll = () => {
        const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 1;
        scrollButton.style.display = isScrolledToBottom ? 'none' : 'block';
    };

    crypticChatWindow.appendChild(header);
    crypticChatWindow.appendChild(messagesContainer);
    crypticChatWindow.appendChild(inputArea);

    document.body.appendChild(crypticChatWindow);
    CrypticChat.makeDraggable(crypticChatWindow, header);
    CrypticChat.addIconsToWindow(crypticChatWindow);
    CrypticChat.setupInputHandler(inputArea);

    return crypticChatWindow;
};

CrypticChat.makeDraggable = function(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
};

CrypticChat.applyOptions = function(isInitialLoad = false) {
    chrome.storage.local.get([
        'messagesToLoad',
        'autoScroll',
        'backgroundColor',
        'userColors',
        'inputBoxColor',
        'headerColor',
        'windowTransparency',
        'destructableMessages',
        'destructKeyword',
        'defaultDestructTime',
        'showDestructTimer',
        'messageSpacing',
        'messageBubbleColor',
        'messageBubbleOpacity'
    ], function(items) {
        CrypticChat.messagesToLoad = items.messagesToLoad || 50;
        CrypticChat.autoScroll = items.autoScroll !== false;
        CrypticChat.backgroundColor = items.backgroundColor || '#141422';
        CrypticChat.userColors = items.userColors || [];
        CrypticChat.inputBoxColor = items.inputBoxColor || '#1e1e3f';
        CrypticChat.headerColor = items.headerColor || '#1a1a40';
        CrypticChat.windowTransparency = items.windowTransparency || 90;
        CrypticChat.destructableMessages = items.destructableMessages || false;
        CrypticChat.destructKeyword = items.destructKeyword || '\\d ! d';
        CrypticChat.defaultDestructTime = items.defaultDestructTime || 5;
        CrypticChat.showDestructTimer = items.showDestructTimer !== false;
        CrypticChat.messageSpacing = items.messageSpacing || 5;
        CrypticChat.messageBubbleColor = items.messageBubbleColor || '#1e1e3f';
        CrypticChat.messageBubbleOpacity = items.messageBubbleOpacity || 70;

        const crypticChatWindow = document.getElementById('crypticChatWindow');
        if (crypticChatWindow) {
            crypticChatWindow.style.backgroundColor = `rgba(15, 15, 35, ${CrypticChat.windowTransparency / 100})`;
        }

        CrypticChat.applyMessageSpacing();
        CrypticChat.applyMessageBubbleStyle();

        if (isInitialLoad) {
            CrypticChat.updateAllStyles();
        }
    });
};

CrypticChat.applyMessageSpacing = function() {
    const messagesContainer = document.querySelector('.cryptic-chat-content');
    if (messagesContainer) {
        messagesContainer.style.setProperty('--message-spacing', `${CrypticChat.messageSpacing}px`);
    }
};

CrypticChat.applyMessageBubbleStyle = function() {
    const crypticChatWindow = document.getElementById('crypticChatWindow');
    if (crypticChatWindow) {
        const style = crypticChatWindow.querySelector('style') || document.createElement('style');
        style.textContent = `
            .cryptic-chat-message {
                background-color: ${CrypticChat.messageBubbleColor}${Math.round(CrypticChat.messageBubbleOpacity * 2.55).toString(16).padStart(2, '0')};
            }
        `;
        crypticChatWindow.appendChild(style);
    }
};

CrypticChat.updateCrypticChatWindow = function(decryptedTexts) {
    const crypticChatWindow = CrypticChat.createCrypticChatWindow();
    const messagesContainer = crypticChatWindow.querySelector('.cryptic-chat-content');
    
    // Clear the messages container if no decrypted texts
    if (decryptedTexts.length === 0) {
        messagesContainer.innerHTML = '';
        return;
    }
    
    const existingMessages = new Set(
        Array.from(messagesContainer.children).map(child => child.textContent)
    );

    let newMessagesAdded = false;

    // Clear existing messages that are not in the new decrypted texts
    Array.from(messagesContainer.children).forEach(child => {
        if (!decryptedTexts.includes(child.textContent)) {
            messagesContainer.removeChild(child);
        }
    });

    decryptedTexts.forEach(text => {
        if (!existingMessages.has(text)) {
            existingMessages.add(text);
            const messageElement = document.createElement('div');
            messageElement.className = 'cryptic-chat-message';
            
            const [username, ...messageParts] = text.split(':');
            const message = messageParts.join(':').trim();
            const timestamp = message.match(/- (\d{2}:\d{2})/);

            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'cryptic-chat-username';
            usernameSpan.textContent = username;

            const messageSpan = document.createElement('span');
            messageSpan.className = 'cryptic-chat-text';
            messageSpan.textContent = message.replace(/- \d{2}:\d{2}$/, '').trim();

            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'cryptic-chat-timestamp';
            timestampSpan.textContent = timestamp ? timestamp[1] : '';

            messageElement.appendChild(usernameSpan);
            messageElement.appendChild(messageSpan);
            messageElement.appendChild(timestampSpan);

            // Check if it's a destructible message
            const destructMatch = text.match(/\\d ! d(\d+)\/\//);
            if (destructMatch) {
                const destructMinutes = parseInt(destructMatch[1]);
                const messageTime = new Date().getTime();
                
                // Set a timeout to remove the message
                const timeoutId = setTimeout(() => {
                    if (messagesContainer.contains(messageElement)) {
                        messagesContainer.removeChild(messageElement);
                    }
                }, destructMinutes * 60 * 1000);

                // Store the timeout ID and destruction time
                messageElement.dataset.timeoutId = timeoutId;
                messageElement.dataset.destructTime = messageTime + (destructMinutes * 60 * 1000);

                // Remove the destruction keyword from the displayed message
                messageElement.textContent = text.replace(destructMatch[0], '').trim();

                if (CrypticChat.showDestructTimer) {
                    const timerElement = document.createElement('span');
                    timerElement.className = 'destruct-timer';
                    messageElement.appendChild(timerElement);

                    const updateTimer = () => {
                        if (!messagesContainer.contains(messageElement)) {
                            return; // Stop updating if the element is no longer in the container
                        }
                        const remainingTime = Math.max(0, (messageElement.dataset.destructTime - new Date().getTime()) / 1000);
                        const minutes = Math.floor(remainingTime / 60);
                        const seconds = Math.floor(remainingTime % 60);
                        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                        if (remainingTime > 0) {
                            requestAnimationFrame(updateTimer);
                        }
                    };

                    updateTimer();
                }
            }
            
            // Apply user color if matched
            const userColor = CrypticChat.userColors.find(uc => uc.username === username);
            if (userColor) {
                messageElement.style.color = userColor.color;
            }
            
            // Placeholder for images
            if (text.includes('[IMAGE]')) {
                const imgPlaceholder = document.createElement('div');
                imgPlaceholder.className = 'cryptic-chat-image';
                imgPlaceholder.textContent = '[Image Placeholder]';
                imgPlaceholder.style.backgroundColor = '#30305a';
                imgPlaceholder.style.color = '#ffffff';
                imgPlaceholder.style.textAlign = 'center';
                imgPlaceholder.style.lineHeight = '200px';
                messageElement.appendChild(imgPlaceholder);
            }
            
            messagesContainer.appendChild(messageElement);
            newMessagesAdded = true;
        }
    });

    CrypticChat.applyMessageSpacing();

    if (newMessagesAdded && CrypticChat.autoScroll) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
};

CrypticChat.addIconsToWindow = function(crypticChatWindow) {
    const controlsContainer = crypticChatWindow.querySelector('.cryptic-chat-controls');

    const createIcon = (src, id, title, onClick) => {
        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL(src);
        icon.id = id;
        icon.title = title;
        icon.className = 'cryptic-chat-icon';
        icon.onclick = onClick;
        return icon;
    };

    const reloadIcon = createIcon('icons/reload-light.png', 'reloadIcon', 'Reload', CrypticChat.reloadMessages);
    const settingsIcon = createIcon('icons/settings-light.png', 'settingsIcon', 'Settings', CrypticChat.openOptions);
    const minimizeIcon = createIcon('icons/minimize.png', 'minimizeIcon', 'Minimize', () => CrypticChat.toggleMinimize(crypticChatWindow));
    const closeIcon = createIcon('icons/close.png', 'closeIcon', 'Close', () => crypticChatWindow.remove());

    controlsContainer.appendChild(reloadIcon);
    controlsContainer.appendChild(settingsIcon);
    controlsContainer.appendChild(minimizeIcon);
    controlsContainer.appendChild(closeIcon);
};

CrypticChat.toggleMinimize = function(crypticChatWindow) {
    crypticChatWindow.classList.toggle('cryptic-chat-minimized');
};

CrypticChat.reloadMessages = function() {
    chrome.storage.local.get('codebook', function(result) {
        const codebook = result.codebook || {};
        CrypticChat.Discord.discordParse(codebook).then(decryptedTexts => {
            CrypticChat.updateCrypticChatWindow(decryptedTexts);
        });
    });
};

CrypticChat.openOptions = function() {
    chrome.runtime.sendMessage({ action: 'openOptions' });
};

CrypticChat.setupInputHandler = function(inputArea) {
    inputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            CrypticChat.encryptAndSend(inputArea.value);
            inputArea.value = '';
        }
    });
};

CrypticChat.encryptAndSend = function(message) {
    chrome.storage.local.get([
        'codebook', 
        'autoSend', 
        'destructableMessages', 
        'destructKeyword', 
        'defaultDestructTime',
        'caseInsensitiveEncryption',
        'crypticPhrase'
    ], function(result) {
        const codebook = result.codebook || {};
        const autoSend = result.autoSend !== false;
        const destructableMessages = result.destructableMessages || false;
        const destructKeyword = result.destructKeyword || '\\d ! d';
        const defaultDestructTime = result.defaultDestructTime || 5;
        const caseInsensitiveEncryption = result.caseInsensitiveEncryption || false;
        const crypticPhrase = result.crypticPhrase || '\\d ! d';
        let encryptedMessage = message;

        if (destructableMessages) {
            const destructRegex = caseInsensitiveEncryption 
                ? new RegExp(CrypticChat.escapeRegExp(destructKeyword), 'gi')
                : new RegExp(CrypticChat.escapeRegExp(destructKeyword), 'g');
            const destructMatch = message.match(destructRegex);
            if (destructMatch) {
                const minutes = destructMatch[1] || defaultDestructTime;
                encryptedMessage = encryptedMessage.replace(destructMatch[0], `${crypticPhrase}${minutes}`);
            }
        }

        for (const key in codebook) {
            if (codebook.hasOwnProperty(key)) {
                const regex = caseInsensitiveEncryption 
                    ? new RegExp(`\\b${CrypticChat.escapeRegExp(key)}\\b`, 'gi')
                    : new RegExp(`\\b${CrypticChat.escapeRegExp(key)}\\b`, 'g');
                encryptedMessage = encryptedMessage.replace(regex, (match) => {
                    const replacement = codebook[key];
                    return caseInsensitiveEncryption ? replacement : (
                        match === match.toUpperCase() ? replacement.toUpperCase() :
                        match === match.toLowerCase() ? replacement.toLowerCase() :
                        replacement
                    );
                });
            }
        }

        CrypticChat.Discord.setDiscordMessage(encryptedMessage, autoSend);
    });
};

CrypticChat.init = function() {
    chrome.storage.local.get([
        'messagesToLoad',
        'autoScroll',
        'backgroundColor',
        'inputBoxColor',
        'headerColor',
        'windowTransparency',
        'destructableMessages',
        'destructKeyword',
        'crypticPhrase',
        'defaultDestructTime',
        'showDestructTimer',
        'messageSpacing',
        'messageBubbleColor',
        'messageBubbleOpacity',
        'userColors',
        'codebook',
        'messageCheckInterval',
        'discordSelectors'
    ], function(items) {
        CrypticChat.messagesToLoad = items.messagesToLoad || 50;
        CrypticChat.autoScroll = items.autoScroll !== false;
        CrypticChat.backgroundColor = items.backgroundColor || '#141422';
        CrypticChat.inputBoxColor = items.inputBoxColor || '#1e1e3f';
        CrypticChat.headerColor = items.headerColor || '#1a1a40';
        CrypticChat.windowTransparency = items.windowTransparency || 90;
        CrypticChat.destructableMessages = items.destructableMessages || false;
        CrypticChat.destructKeyword = items.destructKeyword || '\\d ! d';
        CrypticChat.crypticPhrase = items.crypticPhrase || '\\d ! d';
        CrypticChat.defaultDestructTime = items.defaultDestructTime || 5;
        CrypticChat.showDestructTimer = items.showDestructTimer !== false;
        CrypticChat.messageSpacing = items.messageSpacing || 5;
        CrypticChat.messageBubbleColor = items.messageBubbleColor || '#1e1e3f';
        CrypticChat.messageBubbleOpacity = items.messageBubbleOpacity || 70;
        CrypticChat.userColors = items.userColors || [];
        CrypticChat.codebook = items.codebook || {};
        CrypticChat.messageCheckInterval = items.messageCheckInterval || 5;
        CrypticChat.discordSelectors = items.discordSelectors || {
            chatArea: '[class^="chatContent_"]',
            messageElements: '[id^="chat-messages-"]',
            contentElement: '[id^="message-content-"]',
            repliedTextPreview: '[class*="repliedTextPreview_"]',
            usernameElement: '[class*="username_"]',
            timestampElement: 'time',
            messageInput: 'div[role="textbox"][data-slate-editor="true"]'
        };

        CrypticChat.updateAllStyles();
        CrypticChat.reloadMessages();

        // Update the interval
        if (CrypticChat.messageCheckIntervalId) {
            clearInterval(CrypticChat.messageCheckIntervalId);
        }
        CrypticChat.messageCheckIntervalId = setInterval(CrypticChat.reloadMessages, CrypticChat.messageCheckInterval * 1000);
    });
};

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.messageCheckInterval) {
        CrypticChat.messageCheckInterval = changes.messageCheckInterval.newValue;
        if (CrypticChat.messageCheckIntervalId) {
            clearInterval(CrypticChat.messageCheckIntervalId);
        }
        CrypticChat.messageCheckIntervalId = setInterval(CrypticChat.reloadMessages, CrypticChat.messageCheckInterval * 1000);
    }
});

// Modify the existing listener to handle interval updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'reloadMessages') {
        CrypticChat.reloadMessages();
    } else if (request.action === 'updateStyles') {
        CrypticChat.applyOptions();
        CrypticChat.updateAllStyles();
    } else if (request.action === 'checkForNewMessages') {
        CrypticChat.reloadMessages();
    } else if (request.action === 'updateMessageCheckInterval') {
        chrome.storage.local.get('messageCheckInterval', (result) => {
            CrypticChat.messageCheckInterval = result.messageCheckInterval || 5;
            if (CrypticChat.messageCheckIntervalId) {
                clearInterval(CrypticChat.messageCheckIntervalId);
            }
            CrypticChat.messageCheckIntervalId = setInterval(CrypticChat.reloadMessages, CrypticChat.messageCheckInterval * 1000);
        });
    } else if (request.action === 'updateDiscordSelectors') {
        chrome.storage.local.get('discordSelectors', (result) => {
            CrypticChat.discordSelectors = result.discordSelectors || {
                chatArea: '[class^="chatContent_"]',
                messageElements: '[id^="chat-messages-"]',
                contentElement: '[id^="message-content-"]',
                repliedTextPreview: '[class*="repliedTextPreview_"]',
                usernameElement: '[class*="username_"]',
                timestampElement: 'time',
                messageInput: 'div[role="textbox"][data-slate-editor="true"]'
            };
            CrypticChat.reloadMessages();
        });
    }
});

CrypticChat.init();

const chatObserver = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && node.matches(CrypticChat.discordSelectors.messageElements)) {
                    CrypticChat.reloadMessages();
                    return;
                }
            }
        }
    }
});

const chatArea = document.querySelector(CrypticChat.discordSelectors.chatArea);
if (chatArea) {
    chatObserver.observe(chatArea, { childList: true, subtree: true });
}

const channelSwitchObserver = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('chat-3bRxxu')) {
                    CrypticChat.reloadMessages();
                    return;
                }
            }
        }
    }
});

const appMount = document.querySelector('#app-mount');
if (appMount) {
    channelSwitchObserver.observe(appMount, { childList: true, subtree: true });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        CrypticChat.applyOptions();
        CrypticChat.updateAllStyles();
    }
});

CrypticChat.updateAllStyles = function() {
    const crypticChatWindow = document.getElementById('crypticChatWindow');
    if (crypticChatWindow) {
        const header = crypticChatWindow.querySelector('.cryptic-chat-header');
        const input = crypticChatWindow.querySelector('.cryptic-chat-input');
        const content = crypticChatWindow.querySelector('.cryptic-chat-content');

        crypticChatWindow.style.backgroundColor = `rgba(15, 15, 35, ${CrypticChat.windowTransparency / 100})`;
        if (header) header.style.backgroundColor = CrypticChat.headerColor;
        if (input) input.style.backgroundColor = CrypticChat.inputBoxColor;
        if (content) content.style.backgroundColor = CrypticChat.backgroundColor;

        CrypticChat.applyMessageSpacing();
        CrypticChat.applyMessageBubbleStyle();
    }
};