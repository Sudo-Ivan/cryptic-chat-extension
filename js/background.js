let popupWindowId = null;

chrome.runtime.onInstalled.addListener(() => {
  const defaultWordlist = {
    "I hate veggies": "veggies are good for you"
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
        openOrUpdatePopupWithResults(response, info.selectionText);
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

function openOrUpdatePopupWithResults(results, originalMessage) {
  if (popupWindowId === null) {
    chrome.windows.create({
      url: chrome.runtime.getURL("html/popup.html"),
      type: "popup",
      width: 400,
      height: 600
    }, (popupWindow) => {
      popupWindowId = popupWindow.id;
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (info.status === 'complete' && updatedTabId === popupWindow.tabs[0].id) {
          chrome.tabs.onUpdated.removeListener(listener);
          sendResultsToPopup(popupWindow.tabs[0].id, results, originalMessage);
        }
      });
    });
  } else {
    chrome.windows.get(popupWindowId, { populate: true }, (window) => {
      if (chrome.runtime.lastError) {
        popupWindowId = null;
        openOrUpdatePopupWithResults(results, originalMessage);
      } else {
        chrome.windows.update(popupWindowId, { focused: true });
        sendResultsToPopup(window.tabs[0].id, results, originalMessage);
      }
    });
  }
}

function sendResultsToPopup(tabId, results, originalMessage) {
  chrome.tabs.sendMessage(tabId, {
    action: "showResults",
    results: results,
    message: originalMessage
  });
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    popupWindowId = null;
  }
});