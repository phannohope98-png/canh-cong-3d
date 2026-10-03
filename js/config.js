/* =========================================================
 * CANH CỔNG – BẢO VỆ THẾ GIỚI · Cấu hình game (màn hình NGANG)
 * Mọi thông số cân bằng nằm ở đây.
 * Giáp (armor) & kháng phép (mres) tính theo % giảm sát thương (0 – 0.8).
 * ========================================================= */
window.CONFIG = {
  world: { width: 1800, height: 900 },
  pathWidth: 62,

  match: {
    lives: 20,
    firstWaveDelay: 0,          // 0 = chờ người chơi bấm nút bắt đầu
    nextWaveDelay: 14,
    earlyCallBonusPerSec: 2,    // vàng thưởng / giây khi gọi đợt sớm
    sellRefund: 0.6,
    stars: { three: 18, two: 10 } // số mạng còn lại để đạt sao
  },

  /* ---------------- 5 TRỤ = 5 NHÂN VẬT ----------------
     cost[i] = giá xây (i=0) / giá nâng lên cấp i+1. Cấp 4 có kỹ năng đặc biệt. */
  towers: {
    barracks: {
      name: 'Con Người', short: 'Con người', role: 'TRỤ THÀNH - TRIỆU HỒI LÍNH KIẾM', icon: 'shield', color: '#3d6fc0', kind: 'barracks',
      art: 'soldier', palette: ['#2c4f9a', '#3d6fc0', '#e8c46a', '#8f9aae', '#dfe6f0'],
      soldiers: 3, respawn: 10, engage: 85, rallyRange: 165,
      cost: [70, 110, 160, 230],
      tierNames: ['Trại Lính', 'Đồn Bộ Binh', 'Pháo Đài', 'Sảnh Hiệp Sĩ'],
      levels: [
        { hp: 60, damage: [3, 5], armor: 0, art: 'soldier1' },
        { hp: 100, damage: [6, 9], armor: 0.15, art: 'soldier2' },
        { hp: 160, damage: [10, 14], armor: 0.3, art: 'soldier3' },
        { hp: 250, damage: [16, 22], armor: 0.45, art: 'soldier4', special: 'knight' }
      ],
      gear: ['Kiếm thép', 'Khiên chữ thập', 'Giáp bạc', 'Áo choàng xanh'],
      desc: 'Triệu hồi 3 lính kiếm chặn đường. Lính chết hồi sinh sau 10 giây, đứng yên thì tự hồi máu. Cấp 4: hiệp sĩ giáp nặng.'
    },
    archer: {
      name: 'Elf', short: 'Cung Elf', role: 'TRỤ CUNG - BẮN TÊN TỐC ĐỘ CAO', icon: 'bow', color: '#3f9a52', kind: 'shooter',
      art: 'elf', palette: ['#2f7a44', '#3f8a4a', '#6ab85a', '#c8e0a0', '#f2e6b0'],
      projectile: 'arrow', targetsAir: true, damageType: 'physical',
      cost: [70, 110, 160, 230],
      tierNames: ['Chòi Canh', 'Tháp Gỗ', 'Tháp Ngân Lâm', 'Thánh Điện Thần Xạ'],
      levels: [
        { damage: [6, 9], range: 165, rate: 0.6 },
        { damage: [11, 15], range: 175, rate: 0.55 },
        { damage: [17, 24], range: 190, rate: 0.5 },
        { damage: [26, 34], range: 210, rate: 0.45, special: 'pierce' }
      ],
      gear: ['Cung rồng xanh', 'Ống tên', 'Áo choàng lá', 'Giáp nhẹ'],
      desc: 'Bắn nhanh, trúng cả quân bay. Cấp 4: cứ 4 phát có 1 mũi tên thần gây sát thương gấp 3.'
    },
    artillery: {
      name: 'Người Lùn', short: 'Pháo lùn', role: 'TRỤ PHÁO - SÁT THƯƠNG DIỆN RỘNG', icon: 'bomb', color: '#c0502a', kind: 'shooter',
      art: 'dwarf', palette: ['#a8481e', '#d8682a', '#e89050', '#6a4a30', '#f0c898'],
      projectile: 'bomb', targetsAir: false, damageType: 'physical',
      cost: [110, 150, 200, 270],
      tierNames: ['Ụ Súng Cối', 'Pháo Đồng', 'Pháo Đài Sắt', 'Lò Rèn Sấm Sét'],
      levels: [
        { damage: [8, 15], range: 165, rate: 3.0, aoe: 55 },
        { damage: [16, 28], range: 170, rate: 3.0, aoe: 60 },
        { damage: [28, 44], range: 180, rate: 2.9, aoe: 66 },
        { damage: [42, 66], range: 190, rate: 2.8, aoe: 74, special: 'cluster' }
      ],
      gear: ['Đại pháo', 'Nỏ máy', 'Kính phi công', 'Giáp thợ rèn'],
      desc: 'Bắn đạn nổ lan cả đám. Không bắn được quân bay. Cấp 4: đạn chùm nổ thêm 3 quả nhỏ.'
    },
    mage: {
      name: 'Phù Thủy', short: 'Phù thủy', role: 'TRỤ PHÁP - TẦM XA NHẤT, SÁT THƯƠNG LAN', icon: 'staff', color: '#6a4ac8', kind: 'shooter',
      art: 'mage', palette: ['#3a2a78', '#5a3ab8', '#8a6ae0', '#c8b8f8', '#f0c860'],
      projectile: 'bolt', targetsAir: true, damageType: 'magic',
      cost: [100, 140, 190, 260],
      tierNames: ['Tháp Tập Sự', 'Tháp Phù Thủy', 'Tháp Huyền Bí', 'Đài Tinh Tú'],
      levels: [
        { damage: [12, 20], range: 150, rate: 1.5 },
        { damage: [24, 38], range: 160, rate: 1.45 },
        { damage: [40, 60], range: 170, rate: 1.4 },
        { damage: [62, 86], range: 180, rate: 1.35, special: 'chain' }
      ],
      gear: ['Trượng pha lê', 'Sách phép', 'Áo choàng sao', 'Mũ phù thủy'],
      desc: 'Phép thuật xuyên giáp, cực mạnh với quái giáp dày. Cấp 4: tia phép nảy sang 3 quái.'
    },
    orc: {
      name: 'Orc', short: 'Orc', role: 'TRỤ THỦ - TẤN CÔNG CẬN CHIẾN', icon: 'axe', color: '#7a9a2a', kind: 'brawler',
      art: 'orct', palette: ['#6a2a22', '#a84a38', '#7a9a2a', '#8a8a82', '#d8d0c0'],
      targetsAir: false, damageType: 'physical',
      cost: [90, 130, 180, 250],
      tierNames: ['Chòi Gai Nhọn', 'Lô Cốt Xương', 'Pháo Đài Chiến Tranh', 'Hang Chiến Thần'],
      levels: [
        { damage: [14, 22], range: 92, rate: 0.95, aoe: 48 },
        { damage: [26, 40], range: 100, rate: 0.9, aoe: 54 },
        { damage: [44, 66], range: 108, rate: 0.85, aoe: 60 },
        { damage: [70, 100], range: 118, rate: 0.8, aoe: 68, special: 'stun' }
      ],
      gear: ['Rìu chiến', 'Mũ sừng', 'Đầu sói', 'Áo lông thú'],
      desc: 'Chiến binh Orc vung rìu chém lan cả nhóm quái trong tầm ngắn. Không đánh được quân bay. Cấp 4: cứ 3 đòn làm choáng quái.'
    }
  },

  /* ---------------- ANH HÙNG (chọn 1 trước khi vào trận) ----------------
     ranged: tầm bắn (có = bắn xa). skill.id: kỹ năng riêng. unlock = số Xu để mở khoá. */
  heroes: {
    aldric: {
      name: 'Aldric Tóc Bạc', title: 'Hiệp sĩ Bình Minh', role: 'Cận chiến · Hồi máu đồng đội', race: 'Con người',
      hp: 380, damage: [16, 24], armor: 0.4, speed: 95, attackRate: 0.9, regen: 12, respawn: 15, radius: 15, unlock: 0,
      skill: { id: 'holy', name: 'Thánh Quang', icon: 'sun', cooldown: 18, radius: 95, damage: 90, heal: 0.35 },
      desc: 'Hiệp sĩ cầm đại kiếm. Thánh Quang gây sát thương xung quanh và hồi máu cho quân ta.'
    },
    lyra: {
      name: 'Lyra Gió Bạc', title: 'Xạ thủ Elf', role: 'Bắn xa · Mưa tên diện rộng', race: 'Elf',
      hp: 260, damage: [14, 20], armor: 0.15, speed: 105, attackRate: 0.7, regen: 9, respawn: 14, radius: 14, unlock: 200, range: 175, proj: 'arrow', air: true,
      skill: { id: 'rain', name: 'Mưa Tên', icon: 'bow', cooldown: 20, radius: 130, damage: 130, ticks: 5 },
      desc: 'Bắn tên từ xa, trúng cả quân bay. Mưa Tên trút xuống một vùng, sát thương liên tục.'
    },
    selene: {
      name: 'Selene Nguyệt Quang', title: 'Đại pháp sư', role: 'Phép xa · Làm chậm kẻ địch', race: 'Phù thủy',
      hp: 230, damage: [18, 28], armor: 0.1, speed: 90, attackRate: 1.1, regen: 8, respawn: 15, radius: 14, unlock: 400, range: 160, proj: 'bolt', air: true, type: 'magic',
      skill: { id: 'frost', name: 'Bão Băng', icon: 'frost', cooldown: 22, radius: 135, damage: 85, slow: 0.55, slowTime: 4.5 },
      desc: 'Phép thuật xuyên giáp. Bão Băng gây sát thương phép và làm chậm cả nhóm quái.'
    },
    borin: {
      name: 'Borin Búa Lửa', title: 'Chiến thần Người Lùn', role: 'Cận chiến · Choáng diện rộng', race: 'Người Lùn',
      hp: 520, damage: [20, 30], armor: 0.5, speed: 78, attackRate: 1.15, regen: 14, respawn: 16, radius: 16, unlock: 600,
      skill: { id: 'quake', name: 'Địa Chấn', icon: 'hammer', cooldown: 20, radius: 120, damage: 70, stun: 2.4 },
      desc: 'Chiến binh trâu bò, giáp dày. Địa Chấn làm choáng toàn bộ quái xung quanh.'
    }
  },
  heroMax: 10, heroPerLevel: 0.08, heroLevelXp: [0, 120, 300, 560, 900, 1350, 1900, 2600, 3500, 4600],

  /* ---------------- TRANG BỊ: 4 ô × 3 bậc. Mua bằng Xu, mặc cho từng anh hùng. ---------------- */
  equipment: {
    weapon: { name: 'Vũ khí', icon: 'sword', items: [
      { name: 'Kiếm Sắt Rèn', cost: 120, dmg: 0.12, col: '#c8d0dc' },
      { name: 'Kiếm Bạc Nguyệt', cost: 320, dmg: 0.26, col: '#e8f4ff' },
      { name: 'Thánh Kiếm Bình Minh', cost: 700, dmg: 0.42, col: '#fff0a0', glow: '#ffe060' } ] },
    gloves: { name: 'Găng tay', icon: 'hammer', items: [
      { name: 'Găng Da Thuộc', cost: 100, rate: 0.08, col: '#9a6a3a' },
      { name: 'Găng Thép', cost: 280, rate: 0.17, col: '#aab4c4' },
      { name: 'Găng Vàng Thần', cost: 620, rate: 0.28, col: '#f2c14e' } ] },
    armor: { name: 'Giáp', icon: 'shield', items: [
      { name: 'Giáp Da Cứng', cost: 130, hp: 0.15, arm: 0.03, col: '#8a6a44' },
      { name: 'Giáp Bạc Hộ Mệnh', cost: 340, hp: 0.32, arm: 0.07, col: '#c6d0e0' },
      { name: 'Giáp Rồng Vàng', cost: 740, hp: 0.55, arm: 0.12, col: '#f2c14e' } ] },
    boots: { name: 'Giày', icon: 'fast', items: [
      { name: 'Giày Vải Gió', cost: 90, spd: 0.1, col: '#8a6a44' },
      { name: 'Giày Thép Nhẹ', cost: 240, spd: 0.2, col: '#aab4c4' },
      { name: 'Giày Gió Thần', cost: 560, spd: 0.32, col: '#7fe0ff' } ] }
  },
  startCoins: 200,

  /* ---------------- QUÁI ----------------
     lives: số mạng bị trừ khi lọt qua. flying: bay. ranged: bắn tên vào lính. */
  enemies: {
    goblin:    { name: 'Yêu Tinh',      hp: 55,   speed: 68, armor: 0,   mres: 0,   damage: [2, 4],   rate: 1.0, reward: 9,   lives: 1, radius: 12, desc: 'Nhỏ, nhanh, yếu. Đi thành bầy đông.' },
    orc:       { name: 'Chiến Binh Orc Hắc Ám', hp: 145, speed: 50, armor: 0.3, mres: 0, damage: [6, 10], rate: 1.1, reward: 20, lives: 1, radius: 15, desc: 'Giáp vừa. Pháp sư khắc chế tốt.' },
    orcArcher: { name: 'Cung Thủ Hắc Ám',  hp: 100,  speed: 52, armor: 0.1, mres: 0,   damage: [5, 8],   rate: 1.4, reward: 19,  lives: 1, radius: 14, ranged: 120, desc: 'Bắn tên vào lính ta từ xa.' },
    warg:      { name: 'Sói Warg',      hp: 85,  speed: 112, armor: 0,  mres: 0,   damage: [5, 8],   rate: 0.8, reward: 15,  lives: 1, radius: 16, desc: 'Cực nhanh. Cần lính chặn hoặc tháp cung.' },
    treant:    { name: 'Cây Ma',        hp: 440,  speed: 28, armor: 0.25, mres: 0,  damage: [18, 28], rate: 1.8, reward: 70,  lives: 2, radius: 22, regen: 4, desc: 'Cây cổ thụ hoá quỷ. Chậm nhưng cực trâu.' },
    skeleton:  { name: 'Hiệp Sĩ Xương', hp: 210,  speed: 46, armor: 0.45, mres: 0,  damage: [8, 12],  rate: 1.1, reward: 28,  lives: 1, radius: 15, desc: 'Giáp dày, sát thương vật lý yếu. Dùng phép.' },
    wraith:    { name: 'Linh Ma',       hp: 130,  speed: 54, armor: 0,   mres: 0.3, damage: [0, 0],   rate: 1.0, reward: 28,  lives: 1, radius: 13, flying: true, desc: 'Bay qua đầu lính. Pháo không bắn được, kháng phép.' },
    deathKnight: { name: 'Kỵ Sĩ Tử Thần', hp: 620, speed: 38, armor: 0.55, mres: 0.1, damage: [16, 24], rate: 1.3, reward: 62, lives: 2, radius: 18, desc: 'Hiệp sĩ chết hồi sinh, giáp rất dày.' },
    bandit:    { name: 'Cướp Sa Mạc',   hp: 95,   speed: 76, armor: 0.05, mres: 0, damage: [4, 7],   rate: 0.9, reward: 14,  lives: 1, radius: 13, desc: 'Nhanh nhẹn, đi thành đoàn.' },
    mummy:     { name: 'Xác Ướp',       hp: 310,  speed: 36, armor: 0.2, mres: 0,   damage: [10, 15], rate: 1.4, reward: 38,  lives: 1, radius: 16, regen: 5, desc: 'Quấn băng cổ xưa, tự hồi máu chậm.' },
    scorpion:  { name: 'Bọ Cạp Cát',    hp: 190,  speed: 62, armor: 0.5, mres: 0,   damage: [9, 14],  rate: 1.0, reward: 32,  lives: 1, radius: 16, desc: 'Vỏ cứng như đá. Dùng phép để hạ.' },
    frostWolf: { name: 'Sói Tuyết',     hp: 105,  speed: 118, armor: 0,  mres: 0.1, damage: [5, 9],   rate: 0.8, reward: 17,  lives: 1, radius: 16, desc: 'Lao như bão tuyết.' },
    iceGolem:  { name: 'Người Băng',    hp: 720,  speed: 32, armor: 0.35, mres: 0.2, damage: [24, 36], rate: 1.9, reward: 90, lives: 3, radius: 22, desc: 'Khối băng sống. Tập trung hoả lực.' },
    imp:       { name: 'Quỷ Lửa',       hp: 95,   speed: 66, armor: 0,   mres: 0.2, damage: [0, 0],   rate: 1.0, reward: 22,  lives: 1, radius: 12, flying: true, desc: 'Quỷ nhỏ biết bay, đi thành bầy.' },
    drake:     { name: 'Rồng Lửa',      hp: 540,  speed: 40, armor: 0.15, mres: 0.3, damage: [0, 0],  rate: 1.0, reward: 95,  lives: 3, radius: 22, flying: true, desc: 'Rồng bay trên cao. Cần cung và pháp sư.' },
    magmaGolem:{ name: 'Quái Magma',    hp: 1100, speed: 28, armor: 0.4, mres: 0.35, damage: [30, 44], rate: 2.0, reward: 125, lives: 3, radius: 24, regen: 6, desc: 'Dung nham sống. Giáp dày, kháng phép.' },
    voidling:  { name: 'Quái Hỗn Mang', hp: 165,  speed: 60, armor: 0.1, mres: 0.3, damage: [6, 10],  rate: 1.0, reward: 25,  lives: 1, radius: 13, desc: 'Sinh vật hư vô, kháng phép nhẹ.' },
    voidWalker:{ name: 'Kẻ Dẫn Lối Hư Vô', hp: 500, speed: 44, armor: 0.3, mres: 0.4, damage: [16, 24], rate: 1.3, reward: 58, lives: 2, radius: 17, desc: 'Giáp và kháng phép đều cao.' },
    blackOrc:  { name: 'Hắc Orc',       hp: 375,  speed: 42, armor: 0.6, mres: 0,   damage: [14, 20], rate: 1.3, reward: 45,  lives: 2, radius: 17, desc: 'Giáp cực dày. Dùng phép để hạ.' },
    troll:     { name: 'Troll Hang',    hp: 935, speed: 30, armor: 0.1, mres: 0.25, damage: [30, 45], rate: 2.0, reward: 112,  lives: 3, radius: 24, regen: 6, desc: 'Khổng lồ, tự hồi máu. Tập trung hoả lực.' },
    trollKing: { name: 'Vua Troll Đá',  hp: 5950, speed: 22, armor: 0.3, mres: 0.3, damage: [70, 100], rate: 2.2, reward: 500, lives: 20, radius: 30, boss: true, slam: { every: 8, radius: 110, damage: 60 }, desc: 'Chúa tể vùng núi. Đập đất làm choáng và gây sát thương cả nhóm lính.' },
    voidLord:  { name: 'Chúa Tể Hỗn Mang', hp: 9500, speed: 20, armor: 0.35, mres: 0.35, damage: [90, 130], rate: 2.2, reward: 900, lives: 20, radius: 32, boss: true, slam: { every: 7, radius: 125, damage: 80 }, desc: 'Boss cuối. Xé toạc không gian, choáng cả đội hình.' }
  },

  /* ---------------- NÂNG CẤP BẰNG SAO ---------------- */
  upgrades: {
    barracks:  { name: 'Con Người', icon: 'shield', cost: [1, 1, 2, 2], perLevel: { hp: 0.1, damage: 0.06 },   text: '+10% máu lính, +6% sát thương' },
    archer:    { name: 'Elf',       icon: 'bow',    cost: [1, 1, 2, 2], perLevel: { damage: 0.08, range: 0.04 }, text: '+8% sát thương, +4% tầm' },
    artillery: { name: 'Người Lùn', icon: 'bomb',   cost: [1, 1, 2, 2], perLevel: { damage: 0.08, aoe: 0.05 },  text: '+8% sát thương, +5% vùng nổ' },
    mage:      { name: 'Phù Thủy',  icon: 'staff',  cost: [1, 1, 2, 2], perLevel: { damage: 0.08, range: 0.04 }, text: '+8% sát thương, +4% tầm' },
    orc:       { name: 'Orc',       icon: 'axe',    cost: [1, 1, 2, 2], perLevel: { damage: 0.08, range: 0.04 }, text: '+8% sát thương, +4% tầm chém' }
  },

  /* ---------------- CHIẾN DỊCH: 6 vùng đất ----------------
     paths: các điểm điều khiển (đường cong mềm), thế giới 1800 × 900. Quái vào từ TRÁI, cổng thành ở PHẢI.
     waves: "loại:số[:giãn cách][/cửa]" cách nhau dấu phẩy. spots: số ô xây (tự đặt dọc đường). */
  levels: [
    { name: 'Rừng Xanh', theme: 'forest', diff: 'Dễ - Trung bình', gold: 350, spots: 13,
      story: 'Bầy yêu tinh và thú hoang tràn qua rừng xanh. Hãy dựng trụ giữ con đường về thành!',
      paths: [[[-80, 650], [160, 650], [330, 540], [340, 340], [560, 230], [790, 300], [860, 500], [720, 650], [790, 790], [1060, 800], [1250, 670], [1210, 480], [1390, 340], [1600, 370], [1700, 520], [1790, 520]]],
      waves: ['goblin:8', 'goblin:10,warg:3', 'orc:4,goblin:8', 'warg:6,orcArcher:3', 'treant:1,goblin:10', 'orc:6,warg:5,orcArcher:3', 'treant:2,orc:6'] },
    { name: 'Thành Cổ', theme: 'castle', diff: 'Trung bình - Khó', gold: 520, spots: 14,
      story: 'Tàn quân linh ma chiếm thành cổ. Giữ vững các cây cầu đá và tường thành!',
      paths: [[[-80, 210], [200, 240], [420, 330], [420, 520], [250, 650], [300, 800], [620, 820], [810, 660], [770, 460], [960, 330], [1180, 300], [1300, 460], [1260, 640], [1430, 780], [1640, 700], [1790, 540]]],
      waves: ['skeleton:5', 'goblin:8,skeleton:4', 'wraith:4,skeleton:4', 'skeleton:7,orcArcher:4', 'deathKnight:1,skeleton:6', 'wraith:6,skeleton:8', 'deathKnight:2,wraith:5,skeleton:6', 'deathKnight:2,skeleton:10,wraith:6'] },
    { name: 'Sa Mạc', theme: 'desert', diff: 'Khó', gold: 580, spots: 14,
      story: 'Cướp sa mạc, xác ướp và bọ cạp khổng lồ trỗi dậy từ cồn cát.',
      paths: [[[-80, 450], [250, 420], [470, 260], [720, 300], [770, 520], [570, 660], [630, 800], [910, 780], [1110, 620], [1010, 420], [1210, 250], [1450, 300], [1510, 500], [1360, 640], [1510, 780], [1790, 640]]],
      waves: ['bandit:8', 'bandit:8,mummy:2', 'scorpion:5,bandit:6', 'mummy:4,bandit:8', 'scorpion:6,mummy:3', 'bandit:12,scorpion:6', 'mummy:5,scorpion:8', 'blackOrc:3,mummy:4,scorpion:6', 'blackOrc:3,bandit:12,mummy:5'] },
    { name: 'Băng Giá', theme: 'ice', diff: 'Khó - Rất khó', gold: 660, spots: 15,
      story: 'Hai lối đèo băng giá. Người băng và sói tuyết đang kéo xuống!',
      paths: [[[-80, 190], [250, 180], [450, 310], [610, 450], [820, 450], [1020, 300], [1220, 300], [1350, 480], [1220, 640], [1360, 780], [1560, 720], [1790, 530]],
              [[-80, 730], [250, 750], [450, 620], [610, 450], [820, 450], [1020, 300], [1220, 300], [1350, 480], [1220, 640], [1360, 780], [1560, 720], [1790, 530]]],
      waves: ['frostWolf:8', 'orc:6,frostWolf:5', 'iceGolem:1,frostWolf:6', 'wraith:6,frostWolf:6', 'iceGolem:2,orc:6', 'iceGolem:2,frostWolf:10,wraith:5', 'blackOrc:4,iceGolem:2', 'iceGolem:3,wraith:8,frostWolf:8', 'troll:1,iceGolem:3,frostWolf:10'] },
    { name: 'Núi Lửa', theme: 'lava', diff: 'Rất khó', gold: 740, spots: 15,
      story: 'Quỷ lửa và rồng lửa xổ lên từ miệng núi lửa. Vua Troll đích thân dẫn quân!',
      paths: [[[-80, 150], [300, 200], [500, 380], [400, 560], [640, 700], [900, 600], [1010, 400], [1250, 300], [1450, 450], [1350, 650], [1550, 760], [1790, 600]],
              [[-80, 820], [350, 820], [640, 700], [900, 600], [1010, 400], [1250, 300], [1450, 450], [1350, 650], [1550, 760], [1790, 600]]],
      waves: ['imp:8', 'magmaGolem:1,imp:6', 'drake:2,imp:6', 'blackOrc:4,imp:8', 'magmaGolem:2,drake:2', 'drake:3,imp:10,blackOrc:3', 'magmaGolem:3,drake:3', 'trollKing:1,magmaGolem:2,imp:10'] },
    { name: 'Cổng Hỗn Mang', theme: 'chaos', diff: 'Boss cuối', gold: 820, spots: 16,
      story: 'Trận chiến cuối cùng bên rìa thế giới. Chúa Tể Hỗn Mang đang mở cổng!',
      paths: [[[-80, 450], [250, 450], [400, 250], [700, 200], [900, 350], [700, 520], [900, 660], [1200, 710], [1350, 530], [1200, 340], [1450, 200], [1650, 350], [1790, 450]],
              [[-80, 790], [250, 790], [500, 710], [700, 520], [900, 660], [1200, 710], [1350, 530], [1200, 340], [1450, 200], [1650, 350], [1790, 450]]],
      waves: ['voidling:10', 'voidling:8,voidWalker:2', 'wraith:6,voidWalker:3', 'voidWalker:4,voidling:12', 'drake:3,voidWalker:4', 'magmaGolem:2,voidWalker:5,voidling:8', 'iceGolem:2,drake:4,voidWalker:5', 'deathKnight:3,voidWalker:6,drake:3', 'voidLord:1,voidWalker:6,voidling:12'] }
  ],

  spawnInterval: { goblin: 0.8, orc: 1.3, orcArcher: 1.3, warg: 0.7, treant: 3.5, skeleton: 1.2, wraith: 1.4, deathKnight: 3, bandit: 0.8, mummy: 2, scorpion: 1.1,
    frostWolf: 0.7, iceGolem: 4, imp: 0.8, drake: 3, magmaGolem: 4.5, voidling: 0.8, voidWalker: 2, blackOrc: 2.0, troll: 4.0, trollKing: 1, voidLord: 1 },

  /* Chủ đề từng vùng (màu nền, đường, cây...) */
  themes: {
    forest: { grass: '#6fb040', grass2: '#58963a', dirt: '#cfae78', dirtEdge: '#8d6e45', tree: ['#4f9a3a', '#3f8a32', '#62aa42'], rock: '#a09a8e', water: '#3fb0d8', sky: '#8ac8e8' },
    castle: { grass: '#7aa84e', grass2: '#62903f', dirt: '#b9b2a2', dirtEdge: '#6e6a62', tree: ['#4f8a3a', '#3f7a32', '#5f9a42'], rock: '#9a98a2', water: '#3a9ad0', sky: '#9ac0e8' },
    desert: { grass: '#d8a860', grass2: '#c89448', dirt: '#e6c890', dirtEdge: '#a8743a', tree: ['#6a9a3a', '#5a8a32', '#7aaa42'], rock: '#b8703c', water: '#3aa8c8', sky: '#f0c890' },
    ice:    { grass: '#e2eef8', grass2: '#c8dcec', dirt: '#a9bccc', dirtEdge: '#6a8098', tree: ['#3f7a52', '#2f6a46', '#4a8a5a'], rock: '#8aa0b8', water: '#7ac8f0', sky: '#bcdcf4' },
    lava:   { grass: '#4a3a3a', grass2: '#3a2c2c', dirt: '#7a5a48', dirtEdge: '#c0502a', tree: ['#3a2c2c', '#2e2222', '#4a3838'], rock: '#5a4a48', water: '#ff6a1a', sky: '#5a2a1a' },
    chaos:  { grass: '#3a2a5a', grass2: '#2c1e4a', dirt: '#6a5a9a', dirtEdge: '#b070ff', tree: ['#4a3a7a', '#3a2c6a', '#5a4a8a'], rock: '#4a3a6a', water: '#a050ff', sky: '#1a1030' }
  },

  audioFiles: { music: null }
};
