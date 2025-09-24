import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode, Dispatch } from 'react';
import type { Rikishi, Basho, Bout, KimariiteEntity, MeasurementEntity, RankEntity, ShikonaEntity, BanzukeEntity, TorikumiEntity } from '../types';

interface SumoState {
  rikishi: Rikishi[];
  basho: Basho[];
  bouts: Bout[];
  kimarite: KimariiteEntity[];
  measurements: MeasurementEntity[];
  ranks: RankEntity[];
  shikonas: ShikonaEntity[];
  banzuke: BanzukeEntity[];
  torikumi: TorikumiEntity[];
}

type SumoAction =
  | { type: 'ADD_RIKISHI'; payload: Rikishi }
  | { type: 'UPDATE_RIKISHI'; payload: Rikishi }
  | { type: 'DELETE_RIKISHI'; payload: string }
  | { type: 'ADD_BASHO'; payload: Basho }
  | { type: 'UPDATE_BASHO'; payload: Basho }
  | { type: 'DELETE_BASHO'; payload: string }
  | { type: 'LOAD_BASHOS'; payload: Basho[] }
  | { type: 'ADD_BOUT'; payload: Bout }
  | { type: 'UPDATE_BOUT'; payload: Bout }
  | { type: 'DELETE_BOUT'; payload: string }
  | { type: 'LOAD_BOUTS'; payload: Bout[] }
  | { type: 'ADD_KIMARITE'; payload: KimariiteEntity }
  | { type: 'UPDATE_KIMARITE'; payload: KimariiteEntity }
  | { type: 'DELETE_KIMARITE'; payload: string }
  | { type: 'LOAD_KIMARITE'; payload: KimariiteEntity[] }
  | { type: 'ADD_MEASUREMENT'; payload: MeasurementEntity }
  | { type: 'UPDATE_MEASUREMENT'; payload: MeasurementEntity }
  | { type: 'DELETE_MEASUREMENT'; payload: string }
  | { type: 'LOAD_MEASUREMENTS'; payload: MeasurementEntity[] }
  | { type: 'ADD_RANK'; payload: RankEntity }
  | { type: 'UPDATE_RANK'; payload: RankEntity }
  | { type: 'DELETE_RANK'; payload: string }
  | { type: 'LOAD_RANKS'; payload: RankEntity[] }
  | { type: 'ADD_SHIKONA'; payload: ShikonaEntity }
  | { type: 'UPDATE_SHIKONA'; payload: ShikonaEntity }
  | { type: 'DELETE_SHIKONA'; payload: string }
  | { type: 'LOAD_SHIKONAS'; payload: ShikonaEntity[] }
  | { type: 'ADD_BANZUKE'; payload: BanzukeEntity }
  | { type: 'UPDATE_BANZUKE'; payload: BanzukeEntity }
  | { type: 'DELETE_BANZUKE'; payload: string }
  | { type: 'LOAD_BANZUKE'; payload: BanzukeEntity[] }
  | { type: 'ADD_TORIKUMI'; payload: TorikumiEntity }
  | { type: 'UPDATE_TORIKUMI'; payload: TorikumiEntity }
  | { type: 'DELETE_TORIKUMI'; payload: string }
  | { type: 'LOAD_TORIKUMI'; payload: TorikumiEntity[] }
  | { type: 'LOAD_DATA'; payload: SumoState };

const initialState: SumoState = {
  rikishi: [],
  basho: [],
  bouts: [],
  kimarite: [],
  measurements: [],
  ranks: [],
  shikonas: [],
  banzuke: [],
  torikumi: [],
};

function sumoReducer(state: SumoState, action: SumoAction): SumoState {
  switch (action.type) {
    case 'ADD_RIKISHI':
      return { ...state, rikishi: [...state.rikishi, action.payload] };
    case 'UPDATE_RIKISHI':
      return {
        ...state,
        rikishi: state.rikishi.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_RIKISHI':
      return {
        ...state,
        rikishi: state.rikishi.filter(r => r.id !== action.payload),
      };
    case 'ADD_BASHO':
      return { ...state, basho: [...state.basho, action.payload] };
    case 'UPDATE_BASHO':
      return {
        ...state,
        basho: state.basho.map(b =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BASHO':
      return {
        ...state,
        basho: state.basho.filter(b => b.id !== action.payload),
      };
    case 'LOAD_BASHOS':
      return { ...state, basho: action.payload };
    case 'ADD_BOUT':
      return { ...state, bouts: [...state.bouts, action.payload] };
    case 'UPDATE_BOUT':
      return {
        ...state,
        bouts: state.bouts.map(b =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BOUT':
      return {
        ...state,
        bouts: state.bouts.filter(b => b.id !== action.payload),
      };
    case 'LOAD_BOUTS':
      return { ...state, bouts: action.payload };
    case 'ADD_KIMARITE':
      return { ...state, kimarite: [...state.kimarite, action.payload] };
    case 'UPDATE_KIMARITE':
      return {
        ...state,
        kimarite: state.kimarite.map(k =>
          k.id === action.payload.id ? action.payload : k
        ),
      };
    case 'DELETE_KIMARITE':
      return {
        ...state,
        kimarite: state.kimarite.filter(k => k.id !== action.payload),
      };
    case 'LOAD_KIMARITE':
      return { ...state, kimarite: action.payload };
    case 'ADD_MEASUREMENT':
      return { ...state, measurements: [...state.measurements, action.payload] };
    case 'UPDATE_MEASUREMENT':
      return {
        ...state,
        measurements: state.measurements.map(m =>
          m.id === action.payload.id ? action.payload : m
        ),
      };
    case 'DELETE_MEASUREMENT':
      return {
        ...state,
        measurements: state.measurements.filter(m => m.id !== action.payload),
      };
    case 'LOAD_MEASUREMENTS':
      return { ...state, measurements: action.payload };
    case 'ADD_RANK':
      return { ...state, ranks: [...state.ranks, action.payload] };
    case 'UPDATE_RANK':
      return {
        ...state,
        ranks: state.ranks.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_RANK':
      return {
        ...state,
        ranks: state.ranks.filter(r => r.id !== action.payload),
      };
    case 'LOAD_RANKS':
      return { ...state, ranks: action.payload };
    case 'ADD_SHIKONA':
      return { ...state, shikonas: [...state.shikonas, action.payload] };
    case 'UPDATE_SHIKONA':
      return {
        ...state,
        shikonas: state.shikonas.map(s =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'DELETE_SHIKONA':
      return {
        ...state,
        shikonas: state.shikonas.filter(s => s.id !== action.payload),
      };
    case 'LOAD_SHIKONAS':
      return { ...state, shikonas: action.payload };
    case 'ADD_BANZUKE':
      return { ...state, banzuke: [...state.banzuke, action.payload] };
    case 'UPDATE_BANZUKE':
      return {
        ...state,
        banzuke: state.banzuke.map(b =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BANZUKE':
      return {
        ...state,
        banzuke: state.banzuke.filter(b => b.id !== action.payload),
      };
    case 'LOAD_BANZUKE':
      return { ...state, banzuke: action.payload };
    case 'ADD_TORIKUMI':
      return { ...state, torikumi: [...state.torikumi, action.payload] };
    case 'UPDATE_TORIKUMI':
      return {
        ...state,
        torikumi: state.torikumi.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TORIKUMI':
      return {
        ...state,
        torikumi: state.torikumi.filter(t => t.id !== action.payload),
      };
    case 'LOAD_TORIKUMI':
      return { ...state, torikumi: action.payload };
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

interface SumoContextType {
  state: SumoState;
  dispatch: Dispatch<SumoAction>;
  addRikishi: (rikishi: Rikishi) => void;
  updateRikishi: (rikishi: Rikishi) => void;
  deleteRikishi: (id: string) => void;
  addBasho: (basho: Basho) => void;
  updateBasho: (basho: Basho) => void;
  deleteBasho: (id: string) => void;
  loadBashos: (bashos: Basho[]) => void;
  addBout: (bout: Bout) => void;
  updateBout: (bout: Bout) => void;
  deleteBout: (id: string) => void;
  loadBouts: (bouts: Bout[]) => void;
  addKimarite: (kimarite: KimariiteEntity) => void;
  updateKimarite: (kimarite: KimariiteEntity) => void;
  deleteKimarite: (id: string) => void;
  loadKimarite: (kimarite: KimariiteEntity[]) => void;
  addMeasurement: (measurement: MeasurementEntity) => void;
  updateMeasurement: (measurement: MeasurementEntity) => void;
  deleteMeasurement: (id: string) => void;
  loadMeasurements: (measurements: MeasurementEntity[]) => void;
  addRank: (rank: RankEntity) => void;
  updateRank: (rank: RankEntity) => void;
  deleteRank: (id: string) => void;
  loadRanks: (ranks: RankEntity[]) => void;
  addShikona: (shikona: ShikonaEntity) => void;
  updateShikona: (shikona: ShikonaEntity) => void;
  deleteShikona: (id: string) => void;
  loadShikonas: (shikonas: ShikonaEntity[]) => void;
  addBanzuke: (banzuke: BanzukeEntity) => void;
  updateBanzuke: (banzuke: BanzukeEntity) => void;
  deleteBanzuke: (id: string) => void;
  loadBanzuke: (banzuke: BanzukeEntity[]) => void;
  addTorikumi: (torikumi: TorikumiEntity) => void;
  updateTorikumi: (torikumi: TorikumiEntity) => void;
  deleteTorikumi: (id: string) => void;
  loadTorikumi: (torikumi: TorikumiEntity[]) => void;
}

const SumoContext = createContext<SumoContextType | undefined>(undefined);

export function SumoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sumoReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('sumoData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('sumoData', JSON.stringify(state));
  }, [state]);

  const addRikishi = (rikishi: Rikishi) => {
    dispatch({ type: 'ADD_RIKISHI', payload: rikishi });
  };

  const updateRikishi = (rikishi: Rikishi) => {
    dispatch({ type: 'UPDATE_RIKISHI', payload: rikishi });
  };

  const deleteRikishi = (id: string) => {
    dispatch({ type: 'DELETE_RIKISHI', payload: id });
  };

  const addBasho = (basho: Basho) => {
    dispatch({ type: 'ADD_BASHO', payload: basho });
  };

  const updateBasho = (basho: Basho) => {
    dispatch({ type: 'UPDATE_BASHO', payload: basho });
  };

  const deleteBasho = (id: string) => {
    dispatch({ type: 'DELETE_BASHO', payload: id });
  };
  const loadBashos = (bashos: Basho[]) => {
    dispatch({ type: 'LOAD_BASHOS', payload: bashos });
  };

  const addBout = (bout: Bout) => {
    dispatch({ type: 'ADD_BOUT', payload: bout });
  };

  const updateBout = (bout: Bout) => {
    dispatch({ type: 'UPDATE_BOUT', payload: bout });
  };

  const deleteBout = (id: string) => {
    dispatch({ type: 'DELETE_BOUT', payload: id });
  };
  const loadBouts = (bouts: Bout[]) => {
    dispatch({ type: 'LOAD_BOUTS', payload: bouts });
  };

  const addKimarite = (kimarite: KimariiteEntity) => {
    dispatch({ type: 'ADD_KIMARITE', payload: kimarite });
  };

  const updateKimarite = (kimarite: KimariiteEntity) => {
    dispatch({ type: 'UPDATE_KIMARITE', payload: kimarite });
  };

  const deleteKimarite = (id: string) => {
    dispatch({ type: 'DELETE_KIMARITE', payload: id });
  };

  const loadKimarite = (kimarite: KimariiteEntity[]) => {
    dispatch({ type: 'LOAD_KIMARITE', payload: kimarite });
  };

  const addMeasurement = (measurement: MeasurementEntity) => {
    dispatch({ type: 'ADD_MEASUREMENT', payload: measurement });
  };

  const updateMeasurement = (measurement: MeasurementEntity) => {
    dispatch({ type: 'UPDATE_MEASUREMENT', payload: measurement });
  };

  const deleteMeasurement = (id: string) => {
    dispatch({ type: 'DELETE_MEASUREMENT', payload: id });
  };

  const loadMeasurements = (measurements: MeasurementEntity[]) => {
    dispatch({ type: 'LOAD_MEASUREMENTS', payload: measurements });
  };

  const addRank = (rank: RankEntity) => {
    dispatch({ type: 'ADD_RANK', payload: rank });
  };

  const updateRank = (rank: RankEntity) => {
    dispatch({ type: 'UPDATE_RANK', payload: rank });
  };

  const deleteRank = (id: string) => {
    dispatch({ type: 'DELETE_RANK', payload: id });
  };

  const loadRanks = (ranks: RankEntity[]) => {
    dispatch({ type: 'LOAD_RANKS', payload: ranks });
  };

  const addShikona = (shikona: ShikonaEntity) => {
    dispatch({ type: 'ADD_SHIKONA', payload: shikona });
  };

  const updateShikona = (shikona: ShikonaEntity) => {
    dispatch({ type: 'UPDATE_SHIKONA', payload: shikona });
  };

  const deleteShikona = (id: string) => {
    dispatch({ type: 'DELETE_SHIKONA', payload: id });
  };

  const loadShikonas = (shikonas: ShikonaEntity[]) => {
    dispatch({ type: 'LOAD_SHIKONAS', payload: shikonas });
  };

  const addBanzuke = (banzuke: BanzukeEntity) => {
    dispatch({ type: 'ADD_BANZUKE', payload: banzuke });
  };

  const updateBanzuke = (banzuke: BanzukeEntity) => {
    dispatch({ type: 'UPDATE_BANZUKE', payload: banzuke });
  };

  const deleteBanzuke = (id: string) => {
    dispatch({ type: 'DELETE_BANZUKE', payload: id });
  };

  const loadBanzuke = (banzuke: BanzukeEntity[]) => {
    dispatch({ type: 'LOAD_BANZUKE', payload: banzuke });
  };

  const addTorikumi = (torikumi: TorikumiEntity) => {
    dispatch({ type: 'ADD_TORIKUMI', payload: torikumi });
  };

  const updateTorikumi = (torikumi: TorikumiEntity) => {
    dispatch({ type: 'UPDATE_TORIKUMI', payload: torikumi });
  };

  const deleteTorikumi = (id: string) => {
    dispatch({ type: 'DELETE_TORIKUMI', payload: id });
  };

  const loadTorikumi = (torikumi: TorikumiEntity[]) => {
    dispatch({ type: 'LOAD_TORIKUMI', payload: torikumi });
  };

  return (
    <SumoContext.Provider
      value={{
        state,
        dispatch,
        addRikishi,
        updateRikishi,
        deleteRikishi,
        addBasho,
        updateBasho,
        deleteBasho,
        loadBashos,
        addBout,
        updateBout,
        deleteBout,
        loadBouts,
        addKimarite,
        updateKimarite,
        deleteKimarite,
        loadKimarite,
        addMeasurement,
        updateMeasurement,
        deleteMeasurement,
        loadMeasurements,
        addRank,
        updateRank,
        deleteRank,
        loadRanks,
        addShikona,
        updateShikona,
        deleteShikona,
        loadShikonas,
        addBanzuke,
        updateBanzuke,
        deleteBanzuke,
        loadBanzuke,
        addTorikumi,
        updateTorikumi,
        deleteTorikumi,
        loadTorikumi,
      }}
    >
      {children}
    </SumoContext.Provider>
  );
}

export function useSumo() {
  const context = useContext(SumoContext);
  if (context === undefined) {
    throw new Error('useSumo must be used within a SumoProvider');
  }
  return context;
}