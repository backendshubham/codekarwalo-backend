// Navigation state
let isMobileMenuOpen = false;
let currentPath = window.location.pathname;

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuButton = document.getElementById('menuButton');
    
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
        mobileMenu.classList.remove('hidden');
        menuButton.innerHTML = `
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        `;
    } else {
        mobileMenu.classList.add('hidden');
        menuButton.innerHTML = `
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        `;
    }
}

// Update active navigation item
function updateActiveNavItem() {
    const navItems = document.querySelectorAll('[data-nav-item]');
    
    navItems.forEach(item => {
        const itemPath = item.getAttribute('data-nav-item');
        const isActive = currentPath.startsWith(itemPath);
        
        if (isActive) {
            item.classList.add('bg-gray-900', 'text-white');
            item.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
        } else {
            item.classList.remove('bg-gray-900', 'text-white');
            item.classList.add('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
        }
    });
}

// Handle navigation click
function handleNavClick(event) {
    const navItem = event.target.closest('[data-nav-item]');
    if (!navItem) return;
    
    const path = navItem.getAttribute('data-nav-item');
    if (path === currentPath) return;
    
    // Update current path
    currentPath = path;
    
    // Update active state
    updateActiveNavItem();
    
    // Close mobile menu if open
    if (isMobileMenuOpen) {
        toggleMobileMenu();
    }
}

// Handle dropdown toggle
function toggleDropdown(event) {
    const dropdownButton = event.target.closest('[data-dropdown-toggle]');
    if (!dropdownButton) return;
    
    const dropdownId = dropdownButton.getAttribute('data-dropdown-toggle');
    const dropdown = document.getElementById(dropdownId);
    
    if (dropdown) {
        const isOpen = !dropdown.classList.contains('hidden');
        
        // Close all other dropdowns
        document.querySelectorAll('[data-dropdown]').forEach(d => {
            if (d.id !== dropdownId) {
                d.classList.add('hidden');
            }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('hidden');
        
        // Update button icon
        const icon = dropdownButton.querySelector('svg');
        if (icon) {
            icon.innerHTML = isOpen ? 
                `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>` :
                `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>`;
        }
    }
}

// Handle click outside
function handleClickOutside(event) {
    // Close dropdowns when clicking outside
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    dropdowns.forEach(dropdown => {
        if (!dropdown.classList.contains('hidden') && !event.target.closest('[data-dropdown-toggle]')) {
            dropdown.classList.add('hidden');
        }
    });
    
    // Close mobile menu when clicking outside
    const mobileMenu = document.getElementById('mobileMenu');
    const menuButton = document.getElementById('menuButton');
    if (isMobileMenuOpen && !event.target.closest('#mobileMenu') && !event.target.closest('#menuButton')) {
        toggleMobileMenu();
    }
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    // Set initial active state
    updateActiveNavItem();
    
    // Add event listeners
    document.addEventListener('click', handleClickOutside);
    
    // Mobile menu button
    const menuButton = document.getElementById('menuButton');
    if (menuButton) {
        menuButton.addEventListener('click', toggleMobileMenu);
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('[data-nav-item]');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
    });
    
    // Dropdown toggles
    const dropdownToggles = document.querySelectorAll('[data-dropdown-toggle]');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', toggleDropdown);
    });
}); 