// Simple encryption simulation using base64 encoding
// In production, this would use proper AES-256 encryption with a secure key management system
const ENCRYPTION_PREFIX = 'enc_';
const SECRET_KEY = 'survey_tracking_secret_key_2024'; // In production, this would be securely managed

export function encryptParameter(value: string): string {
  try {
    // Simulate encryption by combining value with secret and encoding
    const combined = `${SECRET_KEY}:${value}:${Date.now()}`;
    const encoded = btoa(combined);
    return `${ENCRYPTION_PREFIX}${encoded}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return value;
  }
}

export function decryptParameter(encryptedValue: string): string {
  try {
    if (!encryptedValue.startsWith(ENCRYPTION_PREFIX)) {
      return encryptedValue; // Not encrypted, return as-is for backward compatibility
    }
    
    const encoded = encryptedValue.substring(ENCRYPTION_PREFIX.length);
    const decoded = atob(encoded);
    const parts = decoded.split(':');
    
    if (parts.length >= 2 && parts[0] === SECRET_KEY) {
      return parts[1]; // Return the original value
    }
    
    throw new Error('Invalid encrypted parameter');
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedValue; // Return as-is if decryption fails
  }
}

export function isEncryptedParameter(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX);
}

export function generateSecureUrl(baseUrl: string, parameters: Record<string, string>): string {
  // Extract survey ID from the baseUrl (assuming format like /survey/surveyId)
  const surveyIdMatch = baseUrl.match(/\/survey\/([^\/]+)/);
  const surveyId = surveyIdMatch ? surveyIdMatch[1] : 'unknown';
  
  // Generate a slug from the survey ID (first 6 characters)
  const slug = surveyId.substring(0, 6).toUpperCase();
  
  // Create the new URL format
  const url = new URL(`https://www.surveysgalore.com/${slug}`);
  
  Object.entries(parameters).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}