/**
 * Simple event emitter for WordNet state changes
 * Provides a lightweight way to subscribe to database and state changes
 */

import type { WordNetEventMap, WordNetEventListener } from './types/index.js';

export type EventCallback = (...args: unknown[]) => void;

export class WordNetEventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   * @param event - Event name to listen for
   * @param callback - Function to call when event occurs
   */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name to stop listening for
   * @param callback - Function to remove from listeners
   */
  off(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      // Clean up empty event sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all listeners
   * @param event - Event name to emit
   * @param args - Arguments to pass to event callbacks
   */
  emit(event: string, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get the number of listeners for a specific event
   * @param event - Event name to check
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }


  /**
   * Remove all listeners for all events
   *  * Remove all listeners for a specific event
   * @param event - Event name to clear
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Event names that can be emitted
export const WordNetEvents = {
  DATABASE_LOADED: 'databaseLoaded',
  DATABASE_CLEARED: 'databaseCleared', 
  STATISTICS_UPDATED: 'statisticsUpdated',
  DATA_CHANGED: 'dataChanged',
  ERROR: 'error',
  PROGRESS: 'progress',
  INITIALIZED: 'initialized'
} as const;

export type WordNetEventName = typeof WordNetEvents[keyof typeof WordNetEvents];
