// Data structure
let bashoList = [];

// DOM elements
const bashoListEl = document.getElementById('basho-list');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadBasho();
});

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

async function loadBasho() {
    bashoList = await apiCall('/api/basho');
    renderBasho();
}

function renderBasho() {
    if (bashoList.length === 0) {
        bashoListEl.innerHTML = '<div class="empty-state">No basho data available</div>';
        return;
    }

    bashoListEl.innerHTML = bashoList.map(basho => {
        const startDate = basho.start_date ? new Date(basho.start_date).toLocaleDateString() : 'N/A';
        const endDate = basho.end_date ? new Date(basho.end_date).toLocaleDateString() : 'N/A';
        const location = basho.location || 'Unknown';
        const yushoWinner = basho.yusho_winner_name || 'TBD';

        // Parse basho_id to get year and month
        const year = basho.basho_id.substring(0, 4);
        const month = basho.basho_id.substring(4, 6);
        const monthNames = {
            '01': 'January (Hatsu)',
            '03': 'March (Haru)',
            '05': 'May (Natsu)',
            '07': 'July (Nagoya)',
            '09': 'September (Aki)',
            '11': 'November (Kyushu)'
        };
        const bashoName = `${monthNames[month] || month} ${year}`;

        return `
            <div class="basho-card" onclick="showBashoDetails('${basho.basho_id}')">
                <h3>${bashoName}</h3>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Dates:</strong> ${startDate} - ${endDate}</p>
                <p><strong>Yusho Winner:</strong> ${yushoWinner}</p>
            </div>
        `;
    }).join('');
}

function showBashoDetails(bashoId) {
    window.location.href = `/basho.html?id=${bashoId}`;
}
