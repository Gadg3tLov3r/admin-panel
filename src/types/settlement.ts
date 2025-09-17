export interface Settlement {
  id: number;
  merchant_id: number;
  merchant_name: string;
  currency_name: string;
  fiat_amount: string;
  usdt_amount: string;
  status: string;
  tronscan_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SettlementsResponse {
  settlements: Settlement[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SettlementFilters {
  search?: string;
  status?: string;
  merchant_id?: number;
  currency?: string;
  date_from?: string;
  date_to?: string;
}
