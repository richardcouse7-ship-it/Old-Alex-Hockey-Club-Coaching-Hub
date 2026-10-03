import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  PlusSquare,
  X,
  Smartphone,
  Check,
  Sparkles,
  Monitor,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { OldAlexCrest } from './OldAlexCrest';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type PlatformTab = 'ios' | 'android' | 'desktop';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true until verified
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformTab>('desktop');
  const [activeGuideTab, setActiveGuideTab] = useState<PlatformTab>('desktop');
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // 2. Check if dismissed recently (within 7 days)
    const dismissedTime = localStorage.getItem('oldalex_pwa_banner_dismissed');
    if (dismissedTime) {
      const past = parseInt(dismissedTime, 10);
      const now = Date.now();
      if (now - past < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } else {
      setIsDismissed(false);
    }

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isApple) {
      setDetectedPlatform('ios');
      setActiveGuideTab('ios');
    } else if (isAndroid) {
      setDetectedPlatform('android');
      setActiveGuideTab('android');
    } else {
      setDetectedPlatform('desktop');
      setActiveGuideTab('desktop');
    }

    // 4. Listen for Chrome/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('oldalex_pwa_banner_dismissed', Date.now().toString());
  };

  // If already running standalone or dismissed, do not render banner
  if (isStandalone || isDismissed) {
    return null;
  }

  // Dynamic button label based on detected device & browser capability
  const getButtonLabel = () => {
    if (deferredPrompt) return 'Install App';
    if (detectedPlatform === 'ios') return 'Add to Home Screen';
    if (detectedPlatform === 'android') return 'Install on Android';
    return 'Install on Desktop';
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#4a154b] via-[#350d36] to-black border-b border-amber-500/40 text-white px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg transition-all z-40 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <OldAlexCrest size={34} className="drop-shadow-md shrink-0" />
            <div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-white">
                <span>Install Old Alex Coaching Hub</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono">
                  <Sparkles className="w-2.5 h-2.5" /> 100% Offline Pitchside
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 hidden sm:block">
                Install as a standalone app on your iPhone, iPad, Android, or laptop for fullscreen pitchside access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              {deferredPrompt ? (
                <Download className="w-3.5 h-3.5" />
              ) : detectedPlatform === 'desktop' ? (
                <Monitor className="w-3.5 h-3.5" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
              <span>{getButtonLabel()}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold hidden md:inline-flex items-center gap-1"
            >
              <span>Setup Guide</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-black/40 transition-colors"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Universal Multi-Device Install Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-950 border border-amber-500/40 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <OldAlexCrest size={40} className="drop-shadow-md" />
                <div>
                  <h3 className="text-base font-bold text-white">Install Old Alex Hub</h3>
                  <span className="text-[11px] text-neutral-400">
                    Standalone Fullscreen · Fast Pitchside Launch
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveGuideTab('ios')}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeGuideTab === 'ios'
                    ? 'bg-[#4a154b] text-white shadow-sm border border-amber-500/50'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('android')}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeGuideTab === 'android'
                    ? 'bg-[#4a154b] text-white shadow-sm border border-amber-500/50'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('desktop')}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeGuideTab === 'desktop'
                    ? 'bg-[#4a154b] text-white shadow-sm border border-amber-500/50'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>Laptop / PC</span>
              </button>
            </div>

            {/* Tab 1: iOS Safari Guide */}
            {activeGuideTab === 'ios' && (
              <div className="space-y-3 text-xs text-neutral-200">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#4a154b] text-amber-300 flex items-center justify-center font-bold shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-white">Open in Safari & Tap Share</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      Open <strong>http://192.168.18.10:3000</strong> in Safari. Tap the{' '}
                      <strong>Share icon</strong> (
                      <Share2 className="w-3.5 h-3.5 inline text-sky-400" />) in the bottom toolbar.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#4a154b] text-amber-300 flex items-center justify-center font-bold shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-white">Select 'Add to Home Screen'</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      Scroll down the share sheet and tap{' '}
                      <strong>Add to Home Screen</strong> (
                      <PlusSquare className="w-3.5 h-3.5 inline text-amber-400" />
                      ). Tap <strong>Add</strong> in the top-right.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Android Chrome Guide */}
            {activeGuideTab === 'android' && (
              <div className="space-y-3 text-xs text-neutral-200">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#4a154b] text-amber-300 flex items-center justify-center font-bold shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-white">Open Chrome Menu</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      Open in Google Chrome and tap the <strong>three dots menu</strong> (
                      <MoreVertical className="w-3.5 h-3.5 inline text-neutral-300" />) in the top-right corner.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#4a154b] text-amber-300 flex items-center justify-center font-bold shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-white">Tap 'Install app' or 'Add to Home Screen'</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      Select <strong>Install app</strong> (or <em>Add to Home screen</em>). Tap <strong>Install</strong> to confirm.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Desktop Chrome / Edge Guide */}
            {activeGuideTab === 'desktop' && (
              <div className="space-y-3 text-xs text-neutral-200">
                {deferredPrompt ? (
                  <div className="p-3.5 bg-neutral-900 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">Native 1-Tap Install Ready</p>
                      <p className="text-neutral-400 text-[11px]">Click below to install directly into Chrome / Edge.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install Now</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#4a154b] text-amber-300 flex items-center justify-center font-bold shrink-0 text-xs">
                        1
                      </span>
                      <div>
                        <p className="font-semibold text-white">Browser Address Bar Install Icon</p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">
                          In Google Chrome or Microsoft Edge, look at the right side of the address bar for the{' '}
                          <strong>Install App icon</strong> (monitor with down arrow) and click it.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#4a154b] text-amber-300 flex items-center justify-center font-bold shrink-0 text-xs">
                        2
                      </span>
                      <div>
                        <p className="font-semibold text-white">Or via Browser Menu</p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">
                          Click browser menu (<strong>⋮</strong>) &rarr; <strong>Save and share</strong> &rarr;{' '}
                          <strong>Install Old Alex Hockey Club Coaching Hub</strong>.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Success Note */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                Once installed, the Old Alex Coaching Hub launches in its own high-speed standalone window with full offline pitchside support.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white transition-all shadow-md active:scale-95"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </>
  );
};
