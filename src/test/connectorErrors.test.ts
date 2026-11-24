/**
 * Tests for the connector error constants.
 * Does not require DOM/React.
 */
import { describe, it, expect } from 'vitest';
import {
  CONNECTOR_ERROR_MESSAGES,
  getFriendlyErrorMessage,
} from '../constants/connectorErrors';

describe('CONNECTOR_ERROR_MESSAGES', () => {
  it('has a message for every specified error code', () => {
    const required = [
      'VALIDATION_ERROR',
      'INVALID_CREDENTIALS',
      'BASE_URL_BLOCKED',
      'BASE_URL_UNREACHABLE',
      'OAUTH_NOT_CONFIGURED',
      'DISCOVERY_FAILED',
      'UNKNOWN',
    ];
    required.forEach((code) => {
      expect(CONNECTOR_ERROR_MESSAGES).toHaveProperty(code);
      expect(typeof CONNECTOR_ERROR_MESSAGES[code]).toBe('string');
      expect(CONNECTOR_ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    });
  });
});

describe('getFriendlyErrorMessage', () => {
  it('returns the mapped message for a known code', () => {
    expect(getFriendlyErrorMessage('INVALID_CREDENTIALS')).toBe(
      CONNECTOR_ERROR_MESSAGES.INVALID_CREDENTIALS,
    );
  });

  it('returns UNKNOWN message for an unknown code', () => {
    expect(getFriendlyErrorMessage('SOME_UNKNOWN_CODE')).toBe(
      CONNECTOR_ERROR_MESSAGES.UNKNOWN,
    );
  });

  it('returns UNKNOWN message when code is null', () => {
    expect(getFriendlyErrorMessage(null)).toBe(CONNECTOR_ERROR_MESSAGES.UNKNOWN);
  });

  it('returns UNKNOWN message when code is undefined', () => {
    expect(getFriendlyErrorMessage(undefined)).toBe(CONNECTOR_ERROR_MESSAGES.UNKNOWN);
  });
});
