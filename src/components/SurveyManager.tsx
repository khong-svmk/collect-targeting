import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Eye, EyeOff, Copy, ExternalLink, Shield, ShieldOff, FileText, Code, Link } from 'lucide-react';
import { Survey, TrackingParameter } from '../types';
import { getSurveys, saveSurveys, addAuditLog } from '../utils/storage';
import { encryptParameter, decryptParameter, generateSecureUrl } from '../utils/encryption';

export default function SurveyManager() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [newParameter, setNewParameter] = useState({ name: '', value: '', encrypt: true });
  const [newSurvey, setNewSurvey] = useState({ name: '', description: '' });
  const [showEncryptedUrl, setShowEncryptedUrl] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [outputType, setOutputType] = useState<'url' | 'embed'>('url');

  const presetParameters = [
    { name: 'source', label: 'Source', placeholder: 'e.g., email, social, direct', encrypt: true },
    { name: 'unique_id', label: 'Unique ID', placeholder: 'e.g., user_12345, session_abc', encrypt: true },
    { name: 'expiration_date', label: 'Expiration Date', placeholder: 'e.g., 2024-12-31, 30d', encrypt: false },
    { name: 'campaign_id', label: 'Campaign ID', placeholder: 'e.g., Q4_2024_PROMO, HOLIDAY_SALE', encrypt: true }
  ];

  useEffect(() => {
    const loadedSurveys = getSurveys();
    setSurveys(loadedSurveys);
  }, []);

  const createSurvey = () => {
    const survey: Survey = {
      id: crypto.randomUUID(),
      name: newSurvey.name,
      description: newSurvey.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      isActive: true,
      parameters: []
    };

    const updatedSurveys = [...surveys, survey];
    setSurveys(updatedSurveys);
    saveSurveys(updatedSurveys);
    
    addAuditLog({
      action: 'create',
      entityType: 'survey',
      entityId: survey.id,
      userId: 'current-user',
      details: `Created survey: ${survey.name}`
    });

    setNewSurvey({ name: '', description: '' });
    setShowCreateModal(false);
  };

  const addParameter = () => {
    if (!selectedSurvey) return;

    const parameter: TrackingParameter = {
      id: crypto.randomUUID(),
      name: newParameter.name,
      value: newParameter.encrypt ? encryptParameter(newParameter.value) : newParameter.value,
      isEncrypted: newParameter.encrypt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSurvey = {
      ...selectedSurvey,
      parameters: [...selectedSurvey.parameters, parameter],
      updatedAt: new Date()
    };

    const updatedSurveys = surveys.map(s => s.id === selectedSurvey.id ? updatedSurvey : s);
    setSurveys(updatedSurveys);
    saveSurveys(updatedSurveys);
    setSelectedSurvey(updatedSurvey);

    addAuditLog({
      action: newParameter.encrypt ? 'encrypt' : 'create',
      entityType: 'parameter',
      entityId: parameter.id,
      userId: 'current-user',
      details: `Added ${newParameter.encrypt ? 'encrypted' : 'plain'} parameter: ${parameter.name}`,
      metadata: { surveyId: selectedSurvey.id, surveyName: selectedSurvey.name }
    });

    setNewParameter({ name: '', value: '', encrypt: true });
    setSelectedPreset('');
    setShowParameterModal(false);
  };

  const deleteParameter = (parameterId: string) => {
    if (!selectedSurvey) return;

    const parameterToDelete = selectedSurvey.parameters.find(p => p.id === parameterId);
    if (!parameterToDelete) return;

    const updatedSurvey = {
      ...selectedSurvey,
      parameters: selectedSurvey.parameters.filter(p => p.id !== parameterId),
      updatedAt: new Date()
    };

    const updatedSurveys = surveys.map(s => s.id === selectedSurvey.id ? updatedSurvey : s);
    setSurveys(updatedSurveys);
    saveSurveys(updatedSurveys);
    setSelectedSurvey(updatedSurvey);

    addAuditLog({
      action: 'delete',
      entityType: 'parameter',
      entityId: parameterId,
      userId: 'current-user',
      details: `Deleted parameter: ${parameterToDelete.name}`,
      metadata: { surveyId: selectedSurvey.id, surveyName: selectedSurvey.name }
    });
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = presetParameters.find(p => p.name === presetName);
    if (preset) {
      setNewParameter({
        name: preset.name,
        value: '',
        encrypt: preset.encrypt
      });
      setSelectedPreset(presetName);
    }
  };

  const resetParameterForm = () => {
    setNewParameter({ name: '', value: '', encrypt: true });
    setSelectedPreset('');
  };

  const generateSurveyUrl = (survey: Survey): string => {
    const baseUrl = `${window.location.origin}/survey/${survey.id}`;
    const params: Record<string, string> = {};
    
    survey.parameters.forEach(param => {
      // Use encrypted or unencrypted values based on showEncryptedUrl state
      if (showEncryptedUrl && param.isEncrypted) {
        params[param.name] = param.value; // Use encrypted value
      } else {
        params[param.name] = getActualParameterValue(param); // Use unencrypted value
      }
    });

    return generateSecureUrl(baseUrl, params);
  };

  const generateEmbedCode = (survey: Survey): string => {
    const surveyUrl = generateSurveyUrl(survey);
    return `<iframe 
  src="${surveyUrl}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  title="${survey.name}">
</iframe>`;
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getParameterDisplayValue = (param: TrackingParameter): string => {
    if (param.isEncrypted) {
      return '••••••••';
    }
    return param.value;
  };

  const getActualParameterValue = (param: TrackingParameter): string => {
    if (param.isEncrypted) {
      return decryptParameter(param.value);
    }
    return param.value;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Management</h2>
          <p className="text-gray-600 mt-1">Create and manage surveys with encrypted tracking parameters</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Survey</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Surveys</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {surveys.map(survey => (
                <button
                  key={survey.id}
                  onClick={() => setSelectedSurvey(survey)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedSurvey?.id === survey.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{survey.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{survey.parameters.length} parameters</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {survey.parameters.some(p => p.isEncrypted) && (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                      <div className={`w-2 h-2 rounded-full ${survey.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedSurvey ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{selectedSurvey.name}</h3>
                      <p className="text-gray-600 mt-1">{selectedSurvey.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(generateSurveyUrl(selectedSurvey))}
                        className="text-blue-600 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 transition-colors"
                        title="Copy survey URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={generateSurveyUrl(selectedSurvey)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 transition-colors"
                        title="Open survey"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Survey ID:</strong> {selectedSurvey.id}</p>
                    <p><strong>Created:</strong> {selectedSurvey.createdAt.toLocaleDateString()}</p>
                    <p><strong>Parameters:</strong> {selectedSurvey.parameters.length}</p>
                    <p><strong>Encrypted Parameters:</strong> {selectedSurvey.parameters.filter(p => p.isEncrypted).length}</p>
                  </div>
                </div>
              </div>

              {/* URL Preview Section */}
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {outputType === 'url' ? 'Survey URL Preview' : 'Embed Code Preview'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {outputType === 'url' 
                          ? 'Complete URL with all parameters' 
                          : 'HTML embed code for your website'
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setOutputType('url')}
                        className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm transition-colors ${
                          outputType === 'url'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Link className="w-4 h-4" />
                        <span>URL</span>
                      </button>
                      <button
                        onClick={() => setOutputType('embed')}
                        className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm transition-colors ${
                          outputType === 'embed'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        <span>Embed</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 mr-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          {outputType === 'url' ? 'Full URL:' : 'Embed Code:'}
                        </div>
                        <div className={`bg-white border rounded p-3 font-mono text-sm ${
                          outputType === 'url' ? 'break-all' : 'whitespace-pre-wrap overflow-x-auto'
                        }`}>
                          {outputType === 'url' ? generateSurveyUrl(selectedSurvey) : generateEmbedCode(selectedSurvey)}
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        {outputType === 'url' && (
                          <button
                            onClick={() => setShowEncryptedUrl(!showEncryptedUrl)}
                            className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm transition-colors ${
                              showEncryptedUrl 
                                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {showEncryptedUrl ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                <span>Show Plain</span>
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4" />
                                <span>Encrypt URL</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(
                            outputType === 'url' ? generateSurveyUrl(selectedSurvey) : generateEmbedCode(selectedSurvey)
                          )}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                    
                    {outputType === 'url' && selectedSurvey.parameters.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Parameters breakdown:
                          {showEncryptedUrl && (
                            <span className="ml-2 text-xs text-orange-600 font-normal">
                              (Showing encrypted values)
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {selectedSurvey.parameters.map(param => (
                            <div key={param.id} className="bg-white border rounded p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{param.name}:</span>
                                  {param.isEncrypted ? (
                                    <Shield className="w-4 h-4 text-green-600" title="Encrypted parameter" />
                                  ) : (
                                    <ShieldOff className="w-4 h-4 text-orange-600" title="Plain text parameter" />
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    const value = showEncryptedUrl && param.isEncrypted 
                                      ? param.value 
                                      : getActualParameterValue(param);
                                    copyToClipboard(`${param.name}=${value}`);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                                  title="Copy parameter"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Value:</span> 
                                  <span className="font-mono ml-1">
                                    {showEncryptedUrl && param.isEncrypted 
                                      ? param.value 
                                      : getActualParameterValue(param)
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {outputType === 'embed' && selectedSurvey.parameters.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Tracking Parameters Included</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          This embed code includes {selectedSurvey.parameters.length} tracking parameter(s) 
                          ({selectedSurvey.parameters.filter(p => p.isEncrypted).length} encrypted). 
                          All parameters will be automatically captured when users interact with the embedded survey.
                        </p>
                      </div>
                    )}
                    
                    {selectedSurvey.parameters.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No parameters added yet.</p>
                        <p className="text-xs mt-1">
                          Add tracking parameters to see them in the {outputType === 'url' ? 'URL' : 'embed code'}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="text-lg font-medium text-gray-900">Tracking Parameters</h4>
                  <button
                    onClick={() => setShowParameterModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Parameter</span>
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {selectedSurvey.parameters.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No parameters added yet. Add tracking parameters to get started.
                    </div>
                  ) : (
                    selectedSurvey.parameters.map(param => (
                      <div key={param.id} className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{param.name}</span>
                            {param.isEncrypted ? (
                              <Shield className="w-4 h-4 text-green-600" title="Encrypted parameter" />
                            ) : (
                              <ShieldOff className="w-4 h-4 text-orange-600" title="Plain text parameter" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">
                              Display: {getParameterDisplayValue(param)}
                            </span>
                            {param.isEncrypted && (
                              <span className="text-xs text-gray-500">
                                (Actual: {getActualParameterValue(param)})
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteParameter(param.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete parameter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Survey</h3>
              <p className="text-gray-600">Choose a survey from the list to view and manage its tracking parameters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create New Survey</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Survey Name</label>
                <input
                  type="text"
                  value={newSurvey.name}
                  onChange={(e) => setNewSurvey({ ...newSurvey, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter survey name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter survey description"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createSurvey}
                disabled={!newSurvey.name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                Create Survey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Parameter Modal */}
      {showParameterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Tracking Parameter</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => {
                    if (e.target.value) {
                      handlePresetSelect(e.target.value);
                    } else {
                      resetParameterForm();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a preset parameter...</option>
                  {presetParameters.map(preset => (
                    <option key={preset.name} value={preset.name}>
                      {preset.label} ({preset.name})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a common parameter type or enter custom values below
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parameter Name</label>
                <input
                  type="text"
                  value={newParameter.name}
                  onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={selectedPreset ? presetParameters.find(p => p.name === selectedPreset)?.placeholder : "e.g., campaign, user_id, source"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parameter Value</label>
                <input
                  type="text"
                  value={newParameter.value}
                  onChange={(e) => setNewParameter({ ...newParameter, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={selectedPreset ? presetParameters.find(p => p.name === selectedPreset)?.placeholder : "Enter parameter value"}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowParameterModal(false);
                  resetParameterForm();
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addParameter}
                disabled={!newParameter.name.trim() || !newParameter.value.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                Add Parameter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}