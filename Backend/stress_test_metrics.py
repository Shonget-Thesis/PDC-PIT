"""Run a small WebSocket stress benchmark against the backend.

The script measures:
- match response time for a batch of concurrent clients
- match throughput in matches per minute
- skip/disconnect response time for a paired client

Results are printed to stdout and written to a JSON file for later review.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import websockets


DEFAULT_BACKEND_URL = "ws://localhost:8000/ws"
DEFAULT_OUTPUT_FILE = Path(__file__).with_name("stress_test_results.json")


@dataclass
class MatchMetrics:
    client_count: int
    total_duration_seconds: float
    matches_per_minute: float
    average_response_ms: float
    median_response_ms: float
    p95_response_ms: float
    min_response_ms: float
    max_response_ms: float


@dataclass
class SkipMetrics:
    response_ms: float


async def wait_for_message(websocket: Any, message_type: str, timeout: float = 10.0) -> dict:
    deadline = time.perf_counter() + timeout

    while True:
        remaining = deadline - time.perf_counter()
        if remaining <= 0:
            raise TimeoutError(f"Timed out waiting for {message_type}")

        raw_message = await asyncio.wait_for(websocket.recv(), timeout=remaining)
        message = json.loads(raw_message)
        if message.get("type") == message_type:
            return message


async def connect_client(backend_url: str, user_id: str):
    websocket = await websockets.connect(f"{backend_url}/{user_id}")
    await wait_for_message(websocket, "connected")
    return websocket


async def measure_match_metrics(backend_url: str, client_count: int) -> MatchMetrics:
    if client_count < 2 or client_count % 2 != 0:
        raise ValueError("client_count must be an even number of at least 2")

    clients = []
    try:
        for index in range(client_count):
            clients.append(await connect_client(backend_url, f"match_{index}_{time.time_ns()}"))

        await asyncio.gather(
            *[
                websocket.send(
                    json.dumps(
                        {
                            "type": "find_match",
                            "interests": ["stress-test"],
                            "gender_pref": "any",
                            "user_gender": "",
                        }
                    )
                )
                for websocket in clients
            ]
        )

        start_time = time.perf_counter()
        response_times_ms = await asyncio.gather(
            *[
                _measure_single_match_latency(websocket, start_time)
                for websocket in clients
            ]
        )

        total_duration_seconds = time.perf_counter() - start_time
        matches_per_minute = len(response_times_ms) / total_duration_seconds * 60

        sorted_responses = sorted(response_times_ms)
        p95_index = max(0, int(round(0.95 * (len(sorted_responses) - 1))))

        return MatchMetrics(
            client_count=client_count,
            total_duration_seconds=total_duration_seconds,
            matches_per_minute=matches_per_minute,
            average_response_ms=statistics.fmean(response_times_ms),
            median_response_ms=statistics.median(response_times_ms),
            p95_response_ms=sorted_responses[p95_index],
            min_response_ms=min(response_times_ms),
            max_response_ms=max(response_times_ms),
        )
    finally:
        await asyncio.gather(*[websocket.close() for websocket in clients], return_exceptions=True)


async def _measure_single_match_latency(websocket: Any, start_time: float) -> float:
    await wait_for_message(websocket, "match_found")
    return (time.perf_counter() - start_time) * 1000


async def measure_skip_metrics(backend_url: str) -> SkipMetrics:
    clients = []
    try:
        clients.append(await connect_client(backend_url, f"skip_a_{time.time_ns()}"))
        clients.append(await connect_client(backend_url, f"skip_b_{time.time_ns()}"))

        for websocket in clients:
            await websocket.send(
                json.dumps(
                    {
                        "type": "find_match",
                        "interests": ["stress-test"],
                        "gender_pref": "any",
                        "user_gender": "",
                    }
                )
            )

        await wait_for_message(clients[0], "match_found")
        await wait_for_message(clients[1], "match_found")

        start_time = time.perf_counter()
        await clients[0].send(
            json.dumps(
                {
                    "type": "skip",
                    "interests": ["stress-test"],
                    "gender_pref": "any",
                    "user_gender": "",
                }
            )
        )

        await wait_for_message(clients[1], "partner_disconnected")
        response_ms = (time.perf_counter() - start_time) * 1000
        return SkipMetrics(response_ms=response_ms)
    finally:
        await asyncio.gather(*[websocket.close() for websocket in clients], return_exceptions=True)


def format_report(match_metrics: MatchMetrics, skip_metrics: SkipMetrics, backend_url: str, client_count: int) -> dict:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "backend_url": backend_url,
        "client_count": client_count,
        "match_metrics": asdict(match_metrics),
        "skip_metrics": asdict(skip_metrics),
    }


def print_report(report: dict) -> None:
    match_metrics = report["match_metrics"]
    skip_metrics = report["skip_metrics"]

    print("Stress test results")
    print(f"Generated at: {report['generated_at']}")
    print(f"Backend URL: {report['backend_url']}")
    print(f"Clients: {report['client_count']}")
    print()
    print("Match metrics")
    print(f"  Average response time: {match_metrics['average_response_ms']:.2f} ms")
    print(f"  Median response time:  {match_metrics['median_response_ms']:.2f} ms")
    print(f"  p95 response time:     {match_metrics['p95_response_ms']:.2f} ms")
    print(f"  Min / Max:             {match_metrics['min_response_ms']:.2f} / {match_metrics['max_response_ms']:.2f} ms")
    print(f"  Throughput:            {match_metrics['matches_per_minute']:.2f} matches/min")
    print()
    print("Skip metrics")
    print(f"  Partner disconnect latency: {skip_metrics['response_ms']:.2f} ms")


async def main() -> int:
    parser = argparse.ArgumentParser(description="Run a small WebSocket stress benchmark.")
    parser.add_argument("--backend-url", default=DEFAULT_BACKEND_URL, help="Backend WebSocket base URL")
    parser.add_argument("--clients", type=int, default=10, help="Number of clients to use for the match benchmark")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_FILE, help="Where to save the JSON results")
    args = parser.parse_args()

    match_metrics = await measure_match_metrics(args.backend_url, args.clients)
    skip_metrics = await measure_skip_metrics(args.backend_url)
    report = format_report(match_metrics, skip_metrics, args.backend_url, args.clients)

    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print_report(report)
    print(f"\nSaved results to: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))