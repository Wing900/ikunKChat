
import React from 'react';

export const iconSet4 = {
  'volume-2': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      React.createElement('polygon', { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }),
      React.createElement('path', { d: "M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" })
    )
  ),
  'clipboard': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      React.createElement('path', { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }),
      React.createElement('rect', { x: "8", y: "2", width: "8", height: "4", rx: "1", ry: "1" })
    )
  ),
  'arrow-left-right': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      React.createElement('path', { d: "M11 17l-4-4 4-4" }),
      React.createElement('path', { d: "M7 13h10" }),
      React.createElement('path', { d: "M13 7l4 4-4 4" })
    )
  ),
  'history': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      React.createElement('path', { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
      React.createElement('path', { d: "M3 3v5h5" }),
      React.createElement('path', { d: "M12 7v5l4 2" })
    )
  ),
};