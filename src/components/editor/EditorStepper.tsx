"use client";

import { FileText, Image as ImageIcon, Music, CheckCircle } from "lucide-react";

export type StepKey = "content" | "images" | "audio" | "finish";

interface EditorStepperProps {
  currentStep: StepKey;
  onStepChange: (step: StepKey) => void;
  isUnlocked: boolean;
}

const STEPS: { key: StepKey; title: string; progress: number; icon: any }[] = [
  { key: "content", title: "Nội dung", progress: 25, icon: FileText },
  { key: "images", title: "Hình ảnh", progress: 50, icon: ImageIcon },
  { key: "audio", title: "Âm thanh", progress: 75, icon: Music },
  { key: "finish", title: "Hoàn tất", progress: 100, icon: CheckCircle },
];

export default function EditorStepper({
  currentStep,
  onStepChange,
  isUnlocked,
}: EditorStepperProps) {
  const activeIndex = STEPS.findIndex((s) => s.key === currentStep);
  const currentProgress = STEPS[activeIndex]?.progress || 25;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
      {/* Step Header & Indicator */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 font-bold text-sm">
            {STEPS[activeIndex]?.title}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            (Bước {activeIndex + 1}/4)
          </span>
        </div>
        <div className="text-rose-600 font-bold font-mono">
          {currentProgress}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-[#e93459] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      {/* 4 Interactive Step Buttons */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 pt-1">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isPassed = idx < activeIndex;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onStepChange(step.key)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-xl text-xs font-semibold transition-all border ${
                isActive
                  ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs ring-1 ring-rose-200"
                  : isPassed
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "bg-slate-50/60 border-slate-100 text-slate-400 hover:bg-slate-100/60"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-rose-600" : isPassed ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <span className="truncate text-[11px] sm:text-xs">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

