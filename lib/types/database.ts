// ============================================
// REACHLY — TypeScript Types
// Mirrors the Supabase schema in reachly_schema.sql
// Place this at: lib/types/database.ts
// ============================================

// ── ENUMS / UNION TYPES ──

export type UserType = 'brand' | 'creator';

export type SwipeDirection = 'like' | 'pass' | 'super';

export type MatchStatus = 'active' | 'archived' | 'blocked';

export type CampaignStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'completed'
  | 'cancelled';

export type DealPostStatus = 'open' | 'filled' | 'closed';

export type DealPayType = 'flat' | 'monthly' | 'per_post';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export type SubscriptionTier =
  | 'creator_pro'
  | 'brand_starter'
  | 'brand_growth'
  | 'brand_agency';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export type TargetGender = 'male' | 'female' | 'all';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

// ── CORE TABLES ──

export interface Profile {
  id: string; // uuid, references auth.users
  user_type: UserType;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandProfile {
  id: string; // uuid, references profiles
  business_name: string;
  category: string;
  bio: string | null;
  logo_url: string | null;
  website: string | null;
  monthly_budget_min: number | null;
  monthly_budget_max: number | null;
  target_audience: string | null;
  target_age_min: number | null;
  target_age_max: number | null;
  target_gender: TargetGender | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenderSplit {
  female: number;
  male: number;
  other?: number;
}

export interface CreatorProfile {
  id: string; // uuid, references profiles
  display_name: string;
  handle: string;
  bio: string | null;
  niche_tags: string[];
  instagram_handle: string | null;
  instagram_followers: number | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  youtube_handle: string | null;
  youtube_subscribers: number | null;
  engagement_rate: number | null;
  audience_age_range: string | null;
  audience_gender_split: GenderSplit | null;
  verified: boolean;
  verified_at: string | null;
  rate_post: number | null;
  rate_reel: number | null;
  rate_story: number | null;
  rate_tiktok: number | null;
  rate_youtube: number | null;
  total_deals_closed: number;
  avg_performance_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  creator_id: string;
  media_url: string;
  caption: string | null;
  platform: Platform | null;
  performance_reach: number | null;
  performance_engagement: number | null;
  brand_name: string | null;
  created_at: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_id: string;
  direction: SwipeDirection;
  match_score: number | null;
  match_reason: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  brand_id: string;
  creator_id: string;
  status: MatchStatus;
  matched_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface DeliverableItem {
  type: 'instagram_post' | 'instagram_reel' | 'instagram_story' | 'tiktok_video' | 'youtube_video';
  qty: number;
}

export interface Campaign {
  id: string;
  match_id: string | null;
  brand_id: string;
  creator_id: string;
  title: string;
  brief: string | null;
  deliverables: DeliverableItem[] | null;
  agreed_price: number;
  status: CampaignStatus;
  deadline: string | null; // date string YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface CampaignPerformance {
  id: string;
  campaign_id: string;
  reach: number | null;
  impressions: number | null;
  engagements: number | null;
  clicks: number | null;
  estimated_conversions: number | null;
  cost_per_engagement: number | null;
  performance_score: number | null;
  recorded_at: string;
}

export interface DealBoardPost {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  category: string | null;
  pay_amount: number | null;
  pay_type: DealPayType | null;
  city: string | null;
  status: DealPostStatus;
  created_at: string;
}

export interface DealBoardApplication {
  id: string;
  post_id: string;
  creator_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  revenuecat_customer_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// ── COMPOSITE / JOINED TYPES (for common app queries) ──

/** A full brand profile joined with its base profile row. */
export interface BrandWithProfile extends BrandProfile {
  profile: Profile;
}

/** A full creator profile joined with its base profile row. */
export interface CreatorWithProfile extends CreatorProfile {
  profile: Profile;
}

/** Used in the Discover/swipe feed — a creator card scored against the viewing brand. */
export interface CreatorDiscoveryCard extends CreatorWithProfile {
  match_score: number;
  match_reason: string;
}

/** Used in the Discover/swipe feed — a brand card scored against the viewing creator. */
export interface BrandDiscoveryCard extends BrandWithProfile {
  match_score: number;
  match_reason: string;
}

/** A match enriched with both parties' display info, for the Matches list screen. */
export interface MatchWithParties extends Match {
  brand: BrandWithProfile;
  creator: CreatorWithProfile;
  last_message?: Message;
  unread_count?: number;
}

/** A campaign enriched with party info and latest performance, for Analytics. */
export interface CampaignWithDetails extends Campaign {
  brand: BrandWithProfile;
  creator: CreatorWithProfile;
  performance?: CampaignPerformance;
}

/** A deal board post enriched with brand info and applicant count. */
export interface DealBoardPostWithBrand extends DealBoardPost {
  brand: BrandWithProfile;
  application_count: number;
}

// ── SUPABASE DATABASE TYPE (for typed client) ──
// Use with: createClient<Database>(url, key)

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      brand_profiles: {
        Row: BrandProfile;
        Insert: Omit<BrandProfile, 'created_at' | 'updated_at' | 'verified'> & {
          created_at?: string;
          updated_at?: string;
          verified?: boolean;
        };
        Update: Partial<Omit<BrandProfile, 'id'>>;
      };
      creator_profiles: {
        Row: CreatorProfile;
        Insert: Omit<
          CreatorProfile,
          'created_at' | 'updated_at' | 'verified' | 'total_deals_closed'
        > & {
          created_at?: string;
          updated_at?: string;
          verified?: boolean;
          total_deals_closed?: number;
        };
        Update: Partial<Omit<CreatorProfile, 'id'>>;
      };
      portfolio_items: {
        Row: PortfolioItem;
        Insert: Omit<PortfolioItem, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PortfolioItem, 'id'>>;
      };
      swipes: {
        Row: Swipe;
        Insert: Omit<Swipe, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Swipe, 'id'>>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'matched_at' | 'status'> & {
          id?: string;
          matched_at?: string;
          status?: MatchStatus;
        };
        Update: Partial<Omit<Match, 'id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'read'> & {
          id?: string;
          created_at?: string;
          read?: boolean;
        };
        Update: Partial<Omit<Message, 'id'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: CampaignStatus;
        };
        Update: Partial<Omit<Campaign, 'id'>>;
      };
      campaign_performance: {
        Row: CampaignPerformance;
        Insert: Omit<CampaignPerformance, 'id' | 'recorded_at'> & {
          id?: string;
          recorded_at?: string;
        };
        Update: Partial<Omit<CampaignPerformance, 'id'>>;
      };
      deal_board_posts: {
        Row: DealBoardPost;
        Insert: Omit<DealBoardPost, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: DealPostStatus;
        };
        Update: Partial<Omit<DealBoardPost, 'id'>>;
      };
      deal_board_applications: {
        Row: DealBoardApplication;
        Insert: Omit<DealBoardApplication, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: ApplicationStatus;
        };
        Update: Partial<Omit<DealBoardApplication, 'id'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: SubscriptionStatus;
        };
        Update: Partial<Omit<Subscription, 'id'>>;
      };
    };
  };
}
