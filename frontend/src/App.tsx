import React from 'react';
import { EuiProvider } from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_light.css';
import { Layout } from './components/Layout';
import './index.css';

function App() {
  return (
    <EuiProvider colorMode="light">
      <Layout />
    </EuiProvider>
  );
}

export default App;
