import React, { useState, useEffect } from 'react';

function Home() {
  const [stats, setStats] = useState({});
  const [topHeya, setTopHeya] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, topHeyaRes, recentMatchesRes, topPerformersRes] = await Promise.all([
        fetch('/api/rikishis/stats/summary').then(r => r.json()),
        fetch('/api/heya').then(r => r.json()),
        fetch('/api/matches/recent').then(r => r.json()),
        fetch('/api/rikishis/top-performers').then(r => r.json())
      ]);

      setStats(statsRes);
      setTopHeya(topHeyaRes);
      setRecentMatches(recentMatchesRes);
      setTopPerformers(topPerformersRes);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const avgHeight = stats.avg_height ? parseFloat(stats.avg_height).toFixed(1) + ' cm' : 'N/A';
  const avgWeight = stats.avg_weight ? parseFloat(stats.avg_weight).toFixed(1) + ' kg' : 'N/A';

  return (
    <>
      <section className="dashboard">
        <h2>Dashboard</h2>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h3>Total Rikishi</h3>
              <p className="card-number">{stats.total_rikishis || 0}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">🏛️</div>
            <div className="card-content">
              <h3>Heya (Stables)</h3>
              <p className="card-number">{stats.total_heya || 0}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">🥊</div>
            <div className="card-content">
              <h3>Total Matches</h3>
              <p className="card-number">{stats.total_matches || 0}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Ranks</h3>
              <p className="card-number">{stats.total_ranks || 0}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stats-card">
            <h3>Top Heya by Rikishi Count</h3>
            <div>
              {topHeya && topHeya.length > 0 ? (
                topHeya.slice(0, 5).map((heya, index) => (
                  <div key={index} className="heya-item">
                    <span className="heya-name">{heya.heya}</span>
                    <span className="heya-count">{heya.rikishi_count}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No heya data available</div>
              )}
            </div>
          </div>
          <div className="stats-card">
            <h3>Recent Matches</h3>
            <div>
              {recentMatches && recentMatches.length > 0 ? (
                recentMatches.slice(0, 5).map((match, index) => (
                  <div key={index} className="match-preview">
                    <div className="match-fighters">{match.rikishi_name} vs {match.opponent}</div>
                    <div className={`match-result ${match.result}`}>{match.result.toUpperCase()}</div>
                    <div className="match-date">{match.basho_id} - Day {match.day}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No recent matches</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stats-card">
            <h3>Top Performers</h3>
            <div>
              {topPerformers && topPerformers.length > 0 ? (
                topPerformers.slice(0, 5).map((performer, index) => {
                  const totalMatches = performer.wins + performer.losses;
                  const winRate = totalMatches > 0 ? ((performer.wins / totalMatches) * 100).toFixed(0) : 0;
                  return (
                    <div key={index} className="performer-item">
                      <span className="performer-name">{performer.shikona_en || performer.name}</span>
                      <div className="performer-stats">
                        <span>{performer.wins}W - {performer.losses}L</span>
                        <span className="win-rate">{winRate}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">No top performers available</div>
              )}
            </div>
          </div>
          <div className="stats-card">
            <h3>Average Physical Stats</h3>
            <div className="physical-stats">
              <div className="physical-stat-item">
                <span className="stat-label">Average Height</span>
                <span className="stat-value">{avgHeight}</span>
              </div>
              <div className="physical-stat-item">
                <span className="stat-label">Average Weight</span>
                <span className="stat-value">{avgWeight}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-overview">
        <h2>Database Overview</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <h3>Total Rikishi</h3>
            <p className="stat-number">{stats.total_rikishis || 0}</p>
          </div>
          <div className="stat-item">
            <h3>Total Heya (Stables)</h3>
            <p className="stat-number">{stats.total_heya || 0}</p>
          </div>
          <div className="stat-item">
            <h3>Total Ranks</h3>
            <p className="stat-number">{stats.total_ranks || 0}</p>
          </div>
          <div className="stat-item">
            <h3>Total Matches</h3>
            <p className="stat-number">{stats.total_matches || 0}</p>
          </div>
          <div className="stat-item">
            <h3>Average Height</h3>
            <p className="stat-number">{avgHeight}</p>
          </div>
          <div className="stat-item">
            <h3>Average Weight</h3>
            <p className="stat-number">{avgWeight}</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
