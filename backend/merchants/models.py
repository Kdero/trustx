from django.db import models
import uuid
import secrets


def generate_api_key():
    return secrets.token_hex(16)


class Merchant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    api_key = models.CharField(max_length=64, unique=True, default=generate_api_key)
    webhook_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
