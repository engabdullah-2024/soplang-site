"use client";

import { sample_codeSnippet } from "@/constants/codeSnippetData";
import { Icon } from "@iconify/react";
import Link from "next/link";
import CommonBadge from "../CommonBadge";
import CodeWindow from "../SoplangCodeWindow";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden py-16">
      {/* Hero Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 left-0 right-0 -z-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
        <div className="absolute top-[-10%] right-[20%] w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-20%] left-[40%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen opacity-30"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
            {/* Badge */}
            <CommonBadge text="v2.0.0 is Now Stable" />

            <h1 className="flex gap-2 flex-wrap items-center justify-center lg:justify-start lg:w-full text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] animate-fade-in-up animation-delay-100">
              Build Dreams
              <span className="text-foreground">In Somali</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up animation-delay-200">
              Break the language barrier. <br className="hidden md:block" />
              The first open-source programming language designed purely for the
              Somali community.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 animate-fade-in-up animation-delay-300 px-3">
              <Link
                href="/downloads"
                className="w-full sm:w-auto h-14 px-8 rounded-xl bg-fd-primary text-fd-background dark:bg-fd-accent dark:text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-95 hover:-translate-y-1 hover:scale-105 transition-all duration-300  "
              >
                <Icon icon="lucide:download" className="w-5 h-5" />
                Install Soplang
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto h-14 px-8 rounded-xl bg-card border border-border/50  hover:bg-secondary/50 font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 group backdrop-blur-sm"
              >
                Documentation
                <Icon
                  icon="lucide:arrow-right"
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>

            {/* Mini Social Proof */}
            <div className="pt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground animate-fade-in-up animation-delay-500">
              <div className="flex items-center gap-1">
                <Icon icon="lucide:terminal" className="w-4 h-4" /> Open Source
              </div>
              <div className="w-1 h-1 rounded-full bg-border"></div>
              <div className="flex items-center gap-1">
                <Icon icon="lucide:globe" className="w-4 h-4" /> Somali Syntax
              </div>
              <div className="w-1 h-1 rounded-full bg-border"></div>
              <div className="flex items-center gap-1">
                <Icon icon="lucide:cpu" className="w-4 h-4" /> High Performance
              </div>
            </div>
          </div>

          {/* Setup Code Preview */}
          <div className="w-full lg:w-1/2 perspective-1000 relative animate-float-slow">
            <div className="relative rounded-xl shadow-2xl overflow-hidden border border-white/10 bg-[#1e1e1e]/90 backdrop-blur-xl transform transition-all duration-500 hover:rotate-y-1 hover:rotate-x-1 hover:scale-[1.02] group ring-1 ring-white/5">
              <CodeWindow code={sample_codeSnippet} title="main.sop" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
