let popupWindowId = null;

chrome.runtime.onInstalled.addListener(() => {
  const defaultCodebook = {
    "I hate veggies": "veggies are good for you"
  };
  chrome.storage.local.set({ codebook: defaultCodebook });

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
    chrome.storage.local.get("codebook", (data) => {
      processMessage(data.codebook || {}, {
        action: info.menuItemId,
        message: info.selectionText
      }, (response) => {
        openOrUpdatePopupWithResults(response, info.selectionText);
      });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (isValidMessage(request)) {
    chrome.storage.local.get("codebook", (data) => {
      processMessage(data.codebook || {}, request, sendResponse);
    });
    return true;
  } else {
    sendResponse({ error: 'Invalid message format' });
  }
});

function isValidMessage(request) {
  return request &&
         (request.action === 'encrypt' || request.action === 'decrypt') &&
         typeof request.message === 'string';
}

function processMessage(codebook, request, sendResponse) {
  let processedMessage = request.message;
  
  if (request.action === "encrypt") {
    for (const key in codebook) {
      if (codebook.hasOwnProperty(key)) {
        processedMessage = processedMessage.replace(new RegExp(escapeRegExp(key), 'g'), codebook[key]);
      }
    }
    sendResponse({ encryptedMessage: processedMessage });
  } else {
    for (const key in codebook) {
      if (codebook.hasOwnProperty(key)) {
        processedMessage = processedMessage.replace(new RegExp(escapeRegExp(codebook[key]), 'g'), key);
      }
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