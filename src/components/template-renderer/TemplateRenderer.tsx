"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { InvitationContent } from "@/lib/templates/schema";
import { TemplateTheme } from "@/lib/templates/registry";
import {
  INTERACTIVE_TEMPLATE_URLS,
  hydrateInteractiveHtml,
} from "@/lib/templates/hydrateInteractiveHtml";
import type { Card01Stage } from "@/components/cards/card-01-first-gift/Card01Player";
import type { Card02Stage } from "@/components/cards/card-02-second-gift/Card02Player";
import type { Card03Stage } from "@/components/cards/card-03-third-gift/Card03Player";
import CoverBlock from "./blocks/CoverBlock";

const Card01Player = dynamic(
  () => import("@/components/cards/card-01-first-gift/Card01Player"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] bg-[#080d1a] flex flex-col items-center justify-center text-white/80 text-xs gap-2">
        <div className="w-7 h-7 rounded-full border-2 border-pink-400/40 border-t-pink-400 animate-spin" />
        <span>Đang khởi tạo không gian 3D...</span>
      </div>
    ),
  }
);

const Card02Player = dynamic(
  () => import("@/components/cards/card-02-second-gift/Card02Player"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] bg-[#190b17] flex flex-col items-center justify-center text-rose-100/80 text-xs gap-2">
        <div className="w-7 h-7 rounded-full border-2 border-rose-400/40 border-t-rose-400 animate-spin" />
        <span>Đang chuẩn bị đóa hồng 3D...</span>
      </div>
    ),
  }
);

const Card03Player = dynamic(
  () => import("@/components/cards/card-03-third-gift/Card03Player"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] bg-[#fed1ea] flex flex-col items-center justify-center text-[#613b3b] text-xs gap-2">
        <div className="w-7 h-7 rounded-full border-2 border-rose-400/40 border-t-rose-500 animate-spin" />
        <span>Đang mở thiệp Flowtime 55 trang...</span>
      </div>
    ),
  }
);
import EnvelopeRevealBlock from "./blocks/EnvelopeRevealBlock";
import IntroMessageBlock from "./blocks/IntroMessageBlock";
import EventDetailsBlock from "./blocks/EventDetailsBlock";
import CountdownBlock from "./blocks/CountdownBlock";
import GalleryBlock from "./blocks/GalleryBlock";
import RsvpBlock from "./blocks/RsvpBlock";
import GuestbookBlock from "./blocks/GuestbookBlock";
import ResponseQuestionBlock from "./blocks/ResponseQuestionBlock";
import MusicControlBlock from "./blocks/MusicControlBlock";
import FooterCtaBlock from "./blocks/FooterCtaBlock";
import GalaxyRainMotion from "./blocks/GalaxyRainMotion";

interface TemplateRendererProps {
  content: InvitationContent;
  theme: TemplateTheme;
  slug?: string;
  templateSlug?: string;
  interactiveHtml?: string;
  isPreview?: boolean;
  autoDemo?: boolean;
  card01Stage?: Card01Stage;
  card02Stage?: Card02Stage;
  card03Stage?: Card03Stage;
}

export default function TemplateRenderer({
  content,
  theme,
  slug,
  templateSlug,
  interactiveHtml,
  isPreview = false,
  autoDemo = false,
  card01Stage,
  card02Stage,
  card03Stage,
}: TemplateRendererProps) {
  const isCard01 =
    templateSlug === "card-01-first-gift" || slug === "card-01-first-gift";
  const isCard02 =
    templateSlug === "card-02-second-gift" || slug === "card-02-second-gift";
  const isCard03 =
    templateSlug === "card-03-third-gift" || slug === "card-03-third-gift";

  const effectiveTemplateSlug =
    (templateSlug && INTERACTIVE_TEMPLATE_URLS[templateSlug] ? templateSlug : undefined) ||
    (slug && INTERACTIVE_TEMPLATE_URLS[slug] ? slug : undefined);

  const interactiveUrl =
    (effectiveTemplateSlug && INTERACTIVE_TEMPLATE_URLS[effectiveTemplateSlug]) ||
    (content as any)?.interactiveUrl;

  const resolvedInteractiveSlug =
    effectiveTemplateSlug ||
    (typeof interactiveUrl === "string"
      ? interactiveUrl.match(/\/templates\/([^/.?#]+)\.html/)?.[1]
      : undefined);

  const [rawTemplateHtml, setRawTemplateHtml] = useState<string | null>(null);
  const [debouncedContent, setDebouncedContent] = useState<InvitationContent>(content);

  useEffect(() => {
    if (!isPreview) {
      setDebouncedContent(content);
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, 350);
    return () => clearTimeout(timer);
  }, [content, isPreview]);

  useEffect(() => {
    if (interactiveHtml || !interactiveUrl) return;
    let cancelled = false;
    fetch(interactiveUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("Failed to load template"))))
      .then((html) => {
        if (!cancelled) setRawTemplateHtml(html);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [interactiveHtml, interactiveUrl]);

  const hydratedPreviewHtml = useMemo(() => {
    if (interactiveHtml) return interactiveHtml;
    if (!rawTemplateHtml || !resolvedInteractiveSlug) return null;
    return hydrateInteractiveHtml(rawTemplateHtml, resolvedInteractiveSlug, debouncedContent, {
      invitationSlug: slug,
      isPreview,
    });
  }, [interactiveHtml, rawTemplateHtml, resolvedInteractiveSlug, debouncedContent, slug, isPreview]);

  if (isCard01) {
    return (
      <div
        className={`w-full bg-[#020204] flex flex-col relative overflow-hidden ${
          isPreview ? "h-full min-h-[600px]" : "min-h-[100dvh] h-[100dvh]"
        }`}
      >
        <Card01Player
          content={debouncedContent}
          autoDemo={autoDemo}
          isPreview={isPreview}
          forcedStage={card01Stage}
        />
      </div>
    );
  }

  if (isCard02) {
    return (
      <div
        className={`w-full bg-[#040712] flex flex-col relative overflow-hidden ${
          isPreview ? "h-full min-h-[600px]" : "min-h-[100dvh] h-[100dvh]"
        }`}
      >
        <Card02Player
          content={debouncedContent}
          autoDemo={autoDemo}
          isPreview={isPreview}
          forcedStage={card02Stage}
        />
      </div>
    );
  }

  if (isCard03) {
    return (
      <div
        className={`w-full bg-[#fed1ea] flex flex-col relative overflow-hidden ${
          isPreview ? "h-full min-h-[600px]" : "min-h-[100dvh] h-[100dvh]"
        }`}
      >
        <Card03Player
          content={debouncedContent}
          autoDemo={autoDemo}
          isPreview={isPreview}
          forcedStage={card03Stage}
        />
      </div>
    );
  }

  if (interactiveUrl) {
    return (
      <div
        className={`w-full bg-black flex flex-col relative overflow-hidden ${
          isPreview ? "h-full min-h-[600px]" : "min-h-[100dvh] h-[100dvh]"
        }`}
      >
        {hydratedPreviewHtml ? (
          <iframe
            key={(resolvedInteractiveSlug || slug || "card") + (isPreview ? "-preview" : "-live")}
            srcDoc={hydratedPreviewHtml}
            title={content.title || "Thiệp kỷ niệm"}
            className={`w-full h-full border-0 flex-1 block ${
              isPreview ? "min-h-[600px]" : "min-h-[100dvh]"
            }`}
            allow="autoplay; accelerometer; gyroscope; clipboard-write; encrypted-media; fullscreen"
          />
        ) : (
          <iframe
            src={interactiveUrl}
            title={content.title || "Thiệp kỷ niệm"}
            className={`w-full h-full border-0 flex-1 block ${
              isPreview ? "min-h-[600px]" : "min-h-[100dvh]"
            }`}
            allow="autoplay; accelerometer; gyroscope; clipboard-write; encrypted-media; fullscreen"
          />
        )}
      </div>
    );
  }

  const blocks = content.blocks || [];
  const isGalaxyTheme = slug === "love-galaxy" || (content.loveMessages && content.loveMessages.length > 0);

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden transition-colors duration-300 ${theme.fontFamily === "serif" ? "font-serif" : "font-sans"
        }`}
      style={{
        backgroundColor: theme.background,
        color: theme.foreground,
      }}
    >
      {isGalaxyTheme && (
        <GalaxyRainMotion
          loveMessages={content.loveMessages}
          galleryUrls={content.galleryUrls}
          coverImageUrl={content.coverImageUrl}
        />
      )}
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {blocks.map((b) => {
          if (!b.enabled) return null;

          switch (b.type) {
            case "envelope_reveal":
              return (
                <EnvelopeRevealBlock
                  key={b.id}
                  title={content.title}
                  subtitle={content.subtitle}
                  theme={theme}
                  slug={slug}
                />
              );

            case "cover":
              return (
                <CoverBlock
                  key={b.id}
                  title={content.title}
                  subtitle={content.subtitle}
                  people={content.people}
                  coverImageUrl={content.coverImageUrl}
                  theme={theme}
                />
              );

            case "intro_message":
              return (
                <IntroMessageBlock
                  key={b.id}
                  message={content.message}
                  theme={theme}
                />
              );

            case "event_details":
              return (
                <EventDetailsBlock
                  key={b.id}
                  event={content.event}
                  theme={theme}
                />
              );

            case "countdown":
              return (
                <CountdownBlock
                  key={b.id}
                  startsAt={content.event?.startsAt}
                  theme={theme}
                />
              );

            case "gallery":
              return (
                <GalleryBlock
                  key={b.id}
                  galleryUrls={content.galleryUrls}
                  theme={theme}
                />
              );

            case "rsvp":
              if (!content.features?.rsvp) return null;
              return (
                <RsvpBlock
                  key={b.id}
                  slug={slug}
                  theme={theme}
                  isPreview={isPreview}
                />
              );

            case "guestbook":
              if (!content.features?.guestbook) return null;
              return (
                <GuestbookBlock
                  key={b.id}
                  slug={slug}
                  theme={theme}
                  isPreview={isPreview}
                />
              );

            case "response_question":
              return (
                <ResponseQuestionBlock
                  key={b.id}
                  question={content.responseQuestion}
                  slug={slug}
                  theme={theme}
                  isPreview={isPreview}
                />
              );

            case "music_control":
              return (
                <MusicControlBlock
                  key={b.id}
                  musicUrl={content.features?.backgroundMusicUrl}
                  theme={theme}
                />
              );

            case "footer_cta":
              return (
                <FooterCtaBlock
                  key={b.id}
                  giftTransferInfo={content.features?.giftTransferInfo}
                  slug={slug}
                  theme={theme}
                />
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

