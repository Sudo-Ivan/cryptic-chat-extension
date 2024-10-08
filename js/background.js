let popupWindowId = null;
let codebook = {};

function saveCodebook(newCodebook) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ codebook: newCodebook }, () => {
      if (chrome.runtime.lastError) {
        reject('Error saving codebook: ' + chrome.runtime.lastError.message);
      } else {
        codebook = newCodebook;
        resolve();
      }
    });
  });
}

function getCodebook() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('codebook', (result) => {
      if (chrome.runtime.lastError) {
        reject('Error getting codebook: ' + chrome.runtime.lastError.message);
      } else {
        resolve(result.codebook || {});
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  getCodebook()
    .then((loadedCodebook) => {
      codebook = loadedCodebook;
      if (Object.keys(codebook).length === 0) {
        const defaultCodebook = {
          "I hate veggies": "veggies are good for you"
        };
        return saveCodebook(defaultCodebook);
      }
    })
    .catch((error) => console.error('Error during initialization:', error));

  chrome.storage.local.set({ messageLimit: 10 });

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

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [{
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{
          header: 'Access-Control-Allow-Origin',
          operation: 'set',
          value: '*'
        }]
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['xmlhttprequest']
      }
    }]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "encrypt" || info.menuItemId === "decrypt") {
    processMessage({
      action: info.menuItemId,
      message: info.selectionText
    }, (response) => {
      openOrUpdatePopupWithResults(response, info.selectionText);
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reloadMessages') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadMessages' });
    });
  } else if (request.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
  } else if (request.action === 'codebookUpdated') {
    getCodebook()
      .then((updatedCodebook) => {
        codebook = updatedCodebook;
      })
      .catch((error) => console.error('Error updating codebook:', error));
  } else if (isValidMessage(request)) {
    processMessage(request, sendResponse);
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

function processMessage(request, sendResponse) {
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