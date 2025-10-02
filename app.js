// DOM elements
const statsSummary = document.getElementById('stats-summary');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboard();
    await loadStatsSummary();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // If it's an external link (rikishi-list.html), don't prevent default
            if (href.startsWith('/')) {
                return;
            }

            e.preventDefault();

            // Update active state
            document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Smooth scroll to section
            const targetId = href.substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

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

async function loadDashboard() {
    try {
        const [stats, topHeya, recentMatches, topPerformers] = await Promise.all([
            apiCall('/api/rikishis/stats/summary'),
            apiCall('/api/heya'),
            apiCall('/api/matches/recent'),
            apiCall('/api/rikishis/top-performers')
        ]);

        renderDashboard(stats, topHeya, recentMatches, topPerformers);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

async function loadStatsSummary() {
    const stats = await apiCall('/api/rikishis/stats/summary');
    renderStatsSummary(stats);
}

function renderDashboard(stats, topHeya, recentMatches, topPerformers) {
    // Update dashboard cards
    document.getElementById('dash-total-rikishi').textContent = stats.total_rikishis || 0;
    document.getElementById('dash-total-heya').textContent = stats.total_heya || 0;
    document.getElementById('dash-total-matches').textContent = stats.total_matches || 0;
    document.getElementById('dash-total-ranks').textContent = stats.total_ranks || 0;

    const avgHeight = stats.avg_height ? parseFloat(stats.avg_height).toFixed(1) + ' cm' : 'N/A';
    const avgWeight = stats.avg_weight ? parseFloat(stats.avg_weight).toFixed(1) + ' kg' : 'N/A';
    document.getElementById('dash-avg-height').textContent = avgHeight;
    document.getElementById('dash-avg-weight').textContent = avgWeight;

    // Top Heya
    const topHeyaList = document.getElementById('top-heya-list');
    if (topHeya && topHeya.length > 0) {
        topHeyaList.innerHTML = topHeya.slice(0, 5).map(heya => `
            <div class="heya-item">
                <span class="heya-name">${heya.heya}</span>
                <span class="heya-count">${heya.rikishi_count}</span>
            </div>
        `).join('');
    } else {
        topHeyaList.innerHTML = '<div class="empty-state">No heya data available</div>';
    }

    // Recent Matches
    const recentMatchesList = document.getElementById('recent-matches-list');
    if (recentMatches && recentMatches.length > 0) {
        recentMatchesList.innerHTML = recentMatches.slice(0, 5).map(match => `
            <div class="match-preview">
                <div class="match-fighters">${match.rikishi_name} vs ${match.opponent}</div>
                <div class="match-result ${match.result}">${match.result.toUpperCase()}</div>
                <div class="match-date">${match.basho_id} - Day ${match.day}</div>
            </div>
        `).join('');
    } else {
        recentMatchesList.innerHTML = '<div class="empty-state">No recent matches</div>';
    }

    // Top Performers
    const topPerformersList = document.getElementById('top-performers-list');
    if (topPerformers && topPerformers.length > 0) {
        topPerformersList.innerHTML = topPerformers.slice(0, 5).map(performer => {
            const totalMatches = performer.wins + performer.losses;
            const winRate = totalMatches > 0 ? ((performer.wins / totalMatches) * 100).toFixed(0) : 0;
            return `
                <div class="performer-item">
                    <span class="performer-name">${performer.shikona_en || performer.name}</span>
                    <div class="performer-stats">
                        <span>${performer.wins}W - ${performer.losses}L</span>
                        <span class="win-rate">${winRate}%</span>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        topPerformersList.innerHTML = '<div class="empty-state">No top performers available</div>';
    }
}

function renderStatsSummary(stats) {
    if (!statsSummary) return;

    const totalRikishis = stats.total_rikishis || 0;
    const totalHeya = stats.total_heya || 0;
    const totalRanks = stats.total_ranks || 0;
    const totalMatches = stats.total_matches || 0;
    const avgHeight = stats.avg_height ? parseFloat(stats.avg_height).toFixed(1) : 'N/A';
    const avgWeight = stats.avg_weight ? parseFloat(stats.avg_weight).toFixed(1) : 'N/A';

    statsSummary.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <h3>Total Rikishi</h3>
                <p class="stat-number">${totalRikishis}</p>
            </div>
            <div class="stat-item">
                <h3>Total Heya (Stables)</h3>
                <p class="stat-number">${totalHeya}</p>
            </div>
            <div class="stat-item">
                <h3>Total Ranks</h3>
                <p class="stat-number">${totalRanks}</p>
            </div>
            <div class="stat-item">
                <h3>Total Matches</h3>
                <p class="stat-number">${totalMatches}</p>
            </div>
            <div class="stat-item">
                <h3>Average Height</h3>
                <p class="stat-number">${avgHeight} ${avgHeight !== 'N/A' ? 'cm' : ''}</p>
            </div>
            <div class="stat-item">
                <h3>Average Weight</h3>
                <p class="stat-number">${avgWeight} ${avgWeight !== 'N/A' ? 'kg' : ''}</p>
            </div>
        </div>
    `;
}
