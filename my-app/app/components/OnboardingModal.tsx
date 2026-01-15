"use client"
import React, { useState } from 'react';
import { BookOpen, Search, Star, Award, ChevronRight, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const steps = [
    {
      title: "Welcome to Bookmarkd!",
      description: "Your personal library for tracking, rating, and discovering amazing books",
      icon: BookOpen,
      action: "Get Started"
    },
    {
      title: "Discover Books",
      description: "Browse thousands of books or search for your favorites to add to your collection",
      icon: Search,
      action: "Start Browsing"
    },
    {
      title: "Rate & Review",
      description: "Share your thoughts and help others discover their next great read",
      icon: Star,
      action: "Begin Journey"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - go to browse
      router.push('/browse');
      onClose();
    }
  };

  const handleSkip = () => {
    router.push('/browse');
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#14181C] to-[#14181C] rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 border border-amber-500/20">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 p-6 rounded-t-2xl text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="w-full h-full rounded-full border-4 border-white transform translate-x-8 -translate-y-8"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
            <Sparkles className="w-full h-full transform -translate-x-4 translate-y-4" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
          >
            <X size={20} />
          </button>

          {/* Step content */}
          <div className="relative z-10 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/30">
                <Icon size={32} className="text-stone-50" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
            <p className="text-stone-50/90 leading-relaxed">{currentStepData.description}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentStep ? 'bg-amber-500' :
                    index < currentStep ? 'bg-amber-300' : 'bg-stone-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-stone-400 text-center">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Quick features preview for first step */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { icon: Search, text: "Search millions of books" },
                { icon: BookOpen, text: "Build your personal library" },
                { icon: Star, text: "Rate and review books" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-stone-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-stone-300 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-stone-600 text-stone-300 rounded-lg hover:bg-stone-700/50 transition-colors duration-200"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              {currentStepData.action}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;