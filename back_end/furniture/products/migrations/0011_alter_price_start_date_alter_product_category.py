# Generated by Django 5.1.7 on 2025-03-31 08:38

import datetime
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0010_alter_price_start_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='price',
            name='start_date',
            field=models.DateTimeField(default=datetime.datetime(2025, 3, 31, 15, 38, 18, 158878)),
        ),
        migrations.AlterField(
            model_name='product',
            name='category',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='products', to='products.category'),
        ),
    ]
