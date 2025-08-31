import { describe, test, expect, beforeEach, vi } from 'vitest';
import KVStore from '../src/index';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('KVStore', () => {
  let store;
  const testAppId = 'test-app-id';

  beforeEach(() => {
    vi.clearAllMocks();
    store = new KVStore(testAppId);
  });

  describe('constructor', () => {
    test('should initialize with default options', () => {
      expect(store.appId).toBe(testAppId);
      expect(store.shouldCache).toBe(false);
      expect(store.API_URL).toBe('https://litekv-api.onrender.com');
    });

    test('should initialize with custom options', () => {
      const customStore = new KVStore('test', {
        api_url: 'https://custom-api.com',
        shouldCache: true,
      });
      expect(customStore.API_URL).toBe('https://custom-api.com');
      expect(customStore.shouldCache).toBe(true);
    });

    test('should handle empty options object', () => {
      const store = new KVStore('test', {});
      expect(store.appId).toBe('test');
    });
  });

  describe('checkAppExists', () => {
    test('should check app existence successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      await store.checkAppExists();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/exists/test-app-id',
      );
    });

    test('should throw error if app does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('false'),
      });

      await expect(store.checkAppExists()).rejects.toThrow("App with ID 'test-app-id' does not exist");
    });

    test('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(store.checkAppExists()).rejects.toThrow('Failed to check app existence: Fetch failed: Network error');
    });

    test('should only check once', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      await store.checkAppExists();
      await store.checkAppExists();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('set', () => {
    beforeEach(() => {
      // Mock app exists check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });
    });

    test('should set value successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      const result = await store.set('key1', 'value1');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/setVal/test-app-id/key1/value1'
      );
    });

    test('should handle URL encoding for special characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      await store.set('key with spaces', 'value/with/slashes');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/setVal/test-app-id/key%20with%20spaces/value%2Fwith%2Fslashes'
      );
    });

    test('should cache value when caching is enabled', async () => {
      const cachedStore = new KVStore(testAppId, { shouldCache: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      await cachedStore.set('key1', 'value1');
      expect(cachedStore['cache'].get('key1')).toBe('value1');
    });

    test('should return false on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('false'),
      });

      const result = await store.set('key1', 'value1');
      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      // Mock app exists check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });
    });

    test('should get value successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('test-value'),
      });

      const result = await store.get('key1');
      expect(result).toBe('test-value');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/getVal/test-app-id/key1'
      );
    });

    test('should return cached value when available', async () => {
      const cachedStore = new KVStore(testAppId, { shouldCache: true });
      cachedStore['cache'].set('key1', 'cached-value');

      const result = await cachedStore.get('key1');
      expect(result).toBe('cached-value');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only for app exists check
    });

    test('should handle URL decoding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('value%2Fwith%2Fslashes'),
      });

      const result = await store.get('key1');
      expect(result).toBe('value/with/slashes');
    });

    test('should return undefined for non-existent key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('null'),
      });

      const result = await store.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Mock app exists check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });
    });

    test('should delete value successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      const result = await store.delete('key1');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/setVal/test-app-id/key1'
      );
    });

    test('should remove from cache when caching is enabled', async () => {
      const cachedStore = new KVStore(testAppId, { shouldCache: true });
      cachedStore['cache'].set('key1', 'value1');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      await cachedStore.delete('key1');
      expect(cachedStore['cache'].has('key1')).toBe(false);
    });
  });

  describe('inc', () => {
    beforeEach(() => {
      // Mock app exists check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });
    });

    test('should increment value successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      const result = await store.inc('counter', 5);
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/inc/test-app-id/counter/5'
      );
    });

    test('should use default increment of 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      await store.inc('counter');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/inc/test-app-id/counter/1'
      );
    });
  });

  describe('dec', () => {
    beforeEach(() => {
      // Mock app exists check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });
    });

    test('should decrement value successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      const result = await store.dec('counter', 3);
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/dec/test-app-id/counter/3'
      );
    });

    test('should use default decrement of 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('true'),
      });

      await store.dec('counter');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://litekv-api.onrender.com/dec/test-app-id/counter/1'
      );
    });
  });

  describe('error handling', () => {
    test('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(store.get('key1')).rejects.toThrow('Failed to check app existence: Fetch failed: HTTP error! status: 404');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(store.get('key1')).rejects.toThrow('Failed to check app existence: Fetch failed: Network error');
    });
  });
});