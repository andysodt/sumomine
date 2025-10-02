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

// Load banzuke list
async function loadBanzukeList() {
    try {
        const bashoList = await apiCall('/api/basho');

        if (!bashoList || bashoList.length === 0) {
            document.getElementById('banzuke-list').innerHTML = '<div class="empty-state">No banzuke data available</div>';
            return;
        }

        const html = bashoList.map(basho => {
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
                <div class="basho-card" onclick="window.location.href='/banzuke.html?id=${basho.basho_id}'">
                    <h3>${bashoName}</h3>
                    <p><strong>Location:</strong> ${basho.location || 'N/A'}</p>
                    <p><strong>Dates:</strong> ${basho.start_date ? new Date(basho.start_date).toLocaleDateString() : 'N/A'} - ${basho.end_date ? new Date(basho.end_date).toLocaleDateString() : 'N/A'}</p>
                </div>
            `;
        }).join('');

        document.getElementById('banzuke-list').innerHTML = html;
    } catch (error) {
        console.error('Failed to load banzuke list:', error);
        document.getElementById('banzuke-list').innerHTML = '<div class="empty-state">Failed to load banzuke data</div>';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadBanzukeList);
