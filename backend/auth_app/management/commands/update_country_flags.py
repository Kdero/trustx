from django.core.management.base import BaseCommand
from auth_app.models import PaymentCountry


class Command(BaseCommand):
    help = 'Update country flags'

    def handle(self, *args, **options):
        flags = {
            'AB': '\U0001F1FA\U0001F1F3',  # 🇺🇳 UN flag for Abkhazia
            'AR': '\U0001F1E6\U0001F1F7',  # 🇦🇷
            'AM': '\U0001F1E6\U0001F1F2',  # 🇦🇲
            'AZ': '\U0001F1E6\U0001F1FF',  # 🇦🇿
            'BY': '\U0001F1E7\U0001F1FE',  # 🇧🇾
            'CY': '\U0001F1E8\U0001F1FE',  # 🇨🇾
            'KZ': '\U0001F1F0\U0001F1FF',  # 🇰🇿
            'KG': '\U0001F1F0\U0001F1EC',  # 🇰🇬
            'PL': '\U0001F1F5\U0001F1F1',  # 🇵🇱
            'RU': '\U0001F1F7\U0001F1FA',  # 🇷🇺
            'RS': '\U0001F1F7\U0001F1F8',  # 🇷🇸
            'SK': '\U0001F1F8\U0001F1F0',  # 🇸🇰
            'TJ': '\U0001F1F9\U0001F1EF',  # 🇹🇯
            'UA': '\U0001F1FA\U0001F1E6',  # 🇺🇦
            'UZ': '\U0001F1FA\U0001F1FF',  # 🇺🇿
        }
        
        for code, flag in flags.items():
            updated = PaymentCountry.objects.filter(code=code).update(flag=flag)
            if updated:
                self.stdout.write(f'Updated {code} with flag {flag}')
            else:
                self.stdout.write(f'Country {code} not found')
        
        self.stdout.write(self.style.SUCCESS('All flags updated!'))
