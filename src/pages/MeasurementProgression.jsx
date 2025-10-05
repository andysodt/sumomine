import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { apiCall } from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const colors = [
  '#1e3a8a', '#dc2626', '#16a34a', '#ca8a04', '#9333ea',
  '#0891b2', '#db2777', '#65a30d', '#c026d3', '#0284c7'
];

function MeasurementProgression() {
  const [rikishis, setRikishis] = useState([]);
  const [filteredRikishis, setFilteredRikishis] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRikishi, setSelectedRikishi] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRikishis();
  }, []);

  useEffect(() => {
    if (selectedRikishi.length > 0) {
      updateChart();
    } else {
      setChartData({ labels: [], datasets: [] });
    }
  }, [selectedRikishi]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRikishis(rikishis);
    } else {
      const filtered = rikishis.filter(r =>
        (r.shikona_en || r.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRikishis(filtered);
    }
  }, [searchQuery, rikishis]);

  const loadRikishis = async () => {
    try {
      const response = await apiCall('/api/rikishis?limit=1000');
      const rikishiList = (Array.isArray(response) ? response : response.data || [])
        .filter(r => r.current_rank)
        .sort((a, b) => {
          const getRankOrder = (rank) => {
            if (!rank) return 9999;
            if (rank.includes('Yokozuna')) return 0;
            if (rank.includes('Ozeki')) return 1;
            if (rank.includes('Sekiwake')) return 2;
            if (rank.includes('Komusubi')) return 3;
            if (rank.includes('Maegashira')) return 4;
            if (rank.includes('Juryo')) return 100;
            return 1000;
          };
          return getRankOrder(a.current_rank) - getRankOrder(b.current_rank);
        });
      setRikishis(rikishiList);
    } catch (error) {
      console.error('Failed to load rikishis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selected = selectedOptions.map((option, index) => {
      const rikishi = rikishis.find(r => r.id === parseInt(option.value));
      return {
        ...rikishi,
        color: colors[index % colors.length]
      };
    });

    if (selected.length > 10) {
      alert('Maximum 10 rikishi can be selected');
      return;
    }

    setSelectedRikishi(selected);
  };

  const updateChart = async () => {
    try {
      const measurementsData = await Promise.all(
        selectedRikishi.map(r => apiCall(`/api/rikishis/${r.id}/measurements`))
      );

      const allBashoIds = new Set();
      measurementsData.forEach(data => {
        data.forEach(m => allBashoIds.add(m.basho_id));
      });

      const sortedBashoIds = Array.from(allBashoIds).sort();

      const datasets = selectedRikishi.map((rikishi, index) => {
        const measurements = measurementsData[index];
        const measurementMap = {};
        measurements.forEach(m => {
          measurementMap[m.basho_id] = m;
        });

        const data = sortedBashoIds.map(bashoId => {
          const m = measurementMap[bashoId];
          if (!m) return null;

          const value = parseFloat(m.weight);

          if (!value || isNaN(value)) return null;

          return { x: bashoId, y: value, value };
        }).filter(p => p !== null);

        return {
          label: rikishi.shikona_en || rikishi.name,
          data: data,
          borderColor: rikishi.color,
          backgroundColor: rikishi.color + '20',
          borderWidth: 3,
          tension: 0.1,
          spanGaps: true,
          pointRadius: 4,
          pointHoverRadius: 6
        };
      });

      setChartData({ labels: sortedBashoIds, datasets });
    } catch (error) {
      console.error('Failed to update chart:', error);
    }
  };

  const yAxisLabel = 'Weight (kg)';
  const unit = ' kg';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: yAxisLabel
        }
      },
      x: {
        title: {
          display: true,
          text: 'Basho'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw?.value || context.parsed.y;
            return `${context.dataset.label}: ${value}${unit}`;
          }
        }
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <section className="measurement-progression-page">
      <h2>Weight Progression</h2>

      <div className="control-group">
        <label htmlFor="rikishi-search">Search Rikishi:</label>
        <input
          id="rikishi-search"
          type="text"
          placeholder="Type to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />

        <label htmlFor="rikishi-dropdown">Select Rikishi (hold Ctrl/Cmd to select multiple, max 10):</label>
        <select
          id="rikishi-dropdown"
          multiple
          size="5"
          onChange={handleDropdownChange}
          style={{ width: '100%', minHeight: '120px' }}
        >
          {filteredRikishis.map((r) => (
            <option key={r.id} value={r.id}>
              {r.shikona_en || r.name} ({r.current_rank})
            </option>
          ))}
        </select>
      </div>

      <div id="selected-list">
        {selectedRikishi.length === 0 ? (
          <div className="empty-state">No rikishi selected. Select rikishi from the dropdown to view their weight progression.</div>
        ) : (
          selectedRikishi.map((r) => (
            <div key={r.id} className="selected-item">
              <div className="color-indicator" style={{ backgroundColor: r.color }}></div>
              <span>{r.shikona_en || r.name}</span>
            </div>
          ))
        )}
      </div>

      <div className="chart-container" style={{ height: '500px', marginTop: '20px' }}>
        {chartData.datasets.length > 0 && (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </section>
  );
}

export default MeasurementProgression;
