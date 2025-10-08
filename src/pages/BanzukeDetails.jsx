import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function BanzukeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bashoList, setBashoList] = useState([]);
  const [selectedBashoId, setSelectedBashoId] = useState(id || '');
  const [basho, setBasho] = useState(null);
  const [banzuke, setBanzuke] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('Makuuchi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBashoList();
  }, []);

  useEffect(() => {
    if (selectedBashoId) {
      loadBanzukeDetails(selectedBashoId);
    }
  }, [selectedBashoId]);

  const loadBashoList = async () => {
    try {
      const bashos = await apiCall('/api/basho');
      setBashoList(bashos);

      // If no ID in URL, set the most recent basho
      if (!id && bashos.length > 0) {
        const mostRecent = bashos[0].basho_id;
        setSelectedBashoId(mostRecent);
      }
    } catch (error) {
      console.error('Failed to load basho list:', error);
    }
  };

  const loadBanzukeDetails = async (bashoId) => {
    try {
      setLoading(true);
      const [bashoData, banzukeData] = await Promise.all([
        apiCall(`/api/basho/${bashoId}`),
        apiCall(`/api/banzuke/${bashoId}`)
      ]);

      setBasho(bashoData);
      setBanzuke(banzukeData);
    } catch (error) {
      console.error('Failed to load banzuke:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBashoChange = (e) => {
    const newBashoId = e.target.value;
    setSelectedBashoId(newBashoId);
    navigate(`/banzuke/${newBashoId}`);
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

  if (loading && !basho) return <div className="loading">Loading...</div>;

  const banzukeByDivision = {};
  banzuke.forEach(entry => {
    if (!banzukeByDivision[entry.division]) {
      banzukeByDivision[entry.division] = [];
    }
    banzukeByDivision[entry.division].push(entry);
  });

  const divisions = Object.keys(banzukeByDivision);
  const divisionOrder = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi'];
  const sortedDivisions = divisions.sort((a, b) => {
    const indexA = divisionOrder.indexOf(a);
    const indexB = divisionOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="banzuke-details">
      <div className="basho-selector" style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label htmlFor="basho-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Basho:</label>
          <select
            id="basho-select"
            value={selectedBashoId}
            onChange={handleBashoChange}
            style={{ padding: '8px', fontSize: '16px', minWidth: '250px' }}
          >
            {bashoList.map(basho => (
              <option key={basho.basho_id} value={basho.basho_id}>
                {formatBashoTitle(basho.basho_id)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="division-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Division:</label>
          <select
            id="division-select"
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            style={{ padding: '8px', fontSize: '16px', minWidth: '200px' }}
          >
            {sortedDivisions.map(division => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>
      </div>

      {basho && (
        <>
          <h2>{formatBashoTitle(basho.basho_id)}</h2>
          <p><strong>Location:</strong> {basho.location || 'N/A'}</p>
        </>
      )}

      {banzukeByDivision[selectedDivision] && (
        <div className="division-section">
          <h3>{selectedDivision}</h3>
          <div className="banzuke-grid">
            <div className="banzuke-header">
              <div className="banzuke-east-header">East</div>
              <div className="banzuke-rank-header">Rank</div>
              <div className="banzuke-west-header">West</div>
            </div>
            {(() => {
              const entries = banzukeByDivision[selectedDivision];
              const groupedByRank = {};

              entries.forEach(entry => {
                // Extract side from rank (e.g., "Yokozuna 1 East" -> "East")
                const side = entry.rank.includes('East') ? 'East' : 'West';
                // Extract base rank without side (e.g., "Yokozuna 1 East" -> "Yokozuna 1")
                const baseRank = entry.rank.replace(/ (East|West)$/, '');

                if (!groupedByRank[baseRank]) {
                  groupedByRank[baseRank] = { east: null, west: null };
                }
                if (side === 'East') {
                  groupedByRank[baseRank].east = entry;
                } else {
                  groupedByRank[baseRank].west = entry;
                }
              });

              return Object.entries(groupedByRank).map(([rank, { east, west }]) => {
                // Remove numbers from Yokozuna, Ozeki, Sekiwake, and Komusubi
                const displayRank = rank.replace(/^(Yokozuna|Ozeki|Sekiwake|Komusubi)\s+\d+/, '$1');

                return (
                  <div key={rank} className="banzuke-row">
                    <div className="banzuke-east">
                      {east && (
                        <div className="banzuke-rikishi">
                          <div className="banzuke-shikona-en">{east.shikona_en || ''}</div>
                          <div className="banzuke-shikona-jp">{east.shikona_jp || ''}</div>
                          {east.birthplace && <div className="banzuke-birthplace">{east.birthplace}</div>}
                          <div className="banzuke-record">{east.wins || 0}-{east.losses || 0}</div>
                        </div>
                      )}
                    </div>
                    <div className="banzuke-rank">{displayRank}</div>
                    <div className="banzuke-west">
                      {west && (
                        <div className="banzuke-rikishi">
                          <div className="banzuke-shikona-en">{west.shikona_en || ''}</div>
                          <div className="banzuke-shikona-jp">{west.shikona_jp || ''}</div>
                          {west.birthplace && <div className="banzuke-birthplace">{west.birthplace}</div>}
                          <div className="banzuke-record">{west.wins || 0}-{west.losses || 0}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default BanzukeDetails;
