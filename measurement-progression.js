// API calls
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        alert('An error occurred. Please try again.');
        throw error;
    }
}

// Global state
let selectedRikishi = [];
let chart = null;
let searchTimeout = null;
let currentMeasurementType = 'weight';

const colors = [
    '#1e3a8a', '#dc2626', '#16a34a', '#ca8a04', '#9333ea',
    '#0891b2', '#db2777', '#65a30d', '#c026d3', '#0284c7'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeChart();
    loadRikishiDropdown();
});

function setupEventListeners() {
    const searchInput = document.getElementById('rikishi-search');
    searchInput.addEventListener('input', handleSearch);

    const addSelectedBtn = document.getElementById('add-selected-btn');
    addSelectedBtn.addEventListener('click', handleAddSelected);

    const measurementType = document.getElementById('measurement-type');
    measurementType.addEventListener('change', handleMeasurementTypeChange);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.control-group')) {
            document.getElementById('search-results').style.display = 'none';
        }
    });
}

async function loadRikishiDropdown() {
    try {
        const response = await apiCall('/api/rikishis?limit=100');
        const dropdown = document.getElementById('rikishi-dropdown');

        const rikishis = response.data || response;

        // Remove duplicates by ID and filter rikishi with current rank
        const uniqueRikishi = [];
        const seenIds = new Set();

        rikishis.forEach(r => {
            if (r.current_rank && !seenIds.has(r.id)) {
                seenIds.add(r.id);
                uniqueRikishi.push(r);
            }
        });

        // Sort by rank
        const rankedRikishi = uniqueRikishi.sort((a, b) => {
            const getRankOrder = (rank) => {
                if (!rank) return 9999;
                if (rank.includes('Yokozuna')) return 0;
                if (rank.includes('Ozeki')) return 1;
                if (rank.includes('Sekiwake')) return 2;
                if (rank.includes('Komusubi')) return 3;
                if (rank.includes('Maegashira')) return 4;
                if (rank.includes('Juryo')) return 100;
                return 1000;
            };
            return getRankOrder(a.current_rank) - getRankOrder(b.current_rank);
        });

        rankedRikishi.forEach(r => {
            const option = document.createElement('option');
            option.value = JSON.stringify({ id: r.id, name: r.shikona_en });
            option.textContent = `${r.shikona_en} (${r.current_rank})`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load rikishi dropdown:', error);
    }
}

async function handleAddSelected() {
    const dropdown = document.getElementById('rikishi-dropdown');
    const selectedOptions = Array.from(dropdown.selectedOptions);

    if (selectedOptions.length === 0) {
        return;
    }

    selectedOptions.forEach(option => {
        const { id, name } = JSON.parse(option.value);

        if (selectedRikishi.find(r => r.id === id)) {
            return;
        }

        if (selectedRikishi.length >= 10) {
            alert('Maximum 10 rikishi can be selected');
            return;
        }

        const color = colors[selectedRikishi.length % colors.length];
        selectedRikishi.push({ id, name, color });
    });

    dropdown.selectedIndex = -1;

    updateSelectedList();
    await updateChart();
}

function handleMeasurementTypeChange(e) {
    currentMeasurementType = e.target.value;
    updateChart();
}

function handleSearch(e) {
    const query = e.target.value.trim();

    clearTimeout(searchTimeout);

    if (query.length < 2) {
        document.getElementById('search-results').style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await apiCall(`/api/rikishis?search=${encodeURIComponent(query)}&limit=10`);
            displaySearchResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        }
    }, 300);
}

function displaySearchResults(rikishis) {
    const resultsDiv = document.getElementById('search-results');

    if (rikishis.length === 0) {
        resultsDiv.innerHTML = '<div class="no-results">No rikishi found</div>';
        resultsDiv.style.display = 'block';
        return;
    }

    resultsDiv.innerHTML = rikishis.map(r => `
        <div class="search-result-item" onclick="selectRikishi(${r.id}, '${r.shikona_en}')">
            <div class="result-name">${r.shikona_en}</div>
            <div class="result-rank">${r.current_rank || 'N/A'}</div>
        </div>
    `).join('');

    resultsDiv.style.display = 'block';
}

async function selectRikishi(id, name) {
    if (selectedRikishi.find(r => r.id === id)) {
        return;
    }

    if (selectedRikishi.length >= 10) {
        alert('Maximum 10 rikishi can be selected');
        return;
    }

    selectedRikishi.push({ id, name, color: colors[selectedRikishi.length % colors.length] });

    document.getElementById('rikishi-search').value = '';
    document.getElementById('search-results').style.display = 'none';

    updateSelectedList();
    await updateChart();
}

function removeRikishi(id) {
    selectedRikishi = selectedRikishi.filter(r => r.id !== id);
    updateSelectedList();
    updateChart();
}

function updateSelectedList() {
    const listDiv = document.getElementById('selected-list');

    if (selectedRikishi.length === 0) {
        listDiv.innerHTML = '<div class="empty-state">No rikishi selected. Search and select rikishi to view their measurement progression.</div>';
        return;
    }

    listDiv.innerHTML = selectedRikishi.map(r => `
        <div class="selected-item">
            <div class="color-indicator" style="background-color: ${r.color}"></div>
            <span>${r.name}</span>
            <button class="remove-btn" onclick="removeRikishi(${r.id})">×</button>
        </div>
    `).join('');
}

function initializeChart() {
    const ctx = document.getElementById('measurementChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Basho'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw?.value || context.parsed.y;
                            const unit = currentMeasurementType === 'height' ? ' cm' : ' kg';
                            return `${context.dataset.label}: ${value}${unit}`;
                        }
                    }
                }
            }
        }
    });
}

async function updateChart() {
    console.log('updateChart called, selectedRikishi:', selectedRikishi);

    if (selectedRikishi.length === 0) {
        if (chart) {
            chart.destroy();
            initializeChart();
        }
        return;
    }

    try {
        console.log('Fetching measurements for rikishi...');
        // Fetch measurement data for all selected rikishi
        const measurementsData = await Promise.all(
            selectedRikishi.map(r => apiCall(`/api/rikishis/${r.id}/measurements`))
        );

        console.log('Measurements data received:', measurementsData.map((data, i) => ({
            rikishi: selectedRikishi[i].name,
            count: data.length,
            sample: data[0]
        })));

        // Get all unique basho IDs
        const allBashoIds = new Set();
        measurementsData.forEach(data => {
            data.forEach(measurement => allBashoIds.add(measurement.basho_id));
        });

        const sortedBashoIds = Array.from(allBashoIds).sort();

        // Create datasets for each rikishi
        const datasets = selectedRikishi.map((rikishi, index) => {
            const rikishiMeasurements = measurementsData[index];

            // Create a map for quick lookup
            const measurementMap = {};
            rikishiMeasurements.forEach(m => {
                measurementMap[m.basho_id] = m;
            });

            // Map basho IDs to measurement values - filter out nulls
            const data = sortedBashoIds
                .map(bashoId => {
                    const measurement = measurementMap[bashoId];
                    if (!measurement) return null;

                    const value = currentMeasurementType === 'height'
                        ? parseFloat(measurement.height)
                        : parseFloat(measurement.weight);

                    if (!value || isNaN(value)) return null;

                    return {
                        x: bashoId,
                        y: value,
                        value: value
                    };
                })
                .filter(point => point !== null);

            return {
                label: rikishi.name,
                data: data,
                borderColor: rikishi.color,
                backgroundColor: rikishi.color + '20',
                borderWidth: 3,
                tension: 0.1,
                spanGaps: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                hidden: false,
                fill: false
            };
        });

        // Destroy and recreate the chart
        if (chart) {
            chart.destroy();
            chart = null;
        }

        // Get the canvas element and clear it completely
        const canvas = document.getElementById('measurementChart');
        const parent = canvas.parentNode;
        canvas.remove();

        // Create a new canvas element
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'measurementChart';
        parent.appendChild(newCanvas);

        const ctx = newCanvas.getContext('2d');
        const yAxisLabel = currentMeasurementType === 'height' ? 'Height (cm)' : 'Weight (kg)';

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedBashoIds,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Basho'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw?.value || context.parsed.y;
                                const unit = currentMeasurementType === 'height' ? ' cm' : ' kg';
                                return `${context.dataset.label}: ${value}${unit}`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Failed to update chart:', error);
    }
}
