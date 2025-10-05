import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function BashoList() {
  const navigate = useNavigate();
  const [bashoList, setBashoList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBasho();
  }, []);

  const loadBasho = async () => {
    try {
      const data = await apiCall('/api/basho');
      setBashoList(data);
    } catch (error) {
      console.error('Failed to load basho:', error);
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

  const showBashoDetails = (bashoId) => {
    navigate(`/basho/${bashoId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <section className="basho-page">
      <h2>Basho</h2>
      <div id="basho-list">
        {bashoList.length === 0 ? (
          <div className="empty-state">No basho data available</div>
        ) : (
          bashoList.map((basho) => {
            const startDate = basho.start_date ? new Date(basho.start_date).toLocaleDateString() : 'N/A';
            const endDate = basho.end_date ? new Date(basho.end_date).toLocaleDateString() : 'N/A';
            const location = basho.location || 'Unknown';
            const yushoWinner = basho.yusho_winner_name || 'TBD';

            return (
              <div key={basho.basho_id} className="basho-card" onClick={() => showBashoDetails(basho.basho_id)}>
                <h3>{formatBashoName(basho.basho_id)}</h3>
                <p><strong>Location:</strong> {location}</p>
                <p><strong>Dates:</strong> {startDate} - {endDate}</p>
                <p><strong>Yusho Winner:</strong> {yushoWinner}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default BashoList;
