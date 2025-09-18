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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { toast } from "sonner";
import { Settlement } from "@/types/settlement";
import api from "@/lib/auth";

interface SettlementDetail extends Settlement {
  merchant_method_name?: string;
  payment_method_name?: string;
  currency_sign?: string;
  commission_rate_percent?: string;
  commission_rate_fixed?: string;
  commission_amount?: string;
  before_balance?: string;
  after_balance?: string;
  note?: string;
  tronscan_url?: string;
  updated_by?: string;
}

export default function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [settlement, setSettlement] = useState<SettlementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    note: "",
    usdt_amount: "",
    tronscan_url: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch settlement details
  const fetchSettlementDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/settlements/${id}`);
      const settlementData = response.data;
      setSettlement(settlementData);
      setEditForm({
        status: settlementData.status,
        note: settlementData.note || "",
        usdt_amount: settlementData.usdt_amount || "",
        tronscan_url: settlementData.tronscan_url || "",
      });
    } catch (error: any) {
      console.error("Error fetching settlement details:", error);
      if (error.response?.status === 404) {
        setError("Settlement not found");
      } else if (error.response?.status === 403) {
        setError(
          "Access denied: You don't have permission to view this settlement"
        );
      } else {
        setError("Failed to load settlement details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementDetails();
  }, [id]);

  const handleBack = () => {
    navigate("/settlements");
  };

  const handleRefresh = () => {
    fetchSettlementDetails();
    toast.success("Settlement details refreshed");
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleApprove = () => {
    setIsEditDialogOpen(true);
  };

  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!settlement) return;

    setSaveLoading(true);
    try {
      await api.patch(`/settlements/${settlement.id}/approve`, {
        note: editForm.note,
        usdt_amount: editForm.usdt_amount
          ? parseFloat(editForm.usdt_amount)
          : undefined,
        tronscan_url: editForm.tronscan_url || undefined,
      });

      setSettlement({
        ...settlement,
        status: "paid",
        note: editForm.note,
        usdt_amount: editForm.usdt_amount || settlement.usdt_amount,
        tronscan_url: editForm.tronscan_url || settlement.tronscan_url,
        updated_at: new Date().toISOString(),
      });

      setIsEditDialogOpen(false);
      toast.success("Settlement approved successfully");
    } catch (error: any) {
      console.error("Error updating settlement:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Access denied: You don't have permission to approve settlements"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to approve settlement"
        );
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelApprove = () => {
    setEditForm({
      status: settlement?.status || "",
      note: settlement?.note || "",
      usdt_amount: settlement?.usdt_amount || "",
      tronscan_url: settlement?.tronscan_url || "",
    });
    setIsEditDialogOpen(false);
  };

  const handleRejectSettlement = async () => {
    if (!settlement) return;

    setSaveLoading(true);
    try {
      await api.patch(`/settlements/${settlement.id}/reject`, {
        reason: editForm.note,
      });

      setSettlement({
        ...settlement,
        status: "failed",
        note: editForm.note,
        updated_at: new Date().toISOString(),
      });

      setIsRejectDialogOpen(false);
      toast.success("Settlement rejected successfully");
    } catch (error: any) {
      console.error("Error rejecting settlement:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Access denied: You don't have permission to reject settlements"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to reject settlement"
        );
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelReject = () => {
    setEditForm({
      status: settlement?.status || "",
      note: settlement?.note || "",
      usdt_amount: settlement?.usdt_amount || "",
      tronscan_url: settlement?.tronscan_url || "",
    });
    setIsRejectDialogOpen(false);
  };

  // Get status badge color and icon
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-4 h-4" />,
        label: "Pending",
      },
      processing: {
        color: "bg-blue-100 text-blue-800",
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        label: "Processing",
      },
      paid: {
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Paid",
      },
      failed: {
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-4 h-4" />,
        label: "Failed",
      },
      cancelled: {
        color: "bg-gray-100 text-gray-800",
        icon: <X className="w-4 h-4" />,
        label: "Cancelled",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  if (loading) {
    return (
      <AuthenticatedLayout
        title="Settlement Details"
        subtitle="Loading settlement information..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !settlement) {
    return (
      <AuthenticatedLayout
        title="Settlement Details"
        subtitle="Error loading settlement"
      >
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                {error || "Settlement not found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                The settlement you're looking for doesn't exist or you don't
                have permission to view it.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Settlements
                </Button>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Settlement Details"
      subtitle={`Settlement #${settlement.id}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settlements
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {settlement.status === "pending" && (
              <>
                <Button onClick={handleApprove} variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Settlement
                </Button>
                <Button onClick={handleReject} variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Settlement
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Settlement Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core settlement details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Settlement ID
                  </Label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopyToClipboard(settlement.id.toString())
                      }
                      className="font-mono text-lg font-semibold hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    >
                      #{settlement.id}
                    </button>
                    <Copy className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(settlement.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Merchant
                  </Label>
                  <p className="text-lg font-medium">
                    {settlement.merchant_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="text-lg font-medium">
                    {settlement.payment_method_name ||
                      settlement.merchant_method_name ||
                      "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </Label>
                  <p className="text-sm">{formatDate(settlement.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </Label>
                  <p className="text-sm">{formatDate(settlement.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Amount and currency details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Fiat Amount
                  </Label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      settlement.fiat_amount,
                      settlement.currency_name
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    USDT Amount
                  </Label>
                  <p className="text-2xl font-bold text-green-600">
                    USDT {parseFloat(settlement.usdt_amount).toLocaleString()}
                  </p>
                </div>
              </div>

              {settlement.tronscan_url && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Tronscan URL
                    </Label>
                    <div className="flex items-center gap-2">
                      <a
                        href={settlement.tronscan_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                      >
                        View Transaction
                      </a>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(settlement.tronscan_url!)
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settlement.commission_amount && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Commission Rate
                    </Label>
                    <p className="text-lg font-medium">
                      {settlement.commission_rate_percent}%
                      {settlement.commission_rate_fixed &&
                        ` + ${settlement.commission_rate_fixed}`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Commission Amount
                    </Label>
                    <p className="text-lg font-medium">
                      {formatCurrency(
                        settlement.commission_amount,
                        settlement.currency_name
                      )}
                    </p>
                  </div>
                </div>
              )}

              {(settlement.before_balance || settlement.after_balance) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Before Balance
                    </Label>
                    <p className="text-lg font-medium">
                      {formatCurrency(
                        settlement.before_balance || "0",
                        settlement.currency_name
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      After Balance
                    </Label>
                    <p className="text-lg font-medium">
                      {formatCurrency(
                        settlement.after_balance || "0",
                        settlement.currency_name
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        {settlement.note && (
          <Card>
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{settlement.note}</p>
            </CardContent>
          </Card>
        )}

        {/* Approve Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Approve Settlement</DialogTitle>
              <DialogDescription>
                Approve settlement #{settlement.id} and add an optional note
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="usdt_amount" className="text-right">
                  USDT Amount
                </Label>
                <Input
                  id="usdt_amount"
                  type="number"
                  step="0.01"
                  value={editForm.usdt_amount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, usdt_amount: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter USDT amount (optional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tronscan_url" className="text-right">
                  Tronscan URL
                </Label>
                <Input
                  id="tronscan_url"
                  type="url"
                  value={editForm.tronscan_url}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tronscan_url: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter Tronscan URL (optional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="note" className="text-right">
                  Note
                </Label>
                <textarea
                  id="note"
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm({ ...editForm, note: e.target.value })
                  }
                  className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional note for this settlement"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelApprove}
                disabled={saveLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveChanges}
                disabled={saveLoading}
              >
                {saveLoading ? "Approving..." : "Approve Settlement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reject Settlement</DialogTitle>
              <DialogDescription>
                Reject settlement #{settlement.id} and provide a reason
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reject_note" className="text-right">
                  Reason *
                </Label>
                <textarea
                  id="reject_note"
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm({ ...editForm, note: e.target.value })
                  }
                  className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Please provide a reason for rejecting this settlement"
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelReject}
                disabled={saveLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRejectSettlement}
                disabled={saveLoading || !editForm.note.trim()}
              >
                {saveLoading ? "Rejecting..." : "Reject Settlement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
