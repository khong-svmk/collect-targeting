import { Survey, SurveyResponse, AuditLog } from '../types';

const SURVEYS_KEY = 'surveys';
const RESPONSES_KEY = 'survey_responses';
const AUDIT_LOGS_KEY = 'audit_logs';

export function getSurveys(): Survey[] {
  try {
    const data = localStorage.getItem(SURVEYS_KEY);
    if (!data) return [];
    
    const surveys = JSON.parse(data);
    return surveys.map((survey: any) => ({
      ...survey,
      createdAt: new Date(survey.createdAt),
      updatedAt: new Date(survey.updatedAt),
      parameters: survey.parameters.map((param: any) => ({
        ...param,
        createdAt: new Date(param.createdAt),
        updatedAt: new Date(param.updatedAt),
        value: typeof param.value === 'string' ? param.value : ''
      }))
    }));
  } catch (error) {
    console.error('Error loading surveys:', error);
    return [];
  }
}

export function saveSurveys(surveys: Survey[]): void {
  try {
    localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));
  } catch (error) {
    console.error('Error saving surveys:', error);
  }
}

export function getSurveyResponses(): SurveyResponse[] {
  try {
    const data = localStorage.getItem(RESPONSES_KEY);
    if (!data) return [];
    
    const responses = JSON.parse(data);
    return responses.map((response: any) => ({
      ...response,
      timestamp: new Date(response.timestamp)
    }));
  } catch (error) {
    console.error('Error loading responses:', error);
    return [];
  }
}

export function saveSurveyResponses(responses: SurveyResponse[]): void {
  try {
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  } catch (error) {
    console.error('Error saving responses:', error);
  }
}

export function getAuditLogs(): AuditLog[] {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!data) return [];
    
    const logs = JSON.parse(data);
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp)
    }));
  } catch (error) {
    console.error('Error loading audit logs:', error);
    return [];
  }
}

export function saveAuditLogs(logs: AuditLog[]): void {
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving audit logs:', error);
  }
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date()
  };
  logs.unshift(newLog);
  saveAuditLogs(logs.slice(0, 1000)); // Keep only last 1000 logs
}