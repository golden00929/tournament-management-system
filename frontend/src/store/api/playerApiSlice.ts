import { apiSlice } from './apiSlice';

export const playerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 선수 인증 관련
    playerLogin: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          token: string;
          player: {
            id: string;
            name: string;
            email: string;
            eloRating: number;
            skillLevel: string;
            isVerified: boolean;
          };
        };
      },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/player-auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    playerRegister: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          id: string;
          name: string;
          email: string;
          phone: string;
          gender: string;
          province: string;
          district: string;
          eloRating: number;
          skillLevel: string;
          isVerified: boolean;
          registrationDate: string;
        };
      },
      {
        name: string;
        email: string;
        phone: string;
        birthYear: number;
        gender: string;
        province: string;
        district: string;
        password: string;
      }
    >({
      query: (userData) => ({
        url: '/player-auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // 선수 프로필 관련
    getPlayerProfile: builder.query<
      {
        success: boolean;
        data: {
          id: string;
          name: string;
          email: string;
          phone: string;
          birthYear: number;
          gender: string;
          province: string;
          district: string;
          address?: string;
          emergencyContact?: string;
          emergencyPhone?: string;
          eloRating: number;
          skillLevel: string;
          totalMatches: number;
          wins: number;
          losses: number;
          isVerified: boolean;
          lastLoginAt: string;
          registrationDate: string;
        };
      },
      void
    >({
      query: () => ({
        url: '/player-api/profile',
        method: 'GET',
      }),
      providesTags: ['PlayerProfile'],
    }),

    updatePlayerProfile: builder.mutation<
      {
        success: boolean;
        message: string;
        data: any;
      },
      {
        name?: string;
        phone?: string;
        province?: string;
        district?: string;
        address?: string;
        emergencyContact?: string;
        emergencyPhone?: string;
      }
    >({
      query: (profileData) => ({
        url: '/player-api/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['PlayerProfile'],
    }),

    // 공개 대회 관련
    getPublicTournaments: builder.query<
      {
        success: boolean;
        data: {
          tournaments: Array<{
            id: string;
            name: string;
            description: string;
            category: string;
            startDate: string;
            endDate: string;
            registrationStart: string;
            registrationEnd: string;
            location: string;
            venue: string;
            maxParticipants: number;
            skillLevel: string;
            participantFee: number;
            status: string;
            posterImage?: string;
            currentParticipants: number;
            isRegistrationOpen: boolean;
            daysUntilStart: number;
          }>;
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
      },
      {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        status?: string;
        skillLevel?: string;
        location?: string;
      }
    >({
      query: (params = {}) => ({
        url: '/public/tournaments',
        method: 'GET',
        params,
      }),
      providesTags: ['PublicTournaments'],
    }),

    getPublicTournamentDetail: builder.query<
      {
        success: boolean;
        data: {
          id: string;
          name: string;
          description: string;
          category: string;
          startDate: string;
          endDate: string;
          registrationStart: string;
          registrationEnd: string;
          location: string;
          venue: string;
          maxParticipants: number;
          skillLevel: string;
          participantFee: number;
          status: string;
          posterImage?: string;
          contactPhone?: string;
          contactEmail?: string;
          organizerInfo?: string;
          currentParticipants: number;
          isRegistrationOpen: boolean;
          daysUntilStart: number;
          participants: Array<{
            id: string;
            eventType: string;
            player: {
              name: string;
              province: string;
              district: string;
              eloRating: number;
              skillLevel: string;
            };
          }>;
        };
      },
      string
    >({
      query: (tournamentId) => ({
        url: `/public/tournament/${tournamentId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, tournamentId) => [
        { type: 'PublicTournament', id: tournamentId },
      ],
    }),

    // 선수 대회 참가 관련
    getAvailableTournaments: builder.query<
      {
        success: boolean;
        data: {
          tournaments: Array<{
            id: string;
            name: string;
            description: string;
            category: string;
            startDate: string;
            endDate: string;
            registrationEnd: string;
            location: string;
            venue: string;
            maxParticipants: number;
            skillLevel: string;
            participantFee: number;
            currentParticipants: number;
            availableSlots: number;
            daysUntilRegistrationEnd: number;
            playerEligible: boolean;
          }>;
          playerInfo: {
            eloRating: number;
            skillLevel: string;
          };
        };
      },
      void
    >({
      query: () => ({
        url: '/player-tournaments/available',
        method: 'GET',
      }),
      providesTags: ['AvailableTournaments'],
    }),

    applyToTournament: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          participantId: string;
          tournament: {
            name: string;
            participantFee: number;
          };
          eventType: string;
          approvalStatus: string;
          paymentStatus: string;
          registrationDate: string;
          partner?: {
            name: string;
          };
        };
      },
      {
        tournamentId: string;
        eventType?: string;
        partnerPlayerId?: string;
      }
    >({
      query: ({ tournamentId, ...body }) => ({
        url: `/player-tournaments/${tournamentId}/apply`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AvailableTournaments', 'PlayerApplications'],
    }),

    getPlayerApplications: builder.query<
      {
        success: boolean;
        data: {
          applications: Array<{
            id: string;
            eventType: string;
            approvalStatus: string;
            paymentStatus: string;
            registrationDate: string;
            registrationElo: number;
            tournament: {
              id: string;
              name: string;
              category: string;
              startDate: string;
              endDate: string;
              location: string;
              venue: string;
              participantFee: number;
              status: string;
              posterImage?: string;
            };
            partnerPlayer?: {
              id: string;
              name: string;
              eloRating: number;
            };
          }>;
          meta: {
            total: number;
            playerId: string;
          };
        };
      },
      { status?: string; limit?: number }
    >({
      query: (params = {}) => ({
        url: '/player-tournaments/applications',
        method: 'GET',
        params,
      }),
      providesTags: ['PlayerApplications'],
    }),

    cancelApplication: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          participantId: string;
          tournamentName: string;
        };
      },
      string
    >({
      query: (participantId) => ({
        url: `/player-tournaments/application/${participantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PlayerApplications', 'AvailableTournaments'],
    }),

    // 공개 랭킹
    getPublicRankings: builder.query<
      {
        success: boolean;
        data: {
          players: Array<{
            rank: number;
            name: string;
            province: string;
            district: string;
            eloRating: number;
            skillLevel: string;
            totalMatches: number;
            wins: number;
            losses: number;
            winRate: number;
            consistencyIndex: number;
            performanceIndex: number;
            lastMatchDate?: string;
          }>;
          filters: {
            skillLevel: string;
            province: string;
            limit: number;
          };
          meta: {
            total: number;
            lastUpdated: string;
          };
        };
      },
      {
        skillLevel?: string;
        province?: string;
        limit?: number;
      }
    >({
      query: (params = {}) => ({
        url: '/public/rankings',
        method: 'GET',
        params,
      }),
      providesTags: ['PublicRankings'],
    }),

    // 내 경기 일정 조회
    getPlayerMatches: builder.query<
      {
        success: boolean;
        data: Array<{
          id: string;
          roundName: string;
          matchNumber: number;
          player1Name: string;
          player2Name: string;
          player1Score: number;
          player2Score: number;
          winnerId?: string;
          courtNumber?: number;
          scheduledTime?: string;
          actualStartTime?: string;
          actualEndTime?: string;
          status: string;
          tournament: {
            id: string;
            name: string;
            location: string;
            venue: string;
          };
        }>;
      },
      {
        status?: string;
        tournamentId?: string;
      }
    >({
      query: (params = {}) => ({
        url: '/player-api/matches',
        method: 'GET',
        params,
      }),
      providesTags: ['Match'],
    }),

    // 대회 대진표 조회 (공개)
    getTournamentBracket: builder.query<
      {
        success: boolean;
        data: {
          tournament: {
            id: string;
            name: string;
            status: string;
          };
          brackets: Array<{
            id: string;
            name: string;
            eventType: string;
            type: string;
            maxParticipants: number;
            participants: any;
            bracketData: any;
            status: string;
            matches: Array<{
              id: string;
              roundName: string;
              matchNumber: number;
              player1Name: string;
              player2Name: string;
              player1Score: number;
              player2Score: number;
              winnerId?: string;
              scheduledTime?: string;
              status: string;
            }>;
          }>;
        };
      },
      string
    >({
      query: (tournamentId) => ({
        url: `/public/tournament/${tournamentId}/bracket`,
        method: 'GET',
      }),
      providesTags: (_result, _error, tournamentId) => [
        { type: 'TournamentBracket', id: tournamentId },
      ],
    }),
  }),
});

export const {
  // 인증
  usePlayerLoginMutation,
  usePlayerRegisterMutation,
  
  // 프로필
  useGetPlayerProfileQuery,
  useUpdatePlayerProfileMutation,
  
  // 공개 대회
  useGetPublicTournamentsQuery,
  useGetPublicTournamentDetailQuery,
  
  // 대회 참가
  useGetAvailableTournamentsQuery,
  useApplyToTournamentMutation,
  useGetPlayerApplicationsQuery,
  useCancelApplicationMutation,
  
  // 랭킹
  useGetPublicRankingsQuery,

  // 경기 및 대진표
  useGetPlayerMatchesQuery,
  useGetTournamentBracketQuery,
} = playerApiSlice;