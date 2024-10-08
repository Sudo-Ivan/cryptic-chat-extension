window.CrypticChat = window.CrypticChat || {};

CrypticChat.escapeRegExp = function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

CrypticChat.Discord = {
    discordParse: function(codebook) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('mutedUsers', (result) => {
                const mutedUsers = result.mutedUsers || [];
                let decryptedTexts = [];
                const chatArea = document.querySelector('[class^="chatContent_"]');
                if (!chatArea) {
                    resolve(decryptedTexts);
                    return;
                }

                const messageElements = chatArea.querySelectorAll('[id^="chat-messages-"]');
                const decryptionPromises = [];

                for (let i = messageElements.length - 1; i >= 0; i--) {
                    decryptionPromises.push(this.decryptElement(messageElements[i], codebook));
                }

                Promise.all(decryptionPromises).then(decryptedResults => {
                    decryptedResults.forEach(decryptedText => {
                        if (decryptedText) {
                            const username = decryptedText.split(':')[0].trim();
                            if (!mutedUsers.includes(username)) {
                                decryptedTexts.unshift(decryptedText);
                                if (decryptedTexts.length >= 50) return;
                            }
                        }
                    });
                    resolve(decryptedTexts);
                }).catch(error => {
                    console.error("Error in discordParse:", error);
                    resolve(decryptedTexts);
                });
            });
        });
    },

    decryptElement: function(messageElement, codebook) {
        return new Promise((resolve) => {
            try {
                const contentElement = messageElement.querySelector('[id^="message-content-"]');
                if (!contentElement) {
                    resolve(null);
                    return;
                }

                // Ignore repliedTextPreview
                const repliedTextPreview = messageElement.querySelector('[class*="repliedTextPreview_"]');
                if (repliedTextPreview) {
                    resolve(null);
                    return;
                }

                const originalText = contentElement.textContent.trim();
                let decryptedText = originalText;
                let isDecrypted = false;

                chrome.storage.local.get(['caseInsensitiveEncryption', 'crypticPhrase'], function(result) {
                    const caseInsensitiveEncryption = result.caseInsensitiveEncryption || false;
                    const crypticPhrase = result.crypticPhrase || '\\d ! d';

                    for (const key in codebook) {
                        if (Object.prototype.hasOwnProperty.call(codebook, key)) {
                            const value = codebook[key];
                            const regex = caseInsensitiveEncryption 
                                ? new RegExp(CrypticChat.escapeRegExp(value), 'gi')
                                : new RegExp(CrypticChat.escapeRegExp(value), 'g');
                            
                            if (decryptedText.match(regex)) {
                                decryptedText = decryptedText.replace(regex, (match) => {
                                    return caseInsensitiveEncryption ? key : (
                                        match === match.toUpperCase() ? key.toUpperCase() :
                                        match === match.toLowerCase() ? key.toLowerCase() :
                                        key
                                    );
                                });
                                isDecrypted = true;
                            }
                        }
                    }

                    if (isDecrypted) {
                        // Check for destructible message
                        const destructRegex = caseInsensitiveEncryption 
                            ? new RegExp(CrypticChat.escapeRegExp(crypticPhrase) + '(\\d+)//', 'gi')
                            : new RegExp(CrypticChat.escapeRegExp(crypticPhrase) + '(\\d+)//', 'g');
                        const destructMatch = decryptedText.match(destructRegex);
                        
                        if (destructMatch) {
                            const destructMinutes = parseInt(destructMatch[1]);
                            const timestamp = messageElement.querySelector('time').dateTime;
                            const messageTime = new Date(timestamp).getTime();
                            const currentTime = new Date().getTime();
                            const timeDiff = (currentTime - messageTime) / (1000 * 60); // difference in minutes

                            if (timeDiff >= destructMinutes) {
                                resolve(null); // Message should be destroyed
                                return;
                            }

                            // Remove the destruction keyword from the message
                            decryptedText = decryptedText.replace(destructMatch[0], '').trim();
                        }

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

                        resolve(`${username}: ${decryptedText} - ${timestamp}`);
                    } else {
                        resolve(null);
                    }
                });
            } catch (error) {
                console.error("Error in decryptElement:", error);
                resolve(null);
            }
        });
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

    init: function() {
        // Any initialization code for Discord-specific functionality
    }
};

// Initialize Discord-specific functionality
CrypticChat.Discord.init();