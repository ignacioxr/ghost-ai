import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
}

export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-3xl border border-surface-border bg-elevated p-6 text-copy-primary ring-0">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-copy-muted">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
        <DialogFooter className="-mx-0 -mb-0 border-t-0 bg-transparent p-0">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
