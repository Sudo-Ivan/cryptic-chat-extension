window.CrypticChat = window.CrypticChat || {};

CrypticChat.Element = {
    elementParse: function(codebook) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['mutedUsers', 'elementSelectors'], (result) => {
                const mutedUsers = result.mutedUsers || [];
                const selectors = result.elementSelectors || {
                    chatArea: '[class^="mx_RoomView_messagePanel"]',
                    messageElements: '[class^="mx_EventTile"]',
                    contentElement: '[class^="mx_EventTile_body"]',
                    usernameElement: '[class^="mx_Username_color"][class*="mx_DisambiguatedProfile_displayName"]',
                    timestampElement: '[class^="mx_MessageTimestamp"]',
                    messageInput: '[class^="mx_BasicMessageComposer_input"]'
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
                    console.error("Error in elementParse:", error);
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

                const originalText = contentElement.textContent.trim();
                let decryptedText = originalText;
                let isDecrypted = false;

                chrome.storage.local.get(['caseInsensitiveEncryption', 'crypticPhrase'], function(result) {
                    const caseInsensitiveEncryption = result.caseInsensitiveEncryption || false;
                    const crypticPhrase = result.crypticPhrase || '\\d ! d';

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
                        const destructRegex = new RegExp(`${CrypticChat.escapeRegExp(crypticPhrase)}(\\d+)`, caseInsensitiveEncryption ? 'gi' : 'g');
                        const destructMatch = decryptedText.match(destructRegex);

                        if (destructMatch) {
                            const destructMinutes = parseInt(destructMatch[1]);
                            const timestamp = messageElement.querySelector(selectors.timestampElement).getAttribute('data-timestamp');
                            const messageTime = new Date(parseInt(timestamp)).getTime();
                            const currentTime = new Date().getTime();
                            const timeDiff = (currentTime - messageTime) / (1000 * 60);

                            if (timeDiff >= destructMinutes) {
                                resolve(null);
                                return;
                            }

                            decryptedText = decryptedText.replace(destructMatch[0], '').trim();
                        }

                        let username = 'Unknown User';
                        let timestamp = '';

                        const usernameElement = messageElement.querySelector(selectors.usernameElement);
                        const timestampElement = messageElement.querySelector(selectors.timestampElement);

                        if (usernameElement) {
                            username = usernameElement.textContent.trim();
                        }
                        if (timestampElement) {
                            timestamp = timestampElement.textContent.trim();
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

    setElementMessage: function(message, sendMessage = false) {
        chrome.storage.local.get('elementSelectors', (result) => {
            const selectors = result.elementSelectors || {
                messageInput: '.mx_BasicMessageComposer_input'
            };
            const messageInput = document.querySelector(selectors.messageInput);
            if (!messageInput) {
                console.error('Element message input not found');
                return;
            }

            messageInput.focus();
            messageInput.textContent = message;

            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            messageInput.dispatchEvent(inputEvent);

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
        // Any initialization code for Element-specific functionality
    }
};

// Initialize Element-specific functionality
CrypticChat.Element.init();