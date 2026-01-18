'use client';

interface ClaimImagesProps {
  onSignUp: () => void;
}

export default function ClaimImages({ onSignUp }: ClaimImagesProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl border border-blue-100 p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Don&apos;t lose access to your images!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create an account to save and share your images
          </p>
          
          <button
            onClick={onSignUp}
            className="btn-gradient"
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
