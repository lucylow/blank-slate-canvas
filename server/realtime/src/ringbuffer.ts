// server/realtime/src/ringbuffer.ts

export class RingBuffer<T> {
  private cap: number;
  private buf: Array<T | undefined>;
  private head = 0;
  public size = 0;

  constructor(capacity = 10000) {
    this.cap = capacity;
    this.buf = new Array<T | undefined>(capacity);
  }

  push(item: T) {
    this.buf[this.head] = item;
    this.head = (this.head + 1) % this.cap;
    if (this.size < this.cap) this.size++;
  }

  snapshot(n = 1000): T[] {
    const take = Math.min(Math.max(0, n), this.size);
    const out: T[] = new Array(take);
    const start = (this.head - take + this.cap) % this.cap;

    for (let i = 0; i < take; i++) {
      const val = this.buf[(start + i) % this.cap];
      if (val === undefined) throw new Error("Unexpected undefined in ring buffer");
      out[i] = val;
    }

    return out;
  }

  clear() {
    this.head = 0;
    this.size = 0;
    this.buf = new Array<T | undefined>(this.cap);
  }
}

