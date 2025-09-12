import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Disbursement, DisbursementsResponse } from "@/types/disbursement";
import api from "@/lib/auth";
import { DatePicker } from "@/components/DatePicker";
import { Combobox } from "@/components/ui/combobox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Helper function to get today's date at 00:00 UTC
const getTodayUTC = () => {
  const today = new Date();
  const utcToday = new Date(
    today.getTime() + today.getTimezoneOffset() * 60000
  );
  utcToday.setUTCHours(0, 0, 0, 0);
  return utcToday;
};

export default function DisbursementsPage() {
  const navigate = useNavigate();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  // Current filter values (what user sees in UI)
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodIdFilter, setPaymentMethodIdFilter] = useState("");
  const [currencyIdFilter, setCurrencyIdFilter] = useState("2");
  const [merchantIdFilter, setMerchantIdFilter] = useState("");
  const [providerIdFilter, setProviderIdFilter] = useState("");
  const [merchantDisbursementIdFilter, setMerchantDisbursementIdFilter] =
    useState("");
  const [cmpssDisbursementIdFilter, setCmpssDisbursementIdFilter] =
    useState("");
  const [callbackResponseCodeFilter, setCallbackResponseCodeFilter] =
    useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(() =>
    getTodayUTC()
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );

  // Applied filter values (what actually filters the data)
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("");
  const [appliedPaymentMethodIdFilter, setAppliedPaymentMethodIdFilter] =
    useState("");
  const [appliedCurrencyIdFilter, setAppliedCurrencyIdFilter] = useState("2");
  const [appliedMerchantIdFilter, setAppliedMerchantIdFilter] = useState("");
  const [appliedProviderIdFilter, setAppliedProviderIdFilter] = useState("");
  const [
    appliedMerchantDisbursementIdFilter,
    setAppliedMerchantDisbursementIdFilter,
  ] = useState("");
  const [
    appliedCmpssDisbursementIdFilter,
    setAppliedCmpssDisbursementIdFilter,
  ] = useState("");
  const [
    appliedCallbackResponseCodeFilter,
    setAppliedCallbackResponseCodeFilter,
  ] = useState("");
  const [appliedAccountFilter, setAppliedAccountFilter] = useState("");
  const [appliedStartDateFilter, setAppliedStartDateFilter] = useState<
    Date | undefined
  >(() => getTodayUTC());
  const [appliedEndDateFilter, setAppliedEndDateFilter] = useState<
    Date | undefined
  >(undefined);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<
    Array<{ id: number; name: string; sign: string; country: string }>
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ id: number; name: string; payment_method_id: number }>
  >([]);
  const [merchants, setMerchants] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [providers, setProviders] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [stats, setStats] = useState({
    total_amount: "0",
    total_provider_fee: "0",
    total_merchant_fee: "0",
    total_success: [0, "0"] as [number, string],
    total_failed: [0, "0"] as [number, string],
    total_pending: [0, "0"] as [number, string],
    total_refunded: [0, "0"] as [number, string],
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch currencies data
  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await api.get("/currencies");
      setCurrencies(response.data.currencies || []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  }, []);

  // Fetch payment methods data
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await api.get("/methods");
      // Extract payment methods from merchant_methods and get unique payment methods
      const merchantMethods = response.data.merchant_methods || [];
      const uniqueMethods = merchantMethods.reduce(
        (acc: any[], method: any) => {
          const existingMethod = acc.find(
            (m) => m.payment_method_id === method.payment_method_id
          );
          if (!existingMethod) {
            acc.push({
              id: method.payment_method_id,
              name: method.payment_method.name,
              payment_method_id: method.payment_method_id,
            });
          }
          return acc;
        },
        []
      );
      setPaymentMethods(uniqueMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  }, []);

  // Fetch merchants data
  const fetchMerchants = useCallback(async () => {
    try {
      const response = await api.get("/merchants");
      setMerchants(response.data.merchants || response.data || []);
    } catch (error) {
      console.error("Error fetching merchants:", error);
    }
  }, []);

  // Fetch providers data
  const fetchProviders = useCallback(async () => {
    try {
      const response = await api.get("/providers");
      setProviders(response.data.providers || response.data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  }, []);

  // Fetch disbursements data
  const fetchDisbursements = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        ...(appliedStatusFilter && { order_status: appliedStatusFilter }),
        ...(appliedPaymentMethodIdFilter && {
          payment_method_id: parseInt(appliedPaymentMethodIdFilter),
        }),
        ...(appliedCurrencyIdFilter && {
          currency_id: parseInt(appliedCurrencyIdFilter),
        }),
        ...(appliedMerchantIdFilter && {
          merchant_id: parseInt(appliedMerchantIdFilter),
        }),
        ...(appliedProviderIdFilter && {
          provider_id: parseInt(appliedProviderIdFilter),
        }),
        ...(appliedMerchantDisbursementIdFilter && {
          merchant_disbursement_id: appliedMerchantDisbursementIdFilter,
        }),
        ...(appliedCmpssDisbursementIdFilter && {
          cmpss_disbursement_id: appliedCmpssDisbursementIdFilter,
        }),
        ...(appliedCallbackResponseCodeFilter === "success" && {
          callback_status: "success",
        }),
        ...(appliedCallbackResponseCodeFilter === "failed" && {
          callback_status: "failed",
        }),
        ...(appliedStartDateFilter && {
          start_date:
            appliedStartDateFilter.getUTCFullYear() +
            "-" +
            String(appliedStartDateFilter.getUTCMonth() + 1).padStart(2, "0") +
            "-" +
            String(appliedStartDateFilter.getUTCDate()).padStart(2, "0") +
            "T" +
            String(appliedStartDateFilter.getUTCHours()).padStart(2, "0") +
            ":" +
            String(appliedStartDateFilter.getUTCMinutes()).padStart(2, "0"),
        }),
        ...(appliedEndDateFilter && {
          end_date:
            appliedEndDateFilter.getUTCFullYear() +
            "-" +
            String(appliedEndDateFilter.getUTCMonth() + 1).padStart(2, "0") +
            "-" +
            String(appliedEndDateFilter.getUTCDate()).padStart(2, "0") +
            "T" +
            String(appliedEndDateFilter.getUTCHours()).padStart(2, "0") +
            ":" +
            String(appliedEndDateFilter.getUTCMinutes()).padStart(2, "0"),
        }),
      };

      const response = await api.get<DisbursementsResponse>("/disbursements", {
        params,
      });
      const data = response.data;
      setDisbursements(data.disbursements);
      setTotalPages(data.total_pages);
      setTotal(data.total);

      // Extract stats from the API response
      setStats({
        total_amount: data.total_amount || "0",
        total_provider_fee: data.total_provider_fee || "0",
        total_merchant_fee: data.total_merchant_fee || "0",
        total_success: data.total_success || [0, "0"],
        total_failed: data.total_failed || [0, "0"],
        total_pending: data.total_pending || [0, "0"],
        total_refunded: data.total_refunded || [0, "0"],
      });

      setPermissionError(null); // Clear any previous permission errors
    } catch (error: any) {
      console.error("Error fetching disbursements:", error);

      // Handle permission errors specifically
      if (error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail;
        if (errorDetail && errorDetail.includes("Missing admin permission")) {
          // Extract the permission name from the error
          const permissionMatch = errorDetail.match(
            /Missing admin permission: (.+)/
          );
          const permission = permissionMatch ? permissionMatch[1] : "unknown";

          setPermissionError(
            `You don't have permission to view disbursements (${permission})`
          );
          toast.error(
            `Access denied: You don't have permission to view disbursements (${permission})`
          );
        } else {
          setPermissionError("Insufficient permissions to view disbursements");
          toast.error(
            "Access denied: Insufficient permissions to view disbursements"
          );
        }
      } else {
        setPermissionError(null);
        toast.error("Failed to load disbursements. Please try again.");
      }

      // Set empty state on error
      setDisbursements([]);
      setTotalPages(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisbursements();
  }, [
    currentPage,
    perPage,
    appliedStatusFilter,
    appliedPaymentMethodIdFilter,
    appliedCurrencyIdFilter,
    appliedMerchantIdFilter,
    appliedProviderIdFilter,
    appliedMerchantDisbursementIdFilter,
    appliedCmpssDisbursementIdFilter,
    appliedCallbackResponseCodeFilter,
    appliedStartDateFilter,
    appliedEndDateFilter,
  ]);

  useEffect(() => {
    fetchCurrencies();
    fetchPaymentMethods();
    fetchMerchants();
    fetchProviders();
  }, [fetchCurrencies, fetchPaymentMethods, fetchMerchants, fetchProviders]);

  // Handle filters - only update current values, don't apply yet
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handlePaymentMethodIdFilter = (value: string) => {
    setPaymentMethodIdFilter(value === "all" ? "" : value);
  };

  const handleCurrencyIdFilter = (value: string) => {
    setCurrencyIdFilter(value);
  };

  const handleMerchantIdFilter = (value: string) => {
    setMerchantIdFilter(value === "all" ? "" : value);
  };

  const handleProviderIdFilter = (value: string) => {
    setProviderIdFilter(value === "all" ? "" : value);
  };

  const handleMerchantDisbursementIdFilter = (value: string) => {
    setMerchantDisbursementIdFilter(value);
  };

  const handleCmpssDisbursementIdFilter = (value: string) => {
    setCmpssDisbursementIdFilter(value);
  };

  const handleCallbackResponseCodeFilter = (value: string) => {
    setCallbackResponseCodeFilter(value);
  };

  const handleAccountFilter = (value: string) => {
    setAccountFilter(value);
  };

  const handleStartDateFilter = (value: Date | undefined) => {
    if (value) {
      // Set to start of day
      const startOfDay = new Date(value);
      startOfDay.setHours(0, 0, 0, 0);
      setStartDateFilter(startOfDay);
    } else {
      setStartDateFilter(undefined);
    }
  };

  const handleEndDateFilter = (value: Date | undefined) => {
    if (value) {
      // Set to end of day
      const endOfDay = new Date(value);
      endOfDay.setHours(23, 59, 59, 999);
      setEndDateFilter(endOfDay);
    } else {
      setEndDateFilter(undefined);
    }
  };

  // Apply current filter values to the applied filters
  const applyFilters = () => {
    console.log("Applying filters:", {
      accountFilter,
      currentPage,
      statusFilter,
      paymentMethodIdFilter,
      currencyIdFilter,
      merchantIdFilter,
      providerIdFilter,
      merchantDisbursementIdFilter,
      cmpssDisbursementIdFilter,
      callbackResponseCodeFilter,
      startDateFilter,
      endDateFilter,
    });

    // Apply all filters
    setAppliedStatusFilter(statusFilter);
    setAppliedPaymentMethodIdFilter(paymentMethodIdFilter);
    setAppliedCurrencyIdFilter(currencyIdFilter);
    setAppliedMerchantIdFilter(merchantIdFilter);
    setAppliedProviderIdFilter(providerIdFilter);
    setAppliedMerchantDisbursementIdFilter(merchantDisbursementIdFilter);
    setAppliedCmpssDisbursementIdFilter(cmpssDisbursementIdFilter);
    setAppliedCallbackResponseCodeFilter(callbackResponseCodeFilter);
    setAppliedAccountFilter(accountFilter);
    setAppliedStartDateFilter(startDateFilter);
    setAppliedEndDateFilter(endDateFilter);

    // Don't reset page if account filter is being applied
    // Account filter can work alongside other server-side filters
    if (!accountFilter) {
      console.log("Resetting page to 1 - no account filter");
      setCurrentPage(1);
    } else {
      console.log("Keeping current page - account filter is being applied");
    }
  };

  const clearFilters = () => {
    // Clear current filter values
    setStatusFilter("");
    setPaymentMethodIdFilter("");
    setCurrencyIdFilter("2"); // Reset to default currency
    setMerchantIdFilter("");
    setProviderIdFilter("");
    setMerchantDisbursementIdFilter("");
    setCmpssDisbursementIdFilter("");
    setCallbackResponseCodeFilter("");
    setAccountFilter("");
    // Reset to today's start date and clear end date
    const utcToday = getTodayUTC();
    setStartDateFilter(utcToday);
    setEndDateFilter(undefined);

    // Clear applied filter values
    setAppliedStatusFilter("");
    setAppliedPaymentMethodIdFilter("");
    setAppliedCurrencyIdFilter("2");
    setAppliedMerchantIdFilter("");
    setAppliedProviderIdFilter("");
    setAppliedMerchantDisbursementIdFilter("");
    setAppliedCmpssDisbursementIdFilter("");
    setAppliedCallbackResponseCodeFilter("");
    setAppliedAccountFilter("");
    setAppliedStartDateFilter(utcToday);
    setAppliedEndDateFilter(undefined);

    setCurrentPage(1);
    setPermissionError(null); // Clear permission errors when filters are cleared
  };

  const handleRefresh = () => {
    const confirmed = window.confirm(
      "Are you sure you want to refresh the disbursements data? This will reload all current data."
    );
    if (!confirmed) return;

    fetchDisbursements();
    toast.success("Disbursements refreshed");
  };

  // Client-side filtering function for account numbers
  const filterDisbursementsByAccount = (disbursements: Disbursement[]) => {
    if (!appliedAccountFilter.trim()) {
      return disbursements;
    }

    const accountRegex = /^03\d{9}$/;
    const searchTerm = appliedAccountFilter.trim();

    // Only filter if the search term matches the regex pattern
    if (!accountRegex.test(searchTerm)) {
      return disbursements;
    }

    return disbursements.filter((disbursement) => {
      const accountNumber = disbursement.account_details?.account_number || "";
      return accountNumber === searchTerm;
    });
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleViewDetails = (disbursement: Disbursement) => {
    window.open(`/disbursements/${disbursement.id}`, "_blank");
  };

  const handleExport = () => {
    const confirmed = window.confirm(
      `Are you sure you want to export ${disbursements.length} disbursement records?`
    );
    if (!confirmed) return;

    // Create CSV data
    const headers = [
      "Disbursement ID",
      "Merchant Disbursement ID",
      "Amount",
      "Status",
      "Callback Code",
      "Payment Method",
      "Provider",
      "Merchant",
      "Account Number",
      "Created At",
    ];

    const csvData = disbursements.map((disbursement) => [
      disbursement.cmpss_disbursement_id,
      disbursement.merchant_disbursement_id,
      disbursement.order_amount,
      disbursement.order_status,
      disbursement.callback_response_code || "",
      disbursement.payment_method_name,
      disbursement.provider_name,
      disbursement.merchant_name,
      disbursement.account_details?.account_number || "",
      new Date(disbursement.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disbursements-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Disbursements exported successfully");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      refunded: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  return (
    <AuthenticatedLayout
      title="Disbursements"
      subtitle="Manage and monitor disbursement transactions"
    >
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 mb-4">
        {/* Total Amount */}
        <Card>
          <CardContent className="p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Total Disbursements
              </p>
              <p className="text-lg font-bold">
                {formatCurrency(
                  stats.total_amount,
                  disbursements[0]?.currency_code || "USD"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Successful */}
        <Card>
          <CardContent className="p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Successful
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(
                  stats.total_success[1],
                  disbursements[0]?.currency_code || "USD"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.total_success[0]} disbursements
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Provider Fees */}
        <Card>
          <CardContent className="p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Provider Fees
              </p>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(
                  stats.total_provider_fee,
                  disbursements[0]?.currency_code || "USD"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Merchant Fees */}
        <Card>
          <CardContent className="p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Merchant Fees
              </p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(
                  stats.total_merchant_fee,
                  disbursements[0]?.currency_code || "USD"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card>
          <CardContent className="p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Failed
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(
                  stats.total_failed[1],
                  disbursements[0]?.currency_code || "USD"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.total_failed[0]} disbursements
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Pending
              </p>
              <p className="text-lg font-bold text-yellow-600">
                {formatCurrency(
                  stats.total_pending[1],
                  disbursements[0]?.currency_code || "USD"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.total_pending[0]} disbursements
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Refunded */}
        <Card>
          <CardContent className="p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Refunded
              </p>
              <p className="text-lg font-bold text-gray-600">
                {formatCurrency(
                  stats.total_refunded[1],
                  disbursements[0]?.currency_code || "USD"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.total_refunded[0]} disbursements
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
              >
                <div className="flex items-center gap-2 flex-1">
                  {/* Active Filters in Header */}
                  {(appliedStatusFilter ||
                    appliedPaymentMethodIdFilter ||
                    appliedCurrencyIdFilter ||
                    appliedMerchantIdFilter ||
                    appliedProviderIdFilter ||
                    appliedMerchantDisbursementIdFilter ||
                    appliedCmpssDisbursementIdFilter ||
                    appliedCallbackResponseCodeFilter ||
                    appliedAccountFilter ||
                    appliedStartDateFilter ||
                    appliedEndDateFilter) && (
                    <div className="flex items-center gap-2 flex-wrap ml-4">
                      {appliedStatusFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {appliedStatusFilter}
                        </Badge>
                      )}
                      {appliedPaymentMethodIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Method:{" "}
                          {paymentMethods.find(
                            (m) =>
                              m.payment_method_id.toString() ===
                              appliedPaymentMethodIdFilter
                          )?.name || appliedPaymentMethodIdFilter}
                        </Badge>
                      )}
                      {appliedCurrencyIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Currency:{" "}
                          {currencies.find(
                            (c) => c.id.toString() === appliedCurrencyIdFilter
                          )?.name || appliedCurrencyIdFilter}
                        </Badge>
                      )}
                      {appliedMerchantIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Merchant:{" "}
                          {merchants.find(
                            (m) => m.id.toString() === appliedMerchantIdFilter
                          )?.name || appliedMerchantIdFilter}
                        </Badge>
                      )}
                      {appliedProviderIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Provider:{" "}
                          {providers.find(
                            (p) => p.id.toString() === appliedProviderIdFilter
                          )?.name || appliedProviderIdFilter}
                        </Badge>
                      )}
                      {appliedMerchantDisbursementIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Merchant ID: {appliedMerchantDisbursementIdFilter}
                        </Badge>
                      )}
                      {appliedCmpssDisbursementIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          CMPSS ID: {appliedCmpssDisbursementIdFilter}
                        </Badge>
                      )}
                      {appliedCallbackResponseCodeFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Callback:{" "}
                          {appliedCallbackResponseCodeFilter === "success"
                            ? "Success"
                            : "Failed"}
                        </Badge>
                      )}
                      {appliedAccountFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Account: {appliedAccountFilter}
                        </Badge>
                      )}
                      {appliedStartDateFilter && (
                        <Badge variant="secondary" className="text-xs">
                          From: {appliedStartDateFilter.toLocaleDateString()}
                        </Badge>
                      )}
                      {appliedEndDateFilter && (
                        <Badge variant="secondary" className="text-xs">
                          To: {appliedEndDateFilter.toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {isFiltersOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {/* Disbursement IDs and Date Range Row */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      CMPSS Disbursement ID
                    </label>
                    <Input
                      placeholder="Enter CMPSS disbursement ID..."
                      className="w-full"
                      value={cmpssDisbursementIdFilter}
                      onChange={(e) =>
                        handleCmpssDisbursementIdFilter(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Merchant Disbursement ID
                    </label>
                    <Input
                      placeholder="Enter merchant disbursement ID..."
                      className="w-full"
                      value={merchantDisbursementIdFilter}
                      onChange={(e) =>
                        handleMerchantDisbursementIdFilter(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Callback Response Code
                    </label>
                    <Select
                      value={callbackResponseCodeFilter}
                      onValueChange={handleCallbackResponseCodeFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select callback status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Account Number
                    </label>
                    <Input
                      placeholder="Enter account number (03XXXXXXXXX)..."
                      className="w-full"
                      value={accountFilter}
                      onChange={(e) => handleAccountFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Start Date
                    </label>
                    <DatePicker
                      selected={startDateFilter}
                      onSelect={handleStartDateFilter}
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      End Date
                    </label>
                    <DatePicker
                      selected={endDateFilter}
                      onSelect={handleEndDateFilter}
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <Select
                      value={statusFilter || "all"}
                      onValueChange={handleStatusFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Payment Method
                    </label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Methods" },
                        ...paymentMethods.map((method) => ({
                          value: method.payment_method_id.toString(),
                          label: method.name,
                        })),
                      ]}
                      value={paymentMethodIdFilter || "all"}
                      onValueChange={handlePaymentMethodIdFilter}
                      placeholder="Select payment method"
                      searchPlaceholder="Search payment methods..."
                      emptyText="No payment methods found."
                      all={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Currency
                    </label>
                    <Select
                      value={currencyIdFilter || "2"}
                      onValueChange={handleCurrencyIdFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.id}
                            value={currency.id.toString()}
                          >
                            {currency.name} ({currency.sign})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Merchant
                    </label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Merchants" },
                        ...merchants.map((merchant) => ({
                          value: merchant.id.toString(),
                          label: merchant.name,
                        })),
                      ]}
                      value={merchantIdFilter || "all"}
                      onValueChange={handleMerchantIdFilter}
                      placeholder="Select merchant"
                      searchPlaceholder="Search merchants..."
                      emptyText="No merchants found."
                      all={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Provider
                    </label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Providers" },
                        ...providers.map((provider) => ({
                          value: provider.id.toString(),
                          label: provider.name,
                        })),
                      ]}
                      value={providerIdFilter || "all"}
                      onValueChange={handleProviderIdFilter}
                      placeholder="Select provider"
                      searchPlaceholder="Search providers..."
                      emptyText="No providers found."
                      all={false}
                    />
                  </div>
                </div>

                {/* Apply Filter Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={applyFilters} className="w-full sm:w-auto">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Disbursements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Disbursement Transactions</CardTitle>
              <CardDescription>
                Showing {filterDisbursementsByAccount(disbursements).length} of{" "}
                {total} disbursements
                {appliedAccountFilter && ` (filtered by account)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExport}
                disabled={disbursements.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filterDisbursementsByAccount(disbursements).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              {permissionError ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🚫</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">
                    Access Denied
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {permissionError}
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Please contact your administrator if you believe this is an
                    error.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No disbursements found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {appliedStatusFilter ||
                    appliedPaymentMethodIdFilter ||
                    appliedCurrencyIdFilter ||
                    appliedMerchantIdFilter ||
                    appliedMerchantDisbursementIdFilter ||
                    appliedCmpssDisbursementIdFilter ||
                    appliedCallbackResponseCodeFilter ||
                    appliedAccountFilter ||
                    appliedStartDateFilter ||
                    appliedEndDateFilter
                      ? "Try adjusting your filters to see more results."
                      : "There are no disbursements to display at the moment."}
                  </p>
                  {(appliedStatusFilter ||
                    appliedPaymentMethodIdFilter ||
                    appliedCurrencyIdFilter ||
                    appliedMerchantIdFilter ||
                    appliedMerchantDisbursementIdFilter ||
                    appliedCmpssDisbursementIdFilter ||
                    appliedCallbackResponseCodeFilter ||
                    appliedAccountFilter ||
                    appliedStartDateFilter ||
                    appliedEndDateFilter) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disbursement ID</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Merchant Fee</TableHead>
                  <TableHead>Provider Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterDisbursementsByAccount(disbursements).map(
                  (disbursement) => (
                    <TableRow key={disbursement.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <button
                            onClick={() =>
                              handleCopyToClipboard(
                                disbursement.cmpss_disbursement_id
                              )
                            }
                            className="flex items-center hover:bg-gray-100 px-1 py-0.5 rounded transition-colors w-full text-left"
                          >
                            <div className="font-medium text-sm">
                              {disbursement.cmpss_disbursement_id}
                            </div>
                          </button>
                          <button
                            onClick={() =>
                              handleCopyToClipboard(
                                disbursement.merchant_disbursement_id
                              )
                            }
                            className="flex items-center hover:bg-gray-100 px-1 py-0.5 rounded transition-colors w-full text-left"
                          >
                            <div className="text-xs text-muted-foreground">
                              {disbursement.merchant_disbursement_id}
                            </div>
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {disbursement.merchant_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {disbursement.merchant_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(
                            disbursement.order_amount,
                            disbursement.currency_code
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-purple-600">
                          {formatCurrency(
                            disbursement.merchant_fee || "0",
                            disbursement.currency_code
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-blue-600">
                          {formatCurrency(
                            disbursement.provider_commission || "0",
                            disbursement.currency_code
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(disbursement.order_status)}
                          {disbursement.callback_response_code && (
                            <div className="text-xs text-muted-foreground">
                              {disbursement.callback_response_code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {disbursement.provider_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {disbursement.payment_method_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {disbursement.account_details?.account_number ||
                            "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(disbursement.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(disbursement)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * perPage + 1} to{" "}
            {Math.min(currentPage * perPage, total)} of {total} results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {/* Show first page */}
              {currentPage > 3 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className="w-8 h-8"
                  >
                    1
                  </Button>
                  {currentPage > 4 && (
                    <span className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  )}
                </>
              )}

              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              {/* Show last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
