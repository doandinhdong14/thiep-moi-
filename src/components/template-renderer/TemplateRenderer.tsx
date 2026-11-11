"use client";

import { useState, useEffect, useMemo } from "react";
import { InvitationContent } from "@/lib/templates/schema";
import { TemplateTheme } from "@/lib/templates/registry";
import {
  INTERACTIVE_TEMPLATE_URLS,
  hydrateInteractiveHtml,
} from "@/lib/templates/hydrateInteractiveHtml";
import CoverBlock from "./blocks/CoverBlock";
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
}

export default function TemplateRenderer({
  content,
  theme,
  slug,
  templateSlug,
  interactiveHtml,
  isPreview = false,
}: TemplateRendererProps) {
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

  if (interactiveUrl) {
    return (
      <div
        className={`w-full bg-black flex flex-col relative overflow-hidden ${
          isPreview ? "h-full min-h-[720px]" : "min-h-[100dvh] h-[100dvh]"
        }`}
      >
        {hydratedPreviewHtml ? (
          <iframe
            key={(resolvedInteractiveSlug || slug || "card") + (isPreview ? "-preview" : "-live")}
            srcDoc={hydratedPreviewHtml}
            title={content.title || "Thiệp kỷ niệm"}
            className="w-full h-full min-h-[720px] md:min-h-screen border-0 flex-1"
            allow="autoplay; accelerometer; gyroscope; clipboard-write; encrypted-media; fullscreen"
          />
        ) : (
          <iframe
            src={interactiveUrl}
            title={content.title || "Thiệp kỷ niệm"}
            className="w-full h-full min-h-[720px] md:min-h-screen border-0 flex-1"
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

