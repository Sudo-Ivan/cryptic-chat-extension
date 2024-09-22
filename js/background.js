chrome.runtime.onInstalled.addListener(() => {
  const defaultWordlist = {
    "bypassing censorship is the best": "veggies are good for you"
  };
  chrome.storage.local.set({ wordlist: defaultWordlist });

  chrome.contextMenus.create({
    id: "encrypt",
    title: "Encrypt selected text",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "decrypt",
    title: "Decrypt selected text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "encrypt" || info.menuItemId === "decrypt") {
    chrome.storage.local.get("wordlist", (data) => {
      processMessage(data.wordlist || {}, {
        action: info.menuItemId,
        message: info.selectionText
      }, (response) => {
        openPopupWithResults(tab.id, response);
      });
    });
  }
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

function openPopupWithResults(tabId, results, originalMessage) {
  chrome.windows.create({
    url: chrome.runtime.getURL("html/popup.html"),
    type: "popup",
    width: 400,
    height: 600
  }, (popupWindow) => {
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
      if (info.status === 'complete' && updatedTabId === popupWindow.tabs[0].id) {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.sendMessage(popupWindow.tabs[0].id, {
          action: "showResults",
          results: results,
          message: originalMessage
        });
      }
    });
  });
}