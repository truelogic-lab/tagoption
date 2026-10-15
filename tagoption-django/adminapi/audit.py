from ops.models import AdminAudit


def record(actor, action, *, target_type="", target_id="", reason="", metadata=None):
    """
    Write an audit row. Never raise from here — a failed audit must not fail
    the action it's recording, but it must be visible in logs.
    """
    try:
        AdminAudit.objects.create(
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            actor_email=(getattr(actor, "email", "") or "") if actor else "",
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else "",
            reason=reason or "",
            metadata=metadata or {},
        )
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("audit write failed: %s", exc)
