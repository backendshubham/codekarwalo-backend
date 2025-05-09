// File upload state
const uploads = new Map();

// Initialize file upload
function initFileUpload(uploadId, options = {}) {
    const container = document.getElementById(uploadId);
    if (!container) return;

    // Create upload instance
    const instance = {
        element: container,
        options: {
            multiple: options.multiple || false,
            accept: options.accept || '*/*',
            maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB default
            endpoint: options.endpoint || '/upload',
            onUploadStart: options.onUploadStart || (() => {}),
            onUploadProgress: options.onUploadProgress || (() => {}),
            onUploadSuccess: options.onUploadSuccess || (() => {}),
            onUploadError: options.onUploadError || (() => {}),
            onFileSelect: options.onFileSelect || (() => {})
        }
    };

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = instance.options.multiple;
    fileInput.accept = instance.options.accept;
    fileInput.className = 'hidden';
    fileInput.id = `${uploadId}-input`;

    // Create drop zone
    const dropZone = document.createElement('div');
    dropZone.className = 'relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
    dropZone.innerHTML = `
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <p class="mt-1 text-sm text-gray-600">
            Drag and drop your files here, or <label for="${uploadId}-input" class="text-blue-600 hover:text-blue-500 cursor-pointer">browse</label>
        </p>
        <p class="mt-1 text-xs text-gray-500">
            ${instance.options.multiple ? 'Multiple files allowed' : 'Single file only'}
        </p>
    `;

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4';
    previewContainer.id = `${uploadId}-preview`;

    // Add elements to container
    container.appendChild(fileInput);
    container.appendChild(dropZone);
    container.appendChild(previewContainer);

    // Add event listeners
    fileInput.addEventListener('change', (e) => handleFileSelect(e, instance));
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500');
        fileInput.files = e.dataTransfer.files;
        handleFileSelect({ target: fileInput }, instance);
    });

    // Store upload instance
    uploads.set(uploadId, instance);
}

// Handle file selection
function handleFileSelect(event, instance) {
    const files = Array.from(event.target.files);
    
    // Validate files
    const validFiles = files.filter(file => {
        // Check file type
        if (instance.options.accept !== '*/*') {
            const acceptedTypes = instance.options.accept.split(',').map(type => type.trim());
            const fileType = file.type;
            if (!acceptedTypes.some(type => {
                if (type.endsWith('/*')) {
                    return fileType.startsWith(type.replace('/*', ''));
                }
                return type === fileType;
            })) {
                showNotification('Error!', `File type ${fileType} is not allowed`, 'error');
                return false;
            }
        }

        // Check file size
        if (file.size > instance.options.maxSize) {
            showNotification('Error!', `File ${file.name} is too large. Maximum size is ${formatFileSize(instance.options.maxSize)}`, 'error');
            return false;
        }

        return true;
    });

    // Call onFileSelect callback
    instance.options.onFileSelect(validFiles);

    // Show previews
    showFilePreviews(validFiles, instance);

    // Upload files
    if (validFiles.length > 0) {
        uploadFiles(validFiles, instance);
    }
}

// Show file previews
function showFilePreviews(files, instance) {
    const previewContainer = document.getElementById(`${instance.element.id}-preview`);
    if (!previewContainer) return;

    files.forEach(file => {
        const preview = document.createElement('div');
        preview.className = 'relative group';
        preview.innerHTML = `
            <div class="aspect-w-10 aspect-h-7 rounded-lg bg-gray-100 overflow-hidden">
                ${file.type.startsWith('image/') ? `
                    <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="object-cover">
                ` : `
                    <div class="flex items-center justify-center h-full">
                        <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                `}
            </div>
            <div class="mt-2 flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${file.name}</p>
                    <p class="text-xs text-gray-500">${formatFileSize(file.size)}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button type="button" class="text-red-600 hover:text-red-900">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" class="text-white hover:text-gray-200">
                    <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                </button>
            </div>
        `;

        // Add remove button functionality
        const removeButton = preview.querySelector('button');
        removeButton.addEventListener('click', () => {
            preview.remove();
        });

        // Add preview button functionality
        const previewButton = preview.querySelector('.group-hover\\:opacity-100 button');
        previewButton.addEventListener('click', () => {
            if (file.type.startsWith('image/')) {
                showImagePreview(file);
            } else {
                showFilePreview(file);
            }
        });

        previewContainer.appendChild(preview);
    });
}

// Upload files
async function uploadFiles(files, instance) {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    try {
        // Call onUploadStart callback
        instance.options.onUploadStart(files);

        const response = await fetch(instance.options.endpoint, {
            method: 'POST',
            body: formData,
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                instance.options.onUploadProgress(percentCompleted);
            }
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();

        // Call onUploadSuccess callback
        instance.options.onUploadSuccess(data);

        showNotification('Success!', 'Files uploaded successfully', 'success');
    } catch (error) {
        // Call onUploadError callback
        instance.options.onUploadError(error);

        showNotification('Error!', error.message, 'error');
    }
}

// Show image preview
function showImagePreview(file) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="max-w-full h-auto">
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeButton = modal.querySelector('button');
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Show file preview
function showFilePreview(file) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">${file.name}</h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">Type: ${file.type}</p>
                                <p class="text-sm text-gray-500">Size: ${formatFileSize(file.size)}</p>
                                <p class="text-sm text-gray-500">Last modified: ${new Date(file.lastModified).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeButton = modal.querySelector('button');
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize all file uploads when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize file uploads with data attributes
    document.querySelectorAll('[data-file-upload]').forEach(element => {
        const uploadId = element.id;
        const options = {
            multiple: element.hasAttribute('data-file-upload-multiple'),
            accept: element.getAttribute('data-file-upload-accept') || '*/*',
            maxSize: parseInt(element.getAttribute('data-file-upload-max-size')) || 5 * 1024 * 1024,
            endpoint: element.getAttribute('data-file-upload-endpoint') || '/upload'
        };
        initFileUpload(uploadId, options);
    });
});

// Export file upload functions
window.initFileUpload = initFileUpload; 