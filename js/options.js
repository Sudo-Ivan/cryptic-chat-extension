document.addEventListener('DOMContentLoaded', function() {
  const codebookTextArea = document.getElementById("codebookText");
  const uploadBtn = document.getElementById("uploadBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const updateFromUrlBtn = document.getElementById("updateFromUrlBtn");
  const autoUpdateCheckbox = document.getElementById("autoUpdate");
  const messagesToLoadInput = document.getElementById("messagesToLoad");
  const autoScrollCheckbox = document.getElementById("autoScroll");
  const backgroundColorInput = document.getElementById("backgroundColor");
  const addUserColorBtn = document.getElementById("addUserColor");
  const addMutedUserBtn = document.getElementById("addMutedUser");
  const newMutedUserInput = document.getElementById("newMutedUser");

  loadOptions();

  if (codebookTextArea) codebookTextArea.addEventListener("input", debounce(autoSaveCodebook, 500));
  if (uploadBtn) uploadBtn.addEventListener("click", () => fileInput.click());
  if (downloadBtn) downloadBtn.addEventListener("click", downloadCodebook);
  if (fileInput) fileInput.addEventListener("change", (event) => processFile(event.target.files[0]));
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

function saveOptions() {
  const options = {
    messagesToLoad: parseInt(document.getElementById('messagesToLoad').value),
    autoScroll: document.getElementById('autoScroll').checked,
    backgroundColor: document.getElementById('backgroundColor').value,
    inputBoxColor: document.getElementById('inputBoxColor').value,
    headerColor: document.getElementById('headerColor').value,
    windowTransparency: parseInt(document.getElementById('windowTransparency').value),
    userColors: getUserColors(),
    url: document.getElementById('urlInput').value,
    autoUpdate: document.getElementById('autoUpdate').checked,
    autoSend: document.getElementById('autoSend').checked,
    mutedUsers: getMutedUsers()
  };

  chrome.storage.local.set(options, () => {
    if (chrome.runtime.lastError) {
      showStatus('Error saving options: ' + chrome.runtime.lastError.message, true);
    } else {
      showStatus('Options saved successfully!');
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
    'mutedUsers'
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

function processFile(file) {
  if (!file) return;
  
  if (file.type !== "text/plain") {
    showStatus("Please upload a .txt file.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("codebookText").value = e.target.result;
    autoSaveCodebook();
  };
  reader.readAsText(file);
}

function downloadCodebook() {
  const codebookTextArea = document.getElementById("codebookText");
  const content = codebookTextArea.value;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'codebook.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = "copy";
  event.target.classList.add("dragover");
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  event.target.classList.remove("dragover");
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  event.target.classList.remove("dragover");

  const file = event.dataTransfer.files[0];
  processFile(file);
}

function updateFromUrl() {
  const urlInput = document.getElementById("urlInput");
  let url = urlInput.value.trim();

  if (!isValidUrl(url)) {
    showStatus("Please enter a valid HTTPS URL ending with .txt", true);
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
      document.getElementById("codebookText").value = text;
      autoSaveCodebook();
      chrome.storage.local.set({ url: url });
      showStatus("Codebook updated successfully from URL!", false);
    })
    .catch(error => {
      showStatus("Error fetching codebook: " + error.message, true);
    });
}

function isValidUrl(url) {
  return (url.startsWith('https://') && url.endsWith('.txt')) || 
         (url.startsWith('https://github.com/') && url.includes('/blob/') && url.endsWith('.txt'));
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
  element.innerHTML = `
    <span>${username}</span>
    <button class="removeMutedUser">Remove</button>
  `;
  container.appendChild(element);
  element.querySelector('.removeMutedUser').addEventListener('click', () => {
    container.removeChild(element);
    saveOptions();
  });
}