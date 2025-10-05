import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function BashoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bashoList, setBashoList] = useState([]);
  const [selectedBashoId, setSelectedBashoId] = useState(id || '');
  const [bashoInfo, setBashoInfo] = useState(null);
  const [bouts, setBouts] = useState([]);
  const [allBouts, setAllBouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBashoList();
  }, []);

  useEffect(() => {
    if (selectedBashoId) {
      loadBashoDetails(selectedBashoId);
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

  const loadBashoDetails = async (bashoId) => {
    try {
      setLoading(true);
      const boutsData = await apiCall(`/api/basho/${bashoId}/bouts`);

      const basho = bashoList.find(b => b.basho_id === bashoId);
      setBashoInfo(basho);
      setBouts(boutsData || []);

      // Load all bouts for head-to-head calculation
      await loadAllBouts(bashoId);
    } catch (error) {
      console.error('Failed to load basho details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllBouts = async (currentBashoId) => {
    try {
      // Get all bashos up to the current one
      const previousBashos = bashoList.filter(b => b.basho_id <= currentBashoId);

      // Fetch bouts from all previous bashos
      const allBoutsPromises = previousBashos.map(b =>
        apiCall(`/api/basho/${b.basho_id}/bouts`).catch(() => [])
      );

      const allBoutsArrays = await Promise.all(allBoutsPromises);
      const combined = allBoutsArrays.flat();
      setAllBouts(combined);
    } catch (error) {
      console.error('Failed to load all bouts:', error);
      setAllBouts([]);
    }
  };

  const handleBashoChange = (e) => {
    const newBashoId = e.target.value;
    setSelectedBashoId(newBashoId);
    navigate(`/basho/${newBashoId}`);
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

  const groupBoutsByDay = () => {
    const grouped = {};
    bouts.forEach(bout => {
      if (!grouped[bout.day]) {
        grouped[bout.day] = [];
      }
      grouped[bout.day].push(bout);
    });

    // Sort bouts within each day in descending order (by ID, which typically means higher ranks first)
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => b.id - a.id);
    });

    return grouped;
  };

  const getHeadToHead = (eastShikona, westShikona) => {
    // Calculate head-to-head record from ALL historical bouts
    let eastWins = 0;
    let westWins = 0;

    allBouts.forEach(bout => {
      if ((bout.east_shikona === eastShikona && bout.west_shikona === westShikona) ||
          (bout.east_shikona === westShikona && bout.west_shikona === eastShikona)) {
        if (bout.winner_en === eastShikona) {
          eastWins++;
        } else if (bout.winner_en === westShikona) {
          westWins++;
        }
      }
    });

    return `${eastWins}-${westWins}`;
  };

  const getCurrentBashoRecord = (rikishiName, currentDay) => {
    // Calculate win-loss record in current basho up to (but not including) current day
    let wins = 0;
    let losses = 0;

    bouts.forEach(bout => {
      // Only count bouts before the current day
      if (bout.day < currentDay && bout.winner_en) {
        if (bout.east_shikona === rikishiName || bout.west_shikona === rikishiName) {
          if (bout.winner_en === rikishiName) {
            wins++;
          } else {
            losses++;
          }
        }
      }
    });

    return `${wins}-${losses}`;
  };

  if (loading && !bashoInfo) return <div className="loading">Loading...</div>;

  const boutsByDay = bashoInfo ? groupBoutsByDay() : {};
  const days = Object.keys(boutsByDay).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="basho-details">
      <div className="basho-selector" style={{ marginBottom: '20px' }}>
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

      {bashoInfo && (
        <>
          <div className="basho-header">
            <div className="basho-name-section">
              <h2>{formatBashoTitle(bashoInfo.basho_id)}</h2>
          <div className="basho-info-grid">
            <div className="info-item">
              <span className="info-label">Location</span>
              <span className="info-value">{bashoInfo.location || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Dates</span>
              <span className="info-value">
                {bashoInfo.start_date ? new Date(bashoInfo.start_date).toLocaleDateString() : 'N/A'} -
                {bashoInfo.end_date ? new Date(bashoInfo.end_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {bashoInfo.yusho_winner_name && (
              <div className="info-item">
                <span className="info-label">Yusho Winner</span>
                <span className="info-value">{bashoInfo.yusho_winner_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bouts-by-day">
        {days.map(day => (
          <div key={day} className="day-section">
            <h3>Day {day}</h3>
            {boutsByDay[day].map((bout, index) => {
              const eastIsWinner = bout.winner_en === bout.east_shikona;
              const westIsWinner = bout.winner_en === bout.west_shikona;
              const eastStatus = !bout.winner_en ? 'not-played' : (eastIsWinner ? 'win' : 'loss');
              const westStatus = !bout.winner_en ? 'not-played' : (westIsWinner ? 'win' : 'loss');
              const headToHead = getHeadToHead(bout.east_shikona, bout.west_shikona);
              const eastRecord = getCurrentBashoRecord(bout.east_shikona, bout.day);
              const westRecord = getCurrentBashoRecord(bout.west_shikona, bout.day);

              return (
                <div key={index} className="bout-item">
                  <div className="bout-matchup">
                    <div className={`bout-side bout-side-east ${eastIsWinner ? 'winner' : ''}`}>
                      <span className="bout-fighter-name">
                        <span className="bout-record">{eastRecord}</span>
                        {bout.east_shikona}
                        <span className={`bout-status-dot ${eastStatus}`}></span>
                      </span>
                      <br />
                      <small>{bout.east_rank}</small>
                    </div>
                    <div className="bout-vs">{headToHead}</div>
                    <div className={`bout-side bout-side-west ${westIsWinner ? 'winner' : ''}`}>
                      <span className="bout-fighter-name">
                        <span className={`bout-status-dot ${westStatus}`}></span>
                        {bout.west_shikona}
                        <span className="bout-record">{westRecord}</span>
                      </span>
                      <br />
                      <small>{bout.west_rank}</small>
                    </div>
                  </div>
                  <div className="bout-kimarite">{bout.kimarite || 'N/A'}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

export default BashoDetails;
