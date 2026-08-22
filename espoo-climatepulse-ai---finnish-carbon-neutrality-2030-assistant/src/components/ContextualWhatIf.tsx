import React, { useState } from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';
import { WhatIfContextType } from '../types/whatIf';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';

export interface ContextualWhatIfProps {
  context: WhatIfContextType;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  contextData?: any;
  buttonLabel?: string;
  buttonVariant?: 'primary' | 'secondary' | 'subtle' | 'pill';
  buttonSize?: 'xs' | 'sm' | 'md';
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (initialQuery?: string, contextTitle?: string) => void;
  isFinnish?: boolean;
  className?: string;
}

export const ContextualWhatIf: React.FC<ContextualWhatIfProps> = ({
  context,
  userProfile,
  observation,
  contextData,
  buttonLabel,
  buttonVariant = 'secondary',
  buttonSize = 'sm',
  onSaveGoal,
  onOpenAskAssistant,
  isFinnish = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ContextualWhatIfButton
        onClick={() => setIsOpen(true)}
        label={buttonLabel}
        variant={buttonVariant}
        size={buttonSize}
        isFinnish={isFinnish}
        className={className}
      />

      <ContextualWhatIfModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
        userProfile={userProfile}
        observation={observation}
        contextData={contextData}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </>
  );
};
