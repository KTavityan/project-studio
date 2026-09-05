from backend.spend import SpendCap, prompt_tokens, usd_for_tokens


def test_prompt_tokens_rounds_up():
    assert prompt_tokens("") == 0
    assert prompt_tokens("abcd") == 1
    assert prompt_tokens("abcde") == 2


def test_worst_case_refuses_when_budget_is_short():
    cap = SpendCap(max_usd=0.001, max_tokens=800, usd_per_1k_in=0.005, usd_per_1k_out=0.015)
    long_text = "x" * 4000
    assert cap.would_exceed(long_text) is True


def test_record_adds_to_spent():
    cap = SpendCap(max_usd=2, max_tokens=800, usd_per_1k_in=0.005, usd_per_1k_out=0.015)
    cost = cap.record(1000, 1000)
    assert cost == usd_for_tokens(1000, 1000, 0.005, 0.015)
    assert cap.spent_usd == cost
    assert cap.remaining() == 2 - cost
