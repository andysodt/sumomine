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

// Get basho ID from URL parameter
function getBashoIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load banzuke details
async function loadBanzukeDetails(filterDivision = null) {
    let bashoId = getBashoIdFromUrl();

    // If no basho ID, get the latest one
    if (!bashoId) {
        const bashoList = await apiCall('/api/basho');
        if (bashoList && bashoList.length > 0) {
            bashoId = bashoList[0].basho_id;
            // Update URL without reload
            window.history.replaceState({}, '', `/banzuke.html?id=${bashoId}`);
        } else {
            document.getElementById('banzuke-details-content').innerHTML = '<div class="error-message">No basho data available</div>';
            return;
        }
    }

    try {
        // Fetch basho, banzuke, and bouts data
        const basho = await apiCall(`/api/basho/${bashoId}`);
        const banzuke = await apiCall(`/api/banzuke/${bashoId}`);
        const bouts = await apiCall(`/api/basho/${bashoId}/bouts`);

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

        const startDate = basho.start_date ? new Date(basho.start_date).toLocaleDateString() : 'N/A';
        const endDate = basho.end_date ? new Date(basho.end_date).toLocaleDateString() : 'N/A';
        const location = basho.location || 'Unknown';

        // Calculate wins/losses for each rikishi from bouts
        const rikishiResults = {};
        bouts.forEach(bout => {
            const eastName = bout.east_shikona;
            const westName = bout.west_shikona;
            const winner = bout.winner_en;

            if (!rikishiResults[eastName]) {
                rikishiResults[eastName] = { wins: 0, losses: 0 };
            }
            if (!rikishiResults[westName]) {
                rikishiResults[westName] = { wins: 0, losses: 0 };
            }

            if (winner === eastName) {
                rikishiResults[eastName].wins++;
                rikishiResults[westName].losses++;
            } else if (winner === westName) {
                rikishiResults[westName].wins++;
                rikishiResults[eastName].losses++;
            }
        });

        // Group banzuke by division
        const banzukeByDivision = {};
        banzuke.forEach(entry => {
            if (!banzukeByDivision[entry.division]) {
                banzukeByDivision[entry.division] = [];
            }
            banzukeByDivision[entry.division].push(entry);
        });

        // Get all basho for dropdown
        const bashoList = await apiCall('/api/basho');

        let banzukeHtml = '';
        const divisionOrder = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi'];

        // Default to Makuuchi if no filter
        const activeDivision = filterDivision || 'Makuuchi';

        for (const division of divisionOrder) {
            if (!banzukeByDivision[division]) continue;

            // Skip divisions that don't match filter
            if (filterDivision && division !== filterDivision) continue;

            const entries = banzukeByDivision[division];
            // Sort by rank_value (lower is better)
            entries.sort((a, b) => a.rank_value - b.rank_value);

            // Group by rank number (e.g., "Yokozuna 1", "Ozeki 1", "Maegashira 1")
            const rankGroups = {};
            entries.forEach(entry => {
                // Extract rank name and number from full rank
                const rankMatch = entry.rank.match(/^(.+?)\s+(\d+)\s+(East|West)$/);
                if (rankMatch) {
                    const rankName = rankMatch[1];
                    const rankNum = rankMatch[2];
                    const side = rankMatch[3];
                    const key = `${rankName}-${rankNum}`;

                    if (!rankGroups[key]) {
                        rankGroups[key] = { rankName, rankNum, east: null, west: null, rankValue: entry.rank_value };
                    }
                    rankGroups[key][side.toLowerCase()] = entry;
                } else {
                    // Handle ranks without numbers (rare case)
                    const key = entry.rank;
                    if (!rankGroups[key]) {
                        rankGroups[key] = { rankName: entry.rank, rankNum: '', east: null, west: null, rankValue: entry.rank_value };
                    }
                    // Try to detect if it's east or west from the rank string
                    if (entry.rank.includes('East')) {
                        rankGroups[key].east = entry;
                    } else if (entry.rank.includes('West')) {
                        rankGroups[key].west = entry;
                    }
                }
            });

            // Sort rank groups by rank_value
            const sortedGroups = Object.values(rankGroups).sort((a, b) => a.rankValue - b.rankValue);

            const entriesHtml = sortedGroups.map(group => {
                const eastRikishi = group.east;
                const westRikishi = group.west;

                // Don't display rank number for top ranks
                const hideNumber = ['Yokozuna', 'Ozeki', 'Sekiwake', 'Komusubi'].includes(group.rankName);

                // Get results for this basho
                const eastResults = eastRikishi ? rikishiResults[eastRikishi.shikona_en] : null;
                const westResults = westRikishi ? rikishiResults[westRikishi.shikona_en] : null;

                return `
                    <div class="banzuke-row">
                        <div class="banzuke-result">${eastResults ? `${eastResults.wins}-${eastResults.losses}` : ''}</div>
                        <div class="banzuke-side banzuke-east ${eastRikishi ? 'clickable' : 'empty'}" ${eastRikishi ? `onclick="window.location.href='/rikishi.html?id=${eastRikishi.rikishi_id}'"` : ''}>
                            ${eastRikishi ? `
                                <div class="banzuke-rikishi-name">${eastRikishi.shikona_en}</div>
                                <div class="banzuke-rikishi-jp">${eastRikishi.shikona_jp || ''}</div>
                                <div class="banzuke-rikishi-heya">${eastRikishi.heya || ''}</div>
                            ` : '<div class="banzuke-empty">—</div>'}
                        </div>
                        <div class="banzuke-rank-center">
                            <div class="rank-name">${group.rankName}</div>
                            ${group.rankNum && !hideNumber ? `<div class="rank-number">${group.rankNum}</div>` : ''}
                        </div>
                        <div class="banzuke-side banzuke-west ${westRikishi ? 'clickable' : 'empty'}" ${westRikishi ? `onclick="window.location.href='/rikishi.html?id=${westRikishi.rikishi_id}'"` : ''}>
                            ${westRikishi ? `
                                <div class="banzuke-rikishi-name">${westRikishi.shikona_en}</div>
                                <div class="banzuke-rikishi-jp">${westRikishi.shikona_jp || ''}</div>
                                <div class="banzuke-rikishi-heya">${westRikishi.heya || ''}</div>
                            ` : '<div class="banzuke-empty">—</div>'}
                        </div>
                        <div class="banzuke-result">${westResults ? `${westResults.wins}-${westResults.losses}` : ''}</div>
                    </div>
                `;
            }).join('');

            banzukeHtml += `
                <div class="division-section">
                    <h3>${division}</h3>
                    <div class="banzuke-traditional">
                        ${entriesHtml}
                    </div>
                </div>
            `;
        }

        if (!banzukeHtml) {
            banzukeHtml = '<div class="no-banzuke">No banzuke data available</div>';
        }

        // Build basho dropdown options
        const bashoOptions = bashoList.map(b => {
            const y = b.basho_id.substring(0, 4);
            const m = b.basho_id.substring(4, 6);
            const monthNames = {
                '01': 'January (Hatsu)',
                '03': 'March (Haru)',
                '05': 'May (Natsu)',
                '07': 'July (Nagoya)',
                '09': 'September (Aki)',
                '11': 'November (Kyushu)'
            };
            const title = `${monthNames[m] || m} ${y}`;
            return `<option value="${b.basho_id}" ${b.basho_id === bashoId ? 'selected' : ''}>${title}</option>`;
        }).join('');

        document.getElementById('banzuke-details-content').innerHTML = `
            <div class="banzuke-filters">
                <select id="basho-select" onchange="window.location.href='/banzuke.html?id=' + this.value">
                    ${bashoOptions}
                </select>
                <select id="division-select" onchange="filterDivision(this.value)">
                    <option value="">All Divisions</option>
                    <option value="Makuuchi" ${activeDivision === 'Makuuchi' ? 'selected' : ''}>Makuuchi</option>
                    <option value="Juryo" ${activeDivision === 'Juryo' ? 'selected' : ''}>Juryo</option>
                    <option value="Makushita" ${activeDivision === 'Makushita' ? 'selected' : ''}>Makushita</option>
                    <option value="Sandanme" ${activeDivision === 'Sandanme' ? 'selected' : ''}>Sandanme</option>
                    <option value="Jonidan" ${activeDivision === 'Jonidan' ? 'selected' : ''}>Jonidan</option>
                    <option value="Jonokuchi" ${activeDivision === 'Jonokuchi' ? 'selected' : ''}>Jonokuchi</option>
                </select>
            </div>

            <div class="basho-header">
                <div class="basho-name-section">
                    <h2>${bashoName} Banzuke</h2>
                    <div class="basho-info-grid">
                        <div class="info-item">
                            <span class="info-label">Location</span>
                            <span class="info-value">${location}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Start Date</span>
                            <span class="info-value">${startDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">End Date</span>
                            <span class="info-value">${endDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${banzukeHtml}
        `;
    } catch (error) {
        console.error('Failed to load banzuke details:', error);
        document.getElementById('banzuke-details-content').innerHTML = `
            <div class="error-message">
                <h3>Error Loading Banzuke Details</h3>
                <p>Unable to load banzuke information. Please try again.</p>
                <button onclick="window.location.href='/banzuke-list.html'" class="back-button">← Back to List</button>
            </div>
        `;
    }
}

// Filter by division
function filterDivision(division) {
    loadBanzukeDetails(division || null);
}

// Initialize on page load - default to Makuuchi
document.addEventListener('DOMContentLoaded', () => loadBanzukeDetails('Makuuchi'));
