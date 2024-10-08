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

  loadOptions();

  if (codebookTextArea) codebookTextArea.addEventListener("input", debounce(autoSaveCodebook, 500));
  if (uploadBtn) uploadBtn.addEventListener("click", () => fileInput.click());
  if (downloadBtn) downloadBtn.addEventListener("click", downloadCodebook);
  if (fileInput) fileInput.addEventListener("change", (event) => handleFileUpload(event.target.files[0]));
  if (updateFromUrlBtn) updateFromUrlBtn.addEventListener("click", updateFromUrl);
  if (autoUpdateCheckbox) autoUpdateCheckbox.addEventListener("change", saveOptions);
  if (messagesToLoadInput) messagesToLoadInput.addEventListener("input", saveOptions);
  if (autoScrollCheckbox) autoScrollCheckbox.addEventListener("change", saveOptions);
  if (backgroundColorInput) backgroundColorInput.addEventListener("input", saveOptions);
  if (addUserColorBtn) addUserColorBtn.addEventListener("click", () => addUserColorRow());

  if (dropZone) {
    dropZone.addEventListener("dragover", handleDragOver);
    dropZone.addEventListener("dragleave", handleDragLeave);
    dropZone.addEventListener("drop", handleDrop);
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

  document.getElementById('exportCodebook').addEventListener('click', exportCodebook);
  document.getElementById('saveBtn').addEventListener('click', () => saveOptions(true));

  // Add event listeners for auto-save
  ['messageBubbleColor', 'messageBubbleOpacity', 'destructableMessages', 'destructKeyword', 'crypticPhrase', 'defaultDestructTime', 'showDestructTimer'].forEach(id => {
    document.getElementById(id).addEventListener('change', debounce(autoSave, 500));
  });

  // Add event listeners for auto-save
  ['messagesToLoad', 'autoScroll', 'backgroundColor', 'inputBoxColor', 'headerColor', 'windowTransparency', 'autoSend', 'messageSpacing', 'messageBubbleColor', 'messageBubbleOpacity'].forEach(id => {
    document.getElementById(id).addEventListener('change', debounce(autoSave, 500));
    document.getElementById(id).addEventListener('input', debounce(autoSave, 500));
  });
});

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

  if (errorLines.length > 0) {
    showStatus(`Error on line(s): ${errorLines.join(', ')}. Format should be "key : value"`, true);
  } else {
    chrome.storage.local.set({ codebook: updatedCodebook }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving codebook: ' + chrome.runtime.lastError.message, true);
      } else {
        showStatus('Codebook saved successfully!');
        chrome.runtime.sendMessage({ action: 'codebookUpdated' });
      }
    });
  }
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
        autoSend: document.getElementById('autoSend').checked
    };

    chrome.storage.local.set(options, function() {
        if (showMessage) {
            showStatus('Options saved');
        }
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
    'messageBubbleOpacity'
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

function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        if (file.name.endsWith('.json')) {
            handleJsonUpload(content);
        } else if (file.name.endsWith('.txt')) {
            handleTxtUpload(content);
        } else {
            showStatus('Unsupported file format. Please use .json or .txt files.', true);
        }
    };
    reader.readAsText(file);
}

function handleJsonUpload(content) {
    try {
        const importedData = JSON.parse(content);
        if (importedData.codebook) {
            document.getElementById('codebookText').value = formatCodebook(importedData.codebook);
            
            // Update other settings if they exist in the imported data
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
        } else {
            showStatus('Invalid JSON format: missing codebook', true);
        }
    } catch (error) {
        showStatus('Error parsing JSON file: ' + error.message, true);
    }
}

function handleTxtUpload(content) {
    document.getElementById('codebookText').value = content;
    autoSaveCodebook();
    showStatus('Codebook imported successfully!');
}

function formatCodebook(codebook) {
    return Object.entries(codebook).map(([key, value]) => `${key} : ${value}`).join('\n');
}

function processFile(file) {
    if (file) {
        handleFileUpload(file);
    }
}

function downloadCodebook() {
    chrome.storage.local.get(null, (items) => {
        const codebookText = document.getElementById("codebookText").value;
        const codebook = parseCodebook(codebookText);
        
        const exportData = {
            codebook: codebook,
            destructableMessages: items.destructableMessages,
            destructKeyword: items.destructKeyword,
            crypticPhrase: items.crypticPhrase,
            defaultDestructTime: items.defaultDestructTime,
            showDestructTimer: items.showDestructTimer
        };

        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const txtBlob = new Blob([codebookText], {type: 'text/plain'});
        
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const txtUrl = URL.createObjectURL(txtBlob);
        
        const jsonLink = createDownloadLink(jsonUrl, 'cryptic_chat_codebook_and_settings.json');
        const txtLink = createDownloadLink(txtUrl, 'codebook.txt');
        
        document.body.appendChild(jsonLink);
        document.body.appendChild(txtLink);
        
        jsonLink.click();
        txtLink.click();
        
        document.body.removeChild(jsonLink);
        document.body.removeChild(txtLink);
        
        URL.revokeObjectURL(jsonUrl);
        URL.revokeObjectURL(txtUrl);
    });
}

function createDownloadLink(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    return link;
}

function parseCodebook(codebookText) {
    const lines = codebookText.split('\n');
    const codebook = {};
    for (const line of lines) {
        const [key, value] = line.split(':').map(item => item.trim());
        if (key && value) {
            codebook[key] = value;
        }
    }
    return codebook;
}

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

function exportCodebook() {
  chrome.storage.local.get(null, (items) => {
    const exportData = {
      codebook: items.codebook,
      destructableMessages: items.destructableMessages,
      destructKeyword: items.destructKeyword,
      crypticPhrase: items.crypticPhrase,
      defaultDestructTime: items.defaultDestructTime,
      showDestructTimer: items.showDestructTimer
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cryptic_chat_codebook_and_settings.json';
    a.click();
    URL.revokeObjectURL(url);
  });
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

        // Clear user colors and muted users
        document.getElementById('userColorContainer').innerHTML = '';
        document.getElementById('mutedUsersContainer').innerHTML = '';

        showStatus('All data cleared and values reset successfully');
        saveOptions();
      }
    });
  }
}