import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TraceLogo } from '../components/TraceLogo';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <TraceLogo size="lg" />

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-[#11131C]">
          TRACE
        </h1>
        <p className="mt-1.5 text-xs font-semibold tracking-wider text-[#6C3BF5] uppercase">
          AI UX Research &amp; Design
        </p>

        <h2 className="mt-7 font-display text-3xl font-bold leading-tight tracking-tight text-[#11131C] sm:text-4xl text-balance">
          Make every design decision count.
        </h2>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#525866] sm:text-base">
          Upload user research, extract grounded insights, and trace every UI screen back to real evidence.
        </p>

        <button
          type="button"
          onClick={onGetStarted}
          className="mt-9 inline-flex w-full max-w-xs min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-[#6C3BF5] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#6C3BF5]/25 transition hover:bg-[#5B2BE0] active:scale-[0.98]"
        >
          <span>Get Started</span>
          <ArrowRight className="h-5 w-5" />
        </button>

        <p className="mt-8 text-xs text-[#8A90A0]">
          Local-first research synthesis &amp; design provenance
        </p>
      </div>
    </main>
  );
};
