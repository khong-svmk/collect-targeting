import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { getSurveys, getSurveyResponses, saveSurveyResponses, addAuditLog } from '../utils/storage';
import { decryptParameter } from '../utils/encryption';
import { Survey, SurveyResponse } from '../types';

export default function SurveyViewer() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;

    // Load survey
    const surveys = getSurveys();
    const foundSurvey = surveys.find(s => s.id === surveyId);
    setSurvey(foundSurvey || null);

    // Extract and decrypt URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const extractedParams: Record<string, string> = {};

    urlParams.forEach((value, key) => {
      // Try to decrypt the parameter value
      const decryptedValue = decryptParameter(value);
      extractedParams[key] = decryptedValue;
    });

    setParameters(extractedParams);
    setLoading(false);

    // Log the survey view
    if (foundSurvey) {
      addAuditLog({
        action: 'view',
        entityType: 'survey',
        entityId: surveyId,
        userId: 'anonymous-user',
        details: `Survey viewed: ${foundSurvey.name}`,
        metadata: { parameters: extractedParams, userAgent: navigator.userAgent }
      });
    }
  }, [surveyId]);

  const handleSubmit = () => {
    if (!surveyId || !survey) return;

    // Create a survey response record
    const response: SurveyResponse = {
      id: crypto.randomUUID(),
      surveyId,
      parameters,
      timestamp: new Date(),
      ipAddress: '127.0.0.1', // Simulated IP
      userAgent: navigator.userAgent
    };

    // Save the response
    const responses = getSurveyResponses();
    responses.push(response);
    saveSurveyResponses(responses);

    // Log the response
    addAuditLog({
      action: 'create',
      entityType: 'response',
      entityId: response.id,
      userId: 'anonymous-user',
      details: `Survey response submitted for: ${survey.name}`,
      metadata: { surveyId, parameters }
    });

    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Survey Not Found</h1>
          <p className="text-gray-600 mb-6">The requested survey could not be found.</p>
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your survey response has been recorded successfully.</p>
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Survey Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{survey.name}</h1>
            <p className="text-blue-100">{survey.description}</p>
          </div>

          {/* Survey Content */}
          <div className="p-6 space-y-6">
            {/* Demo Survey Questions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How satisfied are you with our service?
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Very Satisfied</option>
                  <option>Satisfied</option>
                  <option>Neutral</option>
                  <option>Dissatisfied</option>
                  <option>Very Dissatisfied</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What features would you like to see improved?
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Please share your thoughts..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Would you recommend us to others?
                </label>
                <div className="space-y-2">
                  {['Yes, definitely', 'Yes, probably', 'Not sure', 'Probably not', 'Definitely not'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="recommend" value={option} className="mr-2" />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {Object.keys(parameters).length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">Tracking Information</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    This survey includes secure tracking parameters to help us analyze responses:
                  </p>
                  <div className="space-y-2">
                    {Object.entries(parameters).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Parameters are securely encrypted to protect your privacy
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                Submit Survey
              </button>
            </div>
          </div>
        </div>

        {/* Back to Dashboard Link */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}