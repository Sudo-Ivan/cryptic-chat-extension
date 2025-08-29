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
    chrome.storage.local.get(['codebook', 'useCodebookEncryption', 'codebookPassword', 'imageBindings'], async (items) => {
      const exportData = {
        codebook: items.codebook,
        imageBindings: items.imageBindings || {},
        useCodebookEncryption: items.useCodebookEncryption,
        codebookPassword: items.codebookPassword
      };

      let dataToExport;

      if (items.useCodebookEncryption) {
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
        showDestructTimer: items.showDestructTimer,
        discordSelectors: items.discordSelectors
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

            if (file.name.endsWith('.json')) {
                const jsonData = JSON.parse(content);
                
                if (jsonData.encrypted) {
                    const password = prompt("Please enter the password to decrypt the codebook:");
                    if (!password) {
                        showStatus('Decryption cancelled', true);
                        return;
                    }
                    
                    try {
                        importedData = await decryptCodebook(jsonData, password);
                    } catch (decryptError) {
                        showStatus('Error decrypting codebook: ' + decryptError.message, true);
                        return;
                    }
                } else {
                    importedData = jsonData;
                }

                if (importedData.codebook) {
                    document.getElementById("codebookText").value = formatCodebook(importedData.codebook);
                    chrome.storage.local.set({ codebook: importedData.codebook });
                }

                if (importedData.imageBindings) {
                    chrome.storage.local.set({ imageBindings: importedData.imageBindings });
                    updateImageBindingsDisplay();
                }

                if (importedData.settings) {
                    updateSettingsFromImport(importedData.settings);
                }
            } else if (file.name.endsWith('.txt')) {
                importedData = { codebook: parseCodebookText(content) };
                document.getElementById("codebookText").value = content;
            } else {
                throw new Error('Unsupported file type');
            }

            autoSaveCodebook();
            showStatus('Codebook imported successfully!');
            chrome.runtime.sendMessage({ action: 'codebookUpdated' });
        } catch (error) {
            showStatus('Error importing codebook: ' + error.message, true);
        }
    };
    reader.readAsText(file);
}

function updateSettingsFromImport(settings) {
    // Update various settings based on the imported data
    for (const [key, value] of Object.entries(settings)) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    }
    // Save the updated settings
    saveOptions(false);
}

function parseCodebookText(text) {
  const lines = text.split('\n');
  const codebook = {};
  for (let line of lines) {
    const [key, value] = line.split(':').map(item => item.trim());
    if (key && value) {
      codebook[key] = value;
    }
  }
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

function saveDiscordSelectors() {
  const selectors = {
    chatArea: document.getElementById('chatAreaSelector').value,
    messageElements: document.getElementById('messageElementsSelector').value,
    contentElement: document.getElementById('contentElementSelector').value,
    repliedTextPreview: document.getElementById('repliedTextPreviewSelector').value,
    usernameElement: document.getElementById('usernameElementSelector').value,
    timestampElement: document.getElementById('timestampElementSelector').value,
    messageInput: document.getElementById('messageInputSelector').value
  };

  chrome.storage.local.set({ discordSelectors: selectors }, function() {
    showStatus('Discord selectors saved');
  });
}

function loadDiscordSelectors() {
  chrome.storage.local.get('discordSelectors', function(result) {
    const selectors = result.discordSelectors || {
      chatArea: '[class^="chatContent_"]',
      messageElements: '[id^="chat-messages-"]',
      contentElement: '[id^="message-content-"]',
      repliedTextPreview: '[class*="repliedTextPreview_"]',
      usernameElement: '[class*="username_"]',
      timestampElement: 'time',
      messageInput: 'div[role="textbox"][data-slate-editor="true"]'
    };

    document.getElementById('chatAreaSelector').value = selectors.chatArea;
    document.getElementById('messageElementsSelector').value = selectors.messageElements;
    document.getElementById('contentElementSelector').value = selectors.contentElement;
    document.getElementById('repliedTextPreviewSelector').value = selectors.repliedTextPreview;
    document.getElementById('usernameElementSelector').value = selectors.usernameElement;
    document.getElementById('timestampElementSelector').value = selectors.timestampElement;
    document.getElementById('messageInputSelector').value = selectors.messageInput;
  });
}

function resetDiscordSelectors() {
  const defaultSelectors = {
    chatArea: '[class^="chatContent_"]',
    messageElements: '[id^="chat-messages-"]',
    contentElement: '[id^="message-content-"]',
    repliedTextPreview: '[class*="repliedTextPreview_"]',
    usernameElement: '[class*="username_"]',
    timestampElement: 'time',
    messageInput: 'div[role="textbox"][data-slate-editor="true"]'
  };

  Object.keys(defaultSelectors).forEach(key => {
    document.getElementById(`${key}Selector`).value = defaultSelectors[key];
  });

  saveDiscordSelectors();
}

// Modify the existing loadOptions function
function loadOptions() {
  chrome.storage.local.get(null, function(items) {
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
    
    if (items.codebook) {
      document.getElementById("codebookText").value = formatCodebook(items.codebook);
      updatePhraseCount();
    }

    // Load Element selectors
    document.getElementById('elementChatAreaSelector').value = items.elementSelectors?.chatArea || '.mx_RoomView_messagePanel';
    document.getElementById('elementMessageElementsSelector').value = items.elementSelectors?.messageElements || '.mx_EventTile';
    document.getElementById('elementContentElementSelector').value = items.elementSelectors?.contentElement || '.mx_EventTile_body';
    document.getElementById('elementUsernameElementSelector').value = items.elementSelectors?.usernameElement || '.mx_Username_color1.mx_DisambiguatedProfile_displayName';
    document.getElementById('elementTimestampElementSelector').value = items.elementSelectors?.timestampElement || '.mx_MessageTimestamp';
    document.getElementById('elementMessageInputSelector').value = items.elementSelectors?.messageInput || '.mx_BasicMessageComposer_input';
  });

  loadDiscordSelectors();
}

// Modify the existing saveOptions function
function saveOptions(showStatus = true) {
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
        url: document.getElementById('urlInput').value,
        autoUpdate: document.getElementById('autoUpdate').checked
    };

    const elementSelectors = {
        chatArea: document.getElementById('elementChatAreaSelector').value,
        messageElements: document.getElementById('elementMessageElementsSelector').value,
        contentElement: document.getElementById('elementContentElementSelector').value,
        usernameElement: document.getElementById('elementUsernameElementSelector').value,
        timestampElement: document.getElementById('elementTimestampElementSelector').value,
        messageInput: document.getElementById('elementMessageInputSelector').value
    };

    const discordSelectors = {
        chatArea: document.getElementById('chatAreaSelector').value,
        messageElements: document.getElementById('messageElementsSelector').value,
        contentElement: document.getElementById('contentElementSelector').value,
        repliedTextPreview: document.getElementById('repliedTextPreviewSelector').value,
        usernameElement: document.getElementById('usernameElementSelector').value,
        timestampElement: document.getElementById('timestampElementSelector').value,
        messageInput: document.getElementById('messageInputSelector').value
    };

    chrome.storage.local.set({
        ...options,
        elementSelectors: elementSelectors,
        discordSelectors: discordSelectors
    }, function() {
        if (showStatus) {
            showStatus('Options saved successfully!');
        }
        chrome.runtime.sendMessage({ action: 'optionsUpdated' });
    });
}

// Modify the existing clearAllData function
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

        // Reset Discord selectors
        resetDiscordSelectors();

        showStatus('All data cleared and values reset successfully');
        saveOptions();
      }
    });
  }
}

// Add this function to handle color input changes
function handleColorChange(event) {
  const colorInput = event.target;
  const colorValue = colorInput.value;
  console.log(`Color changed: ${colorInput.id} = ${colorValue}`);
  autoSave();
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
  const codebookPassword = document.getElementById('codebookPassword');

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

  // Add event listeners for color inputs
  ['backgroundColor', 'inputBoxColor', 'headerColor', 'messageBubbleColor'].forEach(id => {
    const colorInput = document.getElementById(id);
    if (colorInput) {
      colorInput.addEventListener('input', handleColorChange);
      colorInput.addEventListener('change', handleColorChange);
    }
  });

  // Update existing listeners
  ['messageBubbleOpacity', 'destructableMessages', 'destructKeyword', 'crypticPhrase', 'defaultDestructTime', 'showDestructTimer', 'messagesToLoad', 'autoScroll', 'windowTransparency', 'autoSend', 'messageSpacing', 'messageCheckInterval'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', debounce(autoSave, 500));
      element.addEventListener('input', debounce(autoSave, 500));
    }
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

  ['chatAreaSelector', 'messageElementsSelector', 'contentElementSelector', 'repliedTextPreviewSelector', 'usernameElementSelector', 'timestampElementSelector', 'messageInputSelector'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveDiscordSelectors);
  });

  document.getElementById('resetDiscordSelectors').addEventListener('click', resetDiscordSelectors);

  // Add shuffle codebook button handler
  const shuffleCodebookBtn = document.getElementById('shuffleCodebookBtn');
  if (shuffleCodebookBtn) {
    shuffleCodebookBtn.addEventListener('click', shuffleCodebook);
  }

  // Add these new functions for image handling
  const addImageBindingBtn = document.getElementById('addImageBinding');
  if (addImageBindingBtn) {
    addImageBindingBtn.addEventListener('click', addImageBinding);
  }
  
  // Initial display of image bindings
  updateImageBindingsDisplay();
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
  const updatedCodebook = parseCodebookText(codebookTextArea.value);

  chrome.storage.local.set({ codebook: updatedCodebook }, function() {
    if (chrome.runtime.lastError) {
      showStatus('Error saving codebook: ' + chrome.runtime.lastError.message, true);
    } else {
      showStatus('Codebook saved successfully!');
      chrome.runtime.sendMessage({ action: 'codebookUpdated' });
      updatePhraseCount();
    }
  });
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
  const autoSaveStatus = document.getElementById('autoSaveStatus');
  autoSaveStatus.textContent = 'Auto-saving...';
  autoSaveStatus.style.color = 'orange';
  
  setTimeout(() => {
    autoSaveStatus.textContent = 'Auto-saved';
    autoSaveStatus.style.color = 'green';
    setTimeout(() => {
      autoSaveStatus.textContent = '';
    }, 2000);
  }, 500);

  chrome.runtime.sendMessage({action: "updateStyles"});
}

function formatCodebook(codebook) {
  return Object.entries(codebook).map(([key, value]) => `${key} : ${value}`).join('\n');
}

// Add shuffle codebook function
function shuffleCodebook() {
    const secretCode = document.getElementById('shuffleSecretCode').value.trim();
    if (!secretCode) {
        showStatus('Please enter a secret code for shuffling', true);
        return;
    }

    chrome.runtime.sendMessage({ 
        action: 'shuffleCodebook',
        secretCode: secretCode
    }, response => {
        if (response.error) {
            showStatus('Error shuffling codebook: ' + response.error, true);
        } else {
            showStatus('Codebook shuffled successfully!');
            loadOptions(); // Reload to show new shuffled codebook
        }
    });
}

// Add these new functions for image handling
async function addImageBinding() {
    const phrase = document.getElementById('imagePhrase').value.trim();
    const imageInput = document.getElementById('imageInput');
    
    if (!phrase || !imageInput.files[0]) {
        showStatus('Please enter a phrase and select an image', true);
        return;
    }

    const file = imageInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        chrome.storage.local.get(['imageBindings'], function(result) {
            const imageBindings = result.imageBindings || {};
            imageBindings[phrase] = base64Image;
            
            chrome.storage.local.set({ imageBindings }, function() {
                showStatus('Image binding added successfully!');
                updateImageBindingsDisplay();
                document.getElementById('imagePhrase').value = '';
                document.getElementById('imageInput').value = '';
            });
        });
    };
    
    reader.readAsDataURL(file);
}

function updateImageBindingsDisplay() {
    const container = document.getElementById('imageBindingsContainer');
    chrome.storage.local.get(['imageBindings'], function(result) {
        const imageBindings = result.imageBindings || {};
        container.innerHTML = '';
        
        Object.entries(imageBindings).forEach(([phrase, base64Image]) => {
            const bindingElement = document.createElement('div');
            bindingElement.className = 'image-binding-item';
            bindingElement.innerHTML = `
                <div class="image-preview">
                    <img src="${base64Image}" alt="${phrase}">
                </div>
                <div class="binding-info">
                    <span class="phrase">${phrase}</span>
                    <button class="remove-binding" data-phrase="${phrase}">Remove</button>
                </div>
            `;
            container.appendChild(bindingElement);
        });
        
        // Add event listeners for remove buttons
        container.querySelectorAll('.remove-binding').forEach(button => {
            button.addEventListener('click', function() {
                const phrase = this.dataset.phrase;
                removeImageBinding(phrase);
            });
        });
    });
}

function removeImageBinding(phrase) {
    chrome.storage.local.get(['imageBindings'], function(result) {
        const imageBindings = result.imageBindings || {};
        delete imageBindings[phrase];
        
        chrome.storage.local.set({ imageBindings }, function() {
            showStatus('Image binding removed successfully!');
            updateImageBindingsDisplay();
        });
    });
}