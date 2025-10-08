import React, { useState, useEffect, useMemo } from 'react';
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
  const [hasMore, setHasMore] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const pageSize = 50;

  useEffect(() => {
    loadHeyaList();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setRikishis([]);
      setCurrentPage(1);
      setHasMore(true);
      loadRikishis(1, true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, heyaFilter, divisionFilter, rankFilter]);

  useEffect(() => {
    const handleScroll = () => {
      // Disable infinite scroll when sorting is active
      if (loading || !hasMore || sortField) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadRikishis(currentPage + 1, false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, currentPage, sortField]);

  const loadHeyaList = async () => {
    try {
      const data = await apiCall('/api/heya');
      setHeyaList(data);
    } catch (error) {
      console.error('Failed to load heya list:', error);
    }
  };

  const loadRikishis = async (page, reset = false) => {
    setLoading(true);
    try {
      const params = {};
      if (searchInput) params.search = searchInput;
      if (heyaFilter) params.heya = heyaFilter;
      if (divisionFilter) params.division = divisionFilter;
      if (rankFilter) params.rank = rankFilter;
      params.limit = pageSize;
      params.offset = (page - 1) * pageSize;

      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/rikishis?${queryString}`);

      if (reset) {
        setRikishis(response.data);
      } else {
        setRikishis(prev => [...prev, ...response.data]);
      }

      setTotalResults(response.total);
      setCurrentPage(page);
      setHasMore(response.data.length === pageSize && (page * pageSize) < response.total);
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
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRikishis = useMemo(() => {
    if (!sortField) return rikishis;

    const sorted = [...rikishis].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle special cases
      if (sortField === 'name') {
        aVal = a.shikona_en || a.name || '';
        bVal = b.shikona_en || b.name || '';
      } else if (sortField === 'rank') {
        aVal = a.current_rank || a.rank || '';
        bVal = b.current_rank || b.rank || '';
      } else if (sortField === 'total') {
        aVal = a.wins + a.losses;
        bVal = b.wins + b.losses;
      }

      // Handle null/undefined values
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return sorted;
  }, [rikishis, sortField, sortDirection]);

  const showRikishiDetails = (id) => {
    navigate(`/rikishi/${id}`);
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await apiCall(`/api/rikishis/${id}`, { method: 'DELETE' });
        setRikishis([]);
        setCurrentPage(1);
        setHasMore(true);
        loadRikishis(1, true); // Reload the list from the beginning
      } catch (error) {
        console.error('Failed to delete rikishi:', error);
        alert('Failed to delete rikishi');
      }
    }
  };

  const handleImport = async () => {
    if (!window.confirm('This will import all rikishi data from sumo-api.com. This may take several minutes. Continue?')) {
      return;
    }

    setImporting(true);
    setImportProgress([]);

    try {
      const response = await fetch('/api/rikishis/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.done) {
                setImportProgress(prev => [...prev, 'Import completed successfully!']);
                setRikishis([]);
                setCurrentPage(1);
                setHasMore(true);
                setTimeout(() => {
                  loadRikishis(1, true);
                }, 1000);
              } else if (data.error) {
                setImportProgress(prev => [...prev, `Error: ${data.error}`]);
              } else if (data.message) {
                setImportProgress(prev => [...prev, data.message]);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportProgress(prev => [...prev, `Import failed: ${error.message}`]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="rikishi-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Rikishi</h2>
        <button
          onClick={handleImport}
          disabled={importing}
          style={{
            padding: '10px 20px',
            backgroundColor: importing ? '#ccc' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: importing ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {importing ? 'Importing...' : 'Import from sumo-api.com'}
        </button>
      </div>

      {importing && (
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <h3>Import Progress:</h3>
          {importProgress.map((msg, idx) => (
            <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '5px' }}>{msg}</div>
          ))}
        </div>
      )}

      <div className="search-filters">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select value={heyaFilter} onChange={(e) => setHeyaFilter(e.target.value)}>
          <option value="">All Heya</option>
          {heyaList.map((heya, index) => (
            <option key={index} value={heya.heya}>{heya.heya}</option>
          ))}
        </select>
        <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
          <option value="">All Divisions</option>
          <option value="Makuuchi">Makuuchi</option>
          <option value="Juryo">Juryo</option>
          <option value="Makushita">Makushita</option>
          <option value="Sandanme">Sandanme</option>
          <option value="Jonidan">Jonidan</option>
          <option value="Jonokuchi">Jonokuchi</option>
        </select>
        <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
          <option value="">All Ranks</option>
          <option value="Yokozuna">Yokozuna</option>
          <option value="Ozeki">Ozeki</option>
          <option value="Sekiwake">Sekiwake</option>
          <option value="Komusubi">Komusubi</option>
          <option value="Maegashira">Maegashira</option>
        </select>
        <button onClick={handleClear}>Clear</button>
      </div>

      {rikishis.length === 0 && !loading ? (
        <div className="empty-state">No rikishis found. Try adjusting your search or import data from sumo-api.com</div>
      ) : (
        <>
          <div className="rikishi-table-container">
            <table className="rikishi-table" key={`${sortField}-${sortDirection}`}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Rank {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('heya')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Heya {sortField === 'heya' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('shusshin')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Origin {sortField === 'shusshin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('height')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Height (cm) {sortField === 'height' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('weight')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Weight (kg) {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('wins')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Wins {sortField === 'wins' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('losses')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Losses {sortField === 'losses' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('total')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Total {sortField === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRikishis.map((rikishi) => {
                  const totalMatches = rikishi.wins + rikishi.losses;
                  const name = rikishi.shikona_en || rikishi.name || 'Unknown';
                  const rank = rikishi.current_rank || rikishi.rank || 'N/A';

                  return (
                    <tr key={rikishi.id} onClick={() => showRikishiDetails(rikishi.id)} className="rikishi-row">
                      <td className="rikishi-name">
                        {name}
                        {rikishi.shikona_jp && <div className="rikishi-name-jp">{rikishi.shikona_jp}</div>}
                      </td>
                      <td>{rank}</td>
                      <td>{rikishi.heya || '-'}</td>
                      <td>{rikishi.shusshin || '-'}</td>
                      <td>{rikishi.height || '-'}</td>
                      <td>{rikishi.weight || '-'}</td>
                      <td>{rikishi.wins}</td>
                      <td>{rikishi.losses}</td>
                      <td>{totalMatches}</td>
                      <td>
                        <button
                          className="delete-btn-table"
                          onClick={(e) => handleDelete(e, rikishi.id, name)}
                          title="Delete rikishi"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="loading" style={{ textAlign: 'center', padding: '20px' }}>
              Loading more...
            </div>
          )}

          {!loading && !hasMore && rikishis.length > 0 && !sortField && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Showing all {totalResults} rikishis
            </div>
          )}

          {sortField && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Sorting by {sortField} ({sortDirection}). Showing {sortedRikishis.length} of {totalResults} rikishis.
              <button
                onClick={() => setSortField('')}
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                Clear Sort
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default RikishiList;
