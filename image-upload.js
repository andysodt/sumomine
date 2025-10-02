// API calls
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Global state
let selectedFiles = [];
let rikishiList = [];
let fileToRikishiMap = new Map();

// Load rikishi list
async function loadRikishiList() {
    try {
        rikishiList = await apiCall('/api/rikishis');
        rikishiList.sort((a, b) => a.shikona_en.localeCompare(b.shikona_en));
    } catch (error) {
        console.error('Failed to load rikishi list:', error);
        showStatus('Failed to load rikishi list', 'error');
    }
}

// Handle file selection
function handleFiles(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (selectedFiles.find(f => f.name === file.name)) continue;

        selectedFiles.push(file);
    }

    renderPreviews();
}

// Render image previews
function renderPreviews() {
    const container = document.getElementById('previewContainer');
    const uploadBtn = document.getElementById('uploadBtn');

    if (selectedFiles.length === 0) {
        container.innerHTML = '';
        uploadBtn.style.display = 'none';
        return;
    }

    uploadBtn.style.display = 'block';

    container.innerHTML = selectedFiles.map((file, index) => {
        const objectUrl = URL.createObjectURL(file);
        const currentRikishiId = fileToRikishiMap.get(file.name);

        return `
            <div class="preview-item">
                <button class="remove-btn" onclick="removeFile(${index})">&times;</button>
                <img src="${objectUrl}" alt="${file.name}" class="preview-image">
                <div class="preview-name" title="${file.name}">${file.name}</div>
                <div class="rikishi-selector">
                    <select onchange="assignRikishi('${file.name}', this.value)">
                        <option value="">Auto-match</option>
                        ${rikishiList.map(r => `
                            <option value="${r.id}" ${currentRikishiId == r.id ? 'selected' : ''}>
                                ${r.shikona_en}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    }).join('');
}

// Remove file from selection
function removeFile(index) {
    const file = selectedFiles[index];
    fileToRikishiMap.delete(file.name);
    selectedFiles.splice(index, 1);
    renderPreviews();
}

// Assign rikishi to file
function assignRikishi(filename, rikishiId) {
    if (rikishiId) {
        fileToRikishiMap.set(filename, parseInt(rikishiId));
    } else {
        fileToRikishiMap.delete(filename);
    }
}

// Auto-match filename to rikishi
function autoMatchRikishi(filename) {
    const normalized = filename
        .toLowerCase()
        .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
        .replace(/[^a-z0-9]/g, '');

    let bestMatch = null;
    let bestScore = 0;

    for (const rikishi of rikishiList) {
        const rikishiName = rikishi.shikona_en
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        if (normalized.includes(rikishiName) || rikishiName.includes(normalized)) {
            const score = Math.max(normalized.length, rikishiName.length) > 0
                ? Math.min(normalized.length, rikishiName.length) / Math.max(normalized.length, rikishiName.length)
                : 0;

            if (score > bestScore && score > 0.5) {
                bestScore = score;
                bestMatch = rikishi;
            }
        }
    }

    return bestMatch;
}

// Upload images
async function uploadImages() {
    if (selectedFiles.length === 0) {
        showStatus('No files selected', 'error');
        return;
    }

    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const uploadBtn = document.getElementById('uploadBtn');

    uploadBtn.disabled = true;
    progressBar.style.display = 'block';

    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        try {
            // Auto-match if not manually assigned
            let rikishiId = fileToRikishiMap.get(file.name);
            if (!rikishiId) {
                const match = autoMatchRikishi(file.name);
                if (match) {
                    rikishiId = match.id;
                }
            }

            // Upload file
            const formData = new FormData();
            formData.append('image', file);
            if (rikishiId) {
                formData.append('rikishiId', rikishiId);
            }

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            uploaded++;
        } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            errors++;
        }

        // Update progress
        const progress = ((i + 1) / selectedFiles.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressFill.textContent = `${Math.round(progress)}%`;
    }

    uploadBtn.disabled = false;

    if (errors === 0) {
        showStatus(`Successfully uploaded ${uploaded} images`, 'success');
        selectedFiles = [];
        fileToRikishiMap.clear();
        renderPreviews();
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
        }, 2000);
    } else {
        showStatus(`Uploaded ${uploaded} images, ${errors} failed`, 'error');
    }
}

// Show status message
function showStatus(message, type) {
    const statusMsg = document.getElementById('statusMessage');
    statusMsg.textContent = message;
    statusMsg.className = `status-message ${type}`;
    statusMsg.style.display = 'block';

    setTimeout(() => {
        statusMsg.style.display = 'none';
    }, 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadRikishiList();

    const uploadZone = document.getElementById('uploadZone');
    const imageInput = document.getElementById('imageInput');
    const uploadBtn = document.getElementById('uploadBtn');

    // Click to select
    uploadZone.addEventListener('click', () => imageInput.click());

    // File input change
    imageInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Upload button
    uploadBtn.addEventListener('click', uploadImages);
});
