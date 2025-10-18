import React from 'react';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { UIStateProvider } from './contexts/UIStateContext';
import { AppContainer } from './components/app/AppContainer';

const App: React.FC = () => {
  return (
    <LocalizationProvider>
      <UIStateProvider>
        <AppContainer />
      </UIStateProvider>
    </LocalizationProvider>
  );
};

export default App;
