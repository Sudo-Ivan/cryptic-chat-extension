window.CrypticChat = window.CrypticChat || {};

CrypticChat.escapeRegExp = function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

CrypticChat.Discord = {
    discordParse: function(codebook) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['mutedUsers', 'discordSelectors'], (result) => {
                const mutedUsers = result.mutedUsers || [];
                const selectors = result.discordSelectors || {
                    chatArea: '[class^="chatContent_"]',
                    messageElements: '[id^="chat-messages-"]',
                    contentElement: '[id^="message-content-"]',
                    repliedTextPreview: '[class*="repliedTextPreview_"]',
                    usernameElement: '[class*="username_"]',
                    timestampElement: 'time',
                    messageInput: 'div[role="textbox"][data-slate-editor="true"]'
                };
                let decryptedTexts = [];
                const chatArea = document.querySelector(selectors.chatArea);
                if (!chatArea) {
                    resolve(decryptedTexts);
                    return;
                }

                const messageElements = chatArea.querySelectorAll(selectors.messageElements);
                const decryptionPromises = [];

                for (let i = messageElements.length - 1; i >= 0; i--) {
                    decryptionPromises.push(this.decryptElement(messageElements[i], codebook, selectors));
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

    decryptElement: function(messageElement, codebook, selectors) {
        return new Promise((resolve) => {
            try {
                const contentElement = messageElement.querySelector(selectors.contentElement);
                if (!contentElement) {
                    resolve(null);
                    return;
                }

                const repliedTextPreview = messageElement.querySelector(selectors.repliedTextPreview);
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

                    // Sort the codebook keys by length in descending order
                    const sortedKeys = Object.keys(codebook).sort((a, b) => b.length - a.length);

                    for (const key of sortedKeys) {
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

                    if (isDecrypted) {
                        // Check for destructible message
                        const destructRegex = new RegExp(`${CrypticChat.escapeRegExp(crypticPhrase)}(\\d+)`, caseInsensitiveEncryption ? 'gi' : 'g');
                        const destructMatch = decryptedText.match(destructRegex);
                        
                        if (destructMatch) {
                            const destructMinutes = parseInt(destructMatch[1]);
                            const timestamp = messageElement.querySelector(selectors.timestampElement).dateTime;
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

                        let usernameElement = messageElement.querySelector(selectors.usernameElement);
                        let timestampElement = messageElement.querySelector(selectors.timestampElement);

                        if (!usernameElement || !timestampElement) {
                            let currentElement = messageElement;
                            while (currentElement && (!usernameElement || !timestampElement)) {
                                currentElement = currentElement.previousElementSibling;
                                if (currentElement) {
                                    if (!usernameElement) {
                                        usernameElement = currentElement.querySelector(selectors.usernameElement);
                                    }
                                    if (!timestampElement) {
                                        timestampElement = currentElement.querySelector(selectors.timestampElement);
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
        chrome.storage.local.get('discordSelectors', (result) => {
            const selectors = result.discordSelectors || {
                messageInput: 'div[role="textbox"][data-slate-editor="true"]'
            };
            const messageInput = document.querySelector(selectors.messageInput);
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
        });
    },

    init: function() {
        // Any initialization code for Discord-specific functionality
    }
};

// Initialize Discord-specific functionality
CrypticChat.Discord.init();