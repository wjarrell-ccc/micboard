'use strict';

const MAX_FILE_SIZE_MB = 10;
const CONVERT_TYPES = ['.heic', '.heif', '.webp', '.png', '.bmp', '.tiff', '.tif', '.jpeg'];
const PASS_TYPES = ['.jpg', '.mp4'];
const ALL_TYPES = [...CONVERT_TYPES, ...PASS_TYPES];

let viewMode = 'thumbs';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

function getExt(filename) {
  return filename.toLowerCase().slice(filename.lastIndexOf('.'));
}

function renderThumbs(files) {
  let html = '<div class="row">';
  files.forEach(f => {
    const isImage = f.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const preview = isImage
      ? `<img src="bg/${encodeURIComponent(f.name)}" style="width:100%;height:200px;object-fit:cover;object-position:top center;border-radius:4px 4px 0 0;" />`
      : `<div style="width:100%;height:200px;background:#333;border-radius:4px 4px 0 0;display:flex;align-items:center;justify-content:center;font-size:2em;">🎬</div>`;
    html += `
      <div class="col-6 col-md-3 mb-3">
        <div class="card bg-dark border-secondary">
          ${preview}
          <div class="card-body p-2">
            <p class="card-text text-white small mb-1" style="word-break:break-all;">${f.name}</p>
            <p class="card-text text-muted mb-2" style="font-size:0.75em;">${formatSize(f.size)} &bull; ${formatDate(f.modified)}</p>
            <div id="rename-area-${CSS.escape(f.name)}"></div>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <button class="btn btn-sm btn-secondary" onclick="showRename('${f.name}')">Rename</button>
              <a href="api/backgrounds/download/${encodeURIComponent(f.name)}" class="btn btn-sm btn-secondary" target="_blank">Download</a>
              <button class="btn btn-sm btn-danger" onclick="deleteFile('${f.name}')">Delete</button>
            </div>
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  return html;
}

function renderList(files) {
  let html = '<table class="table table-dark table-sm">';
  html += '<thead><tr><th></th><th>Filename</th><th>Size</th><th>Modified</th><th></th></tr></thead><tbody>';
  files.forEach(f => {
    const isImageL = f.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const thumbL = isImageL
      ? `<img src="bg/${encodeURIComponent(f.name)}" style="height:40px;width:30px;object-fit:cover;object-position:top;border-radius:2px;" />`
      : `<span style="font-size:1.2em;">🎬</span>`;
    html += `<tr>
      <td class="align-middle" style="width:40px;">${thumbL}</td>
      <td class="text-white align-middle">${f.name}</td>
      <td class="text-muted align-middle">${formatSize(f.size)}</td>
      <td class="text-muted align-middle">${formatDate(f.modified)}</td>
      <td>
        <div id="rename-area-${CSS.escape(f.name)}" class="mb-1"></div>
        <button class="btn btn-sm btn-secondary me-1" onclick="showRename('${f.name}')">Rename</button>
        <a href="api/backgrounds/download/${encodeURIComponent(f.name)}" class="btn btn-sm btn-secondary me-1" target="_blank">Download</a>
        <button class="btn btn-sm btn-danger" onclick="deleteFile('${f.name}')">Delete</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
}

export function loadFiles() {
  fetch('api/backgrounds')
    .then(r => r.json())
    .then(data => {
      const dirEl = document.getElementById('bg-directory');
      if (dirEl) dirEl.textContent = data.directory;
      const container = document.getElementById('bg-file-list');
      if (!container) return;
      if (data.files.length === 0) {
        container.innerHTML = '<p class="text-muted">No background images found.</p>';
        return;
      }
      container.innerHTML = viewMode === 'thumbs' ? renderThumbs(data.files) : renderList(data.files);
    })
    .catch(err => console.error('Error loading backgrounds:', err));
}

window.deleteFile = function(filename) {
  if (!confirm(`Delete ${filename}?`)) return;
  fetch('api/backgrounds/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) loadFiles();
      else alert('Delete failed: ' + data.error);
    });
};

window.showRename = function(filename) {
  const area = document.getElementById('rename-area-' + CSS.escape(filename));
  if (!area) return;
  const ext = getExt(filename);
  const base = filename.slice(0, filename.lastIndexOf('.'));
  area.innerHTML = `
    <div class="input-group input-group-sm mb-1">
      <input type="text" class="form-control" id="rename-input-${CSS.escape(filename)}" value="${base}" placeholder="new name">
      <button class="btn btn-primary" onclick="submitRename('${filename}')">Save</button>
      <button class="btn btn-secondary" onclick="cancelRename('${filename}')">Cancel</button>
    </div>
    <small class="text-muted">Will save as: <span id="rename-preview-${CSS.escape(filename)}">${base}${ext}</span></small>`;
  const input = document.getElementById('rename-input-' + CSS.escape(filename));
  input.addEventListener('input', () => {
    const preview = document.getElementById('rename-preview-' + CSS.escape(filename));
    if (preview) preview.textContent = input.value.toLowerCase() + ext;
  });
  input.focus();
  input.select();
};

window.cancelRename = function(filename) {
  const area = document.getElementById('rename-area-' + CSS.escape(filename));
  if (area) area.innerHTML = '';
};

window.submitRename = function(filename) {
  const input = document.getElementById('rename-input-' + CSS.escape(filename));
  if (!input) return;
  const newName = input.value.trim().toLowerCase();
  if (!newName) return;
  fetch('api/backgrounds/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, new_name: newName })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) loadFiles();
      else alert('Rename failed: ' + data.error);
    });
};

function setupUpload() {
  const fileInput = document.getElementById('bg-file-input');
  const status = document.getElementById('bg-upload-status');
  const nameInput = document.getElementById('bg-name-input');
  const uploadBtn = document.getElementById('bg-upload-btn');

  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const ext = getExt(file.name);
    const baseName = file.name.slice(0, file.name.lastIndexOf('.')).toLowerCase();
    const sizeMB = file.size / (1024 * 1024);
    if (nameInput && !nameInput.value) {
      nameInput.value = baseName;
    }
    if (!ALL_TYPES.includes(ext)) {
      status.className = 'text-danger d-block mt-1';
      status.textContent = `Unsupported file type: ${ext}. Please use JPG, PNG, HEIC, WEBP, or MP4.`;
      fileInput.value = '';
      return;
    }
    if (sizeMB > MAX_FILE_SIZE_MB) {
      status.className = 'text-warning d-block mt-1';
      status.textContent = `Warning: file is ${sizeMB.toFixed(1)}MB. Large files may be slow to upload.`;
    } else if (CONVERT_TYPES.includes(ext)) {
      status.className = 'text-info d-block mt-1';
      status.textContent = `${ext.toUpperCase()} file will be converted to JPG automatically.`;
    } else {
      status.className = '';
      status.textContent = '';
    }
  });

  const form = document.getElementById('bg-upload-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      status.className = 'text-warning d-block mt-1';
      status.textContent = 'Please select a file first.';
      return;
    }
    const desiredName = nameInput ? nameInput.value.trim().toLowerCase() : '';
    if (!desiredName) {
      status.className = 'text-warning d-block mt-1';
      status.textContent = 'Please enter a name for this photo.';
      if (nameInput) nameInput.focus();
      return;
    }
    // Check for overwrite
    const existing = document.querySelector(`#bg-file-list [id^="rename-area-"]`);
    const allNames = Array.from(document.querySelectorAll('#bg-file-list .card-text.text-white, #bg-file-list td.text-white')).map(el => el.textContent.trim());
    const ext = getExt(file.name) === '.mp4' ? '.mp4' : '.jpg';
    const finalName = desiredName + ext;
    if (allNames.includes(finalName)) {
      if (!confirm(`A file named "${finalName}" already exists. Overwrite it?`)) {
        status.className = 'text-muted d-block mt-1';
        status.textContent = 'Upload cancelled.';
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', desiredName);
    status.className = 'text-info d-block mt-1';
    status.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    fetch('api/backgrounds/upload', {
      method: 'POST',
      body: formData
    })
      .then(r => r.json())
      .then(data => {
        uploadBtn.disabled = false;
        if (data.success) {
          status.className = 'text-success d-block mt-1';
          status.textContent = `Saved as: ${data.filename}${data.converted ? ' (converted to JPG)' : ''}`;
          fileInput.value = '';
          if (nameInput) nameInput.value = '';
          loadFiles();
        } else {
          status.className = 'text-danger d-block mt-1';
          status.textContent = 'Upload failed: ' + data.error;
        }
      })
      .catch(err => {
        uploadBtn.disabled = false;
        status.className = 'text-danger d-block mt-1';
        status.textContent = 'Upload error: ' + err;
      });
  });

  const toggleBtn = document.getElementById('bg-view-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      viewMode = viewMode === 'thumbs' ? 'list' : 'thumbs';
      toggleBtn.textContent = viewMode === 'thumbs' ? 'List View' : 'Thumbnail View';
      loadFiles();
    });
  }
}

export function initBackgrounds() {
  loadFiles();
  setupUpload();
}
