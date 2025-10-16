import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SurveyManager from './components/SurveyManager';
import Analytics from './components/Analytics';
import AuditLogs from './components/AuditLogs';
import SurveyViewer from './components/SurveyViewer';
import { getSurveys, saveSurveys, addAuditLog } from './utils/storage';
import { Survey, TrackingParameter } from './types';
import { encryptParameter } from './utils/encryption';

// Initialize demo data
const initializeDemoData = () => {
  const existingSurveys = getSurveys();
  if (existingSurveys.length === 0) {
    const demoSurveys: Survey[] = [
      {
        id: 'demo-survey-1',
        name: 'Q4 Customer Satisfaction Survey',
        description: 'Quarterly customer feedback collection with campaign tracking',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdBy: 'current-user',
        isActive: true,
        parameters: [
          {
            id: 'param-1',
            name: 'campaign',
            value: encryptParameter('Q4_2024_CUSTOMER_SAT'),
            isEncrypted: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'param-2',
            name: 'source',
            value: encryptParameter('email_newsletter'),
            isEncrypted: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'param-3',
            name: 'segment',
            value: 'enterprise',
            isEncrypted: false,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: 'demo-survey-2',
        name: 'Product Feature Feedback',
        description: 'Collect feedback on new product features',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdBy: 'current-user',
        isActive: true,
        parameters: [
          {
            id: 'param-4',
            name: 'user_id',
            value: encryptParameter('user_12345'),
            isEncrypted: true,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'param-5',
            name: 'feature',
            value: encryptParameter('new_dashboard'),
            isEncrypted: true,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ];

    saveSurveys(demoSurveys);

    // Add some demo audit logs
    demoSurveys.forEach(survey => {
      addAuditLog({
        action: 'create',
        entityType: 'survey',
        entityId: survey.id,
        userId: 'demo-user',
        details: `Demo survey created: ${survey.name}`
      });

      survey.parameters.forEach(param => {
        addAuditLog({
          action: param.isEncrypted ? 'encrypt' : 'create',
          entityType: 'parameter',
          entityId: param.id,
          userId: 'demo-user',
          details: `${param.isEncrypted ? 'Encrypted' : 'Plain'} parameter added: ${param.name}`,
          metadata: { surveyId: survey.id, surveyName: survey.name }
        });
      });
    });
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState<'surveys' | 'analytics' | 'audit'>('surveys');

  useEffect(() => {
    initializeDemoData();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/survey/:surveyId" element={<SurveyViewer />} />
        <Route path="/*" element={
          <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
            {currentPage === 'surveys' && <SurveyManager />}
            {currentPage === 'analytics' && <Analytics />}
            {currentPage === 'audit' && <AuditLogs />}
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;