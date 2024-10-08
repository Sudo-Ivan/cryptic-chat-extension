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
  } else if (request.action === 'encryptData') {
    generateKey(request.password)
      .then(key => encryptData(request.data, key))
      .then(encryptedData => sendResponse({ encryptedData }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === 'decryptData') {
    generateKey(request.password)
      .then(key => decryptData(request.data, key))
      .then(decryptedData => sendResponse({ decryptedData }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
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
  
  chrome.storage.local.get([
    'codebook', 
    'mutedUsers', 
    'crypticPhrase', 
    'caseInsensitiveEncryption',
    'destructableMessages',
    'destructKeyword',
    'defaultDestructTime'
  ], function(result) {
    const codebook = result.codebook || {};
    const mutedUsers = result.mutedUsers || [];
    const crypticPhrase = result.crypticPhrase || '\\d ! d';
    const caseInsensitiveEncryption = result.caseInsensitiveEncryption || false;
    const destructableMessages = result.destructableMessages || false;
    const destructKeyword = result.destructKeyword || '\\d ! d';
    const defaultDestructTime = result.defaultDestructTime || 5;
    
    // Check if the message is from a muted user
    const username = extractUsername(processedMessage);
    if (mutedUsers.includes(username)) {
      sendResponse({ error: 'Message from muted user' });
      return;
    }

    if (request.action === "encrypt") {
      // Handle destructible messages
      if (destructableMessages) {
        const destructRegex = caseInsensitiveEncryption 
          ? new RegExp(escapeRegExp(destructKeyword), 'gi')
          : new RegExp(escapeRegExp(destructKeyword), 'g');
        const destructMatch = processedMessage.match(destructRegex);
        if (destructMatch) {
          const minutes = destructMatch[1] || defaultDestructTime;
          processedMessage = processedMessage.replace(destructMatch[0], `${crypticPhrase}${minutes}//`);
        }
      }

      // Encrypt the message
      for (const key in codebook) {
        if (codebook.hasOwnProperty(key)) {
          const regex = caseInsensitiveEncryption 
            ? new RegExp(escapeRegExp(key), 'gi')
            : new RegExp(escapeRegExp(key), 'g');
          processedMessage = processedMessage.replace(regex, (match) => {
            const replacement = codebook[key];
            return caseInsensitiveEncryption ? replacement : (
              match === match.toUpperCase() ? replacement.toUpperCase() :
              match === match.toLowerCase() ? replacement.toLowerCase() :
              replacement
            );
          });
        }
      }
      sendResponse({ encryptedMessage: processedMessage });
    } else {
      // Decrypt the message
      // Handle destructible messages
      const destructRegex = caseInsensitiveEncryption 
        ? new RegExp(escapeRegExp(crypticPhrase) + '(\\d+)//', 'gi')
        : new RegExp(escapeRegExp(crypticPhrase) + '(\\d+)//', 'g');
      const destructMatch = processedMessage.match(destructRegex);
      
      if (destructMatch) {
        const destructMinutes = parseInt(destructMatch[1]);
        // Remove the destruction keyword from the message
        processedMessage = processedMessage.replace(destructMatch[0], '').trim();
        processedMessage += ` [This message will self-destruct in ${destructMinutes} minutes]`;
      }

      // Decrypt the message
      for (const key in codebook) {
        if (codebook.hasOwnProperty(key)) {
          const regex = caseInsensitiveEncryption 
            ? new RegExp(escapeRegExp(codebook[key]), 'gi')
            : new RegExp(escapeRegExp(codebook[key]), 'g');
          processedMessage = processedMessage.replace(regex, (match) => {
            return caseInsensitiveEncryption ? key : (
              match === match.toUpperCase() ? key.toUpperCase() :
              match === match.toLowerCase() ? key.toLowerCase() :
              key
            );
          });
        }
      }
      sendResponse({ decryptedMessage: processedMessage });
    }
  });
}

function extractUsername(message) {
  // This function should extract the username from the message
  const match = message.match(/^([^:]+):/);
  return match ? match[1].trim() : '';
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

let messageCheckIntervalId = null;

function startMessageCheckInterval(interval) {
    if (messageCheckIntervalId) {
        clearInterval(messageCheckIntervalId);
    }
    messageCheckIntervalId = setInterval(checkForNewMessages, interval * 1000);
}

function checkForNewMessages() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'checkForNewMessages' });
        }
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get('messageCheckInterval', (result) => {
        const interval = result.messageCheckInterval || 5;
        startMessageCheckInterval(interval);
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateMessageCheckInterval') {
        chrome.storage.local.get('messageCheckInterval', (result) => {
            const interval = result.messageCheckInterval || 5;
            startMessageCheckInterval(interval);
        });
    }
});

// Add these functions at the beginning of the file
async function generateKey(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptData(data, key) {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData
  );
  return {
    iv: Array.from(iv),
    encryptedData: Array.from(new Uint8Array(encryptedContent))
  };
}

async function decryptData(encryptedData, key) {
  const iv = new Uint8Array(encryptedData.iv);
  const data = new Uint8Array(encryptedData.encryptedData);
  const decryptedContent = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedContent));
}