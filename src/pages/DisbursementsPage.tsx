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
  RotateCcw,
  CheckCircle,
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

export default function DisbursementsPage() {
  const navigate = useNavigate();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodIdFilter, setPaymentMethodIdFilter] = useState("");
  const [currencyIdFilter, setCurrencyIdFilter] = useState("2");
  const [merchantIdFilter, setMerchantIdFilter] = useState("");
  const [providerIdFilter, setProviderIdFilter] = useState("");
  const [merchantDisbursementIdFilter, setMerchantDisbursementIdFilter] =
    useState("");
  const [cmpssDisbursementIdFilter, setCmpssDisbursementIdFilter] =
    useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(
    () => {
      // Set default start date to today at 00:00
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [retryingCallback, setRetryingCallback] = useState<number | null>(null);
  const [retryingVerification, setRetryingVerification] = useState<
    number | null
  >(null);
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
        ...(statusFilter && { order_status: statusFilter }),
        ...(paymentMethodIdFilter && {
          payment_method_id: parseInt(paymentMethodIdFilter),
        }),
        ...(currencyIdFilter && { currency_id: parseInt(currencyIdFilter) }),
        ...(merchantIdFilter && { merchant_id: parseInt(merchantIdFilter) }),
        ...(providerIdFilter && { provider_id: parseInt(providerIdFilter) }),
        ...(merchantDisbursementIdFilter && {
          merchant_disbursement_id: merchantDisbursementIdFilter,
        }),
        ...(cmpssDisbursementIdFilter && {
          cmpss_disbursement_id: cmpssDisbursementIdFilter,
        }),
        ...(startDateFilter && {
          start_date:
            startDateFilter.getFullYear() +
            "-" +
            String(startDateFilter.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(startDateFilter.getDate()).padStart(2, "0") +
            "T" +
            String(startDateFilter.getHours()).padStart(2, "0") +
            ":" +
            String(startDateFilter.getMinutes()).padStart(2, "0"),
        }),
        ...(endDateFilter && {
          end_date:
            endDateFilter.getFullYear() +
            "-" +
            String(endDateFilter.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(endDateFilter.getDate()).padStart(2, "0") +
            "T" +
            String(endDateFilter.getHours()).padStart(2, "0") +
            ":" +
            String(endDateFilter.getMinutes()).padStart(2, "0"),
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
    statusFilter,
    paymentMethodIdFilter,
    currencyIdFilter,
    merchantIdFilter,
    providerIdFilter,
    merchantDisbursementIdFilter,
    cmpssDisbursementIdFilter,
    startDateFilter,
    endDateFilter,
  ]);

  useEffect(() => {
    fetchCurrencies();
    fetchPaymentMethods();
    fetchMerchants();
    fetchProviders();
  }, [fetchCurrencies, fetchPaymentMethods, fetchMerchants, fetchProviders]);

  // Handle filters
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handlePaymentMethodIdFilter = (value: string) => {
    setPaymentMethodIdFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleCurrencyIdFilter = (value: string) => {
    setCurrencyIdFilter(value);
    setCurrentPage(1);
  };

  const handleMerchantIdFilter = (value: string) => {
    setMerchantIdFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleProviderIdFilter = (value: string) => {
    setProviderIdFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleMerchantDisbursementIdFilter = (value: string) => {
    setMerchantDisbursementIdFilter(value);
    setCurrentPage(1);
  };

  const handleCmpssDisbursementIdFilter = (value: string) => {
    setCmpssDisbursementIdFilter(value);
    setCurrentPage(1);
  };

  const handleAccountFilter = (value: string) => {
    setAccountFilter(value);
    setCurrentPage(1);
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
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  // Check if filters are at default values
  const isDefaultFilter = (
    filterName: string,
    value: string | Date | undefined
  ) => {
    if (filterName === "start_date" || filterName === "end_date") {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      if (filterName === "start_date" && value instanceof Date) {
        return value.getTime() === startOfDay.getTime();
      }
      if (filterName === "end_date" && value instanceof Date) {
        return value.getTime() === endOfDay.getTime();
      }
    }
    return false;
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPaymentMethodIdFilter("");
    setCurrencyIdFilter(""); // Clear currency filter
    setMerchantIdFilter("");
    setProviderIdFilter("");
    setMerchantDisbursementIdFilter("");
    setCmpssDisbursementIdFilter("");
    setAccountFilter("");
    // Reset to today's start date and clear end date
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    setStartDateFilter(startOfDay);
    setEndDateFilter(undefined);
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

  // Check if disbursement is eligible for retry verification
  const isEligibleForRetryVerification = (disbursement: Disbursement) => {
    return disbursement.order_status === "processing";
  };

  // Client-side filtering function for account numbers
  const filterDisbursementsByAccount = (disbursements: Disbursement[]) => {
    if (!accountFilter.trim()) {
      return disbursements;
    }

    const accountRegex = /^03\d{9}$/;
    const searchTerm = accountFilter.trim();

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
    navigate(`/disbursements/${disbursement.id}`);
  };

  const handleRetryCallback = async (disbursement: Disbursement) => {
    const confirmed = window.confirm(
      `Are you sure you want to retry the callback for disbursement ${disbursement.cmpss_disbursement_id}?`
    );
    if (!confirmed) return;

    setRetryingCallback(disbursement.id);
    try {
      await api.post("/disbursements/trigger-callback", {
        cmpss_disbursement_id: disbursement.cmpss_disbursement_id,
      });
      toast.success("Callback triggered successfully");
    } catch (error: any) {
      console.error("Error triggering callback:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Access denied: You don't have permission to trigger callbacks"
        );
      } else if (error.response?.data?.detail) {
        toast.error(`Error: ${error.response.data.detail}`);
      } else {
        toast.error("Failed to trigger callback. Please try again.");
      }
    } finally {
      setRetryingCallback(null);
    }
  };

  const handleRetryVerification = async (disbursement: Disbursement) => {
    const confirmed = window.confirm(
      `Are you sure you want to retry verification for disbursement ${disbursement.cmpss_disbursement_id}?`
    );
    if (!confirmed) return;

    setRetryingVerification(disbursement.id);
    try {
      await api.post(
        "/disbursements/query-timeout-order",
        {
          cmpss_disbursement_id: disbursement.cmpss_disbursement_id,
        },
        {
          headers: {
            "x-do-secret": "df0f5bfc-a858-4b2d-9041-af2651c0cfe9",
          },
        }
      );
      toast.success("Verification retry triggered successfully");
    } catch (error: any) {
      console.error("Error triggering verification retry:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Access denied: You don't have permission to retry verification"
        );
      } else if (error.response?.data?.detail) {
        toast.error(`Error: ${error.response.data.detail}`);
      } else {
        toast.error("Failed to trigger verification retry. Please try again.");
      }
    } finally {
      setRetryingVerification(null);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        {/* Total Amount */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    stats.total_amount,
                    disbursements[0]?.currency_code || "USD"
                  )}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">₨</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Successful */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Successful
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    stats.total_success[1],
                    disbursements[0]?.currency_code || "USD"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_success[0]} disbursements
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Provider Fees */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Provider Fees
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    stats.total_provider_fee,
                    disbursements[0]?.currency_code || "USD"
                  )}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">🏦</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Merchant Fees */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Merchant Fees
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    stats.total_merchant_fee,
                    disbursements[0]?.currency_code || "USD"
                  )}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">💸</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    stats.total_failed[1],
                    disbursements[0]?.currency_code || "USD"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_failed[0]} disbursements
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">✗</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(
                    stats.total_pending[1],
                    disbursements[0]?.currency_code || "USD"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_pending[0]} disbursements
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">⏳</span>
              </div>
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
                  {(statusFilter ||
                    paymentMethodIdFilter ||
                    currencyIdFilter ||
                    merchantIdFilter ||
                    providerIdFilter ||
                    merchantDisbursementIdFilter ||
                    cmpssDisbursementIdFilter ||
                    accountFilter ||
                    startDateFilter ||
                    endDateFilter) && (
                    <div className="flex items-center gap-2 flex-wrap ml-4">
                      {statusFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {statusFilter}
                        </Badge>
                      )}
                      {paymentMethodIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Method:{" "}
                          {paymentMethods.find(
                            (m) =>
                              m.payment_method_id.toString() ===
                              paymentMethodIdFilter
                          )?.name || paymentMethodIdFilter}
                        </Badge>
                      )}
                      {currencyIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Currency:{" "}
                          {currencies.find(
                            (c) => c.id.toString() === currencyIdFilter
                          )?.name || currencyIdFilter}
                        </Badge>
                      )}
                      {merchantIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Merchant:{" "}
                          {merchants.find(
                            (m) => m.id.toString() === merchantIdFilter
                          )?.name || merchantIdFilter}
                        </Badge>
                      )}
                      {providerIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Provider:{" "}
                          {providers.find(
                            (p) => p.id.toString() === providerIdFilter
                          )?.name || providerIdFilter}
                        </Badge>
                      )}
                      {merchantDisbursementIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Merchant ID: {merchantDisbursementIdFilter}
                        </Badge>
                      )}
                      {cmpssDisbursementIdFilter && (
                        <Badge variant="secondary" className="text-xs">
                          CMPSS ID: {cmpssDisbursementIdFilter}
                        </Badge>
                      )}
                      {accountFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Account: {accountFilter}
                        </Badge>
                      )}
                      {startDateFilter && (
                        <Badge
                          variant={
                            isDefaultFilter("start_date", startDateFilter)
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          From: {startDateFilter.toLocaleDateString()}
                          {isDefaultFilter("start_date", startDateFilter) &&
                            " (Default)"}
                        </Badge>
                      )}
                      {endDateFilter && (
                        <Badge
                          variant={
                            isDefaultFilter("end_date", endDateFilter)
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          To: {endDateFilter.toLocaleDateString()}
                          {isDefaultFilter("end_date", endDateFilter) &&
                            " (Default)"}
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                {accountFilter && ` (filtered by account)`}
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
                    {statusFilter ||
                    paymentMethodIdFilter ||
                    currencyIdFilter ||
                    merchantIdFilter ||
                    merchantDisbursementIdFilter ||
                    cmpssDisbursementIdFilter ||
                    accountFilter ||
                    startDateFilter ||
                    endDateFilter
                      ? "Try adjusting your filters to see more results."
                      : "There are no disbursements to display at the moment."}
                  </p>
                  {(statusFilter ||
                    paymentMethodIdFilter ||
                    currencyIdFilter ||
                    merchantIdFilter ||
                    merchantDisbursementIdFilter ||
                    cmpssDisbursementIdFilter ||
                    accountFilter ||
                    startDateFilter ||
                    endDateFilter) && (
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
                        {getStatusBadge(disbursement.order_status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {disbursement.provider_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Retries: {disbursement.retry_verify_count}
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

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryCallback(disbursement)}
                            disabled={retryingCallback === disbursement.id}
                            title="Retry Callback"
                          >
                            {retryingCallback === disbursement.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </Button>

                          {isEligibleForRetryVerification(disbursement) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRetryVerification(disbursement)
                              }
                              disabled={
                                retryingVerification === disbursement.id
                              }
                              title="Retry Verification"
                            >
                              {retryingVerification === disbursement.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          )}
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
