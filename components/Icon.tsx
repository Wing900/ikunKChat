import React from 'react';
import { iconSet1 } from './icons/iconSet1';
import { iconSet2 } from './icons/iconSet2';
import { iconSet3 } from './icons/iconSet3';

export type IconName = 'send' | 'plus' | 'chat' | 'user' | 'kchat' | 'sun' | 'moon' | 'chip' | 'chevron-down' | 'edit' | 'delete' | 'search' | 'menu' | 'panel-left-close' | 'folder' | 'folder-plus' | 'paperclip' | 'close' | 'file' | 'settings' | 'download' | 'upload' | 'language' | 'tools' | 'code' | 'link' | 'stop' | 'brain' | 'copy' | 'regenerate' | 'users';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: IconName;
}

const icons: Record<IconName, React.FC<React.SVGProps<SVGSVGElement>>> = {
  ...iconSet1,
  ...iconSet2,
  ...iconSet3,
};

export const Icon: React.FC<IconProps> = ({ icon, className, ...props }) => {
  const IconComponent = icons[icon];
  
  return (
    <div className={`w-6 h-6 ${className || ''}`}>
      <IconComponent {...props} />
    </div>
  );
};
