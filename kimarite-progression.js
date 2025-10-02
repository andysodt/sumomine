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
        listDiv.innerHTML = '<div class="empty-state">No rikishi selected. Search and select rikishi to view their kimarite usage.</div>';
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
    const ctx = document.getElementById('kimariteChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Kimarite'
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
                            return `${context.dataset.label}: ${context.parsed.y}`;
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
        // Fetch bout data for all selected rikishi
        const boutsData = await Promise.all(
            selectedRikishi.map(r => apiCall(`/api/rikishis/${r.id}/bouts`))
        );

        // Aggregate kimarite counts for each rikishi
        const rikishiKimarite = selectedRikishi.map((rikishi, index) => {
            const bouts = boutsData[index];
            const kimariteCount = {};

            bouts.forEach(bout => {
                // Only count wins for this rikishi
                const isWinner = bout.winner_en === rikishi.name;
                if (isWinner && bout.kimarite) {
                    kimariteCount[bout.kimarite] = (kimariteCount[bout.kimarite] || 0) + 1;
                }
            });

            return { rikishi, counts: kimariteCount };
        });

        // Get all unique kimarite across all rikishi
        const allKimarite = new Set();
        rikishiKimarite.forEach(({ counts }) => {
            Object.keys(counts).forEach(k => allKimarite.add(k));
        });

        // Sort kimarite by total usage across all rikishi
        const kimariteWithTotals = Array.from(allKimarite).map(kimarite => {
            const total = rikishiKimarite.reduce((sum, { counts }) => sum + (counts[kimarite] || 0), 0);
            return { kimarite, total };
        });

        kimariteWithTotals.sort((a, b) => b.total - a.total);
        const sortedKimarite = kimariteWithTotals.map(k => k.kimarite);

        // Create datasets for each rikishi
        const datasets = selectedRikishi.map((rikishi, index) => {
            const counts = rikishiKimarite[index].counts;

            const data = sortedKimarite.map(kimarite => counts[kimarite] || 0);

            return {
                label: rikishi.name,
                data: data,
                backgroundColor: rikishi.color,
                borderColor: rikishi.color,
                borderWidth: 1
            };
        });

        // Destroy and recreate the chart
        if (chart) {
            chart.destroy();
            chart = null;
        }

        // Get the canvas element and clear it completely
        const canvas = document.getElementById('kimariteChart');
        const parent = canvas.parentNode;
        canvas.remove();

        // Create a new canvas element
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'kimariteChart';
        parent.appendChild(newCanvas);

        const ctx = newCanvas.getContext('2d');
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedKimarite,
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Kimarite'
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
                                return `${context.dataset.label}: ${context.parsed.y}`;
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
