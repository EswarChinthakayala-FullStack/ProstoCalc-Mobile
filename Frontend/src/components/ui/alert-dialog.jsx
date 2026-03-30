import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Info, AlertTriangle, CheckCircle2 } from "lucide-react"

function AlertDialog({
  ...props
}) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  ...props
}) {
  return (<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />);
}

function AlertDialogPortal({
  ...props
}) {
  return (<AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />);
}

function AlertDialogOverlay({
  className,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-[#0f172a]/40 backdrop-blur-md transition-all duration-300",
        className
      )}
      {...props} />
  );
}

function AlertDialogContent({
  className,
  size = "default",
  variant = "clinical", // 'clinical', 'danger', 'info', 'success'
  ...props
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 group/alert-dialog-content fixed top-[50%] left-[50%] z-[100] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-6 rounded-[32px] sm:rounded-[40px] border border-slate-200/50 p-6 sm:p-8 md:p-10 shadow-2xl shadow-slate-900/10 duration-500 ease-[0.23,1,0.32,1] data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg",
          className
        )}
        {...props} />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "flex flex-col items-center sm:items-start text-center sm:text-left gap-4",
        className
      )}
      {...props} />
  );
}

function AlertDialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4 mt-2",
        className
      )}
      {...props} />
  );
}

function AlertDialogTitle({
  className,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.02em]",
        className
      )}
      {...props} />
  );
}

function AlertDialogDescription({
  className,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-slate-500 text-sm font-medium leading-relaxed opacity-90", className)}
      {...props} />
  );
}

function AlertDialogMedia({
  className,
  variant = "clinical",
  ...props
}) {
  const icons = {
    clinical: <ShieldAlert className="w-6 h-6 text-teal-600" />,
    danger: <AlertTriangle className="w-6 h-6 text-rose-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />
  }

  const bgColors = {
    clinical: "bg-teal-50 border-teal-100",
    danger: "bg-rose-50 border-rose-100",
    info: "bg-blue-50 border-blue-100",
    success: "bg-emerald-50 border-emerald-100"
  }

  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-4 inline-flex size-14 items-center justify-center rounded-md border shadow-sm",
        bgColors[variant] || bgColors.clinical,
        className
      )}
      {...props}
    >
      {icons[variant] || icons.clinical}
    </div>
  );
}

function AlertDialogAction({
  className,
  variant = "primary",
  ...props
}) {
  const variants = {
    primary: "bg-[#134e4a] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 rounded-md px-6 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest",
    destructive: "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/10 rounded-md px-6 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest",
    outline: "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-md px-6 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest"
  }

  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(
        "transition-all active:scale-[0.98] outline-none cursor-pointer text-center",
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(
        "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-md px-6 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] outline-none cursor-pointer text-center",
        className
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
