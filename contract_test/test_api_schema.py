import os
import json
import asyncio
import httpx
from typing import Literal, List, Dict

API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY") 
USER_ID = os.getenv("USER_ID")
QUERY = os.getenv("QUERY", "سلام")
DEBUG_LOG_ENABLED = os.getenv("DEBUG_LOG_ENABLED", "true").lower() == "true"
DEBUG_LOG_FILE = os.getenv("DEBUG_LOG_FILE", "debug.log")
SUMMARY_LOG_FILE = os.getenv("SUMMARY_LOG_FILE", "summary.log")

API_TIMEOUT = 30

type_mapping = {
    "str": str,
    "int": int,
    "float": float,
    "dict": Dict,
    "list": List,
    "bool": bool,
}

_valid_error_list_cache: List[Dict] = None
_error_list: List[str] = []
_warning_list: List[str] = []
_ok_list: List[str] = []


def _process_log(
    message, type: Literal["error", "warning", "ok", "debug", "file-only"] = "debug"
):
    if type == "debug" or type == "file-only":
        with open(DEBUG_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(message + "\n")
        if DEBUG_LOG_ENABLED and not type == "file-only":
            print(message)
        return
    else:
        _process_log(message)
        switcher = {"error": _error_list, "warning": _warning_list, "ok": _ok_list}
        switcher.get(type).append(message)


async def _make_request(payload, api_key=API_KEY, test_name="Unknown Test"):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            return await client.post(API_URL, headers=headers, json=payload)
    except httpx.RequestError as e:
        _process_log(f"[ERROR]: ({test_name}) Request failed - {str(e)}", "error")
        return None


def _get_error_list() -> List[Dict]:
    global _valid_error_list_cache
    if _valid_error_list_cache is None:
        try:
            with open("resources/error_list.json", "r", encoding="utf-8") as f:
                _valid_error_list_cache = json.load(f)
        except FileNotFoundError:
            _process_log("[ERROR]: error_list.json not found in resources/")
            raise
        except json.JSONDecodeError as e:
            _process_log(f"[ERROR]: Invalid JSON in error_list.json - {e}")
            raise
    return _valid_error_list_cache


def _validate_response(response: httpx.Response, test_name):
    try:
        _process_log(f"Received response: [{response}]", "file-only")
        data = response.json()
        _process_log(f"Response data in json: [{data}]", "file-only")
    except json.JSONDecodeError:
        _process_log(
            f"[ERROR]: ({test_name}) Could not decode error response JSON", "error"
        )
        return None
    if not isinstance(data, Dict):
        _process_log(f"[ERROR]: ({test_name}) Response JSON must be an object", "error")
        return None
    if response.status_code != 200:
        errors = _get_error_list()
        is_known_error = any(
            e["status"] == data.get("status") and e["code"] == data.get("code")
            for e in errors
        )
        if not is_known_error:
            _process_log(
                (
                    f"[WARNING]: ({test_name}) Error with status=[{data.get('status')}], "
                    f"code=[{data.get('code')}] not found in error list."
                ),
                "warning",
            )
    return data


def _get_required_fields(is_blocking_response: bool, is_error_response: bool) -> List:
    with open("resources/required_fields.json", "r", encoding="utf-8") as f:
        required_fields = json.load(f)
    if is_blocking_response:
        return required_fields["blocking"]["error" if is_error_response else "success"]
    return required_fields["streaming"]


def _validate_fields(
    data: Dict, required_fields: List, test_name: str, parent: str = ""
):
    for field in required_fields:
        field_name = field["name"]
        field_type = field["type"]
        full_path = f"{parent}/{field_name}" if parent else field_name

        if field_name not in data or data[field_name] is None:
            _process_log(
                f"[ERROR]: ({test_name}) Missing field [{full_path}] in response",
                "error",
            )
            continue

        value = data[field_name]
        expected_type = type_mapping.get(field_type)
        if not expected_type:
            _process_log(
                f"[ERROR]: ({test_name}) Unknown expected type [{field_type}] for field [{full_path}]",
                "error",
            )
            continue

        if not isinstance(value, expected_type):
            _process_log(
                (
                    f"[ERROR]: ({test_name}) Expected type [{field_type}] for field [{full_path}] "
                    f"but got [{type(value).__name__}]"
                ),
                "error",
            )
            continue

        if field_type == "dict" and "required_fields" in field:
            _validate_fields(
                value, field["required_fields"], test_name, parent=full_path
            )

        if (
            field_type == "list"
            and "required_fields" in field
            and field.get("sub_type") == "dict"
        ):
            for element in value:
                if not isinstance(element, Dict):
                    _process_log(
                        (
                            f"[ERROR]: ({test_name}) Expected type [dict] for field [{full_path}] elements "
                            f"but got [{type(element).__name__}]"
                        ),
                        "error",
                    )
                    continue
                _validate_fields(
                    element, field["required_fields"], test_name, parent=full_path
                )

        _process_log(
            (f"[OK]: ({test_name}) Field [{full_path}] validated successfully."),
        )


def _validate_response_fields(
    response_data: Dict,
    is_blocking_response: bool,
    is_error_response: bool,
    test_name: str,
):
    required_fields = _get_required_fields(is_blocking_response, is_error_response)
    _validate_fields(response_data, required_fields, test_name)


async def test_blocking_response_mode():
    _process_log("\nTesting blocking response mode request...")
    payload = {
        "query": QUERY,
        "inputs": {},
        "user": USER_ID,
        "response_mode": "blocking",
    }
    response = await _make_request(payload, test_name="test_blocking_response_mode")
    _process_log(f"Validating [test_blocking_response_mode] response...")
    response_data = _validate_response(response, "test_blocking_response_mode")
    if response_data:
        if response.status_code != 200:
            _process_log(
                (
                    "[WARNING]: (test_blocking_response_mode) responded with error "
                    "and evaluation was performed on the error response "
                    "(PLEASE FIX IT)"
                ),
                "warning",
            )
        _validate_response_fields(
            response_data,
            True,
            response.status_code != 200,
            "test_blocking_response_mode",
        )
        if not any(
            test for test in _error_list if "test_blocking_response_mode" in test
        ):
            _process_log("[OK]: test_blocking_response_mode PASSED ✅", "ok")
        else:
            _process_log("[ERROR]: test_blocking_response_mode FAILED ❌", "error")
    else:
        _process_log("[ERROR]: test_blocking_response_mode FAILED ❌", "error")


async def test_invalid_api_key():
    _process_log("\nTesting invalid API_KEY request...")
    payload = {"query": QUERY, "inputs": {}, "user": USER_ID}
    response = await _make_request(
        payload, api_key="INVALID_API_KEY", test_name="test_invalid_api_key"
    )
    _process_log(f"Validating [invalid_api_key] response...")
    response_data = _validate_response(response, "test_invalid_api_key")
    if response_data:
        _validate_response_fields(response_data, True, True, "test_invalid_api_key")
        if response.status_code != 401 or response_data.get("code") != "unauthorized":
            _process_log(
                "[ERROR]: (test_invalid_api_key) Invalid response for invalid API key",
                "error",
            )
        if not any(test for test in _error_list if "test_invalid_api_key" in test):
            _process_log("[OK]: test_invalid_api_key PASSED ✅", "ok")
        else:
            _process_log("[ERROR]: test_invalid_api_key FAILED ❌", "error")
    else:
        _process_log("[ERROR]: test_invalid_api_key FAILED ❌", "error")


async def test_invalid_user_id():
    _process_log("\nTesting invalid USER_ID request...")
    payload = {"query": QUERY, "inputs": {}, "user": "INVALID_USER"}
    response = await _make_request(payload, test_name="test_invalid_user_id")
    _process_log(f"Validating [test_invalid_user_id] response...")
    response_data = _validate_response(response, "test_invalid_user_id")
    if response_data:
        _validate_response_fields(response_data, True, True, "test_invalid_user_id")
        if response.status_code != 401 or response_data.get("code") != "unauthorized":
            _process_log(
                "[ERROR]: (test_invalid_user_id) Invalid response for invalid user ID",
                "error",
            )
        if not any(test for test in _error_list if "test_invalid_user_id" in test):
            _process_log("[OK]: test_invalid_user_id PASSED ✅", "ok")
        else:
            _process_log("[ERROR]: test_invalid_user_id FAILED ❌", "error")
    else:
        _process_log("[ERROR]: test_invalid_user_id FAILED ❌", "error")


async def _missing_field_test(test_name, payload):
    _process_log(f"\nTesting {test_name} in request...")
    response = await _make_request(payload, test_name=test_name)
    _process_log(f"Validating [{test_name}] response...")
    response_data = _validate_response(response, test_name)
    if response_data:
        _validate_response_fields(response_data, True, True, test_name)
        if response.status_code != 400 or response_data.get("code") != "invalid_param":
            _process_log(
                f"[ERROR]: ({test_name}) Invalid response for missing field", "error"
            )
        if not any(test for test in _error_list if test_name in test):
            _process_log(f"[OK]: {test_name} PASSED ✅", "ok")
        else:
            _process_log(f"[ERROR]: {test_name} FAILED ❌", "error")
    else:
        _process_log(f"[ERROR]: {test_name} FAILED ❌", "error")


async def test_missing_user_id():
    await _missing_field_test("test_missing_user_id", {"query": QUERY, "inputs": {}})


async def test_missing_inputs():
    await _missing_field_test("test_missing_inputs", {"query": QUERY, "user": USER_ID})


async def test_missing_query():
    await _missing_field_test("test_missing_query", {"inputs": {}, "user": USER_ID})


async def _make_stream_request(payload, test_name, api_key=API_KEY):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST", API_URL, headers=headers, json=payload
            ) as response:
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data: "):
                        try:
                            yield json.loads(line[len("data: ") :])
                        except json.JSONDecodeError:
                            _process_log(
                                f"[ERROR]: ({test_name}) Could not parse line: {line}",
                                "error",
                            )
    except httpx.RequestError as e:
        _process_log(
            f"[ERROR]: ({test_name}) Streaming request failed - {str(e)}", "error"
        )


def _validate_event_fields(event: Dict, required_fields, test_name):
    event_type = event.get("event")
    if event_type not in ["message", "message_end", "error"]:
        _process_log(
            f"[WARNING]: ({test_name}) Unknown event type [{event_type}]", "warning"
        )
    else:
        _validate_fields(event, required_fields.get(event_type), test_name)


async def test_streaming_response_mode():
    _process_log("\nTesting streaming response mode request...")
    payload = {
        "query": QUERY,
        "inputs": {},
        "user": USER_ID,
        "response_mode": "streaming",
    }
    _process_log(f"Validating [streaming_response_mode] response...")
    event_count = 0
    required_fields = _get_required_fields(False, None)
    async for event in _make_stream_request(payload, "test_streaming_response_mode"):
        _process_log(f"Received event: [{event['event']}]", "file-only")
        event_count += 1
        _validate_event_fields(event, required_fields, "test_streaming_response_mode")
    if event_count == 0:
        _process_log(
            "[ERROR]: (test_streaming_response_mode) Streaming mode produced no events",
            "error",
        )
    if not any(test for test in _error_list if "test_streaming_response_mode" in test):
        _process_log("[OK]: test_streaming_response_mode PASSED ✅", "ok")
    else:
        _process_log("[ERROR]: test_streaming_response_mode FAILED ❌", "error")


async def test_missing_conversation_id():
    _process_log("\nTesting missing conversation id request...")
    payload = {
        "query": QUERY,
        "inputs": {},
        "user": USER_ID,
        "response_mode": "blocking",
    }
    response = await _make_request(payload, test_name="test_missing_conversation_id")
    _process_log(f"Validating [test_missing_conversation_id] response...")
    response_data = _validate_response(response, "test_missing_conversation_id")
    if response_data:
        _validate_response_fields(
            response_data, True, False, "test_missing_conversation_id"
        )
        if "conversation_id" not in response_data:
            _process_log(
                "[ERROR]: (test_missing_conversation_id) conversation_id not present in response",
                "error",
            )
        if not any(
            test for test in _error_list if "test_missing_conversation_id" in test
        ):
            _process_log("[OK]: test_missing_conversation_id PASSED ✅", "ok")
        else:
            _process_log("[ERROR]: test_missing_conversation_id FAILED ❌", "error")
    else:
        _process_log("[ERROR]: test_missing_conversation_id FAILED ❌", "error")


async def main():
    await test_blocking_response_mode()
    _process_log("======================================================")
    await test_invalid_api_key()
    _process_log("======================================================")
    await test_invalid_user_id()
    _process_log("======================================================")
    await test_missing_user_id()
    _process_log("======================================================")
    await test_missing_inputs()
    _process_log("======================================================")
    await test_missing_query()
    _process_log("======================================================")
    await test_streaming_response_mode()
    _process_log("======================================================")
    await test_missing_conversation_id()
    _process_log("======================================================")


if __name__ == "__main__":
    asyncio.run(main())
    summary = (
        "\n==== SUMMARY ====\n"
        "✅ PASSED TESTS:\n" + ("\n".join(_ok_list) or "No passed test found.") + "\n\n"
        "❌ ERRORS:\n" + ("\n".join(_error_list) or "No error found.") + "\n\n"
        "⚠ WARNINGS (FYI):\n" + ("\n".join(_warning_list) or "No warning found.")
    )
    with open(SUMMARY_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(summary + "\n")
    print(summary)
