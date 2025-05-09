// Chart configurations
const chartConfigs = {
    line: {
        type: 'line',
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
    },
    bar: {
        type: 'bar',
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
    },
    pie: {
        type: 'pie',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    },
    doughnut: {
        type: 'doughnut',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    }
};

// Chart instances
const charts = new Map();

// Initialize chart
function initChart(chartId, type, data) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;

    // Get chart configuration
    const config = chartConfigs[type];
    if (!config) return;

    // Create chart instance
    const chart = new Chart(canvas, {
        ...config,
        data: {
            labels: data.labels,
            datasets: data.datasets.map(dataset => ({
                ...dataset,
                borderColor: dataset.borderColor || getDefaultColor(dataset.label),
                backgroundColor: dataset.backgroundColor || getDefaultColor(dataset.label, 0.1)
            }))
        }
    });

    // Store chart instance
    charts.set(chartId, chart);
}

// Update chart data
function updateChart(chartId, data) {
    const chart = charts.get(chartId);
    if (!chart) return;

    chart.data.labels = data.labels;
    chart.data.datasets = data.datasets.map(dataset => ({
        ...dataset,
        borderColor: dataset.borderColor || getDefaultColor(dataset.label),
        backgroundColor: dataset.backgroundColor || getDefaultColor(dataset.label, 0.1)
    }));

    chart.update();
}

// Destroy chart
function destroyChart(chartId) {
    const chart = charts.get(chartId);
    if (chart) {
        chart.destroy();
        charts.delete(chartId);
    }
}

// Get default color
function getDefaultColor(label, alpha = 1) {
    const colors = [
        '#4F46E5', // Indigo
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#3B82F6', // Blue
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#F97316', // Orange
        '#84CC16'  // Lime
    ];

    // Use label to get consistent color
    const index = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const color = colors[index];

    if (alpha < 1) {
        return hexToRgba(color, alpha);
    }

    return color;
}

// Convert hex to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Initialize all charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts with data attributes
    document.querySelectorAll('[data-chart]').forEach(element => {
        const chartId = element.id;
        const chartType = element.getAttribute('data-chart');
        const chartData = JSON.parse(element.getAttribute('data-chart-data') || '{}');
        
        initChart(chartId, chartType, chartData);
    });
});

// Export chart functions
window.initChart = initChart;
window.updateChart = updateChart;
window.destroyChart = destroyChart; 