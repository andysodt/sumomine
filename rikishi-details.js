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

// Get rikishi ID from URL parameter
function getRikishiIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load rikishi details
async function loadRikishiDetails() {
    const rikishiId = getRikishiIdFromUrl();

    if (!rikishiId) {
        window.location.href = '/#rikishi';
        return;
    }

    try {
        // Fetch rikishi data
        const rikishi = await apiCall(`/api/rikishis/${rikishiId}`);
        const bouts = await apiCall(`/api/rikishis/${rikishiId}/bouts`);
        const ranks = await apiCall(`/api/rikishis/${rikishiId}/ranks`);

        // Render details
        const name = rikishi.shikona_en || rikishi.name || 'Unknown';
        const japName = rikishi.shikona_jp || '';
        const rank = rikishi.current_rank || 'N/A';
        const heya = rikishi.heya || 'N/A';
        const birthDate = rikishi.birth_date ? new Date(rikishi.birth_date).toLocaleDateString() : 'N/A';
        const height = rikishi.height ? `${rikishi.height} cm` : 'N/A';
        const weight = rikishi.weight ? `${rikishi.weight} kg` : 'N/A';
        const shusshin = rikishi.shusshin || 'N/A';
        const debut = rikishi.debut || 'N/A';

        const totalMatches = rikishi.wins + rikishi.losses;
        const winRate = totalMatches > 0 ? ((rikishi.wins / totalMatches) * 100).toFixed(1) : 0;

        let boutsHtml = '';
        if (bouts && bouts.length > 0) {
            boutsHtml = bouts.slice(0, 50).map(bout => {
                const isEast = bout.east_shikona === rikishi.shikona_en;
                const isWinner = bout.winner_en === rikishi.shikona_en;
                const opponent = isEast ? bout.west_shikona : bout.east_shikona;
                const opponentRank = isEast ? bout.west_rank : bout.east_rank;
                const side = isEast ? 'East' : 'West';

                // Format basho title
                const year = bout.basho_id.substring(0, 4);
                const month = bout.basho_id.substring(4, 6);
                const monthNames = {
                    '01': 'January (Hatsu)',
                    '03': 'March (Haru)',
                    '05': 'May (Natsu)',
                    '07': 'July (Nagoya)',
                    '09': 'September (Aki)',
                    '11': 'November (Kyushu)'
                };
                const bashoTitle = `${monthNames[month] || month} ${year}`;

                // Determine bout status for each fighter
                const eastIsWinner = bout.winner_en === bout.east_shikona;
                const westIsWinner = bout.winner_en === bout.west_shikona;
                const eastStatus = !bout.winner_en ? 'not-played' : (eastIsWinner ? 'win' : 'loss');
                const westStatus = !bout.winner_en ? 'not-played' : (westIsWinner ? 'win' : 'loss');

                return `
                    <div class="bout-item">
                        <div class="bout-header">
                            <span class="bout-basho">${bashoTitle}</span>
                            <span class="bout-day">Day ${bout.day}</span>
                        </div>
                        <div class="bout-matchup">
                            <div class="bout-side bout-side-east ${eastIsWinner ? 'winner' : ''}">
                                <span class="bout-fighter-name">
                                    ${bout.east_shikona}
                                    <span class="bout-status-dot ${eastStatus}"></span>
                                </span>
                                <br>
                                <small>${bout.east_rank}</small>
                            </div>
                            <div class="bout-vs">VS</div>
                            <div class="bout-side bout-side-west ${westIsWinner ? 'winner' : ''}">
                                <span class="bout-fighter-name">
                                    <span class="bout-status-dot ${westStatus}"></span>
                                    ${bout.west_shikona}
                                </span>
                                <br>
                                <small>${bout.west_rank}</small>
                            </div>
                        </div>
                        <div class="bout-kimarite">
                            ${bout.kimarite || 'N/A'}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            boutsHtml = '<div class="no-bouts">No bout data available</div>';
        }

        // Render rank history
        let ranksHtml = '';
        if (ranks && ranks.length > 0) {
            ranksHtml = ranks.slice(0, 20).map(rankEntry => {
                const bashoId = String(rankEntry.basho_id);
                const year = bashoId.substring(0, 4);
                const month = bashoId.substring(4, 6);
                const monthNames = {
                    '01': 'January (Hatsu)',
                    '03': 'March (Haru)',
                    '05': 'May (Natsu)',
                    '07': 'July (Nagoya)',
                    '09': 'September (Aki)',
                    '11': 'November (Kyushu)'
                };
                const bashoTitle = `${monthNames[month] || month} ${year}`;

                return `
                    <div class="rank-item">
                        <div class="rank-basho">${bashoTitle}</div>
                        <div class="rank-value">${rankEntry.rank}</div>
                    </div>
                `;
            }).join('');
        } else {
            ranksHtml = '<div class="no-ranks">No rank history available</div>';
        }

        const imageUrl = rikishi.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=1e3a8a&color=fff&bold=true`;

        document.getElementById('rikishi-details-content').innerHTML = `
            <div class="rikishi-header">
                <div class="rikishi-image-section">
                    <img src="${imageUrl}" alt="${name}" class="rikishi-headshot" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=1e3a8a&color=fff&bold=true'">
                </div>
                <div class="rikishi-name-section">
                    <h2>${name}</h2>
                    ${japName ? `<div class="japanese-name">${japName}</div>` : ''}
                    <div class="rikishi-info-grid">
                        <div class="info-item">
                            <span class="info-label">Current Rank</span>
                            <span class="info-value">${rank}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Heya (Stable)</span>
                            <span class="info-value">${heya}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Birth Date</span>
                            <span class="info-value">${birthDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Height</span>
                            <span class="info-value">${height}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Weight</span>
                            <span class="info-value">${weight}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Origin</span>
                            <span class="info-value">${shusshin}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Debut</span>
                            <span class="info-value">${debut}</span>
                        </div>
                    </div>
                </div>
                <div class="rikishi-stats">
                    <div class="stat">
                        <div class="stat-label">Record</div>
                        <div class="stat-value">${rikishi.wins}-${rikishi.losses}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Win Rate</div>
                        <div class="stat-value">${winRate}%</div>
                    </div>
                </div>
            </div>

            <div class="rank-history">
                <h3>Rank History (Last 20 Basho)</h3>
                <div class="rank-list">
                    ${ranksHtml}
                </div>
            </div>

            <div class="bout-list">
                <h3>Recent Bouts (Last 50)</h3>
                ${boutsHtml}
            </div>
        `;
    } catch (error) {
        console.error('Failed to load rikishi details:', error);
        document.getElementById('rikishi-details-content').innerHTML = `
            <div class="error-message">
                <h3>Error Loading Rikishi Details</h3>
                <p>Unable to load rikishi information. Please try again.</p>
                <button onclick="window.location.href='/#rikishi'" class="back-button">← Back to List</button>
            </div>
        `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadRikishiDetails);
