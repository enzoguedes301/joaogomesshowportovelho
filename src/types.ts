export interface Campaign {
  id: string;
  codeId: string;
  title: string;
  category: string;
  subcategory: string;
  location: string;
  currentAmount: number;
  targetAmount: number;
  heartsCount: number;
  supportersCount: number;
  createdAt: string;
  organizer: {
    name: string;
    avatarUrl: string;
    activeSince: string;
    verified: boolean;
    location: string;
    documentsVerified: boolean;
  };
  summary: string;
  fullStory: string[];
  images: {
    url: string;
    caption?: string;
  }[];
  medicalVerification?: {
    hospital: string;
    patientName: string;
    verifiedDate: string;
  };
}

export interface Donor {
  id: string;
  name: string;
  avatarUrl?: string;
  amount: number;
  date: string;
  message?: string;
  isAnonymous: boolean;
  hearts: number;
  badge?: string;
}

export interface CampaignUpdate {
  id: string;
  date: string;
  title: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
}

export interface RelatedCampaign {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  currentAmount: number;
  targetAmount: number;
  heartsCount: number;
  isSponsored?: boolean;
  location: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  earnedDate: string;
}
