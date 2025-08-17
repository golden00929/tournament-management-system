import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Tournament {
  id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  maxParticipants: number;
  participantFee: number;
}

interface TournamentState {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  loading: boolean;
  error: string | null;
}

const initialState: TournamentState = {
  tournaments: [],
  selectedTournament: null,
  loading: false,
  error: null,
};

const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTournaments: (state, action: PayloadAction<Tournament[]>) => {
      state.tournaments = action.payload;
    },
    setSelectedTournament: (state, action: PayloadAction<Tournament | null>) => {
      state.selectedTournament = action.payload;
    },
    addTournament: (state, action: PayloadAction<Tournament>) => {
      state.tournaments.push(action.payload);
    },
    updateTournament: (state, action: PayloadAction<Tournament>) => {
      const index = state.tournaments.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tournaments[index] = action.payload;
      }
    },
  },
});

export const { 
  setLoading, 
  setError, 
  setTournaments, 
  setSelectedTournament, 
  addTournament, 
  updateTournament 
} = tournamentSlice.actions;
export default tournamentSlice.reducer;