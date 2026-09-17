"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Bug, ChevronDown, ChevronUp, Eye, RotateCcw, Trash2, Hash } from 'lucide-react';

interface DevOnboardingPanelProps {
  isVisible: boolean;
  onShowModal: () => void;
  onResetState: () => Promise<void>;
  onClearDismissal: () => void;
  onBookCountOverride: (count: number | null) => void;
  currentState: {
    booksInCollection: number;
    hasSeenWelcome: boolean;
    showingModal: boolean;
    devBookCountOverride: number | null;
  };
}

const DevOnboardingPanel: React.FC<DevOnboardingPanelProps> = ({
  isVisible,
  onShowModal,
  onResetState,
  onClearDismissal,
  onBookCountOverride,
  currentState
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Keyboard shortcut: Ctrl+Shift+O to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetState = useCallback(async () => {
    setIsResetting(true);
    try {
      await onResetState();
    } finally {
      setIsResetting(false);
    }
  }, [onResetState]);

  const handleClearDismissal = useCallback(() => {
    onClearDismissal();
    // Force a re-render by triggering a state change notification
    window.dispatchEvent(new Event('storage'));
  }, [onClearDismissal]);

  // Only render in development mode
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-[9998] font-mono text-xs">
      {/* Collapsed state - just a pill */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-900/90 hover:bg-purple-800/90 text-purple-100 rounded-full shadow-lg border border-purple-700/50 transition-all hover:scale-105"
          title="Dev Panel (Ctrl+Shift+O)"
        >
          <Bug className="w-4 h-4" />
          <span className="font-semibold">DEV</span>
        </button>
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <div className="bg-[#1a1625]/95 backdrop-blur-sm rounded-lg shadow-2xl border border-purple-700/50 w-72 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-purple-900/50 border-b border-purple-700/50">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-purple-100">Onboarding Dev Panel</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-purple-700/50 rounded transition-colors"
              title="Collapse (Ctrl+Shift+O)"
            >
              <ChevronDown className="w-4 h-4 text-purple-300" />
            </button>
          </div>

          {/* Current State Display */}
          <div className="px-3 py-2 border-b border-purple-700/30">
            <p className="text-purple-400 text-[10px] uppercase tracking-wider mb-2">Current State</p>
            <div className="space-y-1 text-purple-200">
              <div className="flex justify-between">
                <span className="text-purple-400">booksInCollection:</span>
                <span>{currentState.booksInCollection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">hasSeenWelcome:</span>
                <span className={currentState.hasSeenWelcome ? 'text-green-400' : 'text-red-400'}>
                  {String(currentState.hasSeenWelcome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">showingModal:</span>
                <span className={currentState.showingModal ? 'text-green-400' : 'text-stone-400'}>
                  {String(currentState.showingModal)}
                </span>
              </div>
              {currentState.devBookCountOverride !== null && (
                <div className="flex justify-between">
                  <span className="text-purple-400">devOverride:</span>
                  <span className="text-amber-400">{currentState.devBookCountOverride}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-2">
            {/* Show Modal Button */}
            <button
              onClick={onShowModal}
              disabled={currentState.showingModal}
              className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-purple-100 rounded transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Show Onboarding Modal</span>
            </button>

            {/* Reset State Button */}
            <button
              onClick={handleResetState}
              disabled={isResetting}
              className="w-full flex items-center gap-2 px-3 py-2 bg-orange-600/30 hover:bg-orange-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-orange-100 rounded transition-colors"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Onboarding State'}</span>
            </button>

            {/* Clear Session Dismissal */}
            <button
              onClick={handleClearDismissal}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-100 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Session Dismissal</span>
            </button>

            {/* Book Count Override */}
            <div className="pt-2 border-t border-purple-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300">Simulate Book Count</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {[null, 0, 1, 2, 3, 4, 5, 10].map((count) => (
                  <button
                    key={count === null ? 'real' : count}
                    onClick={() => onBookCountOverride(count)}
                    className={`px-2 py-1 rounded text-[10px] transition-colors ${
                      currentState.devBookCountOverride === count
                        ? 'bg-amber-500 text-stone-900'
                        : 'bg-purple-700/50 hover:bg-purple-600/50 text-purple-200'
                    }`}
                  >
                    {count === null ? 'Real' : count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-purple-900/30 border-t border-purple-700/30">
            <p className="text-purple-500 text-[10px] text-center">
              Ctrl+Shift+O to toggle
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevOnboardingPanel;
