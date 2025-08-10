"use client";

// Removed Link import for static site
import { motion } from "framer-motion";
import { FadeIn } from "@/components/anim/fade-in";
import { ScaleIn } from "@/components/anim/scale-in";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl px-4 relative">
        <div className="py-24 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <motion.div 
              className="inline-flex items-center rounded-full border px-4 py-2 text-sm text-muted-foreground mb-6 bg-background/80 backdrop-blur-sm shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              QuantFident Mentorship
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent leading-tight">
              Bước vào thế giới Quant với lộ trình đã được kiểm chứng
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Chương trình 1-1 giúp bạn vào Quant Researcher, Trader, hoặc Quant Developer top-tier. Học từ Green Book Ch2–7 đến thực chiến build 2–3 alpha models trên WorldQuant BRAIN. Unlimited mock interviews trong chương trình và 1 năm sau.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="px-8 py-6 text-base shadow-lg"
                  onClick={() => {
                    const element = document.querySelector('#contact');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Bắt đầu ngay
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-6 text-base"
                  onClick={() => {
                    const element = document.querySelector('#program');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Tìm hiểu thêm
                </Button>
              </motion.div>
            </div>
          </FadeIn>
          <ScaleIn delay={0.2} className="hidden md:block">
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl border bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 backdrop-blur-sm shadow-2xl">
                <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-background/40 to-background/20 backdrop-blur-sm border border-white/20" />
                <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-primary/30 animate-pulse" />
                <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-accent/40 animate-pulse delay-1000" />
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl animate-pulse" />
            </div>
          </ScaleIn>
        </div>
      </div>
    </div>
  );
}