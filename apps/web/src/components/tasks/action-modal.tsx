import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle } from "lucide-react";

export type ActionType = "danger" | "success";

interface ActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  cancelLabel?: string;
  type?: ActionType;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ActionModal({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Confirmar",
  cancelLabel = "Cancelar",
  type = "danger",
  onConfirm,
  isLoading = false,
}: ActionModalProps) {
  const isDanger = type === "danger";
  const isSuccess = type === "success";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {isDanger && (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            {isSuccess && (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            )}
            <AlertDialogTitle className="text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-gray-600">
          {description}
        </AlertDialogDescription>
        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={`${
              isDanger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? "Processando..." : actionLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}