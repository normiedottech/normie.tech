"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchAllZellePayments, 
  updateZelleMetadata, 
  getTransactionWithPayoutAddress,
  confirmZellePayment,
  updatePayoutDetails,
  verifyTransaction
} from "@/actions/zelle";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { zellePaymentsMetadata } from "@normietech/core/database/schema/index";
import { toast } from "sonner";

type ZellePayment = typeof zellePaymentsMetadata.$inferSelect;

type PaginatedResponse = {
  payments: ZellePayment[];
  total: number;
};

export default function ZelleManualPage() {
  const [selectedPayment, setSelectedPayment] = useState<ZellePayment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPayoutDetailsModalOpen, setIsPayoutDetailsModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [blockchainTransactionHash, setBlockchainTransactionHash] = useState("");
  const [payoutAddress, setPayoutAddress] = useState<string | null>(null);
  const [payoutDetails, setPayoutDetails] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [searchId, setSearchId] = useState("");
  const [verifyInput, setVerifyInput] = useState({
    blockchainTransactionId: "",
    finalAmountInFiat: 0,
    platformFeesInFiat: 0,
    paymentProcessFeesInFiat: 0,
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["zelle-payments", page],
    queryFn: async () => {
      const result = await fetchAllZellePayments({ page, pageSize });
      if (!result.success) {
        toast.error(result.error);
        return { payments: [], total: 0 };
      }
      return result.data;
    },
  });

  const filteredPayments = data?.payments?.filter((payment) => 
    payment.transactionId?.toLowerCase().includes(searchId.toLowerCase())
  ) ?? [];

  const { data: transactionData } = useQuery({
    queryKey: ["transaction-payout", selectedPayment?.transactionId],
    queryFn: async () => {
      if (!selectedPayment?.transactionId) return null;
      const result = await getTransactionWithPayoutAddress(selectedPayment.transactionId);
      if (result.success) {
        setPayoutAddress(result.data?.payoutAddress ?? null);
      }
      return result;
    },
    enabled: !!selectedPayment?.transactionId,
  });

  const updateMutation = useMutation({
    mutationFn: async (payment: ZellePayment) => {
      if (!payment.transactionId) throw new Error("Transaction ID is required");
      const result = await updateZelleMetadata(payment.transactionId, {
        amount: payment.amount,
        payoutDetails: payment.payoutDetails,
        errorMessage: payment.errorMessage,
        successMessage: payment.successMessage,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zelle-payments"] });
      setIsModalOpen(false);
      toast.success("Payment details updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayment?.transactionId) throw new Error("Transaction ID is required");
      if (!blockchainTransactionHash) throw new Error("Blockchain transaction hash is required");
      
      const result = await confirmZellePayment(
        selectedPayment.transactionId,
        blockchainTransactionHash
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zelle-payments"] });
      setIsConfirmModalOpen(false);
      setBlockchainTransactionHash("");
      toast.success("Payment confirmed successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePayoutDetailsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayment?.transactionId) throw new Error("Transaction ID is required");
      const result = await updatePayoutDetails(selectedPayment.transactionId, {
        payoutDetails,
        amount: amount ?? undefined,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zelle-payments"] });
      setIsPayoutDetailsModalOpen(false);
      setPayoutDetails("");
      setAmount(null);
      toast.success("Payout details updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayment?.transactionId) throw new Error("Transaction ID is required");
      const result = await verifyTransaction(selectedPayment.transactionId, verifyInput);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zelle-payments"] });
      setIsVerifyModalOpen(false);
      setVerifyInput({
        blockchainTransactionId: "",
        finalAmountInFiat: 0,
        platformFeesInFiat: 0,
        paymentProcessFeesInFiat: 0,
      });
      toast.success("Transaction verified successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSavePayment = () => {
    if (!selectedPayment) return;
    updateMutation.mutate(selectedPayment);
  };

  const handleConfirmPayment = () => {
    confirmMutation.mutate();
  };

  const handleUpdatePayoutDetails = () => {
    updatePayoutDetailsMutation.mutate();
  };

  const handleVerifyTransaction = () => {
    verifyMutation.mutate();
  };

  if (isLoading) {
    return <div className="container mx-auto mt-24">Loading...</div>;
  }

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  return (
    <div className="container mx-auto mt-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Zelle Manual Payments</h1>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by Transaction ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-64"
          />
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments.map((payment: ZellePayment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.transactionId}</TableCell>
              <TableCell>{payment.amount} {payment.currency}</TableCell>
              <TableCell>{payment.confirmationStatus}</TableCell>
              <TableCell>{format(new Date(payment.createdAt ?? new Date()), "PPpp")}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setIsModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                {payment.confirmationStatus === "wait-for-payment-details" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setPayoutDetails(payment.payoutDetails ?? "");
                      setAmount(payment.amount);
                      setIsPayoutDetailsModalOpen(true);
                    }}
                  >
                    Add Payout Details
                  </Button>
                )}
                {payment.confirmationStatus === "payment-confirmed-by-sender" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsVerifyModalOpen(true);
                      }}
                    >
                      Verify Transaction
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsConfirmModalOpen(true);
                      }}
                    >
                      Confirm
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.total ?? 0)} of {data?.total ?? 0} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Amount</label>
              <Input
                className="col-span-3"
                value={selectedPayment?.amount ?? ""}
                onChange={(e) =>
                  setSelectedPayment({
                    ...selectedPayment!,
                    amount: parseFloat(e.target.value) || null,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Payout Details</label>
              <Textarea
                className="col-span-3"
                value={selectedPayment?.payoutDetails ?? ""}
                onChange={(e) =>
                  setSelectedPayment({
                    ...selectedPayment!,
                    payoutDetails: e.target.value || null,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Error Message</label>
              <Textarea
                className="col-span-3"
                value={selectedPayment?.errorMessage ?? ""}
                onChange={(e) =>
                  setSelectedPayment({
                    ...selectedPayment!,
                    errorMessage: e.target.value || null,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Success Message</label>
              <Textarea
                className="col-span-3"
                value={selectedPayment?.successMessage ?? ""}
                onChange={(e) =>
                  setSelectedPayment({
                    ...selectedPayment!,
                    successMessage: e.target.value || null,
                  })
                }
              />
            </div>
            {payoutAddress && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Payout Address</label>
                <div className="col-span-3 break-all">{payoutAddress}</div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleSavePayment}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Blockchain Transaction Hash</label>
              <Input
                className="col-span-3"
                value={blockchainTransactionHash}
                onChange={(e) => setBlockchainTransactionHash(e.target.value)}
                placeholder="Enter the blockchain transaction hash"
              />
            </div>
            {payoutAddress && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Payout Address</label>
                <div className="col-span-3 break-all">{payoutAddress}</div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            {/* <Button 
              onClick={handleConfirmPayment}
              disabled={confirmMutation.isPending || !blockchainTransactionHash}
            >
              {confirmMutation.isPending ? "Confirming..." : "Confirm Payment"}
            </Button> */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payout Details Modal */}
      <Dialog open={isPayoutDetailsModalOpen} onOpenChange={setIsPayoutDetailsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payout Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Amount</label>
              <Input
                className="col-span-3"
                type="number"
                value={amount ?? ""}
                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Enter amount (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Payout Details</label>
              <Textarea
                className="col-span-3"
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder="Enter payout details"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleUpdatePayoutDetails}
              disabled={updatePayoutDetailsMutation.isPending || !payoutDetails}
            >
              {updatePayoutDetailsMutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verify Transaction Modal */}
      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Blockchain Transaction ID</label>
              <Input
                className="col-span-3"
                value={verifyInput.blockchainTransactionId}
                onChange={(e) => setVerifyInput({
                  ...verifyInput,
                  blockchainTransactionId: e.target.value,
                })}
                placeholder="Enter blockchain transaction ID"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Final Amount (USD)</label>
              <Input
                className="col-span-3"
                type="number"
                value={verifyInput.finalAmountInFiat}
                onChange={(e) => setVerifyInput({
                  ...verifyInput,
                  finalAmountInFiat: parseFloat(e.target.value) || 0,
                })}
                placeholder="Enter final amount in USD"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Platform Fees (USD)</label>
              <Input
                className="col-span-3"
                type="number"
                value={verifyInput.platformFeesInFiat}
                onChange={(e) => setVerifyInput({
                  ...verifyInput,
                  platformFeesInFiat: parseFloat(e.target.value) || 0,
                })}
                placeholder="Enter platform fees in USD"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Payment Process Fees (USD)</label>
              <Input
                className="col-span-3"
                type="number"
                value={verifyInput.paymentProcessFeesInFiat}
                onChange={(e) => setVerifyInput({
                  ...verifyInput,
                  paymentProcessFeesInFiat: parseFloat(e.target.value) || 0,
                })}
                placeholder="Enter payment process fees in USD"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleVerifyTransaction}
              disabled={verifyMutation.isPending || !verifyInput.blockchainTransactionId || !verifyInput.finalAmountInFiat}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
