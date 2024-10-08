window.CrypticChat = window.CrypticChat || {};

CrypticChat.Discord = {
    discordParse: function(codebook) {
        let decryptedTexts = [];
        const chatArea = document.querySelector('[class^="chatContent_"]');
        if (!chatArea) return decryptedTexts;

        const messageElements = chatArea.querySelectorAll('[id^="chat-messages-"]');
        for (let i = messageElements.length - 1; i >= 0; i--) {
            const decryptedText = this.decryptElement(messageElements[i], codebook);
            if (decryptedText) {
                decryptedTexts.unshift(decryptedText);
                if (decryptedTexts.length >= 50) break;
            }
        }
        return decryptedTexts;
    },

    decryptElement: function(messageElement, codebook) {
        try {
            const contentElement = messageElement.querySelector('[id^="message-content-"]');
            if (!contentElement) return null;

            const originalText = contentElement.textContent.trim();
            let decryptedText = originalText;
            let isDecrypted = false;

            for (const key in codebook) {
                if (Object.prototype.hasOwnProperty.call(codebook, key)) {
                    const value = codebook[key];
                    if (decryptedText.includes(value)) {
                        decryptedText = decryptedText.replace(new RegExp(CrypticChat.escapeRegExp(value), 'g'), key);
                        isDecrypted = true;
                    }
                }
            }

            if (isDecrypted) {
                let username = 'Unknown User';
                let timestamp = '';

                let usernameElement = messageElement.querySelector('[class*="username_"]');
                let timestampElement = messageElement.querySelector('time');

                if (!usernameElement || !timestampElement) {
                    let currentElement = messageElement;
                    while (currentElement && (!usernameElement || !timestampElement)) {
                        currentElement = currentElement.previousElementSibling;
                        if (currentElement) {
                            if (!usernameElement) {
                                usernameElement = currentElement.querySelector('[class*="username_"]');
                            }
                            if (!timestampElement) {
                                timestampElement = currentElement.querySelector('time');
                            }
                        }
                    }
                }

                if (usernameElement) {
                    username = usernameElement.textContent.trim();
                }
                if (timestampElement) {
                    timestamp = timestampElement.getAttribute('aria-label') || timestampElement.textContent.trim();
                }

                return `${username}: ${decryptedText} - ${timestamp}`;
            }

            return null;
        } catch (error) {
            console.error("Error in decryptElement: ", error);
            return null;
        }
    },

    setDiscordMessage: function(message, sendMessage = false) {
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

        if (sendMessage) {
            const enterEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                keyCode: 13,
                which: 13
            });
            messageInput.dispatchEvent(enterEvent);
        }
    },

    syncScroll: function() {
        const discordScroller = document.querySelector('[class^="scroller_"]');
        const popupContainer = document.querySelector('.popup-container');
        if (!popupContainer) return;
        const resultArea = popupContainer.querySelector('#resultArea');

        if (!discordScroller || !resultArea) return;

        discordScroller.addEventListener('scroll', () => {
            const scrollPercentage = discordScroller.scrollTop / (discordScroller.scrollHeight - discordScroller.clientHeight);
            resultArea.scrollTop = scrollPercentage * (resultArea.scrollHeight - resultArea.clientHeight);
        });

        resultArea.addEventListener('scroll', () => {
            const scrollPercentage = resultArea.scrollTop / (resultArea.scrollHeight - resultArea.clientHeight);
            discordScroller.scrollTop = scrollPercentage * (discordScroller.scrollHeight - discordScroller.clientHeight);
        });
    },

    init: function() {
        this.syncScroll();
    }
};

// Initialize Discord-specific functionality
CrypticChat.Discord.init();