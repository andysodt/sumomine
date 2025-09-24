import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode, Dispatch } from 'react';
import type { Rikishi, Basho, Bout, KimariiteEntity, MeasurementEntity, RankEntity, ShikonaEntity, BanzukeEntity, TorikumiEntity } from '../types';
import { apiService } from '../services/api';

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
  loading: boolean;
  error: string | null;
}

type SumoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_RIKISHI_SUCCESS'; payload: Rikishi[] }
  | { type: 'ADD_RIKISHI_SUCCESS'; payload: Rikishi }
  | { type: 'UPDATE_RIKISHI_SUCCESS'; payload: Rikishi }
  | { type: 'DELETE_RIKISHI_SUCCESS'; payload: string }
  | { type: 'LOAD_BASHO_SUCCESS'; payload: Basho[] }
  | { type: 'ADD_BASHO_SUCCESS'; payload: Basho }
  | { type: 'UPDATE_BASHO_SUCCESS'; payload: Basho }
  | { type: 'DELETE_BASHO_SUCCESS'; payload: string }
  | { type: 'LOAD_BOUTS'; payload: Bout[] }
  | { type: 'ADD_BOUT'; payload: Bout }
  | { type: 'UPDATE_BOUT'; payload: Bout }
  | { type: 'DELETE_BOUT'; payload: string }
  | { type: 'LOAD_KIMARITE'; payload: KimariiteEntity[] }
  | { type: 'ADD_KIMARITE'; payload: KimariiteEntity }
  | { type: 'UPDATE_KIMARITE'; payload: KimariiteEntity }
  | { type: 'DELETE_KIMARITE'; payload: string }
  | { type: 'LOAD_MEASUREMENTS'; payload: MeasurementEntity[] }
  | { type: 'LOAD_RANKS'; payload: RankEntity[] }
  | { type: 'LOAD_SHIKONAS'; payload: ShikonaEntity[] }
  | { type: 'LOAD_BANZUKE'; payload: BanzukeEntity[] }
  | { type: 'LOAD_TORIKUMI'; payload: TorikumiEntity[] };

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
  loading: false,
  error: null,
};

function sumoReducer(state: SumoState, action: SumoAction): SumoState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    // Rikishi actions
    case 'LOAD_RIKISHI_SUCCESS':
      return { ...state, rikishi: action.payload, loading: false, error: null };
    case 'ADD_RIKISHI_SUCCESS':
      return { ...state, rikishi: [...state.rikishi, action.payload], loading: false, error: null };
    case 'UPDATE_RIKISHI_SUCCESS':
      return {
        ...state,
        rikishi: state.rikishi.map(r => r.id === action.payload.id ? action.payload : r),
        loading: false,
        error: null,
      };
    case 'DELETE_RIKISHI_SUCCESS':
      return {
        ...state,
        rikishi: state.rikishi.filter(r => r.id !== action.payload),
        loading: false,
        error: null,
      };

    // Basho actions
    case 'LOAD_BASHO_SUCCESS':
      return { ...state, basho: action.payload, loading: false, error: null };
    case 'ADD_BASHO_SUCCESS':
      return { ...state, basho: [...state.basho, action.payload], loading: false, error: null };
    case 'UPDATE_BASHO_SUCCESS':
      return {
        ...state,
        basho: state.basho.map(b => b.id === action.payload.id ? action.payload : b),
        loading: false,
        error: null,
      };
    case 'DELETE_BASHO_SUCCESS':
      return {
        ...state,
        basho: state.basho.filter(b => b.id !== action.payload),
        loading: false,
        error: null,
      };

    // Other entities (keeping local state for now)
    case 'LOAD_BOUTS':
      return { ...state, bouts: action.payload };
    case 'ADD_BOUT':
      return { ...state, bouts: [...state.bouts, action.payload] };
    case 'UPDATE_BOUT':
      return {
        ...state,
        bouts: state.bouts.map(b => b.id === action.payload.id ? action.payload : b),
      };
    case 'DELETE_BOUT':
      return {
        ...state,
        bouts: state.bouts.filter(b => b.id !== action.payload),
      };
    case 'LOAD_KIMARITE':
      return { ...state, kimarite: action.payload };
    case 'ADD_KIMARITE':
      return { ...state, kimarite: [...state.kimarite, action.payload] };
    case 'UPDATE_KIMARITE':
      return {
        ...state,
        kimarite: state.kimarite.map(k => k.id === action.payload.id ? action.payload : k),
      };
    case 'DELETE_KIMARITE':
      return {
        ...state,
        kimarite: state.kimarite.filter(k => k.id !== action.payload),
      };
    case 'LOAD_MEASUREMENTS':
      return { ...state, measurements: action.payload };
    case 'LOAD_RANKS':
      return { ...state, ranks: action.payload };
    case 'LOAD_SHIKONAS':
      return { ...state, shikonas: action.payload };
    case 'LOAD_BANZUKE':
      return { ...state, banzuke: action.payload };
    case 'LOAD_TORIKUMI':
      return { ...state, torikumi: action.payload };
    default:
      return state;
  }
}

interface SumoContextType {
  state: SumoState;
  dispatch: Dispatch<SumoAction>;
  // Rikishi methods
  loadRikishi: () => Promise<void>;
  addRikishi: (rikishi: Omit<Rikishi, 'createdAt'>) => Promise<void>;
  bulkAddRikishi: (rikishi: Omit<Rikishi, 'createdAt'>[]) => Promise<void>;
  updateRikishi: (rikishi: Rikishi) => Promise<void>;
  deleteRikishi: (id: string) => Promise<void>;
  // Basho methods
  loadBashos: () => Promise<void>;
  addBasho: (basho: Omit<Basho, 'createdAt'>) => Promise<void>;
  updateBasho: (basho: Basho) => Promise<void>;
  deleteBasho: (id: string) => Promise<void>;
  // Local-only methods (keeping existing functionality)
  addBout: (bout: Bout) => void;
  updateBout: (bout: Bout) => void;
  deleteBout: (id: string) => void;
  loadBouts: (bouts: Bout[]) => void;
  addKimarite: (kimarite: KimariiteEntity) => void;
  updateKimarite: (kimarite: KimariiteEntity) => void;
  deleteKimarite: (id: string) => void;
  loadKimarite: (kimarite: KimariiteEntity[]) => void;
  loadMeasurements: (measurements: MeasurementEntity[]) => void;
  loadRanks: (ranks: RankEntity[]) => void;
  loadShikonas: (shikonas: ShikonaEntity[]) => void;
  loadBanzuke: (banzuke: BanzukeEntity[]) => void;
  loadTorikumi: (torikumi: TorikumiEntity[]) => void;
}

const SumoContext = createContext<SumoContextType | undefined>(undefined);

export function SumoProviderDB({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sumoReducer, initialState);

  // Load initial data on mount
  useEffect(() => {
    loadRikishi();
    loadBashos();
  }, []);

  // Rikishi methods
  const loadRikishi = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const rikishi = await apiService.getAllRikishi();
      dispatch({ type: 'LOAD_RIKISHI_SUCCESS', payload: rikishi });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load rikishi' });
    }
  };

  const addRikishi = async (rikishi: Omit<Rikishi, 'createdAt'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newRikishi = await apiService.createRikishi(rikishi);
      dispatch({ type: 'ADD_RIKISHI_SUCCESS', payload: newRikishi });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add rikishi' });
      throw error;
    }
  };

  const bulkAddRikishi = async (rikishi: Omit<Rikishi, 'createdAt'>[]) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await apiService.bulkCreateRikishi(rikishi);
      // Reload all rikishi to get the updated list
      await loadRikishi();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to bulk add rikishi' });
      throw error;
    }
  };

  const updateRikishi = async (rikishi: Rikishi) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedRikishi = await apiService.updateRikishi(rikishi.id, rikishi);
      dispatch({ type: 'UPDATE_RIKISHI_SUCCESS', payload: updatedRikishi });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update rikishi' });
      throw error;
    }
  };

  const deleteRikishi = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await apiService.deleteRikishi(id);
      dispatch({ type: 'DELETE_RIKISHI_SUCCESS', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete rikishi' });
      throw error;
    }
  };

  // Basho methods
  const loadBashos = async () => {
    try {
      const bashos = await apiService.getAllBasho();
      dispatch({ type: 'LOAD_BASHO_SUCCESS', payload: bashos });
    } catch (error) {
      console.error('Failed to load bashos:', error);
      // Don't set error for bashos as it's not critical
    }
  };

  const addBasho = async (basho: Omit<Basho, 'createdAt'>) => {
    try {
      const newBasho = await apiService.createBasho(basho);
      dispatch({ type: 'ADD_BASHO_SUCCESS', payload: newBasho });
    } catch (error) {
      console.error('Failed to add basho:', error);
      throw error;
    }
  };

  const updateBasho = async (basho: Basho) => {
    try {
      const updatedBasho = await apiService.updateBasho(basho.id, basho);
      dispatch({ type: 'UPDATE_BASHO_SUCCESS', payload: updatedBasho });
    } catch (error) {
      console.error('Failed to update basho:', error);
      throw error;
    }
  };

  const deleteBasho = async (id: string) => {
    try {
      await apiService.deleteBasho(id);
      dispatch({ type: 'DELETE_BASHO_SUCCESS', payload: id });
    } catch (error) {
      console.error('Failed to delete basho:', error);
      throw error;
    }
  };

  // Local-only methods (keeping existing functionality for now)
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

  const loadMeasurements = (measurements: MeasurementEntity[]) => {
    dispatch({ type: 'LOAD_MEASUREMENTS', payload: measurements });
  };

  const loadRanks = (ranks: RankEntity[]) => {
    dispatch({ type: 'LOAD_RANKS', payload: ranks });
  };

  const loadShikonas = (shikonas: ShikonaEntity[]) => {
    dispatch({ type: 'LOAD_SHIKONAS', payload: shikonas });
  };

  const loadBanzuke = (banzuke: BanzukeEntity[]) => {
    dispatch({ type: 'LOAD_BANZUKE', payload: banzuke });
  };

  const loadTorikumi = (torikumi: TorikumiEntity[]) => {
    dispatch({ type: 'LOAD_TORIKUMI', payload: torikumi });
  };

  const value: SumoContextType = {
    state,
    dispatch,
    loadRikishi,
    addRikishi,
    bulkAddRikishi,
    updateRikishi,
    deleteRikishi,
    loadBashos,
    addBasho,
    updateBasho,
    deleteBasho,
    addBout,
    updateBout,
    deleteBout,
    loadBouts,
    addKimarite,
    updateKimarite,
    deleteKimarite,
    loadKimarite,
    loadMeasurements,
    loadRanks,
    loadShikonas,
    loadBanzuke,
    loadTorikumi,
  };

  return <SumoContext.Provider value={value}>{children}</SumoContext.Provider>;
}

export function useSumoDB() {
  const context = useContext(SumoContext);
  if (context === undefined) {
    throw new Error('useSumoDB must be used within a SumoProviderDB');
  }
  return context;
}