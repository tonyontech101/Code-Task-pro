/**
 * performance.js - Utility functions for performance optimization
 */

/**
 * Debounce function to limit how often a function can be called.
 * Useful for search inputs, window resizing, and scroll events.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time in milliseconds to wait before calling the function
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Cleanup manager to track and execute unsubscribe/cleanup functions.
 * Helps prevent memory leaks from Firebase listeners.
 */
export class CleanupManager {
  constructor() {
    this.unsubscribers = [];
  }

  /**
   * Add a cleanup function to the manager.
   * @param {Function} unsub - The function to call during cleanup
   */
  add(unsub) {
    if (typeof unsub === 'function') {
      this.unsubscribers.push(unsub);
    }
  }

  /**
   * Call all registered cleanup functions and clear the list.
   */
  cleanup() {
    console.log(`Cleaning up ${this.unsubscribers.length} listeners...`);
    this.unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
    });
    this.unsubscribers = [];
  }
}
