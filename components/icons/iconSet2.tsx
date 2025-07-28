import React from 'react';

export const iconSet2 = {
  'chevron-down': (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  edit: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  delete: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  ),
  search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  ),
  menu: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  ),
  'panel-left-close': (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v10.5a.75.75 0 001.5 0V4.75z" />
      <path d="M3.504 4.024A3.75 3.75 0 002 6.75v6.5A3.75 3.75 0 005.75 17h.5a.75.75 0 000-1.5h-.5A2.25 2.25 0 013.5 13.25v-6.5A2.25 2.25 0 015.75 4.5h.5a.75.75 0 000-1.5h-.5a3.752 3.752 0 00-2.246.974z" />
      <path d="M16.128 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-2.47-2.47 2.47-2.47a.75.75 0 10-1.06-1.06l-3 3z" />
    </svg>
  ),
  'folder': (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M2 4.75A2.75 2.75 0 014.75 2h4.553a2.75 2.75 0 011.946.804l2.803 2.803A2.75 2.75 0 0114.856 6H16.5A2.75 2.75 0 0119.25 8.75v5.5A2.75 2.75 0 0116.5 17H3.5A2.75 2.75 0 01.75 14.25v-9.5z" />
      <path d="M3.5 4a1 1 0 00-1 1v9.25a1.25 1.25 0 001.25 1.5h12.5A1.25 1.25 0 0017.5 14.25v-5.5a1.25 1.25 0 00-1.25-1.25H9.75a.75.75 0 01-.53-.22L6.414 4.72A1.25 1.25 0 005.53 4H3.5z" />
    </svg>
  ),
  'folder-plus': (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M.99 4.75A2.75 2.75 0 013.74 2h4.553a2.75 2.75 0 011.946.804l2.803 2.803A2.75 2.75 0 0114.856 6H16.5A2.75 2.75 0 0119.25 8.75v.25a.75.75 0 01-1.5 0V8.75a1.25 1.25 0 00-1.25-1.25h-1.793a.75.75 0 01-.53-.22L9.364 4.72A1.25 1.25 0 008.48 4H3.74A1.25 1.25 0 002.5 5.25v9A1.25 1.25 0 003.75 15.5h6.5a.75.75 0 010 1.5h-6.5A2.75 2.75 0 011 14.25v-9.5z" />
      <path d="M14 12.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
    </svg>
  ),
};