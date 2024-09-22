document.addEventListener("DOMContentLoaded", () => {
  const wordlistTextArea = document.getElementById("wordlist");
  const saveBtn = document.getElementById("saveBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const errorMsg = document.createElement("p");
  errorMsg.id = "errorMsg";
  errorMsg.style.color = "red";
  errorMsg.style.fontSize = "12px";
  document.querySelector(".options-container").appendChild(errorMsg);

  chrome.storage.local.get("wordlist", (data) => {
      displayWordlist(data.wordlist || {});
  });

  saveBtn.addEventListener("click", saveWordlist);
  uploadBtn.addEventListener("click", () => fileInput.click());
  downloadBtn.addEventListener("click", downloadWordlist);
  fileInput.addEventListener("change", (event) => processFile(event.target.files[0]));

  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);
});

function displayWordlist(wordlist) {
  const wordlistTextArea = document.getElementById("wordlist");
  let formattedWordlist = "";
  for (const [key, value] of Object.entries(wordlist)) {
      formattedWordlist += `${key} : ${value}\n`;
  }
  wordlistTextArea.value = formattedWordlist.trim();
}

function saveWordlist() {
  const wordlistTextArea = document.getElementById("wordlist");
  const lines = wordlistTextArea.value.split('\n');
  const updatedWordlist = {};
  let errorLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line) {
      const [key, value] = line.split(':').map(item => item.trim());
      if (key && value) {
        updatedWordlist[key] = value;
      } else {
        errorLines.push(i + 1);
      }
    }
  }

  if (errorLines.length > 0) {
    showError(`Invalid format on line(s): ${errorLines.join(", ")}`);
    return;
  }

  chrome.storage.local.set({ wordlist: updatedWordlist }, () => {
    if (chrome.runtime.lastError) {
      showError("Error updating wordlist: " + chrome.runtime.lastError.message);
    } else {
      showError("Wordlist updated successfully!", false);
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
    document.getElementById("wordlist").value = e.target.result;
    saveWordlist();
  };
  reader.readAsText(file);
}

function downloadWordlist() {
  const wordlistTextArea = document.getElementById("wordlist");
  const content = wordlistTextArea.value;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wordlist.txt';
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
  const url = urlInput.value.trim();

  if (!isValidUrl(url)) {
    showError("Please enter a valid HTTPS URL ending with .txt");
    return;
  }

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(text => {
      document.getElementById("wordlist").value = text;
      saveWordlist();
      showError("Wordlist updated successfully from URL!", false);
    })
    .catch(error => {
      showError("Error fetching wordlist: " + error.message);
    });
}

function isValidUrl(url) {
  return url.startsWith('https://') && url.endsWith('.txt');
}