export interface Disbursement {
  id: number;
  cmpss_disbursement_id: string;
  merchant_disbursement_id: string;
  third_party_provider_id: string | null;
  third_party_status: string | null;
  order_amount: string;
  merchant_fee: string;
  provider_commission: string;
  cmpss_commission: string;
  disbursement_url: string;
  success_url: string | null;
  failed_url: string | null;
  ipn_url: string;
  order_status: string;
  retry_callback_count: number;
  retry_verify_count: number;
  order_metadata: Record<string, any>;
  account_details: {
    account_number: string;
  };
  payment_method_name: string;
  currency_name: string;
  currency_code: string;
  merchant_name: string;
  merchant_id: number;
  provider_name: string;
  provider_method_name: string;
  created_at: string;
  updated_at: string;
}

export interface DisbursementsResponse {
  disbursements: Disbursement[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  total_amount: string;
  total_provider_fee: string;
  total_merchant_fee: string;
  total_success: [number, string];
  total_failed: [number, string];
  total_pending: [number, string];
  total_refunded: [number, string];
}

export interface DisbursementFilters {
  search?: string;
  status?: string;
  provider?: string;
  merchant_id?: number;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
}


