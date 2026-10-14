import { Lock } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessDenied() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Lock className="h-10 w-10 text-copy-faint" />
      <h1 className="text-lg font-semibold text-copy-primary">Access denied</h1>
      <p className="max-w-sm text-sm text-copy-muted">
        This project doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/editor" className={cn(buttonVariants(), "mt-2")}>
        Back to editor
      </Link>
    </div>
  );
}
