import React from 'react';
import { iconSet1 } from './icons/iconSet1';
import { iconSet2 } from './icons/iconSet2';
import { iconSet3 } from './icons/iconSet3';
import { iconSet4 } from './icons/iconSet4';
import { iconSet5 } from './icons/iconSet5';
import { iconSet6 } from './icons/iconSet6';

export type IconName = 'send' | 'plus' | 'chat' | 'user' | 'kchat' | 'sun' | 'moon' | 'chip' | 'chevron-down' | 'edit' | 'delete' | 'search' | 'menu' | 'panel-left-close' | 'folder' | 'folder-plus' | 'paperclip' | 'close' | 'file' | 'settings' | 'download' | 'upload' | 'language' | 'tools' | 'code' | 'link' | 'stop' | 'brain' | 'copy' | 'regenerate' | 'users' | 'archive' | 'unarchive' | 'eye' | 'volume-2' | 'clipboard' | 'arrow-left-right' | 'history' | 'translate-logo' | 'swap-horizontal' | 'info' | 'check-circle' | 'alert-circle' | 'graduation-cap';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: IconName;
}

const icons: Record<IconName, React.FC<React.SVGProps<SVGSVGElement>>> = {
  ...iconSet1,
  ...iconSet2,
  ...iconSet3,
  ...iconSet4,
  ...iconSet5,
  ...iconSet6,
};

export const Icon: React.FC<IconProps> = ({ icon, className, ...props }) => {
  const IconComponent = icons[icon];
  
  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found.`);
    return null;
  }
  
  return (
    <div className={`w-6 h-6 ${className || ''}`}>
      <IconComponent {...props} />
    </div>
  );
};