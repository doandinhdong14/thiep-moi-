import HeroCarousel from "@/components/landing/HeroCarousel";
import ProductShowcase from "@/components/landing/ProductShowcase";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import TrustSection from "@/components/landing/TrustSection";
import CommunityIdeas from "@/components/landing/CommunityIdeas";
import FaqAccordion from "@/components/landing/FaqAccordion";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col w-full overflow-x-hidden">
      {/* 1. Hero Carousel with dark overlay & centered CTA */}
      <HeroCarousel />

      {/* 2. Product Showcase with 5-column grid & pagination & topic chips */}
      <ProductShowcase />

      {/* 3. Testimonials with pale-pink section & horizontal card track */}
      <TestimonialsSection />

      {/* 4. Trust Section with 3 benefit rows & 3 staggered imagery cards */}
      <TrustSection />

      {/* 5. Community Ideas with auth-aware login gate */}
      <CommunityIdeas />

      {/* 6. FAQ Accordion with the 6 reference questions */}
      <FaqAccordion />
    </div>
  );
}
