export interface ProviderSettlement {
  id: number;
  type: string;
  status: string;
  user_ip: string | null;
  user_id: number;
  before_balance: string;
  fiat_amount: string;
  after_balance: string;
  settlement_fee_percent: string;
  settlement_fee_fixed: string;
  settlement_fee: string;
  usdt_address: string | null;
  usdt_amount: string | null;
  tronscan_url: string | null;
  provider_method_id: number;
  provider_method_name: string;
  provider_name: string;
  payment_method_name: string;
  currency_code: string;
  settlement_metadata: Record<string, any>;
  is_active: boolean;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderSettlementsResponse {
  data: ProviderSettlement[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  total_amount: string;
  total_fees: string;
  success_count: number;
  failed_count: number;
  pending_count: number;
}

export interface ProviderSettlementFilters {
  search?: string;
  status?: string;
  provider_id?: number;
  currency_code?: string;
  date_from?: string;
  date_to?: string;
}
