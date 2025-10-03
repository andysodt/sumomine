// Data structure
let rikishis = [];
let heyaList = [];
let currentPage = 1;
let totalResults = 0;
const pageSize = 50;

// DOM elements
const rikishisList = document.getElementById('rikishis-list');
const searchInput = document.getElementById('search-input');
const heyaFilter = document.getElementById('heya-filter');
const divisionFilter = document.getElementById('division-filter');
const rankFilter = document.getElementById('rank-filter');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadHeyaList();
    await loadRikishis();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    let searchTimeout;

    if (clearBtn) clearBtn.addEventListener('click', handleClear);

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 300);
        });
    }

    if (heyaFilter) {
        heyaFilter.addEventListener('change', handleSearch);
    }

    if (divisionFilter) {
        divisionFilter.addEventListener('change', handleSearch);
    }

    if (rankFilter) {
        rankFilter.addEventListener('change', handleSearch);
    }
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

async function loadHeyaList() {
    try {
        heyaList = await apiCall('/api/heya');
        if (heyaFilter && heyaList) {
            heyaList.forEach(heya => {
                const option = document.createElement('option');
                option.value = heya.heya;
                option.textContent = heya.heya;
                heyaFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load heya list:', error);
    }
}

async function loadRikishis(params = {}, page = 1) {
    currentPage = page;
    const offset = (page - 1) * pageSize;
    const allParams = { ...params, limit: pageSize, offset };
    const queryString = new URLSearchParams(allParams).toString();
    const url = `/api/rikishis?${queryString}`;
    const response = await apiCall(url);
    rikishis = response.data;
    totalResults = response.total;
    renderRikishis();
    renderPagination();
}

function handleSearch() {
    const params = {};
    if (searchInput.value) params.search = searchInput.value;
    if (heyaFilter.value) params.heya = heyaFilter.value;
    if (divisionFilter.value) params.division = divisionFilter.value;
    if (rankFilter.value) params.rank = rankFilter.value;
    loadRikishis(params, 1);
}

function handleClear() {
    searchInput.value = '';
    heyaFilter.value = '';
    divisionFilter.value = '';
    rankFilter.value = '';
    loadRikishis({}, 1);
}

function renderRikishis() {
    if (rikishis.length === 0) {
        rikishisList.innerHTML = '<div class="empty-state">No rikishis found. Try adjusting your search or import data from sumo-api.com</div>';
        return;
    }

    rikishisList.innerHTML = rikishis.map(rikishi => {
        const totalMatches = rikishi.wins + rikishi.losses;
        const winRate = totalMatches > 0 ? ((rikishi.wins / totalMatches) * 100).toFixed(1) : 0;
        const name = rikishi.shikona_en || rikishi.name || 'Unknown';
        const rank = rikishi.current_rank || rikishi.rank || 'N/A';
        const heya = rikishi.heya ? `<p><strong>Heya:</strong> ${rikishi.heya}</p>` : '';
        const birthDate = rikishi.birth_date ? new Date(rikishi.birth_date).toLocaleDateString() : 'N/A';
        const measurements = rikishi.height || rikishi.weight
            ? `<p><strong>Height:</strong> ${rikishi.height || 'N/A'} cm | <strong>Weight:</strong> ${rikishi.weight || 'N/A'} kg</p>`
            : '';
        const shusshin = rikishi.shusshin ? `<p><strong>Origin:</strong> ${rikishi.shusshin}</p>` : '';

        const imageUrl = rikishi.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=1e3a8a&color=fff&bold=true`;

        return `
            <div class="rikishi-card" onclick="showRikishiDetails(${rikishi.id})">
                <div class="rikishi-card-header">
                    <img src="${imageUrl}" alt="${name}" class="rikishi-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=1e3a8a&color=fff&bold=true'">
                    <div class="rikishi-card-info">
                        <h3>${name}${rikishi.shikona_jp ? ` (${rikishi.shikona_jp})` : ''}</h3>
                        <p><strong>Rank:</strong> ${rank}</p>
                        ${heya}
                    </div>
                </div>
                ${measurements}
                <p><strong>Birth Date:</strong> ${birthDate}</p>
                ${shusshin}
                <div class="rikishi-stats">
                    <div class="stat">
                        <div class="stat-label">Wins</div>
                        <div class="stat-value">${rikishi.wins}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Losses</div>
                        <div class="stat-value">${rikishi.losses}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Total Matches</div>
                        <div class="stat-value">${totalMatches}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Win Rate</div>
                        <div class="stat-value">${winRate}%</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showRikishiDetails(rikishiId) {
    window.location.href = `/rikishi.html?id=${rikishiId}`;
}

function renderPagination() {
    const totalPages = Math.ceil(totalResults / pageSize);

    if (totalPages <= 1) {
        // No pagination needed
        const existingPagination = document.querySelector('.pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        return;
    }

    let paginationHTML = `
        <div class="pagination">
            <div class="pagination-info">
                Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalResults)} of ${totalResults} rikishis
            </div>
            <div class="pagination-buttons">
    `;

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="goToPage(${currentPage - 1})">Previous</button>`;
    }

    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        paginationHTML += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span>...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? ' class="active"' : '';
        paginationHTML += `<button${activeClass} onclick="goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span>...</span>`;
        }
        paginationHTML += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="goToPage(${currentPage + 1})">Next</button>`;
    }

    paginationHTML += `
            </div>
        </div>
    `;

    // Remove existing pagination if any
    const existingPagination = document.querySelector('.pagination');
    if (existingPagination) {
        existingPagination.remove();
    }

    // Add new pagination
    rikishisList.insertAdjacentHTML('afterend', paginationHTML);
}

function goToPage(page) {
    const params = {};
    if (searchInput.value) params.search = searchInput.value;
    if (heyaFilter.value) params.heya = heyaFilter.value;
    if (divisionFilter.value) params.division = divisionFilter.value;
    if (rankFilter.value) params.rank = rankFilter.value;
    loadRikishis(params, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
