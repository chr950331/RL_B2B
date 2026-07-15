export type Role = "buyer" | "admin";
export type AuctionStatus = "draft" | "active" | "closed";

export type Buyer = {
  id: string;
  username: string;
  role: Role;
  created_at: string;
};

export type Bid = {
  id: string;
  auction_id: string;
  buyer_id: string;
  premium: number;
  quantity: number;
  updated_at: string;
};

export type Auction = {
  id: string;
  sku: string;
  product_name: string;
  product_image?: string | null;
  inventory: number;
  start_time: string;
  end_time: string;
  status: AuctionStatus;
  highest_premium: number;
  total_demand: number;
  bid_count: number;
  my_bid?: Bid | null;
};

export type LeaderboardRow = {
  id: string;
  username: string;
  premium: number;
  quantity: number;
  updated_at: string;
  is_mine: boolean;
};
