import type { Metadata } from "next";
import { Icon } from "@iconify/react";

import CommonBadge from "@/components/CommonBadge";
import Playground from "@/components/playground/Playground";

export const metadata: Metadata = {
  title: "Soplang Playground - Code in Somali, Right in Your Browser",
  description:
    "Write, run, and share Soplang code instantly in your browser. The fastest way to try the first Somali programming language.",
  openGraph: {
    title: "Soplang Playground",
    description:
      "Write, run, and share Soplang code instantly in your browser.",
    images: "/og.png",
  },
};

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen pb-24 overflow-hidden bg-background transition-colors duration-300">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
      </div>

      <div className="container-custom pt-10 md:pt-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
          <CommonBadge text="Beta" />

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Code in Somali. <span className="text-gradient-primary">Run it instantly.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Your own sandbox for Soplang — write, run, and share code straight
            from the browser.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Icon icon="lucide:zap" className="w-4 h-4 text-primary" /> Instant Execution
            </div>
            <div className="w-1 h-1 rounded-full bg-border"></div>
            <div className="flex items-center gap-1">
              <Icon icon="lucide:globe" className="w-4 h-4 text-primary" /> Somali Syntax
            </div>
            <div className="w-1 h-1 rounded-full bg-border"></div>
            <div className="flex items-center gap-1">
              <Icon icon="lucide:share-2" className="w-4 h-4 text-primary" /> Shareable Links
            </div>
          </div>
        </div>

        <Playground />
      </div>
    </div>
  );
}
