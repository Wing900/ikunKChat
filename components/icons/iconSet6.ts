import React from 'react';

export const iconSet6 = {
  'graduation-cap': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      React.createElement('path', { d: "M22 10v6M2 10l10-5 10 5-10 5z" }),
      React.createElement('path', { d: "M6 12v5c3.33 1.67 6.67 1.67 10 0v-5" })
    )
  ),
  'lock': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      React.createElement('rect', { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
      React.createElement('path', { d: "M7 11V7a5 5 0 0 1 10 0v4" })
    )
  ),
  'arrow-right': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props },
      React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12" }),
      React.createElement('polyline', { points: "12 5 19 12 12 19" })
    )
  ),
  'basketball': (props: React.SVGProps<SVGSVGElement>) => (
    React.createElement('svg', { viewBox: "0 0 256 256", xmlns: "http://www.w3.org/2000/svg", ...props },
      React.createElement('defs', null,
        React.createElement('clipPath', { id: "clip-v61" },
          React.createElement('circle', { cx: "128", cy: "128", r: "100" })
        )
      ),
      React.createElement('g', { clipPath: "url(#clip-v61)" },
        React.createElement('path', { d: "M28,128 C88,140 168,140 228,128 L228,228 L28,228Z", fill: "#AAAAAA" }),
        React.createElement('path', { d: "M28,128 C88,140 168,140 228,128 L228,28 L28,28Z", fill: "#2c2c2c" }),
        React.createElement('g', { fill: "none", stroke: "white", strokeWidth: "20", strokeLinecap: "round" },
          React.createElement('path', { d: "M80,35 C85,80 90,110 85,135" }),
          React.createElement('path', { d: "M176,35 C171,80 166,110 171,135" })
        )
      )
    )
  ),
};