/**
 * Validates an endpoint URL for the component.
 *
 * Requirements:
 * - Non-empty
 * - ≤2048 characters
 * - Valid URL with http or https protocol
 *
 * Returns null if valid, or an error message string if invalid.
 *
 * @see Requirement 8.5 - Emit agent-error for missing/malformed endpoint URL without connecting
 */
export function validateEndpointUrl(endpoint: string): string | null {
  if (!endpoint || endpoint.trim() === '') {
    return 'Missing required attribute: endpoint URL is empty';
  }

  if (endpoint.length > 2048) {
    return `Endpoint URL exceeds maximum length of 2048 characters (got ${endpoint.length})`;
  }

  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return `Invalid endpoint URL protocol: expected http or https, got '${url.protocol.replace(':', '')}'`;
    }
  } catch {
    return `Malformed endpoint URL: '${endpoint}' is not a valid URL`;
  }

  return null;
}
