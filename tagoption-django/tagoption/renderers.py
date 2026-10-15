"""
camelCase JSON renderer.

The React client reads camelCase field names because Fastify emits them.
Django serializers produce snake_case. Rather than alias every field, this
renderer converts keys on the way out — after DRF serialization, before the
bytes hit the wire.

Only used by DRF views. Plain Django JsonResponse (like /health) is unaffected.
"""
import re

from rest_framework.renderers import JSONRenderer

_SNAKE = re.compile(r"_([a-z0-9])")


def _camel(key):
    if "_" not in key:
        return key
    return _SNAKE.sub(lambda m: m.group(1).upper(), key)


def _walk(value):
    if isinstance(value, dict):
        return {_camel(k): _walk(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_walk(v) for v in value]
    return value


class CamelCaseJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context is not None:
            response = renderer_context.get("response")
            # Leave error envelopes alone — the client matches them by their
            # existing shape and they aren't part of the camelCase contract.
            if response is not None and getattr(response, "status_code", 200) < 400:
                data = _walk(data)
        return super().render(data, accepted_media_type, renderer_context)
