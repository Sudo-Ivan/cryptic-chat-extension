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
    chrome.storage.local.get(["codebook", "messageLimit"], (data) => {
      if (chrome.runtime.lastError) {
        console.error("Chrome runtime error: ", chrome.runtime.lastError);
        return;
      }

      const codebook = data.codebook || {};
      const messageLimit = data.messageLimit || 10;
      let decryptedTexts = CrypticChat.discordParse(codebook, messageLimit);

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

const styles = `
  .cryptic-chat-box {
    position: fixed;
    bottom: 10px;
    right: 10px;
    width: 450px;
    height: 400px;
    background-color: #0f0f23;
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
`;

function injectStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

function displayDecryptedText(text) {
  try {
    let decryptedBox = document.getElementById('cryptic-chat-decrypted-box');
    if (!decryptedBox) {
      injectStyles();

      decryptedBox = document.createElement('div');
      decryptedBox.id = 'cryptic-chat-decrypted-box';
      decryptedBox.className = 'cryptic-chat-box';
      
      decryptedBox.innerHTML = `
        <div class="cryptic-chat-header">
          <span style="font-weight: bold;">Cryptic Chat</span>
          <div>
            <button id="minimizeBtn" class="cryptic-chat-btn">−</button>
            <button id="closeBtn" class="cryptic-chat-btn">×</button>
          </div>
        </div>
        <div class="cryptic-chat-content"></div>
        <textarea class="cryptic-chat-input" placeholder="Type your message here... (Press Enter to encrypt and send to Discord input)"></textarea>
      `;
      
      document.body.appendChild(decryptedBox);
      
      const header = decryptedBox.querySelector('.cryptic-chat-header');
      makeDraggable(decryptedBox, header);
      
      document.getElementById('minimizeBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const content = decryptedBox.querySelector('.cryptic-chat-content');
        const input = decryptedBox.querySelector('.cryptic-chat-input');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
        input.style.display = input.style.display === 'none' ? 'block' : 'none';
        decryptedBox.style.height = content.style.display === 'none' ? 'auto' : '400px';
        updateLayout(decryptedBox);
      });
      
      document.getElementById('closeBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        decryptedBox.remove();
      });
      
      const input = decryptedBox.querySelector('.cryptic-chat-input');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          encryptAndSend(input.value);
          input.value = '';
        }
      });

      decryptedBox.addEventListener('mouseup', () => updateLayout(decryptedBox));
      window.addEventListener('resize', () => updateLayout(decryptedBox));
    }

    const content = decryptedBox.querySelector('.cryptic-chat-content');
    content.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0;">${text}</pre>`;
    
    updateLayout(decryptedBox);
  } catch (error) {
    console.error("Error in displayDecryptedText: ", error);
  }
}

function updateLayout(element) {
  const header = element.querySelector('.cryptic-chat-header');
  const content = element.querySelector('.cryptic-chat-content');
  const input = element.querySelector('.cryptic-chat-input');

  const headerHeight = header.offsetHeight;
  const inputHeight = input.offsetHeight;
  const totalHeight = element.offsetHeight;

  content.style.height = `${totalHeight - headerHeight - inputHeight - 20}px`;
}

function makeDraggable(element, dragHandle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  dragHandle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
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
    updateLayout(element);
  }
}

function encryptAndSend(message) {
  chrome.storage.local.get("codebook", (data) => {
    const codebook = data.codebook || {};
    let encryptedMessage = message;

    for (const key in codebook) {
      if (Object.prototype.hasOwnProperty.call(codebook, key)) {
        encryptedMessage = encryptedMessage.replace(new RegExp(escapeRegExp(key), 'g'), codebook[key]);
      }
    }

    CrypticChat.setDiscordMessage(encryptedMessage);
  });
}

try {
  parseCrypticText();
  crypticChatInterval = setInterval(parseCrypticText, 5000);
} catch (error) {
  console.error("Error in initial parseCrypticText call: ", error);
}