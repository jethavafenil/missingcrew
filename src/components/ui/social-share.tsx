"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/ToastProvider";
import { Share2, Link as LinkIcon } from "lucide-react";

export interface SocialShareProps {
  url: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

// Brand SVG icons (lightweight inline SVGs)
function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23 4.5a9.4 9.4 0 0 1-2.6.7 4.5 4.5 0 0 0 2-2.5 9 9 0 0 1-2.9 1.1A4.5 4.5 0 0 0 12.1 7 12.8 12.8 0 0 1 3.1 3.6 4.5 4.5 0 0 0 4.5 9a4.4 4.4 0 0 1-2-.5v.1a4.5 4.5 0 0 0 3.6 4.4 4.6 4.6 0 0 1-2 .1 4.5 4.5 0 0 0 4.2 3.1A9 9 0 0 1 2 18.6 12.7 12.7 0 0 0 8.9 21c8.3 0 12.8-6.9 12.8-12.8v-.6A9 9 0 0 0 23 4.5z" />
    </svg>
  );
}
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM14.5 9c-2.5 0-4 1.6-4 1.6V9H7v12h3.5v-6.6s1.2-1.6 3-1.6c1.5 0 2.5 1 2.5 3.1V21H20v-6.1C20 11 17.7 9 14.5 9z" />
    </svg>
  );
}
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.3V12h2.3V9.7c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .2 2 .2v2.3h-1.1c-1.1 0-1.4.7-1.4 1.3V12h2.5l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  // Simple Icons WhatsApp glyph (official shape). We color it with the brand green using className.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.52 3.48A11.88 11.88 0 0012.02 0C5.39 0 .03 5.36.04 11.98c.01 2.11.57 4.17 1.6 6L0 24l6.22-1.63a11.93 11.93 0 005.8 1.5c6.63 0 12-5.37 12-12 0-3.2-1.26-6.2-3.5-8.39zM12.02 21.5h-.01a10.2 10.2 0 01-5.19-1.42l-.37-.21-3.08.81.82-3-.24-.38a10.2 10.2 0 1118.1-5.91 10.2 10.2 0 01-10.03 10.11zm5.6-7.6c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.66.14-.2.3-.76.98-.93 1.18-.17.2-.34.22-.63.08-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.04-.17-.29-.02-.45.13-.6.14-.14.3-.35.46-.53.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.53-.08-.15-.66-1.6-.9-2.2-.24-.58-.49-.5-.66-.51h-.56c-.2 0-.52.07-.8.35-.27.28-1.05 1.02-1.05 2.47s1.08 2.86 1.23 3.06c.15.2 2.14 3.28 5.18 4.53.72.31 1.27.5 1.7.64.72.23 1.37.2 1.88.12.57-.09 1.75-.72 2-1.43.25-.71.25-1.31.18-1.44-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}

export function SocialShare({ url, title, description, buttonLabel = "Share" }: SocialShareProps) {
  const { success, error } = useToast();
  const [open, setOpen] = useState(false);

  const shareText = useMemo(() => title || "Check this out", [title]);
  const shareDesc = description || "";

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(shareText);
  const encodedText = encodeURIComponent(`${shareText}${shareDesc ? " — " + shareDesc : ""}`);

  const shareTargets = [
    {
      key: "twitter",
      label: "Twitter/X",
      color: "text-black",
      bg: "bg-gray-100 hover:bg-gray-200",
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      color: "text-[#0A66C2]",
      bg: "bg-blue-50 hover:bg-blue-100",
      icon: LinkedInIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      color: "text-[#1877F2]",
      bg: "bg-blue-50 hover:bg-blue-100",
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      color: "text-[#25D366]",
      bg: "bg-green-50 hover:bg-green-100",
      icon: WhatsAppIcon,
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    },
  ] as const;

  const openWindow = useCallback((href: string) => {
    const w = 600;
    const h = 550;
    const y = window.top ? (window.top.outerHeight - h) / 2 : 0;
    const x = window.top ? (window.top.outerWidth - w) / 2 : 0;
    window.open(
      href,
      "_blank",
      `noopener,noreferrer,width=${w},height=${h},left=${x},top=${y}`
    );
  }, []);

  const tryWebShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareText, text: shareDesc || undefined, url });
        success("Shared successfully");
        return true;
      }
    } catch (e) {
      // Silently fall back to dialog on user-cancel or errors
    }
    return false;
  }, [shareText, shareDesc, url, success]);

  const onClickMain = useCallback(async () => {
    const usedWebShare = await tryWebShare();
    if (!usedWebShare) setOpen(true);
  }, [tryWebShare]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      success("Link copied to clipboard");
    } catch (e) {
      error("Failed to copy link");
    }
  }, [url, success, error]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={onClickMain} className="gap-2">
          <Share2 className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[92vw] max-w-sm sm:max-w-md max-h-[80vh] overflow-y-auto p-5">
        <DialogHeader>
          <DialogTitle>Share this profile</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {shareTargets.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => openWindow(t.href)}
                aria-label={`Share via ${t.label}`}
                className={`flex flex-col items-center justify-center gap-2 rounded-md p-4 sm:p-3 border min-h-[64px] ${t.bg}`}
              >
                <Icon className={`h-6 w-6 sm:h-5 sm:w-5 ${t.color}`} />
                <span className="text-[11px] sm:text-xs font-medium text-gray-700">{t.label}</span>
              </button>
            );
          })}
          <button
            onClick={copyLink}
            aria-label="Copy link to clipboard"
            className={`flex flex-col items-center justify-center gap-2 rounded-md p-4 sm:p-3 border bg-gray-50 hover:bg-gray-100 min-h-[64px]`}
          >
            <LinkIcon className="h-6 w-6 sm:h-5 sm:w-5 text-gray-700" />
            <span className="text-[11px] sm:text-xs font-medium text-gray-700">Copy link</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SocialShare;
