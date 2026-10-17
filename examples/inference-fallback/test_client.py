"""Exercise fallback against real loopback HTTP servers; no cloud/GPU required."""
import contextlib
import importlib.util
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import socket
import threading
import time
import unittest

spec = importlib.util.spec_from_file_location('client', Path(__file__).with_name('client.py'))
client = importlib.util.module_from_spec(spec)
if spec.loader and Path(spec.origin).exists():
    spec.loader.exec_module(client)

@contextlib.contextmanager
def provider(status=200, delay=0, empty=False, raw=None, redirect=None, disconnect=False):
    calls = []
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            payload = self.rfile.read(int(self.headers['Content-Length']))
            calls.append((self.headers.get('Authorization'), json.loads(payload)))
            time.sleep(delay)
            if disconnect:
                self.connection.shutdown(socket.SHUT_RDWR)
                self.connection.close()
                return
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            if redirect:
                self.send_header('Location', redirect)
            self.end_headers()
            try:
                self.wfile.write(raw if raw is not None else json.dumps({'choices': [{'message': {'content': '' if empty else 'demo answer'}}]}).encode())
            except (BrokenPipeError, ConnectionResetError):
                pass
        def log_message(self, *_):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}/v1/chat/completions', calls
    finally:
        server.shutdown()
        server.server_close()
        thread.join()

class FallbackTests(unittest.TestCase):
    def test_authenticated_primary_does_not_call_backup(self):
        with provider() as (url, calls), provider() as (backup, backup_calls):
            result = client.infer([(url, 'primary-key', 'demo'), (backup, 'backup-key', 'demo')], 'hello')
        self.assertEqual(result['content'], 'demo answer')
        self.assertEqual(result['provider_index'], 0)
        self.assertEqual(calls[0][0], 'Bearer primary-key')
        self.assertEqual(calls[0][1]['messages'][0]['content'], 'hello')
        self.assertEqual(backup_calls, [])

    def test_server_error_falls_back_and_reports_attempts(self):
        with provider(503) as (url, _), provider() as (backup, _):
            result = client.infer([(url, 'a', 'demo'), (backup, 'b', 'demo')], 'hello')
        self.assertEqual(result['provider_index'], 1)
        self.assertEqual([a['outcome'] for a in result['attempts']], ['unavailable', 'success'])
        self.assertNotIn('Bearer', json.dumps(result))

    def test_empty_model_answer_falls_back(self):
        with provider(empty=True) as (url, _), provider() as (backup, _):
            result = client.infer([(url, 'a', 'demo'), (backup, 'b', 'demo')], 'hello')
        self.assertEqual(result['provider_index'], 1)

    def test_auth_failure_stops_instead_of_masking_configuration_error(self):
        with provider(401) as (url, _), provider() as (backup, calls):
            with self.assertRaisesRegex(client.InferenceError, 'authentication'):
                client.infer([(url, 'bad', 'demo'), (backup, 'b', 'demo')], 'hello')
            self.assertEqual(calls, [])

    def test_slow_primary_times_out_then_backup_answers(self):
        with provider(delay=.3) as (url, _), provider() as (backup, _):
            result = client.infer([(url, 'a', 'demo'), (backup, 'b', 'demo')], 'hello', attempt_timeout=.1, budget=1)
        self.assertEqual(result['provider_index'], 1)
        self.assertEqual(result['attempts'][0]['outcome'], 'timeout')

    def test_exhaustion_is_explicit_and_does_not_echo_secret_or_prompt(self):
        with provider(503) as (url, _):
            with self.assertRaises(client.InferenceError) as raised:
                client.infer([(url, 'secret-value', 'demo')], 'private-prompt')
        self.assertNotIn('secret-value', str(raised.exception))
        self.assertNotIn('private-prompt', str(raised.exception))
        self.assertEqual(raised.exception.attempts[0]['outcome'], 'unavailable')

    def test_closed_connection_falls_back(self):
        with provider(disconnect=True) as (url, _), provider() as (backup, _):
            result = client.infer([(url, 'a', 'demo'), (backup, 'b', 'demo')], 'hello')
        self.assertEqual(result['provider_index'], 1)
        self.assertEqual(result['attempts'][0]['outcome'], 'unavailable')

    def test_redirect_does_not_forward_a_bearer_token(self):
        with provider() as (target, target_calls), provider(302, redirect=target) as (url, _):
            with self.assertRaises(client.InferenceError):
                client.infer([(url, 'secret', 'demo')], 'hello')
            self.assertEqual(target_calls, [])

    def test_invalid_json_and_oversized_response_allow_fallback(self):
        for raw in (b'not-json', b'x' * (client.MAX_RESPONSE_BYTES + 1)):
            with self.subTest(size=len(raw)):
                with provider(raw=raw) as (url, _), provider() as (backup, _):
                    result = client.infer([(url, 'a', 'demo'), (backup, 'b', 'demo')], 'hello')
                self.assertEqual(result['provider_index'], 1)

    def test_expired_admission_budget_does_not_start_backup(self):
        with provider(delay=.3) as (url, _), provider() as (backup, calls):
            with self.assertRaises(client.InferenceError):
                client.infer([(url, 'a', 'demo'), (backup, 'b', 'demo')], 'hello', attempt_timeout=1, budget=.05)
            self.assertEqual(calls, [])

    def test_rejects_remote_plaintext_and_invalid_budgets(self):
        with self.assertRaises(ValueError):
            client.infer([('http://example.com/v1/chat/completions', 'a', 'demo')], 'hello')
        with self.assertRaises(ValueError):
            client.infer([('https://example.com/v1/chat/completions', 'a', 'demo')], 'hello', budget=0)

if __name__ == '__main__':
    unittest.main()
