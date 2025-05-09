// Tag input handling
function initTagInput(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    const tags = new Set();

    function addTag(tag) {
        if (tag && !tags.has(tag)) {
            tags.add(tag);
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="tag-remove" onclick="removeTag('${tag}', '${containerId}')">&times;</span>
            `;
            container.appendChild(tagElement);
            input.value = '';
        }
    }

    function removeTag(tag, containerId) {
        tags.delete(tag);
        const container = document.getElementById(containerId);
        const tags = container.getElementsByClassName('tag');
        for (let tagElement of tags) {
            if (tagElement.textContent.trim() === tag) {
                tagElement.remove();
                break;
            }
        }
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = input.value.trim();
            addTag(tag);
        }
    });

    // Make removeTag function globally available
    window.removeTag = removeTag;
}

// File input handling
function initFileInput(inputId, labelId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            label.innerHTML = `
                <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-sm font-medium text-gray-700">${file.name}</span>
            `;
        }
    });
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('border-red-500');
            
            // Add error message if it doesn't exist
            let errorMessage = input.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('text-red-500')) {
                errorMessage = document.createElement('p');
                errorMessage.className = 'text-red-500 text-sm mt-1';
                errorMessage.textContent = 'This field is required';
                input.parentNode.insertBefore(errorMessage, input.nextSibling);
            }
        } else {
            input.classList.remove('border-red-500');
            const errorMessage = input.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('text-red-500')) {
                errorMessage.remove();
            }
        }
    });

    return isValid;
}

// Form submission
function handleFormSubmit(formId, endpoint) {
    const form = document.getElementById(formId);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(formId)) {
            return;
        }

        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            `;

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                showNotification('Success!', data.message || 'Form submitted successfully', 'success');
                
                // Reset form
                form.reset();
                
                // Reset file input label if exists
                const fileLabel = form.querySelector('.file-input-label');
                if (fileLabel) {
                    fileLabel.innerHTML = `
                        <svg class="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Click to upload or drag and drop</span>
                    `;
                }
                
                // Reset tags container if exists
                const tagsContainer = form.querySelector('#tagsContainer');
                if (tagsContainer) {
                    tagsContainer.innerHTML = '';
                }
            } else {
                throw new Error(data.message || 'Something went wrong');
            }
        } catch (error) {
            showNotification('Error!', error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
}

// Notification system
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg animate-fade-up ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white`;
    
    notification.innerHTML = `
        <div class="font-bold">${title}</div>
        <div class="text-sm">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Initialize all form components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tag inputs
    const tagInputs = document.querySelectorAll('[data-tag-input]');
    tagInputs.forEach(input => {
        const inputId = input.getAttribute('data-tag-input');
        const containerId = input.getAttribute('data-tag-container');
        initTagInput(inputId, containerId);
    });

    // Initialize file inputs
    const fileInputs = document.querySelectorAll('[data-file-input]');
    fileInputs.forEach(input => {
        const inputId = input.getAttribute('data-file-input');
        const labelId = input.getAttribute('data-file-label');
        initFileInput(inputId, labelId);
    });

    // Initialize form submissions
    const forms = document.querySelectorAll('[data-form]');
    forms.forEach(form => {
        const formId = form.getAttribute('data-form');
        const endpoint = form.getAttribute('data-endpoint');
        handleFormSubmit(formId, endpoint);
    });
}); 