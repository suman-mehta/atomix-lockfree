/**
 * Atomix LockFree Queue – a zero‑dependency, lock‑free ring buffer built on
 * SharedArrayBuffer and Atomics. The capacity must be a power of two to enable
 * fast bit‑mask indexing.
 *
 * @module atomix-lockfree
 */

/**
 * @typedef {Object} QueueOptions
 * @property {number} [capacity] Power‑of‑two capacity, default 1024.
 */

/**
 * Lock‑free FIFO queue.
 */
class LockFreeQueue {
  /**
   * @param {number} capacity Must be a power of two.
   */
  constructor(capacity = 1024) {
    if (capacity <= 0 || (capacity & (capacity - 1)) !== 0) {
      throw new RangeError('capacity must be a power of two');
    }
    this.capacity = capacity;
    this.mask = capacity - 1;

    // Two 32‑bit slots: head and tail indices.
    this.control = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    this.head = new Int32Array(this.control, 0, 1);
    this.tail = new Int32Array(this.control, Int32Array.BYTES_PER_ELEMENT, 1);

    // Backing storage for payloads – regular JS array (non‑shared).
    this.buffer = new Array(capacity);
  }

  /**
   * Enqueue an item. Returns false if the queue is full.
   * @param {*} item
   * @returns {boolean}
   */
  enqueue(item) {
    while (true) {
      const tail = Atomics.load(this.tail, 0);
      const head = Atomics.load(this.head, 0);
      if ((tail - head) >= this.capacity) {
        return false; // full
      }
      const idx = tail & this.mask;
      // Try to claim the slot by advancing tail.
      if (Atomics.compareExchange(this.tail, 0, tail, tail + 1) === tail) {
        this.buffer[idx] = item;
        // Slot is now visible to consumers.
        return true;
      }
      // Contention – retry.
    }
  }

  /**
   * Dequeue an item. Returns undefined if the queue is empty.
   * @returns {*|undefined}
   */
  dequeue() {
    while (true) {
      const head = Atomics.load(this.head, 0);
      const tail = Atomics.load(this.tail, 0);
      if (head === tail) {
        return undefined; // empty
      }
      const idx = head & this.mask;
      if (Atomics.compareExchange(this.head, 0, head, head + 1) === head) {
        const item = this.buffer[idx];
        this.buffer[idx] = undefined;
        return item;
      }
      // Contention – retry.
    }
  }

  /**
   * Current number of items in the queue.
   * @returns {number}
   */
  size() {
    const head = Atomics.load(this.head, 0);
    const tail = Atomics.load(this.tail, 0);
    return tail - head;
  }
}

/**
 * Create a new lock‑free queue.
 * @param {QueueOptions} [options]
 * @returns {LockFreeQueue}
 */
export function createQueue(options = {}) {
  const { capacity = 1024 } = options;
  return new LockFreeQueue(capacity);
}

export { LockFreeQueue };
