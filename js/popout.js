document.addEventListener('DOMContentLoaded', function() {
    loadCodebook();
    updatePhraseCount();

    document.getElementById('downloadBtn')?.addEventListener('click', exportCodebookOnly);
    document.getElementById('uploadBtn')?.addEventListener('click', () => document.getElementById('fileInput')?.click());
    document.getElementById('fileInput')?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    document.getElementById('codebookSearch')?.addEventListener('input', searchCodebook);
    document.getElementById('codebookText')?.addEventListener('input', () => {
        autoSaveCodebook();
        updatePhraseCount();
    });
});

function loadCodebook() {
    chrome.storage.local.get('codebook', function(result) {
        const codebook = result.codebook || {};
        const codebookText = document.getElementById('codebookText');
        if (codebookText) {
            codebookText.value = formatCodebook(codebook);
        }
    });
}

function formatCodebook(codebook) {
    return Object.entries(codebook).map(([key, value]) => `${key} : ${value}`).join('\n');
}

function updatePhraseCount() {
    const codebookText = document.getElementById("codebookText")?.value || '';
    const lines = codebookText.split('\n').filter(line => line.trim() !== '');
    const phraseCount = lines.length;
    const phraseCountElement = document.getElementById("codebookPhraseCount");
    if (phraseCountElement) {
        phraseCountElement.textContent = `Phrases: ${phraseCount}`;
    }
}

function autoSaveCodebook() {
    const codebookTextArea = document.getElementById("codebookText");
    if (!codebookTextArea) return;

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
            if (errorLines.length > 0) {
                showStatus('Codebook saved with errors. Please check lines: ' + errorLines.join(', '), true);
            } else {
                showStatus('Codebook saved successfully!');
            }
            chrome.runtime.sendMessage({ action: 'codebookUpdated' });
        }
    });

    updateErrorIndicator(errorLines);
}

function updateErrorIndicator(errorLines) {
    const errorIndicator = document.getElementById('errorIndicator') || createErrorIndicator();
    if (errorLines.length > 0) {
        errorIndicator.textContent = `Errors on lines: ${errorLines.join(', ')}`;
        errorIndicator.style.display = 'block';
    } else {
        errorIndicator.style.display = 'none';
    }
}

function createErrorIndicator() {
    const errorIndicator = document.createElement('div');
    errorIndicator.id = 'errorIndicator';
    errorIndicator.style.color = 'red';
    errorIndicator.style.marginTop = '10px';
    document.querySelector('.popout-container').appendChild(errorIndicator);
    return errorIndicator;
}

function searchCodebook() {
    const searchTerm = document.getElementById("codebookSearch")?.value.toLowerCase() || '';
    const codebookTextArea = document.getElementById("codebookText");
    if (!codebookTextArea) return;

    chrome.storage.local.get('codebook', function(result) {
        const codebook = result.codebook || {};
        const filteredCodebook = Object.fromEntries(
            Object.entries(codebook).filter(([key, value]) => 
                key.toLowerCase().includes(searchTerm) || value.toLowerCase().includes(searchTerm)
            )
        );
        codebookTextArea.value = formatCodebook(filteredCodebook);
    });
}

function exportCodebookOnly() {
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
}

function handleFileUpload(file) {
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

function handleImportedData(importedData) {
    try {
        if (importedData.codebook) {
            document.getElementById('codebookText').value = formatCodebook(importedData.codebook);
            chrome.storage.local.set({ codebook: importedData.codebook });
        }
        showStatus('Codebook imported successfully!');
        autoSaveCodebook();
    } catch (error) {
        showStatus('Error processing imported data: ' + error.message, true);
    }
}

function showStatus(message, isError = false) {
    const statusMsg = document.getElementById("statusMsg") || createStatusElement();
    statusMsg.textContent = message;
    statusMsg.className = isError ? "error" : "success";
    setTimeout(() => {
        statusMsg.textContent = "";
        statusMsg.className = "";
    }, 3000);
}

function createStatusElement() {
    const statusMsg = document.createElement('div');
    statusMsg.id = 'statusMsg';
    document.querySelector('.popout-container').appendChild(statusMsg);
    return statusMsg;
}

// Placeholder functions for encryption and decryption
// You should implement these properly in your actual code
async function encryptCodebook(data, password) {
    // Implement encryption logic here
    return data;
}

async function decryptCodebook(encryptedData, password) {
    // Implement decryption logic here
    return encryptedData;
}