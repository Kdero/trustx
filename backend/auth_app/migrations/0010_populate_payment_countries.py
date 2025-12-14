# Generated migration to populate PaymentCountry data

from django.db import migrations


def populate_countries(apps, schema_editor):
    PaymentCountry = apps.get_model('auth_app', 'PaymentCountry')
    
    countries = [
        {'name': 'Абхазия', 'code': 'AB', 'flag': '🇺🇳', 'is_active': True},
        {'name': 'Аргентина', 'code': 'AR', 'flag': '🇦🇷', 'is_active': True},
        {'name': 'Армения', 'code': 'AM', 'flag': '🇦🇲', 'is_active': True},
        {'name': 'Азербайджан', 'code': 'AZ', 'flag': '🇦🇿', 'is_active': True},
        {'name': 'Беларусь', 'code': 'BY', 'flag': '🇧🇾', 'is_active': True},
        {'name': 'Кипр', 'code': 'CY', 'flag': '🇨🇾', 'is_active': True},
        {'name': 'Казахстан', 'code': 'KZ', 'flag': '🇰🇿', 'is_active': True},
        {'name': 'Киргизия', 'code': 'KG', 'flag': '🇰🇬', 'is_active': True},
        {'name': 'Польша', 'code': 'PL', 'flag': '🇵🇱', 'is_active': True},
        {'name': 'Россия', 'code': 'RU', 'flag': '🇷🇺', 'is_active': True},
        {'name': 'Сербия', 'code': 'RS', 'flag': '🇷🇸', 'is_active': True},
        {'name': 'Словакия', 'code': 'SK', 'flag': '🇸🇰', 'is_active': True},
        {'name': 'Таджикистан', 'code': 'TJ', 'flag': '🇹🇯', 'is_active': True},
        {'name': 'Украина', 'code': 'UA', 'flag': '🇺🇦', 'is_active': True},
        {'name': 'Узбекистан', 'code': 'UZ', 'flag': '🇺🇿', 'is_active': True},
    ]
    
    for country_data in countries:
        PaymentCountry.objects.get_or_create(
            code=country_data['code'],
            defaults=country_data
        )


def reverse_populate(apps, schema_editor):
    PaymentCountry = apps.get_model('auth_app', 'PaymentCountry')
    PaymentCountry.objects.filter(code__in=[
        'AB', 'AR', 'AM', 'AZ', 'BY', 'CY', 'KZ', 'KG', 'PL', 'RU', 'RS', 'SK', 'TJ', 'UA', 'UZ'
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('auth_app', '0009_userprofile_telegram_alter_balancehistory_id_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_countries, reverse_populate),
    ]
