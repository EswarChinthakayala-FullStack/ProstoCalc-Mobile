"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-right"
      gap={8}
      icons={{
        success: <CircleCheckIcon className="size-4" style={{ color: '#10b981' }} />,
        info: <InfoIcon className="size-4" style={{ color: '#3b82f6' }} />,
        warning: <TriangleAlertIcon className="size-4" style={{ color: '#f59e0b' }} />,
        error: <OctagonXIcon className="size-4" style={{ color: '#f43f5e' }} />,
        loading: <Loader2Icon className="size-4 animate-spin" style={{ color: '#94a3b8' }} />,
      }}
      style={{
        // ── Toast surface ──────────────────────────────────────────────
        "--normal-bg": "#ffffff",
        "--normal-border": "#e2e8f0",
        "--normal-text": "#0f172a",

        // ── Semantic types ─────────────────────────────────────────────
        "--success-bg": "#f0fdf4",
        "--success-border": "#bbf7d0",
        "--success-text": "#14532d",

        "--info-bg": "#eff6ff",
        "--info-border": "#bfdbfe",
        "--info-text": "#1e3a8a",

        "--warning-bg": "#fffbeb",
        "--warning-border": "#fde68a",
        "--warning-text": "#78350f",

        "--error-bg": "#fff1f2",
        "--error-border": "#fecdd3",
        "--error-text": "#881337",

        // ── Shape ──────────────────────────────────────────────────────
        "--border-radius": "12px",

        // ── Typography ────────────────────────────────────────────────
        "--font-size": "13px",
      }}
      toastOptions={{
        style: {
          fontFamily: "inherit",
          fontSize: "13px",
          fontWeight: "500",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          gap: "10px",
          padding: "12px 14px",
        },
        classNames: {
          toast: "!rounded-md",
          title: "!text-[13px] !font-semibold",
          description: "!text-[12px] !font-normal !leading-relaxed !opacity-70",
          actionButton: "!h-7 !px-3 !rounded-md !text-[11px] !font-semibold !bg-slate-900 !text-white",
          cancelButton: "!h-7 !px-3 !rounded-md !text-[11px] !font-medium !bg-slate-100 !border !border-slate-200 !text-slate-600",
          closeButton: "!w-6 !h-6 !rounded-md !bg-slate-100 !border !border-slate-200 !text-slate-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }