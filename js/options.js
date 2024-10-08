async function encryptCodebook(data, password) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'encryptData', data, password }, response => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.encryptedData);
      }
    });
  });
}

async function decryptCodebook(encryptedData, password) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'decryptData', data: encryptedData, password }, response => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.decryptedData);
      }
    });
  });
}

async function exportCodebookOnly() {
  try {
    chrome.storage.local.get(['codebook', 'useCodebookEncryption', 'codebookPassword'], async (items) => {
      const exportData = {
        codebook: items.codebook
      };

      const useCodebookEncryption = items.useCodebookEncryption;
      let dataToExport;

      if (useCodebookEncryption) {
        const password = items.codebookPassword;
        if (!password) {
          showStatus('Please set a password for codebook encryption in the options', true);
          return;
        }
        dataToExport = await encryptCodebook(exportData, password);
        dataToExport.encrypted = true;
      } else {
        dataToExport = exportData;
        dataToExport.encrypted = false;
      }

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cryptic_chat_codebook.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    showStatus('Error exporting codebook: ' + error.message, true);
  }
}

async function exportCodebookWithSettings() {
  try {
    chrome.storage.local.get(null, async (items) => {
      const exportData = {
        codebook: items.codebook,
        destructableMessages: items.destructableMessages,
        destructKeyword: items.destructKeyword,
        crypticPhrase: items.crypticPhrase,
        defaultDestructTime: items.defaultDestructTime,
        showDestructTimer: items.showDestructTimer
      };

      const useCodebookEncryption = items.useCodebookEncryption;
      let dataToExport;

      if (useCodebookEncryption) {
        const password = items.codebookPassword;
        if (!password) {
          showStatus('Please set a password for codebook encryption in the options', true);
          return;
        }
        dataToExport = await encryptCodebook(exportData, password);
        dataToExport.encrypted = true;
      } else {
        dataToExport = exportData;
        dataToExport.encrypted = false;
      }

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cryptic_chat_codebook_and_settings.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    showStatus('Error exporting data: ' + error.message, true);
  }
}

async function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const content = e.target.result;
      let importedData;

      if (file.name.endsWith('.txt')) {
        importedData = { codebook: parseTxtCodebook(content) };
      } else if (file.name.endsWith('.json')) {
        importedData = JSON.parse(content);
      } else {
        throw new Error('Unsupported file type');
      }

      if (importedData.encrypted) {
        const password = prompt('Please enter the password to decrypt the imported codebook:');
        if (!password) {
          showStatus('Password is required for codebook decryption', true);
          return;
        }
        const decryptedData = await decryptCodebook(importedData, password);
        handleImportedData(decryptedData);
      } else {
        handleImportedData(importedData);
      }
    } catch (error) {
      showStatus('Error processing imported file: ' + error.message, true);
    }
  };
  reader.readAsText(file);
}

function parseTxtCodebook(content) {
  const lines = content.split('\n');
  const codebook = {};
  lines.forEach(line => {
    const [key, value] = line.split(':').map(item => item.trim());
    if (key && value) {
      codebook[key] = value;
    }
  });
  return codebook;
}

function exportCodebookTxt() {
    const codebookText = document.getElementById("codebookText").value;
    const blob = new Blob([codebookText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codebook.txt';
    a.click();
    URL.revokeObjectURL(url);
}

let originalCodebook = '';

function searchCodebook() {
    const searchTerm = document.getElementById("codebookSearch").value.toLowerCase();
    const codebookText = document.getElementById("codebookText");
    
    if (!originalCodebook) {
        originalCodebook = codebookText.value;
    }
    
    if (searchTerm === '') {
        codebookText.value = originalCodebook;
    } else {
        const lines = originalCodebook.split('\n');
        const filteredLines = lines.filter(line => line.toLowerCase().includes(searchTerm));
        codebookText.value = filteredLines.join('\n');
    }
}

function updatePhraseCount() {
    const codebookText = document.getElementById("codebookText").value;
    const lines = codebookText.split('\n').filter(line => line.trim() !== '');
    const phraseCount = lines.length;
    document.getElementById("codebookPhraseCount").textContent = `Phrases: ${phraseCount}`;
}

document.addEventListener('DOMContentLoaded', function() {
  const codebookTextArea = document.getElementById("codebookText");
  const uploadBtn = document.getElementById("uploadBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.querySelector('.drop-zone');
  const updateFromUrlBtn = document.getElementById("updateFromUrlBtn");
  const autoUpdateCheckbox = document.getElementById("autoUpdate");
  const messagesToLoadInput = document.getElementById("messagesToLoad");
  const autoScrollCheckbox = document.getElementById("autoScroll");
  const backgroundColorInput = document.getElementById("backgroundColor");
  const addUserColorBtn = document.getElementById("addUserColor");
  const addMutedUserBtn = document.getElementById("addMutedUser");
  const newMutedUserInput = document.getElementById("newMutedUser");
  const resetThemeBtn = document.getElementById("resetTheme");
  const clearDataBtn = document.getElementById('clearDataBtn');
  const exportCodebookBtn = document.getElementById('exportCodebook');
  const exportCodebookTxtBtn = document.getElementById('exportCodebookTxt');
  const codebookSearch = document.getElementById('codebookSearch');
  const useCodebookEncryption = document.getElementById('useCodebookEncryption');

  loadOptions();

  if (codebookTextArea) codebookTextArea.addEventListener("input", debounce(() => {
    autoSaveCodebook();
    updatePhraseCount();
  }, 500));
  if (uploadBtn) uploadBtn.addEventListener('click', () => document.getElementById('fileInput').click());
  if (downloadBtn) downloadBtn.addEventListener('click', exportCodebookOnly);
  if (fileInput) fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));
  if (updateFromUrlBtn) updateFromUrlBtn.addEventListener("click", updateFromUrl);
  if (autoUpdateCheckbox) autoUpdateCheckbox.addEventListener("change", saveOptions);
  if (messagesToLoadInput) messagesToLoadInput.addEventListener("input", saveOptions);
  if (autoScrollCheckbox) autoScrollCheckbox.addEventListener("change", saveOptions);
  if (backgroundColorInput) backgroundColorInput.addEventListener("input", saveOptions);
  if (addUserColorBtn) addUserColorBtn.addEventListener("click", () => addUserColorRow());

  if (dropZone) {
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
  }

  if (addMutedUserBtn && newMutedUserInput) {
    addMutedUserBtn.addEventListener('click', () => {
      const newMutedUser = newMutedUserInput.value.trim();
      if (newMutedUser) {
        addMutedUserElement(newMutedUser);
        newMutedUserInput.value = '';
        saveOptions();
      }
    });
  }

  if (resetThemeBtn) {
    resetThemeBtn.addEventListener('click', () => {
      resetTheme();
      autoSave();
    });
  }

  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', clearAllData);
  }

  if (exportCodebookBtn) exportCodebookBtn.addEventListener('click', exportCodebookWithSettings);
  if (exportCodebookTxtBtn) exportCodebookTxtBtn.addEventListener('click', exportCodebookTxt);
  if (codebookSearch) codebookSearch.addEventListener('input', debounce(searchCodebook, 300));

  if (useCodebookEncryption) {
    useCodebookEncryption.addEventListener('change', function() {
      document.getElementById('codebookPassword').disabled = !this.checked;
      document.getElementById('exportCodebookTxt').disabled = this.checked;
    });
  }

  document.getElementById('saveBtn').addEventListener('click', () => saveOptions(true));

  ['messageBubbleColor', 'messageBubbleOpacity', 'destructableMessages', 'destructKeyword', 'crypticPhrase', 'defaultDestructTime', 'showDestructTimer'].forEach(id => {
    document.getElementById(id).addEventListener('change', debounce(autoSave, 500));
  });

  ['messagesToLoad', 'autoScroll', 'backgroundColor', 'inputBoxColor', 'headerColor', 'windowTransparency', 'autoSend', 'messageSpacing', 'messageBubbleColor', 'messageBubbleOpacity', 'messageCheckInterval'].forEach(id => {
    document.getElementById(id).addEventListener('change', debounce(autoSave, 500));
    document.getElementById(id).addEventListener('input', debounce(autoSave, 500));
  });

  document.getElementById('caseInsensitiveEncryption').addEventListener('change', saveOptions);

  document.getElementById('useCodebookEncryption').addEventListener('change', function() {
    document.getElementById('codebookPassword').disabled = !this.checked;
    saveOptions(false);
  });

  document.getElementById('codebookPassword').addEventListener('input', debounce(saveOptions, 500));

  if (codebookSearch) {
    codebookSearch.addEventListener('input', debounce(searchCodebook, 300));
  }

  if (codebookTextArea) {
    originalCodebook = codebookTextArea.value;
  }
});

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
  this.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileUpload(files[0]);
  }
}

function handleImportedData(importedData) {
  try {
    if (importedData.codebook) {
      document.getElementById('codebookText').value = formatCodebook(importedData.codebook);
      chrome.storage.local.set({ codebook: importedData.codebook });
    }

    if (importedData.destructableMessages !== undefined) {
      document.getElementById('destructableMessages').checked = importedData.destructableMessages;
    }
    if (importedData.destructKeyword) {
      document.getElementById('destructKeyword').value = importedData.destructKeyword;
    }
    if (importedData.crypticPhrase) {
      document.getElementById('crypticPhrase').value = importedData.crypticPhrase;
    }
    if (importedData.defaultDestructTime) {
      document.getElementById('defaultDestructTime').value = importedData.defaultDestructTime;
    }
    if (importedData.showDestructTimer !== undefined) {
      document.getElementById('showDestructTimer').checked = importedData.showDestructTimer;
    }

    saveOptions();
    showStatus('Codebook and settings imported successfully!');
  } catch (error) {
    showStatus('Error processing imported data: ' + error.message, true);
  }
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function autoSaveCodebook() {
  const codebookTextArea = document.getElementById("codebookText");
  const lines = codebookTextArea.value.split('\n');
  const updatedCodebook = {};
  let errorLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line) {
      const [key, value] = line.split(':').map(item => item.trim());
      if (key && value) {
        updatedCodebook[key] = value;
      } else {
        errorLines.push(i + 1);
      }
    }
  }

  chrome.storage.local.set({ codebook: updatedCodebook }, function() {
    if (chrome.runtime.lastError) {
      showStatus('Error saving codebook: ' + chrome.runtime.lastError.message, true);
    } else {
      originalCodebook = codebookTextArea.value; // Update the originalCodebook
      if (errorLines.length > 0) {
        showStatus('Codebook saved with errors. Please check lines: ' + errorLines.join(', '), true);
      } else {
        showStatus('Codebook saved successfully!');
        chrome.runtime.sendMessage({ action: 'codebookUpdated' });
      }
    }
  });
}

function saveOptions(showMessage = true) {
    const options = {
        messagesToLoad: document.getElementById('messagesToLoad').value,
        autoScroll: document.getElementById('autoScroll').checked,
        backgroundColor: document.getElementById('backgroundColor').value,
        inputBoxColor: document.getElementById('inputBoxColor').value,
        headerColor: document.getElementById('headerColor').value,
        windowTransparency: document.getElementById('windowTransparency').value,
        destructableMessages: document.getElementById('destructableMessages').checked,
        destructKeyword: document.getElementById('destructKeyword').value,
        crypticPhrase: document.getElementById('crypticPhrase').value,
        defaultDestructTime: document.getElementById('defaultDestructTime').value,
        showDestructTimer: document.getElementById('showDestructTimer').checked,
        messageSpacing: document.getElementById('messageSpacing').value,
        messageBubbleColor: document.getElementById('messageBubbleColor').value,
        messageBubbleOpacity: document.getElementById('messageBubbleOpacity').value,
        userColors: getUserColors(),
        mutedUsers: getMutedUsers(),
        autoSend: document.getElementById('autoSend').checked,
        caseInsensitiveEncryption: document.getElementById('caseInsensitiveEncryption').checked,
        messageCheckInterval: document.getElementById('messageCheckInterval').value,
        useCodebookEncryption: document.getElementById('useCodebookEncryption').checked,
        codebookPassword: document.getElementById('codebookPassword').value,
    };

    chrome.storage.local.set(options, function() {
        if (showMessage) {
            showStatus('Options saved');
        }
        // Notify background script to update the message check interval
        chrome.runtime.sendMessage({ action: 'updateMessageCheckInterval' });
    });
}

function loadOptions() {
  chrome.storage.local.get([
    'codebook',
    'messagesToLoad',
    'autoScroll',
    'backgroundColor',
    'inputBoxColor',
    'headerColor',
    'windowTransparency',
    'userColors',
    'url',
    'autoUpdate',
    'autoSend',
    'mutedUsers',
    'destructableMessages',
    'destructKeyword',
    'defaultDestructTime',
    'showDestructTimer',
    'messageSpacing',
    'crypticPhrase',
    'messageBubbleColor',
    'messageBubbleOpacity',
    'caseInsensitiveEncryption',
    'messageCheckInterval',
    'useCodebookEncryption',
    'codebookPassword',
  ], function(items) {
    document.getElementById('codebookText').value = formatCodebook(items.codebook || {});
    document.getElementById('messagesToLoad').value = items.messagesToLoad || 50;
    document.getElementById('autoScroll').checked = items.autoScroll !== false;
    document.getElementById('backgroundColor').value = items.backgroundColor || '#141422';
    document.getElementById('inputBoxColor').value = items.inputBoxColor || '#1e1e3f';
    document.getElementById('headerColor').value = items.headerColor || '#1a1a40';
    document.getElementById('windowTransparency').value = items.windowTransparency || 90;
    document.getElementById('urlInput').value = items.url || '';
    document.getElementById('autoUpdate').checked = items.autoUpdate || false;
    document.getElementById('autoSend').checked = items.autoSend !== false;
    loadUserColors(items.userColors || []);
    loadMutedUsers(items.mutedUsers || []);
    document.getElementById('destructableMessages').checked = items.destructableMessages || false;
    document.getElementById('destructKeyword').value = items.destructKeyword || '\\d ! d';
    document.getElementById('defaultDestructTime').value = items.defaultDestructTime || 5;
    document.getElementById('showDestructTimer').checked = items.showDestructTimer !== false;
    document.getElementById('messageSpacing').value = items.messageSpacing || 5;
    document.getElementById('crypticPhrase').value = items.crypticPhrase || '\\d ! d';
    document.getElementById('messageBubbleColor').value = items.messageBubbleColor || '#1e1e3f';
    document.getElementById('messageBubbleOpacity').value = items.messageBubbleOpacity || '70';
    document.getElementById('caseInsensitiveEncryption').checked = items.caseInsensitiveEncryption || false;
    document.getElementById('messageCheckInterval').value = items.messageCheckInterval || 5;
    document.getElementById('useCodebookEncryption').checked = items.useCodebookEncryption || false;
    document.getElementById('codebookPassword').value = items.codebookPassword || '';
    document.getElementById('codebookPassword').disabled = !items.useCodebookEncryption;
    updatePhraseCount();
  });

  chrome.storage.local.get('useCodebookEncryption', function(result) {
    const useCodebookEncryption = document.getElementById('useCodebookEncryption');
    if (useCodebookEncryption) {
      useCodebookEncryption.checked = result.useCodebookEncryption || false;
      document.getElementById('codebookPassword').disabled = !useCodebookEncryption.checked;
      document.getElementById('exportCodebookTxt').disabled = useCodebookEncryption.checked;
    }
  });
}

function formatCodebook(codebook) {
  return Object.entries(codebook).map(([key, value]) => `${key} : ${value}`).join('\n');
}

function getUserColors() {
  const userColorRows = document.querySelectorAll('.user-color-row');
  return Array.from(userColorRows).map(row => ({
    username: row.querySelector('.username').value,
    color: row.querySelector('.userColor').value
  })).filter(uc => uc.username);
}

function loadUserColors(userColors) {
  const container = document.getElementById('userColorContainer');
  container.innerHTML = '';
  userColors.forEach(uc => addUserColorRow(uc.username, uc.color));
}

function addUserColorRow(username = '', color = '#ffffff') {
  const container = document.getElementById('userColorContainer');
  const row = document.createElement('div');
  row.className = 'option-row user-color-row';
  row.innerHTML = `
    <input type="text" class="username" placeholder="Username" value="${username}">
    <input type="color" class="userColor" value="${color}">
    <button class="removeUserColor">Remove</button>
  `;
  container.appendChild(row);
  row.querySelector('.username').addEventListener('input', saveOptions);
  row.querySelector('.userColor').addEventListener('input', saveOptions);
  row.querySelector('.removeUserColor').addEventListener('click', () => {
    container.removeChild(row);
    saveOptions();
  });
}

function showStatus(message, isError = false) {
  const statusMsg = document.getElementById("statusMsg");
  statusMsg.textContent = message;
  statusMsg.className = isError ? "error" : "success";
  setTimeout(() => {
    statusMsg.textContent = "";
    statusMsg.className = "";
  }, 3000);
}

function updateFromUrl() {
  const urlInput = document.getElementById("urlInput");
  let url = urlInput.value.trim();

  if (!isValidUrl(url)) {
    showStatus("Please enter a valid GitHub URL ending with .txt or .json", true);
    return;
  }

  if (url.startsWith('https://github.com/') && url.includes('/blob/')) {
    url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(text => {
      if (url.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(text);
          if (jsonData.codebook) {
            document.getElementById("codebookText").value = formatCodebook(jsonData.codebook);
          } else {
            document.getElementById("codebookText").value = formatCodebook(jsonData);
          }
        } catch (error) {
          throw new Error("Invalid JSON format");
        }
      } else {
        document.getElementById("codebookText").value = text;
      }
      autoSaveCodebook();
      chrome.storage.local.set({ url: url });
      showStatus("Codebook updated successfully from URL!", false);
    })
    .catch(error => {
      showStatus("Error fetching codebook: " + error.message, true);
    });
}

function isValidUrl(url) {
  return (url.startsWith('https://raw.githubusercontent.com/') && (url.endsWith('.txt') || url.endsWith('.json'))) || 
         (url.startsWith('https://github.com/') && url.includes('/blob/') && (url.endsWith('.txt') || url.endsWith('.json')));
}

function getMutedUsers() {
  const mutedUserElements = document.querySelectorAll('.muted-user');
  return Array.from(mutedUserElements).map(el => el.dataset.username);
}

function loadMutedUsers(mutedUsers) {
  const container = document.getElementById('mutedUsersContainer');
  container.innerHTML = '';
  mutedUsers.forEach(username => addMutedUserElement(username));
}

function addMutedUserElement(username) {
  const container = document.getElementById('mutedUsersContainer');
  const element = document.createElement('div');
  element.className = 'muted-user option-row';
  element.dataset.username = username;

  const span = document.createElement('span');
  span.textContent = username;
  element.appendChild(span);

  const button = document.createElement('button');
  button.className = 'removeMutedUser';
  button.textContent = 'Remove';
  element.appendChild(button);

  container.appendChild(element);

  button.addEventListener('click', () => {
    container.removeChild(element);
    saveOptions();
  });
}

function resetTheme() {
  const defaultTheme = {
    backgroundColor: '#141422',
    inputBoxColor: '#1e1e3f',
    headerColor: '#1a1a40',
    userColors: [],
    windowTransparency: 90,
    messageSpacing: 5,
    messageBubbleColor: '#1e1e3f',
    messageBubbleOpacity: 70
  };

  Object.entries(defaultTheme).forEach(([key, value]) => {
    const element = document.getElementById(key);
    if (element) {
      if (element.type === 'color' || element.type === 'text' || element.type === 'number') {
        element.value = value;
      } else if (element.type === 'checkbox') {
        element.checked = value;
      }
    }
  });

  loadUserColors(defaultTheme.userColors);
  autoSave();
  showStatus('Theme reset to default!');
}

function autoSave() {
  saveOptions(false);
  document.getElementById('autoSaveStatus').textContent = 'Auto-saved';
  setTimeout(() => {
    document.getElementById('autoSaveStatus').textContent = '';
  }, 2000);

  // Send a message to the content script to update styles
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "updateStyles"});
  });
}

function clearAllData() {
  if (confirm("Are you sure you want to clear all data and reset all values? This action cannot be undone.")) {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        showStatus('Error clearing data: ' + chrome.runtime.lastError.message, true);
      } else {
        // Reset all input fields to their default values
        document.getElementById('codebookText').value = '';
        document.getElementById('messagesToLoad').value = '50';
        document.getElementById('autoScroll').checked = true;
        document.getElementById('backgroundColor').value = '#141422';
        document.getElementById('inputBoxColor').value = '#1e1e3f';
        document.getElementById('headerColor').value = '#1a1a40';
        document.getElementById('windowTransparency').value = '90';
        document.getElementById('urlInput').value = '';
        document.getElementById('autoUpdate').checked = false;
        document.getElementById('autoSend').checked = true;
        document.getElementById('destructableMessages').checked = false;
        document.getElementById('destructKeyword').value = '\\d ! d';
        document.getElementById('defaultDestructTime').value = '5';
        document.getElementById('showDestructTimer').checked = true;
        document.getElementById('messageSpacing').value = '5';
        document.getElementById('crypticPhrase').value = '\\d ! d';
        document.getElementById('messageBubbleColor').value = '#1e1e3f';
        document.getElementById('messageBubbleOpacity').value = '70';
        document.getElementById('caseInsensitiveEncryption').checked = false;
        document.getElementById('messageCheckInterval').value = '5';

        // Reset codebook encryption settings
        document.getElementById('useCodebookEncryption').checked = false;
        document.getElementById('codebookPassword').value = '';
        document.getElementById('codebookPassword').disabled = true;

        // Clear user colors and muted users
        document.getElementById('userColorContainer').innerHTML = '';
        document.getElementById('mutedUsersContainer').innerHTML = '';

        showStatus('All data cleared and values reset successfully');
        saveOptions();
      }
    });
  }
}