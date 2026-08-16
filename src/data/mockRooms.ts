import { CollegeInfo, TrendingRoom, ChatMessage, LocationCoords, ReportItem } from '../types';

export const LOCATIONS: Record<string, LocationCoords> = {
  alappuzha: { lat: 9.4981, lng: 76.3388, name: 'Alappuzha Town', area: 'Alappuzha, Kerala' },
  kuttanad: { lat: 9.4216, lng: 76.4024, name: 'Kuttanad Backwaters', area: 'Kuttanad, Kerala' },
  kollam: { lat: 8.8932, lng: 76.6141, name: 'Kollam Junction', area: 'Kollam, Kerala' },
  kochi: { lat: 9.9312, lng: 76.2673, name: 'Kochi Marine Drive', area: 'Ernakulam, Kerala' },
  trivandrum: { lat: 8.5241, lng: 76.9366, name: 'Trivandrum City', area: 'Thiruvananthapuram, Kerala' },
  kozhikode: { lat: 11.2588, lng: 75.7804, name: 'Kozhikode Beach', area: 'Kozhikode, Kerala' },
};

export const COLLEGES: CollegeInfo[] = [
  {
    id: 'campus_network',
    name: 'Campus Network',
    shortName: 'Campus',
    district: 'Kerala',
    studentCount: 5200,
    area: 'Main Campus',
    lat: 9.6842,
    lng: 76.3312,
  },
  {
    id: 'sn_cherthala',
    name: 'SN College Cherthala',
    shortName: 'SN College',
    district: 'Alappuzha',
    studentCount: 3800,
    area: 'Cherthala, Alappuzha',
    lat: 9.6842,
    lng: 76.3312,
  },
  {
    id: 'cusat_kochi',
    name: 'CUSAT Main Campus',
    shortName: 'CUSAT',
    district: 'Kochi',
    studentCount: 8900,
    area: 'South Kalamassery',
    lat: 10.0465,
    lng: 76.3262,
  },
  {
    id: 'cet_trivandrum',
    name: 'College of Engineering Trivandrum',
    shortName: 'CET',
    district: 'Trivandrum',
    studentCount: 4500,
    area: 'Kulathoor, TVM',
    lat: 8.5456,
    lng: 76.9063,
  },
];

// Helper to generate 1000+ realistic Rooms for high-scale testing & live feed
export function generateHighScaleRooms(targetCount: number = 1000, collegeId: string = 'campus_network'): TrendingRoom[] {
  const categories: Array<TrendingRoom['category']> = [
    'fest', 'exam', 'canteen', 'bus', 'placement', 'complaint', 'sports', 'general', 'incident', 'weather', 'local_news'
  ];

  const topics = [
    { title: 'Annual Cultural Fest DJ Night & Star Pass Counter', cat: 'fest' as const, emoji: '🎉', area: 'Main Auditorium Arena', desc: 'Pass distribution, VIP entry gates, line check, artist live updates, and guest passes.' },
    { title: 'Canteen Special Biryani & Tea Rush Counter', cat: 'canteen' as const, emoji: '🍛', area: 'North Canteen Ground', desc: 'Fresh hot batches ready, live counter wait time queue updates, seating alert.' },
    { title: 'Heavy Rain Storm & Campus Waterlogging Alert', cat: 'weather' as const, emoji: '🌧️', area: 'Central Gate & Bus Stand', desc: 'Heavy monsoon downpour warning, bus delays, road clearing and umbrella sharing.' },
    { title: 'Semester University Final Exam Notes & Model QA', cat: 'exam' as const, emoji: '📚', area: 'Central Library Hall 2', desc: 'Module 3 & 4 short notes, previous year question paper answers exchange.' },
    { title: 'Inter-College Football Semi-Finals Live Score', cat: 'sports' as const, emoji: '⚽', area: 'University Sports Ground', desc: 'Live cheer hub, commentary, player substitutes, and post-match ceremony.' },
    { title: 'TCS & Infosys Tier-1 Campus Placement Drive Hub', cat: 'placement' as const, emoji: '💼', area: 'Placement Seminar Hall A', desc: 'Aptitude round results, HR interview rounds checklist, technical questions.' },
    { title: 'Evening KSRTC College Bus Route #42 & #18 Status', cat: 'bus' as const, emoji: '🚍', area: 'Main Gate Bus Bay', desc: 'Real-time bus arrival status, seat availability, traffic jam alerts on highway.' },
    { title: 'Tech Fest Hackathon CodeSprint 24hr Live Lounge', cat: 'fest' as const, emoji: '💻', area: 'IT Innovation Lab 3', desc: 'Team finding, API keys, coffee breaks, project submission leaderboard.' },
    { title: 'Hostel Mess Food Quality & Water Supply Issue', cat: 'complaint' as const, emoji: '⚠️', area: 'Men & Ladies Hostels', desc: 'Official warden report, student representation committee, water tank maintenance.' },
    { title: 'Emergency Blood Donation Camp & Volunteer Call', cat: 'incident' as const, emoji: '🩸', area: 'NSS Campus Office', desc: 'Urgent B+ and O- donor requirements for Taluk Hospital Cherthala.' },
    { title: 'Campus Photography & Reels Club Sunset Spot', cat: 'general' as const, emoji: '📸', area: 'Banyan Tree Lawn', desc: 'Best camera angles, golden hour lighting, lens sharing, campus story tags.' },
    { title: 'Debate Club Open Mic: AI in Higher Education', cat: 'general' as const, emoji: '🎙️', area: 'Open Air Amphitheater', desc: 'Live speaker rounds, audience questions, poll voting on motion topics.' },
  ];

  const usernames = ['arjun_k', 'sneha_cs', 'rahul_ec', 'ananya_m', 'fathima_bio', 'vishnu_mech', 'rohit_bba', 'meera_phy', 'kiran_ce', 'haritha_eng'];

  const rooms: TrendingRoom[] = [];
  const now = Date.now();

  for (let i = 0; i < targetCount; i++) {
    const baseTopic = topics[i % topics.length];
    const roomNum = i + 1;
    const cat = baseTopic.cat;
    const isPrivate = (i % 7 === 0);
    const hasPoll = (i % 4 === 0);
    const activeCount = Math.max(8, Math.floor(Math.random() * 450) + (i < 10 ? 300 : 15));
    const velocityScore = Math.floor(65 + Math.random() * 34) + (i < 5 ? 30 : 0);
    const minutesAgo = Math.floor(Math.random() * 240);
    const timeIso = new Date(now - minutesAgo * 60 * 1000).toISOString();

    const titleSuffix = i >= topics.length ? ` #${roomNum}` : '';
    const creatorUser = usernames[i % usernames.length];

    rooms.push({
      id: `room-scale-${roomNum}`,
      collegeId: (i % 3 === 0) ? 'campus_network' : (i % 3 === 1 ? 'sn_cherthala' : 'cusat_kochi'),
      title: `${baseTopic.title}${titleSuffix}`,
      category: cat,
      roomType: (i % 5 === 0) ? 'auto_trending' : 'student_created',
      emoji: baseTopic.emoji,
      locationArea: baseTopic.area,
      activePeopleCount: activeCount,
      createdAt: new Date(now - (minutesAgo + 60) * 60 * 1000).toISOString(),
      lastActivityAt: timeIso,
      expiresAt: new Date(now + 8 * 60 * 60 * 1000).toISOString(),
      description: baseTopic.desc,
      isLiveNow: true,
      isPrivate: isPrivate,
      isListedPublicly: true,
      inviteCode: isPrivate ? `PRV-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      hasActivePoll: hasPoll,
      creatorName: creatorUser.replace('_', ' ').toUpperCase(),
      creatorUsername: creatorUser,
      roomAdmins: [creatorUser],
      activeMembers: [creatorUser, 'muhammedrafii2002'],
      spikeVelocity: velocityScore,
      spikeLevel: velocityScore > 90 ? 'critical' : (velocityScore > 75 ? 'high' : 'normal'),
      topContributor: {
        name: `@${creatorUser}`,
        badge: 'Top Contributor',
      },
    });
  }

  return rooms;
}

// Helper to generate realistic Feed Posts for high-scale stream loading
export function generateHighScalePosts(targetCount: number = 1000, collegeId: string = 'campus_network'): any[] {
  const postTemplates = [
    { text: '⚡ DJ Nikhil confirmed for Day 2 of the College Fest! Passes will be available from 10 AM at the counter. Grab them early before they run out!', category: 'fest', area: 'Auditorium Quad', media: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80' },
    { text: '🌧️ Heavy downpour starting around campus gate. Water logging reported near the main bus terminal. Students taking route 42 please wait inside the porch.', category: 'weather', area: 'Central Gate', media: null },
    { text: '🍲 Fresh batch of Malabar Biryani just served in the south canteen! Queue is moving very fast right now.', category: 'general', area: 'South Canteen', media: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80' },
    { text: '🚨 Route 18 college bus delayed by 25 mins due to construction near bridge. Principal approved late entry for 9 AM lab sessions.', category: 'traffic', area: 'NH Bypass', media: null },
    { text: '📚 Physics & Chemistry previous year solved question paper bank is uploaded to the shared student drive. Check the link!', category: 'general', area: 'Central Library', media: null },
    { text: '🏆 We won the Inter-Collegiate Basketball Tournament! 74 - 68 against St. Albert\'s in a nail-biting overtime thriller! 🎉🔥', category: 'fest', area: 'Sports Arena', media: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80' },
    { text: '💼 Placement round 1 shortlisted candidates list is out on the department notice board. Congratulate all 48 qualifiers!', category: 'general', area: 'Placement Cell', media: null },
    { text: '🚨 Lost black wallet with student ID card near the computer lab block 2. If found please hand over to student reception.', category: 'incident', area: 'Lab Block 2', media: null },
  ];

  const usernames = ['arjun_k', 'sneha_cs', 'rahul_ec', 'ananya_m', 'fathima_bio', 'vishnu_mech', 'rohit_bba', 'meera_phy', 'kiran_ce', 'haritha_eng'];
  const displayNames = ['Arjun K.', 'Sneha CS', 'Rahul ECE', 'Ananya Menon', 'Fathima Noor', 'Vishnu Mech', 'Rohit BBA', 'Meera Nair', 'Kiran Civil', 'Haritha'];

  const posts: any[] = [];
  const now = Date.now();

  for (let i = 0; i < targetCount; i++) {
    const template = postTemplates[i % postTemplates.length];
    const postNum = i + 1;
    const userIdx = i % usernames.length;
    const authorUsername = usernames[userIdx];
    const authorDisplayName = displayNames[userIdx];
    const minutesAgo = Math.floor(Math.random() * 720) + (i * 2);
    const zapsCount = Math.floor(Math.random() * 85) + (i < 10 ? 120 : 3);
    const commentsCount = Math.floor(Math.random() * 28) + (i < 5 ? 35 : 1);

    const upvotersList = [authorUsername];
    for (let u = 0; u < Math.min(zapsCount, 8); u++) {
      upvotersList.push(usernames[(userIdx + u + 1) % usernames.length]);
    }

    posts.push({
      id: `post-scale-${postNum}`,
      collegeId: (i % 3 === 0) ? 'campus_network' : (i % 3 === 1 ? 'sn_cherthala' : 'cusat_kochi'),
      authorUsername: authorUsername,
      authorDisplayName: authorDisplayName,
      content: template.text,
      mediaUrl: template.media,
      mediaType: template.media ? 'image' : undefined,
      locationName: template.area,
      category: template.category,
      verificationStatus: (i % 2 === 0) ? 'verified' : 'unverified',
      timestamp: new Date(now - minutesAgo * 60 * 1000).toISOString(),
      upvotes: zapsCount,
      upvoters: Array.from(new Set(upvotersList)),
      commentsCount: commentsCount,
    });
  }

  return posts;
}

// Initial Preset Datasets for instant first load
export const INITIAL_ROOMS: TrendingRoom[] = generateHighScaleRooms(36, 'campus_network');

export const INITIAL_POSTS: any[] = generateHighScalePosts(48, 'campus_network');

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'room-scale-1': [
    {
      id: 'msg-seed-1',
      roomId: 'room-scale-1',
      senderName: 'Arjun K.',
      senderUsername: 'arjun_k',
      senderBadge: '⚡ Fest Head',
      witnessDistanceText: 'At Location (< 50m)',
      content: 'Pass counters open right near Gate 2! Student ID is required for entry band. ⚡',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      reactions: { '⚡': 18, '🔥': 9, '🎉': 14 },
      isWitness: true,
    },
    {
      id: 'msg-seed-2',
      roomId: 'room-scale-1',
      senderName: 'Sneha CS',
      senderUsername: 'sneha_cs',
      witnessDistanceText: 'Near Venue (< 200m)',
      content: 'DJ setup sound check is ongoing. Sound acoustics sound incredible tonight! 🔥',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      reactions: { '⚡': 22, '🔥': 12 },
      isWitness: true,
    },
  ],
};

export const INITIAL_REPORTS: ReportItem[] = [];

