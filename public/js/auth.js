// Authentication state
let isAuthenticated = false;
let currentUser = null;

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/admin/auth/status');
        const data = await response.json();

        if (response.ok && data.authenticated) {
            isAuthenticated = true;
            currentUser = data.user;
            updateAuthUI();
        } else {
            isAuthenticated = false;
            currentUser = null;
            redirectToLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        redirectToLogin();
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
        `;

        const response = await fetch('/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            isAuthenticated = true;
            currentUser = data.user;
            showNotification('Success!', 'Welcome back!', 'success');
            window.location.href = '/admin/dashboard';
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        showNotification('Error!', error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch('/admin/auth/logout', {
            method: 'POST'
        });

        if (response.ok) {
            isAuthenticated = false;
            currentUser = null;
            showNotification('Success!', 'Logged out successfully', 'success');
            redirectToLogin();
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        showNotification('Error!', error.message, 'error');
    }
}

// Update UI based on authentication state
function updateAuthUI() {
    const authElements = document.querySelectorAll('[data-auth]');
    const guestElements = document.querySelectorAll('[data-guest]');
    const userElements = document.querySelectorAll('[data-user]');

    authElements.forEach(element => {
        element.style.display = isAuthenticated ? 'block' : 'none';
    });

    guestElements.forEach(element => {
        element.style.display = isAuthenticated ? 'none' : 'block';
    });

    userElements.forEach(element => {
        if (isAuthenticated && currentUser) {
            element.style.display = 'block';
            // Update user-specific content
            const nameElement = element.querySelector('[data-user-name]');
            if (nameElement) {
                nameElement.textContent = currentUser.name;
            }
            const emailElement = element.querySelector('[data-user-email]');
            if (emailElement) {
                emailElement.textContent = currentUser.email;
            }
        } else {
            element.style.display = 'none';
        }
    });
}

// Redirect to login page
function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/admin/login')) {
        window.location.href = '/admin/login';
    }
}

// Initialize authentication
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status
    checkAuth();

    // Initialize login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Initialize logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}); 