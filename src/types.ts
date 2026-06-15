export interface Restaurant {
  id: string;
  name: string;
  area: string;
  category: string;
  score: number;
  lunchPrice: string;
  dinnerPrice: string;
  goodReview: string;
  badReview: string;
  detailId: string;
}

export interface Ratings {
  foodQuality: number;
  variety: number;
  valueForMoney: number;
  environment: number;
  experience: number;
}

export interface MonthlyScore {
  month: string;
  averageScore: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  userName: string;
  date: string;
  rating: number;
  content: string;
  isPositive: boolean;
  verified: boolean;
  images?: string[];
}

export interface Tips {
  mustEat: string[];
  avoid: string[];
  bestTime: string;
  discount: string;
  other: string;
}

export interface RestaurantDetail extends Restaurant {
  ratings: Ratings;
  monthlyScores: MonthlyScore[];
  reviews: Review[];
  tips: Tips;
}
