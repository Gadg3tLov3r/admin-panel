import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import {
  ProviderSettlement,
  ProviderSettlementsResponse,
} from "@/types/provider-settlement";
import api from "@/lib/auth";

export default function ProviderSettlementsPage() {
  const [settlements, setSettlements] = useState<ProviderSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState("0.00");
  const [totalFees, setTotalFees] = useState("0.00");
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Fetch settlements data
  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      };

      const response = await api.get<ProviderSettlementsResponse>(
        "/provider-settlements",
        {
          params,
        }
      );
      const data = response.data;
      setSettlements(data.data);
      setTotalPages(data.total_pages);
      setTotal(data.total);
      setTotalAmount(data.total_amount);
      setTotalFees(data.total_fees);
      setSuccessCount(data.success_count);
      setFailedCount(data.failed_count);
      setPendingCount(data.pending_count);

      setPermissionError(null); // Clear any previous permission errors
    } catch (error: any) {
      console.error("Error fetching provider settlements:", error);

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
            `You don't have permission to view provider settlements (${permission})`
          );
          toast.error(
            `Access denied: You don't have permission to view provider settlements (${permission})`
          );
        } else {
          setPermissionError(
            "Insufficient permissions to view provider settlements"
          );
          toast.error(
            "Access denied: Insufficient permissions to view provider settlements"
          );
        }
      } else {
        setPermissionError(null);
        toast.error("Failed to load provider settlements. Please try again.");
      }

      // Set empty state on error
      setSettlements([]);
      setTotalPages(0);
      setTotal(0);
      setTotalAmount("0.00");
      setTotalFees("0.00");
      setSuccessCount(0);
      setFailedCount(0);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [currentPage, perPage]);

  const handleRefresh = () => {
    const confirmed = window.confirm(
      "Are you sure you want to refresh the provider settlements data? This will reload all current data."
    );
    if (!confirmed) return;

    fetchSettlements();
    toast.success("Provider settlements refreshed");
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleViewDetails = (settlement: ProviderSettlement) => {
    window.open(`/provider-settlements/${settlement.id}`, "_blank");
  };

  const handleExport = () => {
    const confirmed = window.confirm(
      `Are you sure you want to export ${settlements.length} provider settlement records?`
    );
    if (!confirmed) return;

    // Create CSV data
    const headers = [
      "Settlement ID",
      "Provider",
      "Payment Method",
      "Currency",
      "Fiat Amount",
      "Fee",
      "Fee Percent",
      "Fee Fixed",
      "Before Balance",
      "After Balance",
      "Status",
      "Note",
      "Created At",
    ];

    const csvData = settlements.map((settlement) => [
      settlement.id,
      settlement.provider_name,
      settlement.payment_method_name,
      settlement.currency_code,
      settlement.fiat_amount,
      settlement.settlement_fee,
      settlement.settlement_fee_percent,
      settlement.settlement_fee_fixed,
      settlement.before_balance,
      settlement.after_balance,
      settlement.status,
      settlement.note,
      new Date(settlement.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `provider-settlements-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Provider settlements exported successfully");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
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

  // Format balance
  const formatBalance = (balance: string) => {
    return parseFloat(balance).toLocaleString();
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
      title="Provider Settlements"
      subtitle="Manage and monitor provider settlement transactions"
    >
      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Provider Settlement Transactions</CardTitle>
              <CardDescription>
                Showing {settlements.length} of {total} provider settlements
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Total Amount: {formatCurrency(totalAmount, "USD")}</span>
                <span>Total Fees: {formatCurrency(totalFees, "USD")}</span>
                <span>Success: {successCount}</span>
                <span>Failed: {failedCount}</span>
                <span>Pending: {pendingCount}</span>
              </div>
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
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExport}
                disabled={settlements.length === 0}
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
          ) : settlements.length === 0 ? (
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
                    <span className="text-2xl">🏦</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No provider settlements found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    There are no provider settlements to display at the moment.
                  </p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Fiat Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Balance Change</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(settlement.id.toString())
                        }
                        className="flex items-center hover:bg-gray-100 px-1 py-0.5 rounded transition-colors w-full text-left"
                      >
                        <div className="font-medium text-sm">
                          {settlement.id}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{settlement.provider_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {settlement.provider_method_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {settlement.payment_method_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {settlement.currency_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(
                          settlement.fiat_amount,
                          settlement.currency_code
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatCurrency(
                          settlement.settlement_fee,
                          settlement.currency_code
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {settlement.settlement_fee_percent}% +{" "}
                        {settlement.settlement_fee_fixed}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatBalance(settlement.before_balance)} →{" "}
                        {formatBalance(settlement.after_balance)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {settlement.currency_code}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(settlement.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(settlement)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
