export interface Survey {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  parameters: TrackingParameter[];
}

export interface TrackingParameter {
  id: string;
  name: string;
  value: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  parameters: Record<string, string>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'encrypt' | 'decrypt';
  entityType: 'survey' | 'parameter' | 'response';
  entityId: string;
  userId: string;
  timestamp: Date;
  details: string;
  metadata?: Record<string, any>;
}