/**
 * useAutoSave Hook
 * Handles automatic saving of notes with debouncing
 */

import { useRef, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('useAutoSave');

export function useAutoSave(options = {}) {
  const {
    onSave,
    delay = 800,
    onStatusChange
  } = options;

  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);

  const debouncedSave = useCallback(async (data) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    logger.debug('Debounced save scheduled', { delay });

    // Schedule new save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        onStatusChange?.('Saving...');

        logger.info('Executing debounced save...');
        const result = await onSave(data);

        if (result.success) {
          onStatusChange?.('Saved');
          logger.info('Save successful');
        } else {
          onStatusChange?.('Failed to save');
          logger.error('Save failed:', result.error);
        }

        return result;
      } catch (error) {
        onStatusChange?.('Error saving');
        logger.error('Save error:', error);
        return { success: false, error: error.message };
      } finally {
        isSavingRef.current = false;
        // Clear status after 2 seconds
        setTimeout(() => {
          if (!isSavingRef.current) {
            onStatusChange?.(null);
          }
        }, 2000);
      }
    }, delay);
  }, [onSave, delay, onStatusChange]);

  const cancelPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const saveSynchronously = useCallback(async (data) => {
    cancelPendingSave();
    isSavingRef.current = true;
    onStatusChange?.('Saving...');

    try {
      const result = await onSave(data);
      if (result.success) {
        onStatusChange?.('Saved');
      } else {
        onStatusChange?.('Failed to save');
      }
      return result;
    } catch (error) {
      onStatusChange?.('Error saving');
      return { success: false, error: error.message };
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onStatusChange, cancelPendingSave]);

  return {
    debouncedSave,
    saveSynchronously,
    cancelPendingSave,
    isSaving: isSavingRef.current
  };
}

export default useAutoSave;
