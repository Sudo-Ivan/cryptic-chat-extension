let crypticChatInterval;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "parseCrypticText") {
    parseCrypticText();
    return true;
  }

  if (isValidMessage(request)) {
    try {
      chrome.storage.local.get("codebook", (data) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }

        const codebook = data.codebook || {};
        let processedMessage = request.message;
        let actionType;

        if (request.action === "encrypt") {
          for (const key in codebook) {
            if (codebook.hasOwnProperty(key)) {
              processedMessage = processedMessage.replace(new RegExp(escapeRegExp(key), 'g'), codebook[key]);
            }
          }
          actionType = 'encryptedMessage';
        } else if (request.action === "decrypt") {
          for (const key in codebook) {
            if (codebook.hasOwnProperty(key)) {
              processedMessage = processedMessage.replace(new RegExp(escapeRegExp(codebook[key]), 'g'), key);
            }
          }
          actionType = 'decryptedMessage';
        }

        let response = {};
        response[actionType] = processedMessage;

        sendResponse(response);
      });
    } catch (error) {
      console.error("Error in onMessage listener: ", error);
      sendResponse({ error: "An error occurred while processing the message" });
    }
  } else {
    sendResponse({ error: 'Invalid message format' });
  }
  return true;
});

function isValidMessage(request) {
  return request &&
         (request.action === 'encrypt' || request.action === 'decrypt') &&
         typeof request.message === 'string';
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCrypticText() {
  try {
    chrome.storage.local.get("codebook", (data) => {
      if (chrome.runtime.lastError) {
        console.error("Chrome runtime error: ", chrome.runtime.lastError);
        return;
      }

      const codebook = data.codebook || {};
      let decryptedTexts = discordParse(codebook);

      if (decryptedTexts.length > 0) {
        displayDecryptedText(decryptedTexts.join('\n\n'));
      }
    });
  } catch (error) {
    console.error("Error in parseCrypticText: ", error);
    if (error.message.includes("Extension context invalidated")) {
      clearInterval(crypticChatInterval);
    }
  }
}

function displayDecryptedText(text) {
  try {
    let decryptedBox = document.getElementById('cryptic-chat-decrypted-box');
    if (!decryptedBox) {
      decryptedBox = document.createElement('div');
      decryptedBox.id = 'cryptic-chat-decrypted-box';
      decryptedBox.style.position = 'fixed';
      decryptedBox.style.bottom = '10px';
      decryptedBox.style.right = '10px';
      decryptedBox.style.width = '450px';
      decryptedBox.style.maxHeight = '400px';
      decryptedBox.style.overflowY = 'auto';
      decryptedBox.style.backgroundColor = '#16213e';
      decryptedBox.style.border = '1px solid #4ecca3';
      decryptedBox.style.borderRadius = '10px';
      decryptedBox.style.padding = '10px';
      decryptedBox.style.zIndex = '9999';
      decryptedBox.style.color = '#ffffff';
      decryptedBox.style.fontFamily = "'Roboto', 'Arial', sans-serif";
      
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '5px';
      closeButton.style.backgroundColor = '#4ecca3';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '5px';
      closeButton.style.padding = '5px 10px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => decryptedBox.remove();
      
      decryptedBox.appendChild(closeButton);
      document.body.appendChild(decryptedBox);
    }
    
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="color: #4ecca3; margin-top: 0; margin-bottom: 10px;">Cryptic Chat</h3>
      <hr style="border: 0; height: 1px; background-color: #4ecca3; margin-bottom: 10px;">
      <pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0;">${text}</pre>
    `;
    
    decryptedBox.innerHTML = '';
    decryptedBox.appendChild(content);
  } catch (error) {
    console.error("Error in displayDecryptedText: ", error);
  }
}

try {
  parseCrypticText();
  crypticChatInterval = setInterval(parseCrypticText, 5000);
} catch (error) {
  console.error("Error in initial parseCrypticText call: ", error);
}