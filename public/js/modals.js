// Modal state
const modals = new Map();

// Initialize modal
function initModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Create modal instance
    const instance = {
        element: modal,
        isOpen: false,
        backdrop: createBackdrop(),
        content: modal.querySelector('[data-modal-content]'),
        closeButton: modal.querySelector('[data-modal-close]'),
        confirmButton: modal.querySelector('[data-modal-confirm]'),
        cancelButton: modal.querySelector('[data-modal-cancel]')
    };

    // Add event listeners
    if (instance.closeButton) {
        instance.closeButton.addEventListener('click', () => closeModal(modalId));
    }

    if (instance.confirmButton) {
        instance.confirmButton.addEventListener('click', () => {
            const callback = instance.confirmButton.getAttribute('data-modal-confirm-callback');
            if (callback && window[callback]) {
                window[callback]();
            }
            closeModal(modalId);
        });
    }

    if (instance.cancelButton) {
        instance.cancelButton.addEventListener('click', () => {
            const callback = instance.cancelButton.getAttribute('data-modal-cancel-callback');
            if (callback && window[callback]) {
                window[callback]();
            }
            closeModal(modalId);
        });
    }

    // Store modal instance
    modals.set(modalId, instance);
}

// Create backdrop
function createBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity';
    backdrop.style.display = 'none';
    document.body.appendChild(backdrop);
    return backdrop;
}

// Open modal
function openModal(modalId) {
    const modal = modals.get(modalId);
    if (!modal || modal.isOpen) return;

    // Show modal and backdrop
    modal.element.classList.remove('hidden');
    modal.backdrop.style.display = 'block';
    
    // Add animation classes
    modal.element.classList.add('animate-fade-in');
    modal.backdrop.classList.add('animate-fade-in');
    
    // Update state
    modal.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus first focusable element
    const focusableElements = modal.element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

// Close modal
function closeModal(modalId) {
    const modal = modals.get(modalId);
    if (!modal || !modal.isOpen) return;

    // Add animation classes
    modal.element.classList.add('animate-fade-out');
    modal.backdrop.classList.add('animate-fade-out');
    
    // Wait for animation to complete
    setTimeout(() => {
        // Hide modal and backdrop
        modal.element.classList.add('hidden');
        modal.backdrop.style.display = 'none';
        
        // Remove animation classes
        modal.element.classList.remove('animate-fade-in', 'animate-fade-out');
        modal.backdrop.classList.remove('animate-fade-in', 'animate-fade-out');
        
        // Update state
        modal.isOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
    }, 300);
}

// Set modal content
function setModalContent(modalId, content) {
    const modal = modals.get(modalId);
    if (!modal || !modal.content) return;

    modal.content.innerHTML = content;
}

// Set modal title
function setModalTitle(modalId, title) {
    const modal = modals.get(modalId);
    if (!modal) return;

    const titleElement = modal.element.querySelector('[data-modal-title]');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// Set modal buttons
function setModalButtons(modalId, { confirm, cancel } = {}) {
    const modal = modals.get(modalId);
    if (!modal) return;

    if (confirm) {
        if (modal.confirmButton) {
            modal.confirmButton.textContent = confirm.text || 'Confirm';
            if (confirm.callback) {
                modal.confirmButton.setAttribute('data-modal-confirm-callback', confirm.callback);
            }
            modal.confirmButton.style.display = '';
        }
    } else if (modal.confirmButton) {
        modal.confirmButton.style.display = 'none';
    }

    if (cancel) {
        if (modal.cancelButton) {
            modal.cancelButton.textContent = cancel.text || 'Cancel';
            if (cancel.callback) {
                modal.cancelButton.setAttribute('data-modal-cancel-callback', cancel.callback);
            }
            modal.cancelButton.style.display = '';
        }
    } else if (modal.cancelButton) {
        modal.cancelButton.style.display = 'none';
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.95);
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
    }

    .animate-fade-out {
        animation: fadeOut 0.3s ease-in forwards;
    }
`;
document.head.appendChild(style);

// Initialize all modals when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals with data attributes
    document.querySelectorAll('[data-modal]').forEach(element => {
        const modalId = element.id;
        initModal(modalId);
    });

    // Add click handlers for modal triggers
    document.querySelectorAll('[data-modal-trigger]').forEach(element => {
        element.addEventListener('click', () => {
            const modalId = element.getAttribute('data-modal-trigger');
            openModal(modalId);
        });
    });
});

// Export modal functions
window.openModal = openModal;
window.closeModal = closeModal;
window.setModalContent = setModalContent;
window.setModalTitle = setModalTitle;
window.setModalButtons = setModalButtons; 