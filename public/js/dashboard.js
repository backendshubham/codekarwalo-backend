// Chart configuration
const chartConfig = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Revenue',
            data: [],
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    drawBorder: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    }
};

// Initialize dashboard
async function initDashboard() {
    try {
        // Fetch dashboard data
        const response = await fetch('/admin/dashboard/stats');
        const data = await response.json();

        if (response.ok) {
            updateDashboardStats(data);
            updateRevenueChart(data.revenueData);
            updateRecentActivities(data.recentActivities);
            updateRecentProjects(data.recentProjects);
        } else {
            throw new Error(data.message || 'Failed to fetch dashboard data');
        }
    } catch (error) {
        showNotification('Error!', error.message, 'error');
    }
}

// Update dashboard statistics
function updateDashboardStats(data) {
    // Update total engineers
    const engineersElement = document.getElementById('totalEngineers');
    if (engineersElement) {
        engineersElement.textContent = data.totalEngineers;
        updateGrowthIndicator(engineersElement, data.engineersGrowth);
    }

    // Update total clients
    const clientsElement = document.getElementById('totalClients');
    if (clientsElement) {
        clientsElement.textContent = data.totalClients;
        updateGrowthIndicator(clientsElement, data.clientsGrowth);
    }

    // Update active projects
    const projectsElement = document.getElementById('activeProjects');
    if (projectsElement) {
        projectsElement.textContent = data.activeProjects;
        updateGrowthIndicator(projectsElement, data.projectsGrowth);
    }

    // Update total revenue
    const revenueElement = document.getElementById('totalRevenue');
    if (revenueElement) {
        revenueElement.textContent = formatCurrency(data.totalRevenue);
        updateGrowthIndicator(revenueElement, data.revenueGrowth);
    }
}

// Update revenue chart
function updateRevenueChart(revenueData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const chart = new Chart(ctx, {
        ...chartConfig,
        data: {
            ...chartConfig.data,
            labels: revenueData.labels,
            datasets: [{
                ...chartConfig.data.datasets[0],
                data: revenueData.values
            }]
        }
    });
}

// Update recent activities
function updateRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;

    container.innerHTML = activities.map(activity => `
        <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${getActivityIcon(activity.type)}"></path>
                    </svg>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                <p class="text-sm text-gray-500">${activity.description}</p>
                <p class="text-xs text-gray-400 mt-1">${formatDate(activity.createdAt)}</p>
            </div>
        </div>
    `).join('');
}

// Update recent projects
function updateRecentProjects(projects) {
    const container = document.getElementById('recentProjects');
    if (!container) return;

    container.innerHTML = projects.map(project => `
        <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </div>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">${project.name}</p>
                    <p class="text-xs text-gray-500">${project.client}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}">
                    ${project.status}
                </span>
                <div class="w-16">
                    <div class="h-2 bg-gray-200 rounded-full">
                        <div class="h-2 bg-blue-600 rounded-full" style="width: ${project.progress}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper functions
function updateGrowthIndicator(element, growth) {
    const indicator = document.createElement('span');
    indicator.className = `ml-2 text-sm font-medium ${
        growth >= 0 ? 'text-green-600' : 'text-red-600'
    }`;
    indicator.textContent = `${growth >= 0 ? '+' : ''}${growth}%`;
    element.appendChild(indicator);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getActivityIcon(type) {
    const icons = {
        'project': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        'client': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        'engineer': 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
        'default': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[type] || icons.default;
}

function getStatusColor(status) {
    const colors = {
        'active': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-blue-100 text-blue-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard); 