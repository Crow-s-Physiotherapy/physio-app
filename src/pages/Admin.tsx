import { useState } from 'react';

type AdminTab = 'donations' | 'appointments';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('donations');

  const tabs = [
    { id: 'donations' as AdminTab, name: 'Donations', icon: '💰' },
    { id: 'appointments' as AdminTab, name: 'Appointments', icon: '📅' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'donations':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Donation Management
            </h2>
            <p className="text-gray-600">
              Donation management features will be implemented here.
            </p>
          </div>
        );
      case 'appointments':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Appointment Management
            </h2>
            <p className="text-gray-600">
              Appointment management features will be implemented here.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage and test system functionality</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </div>
    </div>
  );
}
