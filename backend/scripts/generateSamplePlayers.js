const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 베트남 이름 데이터
const vietnameseNames = {
  male: [
    'Nguyễn Văn Minh', 'Trần Thanh Sơn', 'Lê Hoàng Nam', 'Phạm Đức Anh', 'Hoàng Văn Thành',
    'Vũ Minh Tú', 'Đặng Quốc Huy', 'Bùi Văn Long', 'Đỗ Thanh Tùng', 'Lý Văn Đức',
    'Ngô Minh Khoa', 'Tạ Văn Hải', 'Mai Quang Vinh', 'Chu Văn Tân', 'Võ Minh Tuấn',
    'Đinh Văn Phong', 'Dương Quang Hưng', 'Lưu Văn Khánh', 'Trịnh Minh Đức', 'Phan Văn Thắng',
    'Cao Thanh Bình', 'Lại Văn Tú', 'Hồ Minh Quân', 'Tô Văn Hiếu', 'Huỳnh Quang Duy',
    'Từ Văn Lâm', 'Thái Minh Nhật', 'Hà Văn Cường', 'Lương Quang Hải', 'Kiều Văn Toàn',
    'Ông Minh Trí', 'Tăng Văn Phúc', 'Bạch Quang Thịnh', 'Uông Văn Tiến', 'Âu Minh Đạt',
    'Khương Văn Hùng', 'Ưng Quang Thành', 'Ỷ Văn Khôi', 'Ê Minh Thiện', 'Ố Quang Trường',
    'Nguyễn Minh Hoàng', 'Trần Văn Tính', 'Lê Quang Bảo', 'Phạm Văn Thiệu', 'Hoàng Minh Tuệ',
    'Vũ Quang Linh', 'Đặng Văn Thuận', 'Bùi Minh Khôi', 'Đỗ Quang Nghĩa', 'Lý Văn Thọ'
  ],
  female: [
    'Nguyễn Thị Hương', 'Trần Thị Lan', 'Lê Thị Mai', 'Phạm Thị Hoa', 'Hoàng Thị Linh',
    'Vũ Thị Thu', 'Đặng Thị Ngọc', 'Bùi Thị Yến', 'Đỗ Thị Thanh', 'Lý Thị Xuân',
    'Ngô Thị Hồng', 'Tạ Thị Bích', 'Mai Thị Phương', 'Chu Thị Dung', 'Võ Thị Kim',
    'Đinh Thị Vân', 'Dương Thị Ánh', 'Lưu Thị Trang', 'Trịnh Thị Oanh', 'Phan Thị Thúy',
    'Cao Thị Minh', 'Lại Thị Nga', 'Hồ Thị Diệu', 'Tô Thị Hạnh', 'Huỳnh Thị Nhi',
    'Từ Thị Cẩm', 'Thái Thị Loan', 'Hà Thị Tuyết', 'Lương Thị Kiều', 'Kiều Thị Hà',
    'Ông Thị Nhung', 'Tăng Thị Thảo', 'Bạch Thị Quỳnh', 'Uông Thị Trúc', 'Âu Thị My',
    'Khương Thị Hiền', 'Ưng Thị Vui', 'Ỷ Thị Đào', 'Ê Thị Sen', 'Ố Thị Cúc',
    'Nguyễn Thị An', 'Trần Thị Bảo', 'Lê Thị Cầm', 'Phạm Thị Duyên', 'Hoàng Thị Em',
    'Vũ Thị Phượng', 'Đặng Thị Giang', 'Bùi Thị Hằng', 'Đỗ Thị Ý', 'Lý Thị Kha'
  ]
};

// 호치민시 구역
const districts = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 
  'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp',
  'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú', 'Quận Thủ Đức', 'Quận Bình Tân',
  'Huyện Bình Chánh', 'Huyện Cần Giờ', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè'
];

// 실력 등급별 ELO 범위
const skillLevels = {
  'a_class': { min: 2500, max: 3000 },  // Group A
  'b_class': { min: 2000, max: 2499 },  // Group B  
  'c_class': { min: 1500, max: 1999 },  // Group C
  'd_class': { min: 1000, max: 1499 }   // Group D
};

// 스킬 레벨 분포 (현실적인 분포)
const skillDistribution = [
  { level: 'a_class', count: 5 },   // 5%
  { level: 'b_class', count: 15 },  // 15%
  { level: 'c_class', count: 40 },  // 40%
  { level: 'd_class', count: 40 }   // 40%
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomEloRating(skillLevel) {
  const range = skillLevels[skillLevel];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function generatePhoneNumber() {
  // 베트남 휴대폰 번호 형식: 09x, 08x, 07x, 05x, 03x + 8자리
  const prefixes = ['090', '091', '094', '083', '084', '085', '081', '082', '078', '079', '077', '076', '056', '058', '059', '032', '033', '034', '035', '036', '037', '038', '039'];
  const prefix = getRandomElement(prefixes);
  const suffix = Math.floor(10000000 + Math.random() * 90000000); // 8자리 숫자
  return prefix + suffix.toString();
}

function generateEmail(name) {
  const cleanName = name.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/[đ]/g, 'd');
  
  const randomNum = Math.floor(Math.random() * 1000);
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  return `${cleanName}${randomNum}@${getRandomElement(domains)}`;
}

async function generateSamplePlayers() {
  console.log('🏸 선수 샘플 데이터 생성 시작...');
  
  const players = [];
  let playerIndex = 0;
  
  // 스킬 레벨별로 선수 생성
  for (const { level, count } of skillDistribution) {
    for (let i = 0; i < count; i++) {
      const gender = Math.random() < 0.6 ? 'male' : 'female'; // 60% 남성, 40% 여성
      const nameArray = vietnameseNames[gender];
      const name = getRandomElement(nameArray);
      const email = generateEmail(name);
      const phone = generatePhoneNumber();
      const district = getRandomElement(districts);
      const birthYear = 1980 + Math.floor(Math.random() * 25); // 1980-2004년생
      const eloRating = getRandomEloRating(level);
      
      // 실제 경기 통계 생성
      const totalMatches = Math.floor(Math.random() * 50) + 5; // 5-54경기
      const winRate = 0.3 + Math.random() * 0.4; // 30-70% 승률
      const wins = Math.floor(totalMatches * winRate);
      const losses = totalMatches - wins;
      
      const player = {
        name,
        email,
        phone,
        birthYear,
        birthDate: new Date(`${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`),
        gender: gender === 'male' ? 'M' : 'F',
        province: '호치민시',
        district,
        address: `${Math.floor(Math.random() * 500) + 1} Đường ${getRandomElement(['Nguyễn Huệ', 'Lê Lợi', 'Hai Bà Trưng', 'Đông Khởi', 'Nam Kỳ Khởi Nghĩa', 'Võ Văn Tần', 'Cách Mạng Tháng 8', 'Điện Biên Phủ'])}`,
        emergencyContact: `${getRandomElement(['Nguyễn', 'Trần', 'Lê'])} ${getRandomElement(['Văn', 'Thị'])} ${getRandomElement(['An', 'Bình', 'Cường', 'Dung', 'Em'])}`,
        emergencyPhone: generatePhoneNumber(),
        password: await bcrypt.hash('player123', 12), // 모든 샘플 선수 비밀번호: player123
        eloRating,
        skillLevel: level,
        totalMatches,
        wins,
        losses,
        consistencyIndex: Math.round((0.5 + Math.random() * 0.5) * 100) / 100, // 0.5-1.0
        momentumScore: Math.round((0.5 + Math.random() * 0.5) * 100) / 100, // 0.5-1.0
        performanceIndex: Math.round((0.7 + Math.random() * 0.3) * 100) / 100, // 0.7-1.0
        confidenceIndex: Math.round((0.6 + Math.random() * 0.4) * 100) / 100, // 0.6-1.0
        lastMatchDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // 최근 30일 내
        isActive: true,
        isVerified: Math.random() < 0.8, // 80% 인증 완료
        registrationDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000) // 최근 1년 내 가입
      };
      
      players.push(player);
      playerIndex++;
      
      if (playerIndex % 10 === 0) {
        console.log(`✅ ${playerIndex}명 생성 완료...`);
      }
    }
  }
  
  // 데이터베이스에 일괄 삽입
  console.log('💾 데이터베이스에 저장 중...');
  
  for (const player of players) {
    try {
      await prisma.player.create({
        data: player
      });
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  중복 이메일 건너뜀: ${player.email}`);
        continue;
      }
      throw error;
    }
  }
  
  console.log(`🎉 샘플 선수 ${players.length}명 생성 완료!`);
  
  // 통계 출력
  const stats = await prisma.player.groupBy({
    by: ['skillLevel'],
    _count: {
      id: true
    },
    where: {
      isActive: true
    }
  });
  
  console.log('\n📊 선수 등급별 통계:');
  stats.forEach(stat => {
    const levelName = {
      'a_class': 'Group A (Expert)',
      'b_class': 'Group B (Advanced)', 
      'c_class': 'Group C (Intermediate)',
      'd_class': 'Group D (Beginner)'
    }[stat.skillLevel];
    console.log(`  ${levelName}: ${stat._count.id}명`);
  });
  
  const totalPlayers = await prisma.player.count({
    where: { isActive: true }
  });
  
  console.log(`\n🏸 전체 활성 선수: ${totalPlayers}명`);
  console.log('\n💡 모든 샘플 선수 로그인 정보:');
  console.log('   비밀번호: player123');
  console.log('   이메일: 각 선수의 생성된 이메일 주소 사용');
}

async function main() {
  try {
    await generateSamplePlayers();
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();