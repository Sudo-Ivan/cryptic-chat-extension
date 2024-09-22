chrome.runtime.onInstalled.addListener(() => {
    const defaultWordlist = {
      "bypassing censorship is the best": "veggies are good for you"
    };
    chrome.storage.local.set({ wordlist: defaultWordlist });
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "encrypt" || request.action === "decrypt") {
      chrome.storage.local.get("wordlist", (data) => {
        processMessage(data.wordlist || {}, request, sendResponse);
      });
      return true;
    }
  });
  
  function processMessage(wordlist, request, sendResponse) {
    let processedMessage = request.message;
    
    if (request.action === "encrypt") {
      for (const [key, value] of Object.entries(wordlist)) {
        processedMessage = processedMessage.replace(new RegExp(escapeRegExp(key), 'g'), value);
      }
      sendResponse({ encryptedMessage: processedMessage });
    } else {
      for (const [key, value] of Object.entries(wordlist)) {
        processedMessage = processedMessage.replace(new RegExp(escapeRegExp(value), 'g'), key);
      }
      sendResponse({ decryptedMessage: processedMessage });
    }
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }