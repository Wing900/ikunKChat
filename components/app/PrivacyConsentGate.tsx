import React, { lazy, Suspense } from 'react';

const PrivacyNoticeModal = lazy(() =>
  import('../PrivacyNoticeModal').then(module => ({ default: module.PrivacyNoticeModal }))
);

interface PrivacyConsentGateProps {
  onConfirm: () => void;
}

export const PrivacyConsentGate: React.FC<PrivacyConsentGateProps> = ({ onConfirm }) => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <PrivacyNoticeModal onConfirm={onConfirm} />
    </Suspense>
  );
};
