// dist/ringbuffer.js
class RingBuffer {
  constructor(capacity = 10000) {
    this.cap = capacity;
    this.buf = new Array(capacity);
    this.head = 0;
    this.size = 0;
  }
  push(item) {
    this.buf[this.head] = item;
    this.head = (this.head + 1) % this.cap;
    if (this.size < this.cap) this.size++;
  }
  snapshot(n = 1000) {
    const take = Math.min(Math.max(0, n), this.size);
    const out = new Array(take);
    let start = (this.head - take + this.cap) % this.cap;
    for (let i = 0; i < take; i++) {
      out[i] = this.buf[(start + i) % this.cap];
    }
    return out;
  }
  clear() {
    this.head = 0;
    this.size = 0;
    this.buf = new Array(this.cap);
  }
}
module.exports = RingBuffer;
