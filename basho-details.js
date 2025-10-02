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

// Global state
let allBashos = [];
let allBouts = [];
let allHistoricalBouts = [];
let currentBashoId = null;
let currentDivision = 'Makuuchi';
let isInitialized = false;

// Calculate awards from bout data
function calculateAwards(bouts) {
    // Calculate final records for all rikishi
    const records = {};
    const kinboshi = [];

    bouts.forEach(bout => {
        if (!bout.winner_en) return;

        // Track records
        [bout.east_shikona, bout.west_shikona].forEach(name => {
            if (!records[name]) {
                records[name] = {
                    wins: 0,
                    losses: 0,
                    rank: bout.east_shikona === name ? bout.east_rank : bout.west_rank
                };
            }
        });

        if (bout.winner_en === bout.east_shikona) {
            records[bout.east_shikona].wins++;
            records[bout.west_shikona].losses++;
        } else if (bout.winner_en === bout.west_shikona) {
            records[bout.west_shikona].wins++;
            records[bout.east_shikona].losses++;
        }

        // Track kinboshi (maegashira beating yokozuna)
        if (bout.east_rank && bout.east_rank.includes('Yokozuna') && bout.winner_en === bout.west_shikona && bout.west_rank && bout.west_rank.includes('Maegashira')) {
            kinboshi.push({ rikishi: bout.west_shikona, defeated: bout.east_shikona, day: bout.day });
        }
        if (bout.west_rank && bout.west_rank.includes('Yokozuna') && bout.winner_en === bout.east_shikona && bout.east_rank && bout.east_rank.includes('Maegashira')) {
            kinboshi.push({ rikishi: bout.east_shikona, defeated: bout.west_shikona, day: bout.day });
        }
    });

    // Get top performers by win count (for Makuuchi only)
    const makuuchiRikishi = Object.entries(records)
        .filter(([name, data]) => {
            const rank = data.rank || '';
            return rank.includes('Yokozuna') || rank.includes('Ozeki') ||
                   rank.includes('Sekiwake') || rank.includes('Komusubi') ||
                   rank.includes('Maegashira');
        })
        .sort((a, b) => b[1].wins - a[1].wins)
        .slice(0, 5);

    let html = '';

    if (kinboshi.length > 0 || makuuchiRikishi.length > 0) {
        html = `
            <div class="awards-section">
                <h3>Awards & Achievements</h3>
                <div class="awards-grid">
        `;

        if (makuuchiRikishi.length > 0) {
            html += `
                <div class="award-card">
                    <h4>Top Performers</h4>
                    <div class="award-list">
                        ${makuuchiRikishi.map(([name, data]) => `
                            <div class="award-item">
                                <span class="award-rikishi">${name}</span>
                                <span class="award-record">${data.wins}-${data.losses}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (kinboshi.length > 0) {
            html += `
                <div class="award-card">
                    <h4>Kinboshi (金星)</h4>
                    <div class="award-list">
                        ${kinboshi.map(k => `
                            <div class="award-item">
                                <span class="award-rikishi">${k.rikishi}</span>
                                <span class="award-detail">defeated ${k.defeated} (Day ${k.day})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    return { html };
}

// Load basho details
async function loadBashoDetails() {
    // First time initialization
    if (!isInitialized) {
        try {
            allBashos = await apiCall('/api/basho');
            allBashos.sort((a, b) => b.basho_id.localeCompare(a.basho_id));
            currentBashoId = getBashoIdFromUrl() || allBashos[0].basho_id;
            isInitialized = true;
        } catch (error) {
            console.error('Failed to load basho list:', error);
            return;
        }
    }

    if (!currentBashoId) {
        return;
    }

    try {
        // Fetch basho data and all bouts for this basho
        const basho = await apiCall(`/api/basho/${currentBashoId}`);
        allBouts = await apiCall(`/api/basho/${currentBashoId}/bouts`);

        // Fetch all historical bouts for head-to-head calculations
        if (allHistoricalBouts.length === 0) {
            try {
                allHistoricalBouts = await apiCall('/api/bouts/all');
            } catch (e) {
                console.log('Could not fetch all historical bouts, using current basho only');
                allHistoricalBouts = allBouts;
            }
        }

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
        const yushoWinner = basho.yusho_winner_name || 'TBD';

        // Build basho options
        const bashoOptions = allBashos.map(b => {
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
            const name = `${monthNames[m] || m} ${y}`;
            return `<option value="${b.basho_id}" ${b.basho_id === currentBashoId ? 'selected' : ''}>${name}</option>`;
        }).join('');

        // Calculate awards
        const awards = calculateAwards(allBouts);

        document.getElementById('basho-details-content').innerHTML = `
            <div class="banzuke-filters">
                <select id="basho-select">${bashoOptions}</select>
                <select id="division-select">
                    <option value="All">All Divisions</option>
                    <option value="Makuuchi" ${currentDivision === 'Makuuchi' ? 'selected' : ''}>Makuuchi</option>
                    <option value="Juryo" ${currentDivision === 'Juryo' ? 'selected' : ''}>Juryo</option>
                    <option value="Makushita" ${currentDivision === 'Makushita' ? 'selected' : ''}>Makushita</option>
                    <option value="Sandanme" ${currentDivision === 'Sandanme' ? 'selected' : ''}>Sandanme</option>
                    <option value="Jonidan" ${currentDivision === 'Jonidan' ? 'selected' : ''}>Jonidan</option>
                    <option value="Jonokuchi" ${currentDivision === 'Jonokuchi' ? 'selected' : ''}>Jonokuchi</option>
                </select>
            </div>

            <div class="basho-header">
                <div class="basho-name-section">
                    <h2>${bashoName}</h2>
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
                        <div class="info-item">
                            <span class="info-label">Yusho Winner</span>
                            <span class="info-value">${yushoWinner}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${awards.html}

            <div id="bout-list-container"></div>
        `;

        // Add event listeners
        document.getElementById('basho-select').addEventListener('change', (e) => {
            currentBashoId = e.target.value;
            loadBashoDetails();
        });

        document.getElementById('division-select').addEventListener('change', (e) => {
            currentDivision = e.target.value;
            filterBouts();
        });

        filterBouts();
    } catch (error) {
        console.error('Failed to load basho details:', error);
        document.getElementById('basho-details-content').innerHTML = `
            <div class="error-message">
                <h3>Error Loading Basho Details</h3>
                <p>Unable to load basho information. Please try again.</p>
                <button onclick="window.location.href='/basho-list.html'" class="back-button">← Back to List</button>
            </div>
        `;
    }
}

// Filter bouts by division
function filterBouts() {
    const bouts = currentDivision === 'All'
        ? allBouts
        : allBouts.filter(bout => {
            // Extract division from rank (e.g., "Yokozuna 1 East" -> "Makuuchi")
            const rankDivisions = {
                'Yokozuna': 'Makuuchi',
                'Ozeki': 'Makuuchi',
                'Sekiwake': 'Makuuchi',
                'Komusubi': 'Makuuchi',
                'Maegashira': 'Makuuchi'
            };

            // Check east rank
            let eastDivision = null;
            for (const [rank, division] of Object.entries(rankDivisions)) {
                if (bout.east_rank && bout.east_rank.startsWith(rank)) {
                    eastDivision = division;
                    break;
                }
            }
            if (!eastDivision && bout.east_rank) {
                // Extract division name from rank if not in map
                const match = bout.east_rank.match(/^([A-Za-z]+)/);
                if (match) eastDivision = match[1];
            }

            return eastDivision === currentDivision;
        });

    // Group bouts by day
    const boutsByDay = {};
    bouts.forEach(bout => {
        if (!boutsByDay[bout.day]) {
            boutsByDay[bout.day] = [];
        }
        boutsByDay[bout.day].push(bout);
    });

    // Calculate head-to-head records from all bouts
    const h2hCache = {};

    let boutsHtml = '';
    const allDays = Object.keys(boutsByDay).sort((a, b) => parseInt(b) - parseInt(a));

    if (allDays.length > 0) {
        boutsHtml = allDays.map(day => {
            // Calculate cumulative win-loss record for each rikishi up to this day
            const recordsUpToDay = {};
            bouts.forEach(bout => {
                if (bout.day <= day && bout.winner_en) {
                    const eastName = bout.east_shikona;
                    const westName = bout.west_shikona;

                    if (!recordsUpToDay[eastName]) {
                        recordsUpToDay[eastName] = { wins: 0, losses: 0 };
                    }
                    if (!recordsUpToDay[westName]) {
                        recordsUpToDay[westName] = { wins: 0, losses: 0 };
                    }

                    if (bout.winner_en === eastName) {
                        recordsUpToDay[eastName].wins++;
                        recordsUpToDay[westName].losses++;
                    } else if (bout.winner_en === westName) {
                        recordsUpToDay[westName].wins++;
                        recordsUpToDay[eastName].losses++;
                    }
                }
            });

            // Sort bouts within each day by match_no descending
            const sortedBouts = boutsByDay[day].sort((a, b) => b.match_no - a.match_no);
            const dayBouts = sortedBouts.map(bout => {
                const eastIsWinner = bout.winner_en === bout.east_shikona;
                const westIsWinner = bout.winner_en === bout.west_shikona;
                const eastStatus = !bout.winner_en ? 'not-played' : (eastIsWinner ? 'win' : 'loss');
                const westStatus = !bout.winner_en ? 'not-played' : (westIsWinner ? 'win' : 'loss');

                const eastRecord = recordsUpToDay[bout.east_shikona];
                const westRecord = recordsUpToDay[bout.west_shikona];

                // Calculate head-to-head record from all historical bouts
                const cacheKey = `${bout.east_shikona}|${bout.west_shikona}`;
                if (!h2hCache[cacheKey]) {
                    let eastWins = 0;
                    let westWins = 0;
                    allHistoricalBouts.forEach(b => {
                        if ((b.east_shikona === bout.east_shikona && b.west_shikona === bout.west_shikona) ||
                            (b.east_shikona === bout.west_shikona && b.west_shikona === bout.east_shikona)) {
                            if (b.winner_en === bout.east_shikona) eastWins++;
                            else if (b.winner_en === bout.west_shikona) westWins++;
                        }
                    });
                    h2hCache[cacheKey] = { eastWins, westWins };
                }

                const h2h = h2hCache[cacheKey];
                const h2hDisplay = (h2h.eastWins + h2h.westWins > 0)
                    ? `${h2h.eastWins}-${h2h.westWins}`
                    : 'VS';

                return `
                    <div class="bout-item">
                        <div class="bout-matchup">
                            <div class="bout-side bout-side-east ${eastIsWinner ? 'winner' : ''}">
                                <span class="bout-fighter-name">
                                    ${bout.east_shikona}
                                    <span class="bout-status-dot ${eastStatus}"></span>
                                </span>
                                <br>
                                <small>${bout.east_rank}</small>
                                ${eastRecord ? `<br><small class="bout-record">${eastRecord.wins}-${eastRecord.losses}</small>` : ''}
                            </div>
                            <div class="bout-vs">${h2hDisplay}</div>
                            <div class="bout-side bout-side-west ${westIsWinner ? 'winner' : ''}">
                                <span class="bout-fighter-name">
                                    <span class="bout-status-dot ${westStatus}"></span>
                                    ${bout.west_shikona}
                                </span>
                                <br>
                                <small>${bout.west_rank}</small>
                                ${westRecord ? `<br><small class="bout-record">${westRecord.wins}-${westRecord.losses}</small>` : ''}
                            </div>
                        </div>
                        ${bout.kimarite ? `<div class="bout-kimarite">${bout.kimarite}</div>` : ''}
                    </div>
                `;
            }).join('');

            return `
                <div class="day-section">
                    <h3>Day ${day}</h3>
                    ${dayBouts}
                </div>
            `;
        }).join('');
    } else {
        boutsHtml = '<div class="no-bouts">No bout data available for this division</div>';
    }

    document.getElementById('bout-list-container').innerHTML = `
        <div class="bout-list">
            <h3>${currentDivision === 'All' ? 'All' : currentDivision} Bouts (${bouts.length} total)</h3>
            ${boutsHtml}
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadBashoDetails);
