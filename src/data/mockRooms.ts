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
    studentCount: 0,
    area: 'Main Campus',
    lat: 9.6842,
    lng: 76.3312,
  },
];

export const INITIAL_ROOMS: TrendingRoom[] = [];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

export const INITIAL_POSTS: any[] = [];

export const INITIAL_REPORTS: ReportItem[] = [];
