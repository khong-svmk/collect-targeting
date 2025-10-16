import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Users, Eye, Calendar, Filter } from 'lucide-react';
import { getSurveys, getSurveyResponses } from '../utils/storage';
import { Survey, SurveyResponse } from '../types';
import { decryptParameter } from '../utils/encryption';

export default function Analytics() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    setSurveys(getSurveys());
    setResponses(getSurveyResponses());
  }, []);

  const filteredResponses = responses.filter(response => {
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const inTimeRange = response.timestamp >= cutoff;
    const matchesSurvey = selectedSurvey === 'all' || response.surveyId === selectedSurvey;
    
    return inTimeRange && matchesSurvey;
  });

  const getParameterAnalytics = () => {
    const parameterCounts: Record<string, Record<string, number>> = {};
    
    filteredResponses.forEach(response => {
      Object.entries(response.parameters).forEach(([key, value]) => {
        if (!parameterCounts[key]) {
          parameterCounts[key] = {};
        }
        
        // Try to decrypt if it's encrypted
        const decryptedValue = decryptParameter(value);
        const displayValue = decryptedValue || value;
        
        parameterCounts[key][displayValue] = (parameterCounts[key][displayValue] || 0) + 1;
      });
    });
    
    return parameterCounts;
  };

  const parameterAnalytics = getParameterAnalytics();

  const stats = [
    {
      label: 'Total Responses',
      value: filteredResponses.length,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: 'Active Surveys',
      value: surveys.filter(s => s.isActive).length,
      icon: Eye,
      color: 'bg-green-500'
    },
    {
      label: 'Encrypted Parameters',
      value: surveys.reduce((acc, survey) => acc + survey.parameters.filter(p => p.isEncrypted).length, 0),
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      label: 'Unique Visitors',
      value: new Set(filteredResponses.map(r => r.ipAddress)).size,
      icon: BarChart,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor survey performance and parameter tracking</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedSurvey}
            onChange={(e) => setSelectedSurvey(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Surveys</option>
            {surveys.map(survey => (
              <option key={survey.id} value={survey.id}>{survey.name}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Parameter Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Parameter Distribution</h3>
          </div>
          <div className="p-4">
            {Object.keys(parameterAnalytics).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No parameter data available</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(parameterAnalytics).map(([paramName, values]) => (
                  <div key={paramName} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{paramName}</h4>
                    <div className="space-y-2">
                      {Object.entries(values)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([value, count]) => {
                          const percentage = (count / filteredResponses.length) * 100;
                          return (
                            <div key={value} className="flex items-center justify-between">
                              <div className="flex-1 mr-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700 truncate">{value}</span>
                                  <span className="text-gray-500">{count}</span>
                                </div>
                                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredResponses.slice(0, 10).map((response, index) => (
              <div key={response.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Survey Response</p>
                    <p className="text-sm text-gray-500">
                      {surveys.find(s => s.id === response.surveyId)?.name || 'Unknown Survey'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {response.timestamp.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {response.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Parameters: {Object.keys(response.parameters).join(', ')}
                </div>
              </div>
            ))}
            {filteredResponses.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No responses found for the selected criteria
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}