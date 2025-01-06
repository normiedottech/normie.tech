import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FlexibleAlertDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  cancelText?: string
  confirmText?: string
  onConfirm: () => void
}

export function FlexibleAlertDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Confirm",
  onConfirm
}: FlexibleAlertDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

