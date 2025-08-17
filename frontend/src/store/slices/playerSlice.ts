import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Player {
  id: string;
  name: string;
  email: string;
  phone: string;
  eloRating: number;
  skillLevel: string;
  totalMatches: number;
  wins: number;
  losses: number;
}

interface PlayerState {
  players: Player[];
  selectedPlayer: Player | null;
  loading: boolean;
  error: string | null;
}

const initialState: PlayerState = {
  players: [],
  selectedPlayer: null,
  loading: false,
  error: null,
};

const playerSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    setSelectedPlayer: (state, action: PayloadAction<Player | null>) => {
      state.selectedPlayer = action.payload;
    },
    addPlayer: (state, action: PayloadAction<Player>) => {
      state.players.push(action.payload);
    },
    updatePlayer: (state, action: PayloadAction<Player>) => {
      const index = state.players.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.players[index] = action.payload;
      }
    },
  },
});

export const { 
  setLoading, 
  setError, 
  setPlayers, 
  setSelectedPlayer, 
  addPlayer, 
  updatePlayer 
} = playerSlice.actions;
export default playerSlice.reducer;