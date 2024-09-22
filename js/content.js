chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.storage.local.get("wordlist", (data) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
  
      const wordlist = data.wordlist || {};
      let processedMessage = request.message;
      let actionType;
  
      if (request.action === "encrypt") {
        for (const [key, value] of Object.entries(wordlist)) {
          processedMessage = processedMessage.replace(new RegExp(escapeRegExp(key), 'g'), value);
        }
        actionType = 'encryptedMessage';
      } else if (request.action === "decrypt") {
        for (const [key, value] of Object.entries(wordlist)) {
          processedMessage = processedMessage.replace(new RegExp(escapeRegExp(value), 'g'), key);
        }
        actionType = 'decryptedMessage';
      } else {
        sendResponse({ error: "Unknown action" });
        return;
      }
  
      let response = {};
      response[actionType] = processedMessage;
  
      sendResponse(response);
    });
    return true;
  });
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }