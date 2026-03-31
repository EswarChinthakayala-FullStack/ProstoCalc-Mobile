"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "../../context/ThemeContext"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  const { theme = "light" } = useTheme()

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
        "--normal-bg": "var(--card)",
        "--normal-border": "var(--border)",
        "--normal-text": "var(--foreground)",

        // ── Semantic types ─────────────────────────────────────────────
        "--success-bg": "color-mix(in srgb, var(--background), #10b981 10%)",
        "--success-border": "color-mix(in srgb, var(--border), #10b981 20%)",
        "--success-text": "var(--foreground)",

        "--info-bg": "color-mix(in srgb, var(--background), #3b82f6 10%)",
        "--info-border": "color-mix(in srgb, var(--border), #3b82f6 20%)",
        "--info-text": "var(--foreground)",

        "--warning-bg": "color-mix(in srgb, var(--background), #f59e0b 10%)",
        "--warning-border": "color-mix(in srgb, var(--border), #f59e0b 20%)",
        "--warning-text": "var(--foreground)",

        "--error-bg": "color-mix(in srgb, var(--background), #f43f5e 10%)",
        "--error-border": "color-mix(in srgb, var(--border), #f43f5e 20%)",
        "--error-text": "var(--foreground)",

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
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          gap: "12px",
          padding: "14px 16px",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        },
        classNames: {
          toast: "!rounded-md !border-border",
          title: "!text-[13px] !font-bold",
          description: "!text-[12px] !font-medium !leading-relaxed !opacity-90",
          actionButton: "!h-8 !px-4 !rounded-lg !text-[11px] !font-bold !bg-primary !text-primary-foreground !shadow-lg !shadow-primary/20",
          cancelButton: "!h-8 !px-4 !rounded-lg !text-[11px] !font-bold !bg-muted !border !border-border !text-muted-foreground",
          closeButton: "!w-7 !h-7 !rounded-full !bg-muted !border !border-border !text-muted-foreground !transition-colors hover:!bg-accent hover:!text-accent-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }