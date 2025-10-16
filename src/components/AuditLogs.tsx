import React, { useState, useEffect } from 'react';
import { Shield, User, Calendar, Filter, Search } from 'lucide-react';
import { getAuditLogs } from '../utils/storage';
import { AuditLog } from '../types';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState({
    action: 'all',
    entityType: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    const auditLogs = getAuditLogs();
    setLogs(auditLogs);
    setFilteredLogs(auditLogs);
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (filter.action !== 'all') {
      filtered = filtered.filter(log => log.action === filter.action);
    }

    if (filter.entityType !== 'all') {
      filtered = filtered.filter(log => log.entityType === filter.entityType);
    }

    if (filter.searchTerm) {
      filtered = filtered.filter(log => 
        log.details.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(filter.searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filter]);

  const getActionBadgeColor = (action: string) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-gray-100 text-gray-800',
      encrypt: 'bg-purple-100 text-purple-800',
      decrypt: 'bg-orange-100 text-orange-800'
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'survey': return '📋';
      case 'parameter': return '🔧';
      case 'response': return '📊';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600 mt-1">Track all system activities and security events</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Security Compliance Enabled</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="encrypt">Encrypt</option>
              <option value="decrypt">Decrypt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={filter.entityType}
              onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="survey">Survey</option>
              <option value="parameter">Parameter</option>
              <option value="response">Response</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filter.searchTerm}
                onChange={(e) => setFilter({ ...filter, searchTerm: e.target.value })}
                placeholder="Search logs by details, ID, or user..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Activity History</h3>
          <span className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} entries
          </span>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No audit logs match your current filters</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getEntityTypeIcon(log.entityType)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                        {log.action.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{log.entityType}</span>
                    </div>
                    <p className="text-gray-900 mb-1">{log.details}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{log.userId}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{log.timestamp.toLocaleString()}</span>
                      </span>
                      <span>ID: {log.entityId.substring(0, 8)}...</span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 text-xs">
                        <details className="text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">Additional Details</summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {log.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(log => log.action === 'encrypt').length}
          </div>
          <div className="text-sm text-gray-600">Encryptions</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {new Set(logs.map(log => log.userId)).size}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {logs.filter(log => log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
          </div>
          <div className="text-sm text-gray-600">Last 24h</div>
        </div>
      </div>
    </div>
  );
}