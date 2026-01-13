import React from 'react';
import { AppProviders } from './components/app/AppProviders';
import { AppContainer } from './components/app/AppContainer';

/**
 * App - Root component
 * Sets up providers and renders the main application
 */
export default function App() {
  return (
    <AppProviders>
      <AppContainer />
    </AppProviders>
  );
}
