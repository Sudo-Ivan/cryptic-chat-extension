window.CrypticChat = window.CrypticChat || {};

// Add this at the top of the file, after window.CrypticChat declaration
CrypticChat.lastScrollPosition = null;
CrypticChat.isUserScrolling = false;

// Style Management
CrypticChat.updateAllStyles = function() {
    console.log('Updating all styles');
    const crypticChatWindow = document.getElementById('crypticChatWindow');
    if (crypticChatWindow) {
        console.log('Cryptic Chat window found, applying styles');
        const header = crypticChatWindow.querySelector('.cryptic-chat-header');
        const input = crypticChatWindow.querySelector('.cryptic-chat-input');
        const content = crypticChatWindow.querySelector('.cryptic-chat-content');

        crypticChatWindow.style.backgroundColor = `rgba(15, 15, 35, ${CrypticChat.windowTransparency / 100})`;
        if (header) header.style.backgroundColor = CrypticChat.headerColor;
        if (input) input.style.backgroundColor = CrypticChat.inputBoxColor;
        if (content) content.style.backgroundColor = CrypticChat.backgroundColor;

        CrypticChat.applyMessageSpacing();
        CrypticChat.applyMessageBubbleStyle();
    } else {
        console.log('Cryptic Chat window not found');
    }
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
            background-color: rgba(18, 18, 18, 0.9);
            border: 1px solid #333333;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            padding: 0;
            z-index: 9999;
            color: #ffffff;
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
            background-color: #1e1e1e;
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
            background-color: #121212;
            scrollbar-width: thin;
            scrollbar-color: #333333 #121212;
            --message-spacing: 5px;
        }
        .cryptic-chat-input {
            width: calc(100% - 20px);
            height: 60px;
            margin: 5px;
            resize: none;
            background-color: #1e1e1e;
            color: #ffffff;
            border: 1px solid #333333;
            border-radius: 5px;
            padding: 5px;
            font-size: 14px;
        }
        .cryptic-chat-preview {
            width: calc(100% - 20px);
            padding: 8px;
            background-color: #1e1e1e;
            color: #888888;
            border: 1px solid #333333;
            border-radius: 5px;
            font-size: 12px;
            min-height: 20px;
            max-height: 100px;
            overflow-y: auto;
            display: none;
        }
        .cryptic-chat-preview.has-content {
            display: block;
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
            background-color: #ff3333;
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
            background-color: #ff3333;
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
            background-color: #1e1e1e;
        }
        .cryptic-chat-message:hover {
            background-color: #333333;
        }
        .cryptic-chat-username {
            font-weight: bold;
            margin-right: 8px;
            color: #ff3333;
        }
        .cryptic-chat-timestamp {
            font-size: 0.8em;
            color: #666666;
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

    const previewArea = document.createElement('div');
    previewArea.className = 'cryptic-chat-preview';
    previewArea.textContent = 'Preview will appear here...';

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
    crypticChatWindow.appendChild(previewArea);

    document.body.appendChild(crypticChatWindow);
    CrypticChat.makeDraggable(crypticChatWindow, header);
    CrypticChat.addIconsToWindow(crypticChatWindow);
    CrypticChat.setupInputHandler(inputArea);

    CrypticChat.updateAllStyles();
    
    setTimeout(() => CrypticChat.setupScrollTracking(), 100);
    
    return crypticChatWindow;
};

// Initialization
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
        'discordSelectors',
        'caseInsensitiveEncryption',
        'mutedUsers',
        'autoSend'
    ], function(items) {
        CrypticChat.discordSelectors = items.discordSelectors || {
            chatArea: '[class^="chatContent_"]',
            messageElements: '[id^="chat-messages-"]',
            contentElement: '[id^="message-content-"]',
            repliedTextPreview: '[class*="repliedTextPreview_"]',
            usernameElement: '[class*="username_"]',
            timestampElement: 'time',
            messageInput: 'div[role="textbox"][data-slate-editor="true"]'
        };

        CrypticChat.userColors = items.userColors || [];
        CrypticChat.autoScroll = items.autoScroll !== false;
        CrypticChat.messageCheckInterval = items.messageCheckInterval || 5;
        
        CrypticChat.updateAllStyles();
        
        // Initialize scroll tracking before loading messages
        setTimeout(() => CrypticChat.setupScrollTracking(), 100);
        
        CrypticChat.reloadMessages();

        if (CrypticChat.messageCheckIntervalId) {
            clearInterval(CrypticChat.messageCheckIntervalId);
        }
        CrypticChat.messageCheckIntervalId = setInterval(CrypticChat.reloadMessages, CrypticChat.messageCheckInterval * 1000);

        CrypticChat.setupObservers();
        
        // Auto-create the chat window if on Discord/Element
        if (window.location.hostname === 'discord.com' || window.location.hostname === 'element.io') {
            setTimeout(() => {
                CrypticChat.createCrypticChatWindow();
            }, 1000);
        }
    });
};

CrypticChat.setupObservers = function() {
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
};

// Initialize immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        CrypticChat.init();
    });
} else {
    // DOM is already loaded, initialize immediately
    CrypticChat.init();
}

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

// Window Management


// Draggable Functionality
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

// Apply Options from Storage
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
        CrypticChat.backgroundColor = items.backgroundColor || '#121212';
        CrypticChat.userColors = items.userColors || [];
        CrypticChat.inputBoxColor = items.inputBoxColor || '#1e1e1e';
        CrypticChat.headerColor = items.headerColor || '#1e1e1e';
        CrypticChat.windowTransparency = items.windowTransparency || 90;
        CrypticChat.destructableMessages = items.destructableMessages || false;
        CrypticChat.destructKeyword = items.destructKeyword || '\\d ! d';
        CrypticChat.defaultDestructTime = items.defaultDestructTime || 5;
        CrypticChat.showDestructTimer = items.showDestructTimer !== false;
        CrypticChat.messageSpacing = items.messageSpacing || 5;
        CrypticChat.messageBubbleColor = items.messageBubbleColor || '#1e1e1e';
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

// Update Messages in Chat Window
CrypticChat.updateCrypticChatWindow = function(decryptedTexts) {
    const crypticChatWindow = CrypticChat.createCrypticChatWindow();
    const messagesContainer = crypticChatWindow.querySelector('.cryptic-chat-content');
    
    if (!messagesContainer) return;
    
    if (decryptedTexts.length === 0) {
        messagesContainer.innerHTML = '';
        return;
    }
    
    const existingMessages = new Set(
        Array.from(messagesContainer.children).map(child => child.textContent)
    );

    let newMessagesAdded = false;

    // Remove messages that no longer exist
    Array.from(messagesContainer.children).forEach(child => {
        if (!decryptedTexts.includes(child.textContent)) {
            messagesContainer.removeChild(child);
        }
    });

    // Add new messages
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

            const messageContent = document.createElement('div');
            messageContent.className = 'cryptic-chat-text';

            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'cryptic-chat-timestamp';
            timestampSpan.textContent = timestamp ? timestamp[1] : '';

            messageElement.appendChild(usernameSpan);
            messageElement.appendChild(messageContent);
            messageElement.appendChild(timestampSpan);

            // Check for image bindings
            chrome.storage.local.get(['imageBindings'], function(result) {
                const imageBindings = result.imageBindings || {};
                const words = message.replace(/- \d{2}:\d{2}$/, '').trim().split(' ');
                
                words.forEach(word => {
                    const trimmedWord = word.trim();
                    
                    if (imageBindings[trimmedWord]) {
                        const img = document.createElement('img');
                        img.src = imageBindings[trimmedWord];
                        img.className = 'cryptic-chat-image';
                        img.alt = trimmedWord;
                        
                        img.onload = () => {
                            messageContent.appendChild(img);
                        };
                        
                        img.onerror = (error) => {
                            messageContent.appendChild(document.createTextNode(trimmedWord + ' '));
                        };
                    } else {
                        messageContent.appendChild(document.createTextNode(word + ' '));
                    }
                });
            });

            const destructMatch = text.match(/\\d ! d(\d+)\/\//);
            if (destructMatch) {
                const destructMinutes = parseInt(destructMatch[1]);
                const messageTime = new Date().getTime();
                
                const timeoutId = setTimeout(() => {
                    if (messagesContainer.contains(messageElement)) {
                        messagesContainer.removeChild(messageElement);
                    }
                }, destructMinutes * 60 * 1000);

                messageElement.dataset.timeoutId = timeoutId;
                messageElement.dataset.destructTime = messageTime + (destructMinutes * 60 * 1000);

                messageElement.textContent = text.replace(destructMatch[0], '').trim();

                if (CrypticChat.showDestructTimer) {
                    const timerElement = document.createElement('span');
                    timerElement.className = 'destruct-timer';
                    messageElement.appendChild(timerElement);

                    const updateTimer = () => {
                        if (!messagesContainer.contains(messageElement)) {
                            return;
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
            
            if (CrypticChat.userColors && Array.isArray(CrypticChat.userColors)) {
                const userColor = CrypticChat.userColors.find(uc => uc.username === username);
                if (userColor) {
                    messageElement.style.color = userColor.color;
                }
            }

            messagesContainer.appendChild(messageElement);
            newMessagesAdded = true;
        }
    });

    CrypticChat.applyMessageSpacing();
    
    // Scroll positioning is now handled in the reloadMessages function
};

// Icon Management
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

// User Interactions
CrypticChat.toggleMinimize = function(crypticChatWindow) {
    crypticChatWindow.classList.toggle('cryptic-chat-minimized');
};

CrypticChat.setupInputHandler = function(inputArea) {
    const previewArea = inputArea.parentElement.querySelector('.cryptic-chat-preview');
    
    const updatePreview = () => {
        const message = inputArea.value;
        if (!message.trim()) {
            previewArea.classList.remove('has-content');
            previewArea.textContent = 'Preview will appear here...';
            return;
        }

        chrome.storage.local.get([
            'codebook',
            'caseInsensitiveEncryption',
            'destructableMessages',
            'destructKeyword',
            'defaultDestructTime',
            'crypticPhrase'
        ], function(result) {
            const codebook = result.codebook || {};
            const caseInsensitiveEncryption = result.caseInsensitiveEncryption || false;
            const destructableMessages = result.destructableMessages || false;
            const destructKeyword = result.destructKeyword || '\\d ! d';
            const defaultDestructTime = result.defaultDestructTime || 5;
            const crypticPhrase = result.crypticPhrase || '\\d ! d';
            
            let previewText = message;

            // Handle destructible messages
            if (destructableMessages) {
                const destructRegex = caseInsensitiveEncryption
                    ? new RegExp(CrypticChat.escapeRegExp(destructKeyword), 'gi')
                    : new RegExp(CrypticChat.escapeRegExp(destructKeyword), 'g');
                const destructMatch = message.match(destructRegex);
                if (destructMatch) {
                    const minutes = destructMatch[1] || defaultDestructTime;
                    previewText = previewText.replace(destructMatch[0], `${crypticPhrase}${minutes}`);
                }
            }

            // Encrypt the message
            for (const key in codebook) {
                if (codebook.hasOwnProperty(key)) {
                    const regex = caseInsensitiveEncryption
                        ? new RegExp(`\\b${CrypticChat.escapeRegExp(key)}\\b`, 'gi')
                        : new RegExp(`\\b${CrypticChat.escapeRegExp(key)}\\b`, 'g');
                    previewText = previewText.replace(regex, (match) => {
                        const replacement = codebook[key];
                        return caseInsensitiveEncryption ? replacement : (
                            match === match.toUpperCase() ? replacement.toUpperCase() :
                            match === match.toLowerCase() ? replacement.toLowerCase() :
                            replacement
                        );
                    });
                }
            }

            previewArea.textContent = previewText;
            previewArea.classList.add('has-content');
        });
    };

    inputArea.addEventListener('input', updatePreview);
    inputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            CrypticChat.encryptAndSend(inputArea.value);
            inputArea.value = '';
            previewArea.classList.remove('has-content');
            previewArea.textContent = 'Preview will appear here...';
        }
    });
};

// Messaging Operations
CrypticChat.reloadMessages = function() {
    const messagesContainer = document.querySelector('.cryptic-chat-content');
    if (!messagesContainer) return;
    
    // Store scroll position BEFORE any operations
    const scrollTop = messagesContainer.scrollTop;
    const scrollHeight = messagesContainer.scrollHeight;
    const clientHeight = messagesContainer.clientHeight;
    const isAtBottom = (scrollHeight - clientHeight - scrollTop) < 5;
    
    // Store these values for use in the callback
    CrypticChat.currentScrollData = {
        scrollTop: scrollTop,
        isAtBottom: isAtBottom,
        previousHeight: scrollHeight
    };
    
    // Track if this is a first load (no messages yet)
    const isFirstLoad = messagesContainer.children.length === 0;
    
    chrome.storage.local.get('codebook', function(result) {
        const codebook = result.codebook || {};
        CrypticChat.Discord.discordParse(codebook).then(decryptedTexts => {
            // Update UI with message content
            CrypticChat.updateCrypticChatWindow(decryptedTexts);
            
            // Restore scroll position AFTER update
            requestAnimationFrame(() => {
                const messagesContainer = document.querySelector('.cryptic-chat-content');
                if (!messagesContainer) return;
                
                if (CrypticChat.currentScrollData) {
                    if ((CrypticChat.currentScrollData.isAtBottom && CrypticChat.autoScroll) || isFirstLoad) {
                        // If we were at bottom and auto-scroll enabled or this is the first load, scroll to bottom
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    } else if (messagesContainer.scrollHeight !== CrypticChat.currentScrollData.previousHeight) {
                        // If height changed but we weren't at bottom, maintain relative position
                        const heightDifference = messagesContainer.scrollHeight - CrypticChat.currentScrollData.previousHeight;
                        messagesContainer.scrollTop = CrypticChat.currentScrollData.scrollTop + heightDifference;
                    } else {
                        // If height didn't change, restore exact position
                        messagesContainer.scrollTop = CrypticChat.currentScrollData.scrollTop;
                    }
                }
            });
        });
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

// Storage and Communication
CrypticChat.openOptions = function() {
    chrome.runtime.sendMessage({ action: 'openOptions' });
};

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        CrypticChat.applyOptions();
        CrypticChat.updateAllStyles();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'reloadMessages') {
        CrypticChat.reloadMessages();
    } else if (request.action === 'updateStyles') {
        CrypticChat.applyOptions();
        CrypticChat.updateAllStyles();
    } else if (request.action === 'checkForNewMessages') {
        // Make sure scroll tracking is set up
        CrypticChat.setupScrollTracking();
        // Then reload messages
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

// Setup scroll position tracking
CrypticChat.setupScrollTracking = function() {
    const messagesContainer = document.querySelector('.cryptic-chat-content');
    if (!messagesContainer || messagesContainer.hasScrollListener) return;
    
    messagesContainer.hasScrollListener = true;
    messagesContainer.addEventListener('scroll', function() {
        if (!CrypticChat.scrollTimeout) {
            CrypticChat.scrollTimeout = setTimeout(function() {
                CrypticChat.scrollTimeout = null;
                
                // Update scroll state
                const scrollTop = messagesContainer.scrollTop;
                const scrollHeight = messagesContainer.scrollHeight;
                const clientHeight = messagesContainer.clientHeight;
                const isAtBottom = (scrollHeight - clientHeight - scrollTop) < 5;
                
                CrypticChat.currentScrollData = {
                    scrollTop: scrollTop,
                    isAtBottom: isAtBottom,
                    previousHeight: scrollHeight
                };
            }, 100);
        }
    });
};