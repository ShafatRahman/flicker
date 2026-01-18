'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import TopNav, { TabType } from '@/components/TopNav';
import ImageUploader from '@/components/ImageUploader';
import ProcessingProgress from '@/components/ProcessingProgress';
import ClaimImages from '@/components/ClaimImages';
import AuthModal from '@/components/AuthModal';
import DiscoverFeed from '@/components/DiscoverFeed';
import MyImages from '@/components/MyImages';
import { getSessionId, setSessionId, getAuthUser, signOut } from '@/lib/identity';
import { processImage } from '@/lib/image-processing';
import { uploadProcessedImage } from '@/lib/blob';
import { getOrCreateUser, mergeAnonymousToAuthUser } from '@/actions/users';
import { saveImageMetadata, getUserImages } from '@/actions/images';
import { createClient } from '@/lib/supabase/client';
import type { Image as ImageType, ProcessingStatus, User } from '@/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [processing, setProcessing] = useState<ProcessingStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const loadUserData = useCallback(async () => {
    try {
      const authUser = await getAuthUser();
      
      if (authUser) {
        setSessionId(authUser.id);
        const anonymousSessionId = localStorage.getItem('anonymousSessionId');
        
        if (anonymousSessionId && anonymousSessionId !== authUser.id) {
          try {
            await mergeAnonymousToAuthUser(anonymousSessionId, authUser.id, authUser.email || '');
            localStorage.removeItem('anonymousSessionId');
          } catch (mergeError) {
            console.error('Failed to merge anonymous user:', mergeError);
          }
        }
        
        const userData = await getOrCreateUser(authUser.id);
        setUser(userData);
        
        const userImages = await getUserImages(userData.id);
        setImages(userImages);
      } else {
        const sessionId = getSessionId();
        localStorage.setItem('anonymousSessionId', sessionId);
        
        const userData = await getOrCreateUser(sessionId);
        setUser(userData);
        
        const userImages = await getUserImages(userData.id);
        setImages(userImages);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Set a fallback anonymous user so the app is still usable
      const sessionId = getSessionId();
      setUser({
        id: sessionId,
        session_id: sessionId,
        email: null,
        email_verified: false,
        created_at: new Date().toISOString(),
      });
      setImages([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await loadUserData();

        const params = new URLSearchParams(window.location.search);
        const authStatus = params.get('auth');
        const errorMessage = params.get('message');
        
        if (authStatus === 'verified') {
          setAuthMessage({ text: 'Email verified! Your images will now be saved forever.', type: 'success' });
          window.history.replaceState({}, '', '/');
          // Reload user data to get updated verified status
          await loadUserData();
        } else if (authStatus === 'error') {
          const msg = errorMessage 
            ? decodeURIComponent(errorMessage)
            : 'Authentication failed. Please try again.';
          setAuthMessage({ text: msg, type: 'error' });
          window.history.replaceState({}, '', '/');
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      // Only handle SIGNED_IN here - SIGNED_OUT is handled by handleSignOut
      // to avoid race conditions between the listener and explicit state management
      if (event === 'SIGNED_IN') {
        await loadUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!user) return;

      const newProcessing: ProcessingStatus[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        stage: 'queued',
        progress: 0,
      }));

      setProcessing((prev) => [...prev, ...newProcessing]);

      const processOneImage = async (item: ProcessingStatus) => {
        try {
          setProcessing((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, stage: 'removing-bg' } : p
            )
          );
          
          // Yield to browser so "Removing background" is visible before heavy processing
          await new Promise(resolve => setTimeout(resolve, 0));

          const processedBlob = await processImage(item.file, (_stage, progress) => {
            setProcessing((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? {
                      ...p,
                      stage: progress < 0.8 ? 'removing-bg' : 'flipping',
                      progress: progress * 0.7,
                    }
                  : p
              )
            );
          });

          setProcessing((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, stage: 'uploading', progress: 0.7 } : p
            )
          );

          const { url } = await uploadProcessedImage(
            processedBlob,
            user.id,
            item.file.name
          );

          setProcessing((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, stage: 'saving', progress: 0.9 } : p
            )
          );

          const savedImage = await saveImageMetadata(
            user.id,
            url,
            item.file.name,
            item.file.size,
            user.email_verified
          );

          setProcessing((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, stage: 'complete', progress: 1, result: savedImage }
                : p
            )
          );

          setImages((prev) => [savedImage, ...prev]);
        } catch (error) {
          console.error('Processing failed:', error);
          setProcessing((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    stage: 'error',
                    error: error instanceof Error ? error.message : 'Processing failed',
                  }
                : p
            )
          );
        }
      };

      for (const item of newProcessing) {
        await processOneImage(item);
      }

      setTimeout(() => {
        setProcessing((prev) =>
          prev.filter((p) => p.stage !== 'complete')
        );
      }, 3000);
    },
    [user]
  );

  const handleImageDeleted = useCallback((imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  const handleImageUpdated = useCallback((imageId: string, isPublic: boolean) => {
    setImages((prev) => prev.map((img) => 
      img.id === imageId ? { ...img, is_public: isPublic } : img
    ));
  }, []);

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuth(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setShowAuth(true);
  };

  const handleAuthSuccess = async () => {
    setShowAuth(false);
    await loadUserData();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Reset user state immediately
      setUser(null);
      setImages([]);
      // Create new anonymous session
      const newSessionId = crypto.randomUUID();
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('anonymousSessionId', newSessionId);
      // Load fresh anonymous user data
      const userData = await getOrCreateUser(newSessionId);
      setUser(userData);
      setActiveTab('home');
    } catch (error) {
      console.error('Sign out failed:', error);
      setAuthMessage({ text: 'Failed to sign out', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Image 
              src="/favicon.png" 
              alt="Flicker" 
              width={48}
              height={48}
              className="mx-auto rounded-xl"
            />
            <div className="absolute -inset-2 border-2 border-blue-500 border-t-transparent rounded-2xl animate-spin" />
          </div>
          <p className="text-gray-400 mt-6 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const hasExpiringImages = images.some((img) => img.expires_at !== null);
  const isProcessing = processing.some(
    (p) => p.stage !== 'complete' && p.stage !== 'error'
  );
  const isAuthenticated = user?.email_verified;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Navigation */}
      <TopNav 
        user={user} 
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main content - with top padding for fixed nav */}
      <main className="pt-16">
        <div className="max-w-xl mx-auto px-4 py-8">
          
          {/* Auth message */}
          {authMessage && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between animate-slideUp backdrop-blur-sm ${
              authMessage.type === 'success' 
                ? 'bg-emerald-50/80 border border-emerald-100' 
                : 'bg-red-50/80 border border-red-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  authMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {authMessage.type === 'success' ? (
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className={`font-medium ${authMessage.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
                  {authMessage.text}
                </span>
              </div>
              <button
                onClick={() => setAuthMessage(null)}
                className={`p-1.5 rounded-lg transition-colors ${authMessage.type === 'success' ? 'text-emerald-500 hover:bg-emerald-100' : 'text-red-500 hover:bg-red-100'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Home Tab - Upload & Discover Feed */}
          {activeTab === 'home' && (
            <>
              {/* Create Post Card (Upload) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="p-5">
                  <ImageUploader
                    onFilesSelected={handleFilesSelected}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Processing */}
              {processing.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-5">
                  <ProcessingProgress items={processing} />
                </div>
              )}

              {/* Claim prompt */}
              {!isAuthenticated && hasExpiringImages && (
                <div className="mb-6">
                  <ClaimImages onSignUp={handleSignUp} />
                </div>
              )}

              {/* Discover Feed - Public Images */}
              <DiscoverFeed />
            </>
          )}

          {/* Profile Tab - Profile Info, Upload, and Images */}
          {activeTab === 'profile' && user && (
            <>
              {/* Profile Header */}
              <div className="bg-white rounded-lg shadow mb-4">
                <div className="p-6">
                  {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified account
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{images.length} images</span>
                          <span>{images.filter(img => img.is_public).length} public</span>
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 text-sm text-red-600 font-medium bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold mb-3">
                        ?
                      </div>
                      <p className="text-gray-600 mb-1">Anonymous User</p>
                      <p className="text-sm text-gray-500 mb-4">
                        {images.length} images ({hasExpiringImages ? 'expiring in 3 days' : 'no expiring images'})
                      </p>
                      <button
                        onClick={handleSignIn}
                        className="btn-gradient px-6 py-2"
                      >
                        Log in to save permanently
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-lg shadow mb-4">
                <div className="p-4">
                  <ImageUploader
                    onFilesSelected={handleFilesSelected}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Processing */}
              {processing.length > 0 && (
                <div className="bg-white rounded-lg shadow mb-4 p-4">
                  <ProcessingProgress items={processing} />
                </div>
              )}

              {/* User's Images */}
              <MyImages 
                images={images}
                userId={user.id}
                onImageDeleted={handleImageDeleted}
                onImageUpdated={handleImageUpdated}
              />
            </>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
          defaultMode={authMode}
        />
      )}
    </div>
  );
}
