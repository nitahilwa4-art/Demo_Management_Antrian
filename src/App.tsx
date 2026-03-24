import React, { useState } from 'react';
import { AppProvider } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Queue } from './pages/Queue';
import { Customers } from './pages/Customers';
import { Therapists } from './pages/Therapists';
import { Services } from './pages/Services';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'queue':
        return <Queue />;
      case 'customers':
        return <Customers onNavigate={setActiveTab} />;
      case 'therapists':
        return <Therapists />;
      case 'services':
        return <Services />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>
    </AppProvider>
  );
}

