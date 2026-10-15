"""
camelCase response middleware.

The Fastify backend emits camelCase JSON, and the React client reads those
field names directly. Django and DRF naturally produce snake_case. Rather
than alias every field in every serializer, this middleware converts response
keys from snake_case to camelCase on the way out.

Only applies to JSON responses with dict or list-of-dict bodies. Strings,
numbers, and lists of primitives pass through untouched.
"""
import re

_SNAKE = re.compile(r"_([a-z0-9])")


def _to_camel(key: str) -> str:
    if "_" not in key:
        return key
    head, *rest = key.split("_", 1)
    return head + _SNAKE.sub(lambda m: m.group(1).upper(), "_" + rest[0]) if rest else key


def _walk(value):
    if isinstance(value, dict):
        return {_to_camel(k): _walk(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_walk(v) for v in value]
    return value


class CamelCaseMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if getattr(response, "status_code", 0) >= 400:
            return response
        content_type = response.get("Content-Type", "")
        if "application/json" not in content_type:
            return response
        if not hasattr(response, "data"):
            # Raw Django JsonResponse — decode, walk, re-encode.
            if not response.content:
                return response
            import json
            try:
                body = json.loads(response.content.decode(response.charset or "utf-8"))
            except (ValueError, UnicodeDecodeError):
                return response
            body = _walk(body)
            response.content = json.dumps(body).encode("utf-8")
            return response
        response.data = _walk(response.data)
        return response
