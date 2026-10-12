import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import './index.css';
import App from './App';
import { PrefsProvider } from './lib/prefs';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PrefsProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </PrefsProvider>
    </HashRouter>
  </React.StrictMode>,
);
