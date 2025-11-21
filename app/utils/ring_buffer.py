# app/utils/ring_buffer.py

from collections import deque
from typing import Deque, Any, Dict, List


class RingBuffer:
    def __init__(self, maxlen: int = 2000):
        self._dq: Deque[Dict[str, Any]] = deque(maxlen=maxlen)

    def append(self, item: Dict[str, Any]) -> None:
        self._dq.append(item)

    def tail(self, n: int = None) -> List[Dict[str, Any]]:
        if n is None:
            return list(self._dq)
        return list(self._dq)[-n:]

    def last(self) -> Dict[str, Any]:
        return self._dq[-1] if self._dq else {}

    def len(self) -> int:
        return len(self._dq)

    def clear(self):
        self._dq.clear()

