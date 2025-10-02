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

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.control-group')) {
            document.getElementById('search-results').style.display = 'none';
        }
    });
}

async function loadRikishiDropdown() {
    try {
        // Load top rikishi with current rank (most recent in database)
        const response = await apiCall('/api/rikishis?limit=100');
        const dropdown = document.getElementById('rikishi-dropdown');

        // Handle both paginated response format and direct array
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
            // Extract rank value for sorting
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

function handleDropdownSelect(e) {
    const value = e.target.value;
    if (!value) return;

    const { id, name } = JSON.parse(value);
    selectRikishi(id, name);

    // Reset dropdown
    e.target.value = '';
}

async function handleAddSelected() {
    const dropdown = document.getElementById('rikishi-dropdown');
    const selectedOptions = Array.from(dropdown.selectedOptions);

    console.log('=== handleAddSelected ===');
    console.log('Selected options from dropdown:', selectedOptions.length);

    if (selectedOptions.length === 0) {
        return;
    }

    // Add all selected rikishi first
    selectedOptions.forEach(option => {
        const { id, name } = JSON.parse(option.value);

        console.log('Processing option:', { id, name });

        // Check if already selected
        if (selectedRikishi.find(r => r.id === id)) {
            console.log('Already selected, skipping');
            return;
        }

        // Limit to 10 rikishi
        if (selectedRikishi.length >= 10) {
            alert('Maximum 10 rikishi can be selected');
            return;
        }

        const color = colors[selectedRikishi.length % colors.length];
        console.log('Adding rikishi with color:', color);
        selectedRikishi.push({ id, name, color });
    });

    console.log('selectedRikishi array after adding:', selectedRikishi);

    // Clear selections
    dropdown.selectedIndex = -1;

    // Update UI once after all rikishi are added
    updateSelectedList();
    await updateChart();
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
    // Check if already selected
    if (selectedRikishi.find(r => r.id === id)) {
        return;
    }

    // Limit to 10 rikishi
    if (selectedRikishi.length >= 10) {
        alert('Maximum 10 rikishi can be selected');
        return;
    }

    selectedRikishi.push({ id, name, color: colors[selectedRikishi.length % colors.length] });

    // Clear search
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
        listDiv.innerHTML = '<div class="empty-state">No rikishi selected. Search and select rikishi to view their rank progression.</div>';
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
    const ctx = document.getElementById('rankChart').getContext('2d');
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
                    reverse: true,
                    title: {
                        display: true,
                        text: 'Rank (lower is better)'
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
                            const rank = context.raw?.rank || 'Unknown';
                            return `${context.dataset.label}: ${rank}`;
                        }
                    }
                }
            }
        }
    });
}

async function updateChart() {
    if (selectedRikishi.length === 0) {
        if (chart) {
            chart.destroy();
            initializeChart();
        }
        return;
    }

    try {
        console.log('Selected rikishi:', selectedRikishi);

        // Fetch rank data for all selected rikishi
        const ranksData = await Promise.all(
            selectedRikishi.map(r => apiCall(`/api/rikishis/${r.id}/ranks`))
        );

        console.log('Ranks data received:', ranksData.map((data, i) => ({
            rikishi: selectedRikishi[i].name,
            rankCount: data.length,
            sample: data[0]
        })));

        // Filter out banzuke-gai and mae-zumo ranks
        const filteredRanksData = ranksData.map(data =>
            data.filter(rank => {
                // Exclude ranks containing "Banzuke-gai", "banzuke-gai", "mae-zumo", "maezumo", or any case variation
                const rankLower = (rank.rank || '').toLowerCase();
                return !rankLower.includes('banzuke-gai') &&
                       !rankLower.includes('banzukegai') &&
                       !rankLower.includes('mae-zumo') &&
                       !rankLower.includes('maezumo');
            })
        );

        console.log('Filtered ranks data:', filteredRanksData.map((data, i) => ({
            rikishi: selectedRikishi[i].name,
            rankCount: data.length
        })));

        // Get all unique basho IDs across all rikishi (after filtering)
        const allBashoIds = new Set();
        filteredRanksData.forEach(data => {
            data.forEach(rank => allBashoIds.add(rank.basho_id));
        });

        // Sort basho IDs chronologically
        const sortedBashoIds = Array.from(allBashoIds).sort();

        // Create datasets for each rikishi
        const datasets = selectedRikishi.map((rikishi, index) => {
            const rikishiRanks = filteredRanksData[index];

            // Create a map for quick lookup
            const rankMap = {};
            rikishiRanks.forEach(rank => {
                rankMap[rank.basho_id] = rank;
            });

            // Map basho IDs to rank values (with rank name attached for tooltip)
            const data = sortedBashoIds.map(bashoId => {
                const rank = rankMap[bashoId];
                return rank ? {
                    x: bashoId,
                    y: rank.rank_value,
                    rank: rank.rank
                } : null;
            });

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

        console.log('=== CHART UPDATE ===');
        console.log('Selected rikishi count:', selectedRikishi.length);
        console.log('Datasets count:', datasets.length);
        console.log('Datasets:', datasets.map(d => ({
            label: d.label,
            color: d.borderColor,
            pointCount: d.data.filter(p => p !== null).length,
            sampleData: d.data.filter(p => p !== null).slice(0, 3)
        })));

        // Completely destroy and recreate the chart
        if (chart) {
            console.log('Destroying existing chart instance');
            chart.destroy();
            chart = null;
        }

        // Get the canvas element and clear it completely
        const canvas = document.getElementById('rankChart');
        const parent = canvas.parentNode;
        canvas.remove();

        // Create a new canvas element
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'rankChart';
        parent.appendChild(newCanvas);

        const ctx = newCanvas.getContext('2d');
        console.log('Creating new chart with', datasets.length, 'datasets');
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
                        reverse: true,
                        title: {
                            display: true,
                            text: 'Rank (lower is better)'
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
                                const rank = context.raw?.rank || 'Unknown';
                                return `${context.dataset.label}: ${rank}`;
                            }
                        }
                    }
                }
            }
        });

        console.log('Chart recreated with', chart.data.datasets.length, 'datasets');
        console.log('Datasets:', chart.data.datasets.map(d => ({
            label: d.label,
            borderColor: d.borderColor,
            dataLength: d.data.length,
            nonNullPoints: d.data.filter(p => p !== null).length
        })));

        console.log('Chart updated. Current datasets in chart:', chart.data.datasets.length);
        console.log('Chart visible datasets:', chart.data.datasets.map(d => d.label));
        console.log('Chart instance datasets:', chart.data.datasets.map(d => ({
            label: d.label,
            visible: d.hidden === false || d.hidden === undefined,
            borderWidth: d.borderWidth || 'default'
        })));

    } catch (error) {
        console.error('Failed to update chart:', error);
    }
}
