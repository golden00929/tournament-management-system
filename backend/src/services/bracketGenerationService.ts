import { Participant, TournamentBracket, Match as BracketMatch } from '../types/bracket';
import { prisma } from '../config/database';

export interface Player {
  id: string;
  name: string;
  eloRating: number;
  skillLevel: string;
  province?: string;
  district?: string;
  totalMatches?: number;
  lastMatchDate?: Date | null;
}

export interface Team {
  id: string;
  name: string;
  player1: Player;
  player2: Player;
  teamRating: number;
}

export interface BracketData {
  rounds: Round[];
  totalRounds: number;
  participants: Participant[];
}

export interface Round {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
}


export class BracketGenerationService {
  static async getSpecificParticipants(participantIds: string[]): Promise<Player[]> {
    const participants = await prisma.player.findMany({
      where: {
        id: { in: participantIds }
      },
      select: {
        id: true,
        name: true,
        eloRating: true,
        skillLevel: true,
        province: true,
        district: true,
        totalMatches: true,
        lastMatchDate: true
      },
      orderBy: { eloRating: 'desc' }
    });

    return participants;
  }

  static async getSpecificTeams(teamIds: string[]): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      where: {
        id: { in: teamIds }
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true,
            province: true,
            district: true,
            totalMatches: true,
            lastMatchDate: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true,
            province: true,
            district: true,
            totalMatches: true,
            lastMatchDate: true
          }
        }
      },
      orderBy: { teamRating: 'desc' }
    });

    return teams;
  }

  static seedParticipants(participants: Player[]): Participant[] {
    const sorted = [...participants].sort((a, b) => b.eloRating - a.eloRating);
    
    return sorted.map((participant, index) => ({
      id: participant.id,
      name: participant.name,
      seed: index + 1,
      eloRating: participant.eloRating,
      skillLevel: participant.skillLevel,
      province: participant.province,
      district: participant.district,
      totalMatches: participant.totalMatches,
      lastMatchDate: participant.lastMatchDate
    }));
  }

  static seedTeams(teams: Team[]): Participant[] {
    const sorted = [...teams].sort((a, b) => b.teamRating - a.teamRating);
    
    return sorted.map((team, index) => ({
      id: team.id,
      name: team.name,
      seed: index + 1,
      eloRating: team.teamRating,
      skillLevel: 'team',
      teamId: team.id,
      player1: team.player1,
      player2: team.player2
    }));
  }

  static generateSingleEliminationBracket(participants: Participant[]): BracketData {
    const seededParticipants = participants;
    const totalParticipants = seededParticipants.length;
    
    const totalRounds = Math.ceil(Math.log2(totalParticipants));
    const rounds: Round[] = [];
    let matchNumber = 1;

    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      const roundMatches: BracketMatch[] = [];

      for (let i = 0; i < matchesInRound; i++) {
        let player1Name = 'TBD';
        let player2Name = 'TBD';

        if (round === 1) {
          const player1Index = i * 2;
          const player2Index = i * 2 + 1;
          
          if (player1Index < seededParticipants.length) {
            player1Name = seededParticipants[player1Index].name;
          }
          if (player2Index < seededParticipants.length) {
            player2Name = seededParticipants[player2Index].name;
          }
        }

        roundMatches.push({
          matchNumber: matchNumber++,
          player1Name,
          player2Name,
          position: i % 2 === 0 ? 'upper' : 'lower'
        });
      }

      let roundName = '';
      if (round === totalRounds) {
        roundName = 'Final';
      } else if (round === totalRounds - 1) {
        roundName = 'Semi Final';
      } else if (round === totalRounds - 2) {
        roundName = 'Quarter Final';
      } else {
        roundName = `Round ${round}`;
      }

      rounds.push({
        roundNumber: round,
        roundName,
        matches: roundMatches
      });
    }

    return {
      rounds,
      totalRounds,
      participants: seededParticipants
    };
  }

  static generateRoundRobinBracket(participants: Participant[]): BracketData {
    const seededParticipants = participants;
    const matches: BracketMatch[] = [];
    let matchNumber = 1;

    for (let i = 0; i < seededParticipants.length; i++) {
      for (let j = i + 1; j < seededParticipants.length; j++) {
        matches.push({
          matchNumber: matchNumber++,
          player1Name: seededParticipants[i].name,
          player2Name: seededParticipants[j].name
        });
      }
    }

    return {
      rounds: [{
        roundNumber: 1,
        roundName: 'Round Robin',
        matches
      }],
      totalRounds: 1,
      participants: seededParticipants
    };
  }

  static generateHybridBracket(participants: Participant[], groupSize: number = 4, advancersPerGroup: number = 1): BracketData {
    const seededParticipants = participants;
    const numGroups = Math.ceil(seededParticipants.length / groupSize);
    const rounds: Round[] = [];
    let matchNumber = 1;

    console.log(`🎯 하이브리드 브라켓 생성 - 참가자: ${seededParticipants.length}명, 그룹: ${numGroups}개`);

    const groups: Participant[][] = [];
    for (let i = 0; i < numGroups; i++) {
      groups.push([]);
    }

    // 더 균등한 그룹 배치를 위한 개선된 알고리즘
    seededParticipants.forEach((participant, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].push(participant);
    });

    // 그룹별 참가자 수 로그
    groups.forEach((group, index) => {
      console.log(`  그룹 ${index + 1}: ${group.length}명 - ${group.map(p => p.name).join(', ')}`);
    });

    const groupMatches: BracketMatch[] = [];
    groups.forEach((group, groupIndex) => {
      console.log(`  그룹 ${groupIndex + 1} 매치 생성: ${group.length}명으로 ${group.length * (group.length - 1) / 2}경기`);
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          groupMatches.push({
            matchNumber: matchNumber++,
            player1Name: group[i].name,
            player2Name: group[j].name
          });
        }
      }
    });

    console.log(`📊 총 그룹 스테이지 매치: ${groupMatches.length}개`);

    rounds.push({
      roundNumber: 1,
      roundName: 'Group Stage',
      matches: groupMatches
    });

    const totalAdvancers = numGroups * advancersPerGroup;
    const elimRounds = Math.ceil(Math.log2(totalAdvancers));

    console.log(`🏆 토너먼트 스테이지: ${totalAdvancers}명 진출, ${elimRounds}라운드 필요`);

    for (let round = 1; round <= elimRounds; round++) {
      const matchesInRound = Math.pow(2, elimRounds - round);
      
      // 진출자 수에 따른 정확한 라운드명 설정
      let roundName = '';
      const remainingPlayers = totalAdvancers / Math.pow(2, round - 1);
      
      console.log(`  라운드 ${round}: ${matchesInRound}경기, ${remainingPlayers}명 → ${remainingPlayers/2}명`);
      
      if (remainingPlayers === 2) {
        roundName = 'finals';
      } else if (remainingPlayers === 4) {
        roundName = 'semi_finals';
      } else if (remainingPlayers === 8) {
        roundName = 'quarter_finals';
      } else if (remainingPlayers === 16) {
        roundName = 'round_of_16';
      } else if (remainingPlayers === 32) {
        roundName = 'round_of_32';
      } else {
        roundName = `elimination_round_${Math.floor(remainingPlayers)}`;
      }

      const elimRound: Round = {
        roundNumber: round + 1,
        roundName,
        matches: []
      };

      for (let i = 0; i < matchesInRound; i++) {
        elimRound.matches.push({
          matchNumber: matchNumber++,
          player1Name: round === 1 ? `Group ${Math.floor(i*2/advancersPerGroup) + 1} ${(i*2)%advancersPerGroup + 1}위` : 'TBD',
          player2Name: round === 1 ? `Group ${Math.floor((i*2+1)/advancersPerGroup) + 1} ${((i*2+1)%advancersPerGroup) + 1}위` : 'TBD',
          position: i % 2 === 0 ? 'upper' : 'lower'
        });
      }

      rounds.push(elimRound);
    }

    return {
      rounds,
      totalRounds: rounds.length,
      participants: seededParticipants
    };
  }

  static async generateBracketWithParticipants(
    tournamentId: string,
    participantIds: string[],
    eventType: string = 'singles',
    bracketName?: string,
    tournamentType?: string,
    groupSize?: number,
    advancersPerGroup?: number
  ): Promise<TournamentBracket> {
    const participants = await this.getSpecificParticipants(participantIds);
    
    if (participants.length < 2) {
      throw new Error('최소 2명의 참가자가 필요합니다.');
    }

    console.log(`구성된 대진표: ${participants.length}명의 참가자로 생성`);
    participants.forEach(p => {
      console.log(`- ${p.name} (ELO: ${p.eloRating})`);
    });

    const seededParticipants = this.seedParticipants(participants);
    
    let bracketData: BracketData;
    let type = tournamentType || 'single_elimination';
    
    switch (type) {
      case 'round_robin':
        bracketData = this.generateRoundRobinBracket(seededParticipants);
        break;
      case 'hybrid':
        bracketData = this.generateHybridBracket(seededParticipants, groupSize, advancersPerGroup);
        break;
      default:
        bracketData = this.generateSingleEliminationBracket(seededParticipants);
        type = 'single_elimination';
    }

    const minRating = Math.min(...seededParticipants.map(p => p.eloRating));
    const maxRating = Math.max(...seededParticipants.map(p => p.eloRating));

    const bracket = await prisma.bracket.create({
      data: {
        tournamentId,
        name: bracketName || `${eventType === 'doubles' ? '복식' : '단식'} 대진표`,
        eventType,
        skillLevelMin: minRating,
        skillLevelMax: maxRating,
        type,
        maxParticipants: seededParticipants.length,
        participants: JSON.stringify(seededParticipants),
        bracketData: JSON.stringify(bracketData),
        status: 'published'
      }
    });

    const matches = [];
    for (const round of bracketData.rounds) {
      for (const match of round.matches) {
        const player1 = seededParticipants.find(p => p.name === match.player1Name);
        const player2 = seededParticipants.find(p => p.name === match.player2Name);

        matches.push({
          tournamentId,
          bracketId: bracket.id,
          roundName: round.roundName,
          matchNumber: match.matchNumber,
          player1Id: player1?.id || null,
          player2Id: player2?.id || null,
          player1Name: match.player1Name,
          player2Name: match.player2Name,
          status: 'scheduled'
        });
      }
    }

    if (matches.length > 0) {
      await prisma.match.createMany({
        data: matches
      });
    }

    return {
      id: bracket.id,
      tournamentId: bracket.tournamentId,
      name: bracket.name,
      eventType: bracket.eventType as 'singles' | 'doubles',
      skillLevelMin: bracket.skillLevelMin,
      skillLevelMax: bracket.skillLevelMax,
      type: bracket.type as 'single_elimination' | 'double_elimination' | 'round_robin' | 'hybrid',
      maxParticipants: bracket.maxParticipants,
      participants: seededParticipants,
      bracketData,
      status: bracket.status as 'draft' | 'published' | 'ongoing' | 'completed',
      createdAt: bracket.createdAt,
      updatedAt: bracket.updatedAt
    };
  }

  static async generateDoublesBracketWithTeams(
    tournamentId: string,
    teamIds: string[],
    eventType: string = 'doubles',
    bracketName?: string,
    tournamentType?: string,
    groupSize?: number,
    advancersPerGroup?: number
  ): Promise<TournamentBracket> {
    const teams = await this.getSpecificTeams(teamIds);
    
    if (teams.length < 2) {
      throw new Error('최소 2개의 팀이 필요합니다.');
    }

    console.log(`복식 대진표: ${teams.length}개 팀으로 생성`);
    teams.forEach(t => {
      console.log(`- ${t.name} (팀 ELO: ${t.teamRating}) [${t.player1.name}/${t.player2.name}]`);
    });

    const seededParticipants = this.seedTeams(teams);
    
    let bracketData: BracketData;
    let type = tournamentType || 'single_elimination';
    
    switch (type) {
      case 'round_robin':
        bracketData = this.generateRoundRobinBracket(seededParticipants);
        break;
      case 'hybrid':
        bracketData = this.generateHybridBracket(seededParticipants, groupSize, advancersPerGroup);
        break;
      default:
        bracketData = this.generateSingleEliminationBracket(seededParticipants);
        type = 'single_elimination';
    }

    const minRating = Math.min(...seededParticipants.map(p => p.eloRating));
    const maxRating = Math.max(...seededParticipants.map(p => p.eloRating));

    const bracket = await prisma.bracket.create({
      data: {
        tournamentId,
        name: bracketName || '복식 대진표',
        eventType,
        skillLevelMin: minRating,
        skillLevelMax: maxRating,
        type,
        maxParticipants: seededParticipants.length,
        participants: JSON.stringify(seededParticipants),
        bracketData: JSON.stringify(bracketData),
        status: 'published'
      }
    });

    const matches = [];
    for (const round of bracketData.rounds) {
      for (const match of round.matches) {
        const team1 = seededParticipants.find(p => p.name === match.player1Name);
        const team2 = seededParticipants.find(p => p.name === match.player2Name);

        matches.push({
          tournamentId,
          bracketId: bracket.id,
          roundName: round.roundName,
          matchNumber: match.matchNumber,
          player1Id: team1?.id || null,
          player2Id: team2?.id || null,
          player1Name: match.player1Name,
          player2Name: match.player2Name,
          status: 'scheduled'
        });
      }
    }

    if (matches.length > 0) {
      await prisma.match.createMany({
        data: matches
      });
    }

    return {
      id: bracket.id,
      tournamentId: bracket.tournamentId,
      name: bracket.name,
      eventType: bracket.eventType as 'singles' | 'doubles',
      skillLevelMin: bracket.skillLevelMin,
      skillLevelMax: bracket.skillLevelMax,
      type: bracket.type as 'single_elimination' | 'double_elimination' | 'round_robin' | 'hybrid',
      maxParticipants: bracket.maxParticipants,
      participants: seededParticipants,
      bracketData,
      status: bracket.status as 'draft' | 'published' | 'ongoing' | 'completed',
      createdAt: bracket.createdAt,
      updatedAt: bracket.updatedAt
    };
  }

  static async generateRoundRobinBracketWithParticipants(
    tournamentId: string,
    participantIds: string[],
    eventType: string = 'singles'
  ): Promise<TournamentBracket> {
    const participants = await this.getSpecificParticipants(participantIds);
    
    if (participants.length < 2) {
      throw new Error('최소 2명의 참가자가 필요합니다.');
    }

    console.log(`라운드로빈 대진표: ${participants.length}명의 참가자로 생성`);
    participants.forEach(p => {
      console.log(`- ${p.name} (ELO: ${p.eloRating})`);
    });

    const seededParticipants = this.seedParticipants(participants);
    const bracketData = this.generateRoundRobinBracket(seededParticipants);

    const minRating = Math.min(...seededParticipants.map(p => p.eloRating));
    const maxRating = Math.max(...seededParticipants.map(p => p.eloRating));

    const bracket = await prisma.bracket.create({
      data: {
        tournamentId,
        name: `${eventType === 'doubles' ? '복식' : '단식'} 리그전`,
        eventType,
        skillLevelMin: minRating,
        skillLevelMax: maxRating,
        type: 'round_robin',
        maxParticipants: seededParticipants.length,
        participants: JSON.stringify(seededParticipants),
        bracketData: JSON.stringify(bracketData),
        status: 'published'
      }
    });

    const matches = [];
    for (const round of bracketData.rounds) {
      for (const match of round.matches) {
        const player1 = seededParticipants.find(p => p.name === match.player1Name);
        const player2 = seededParticipants.find(p => p.name === match.player2Name);

        matches.push({
          tournamentId,
          bracketId: bracket.id,
          roundName: round.roundName,
          matchNumber: match.matchNumber,
          player1Id: player1?.id || null,
          player2Id: player2?.id || null,
          player1Name: match.player1Name,
          player2Name: match.player2Name,
          status: 'scheduled'
        });
      }
    }

    if (matches.length > 0) {
      await prisma.match.createMany({
        data: matches
      });
    }

    return {
      id: bracket.id,
      tournamentId: bracket.tournamentId,
      name: bracket.name,
      eventType: bracket.eventType as 'singles' | 'doubles',
      skillLevelMin: bracket.skillLevelMin,
      skillLevelMax: bracket.skillLevelMax,
      type: bracket.type as 'single_elimination' | 'double_elimination' | 'round_robin' | 'hybrid',
      maxParticipants: bracket.maxParticipants,
      participants: seededParticipants,
      bracketData,
      status: bracket.status as 'draft' | 'published' | 'ongoing' | 'completed',
      createdAt: bracket.createdAt,
      updatedAt: bracket.updatedAt
    };
  }

  static async generateHybridBracketWithParticipants(
    tournamentId: string,
    participantIds: string[],
    eventType: string = 'singles',
    groupSize: number = 4,
    advancersPerGroup: number = 1
  ): Promise<TournamentBracket> {
    const participants = await this.getSpecificParticipants(participantIds);
    
    if (participants.length < groupSize) {
      throw new Error(`하이브리드 토너먼트에는 최소 ${groupSize}명의 참가자가 필요합니다.`);
    }

    console.log(`하이브리드 대진표: ${participants.length}명의 참가자로 생성 (그룹 크기: ${groupSize}, 그룹당 진출자: ${advancersPerGroup})`);
    participants.forEach(p => {
      console.log(`- ${p.name} (ELO: ${p.eloRating})`);
    });

    const seededParticipants = this.seedParticipants(participants);
    const bracketData = this.generateHybridBracket(seededParticipants, groupSize, advancersPerGroup);

    const minRating = Math.min(...seededParticipants.map(p => p.eloRating));
    const maxRating = Math.max(...seededParticipants.map(p => p.eloRating));

    const bracket = await prisma.bracket.create({
      data: {
        tournamentId,
        name: `${eventType === 'doubles' ? '복식' : '단식'} 하이브리드 토너먼트`,
        eventType,
        skillLevelMin: minRating,
        skillLevelMax: maxRating,
        type: 'hybrid',
        maxParticipants: seededParticipants.length,
        participants: JSON.stringify(seededParticipants),
        bracketData: JSON.stringify(bracketData),
        status: 'published'
      }
    });

    const matches = [];
    for (const round of bracketData.rounds) {
      for (const match of round.matches) {
        const player1 = seededParticipants.find(p => p.name === match.player1Name);
        const player2 = seededParticipants.find(p => p.name === match.player2Name);

        matches.push({
          tournamentId,
          bracketId: bracket.id,
          roundName: round.roundName,
          matchNumber: match.matchNumber,
          player1Id: player1?.id || null,
          player2Id: player2?.id || null,
          player1Name: match.player1Name,
          player2Name: match.player2Name,
          status: 'scheduled'
        });
      }
    }

    if (matches.length > 0) {
      await prisma.match.createMany({
        data: matches
      });
    }

    return {
      id: bracket.id,
      tournamentId: bracket.tournamentId,
      name: bracket.name,
      eventType: bracket.eventType as 'singles' | 'doubles',
      skillLevelMin: bracket.skillLevelMin,
      skillLevelMax: bracket.skillLevelMax,
      type: bracket.type as 'single_elimination' | 'double_elimination' | 'round_robin' | 'hybrid',
      maxParticipants: bracket.maxParticipants,
      participants: seededParticipants,
      bracketData,
      status: bracket.status as 'draft' | 'published' | 'ongoing' | 'completed',
      createdAt: bracket.createdAt,
      updatedAt: bracket.updatedAt
    };
  }

  static async generateBalancedBrackets(
    tournamentId: string,
    eventType: string = 'singles',
    bracketSize: number = 32
  ) {
    // 승인된 참가자들 가져오기
    const approvedParticipants = await prisma.participant.findMany({
      where: {
        tournamentId,
        approvalStatus: 'approved',
        paymentStatus: 'completed',
        isActive: true
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true,
            province: true,
            district: true
          }
        }
      }
    });

    if (approvedParticipants.length === 0) {
      throw new Error('승인된 참가자가 없습니다.');
    }

    // 참가자 수에 따라 조별 리그 설정 결정
    const participantCount = approvedParticipants.length;
    let groupSize = 4;
    let advancersPerGroup = 1; // 기본값을 1로 설정

    // 하이브리드 대진표: 조별 리그 + 토너먼트
    const players = approvedParticipants.map(p => ({
      id: p.player.id,
      name: p.player.name,
      eloRating: p.player.eloRating,
      skillLevel: p.player.skillLevel,
      province: p.player.province,
      district: p.player.district
    }));

    // 그룹 생성 (4명씩)
    const numGroups = Math.ceil(participantCount / groupSize);
    const groups = [];
    
    // 시드 배치를 위해 ELO 순으로 정렬
    const seededPlayers = players.sort((a, b) => b.eloRating - a.eloRating);
    
    // 그룹 초기화
    for (let i = 0; i < numGroups; i++) {
      groups.push([]);
    }
    
    // 균형잡힌 그룹 배치 (순차적으로 배치)
    seededPlayers.forEach((player, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].push(player);
    });

    return {
      groups,
      statistics: {
        totalParticipants: participantCount,
        groupCount: numGroups,
        groupSize,
        advancersPerGroup,
        tournamentParticipants: numGroups * advancersPerGroup
      },
      bracketStructure: {
        groupStage: {
          groups: groups.map((group, index) => ({
            groupId: `Group_${String.fromCharCode(65 + index)}`, // A, B, C, ...
            players: group
          }))
        },
        knockoutStage: {
          startRound: this.getTournamentStartRound(numGroups * advancersPerGroup)
        }
      }
    };
  }

  static getTournamentStartRound(participantCount: number): string {
    switch (participantCount) {
      case 2: return 'finals';
      case 4: return 'semi_finals';
      case 8: return 'quarter_finals';
      case 16: return 'round_of_16';
      case 32: return 'round_of_32';
      default: 
        if (participantCount <= 8) return 'quarter_finals';
        if (participantCount <= 16) return 'round_of_16';
        return 'round_of_32';
    }
  }

  static validateBracketFairness(groups: any[]) {
    // 간단한 공정성 검증
    let totalElo = 0;
    let playerCount = 0;
    
    groups.forEach(group => {
      group.forEach(player => {
        totalElo += player.eloRating;
        playerCount++;
      });
    });
    
    const averageElo = totalElo / playerCount;
    
    // 그룹별 평균 ELO 차이 계산
    const groupAverages = groups.map(group => {
      const groupTotal = group.reduce((sum, player) => sum + player.eloRating, 0);
      return groupTotal / group.length;
    });
    
    const maxDiff = Math.max(...groupAverages) - Math.min(...groupAverages);
    const fairnessScore = Math.max(0, 100 - (maxDiff / 10)); // 차이가 클수록 점수 하락
    
    return {
      isValid: fairnessScore >= 50,
      score: fairnessScore,
      issues: fairnessScore < 50 ? ['그룹 간 실력 차이가 큽니다.'] : []
    };
  }
}