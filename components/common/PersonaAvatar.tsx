import React from 'react';
import { Persona } from '../../types';

interface PersonaAvatarProps {
    avatar: Persona['avatar'];
    className?: string;
}

export const PersonaAvatar: React.FC<PersonaAvatarProps> = ({ avatar, className = '' }) => {
  if (avatar.type === 'emoji') {
    return <span className={`flex items-center justify-center w-full h-full ${className}`}>{avatar.value}</span>;
  }
  return <img src={avatar.value} alt="persona avatar" className={`w-full h-full object-cover ${className}`} />;
};
