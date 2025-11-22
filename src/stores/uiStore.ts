import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  selectedCar: string | null;
  toggleSidebar: () => void;
  setSelectedCar: (car: string | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const stored = localStorage.getItem('pitwall-ui-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        sidebarOpen: parsed.sidebarOpen ?? true,
        selectedCar: parsed.selectedCar ?? null,
      };
    }
  } catch (error) {
    console.warn('Failed to load UI state from localStorage:', error);
  }
  return {
    sidebarOpen: true,
    selectedCar: null,
  };
};

const initialState = loadInitialState();

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: initialState.sidebarOpen,
  selectedCar: initialState.selectedCar,
  toggleSidebar: () => {
    set((state) => {
      const newState = { sidebarOpen: !state.sidebarOpen };
      // Persist to localStorage
      try {
        localStorage.setItem(
          'pitwall-ui-storage',
          JSON.stringify({
            sidebarOpen: newState.sidebarOpen,
            selectedCar: state.selectedCar,
          })
        );
      } catch (error) {
        console.warn('Failed to save UI state to localStorage:', error);
      }
      return newState;
    });
  },
  setSelectedCar: (car) => {
    set((state) => {
      // Persist to localStorage
      try {
        localStorage.setItem(
          'pitwall-ui-storage',
          JSON.stringify({
            sidebarOpen: state.sidebarOpen,
            selectedCar: car,
          })
        );
      } catch (error) {
        console.warn('Failed to save UI state to localStorage:', error);
      }
      return { selectedCar: car };
    });
  },
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));

