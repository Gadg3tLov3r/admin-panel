import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Copy, Download, RotateCcw, CheckCircle, RefreshCw, Undo2 } from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Disbursement } from "@/types/disbursement";
import api from "@/lib/auth";
import JsonView from "@uiw/react-json-view";

export default function DisbursementDetailsPage() {
  const { disbursementId } = useParams<{ disbursementId: string }>();
  const navigate = useNavigate();
  const [disbursement, setDisbursement] = useState<Disbursement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repushing, setRepushing] = useState(false);
  const [retryingCallback, setRetryingCallback] = useState(false);
  const [retryingVerification, setRetryingVerification] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundPassword, setRefundPassword] = useState("");

  useEffect(() => {
    if (disbursementId && !isNaN(Number(disbursementId))) {
      fetchDisbursementDetails();
    } else if (disbursementId) {
      setError("Invalid disbursement ID");
      setLoading(false);
    }
  }, [disbursementId]);

  const fetchDisbursementDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Disbursement>(
        `/disbursements/${Number(disbursementId)}`
      );
      setDisbursement(response.data);
    } catch (error: any) {
      console.error("Error fetching disbursement details:", error);
      if (error.response?.status === 404) {
        setError("Disbursement not found");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view this disbursement");
      } else {
        setError("Failed to load disbursement details");
      }
      toast.error("Failed to load disbursement details");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownloadJson = () => {
    if (!disbursement) return;

    const jsonString = JSON.stringify(disbursement, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disbursement-${disbursement.cmpss_disbursement_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Disbursement details downloaded");
  };

  const handleRepushDisbursement = async () => {
    if (!disbursement) return;

    const confirmed = window.confirm(
      `Are you sure you want to repush disbursement ${disbursement.cmpss_disbursement_id}?`
    );
    if (!confirmed) return;

    setRepushing(true);
    try {
      await api.post("/disbursements/repush-disbursement-order", {
        cmpss_disbursement_id: disbursement.cmpss_disbursement_id,
      });
      toast.success("Disbursement repush triggered successfully");
      // Refresh the disbursement details to get updated status
      fetchDisbursementDetails();
    } catch (error: any) {
      console.error("Error repushing disbursement:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Access denied: You don't have permission to repush disbursements"
        );
      } else if (error.response?.data?.detail) {
        toast.error(`Error: ${error.response.data.detail}`);
      } else {
        toast.error("Failed to repush disbursement. Please try again.");
      }
    } finally {
      setRepushing(false);
    }
  };

  // Check if disbursement is eligible for repush
  const isEligibleForRepush = (disbursement: Disbursement) => {
    // Check if status is pending or processing
    const validStatus =
      disbursement.order_status === "pending" ||
      disbursement.order_status === "processing";

    // Check if third_party_provider_id is null or blank
    const noThirdPartyProvider =
      !disbursement.third_party_provider_id ||
      disbursement.third_party_provider_id.trim() === "";

    // Check if created_at is greater than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const createdAt = new Date(disbursement.created_at);
    const isOlderThanOneHour = createdAt < oneHourAgo;

    return validStatus && noThirdPartyProvider && isOlderThanOneHour;
  };

  // Check if disbursement is eligible for retry verification
  const isEligibleForRetryVerification = (disbursement: Disbursement) => {
    return disbursement.order_status === "processing";
  };

  // Handle retry callback
  const handleRetryCallback = async () => {
    if (!disbursement) return;

    const confirmed = window.confirm(
      `Are you sure you want to retry the callback for disbursement ${disbursement.cmpss_disbursement_id}?`
    );
    if (!confirmed) return;

    setRetryingCallback(true);
    try {
      await api.post("/disbursements/trigger-callback", {
        cmpss_disbursement_id: disbursement.cmpss_disbursement_id,
      });
      toast.success("Callback triggered successfully");
      // Refresh the disbursement details
      fetchDisbursementDetails();
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
      setRetryingCallback(false);
    }
  };

  // Handle retry verification
  const handleRetryVerification = async () => {
    if (!disbursement) return;

    const confirmed = window.confirm(
      `Are you sure you want to retry verification for disbursement ${disbursement.cmpss_disbursement_id}?`
    );
    if (!confirmed) return;

    setRetryingVerification(true);
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
      // Refresh the disbursement details
      fetchDisbursementDetails();
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
      setRetryingVerification(false);
    }
  };

  // Handle mark as refunded
  const handleMarkAsRefunded = async () => {
    if (!disbursement || !refundPassword.trim()) {
      toast.error("Please enter a password");
      return;
    }

    setRefunding(true);
    try {
      await api.post("/disbursements/mark-paid-order-refunded", {
        cmpss_disbursement_id: disbursement.cmpss_disbursement_id,
        password: refundPassword,
      });
      toast.success("Disbursement marked as refunded successfully");
      setRefundDialogOpen(false);
      setRefundPassword("");
      // Refresh the disbursement details to get updated status
      fetchDisbursementDetails();
    } catch (error: any) {
      console.error("Error marking disbursement as refunded:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Access denied: You don't have permission to mark disbursements as refunded"
        );
      } else if (error.response?.status === 400) {
        toast.error("Invalid password or disbursement cannot be refunded");
      } else if (error.response?.data?.detail) {
        toast.error(`Error: ${error.response.data.detail}`);
      } else {
        toast.error("Failed to mark disbursement as refunded. Please try again.");
      }
    } finally {
      setRefunding(false);
    }
  };

  // Check if disbursement is eligible for refund
  const isEligibleForRefund = (disbursement: Disbursement) => {
    return disbursement.order_status === "paid";
  };

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

  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <AuthenticatedLayout
        title="Disbursement Details"
        subtitle="Loading disbursement information..."
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !disbursement) {
    return (
      <AuthenticatedLayout
        title="Disbursement Details"
        subtitle="Error loading disbursement information"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              {error || "Disbursement not found"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {error === "Disbursement not found"
                ? "The disbursement you're looking for doesn't exist."
                : "There was an error loading the disbursement details."}
            </p>
            <Button onClick={() => navigate("/disbursements")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Disbursements
            </Button>
          </CardContent>
        </Card>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Disbursement Details"
      subtitle={`CMPSS Disbursement ID: ${disbursement.cmpss_disbursement_id}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/disbursements")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Disbursements
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRetryCallback}
              disabled={retryingCallback}
              className="flex items-center gap-2"
            >
              {retryingCallback ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              {retryingCallback ? "Retrying..." : "Retry Callback"}
            </Button>

            {isEligibleForRetryVerification(disbursement) && (
              <Button
                variant="outline"
                onClick={handleRetryVerification}
                disabled={retryingVerification}
                className="flex items-center gap-2"
              >
                {retryingVerification ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {retryingVerification ? "Retrying..." : "Retry Verification"}
              </Button>
            )}

            {isEligibleForRepush(disbursement) && (
              <Button
                variant="outline"
                onClick={handleRepushDisbursement}
                disabled={repushing}
                className="flex items-center gap-2"
              >
                <RotateCcw
                  className={`w-4 h-4 ${repushing ? "animate-spin" : ""}`}
                />
                {repushing ? "Repushing..." : "Repush Disbursement"}
              </Button>
            )}

            {isEligibleForRefund(disbursement) && (
              <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Undo2 className="w-4 h-4" />
                    Mark as Refunded
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Mark as Refunded</DialogTitle>
                    <DialogDescription>
                      This action will mark the disbursement as refunded. Please enter the required password to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="password" className="text-right">
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={refundPassword}
                        onChange={(e) => setRefundPassword(e.target.value)}
                        className="col-span-3"
                        placeholder="Enter password"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleMarkAsRefunded();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRefundDialogOpen(false);
                        setRefundPassword("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleMarkAsRefunded}
                      disabled={refunding || !refundPassword.trim()}
                    >
                      {refunding ? "Processing..." : "Mark as Refunded"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              onClick={() =>
                handleCopyToClipboard(JSON.stringify(disbursement, null, 2))
              }
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy JSON
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadJson}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </Button>
          </div>
        </div>

        {/* Disbursement Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Disbursement Summary
              {getStatusBadge(disbursement.order_status)}
            </CardTitle>
            <CardDescription>
              Basic information about this disbursement transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  CMPSS Disbursement ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {disbursement.cmpss_disbursement_id}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleCopyToClipboard(disbursement.cmpss_disbursement_id)
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant Disbursement ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {disbursement.merchant_disbursement_id}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleCopyToClipboard(
                        disbursement.merchant_disbursement_id
                      )
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Amount
                </label>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(
                    disbursement.order_amount,
                    disbursement.currency_code
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant Fee
                </label>
                <p className="text-lg font-semibold text-purple-600 mt-1">
                  {formatCurrency(
                    disbursement.merchant_fee || "0",
                    disbursement.currency_code
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Provider
                </label>
                <p className="text-sm mt-1">{disbursement.provider_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </label>
                <p className="text-sm mt-1">
                  {disbursement.payment_method_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merchant
                </label>
                <p className="text-sm mt-1">{disbursement.merchant_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Account Number
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">
                    {disbursement.account_details?.account_number || "N/A"}
                  </p>
                  {disbursement.account_details?.account_number && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopyToClipboard(
                          disbursement.account_details.account_number
                        )
                      }
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created At
                </label>
                <p className="text-sm mt-1">
                  {formatDate(disbursement.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Updated At
                </label>
                <p className="text-sm mt-1">
                  {formatDate(disbursement.updated_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw JSON Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Disbursement Data</CardTitle>
            <CardDescription>
              Complete disbursement information in JSON format with syntax
              highlighting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <JsonView
                value={disbursement}
                style={{
                  backgroundColor: "#f8f9fa",
                  fontSize: "14px",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                }}
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={true}
                collapsed={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
