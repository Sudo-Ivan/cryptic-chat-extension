window.CrypticChat = window.CrypticChat || {};

CrypticChat.discordParse = function(codebook) {
  let decryptedTexts = [];

  const chatArea = document.querySelector('[class^="chatContent_"]');
  if (!chatArea) return decryptedTexts;

  const messageElements = chatArea.querySelectorAll('[id^="chat-messages-"]');
  for (let i = 0; i < messageElements.length; i++) {
      const decryptedText = CrypticChat.decryptElement(messageElements[i], codebook);
      if (decryptedText) {
          decryptedTexts.push(decryptedText);
          if (decryptedTexts.length >= 10) break;
      }
  }

  return decryptedTexts;
};

CrypticChat.decryptElement = function(messageElement, codebook) {
    try {
        const contentElement = messageElement.querySelector('[id^="message-content-"]');
        if (!contentElement) return null;
  
        const originalText = contentElement.textContent.trim();
        let decryptedText = originalText;
  
        for (const key in codebook) {
            if (Object.prototype.hasOwnProperty.call(codebook, key)) {
                const value = codebook[key];
                decryptedText = decryptedText.replace(new RegExp(CrypticChat.escapeRegExp(value), 'g'), key);
            }
        }
  
        if (decryptedText !== originalText) {
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
};

CrypticChat.escapeRegExp = function(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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