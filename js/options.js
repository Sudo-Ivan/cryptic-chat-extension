document.addEventListener("DOMContentLoaded", () => {
  const codebookTextArea = document.getElementById("codebook");
  const uploadBtn = document.getElementById("uploadBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const updateFromUrlBtn = document.getElementById("updateFromUrlBtn");
  const autoUpdateCheckbox = document.getElementById("autoUpdate");
  const errorMsg = document.createElement("p");
  errorMsg.id = "errorMsg";
  errorMsg.style.color = "red";
  errorMsg.style.fontSize = "12px";
  document.querySelector(".options-container").appendChild(errorMsg);

  chrome.storage.local.get(["codebook", "codebookUrl", "autoUpdate"], (data) => {
    displayCodebook(data.codebook || {});
    document.getElementById("urlInput").value = data.codebookUrl || "";
    autoUpdateCheckbox.checked = data.autoUpdate || false;
  });

  codebookTextArea.addEventListener("input", debounce(autoSaveCodebook, 500));
  uploadBtn.addEventListener("click", () => fileInput.click());
  downloadBtn.addEventListener("click", downloadCodebook);
  fileInput.addEventListener("change", (event) => processFile(event.target.files[0]));
  updateFromUrlBtn.addEventListener("click", updateFromUrl);
  autoUpdateCheckbox.addEventListener("change", () => {
    chrome.storage.local.set({ autoUpdate: autoUpdateCheckbox.checked });
  });

  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);
});

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function displayCodebook(codebook) {
  const codebookTextArea = document.getElementById("codebook");
  let formattedCodebook = "";
  for (const [key, value] of Object.entries(codebook)) {
    formattedCodebook += `${key} : ${value}\n`;
  }
  codebookTextArea.value = formattedCodebook.trim();
}

function autoSaveCodebook() {
  const codebookTextArea = document.getElementById("codebook");
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
    showError(`Invalid format on line(s): ${errorLines.join(", ")}`);
    return;
  }

  chrome.storage.local.set({ codebook: updatedCodebook }, () => {
    if (chrome.runtime.lastError) {
      showError("Error updating codebook: " + chrome.runtime.lastError.message);
    } else {
      showError("Codebook updated successfully!", false);
    }
  });
}

function processFile(file) {
  if (!file) return;
  
  if (file.type !== "text/plain") {
    showError("Please upload a .txt file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("codebook").value = e.target.result;
    autoSaveCodebook();
  };
  reader.readAsText(file);
}

function downloadCodebook() {
  const codebookTextArea = document.getElementById("codebook");
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

function showError(message, isError = true) {
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = message;
  errorMsg.style.color = isError ? "red" : "green";
  setTimeout(() => {
    errorMsg.textContent = "";
  }, 5000);
}

function updateFromUrl() {
  const urlInput = document.getElementById("urlInput");
  let url = urlInput.value.trim();

  if (!isValidUrl(url)) {
    showError("Please enter a valid HTTPS URL ending with .txt");
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
      document.getElementById("codebook").value = text;
      autoSaveCodebook();
      chrome.storage.local.set({ codebookUrl: url });
      showError("Codebook updated successfully from URL!", false);
    })
    .catch(error => {
      showError("Error fetching codebook: " + error.message);
    });
}

function isValidUrl(url) {
  return (url.startsWith('https://') && url.endsWith('.txt')) || 
         (url.startsWith('https://github.com/') && url.includes('/blob/') && url.endsWith('.txt'));
}