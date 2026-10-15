import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


def new_id(prefix="u"):
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def new_user_id():
    return new_id("u")


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", "admin")
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.CharField(primary_key=True, max_length=32, default=new_user_id, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=80, blank=True)
    role = models.CharField(max_length=16, default="user")
    verified = models.BooleanField(default=False)
    banned = models.BooleanField(default=False)
    win_rate_override = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


from .notifications import Notification  # noqa: E402
