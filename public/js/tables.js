// Table state
const tables = new Map();

// Initialize table
function initTable(tableId, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Create table instance
    const instance = {
        element: table,
        options: {
            searchable: options.searchable || false,
            sortable: options.sortable || false,
            pagination: options.pagination || false,
            itemsPerPage: options.itemsPerPage || 10,
            currentPage: 1,
            totalItems: 0,
            data: [],
            columns: options.columns || [],
            sortColumn: null,
            sortDirection: 'asc',
            searchTerm: ''
        }
    };

    // Add search input if searchable
    if (instance.options.searchable) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'mb-4';
        searchContainer.innerHTML = `
            <div class="relative">
                <input type="text" 
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Search..."
                    data-table-search="${tableId}">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-4 w-4 text-gray-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
            </div>
        `;
        table.parentNode.insertBefore(searchContainer, table);
    }

    // Add pagination if enabled
    if (instance.options.pagination) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'mt-4 flex items-center justify-between';
        paginationContainer.innerHTML = `
            <div class="flex items-center">
                <span class="text-sm text-gray-700">
                    Showing <span data-table-pagination-start>1</span> to <span data-table-pagination-end>10</span> of <span data-table-pagination-total>0</span> entries
                </span>
            </div>
            <div class="flex items-center space-x-2">
                <button class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50" data-table-pagination-prev>
                    Previous
                </button>
                <button class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50" data-table-pagination-next>
                    Next
                </button>
            </div>
        `;
        table.parentNode.appendChild(paginationContainer);
    }

    // Add event listeners
    if (instance.options.searchable) {
        const searchInput = document.querySelector(`[data-table-search="${tableId}"]`);
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                instance.options.searchTerm = searchInput.value;
                instance.options.currentPage = 1;
                updateTable(tableId);
            }, 300));
        }
    }

    if (instance.options.pagination) {
        const prevButton = table.parentNode.querySelector('[data-table-pagination-prev]');
        const nextButton = table.parentNode.querySelector('[data-table-pagination-next]');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (instance.options.currentPage > 1) {
                    instance.options.currentPage--;
                    updateTable(tableId);
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const maxPage = Math.ceil(instance.options.totalItems / instance.options.itemsPerPage);
                if (instance.options.currentPage < maxPage) {
                    instance.options.currentPage++;
                    updateTable(tableId);
                }
            });
        }
    }

    if (instance.options.sortable) {
        const headers = table.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-sort');
                if (instance.options.sortColumn === column) {
                    instance.options.sortDirection = instance.options.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    instance.options.sortColumn = column;
                    instance.options.sortDirection = 'asc';
                }
                updateTable(tableId);
            });
        });
    }

    // Store table instance
    tables.set(tableId, instance);
}

// Update table
function updateTable(tableId) {
    const table = tables.get(tableId);
    if (!table) return;

    // Get filtered and sorted data
    let filteredData = [...table.options.data];

    // Apply search
    if (table.options.searchTerm) {
        const searchTerm = table.options.searchTerm.toLowerCase();
        filteredData = filteredData.filter(item => {
            return Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            );
        });
    }

    // Apply sorting
    if (table.options.sortColumn) {
        filteredData.sort((a, b) => {
            const aValue = a[table.options.sortColumn];
            const bValue = b[table.options.sortColumn];
            
            if (aValue < bValue) return table.options.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return table.options.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Update total items
    table.options.totalItems = filteredData.length;

    // Apply pagination
    if (table.options.pagination) {
        const start = (table.options.currentPage - 1) * table.options.itemsPerPage;
        const end = start + table.options.itemsPerPage;
        filteredData = filteredData.slice(start, end);

        // Update pagination info
        const startElement = table.element.parentNode.querySelector('[data-table-pagination-start]');
        const endElement = table.element.parentNode.querySelector('[data-table-pagination-end]');
        const totalElement = table.element.parentNode.querySelector('[data-table-pagination-total]');
        const prevButton = table.element.parentNode.querySelector('[data-table-pagination-prev]');
        const nextButton = table.element.parentNode.querySelector('[data-table-pagination-next]');

        if (startElement) startElement.textContent = start + 1;
        if (endElement) endElement.textContent = Math.min(end, table.options.totalItems);
        if (totalElement) totalElement.textContent = table.options.totalItems;

        if (prevButton) {
            prevButton.disabled = table.options.currentPage === 1;
            prevButton.classList.toggle('opacity-50', table.options.currentPage === 1);
        }

        if (nextButton) {
            const maxPage = Math.ceil(table.options.totalItems / table.options.itemsPerPage);
            nextButton.disabled = table.options.currentPage === maxPage;
            nextButton.classList.toggle('opacity-50', table.options.currentPage === maxPage);
        }
    }

    // Update table body
    const tbody = table.element.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = filteredData.map(item => `
            <tr class="hover:bg-gray-50">
                ${table.options.columns.map(column => `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item[column.key]}
                    </td>
                `).join('')}
            </tr>
        `).join('');
    }

    // Update sort indicators
    if (table.options.sortable) {
        const headers = table.element.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            const column = header.getAttribute('data-sort');
            const isSorted = column === table.options.sortColumn;
            
            // Remove existing indicators
            header.querySelectorAll('.sort-indicator').forEach(el => el.remove());
            
            if (isSorted) {
                const indicator = document.createElement('span');
                indicator.className = 'sort-indicator ml-2';
                indicator.innerHTML = table.options.sortDirection === 'asc' ? '↑' : '↓';
                header.appendChild(indicator);
            }
        });
    }
}

// Set table data
function setTableData(tableId, data) {
    const table = tables.get(tableId);
    if (!table) return;

    table.options.data = data;
    table.options.currentPage = 1;
    updateTable(tableId);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize all tables when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tables with data attributes
    document.querySelectorAll('[data-table]').forEach(element => {
        const tableId = element.id;
        const options = {
            searchable: element.hasAttribute('data-table-searchable'),
            sortable: element.hasAttribute('data-table-sortable'),
            pagination: element.hasAttribute('data-table-pagination'),
            itemsPerPage: parseInt(element.getAttribute('data-table-items-per-page')) || 10,
            columns: JSON.parse(element.getAttribute('data-table-columns') || '[]')
        };
        initTable(tableId, options);
    });
});

// Export table functions
window.initTable = initTable;
window.updateTable = updateTable;
window.setTableData = setTableData; 