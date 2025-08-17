const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 베트남 성씨와 이름
const vietnameseSurnames = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Kiều', 'Đinh', 'Mai', 'Lưu'
];

const vietnameseMaleNames = [
  'Minh Anh', 'Quang Huy', 'Đức Thịnh', 'Hoàng Long', 'Tuấn Kiệt', 'Minh Tuệ', 
  'Thành Đạt', 'Quang Vinh', 'Hải Đăng', 'Minh Quân', 'Gia Bảo', 'Thanh Tùng',
  'Văn Hưng', 'Minh Thiện', 'Quang Trường', 'Văn Thọ', 'Minh Hoàng', 'Văn Toàn',
  'Quang Bảo', 'Văn Thắng', 'Đức Nam', 'Hoàng Phúc', 'Minh Đức', 'Văn Tú'
];

const vietnameseFemaleNames = [
  'Thị Lan', 'Minh Châu', 'Thị Hương', 'Phương Anh', 'Thị Trang', 'Minh Thư',
  'Thị Yến', 'Phương Linh', 'Thị My', 'Minh Ngọc', 'Thị Tuyết', 'Phương Thảo',
  'Thị Phương', 'Minh Hằng', 'Thị Hà', 'Phương Dung', 'Thị Kim', 'Minh Tâm',
  'Thị Mai', 'Phương Nam', 'Thị Diệu', 'Minh Hạnh', 'Thị Xuân', 'Phương Vy'
];

// 베트남 지역 (성 - 구)
const vietnameseProvinces = [
  { province: 'TP. Hồ Chí Minh', districts: ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 'Quận Bình Thạnh', 'Quận Tân Bình', 'Quận Phú Nhuận'] },
  { province: 'Hà Nội', districts: ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Long Biên', 'Nam Từ Liêm'] },
  { province: 'Đà Nẵng', districts: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ'] },
  { province: 'Cần Thơ', districts: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'] },
  { province: 'Hải Phòng', districts: ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An'] },
  { province: 'Biên Hòa', districts: ['Thành phố Biên Hòa', 'Long Thành', 'Nhon Trach', 'Trảng Bom'] }
];

// 베트남 핸드폰 번호 형식
const vietnamesePhonePrefixes = ['084', '085', '088', '091', '094', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'];

// 실력 등급별 ELO 범위
const skillLevels = [
  { level: 'd_class', minElo: 1000, maxElo: 1499, weight: 0.4 }, // 40% 초급
  { level: 'c_class', minElo: 1500, maxElo: 1999, weight: 0.35 }, // 35% 중급
  { level: 'b_class', minElo: 2000, maxElo: 2499, weight: 0.2 }, // 20% 고급  
  { level: 'a_class', minElo: 2500, maxElo: 3000, weight: 0.05 } // 5% 전문가
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSkillLevelByWeight() {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (const skill of skillLevels) {
    cumulativeWeight += skill.weight;
    if (random <= cumulativeWeight) {
      return skill;
    }
  }
  return skillLevels[0]; // fallback
}

function generateVietnamesePhoneNumber() {
  const prefix = getRandomElement(vietnamesePhonePrefixes);
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+84${prefix.slice(2)}${suffix}`;
}

function generateEmail(name) {
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove Vietnamese diacritics
  
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const randomSuffix = Math.floor(Math.random() * 1000);
  
  return `${cleanName}${randomSuffix}@${getRandomElement(domains)}`;
}

function generateBirthDate() {
  const currentYear = new Date().getFullYear();
  const minAge = 16; // 최소 16세
  const maxAge = 60; // 최대 60세
  
  const birthYear = currentYear - getRandomNumber(minAge, maxAge);
  const month = getRandomNumber(1, 12);
  const day = getRandomNumber(1, 28); // 간단하게 28일까지만
  
  return new Date(birthYear, month - 1, day);
}

async function createSamplePlayers() {
  console.log('🏸 베트남 배드민턴 선수 100명 생성 시작...');
  
  const players = [];
  
  for (let i = 0; i < 100; i++) {
    const isMale = Math.random() > 0.45; // 55% 남성, 45% 여성
    const surname = getRandomElement(vietnameseSurnames);
    const firstName = isMale 
      ? getRandomElement(vietnameseMaleNames)
      : getRandomElement(vietnameseFemaleNames);
    
    const fullName = `${surname} ${firstName}`;
    const provinceData = getRandomElement(vietnameseProvinces);
    const skillData = getSkillLevelByWeight();
    const eloRating = getRandomNumber(skillData.minElo, skillData.maxElo);
    const birthDate = generateBirthDate();
    
    // 경기 경험 시뮬레이션 (ELO가 높을수록 더 많은 경기)
    const baseMatches = Math.floor(eloRating / 100) - 5; // 1000 ELO = 5경기, 2500 ELO = 20경기
    const totalMatches = Math.max(0, getRandomNumber(baseMatches, baseMatches + 15));
    const winRate = 0.35 + (eloRating - 1000) / 2000 * 0.30; // 1000 ELO = 35% 승률, 3000 ELO = 65% 승률
    const wins = Math.floor(totalMatches * winRate);
    const losses = totalMatches - wins;
    
    const player = {
      name: fullName,
      email: generateEmail(fullName),
      phone: generateVietnamesePhoneNumber(),
      birthDate: birthDate,
      birthYear: birthDate.getFullYear(),
      gender: isMale ? 'male' : 'female',
      province: provinceData.province,
      district: getRandomElement(provinceData.districts),
      address: `${getRandomNumber(1, 999)} Đường ${getRandomElement(['Nguyễn Văn Cừ', 'Lê Lợi', 'Trần Hưng Đạo', 'Nguyễn Huệ', 'Đồng Khởi', 'Lý Tự Trọng', 'Hai Bà Trưng'])}`,
      emergencyContact: `${getRandomElement(vietnameseSurnames)} ${isMale ? getRandomElement(vietnameseFemaleNames) : getRandomElement(vietnameseMaleNames)}`,
      emergencyPhone: generateVietnamesePhoneNumber(),
      eloRating: eloRating,
      skillLevel: skillData.level,
      confidenceIndex: Math.round((50 + (eloRating - 1000) / 20) * 100) / 100, // 50-150 범위
      totalMatches: totalMatches,
      wins: wins,
      losses: losses,
      lastMatchDate: totalMatches > 0 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null, // 최근 90일 내
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // 최근 1년 내 등록
      isActive: true,
      password: null, // 관리자가 등록한 선수들은 비밀번호 없음
      isVerified: false,
      verifyToken: null
    };
    
    players.push(player);
  }
  
  try {
    console.log('📝 데이터베이스에 선수 정보 저장 중...');
    
    // 배치로 삽입하여 성능 향상
    const batchSize = 10;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      await prisma.player.createMany({
        data: batch
      });
      console.log(`✅ ${Math.min(i + batchSize, players.length)}/100 명 저장 완료`);
    }
    
    console.log('🎯 샘플 선수 100명 생성 완료!');
    console.log('\n📊 생성된 선수 통계:');
    
    // 통계 조회
    const stats = await prisma.player.groupBy({
      by: ['skillLevel'],
      where: { isActive: true },
      _count: {
        id: true
      }
    });
    
    stats.forEach(stat => {
      const levelName = {
        'a_class': 'Group A (Expert)',
        'b_class': 'Group B (Advanced)', 
        'c_class': 'Group C (Intermediate)',
        'd_class': 'Group D (Beginner)'
      }[stat.skillLevel] || stat.skillLevel;
      
      console.log(`   ${levelName}: ${stat._count.id}명`);
    });
    
    const totalPlayers = await prisma.player.count({ where: { isActive: true } });
    console.log(`\n🏸 총 등록 선수: ${totalPlayers}명`);
    
  } catch (error) {
    console.error('❌ 선수 생성 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
createSamplePlayers()
  .then(() => {
    console.log('\n🚀 베트남 배드민턴 선수 데이터 생성 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });