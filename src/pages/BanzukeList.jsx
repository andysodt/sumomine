import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function BanzukeList() {
  const navigate = useNavigate();
  const [bashoList, setBashoList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanzukeList();
  }, []);

  const loadBanzukeList = async () => {
    try {
      const data = await apiCall('/api/basho');
      setBashoList(data);
    } catch (error) {
      console.error('Failed to load banzuke list:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBashoName = (bashoId) => {
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

  return (
    <section className="banzuke-page">
      <h2>Banzuke</h2>
      <div id="banzuke-list">
        {bashoList.length === 0 ? (
          <div className="empty-state">No banzuke data available</div>
        ) : (
          bashoList.map((basho) => (
            <div key={basho.basho_id} className="basho-card" onClick={() => navigate(`/banzuke/${basho.basho_id}`)}>
              <h3>{formatBashoName(basho.basho_id)}</h3>
              <p><strong>Location:</strong> {basho.location || 'N/A'}</p>
              <p><strong>Dates:</strong> {basho.start_date ? new Date(basho.start_date).toLocaleDateString() : 'N/A'} - {basho.end_date ? new Date(basho.end_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default BanzukeList;
