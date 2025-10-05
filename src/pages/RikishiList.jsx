import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function RikishiList() {
  const navigate = useNavigate();
  const [rikishis, setRikishis] = useState([]);
  const [heyaList, setHeyaList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [heyaFilter, setHeyaFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 50;

  useEffect(() => {
    loadHeyaList();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRikishis();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, heyaFilter, divisionFilter, rankFilter, currentPage]);

  const loadHeyaList = async () => {
    try {
      const data = await apiCall('/api/heya');
      setHeyaList(data);
    } catch (error) {
      console.error('Failed to load heya list:', error);
    }
  };

  const loadRikishis = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchInput) params.search = searchInput;
      if (heyaFilter) params.heya = heyaFilter;
      if (divisionFilter) params.division = divisionFilter;
      if (rankFilter) params.rank = rankFilter;
      params.limit = pageSize;
      params.offset = (currentPage - 1) * pageSize;

      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/rikishis?${queryString}`);
      setRikishis(response.data);
      setTotalResults(response.total);
    } catch (error) {
      console.error('Failed to load rikishis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setHeyaFilter('');
    setDivisionFilter('');
    setRankFilter('');
    setCurrentPage(1);
  };

  const showRikishiDetails = (id) => {
    navigate(`/rikishi/${id}`);
  };

  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <section className="rikishi-page">
      <h2>Rikishi</h2>
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select value={heyaFilter} onChange={(e) => {
          setHeyaFilter(e.target.value);
          setCurrentPage(1);
        }}>
          <option value="">All Heya</option>
          {heyaList.map((heya, index) => (
            <option key={index} value={heya.heya}>{heya.heya}</option>
          ))}
        </select>
        <select value={divisionFilter} onChange={(e) => {
          setDivisionFilter(e.target.value);
          setCurrentPage(1);
        }}>
          <option value="">All Divisions</option>
          <option value="Makuuchi">Makuuchi</option>
          <option value="Juryo">Juryo</option>
          <option value="Makushita">Makushita</option>
          <option value="Sandanme">Sandanme</option>
          <option value="Jonidan">Jonidan</option>
          <option value="Jonokuchi">Jonokuchi</option>
        </select>
        <select value={rankFilter} onChange={(e) => {
          setRankFilter(e.target.value);
          setCurrentPage(1);
        }}>
          <option value="">All Ranks</option>
          <option value="Yokozuna">Yokozuna</option>
          <option value="Ozeki">Ozeki</option>
          <option value="Sekiwake">Sekiwake</option>
          <option value="Komusubi">Komusubi</option>
          <option value="Maegashira">Maegashira</option>
        </select>
        <button onClick={handleClear}>Clear</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : rikishis.length === 0 ? (
        <div className="empty-state">No rikishis found. Try adjusting your search or import data from sumo-api.com</div>
      ) : (
        <>
          <div id="rikishis-list">
            {rikishis.map((rikishi) => {
              const totalMatches = rikishi.wins + rikishi.losses;
              const winRate = totalMatches > 0 ? ((rikishi.wins / totalMatches) * 100).toFixed(1) : 0;
              const name = rikishi.shikona_en || rikishi.name || 'Unknown';
              const rank = rikishi.current_rank || rikishi.rank || 'N/A';
              const birthDate = rikishi.birth_date ? new Date(rikishi.birth_date).toLocaleDateString() : 'N/A';
              const imageUrl = rikishi.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=1e3a8a&color=fff&bold=true`;

              return (
                <div key={rikishi.id} className="rikishi-card" onClick={() => showRikishiDetails(rikishi.id)}>
                  <div className="rikishi-card-header">
                    <img
                      src={imageUrl}
                      alt={name}
                      className="rikishi-avatar"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=1e3a8a&color=fff&bold=true`;
                      }}
                    />
                    <div className="rikishi-card-info">
                      <h3>{name}{rikishi.shikona_jp ? ` (${rikishi.shikona_jp})` : ''}</h3>
                      <p><strong>Rank:</strong> {rank}</p>
                      {rikishi.heya && <p><strong>Heya:</strong> {rikishi.heya}</p>}
                    </div>
                  </div>
                  {(rikishi.height || rikishi.weight) && (
                    <p><strong>Height:</strong> {rikishi.height || 'N/A'} cm | <strong>Weight:</strong> {rikishi.weight || 'N/A'} kg</p>
                  )}
                  <p><strong>Birth Date:</strong> {birthDate}</p>
                  {rikishi.shusshin && <p><strong>Origin:</strong> {rikishi.shusshin}</p>}
                  <div className="rikishi-stats">
                    <div className="stat">
                      <div className="stat-label">Wins</div>
                      <div className="stat-value">{rikishi.wins}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Losses</div>
                      <div className="stat-value">{rikishi.losses}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Total Matches</div>
                      <div className="stat-value">{totalMatches}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Win Rate</div>
                      <div className="stat-value">{winRate}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalResults)} of {totalResults} rikishis
              </div>
              <div className="pagination-buttons">
                {currentPage > 1 && (
                  <button onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      className={page === currentPage ? 'active' : ''}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                {currentPage < totalPages && (
                  <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default RikishiList;
