import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiCall } from '../utils/api';

function BanzukeDetails() {
  const { id } = useParams();
  const [basho, setBasho] = useState(null);
  const [banzuke, setBanzuke] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBanzukeDetails();
    }
  }, [id]);

  const loadBanzukeDetails = async () => {
    try {
      const [bashoData, banzukeData] = await Promise.all([
        apiCall(`/api/basho/${id}`),
        apiCall(`/api/banzuke/${id}`)
      ]);

      setBasho(bashoData);
      setBanzuke(banzukeData);
    } catch (error) {
      console.error('Failed to load banzuke:', error);
    } finally {
      setLoading(false);
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
  if (!basho) return <div className="error-message">Basho not found</div>;

  const banzukeByDivision = {};
  banzuke.forEach(entry => {
    if (!banzukeByDivision[entry.division]) {
      banzukeByDivision[entry.division] = [];
    }
    banzukeByDivision[entry.division].push(entry);
  });

  return (
    <div className="banzuke-details">
      <h2>{formatBashoTitle(basho.basho_id)}</h2>
      <p><strong>Location:</strong> {basho.location || 'N/A'}</p>

      {Object.entries(banzukeByDivision).map(([division, entries]) => (
        <div key={division} className="division-section">
          <h3>{division}</h3>
          {entries.map((entry, index) => (
            <div key={index} className="banzuke-entry">
              <span className="rank">{entry.rank}</span>
              <span className="rikishi-name">{entry.shikona_en || entry.shikona_jp}</span>
              <span className="side">{entry.side}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default BanzukeDetails;
