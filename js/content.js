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

CrypticChat.applyOptions = function() {
    chrome.storage.local.get([
        'messagesToLoad',
        'autoScroll',
        'backgroundColor',
        'userColors',
        'inputBoxColor',
        'headerColor',
        'windowTransparency'
    ], function(items) {
        CrypticChat.messagesToLoad = items.messagesToLoad || 50;
        CrypticChat.autoScroll = items.autoScroll !== false;
        CrypticChat.backgroundColor = items.backgroundColor || '#141422';
        CrypticChat.userColors = items.userColors || [];
        CrypticChat.inputBoxColor = items.inputBoxColor || '#1e1e3f';
        CrypticChat.headerColor = items.headerColor || '#1a1a40';
        CrypticChat.windowTransparency = items.windowTransparency || 90;
        
        const crypticChatWindow = document.getElementById('crypticChatWindow');
        if (crypticChatWindow) {
            const content = crypticChatWindow.querySelector('.cryptic-chat-content');
            const input = crypticChatWindow.querySelector('.cryptic-chat-input');
            const header = crypticChatWindow.querySelector('.cryptic-chat-header');

            content.style.backgroundColor = CrypticChat.backgroundColor;
            input.style.backgroundColor = CrypticChat.inputBoxColor;
            header.style.backgroundColor = CrypticChat.headerColor;
            crypticChatWindow.style.backgroundColor = `rgba(15, 15, 35, ${CrypticChat.windowTransparency / 100})`;
        }
    });
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
    
    decryptedTexts.slice(-CrypticChat.messagesToLoad).forEach(text => {
        if (!existingMessages.has(text)) {
            existingMessages.add(text);
            const messageElement = document.createElement('div');
            messageElement.textContent = text;
            messageElement.style.marginBottom = '10px';
            
            // Apply user color if matched
            const username = text.split(':')[0].trim();
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
    chrome.storage.local.get(['codebook', 'autoSend'], function(result) {
        const codebook = result.codebook || {};
        const autoSend = result.autoSend !== false;
        let encryptedMessage = message;

        for (const key in codebook) {
            if (codebook.hasOwnProperty(key)) {
                encryptedMessage = encryptedMessage.replace(new RegExp(CrypticChat.escapeRegExp(key), 'g'), codebook[key]);
            }
        }

        CrypticChat.Discord.setDiscordMessage(encryptedMessage, autoSend);
    });
};

CrypticChat.init = function() {
    CrypticChat.applyOptions();
    chrome.storage.local.get('codebook', function(result) {
        CrypticChat.codebook = result.codebook || {};
        CrypticChat.reloadMessages();
    });

    setInterval(CrypticChat.reloadMessages, 5000);
};

CrypticChat.init();

const chatObserver = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && node.id.startsWith('chat-messages-')) {
                    CrypticChat.reloadMessages();
                    return;
                }
            }
        }
    }
});

const chatArea = document.querySelector('[class^="chatContent_"]');
if (chatArea) {
    chatObserver.observe(chatArea, { childList: true, subtree: true });
}

// Add a new observer for channel switches
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'reloadMessages') {
        CrypticChat.reloadMessages();
    }
});

// Add a listener for storage changes to update options in real-time
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        CrypticChat.applyOptions();
    }
});