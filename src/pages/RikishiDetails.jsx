import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function RikishiDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rikishi, setRikishi] = useState(null);
  const [bouts, setBouts] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [shikona, setShikona] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRikishiDetails();
  }, [id]);

  const loadRikishiDetails = async () => {
    if (!id) {
      navigate('/rikishi');
      return;
    }

    try {
      const [rikishiData, boutsData, ranksData, shikonaData] = await Promise.all([
        apiCall(`/api/rikishis/${id}`),
        apiCall(`/api/rikishis/${id}/bouts`),
        apiCall(`/api/rikishis/${id}/ranks`),
        apiCall(`/api/rikishis/${id}/shikona`)
      ]);

      setRikishi(rikishiData);
      setBouts(boutsData);
      setRanks(ranksData);
      setShikona(shikonaData);
    } catch (err) {
      setError('Failed to load rikishi details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${rikishi.shikona_en || 'this rikishi'}?`)) {
      return;
    }

    try {
      await apiCall(`/api/rikishis/${id}`, {
        method: 'DELETE'
      });
      navigate('/rikishi');
    } catch (err) {
      alert('Failed to delete rikishi');
      console.error(err);
    }
  };

  const formatBashoTitle = (bashoId) => {
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
    return `${monthNames[month] || month} ${year}`;
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) {
    return (
      <div className="error-message">
        <h3>Error Loading Rikishi Details</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/rikishi')} className="back-button">← Back to List</button>
      </div>
    );
  }
  if (!rikishi) return null;

  const name = rikishi.shikona_en || rikishi.name || 'Unknown';
  const totalMatches = rikishi.wins + rikishi.losses;
  const winRate = totalMatches > 0 ? ((rikishi.wins / totalMatches) * 100).toFixed(1) : 0;
  const imageUrl = rikishi.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=1e3a8a&color=fff&bold=true`;

  return (
    <div id="rikishi-details-content">
      <div className="rikishi-header">
        <div className="rikishi-image-section">
          <img
            src={imageUrl}
            alt={name}
            className="rikishi-headshot"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=1e3a8a&color=fff&bold=true`;
            }}
          />
        </div>
        <div className="rikishi-name-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{name}</h2>
            <button onClick={handleDelete} className="delete-button" style={{ marginLeft: 'auto' }}>Delete</button>
          </div>
          {rikishi.shikona_jp && <div className="japanese-name">{rikishi.shikona_jp}</div>}
          <div className="rikishi-info-grid">
            <div className="info-item">
              <span className="info-label">Current Rank</span>
              <span className="info-value">{rikishi.current_rank || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Heya (Stable)</span>
              <span className="info-value">{rikishi.heya || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Birth Date</span>
              <span className="info-value">
                {rikishi.birth_date ? new Date(rikishi.birth_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Height</span>
              <span className="info-value">{rikishi.height ? `${rikishi.height} cm` : 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Weight</span>
              <span className="info-value">{rikishi.weight ? `${rikishi.weight} kg` : 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Origin</span>
              <span className="info-value">{rikishi.shusshin || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Debut</span>
              <span className="info-value">{rikishi.debut || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="rikishi-stats">
          <div className="stat">
            <div className="stat-label">Record</div>
            <div className="stat-value">{rikishi.wins}-{rikishi.losses}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">{winRate}%</div>
          </div>
        </div>
      </div>

      {shikona && shikona.length > 0 && (
        <div className="shikona-history">
          <h3>Shikona (Ring Name) History</h3>
          <div className="shikona-list">
            {shikona.map((shikonaEntry, index) => (
              <div key={index} className="shikona-item">
                <div className="shikona-name">
                  <strong>{shikonaEntry.shikona_en}</strong>
                  {shikonaEntry.shikona_jp && <span className="shikona-jp"> ({shikonaEntry.shikona_jp})</span>}
                  {shikonaEntry.current && <span className="current-badge">Current</span>}
                </div>
                <div className="shikona-dates">
                  {shikonaEntry.date_start || 'Unknown'} - {shikonaEntry.date_end || 'Present'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rank-history">
        <h3>Rank History (Last 20 Basho)</h3>
        <div className="rank-list">
          {ranks && ranks.length > 0 ? (
            ranks.slice(0, 20).map((rankEntry, index) => (
              <div key={index} className="rank-item">
                <div className="rank-basho">{formatBashoTitle(String(rankEntry.basho_id))}</div>
                <div className="rank-value">{rankEntry.rank}</div>
              </div>
            ))
          ) : (
            <div className="no-ranks">No rank history available</div>
          )}
        </div>
      </div>

      <div className="bout-list">
        <h3>Recent Bouts (Last 50)</h3>
        {bouts && bouts.length > 0 ? (
          bouts.slice(0, 50).map((bout, index) => {
            const isEast = bout.east_shikona === rikishi.shikona_en;
            const eastIsWinner = bout.winner_en === bout.east_shikona;
            const westIsWinner = bout.winner_en === bout.west_shikona;
            const eastStatus = !bout.winner_en ? 'not-played' : (eastIsWinner ? 'win' : 'loss');
            const westStatus = !bout.winner_en ? 'not-played' : (westIsWinner ? 'win' : 'loss');

            return (
              <div key={index} className="bout-item">
                <div className="bout-header">
                  <span className="bout-basho">{formatBashoTitle(bout.basho_id)}</span>
                  <span className="bout-day">Day {bout.day}</span>
                </div>
                <div className="bout-matchup">
                  <div className={`bout-side bout-side-east ${eastIsWinner ? 'winner' : ''}`}>
                    <span className="bout-fighter-name">
                      {bout.east_shikona}
                      <span className={`bout-status-dot ${eastStatus}`}></span>
                    </span>
                    <br />
                    <small>{bout.east_rank}</small>
                  </div>
                  <div className="bout-vs">VS</div>
                  <div className={`bout-side bout-side-west ${westIsWinner ? 'winner' : ''}`}>
                    <span className="bout-fighter-name">
                      <span className={`bout-status-dot ${westStatus}`}></span>
                      {bout.west_shikona}
                    </span>
                    <br />
                    <small>{bout.west_rank}</small>
                  </div>
                </div>
                <div className="bout-kimarite">
                  {bout.kimarite || 'N/A'}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-bouts">No bout data available</div>
        )}
      </div>
    </div>
  );
}

export default RikishiDetails;
