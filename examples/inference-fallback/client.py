"""Educational, dependency-free OpenAI-compatible inference fallback client.

No model is bundled. Providers are fixed by the operator, never supplied by a
remote caller. See README.md for scope, security boundaries and local tests.
"""
import argparse
from http.client import HTTPException
import json
import math
import os
import socket
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_RESPONSE_BYTES = 1024 * 1024


class InferenceError(Exception):
    """A sanitized failure with attempt metadata, never keys/prompts/responses."""
    def __init__(self, message, attempts):
        super().__init__(message)
        self.attempts = list(attempts)


class NoRedirect(HTTPRedirectHandler):
    """Do not forward authorization to a redirect destination."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def infer(providers, prompt, *, attempt_timeout=2.0, budget=5.0):
    """Try providers in order; return content and bounded, low-cardinality metadata.

    providers: sequence of (endpoint_url, bearer_token, model_name).
    Each network operation uses the smaller of attempt_timeout and remaining
    budget. This is an admission budget with socket timeouts, not a hard wall-
    clock deadline: OS DNS and a peer trickling bytes can exceed it.
    """
    if not providers or not isinstance(prompt, str) or not prompt.strip():
        raise ValueError('providers and a non-empty prompt are required')
    if not all(math.isfinite(v) and v > 0 for v in (attempt_timeout, budget)):
        raise ValueError('timeouts and budget must be positive finite numbers')
    for url, token, model in providers:
        parsed = urlsplit(url)
        local = parsed.hostname in ('localhost', '127.0.0.1', '::1')
        if (parsed.scheme != 'https' and not (parsed.scheme == 'http' and local)) or not parsed.hostname:
            raise ValueError('use HTTPS, or HTTP for explicit loopback endpoints only')
        if parsed.username or parsed.password or parsed.fragment or not token or not model:
            raise ValueError('provide a model and token; URL credentials and fragments are unsupported')
    deadline = time.monotonic() + budget
    attempts = []
    opener = build_opener(NoRedirect())
    for index, (url, token, model) in enumerate(providers):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            break
        started = time.monotonic()
        payload = json.dumps({'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'stream': False}).encode()
        request = Request(url, data=payload, headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
        outcome = 'unavailable'
        fatal = None
        content = None
        try:
            with opener.open(request, timeout=min(attempt_timeout, remaining)) as response:
                raw = response.read(MAX_RESPONSE_BYTES + 1)
                if len(raw) > MAX_RESPONSE_BYTES:
                    outcome = 'oversized_response'
                else:
                    try:
                        answer = json.loads(raw)
                        content = answer['choices'][0]['message']['content']
                        if not isinstance(content, str) or not content.strip():
                            content = None
                            outcome = 'empty_answer'
                        else:
                            outcome = 'success'
                    except (ValueError, KeyError, IndexError, TypeError):
                        outcome = 'invalid_response'
        except HTTPError as error:
            if error.code in (401, 403):
                outcome = 'authentication_error'
                fatal = 'provider authentication failed'
            elif error.code == 429 or error.code >= 500:
                outcome = 'unavailable'
            else:
                outcome = 'request_error'
                fatal = 'provider rejected the request'
            error.close()
        except (TimeoutError, socket.timeout):
            outcome = 'timeout'
        except URLError as error:
            outcome = 'timeout' if isinstance(error.reason, (TimeoutError, socket.timeout)) else 'unavailable'
        except (OSError, HTTPException):
            outcome = 'unavailable'
        attempts.append({'provider_index': index, 'outcome': outcome, 'elapsed_ms': round((time.monotonic() - started) * 1000, 2)})
        if fatal:
            raise InferenceError(fatal, attempts)
        if content is not None:
            return {'content': content, 'provider_index': index, 'attempts': attempts}
    raise InferenceError('no provider returned a usable answer within the attempt budget', attempts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prompt', required=True)
    parser.add_argument('--timeout', type=float, default=2.0)
    parser.add_argument('--budget', type=float, default=5.0)
    args = parser.parse_args()
    try:
        endpoints = json.loads(os.environ.get('INFERENCE_PROVIDERS', '[]'))
        providers = [(p['url'], os.environ[p['token_env']], p['model']) for p in endpoints]
        result = infer(providers, args.prompt, attempt_timeout=args.timeout, budget=args.budget)
        # The answer goes to stdout; operational metadata alone goes to stderr.
        print(result['content'])
        print(json.dumps({'attempts': result['attempts']}), file=sys.stderr)
    except InferenceError as error:
        print(json.dumps({'error': str(error), 'attempts': error.attempts}), file=sys.stderr)
        return 1
    except (ValueError, KeyError, TypeError, OSError):
        print('invalid provider configuration or arguments', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
