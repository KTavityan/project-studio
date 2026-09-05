"""In-memory spend cap for the local proxy process."""

from __future__ import annotations

import math
from dataclasses import dataclass, field


def prompt_tokens(text: str) -> int:
    if not text:
        return 0
    return math.ceil(len(text) / 4)


def usd_for_tokens(n_in: int, n_out: int, usd_per_1k_in: float, usd_per_1k_out: float) -> float:
    return (n_in / 1000.0) * usd_per_1k_in + (n_out / 1000.0) * usd_per_1k_out


@dataclass
class SpendCap:
    max_usd: float
    max_tokens: int
    usd_per_1k_in: float
    usd_per_1k_out: float
    spent_usd: float = field(default=0.0)

    def remaining(self) -> float:
        return self.max_usd - self.spent_usd

    def worst_case_usd(self, system_and_user: str) -> float:
        n_in = prompt_tokens(system_and_user)
        return usd_for_tokens(n_in, self.max_tokens, self.usd_per_1k_in, self.usd_per_1k_out)

    def would_exceed(self, system_and_user: str) -> bool:
        return self.worst_case_usd(system_and_user) > self.remaining()

    def record(self, n_in: int, n_out: int) -> float:
        cost = usd_for_tokens(n_in, n_out, self.usd_per_1k_in, self.usd_per_1k_out)
        self.spent_usd += cost
        return cost
