from accounts.models import new_id
from wallet.models import Transaction


def push_notification(user, type_, title, body, reference=None):
    """
    Notifications reuse the wallet Transaction table with a special type
    so the client can list them separately once we build that endpoint.
    """
    try:
        Transaction.objects.create(
            id=new_id("n"),
            user=user,
            type="notification",
            amount_cents=0,
            method=type_,
            reference=reference,
            status="unread",
        )
    except Exception:
        pass
