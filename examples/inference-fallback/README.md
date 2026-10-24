# Inference fallback: a small, inspectable failure path

An independent educational sample prepared for Vitor Schiavo's portfolio with
AI-assisted implementation. It is not employer source code, a historical work
artifact, a production gateway, or a model-quality benchmark.

Python 3.10+; standard library only. No installation, GPU or paid API is needed
to run the integration tests:

```sh
cd examples/inference-fallback
python3 -m unittest discover -s . -p 'test_*.py' -v
```

The tests start real loopback HTTP servers with simulated OpenAI-compatible
responses. They exercise primary success, authentication, HTTP failure,
empty answers, slow providers, exhaustion and configuration validation.

## Request path

```text
operator-owned provider configuration
                 |
          authenticated request
                 |
       primary: usable answer? ---- yes ---> return answer + attempts
                 |
      transient failure / timeout / empty answer
                 |
        next provider, if admission budget remains
                 |
         answer or explicit InferenceError
```

Read `client.py` for the complete implementation and `test_client.py` for
reproducible examples. The Python API accepts `(url, bearer_token, model)` tuples.
An optional CLI reads an ordered list of providers from `INFERENCE_PROVIDERS`:

```json
[
  {"url": "https://your-primary.example/v1/chat/completions", "token_env": "PRIMARY_INFERENCE_TOKEN", "model": "your-model"},
  {"url": "https://your-backup.example/v1/chat/completions", "token_env": "BACKUP_INFERENCE_TOKEN", "model": "your-model"}
]
```

Set the named token environment variables through your own secret-management
mechanism, then run:

```sh
python3 client.py --prompt 'Explain a readiness probe.' --timeout 2 --budget 5
```

These are placeholder endpoints, not live services. The prompt is a command-line
argument and may appear in shell history/process listings; do not use sensitive
input in this demonstration CLI. Provider configuration must be trusted.

## Decisions and trade-offs

- **Sequential fallback, not hedging.** Easier to inspect, avoids simultaneous
  duplicate calls; the fallback adds latency and can still duplicate provider
  processing/billing after a timeout. This is only for inference, not operations
  with side effects.
- **401/403 stop the chain.** An invalid identity is a configuration failure;
  silently using the backup would conceal it. Rate limits and server errors
  permit fallback. Other HTTP request errors stop immediately.
- **A 200 status is insufficient.** A response needs a non-empty text answer.
  Response reads are bounded to 1 MiB; streaming/tool/multimodal outputs are not
  supported by this intentionally small client.
- **An admission budget and socket timeouts, not a hard deadline.** No new
  attempt starts after the budget expires. Blocking DNS resolution and peers
  trickling data can exceed wall-clock limits. A production implementation
  needs a transport/runtime with a tested total request deadline.
- **Explicit attempt metadata.** Provider index, outcome and elapsed time can
  inform low-cardinality metrics. No token, endpoint, prompt or answer is
  included in attempt logs. Successful answer text is returned to the caller.
- **No redirect following.** Prevents forwarding bearer credentials to another
  endpoint. Remote endpoints require HTTPS; loopback HTTP is allowed for tests.

## What I would add for production

Hard cancellation deadlines, request/concurrency limits, streaming semantics,
provider-specific contracts, explicit egress policy, circuit breaking, load tests,
and privacy-approved metrics for end-to-end latency and cost per successful
request. Provider failover also changes data residency and model behavior;
operators must decide whether a request is permitted to use each destination.

## Relation to the portfolio

The professional [LLM serving case](https://vitorschiavo.dev/cases/self-hosting-gemma-3-vllm/)
explains separate real-world work and its measured scopes. This sample makes a
small part of the reasoning executable without exposing internal systems.

License: MIT, as in the repository root.
