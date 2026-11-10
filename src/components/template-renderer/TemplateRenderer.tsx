"use client";

import { InvitationContent } from "@/lib/templates/schema";
import { TemplateTheme } from "@/lib/templates/registry";
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
  isPreview?: boolean;
}

const INTERACTIVE_TEMPLATES: Record<string, string> = {
  "thiep-3": "/templates/thiep-3.html",
  "thiep-4": "/templates/thiep-4.html",
  "thiep-5": "/templates/thiep-5.html",
  "thiep-6": "/templates/thiep-6.html",
  "thiep-7": "/templates/thiep-7.html",
  "thiep-8": "/templates/thiep-8.html",
  "thiep-9": "/templates/thiep-9.html",
  "thiep-10": "/templates/thiep-10.html",
  "thiep-giang-sinh": "/templates/thiep-giang-sinh.html",
  "thiep-xmas": "/templates/thiep-xmas.html",
};

export default function TemplateRenderer({
  content,
  theme,
  slug,
  isPreview = false,
}: TemplateRendererProps) {
  const interactiveUrl =
    (slug && INTERACTIVE_TEMPLATES[slug]) ||
    (content as any)?.interactiveUrl;

  if (interactiveUrl) {
    return (
      <div className="w-full h-full min-h-[720px] md:min-h-screen bg-black flex flex-col relative overflow-hidden">
        <iframe
          src={interactiveUrl}
          title={content.title || "Thiệp tương tác"}
          className="w-full h-full min-h-[720px] md:min-h-screen border-0 flex-1"
          allow="autoplay; accelerometer; gyroscope; clipboard-write; encrypted-media; fullscreen"
        />
      </div>
    );
  }

  const blocks = content.blocks || [];
  const isGalaxyTheme = slug === "love-galaxy" || (content.loveMessages && content.loveMessages.length > 0);

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden transition-colors duration-300 ${
        theme.fontFamily === "serif" ? "font-serif" : "font-sans"
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

