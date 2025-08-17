import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

// Base API slice with authentication
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      console.log('API Request - Token:', token ? 'Present' : 'Missing');
      console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('Token length:', token ? token.length : 0);
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
        console.log('API Request - Authorization header set');
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Tournament', 'Player', 'Participant', 'Bracket', 'Match', 'PlayerProfile', 'PublicTournaments', 'PublicTournament', 'AvailableTournaments', 'PlayerApplications', 'PublicRankings', 'Notification', 'PlayerMatches', 'TournamentBracket'],
  endpoints: (builder) => ({}),
});

// Auth API
export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { success: boolean; message: string; data: { token: string; user: { id: string; email: string; name: string; role: string } } },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

// Tournament API
export const tournamentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTournaments: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/tournaments',
        params,
      }),
      providesTags: ['Tournament'],
    }),
    getTournament: builder.query<any, string>({
      query: (id) => `/tournaments/${id}`,
      providesTags: ['Tournament'],
    }),
    createTournament: builder.mutation<any, any>({
      query: (tournament) => ({
        url: '/tournaments',
        method: 'POST',
        body: tournament,
      }),
      invalidatesTags: ['Tournament'],
    }),
    updateTournament: builder.mutation<any, { id: string } & any>({
      query: ({ id, ...tournament }) => ({
        url: `/tournaments/${id}`,
        method: 'PUT',
        body: tournament,
      }),
      invalidatesTags: ['Tournament'],
    }),
    deleteTournament: builder.mutation<any, { id: string; force?: boolean }>({
      query: ({ id, force }) => ({
        url: `/tournaments/${id}${force ? '?force=true' : ''}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tournament'],
    }),
    updateTournamentStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/tournaments/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Tournament'],
    }),
  }),
});

// Player API
export const playerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPlayers: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/players',
        params,
      }),
      providesTags: ['Player'],
    }),
    getPlayer: builder.query<any, string>({
      query: (id) => `/players/${id}`,
      providesTags: ['Player'],
    }),
    createPlayer: builder.mutation<any, any>({
      query: (player) => ({
        url: '/players',
        method: 'POST',
        body: player,
      }),
      invalidatesTags: ['Player'],
    }),
    updatePlayer: builder.mutation<any, { id: string } & any>({
      query: ({ id, ...player }) => ({
        url: `/players/${id}`,
        method: 'PUT',
        body: player,
      }),
      invalidatesTags: ['Player'],
    }),
    deletePlayer: builder.mutation<any, string>({
      query: (id) => ({
        url: `/players/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Player'],
    }),
    adjustPlayerRating: builder.mutation<any, { id: string; newRating: number; reason?: string }>({
      query: ({ id, newRating, reason = 'manual_adjustment' }) => ({
        url: `/players/${id}/rating`,
        method: 'PATCH',
        body: { newRating, reason },
      }),
      invalidatesTags: ['Player'],
    }),
  }),
});

// Bracket API
export const bracketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTournamentBracket: builder.query<any, string>({
      query: (tournamentId) => `/brackets/tournament/${tournamentId}`,
      providesTags: ['Bracket', 'Match'],
    }),
    checkTournamentBrackets: builder.query<any, string>({
      query: (tournamentId) => `/brackets/tournament/${tournamentId}`,
      providesTags: ['Bracket'],
      transformResponse: (response: any) => {
        // 대진표 존재 여부만 간단히 반환
        return {
          hasBrackets: response?.data?.length > 0 || false,
          bracketCount: response?.data?.length || 0
        };
      },
    }),
    generateBracket: builder.mutation<any, string | { tournamentId: string; eventType?: string; name?: string; participantIds?: string[]; tournamentType?: string; groupSize?: number; advancersPerGroup?: number }>({
      query: (data) => ({
        url: `/brackets/generate`,
        method: 'POST',
        body: typeof data === 'string' ? { tournamentId: data } : data,
      }),
      invalidatesTags: ['Bracket', 'Match'],
    }),
    updateMatch: builder.mutation<any, { matchId: string; winnerId: string; player1Score: number; player2Score: number }>({
      query: ({ matchId, winnerId, player1Score, player2Score }) => ({
        url: `/matches/${matchId}/result`,
        method: 'PUT',
        body: { winnerId, player1Score, player2Score },
      }),
      invalidatesTags: ['Match', 'Bracket'],
    }),
  }),
});

// Participant API
export const participantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTournamentParticipants: builder.query<any, { tournamentId: string; limit?: number; page?: number }>({
      query: ({ tournamentId, limit = 20, page = 1 }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString()
        });
        return `/participants/tournament/${tournamentId}?${params}`;
      },
      providesTags: ['Participant'],
    }),
    addParticipant: builder.mutation<any, { tournamentId: string; playerId: string; eventType?: string }>({
      query: ({ tournamentId, playerId, eventType = 'singles' }) => ({
        url: `/participants`,
        method: 'POST',
        body: { tournamentId, playerId, eventType },
      }),
      invalidatesTags: ['Participant'],
    }),
    updateParticipantStatus: builder.mutation<any, { participantId: string; status: string }>({
      query: ({ participantId, status }) => ({
        url: `/participants/${participantId}/approval`,
        method: 'PATCH',
        body: { approvalStatus: status },
      }),
      invalidatesTags: ['Participant'],
    }),
    removeParticipant: builder.mutation<any, { participantId: string }>({
      query: ({ participantId }) => ({
        url: `/participants/${participantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Participant'],
    }),
  }),
});

// Match API
export const matchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTournamentMatches: builder.query<any, { tournamentId: string; page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string }>({
      query: ({ tournamentId, page = 1, limit = 20, status, sortBy = 'scheduledTime', sortOrder = 'asc' }) => {
        const params = new URLSearchParams({
          tournamentId,
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder
        });
        if (status) params.append('status', status);
        return `/matches?${params}`;
      },
      providesTags: ['Match'],
    }),
    getMatch: builder.query<any, string>({
      query: (id) => `/matches/${id}`,
      providesTags: ['Match'],
    }),
    getTournamentMatchStats: builder.query<any, string>({
      query: (tournamentId) => `/matches/tournament/${tournamentId}/stats`,
      providesTags: ['Match'],
    }),
    startMatch: builder.mutation<any, string>({
      query: (matchId) => ({
        url: `/matches/${matchId}/start`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Match'],
    }),
    cancelMatch: builder.mutation<any, { matchId: string; reason?: string }>({
      query: ({ matchId, reason }) => ({
        url: `/matches/${matchId}/cancel`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Match'],
    }),
    updateMatchSchedule: builder.mutation<any, { matchId: string; courtNumber?: number; scheduledTime?: string; notes?: string }>({
      query: ({ matchId, ...data }) => ({
        url: `/matches/${matchId}/schedule`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Match'],
    }),
    generateAISchedule: builder.mutation<any, { tournamentId: string; startTime: string; courtCount?: number; matchDuration?: number; restBetweenMatches?: number; courtChangeDuration?: number }>({
      query: ({ tournamentId, ...data }) => ({
        url: `/matches/tournament/${tournamentId}/ai-schedule`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Match'],
    }),
    validateSchedule: builder.query<any, string>({
      query: (tournamentId) => `/matches/tournament/${tournamentId}/schedule-validation`,
      providesTags: ['Match'],
    }),
  }),
});

// Notification API
export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendNotification: builder.mutation<any, { 
      tournamentId: string; 
      title: string; 
      message: string; 
      type?: 'info' | 'warning' | 'urgent' | 'success';
      targetPlayers?: string[];
      matchId?: string;
      expiresAt?: string;
      actionUrl?: string;
    }>({
      query: ({ tournamentId, ...data }) => ({
        url: `/notifications/tournament/${tournamentId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),
    sendUrgentAnnouncement: builder.mutation<any, { 
      tournamentId: string; 
      title: string; 
      message: string; 
    }>({
      query: ({ tournamentId, title, message }) => ({
        url: `/notifications/tournament/${tournamentId}/urgent`,
        method: 'POST',
        body: { title, message },
      }),
      invalidatesTags: ['Notification'],
    }),
    sendMatchStartingNotification: builder.mutation<any, { 
      matchId: string; 
      minutesUntilStart?: number; 
    }>({
      query: ({ matchId, minutesUntilStart = 10 }) => ({
        url: `/notifications/match/${matchId}/starting-soon`,
        method: 'POST',
        body: { minutesUntilStart },
      }),
      invalidatesTags: ['Notification'],
    }),
    getNotificationStats: builder.query<any, string>({
      query: (tournamentId) => `/notifications/tournament/${tournamentId}/stats`,
      providesTags: ['Notification'],
    }),
  }),
});

// Export hooks for usage in functional components
export const { useLoginMutation } = authApi;
export const { 
  useGetTournamentsQuery, 
  useGetTournamentQuery,
  useCreateTournamentMutation,
  useUpdateTournamentMutation,
  useDeleteTournamentMutation,
  useUpdateTournamentStatusMutation 
} = tournamentApi;
export const { 
  useGetPlayersQuery, 
  useGetPlayerQuery, 
  useCreatePlayerMutation,
  useUpdatePlayerMutation,
  useDeletePlayerMutation,
  useAdjustPlayerRatingMutation
} = playerApi;
export const {
  useGetTournamentBracketQuery,
  useCheckTournamentBracketsQuery,
  useGenerateBracketMutation,
  useUpdateMatchMutation
} = bracketApi;
export const {
  useGetTournamentParticipantsQuery,
  useAddParticipantMutation,
  useUpdateParticipantStatusMutation,
  useRemoveParticipantMutation
} = participantApi;
export const {
  useGetTournamentMatchesQuery,
  useGetMatchQuery,
  useGetTournamentMatchStatsQuery,
  useStartMatchMutation,
  useCancelMatchMutation,
  useUpdateMatchScheduleMutation,
  useGenerateAIScheduleMutation,
  useValidateScheduleQuery
} = matchApi;
export const {
  useSendNotificationMutation,
  useSendUrgentAnnouncementMutation,
  useSendMatchStartingNotificationMutation,
  useGetNotificationStatsQuery
} = notificationApi;