# Generated by Django 5.1.7 on 2025-04-02 02:34

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_alter_order_order_date_alter_orderstatus_updated_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='order_date',
            field=models.DateTimeField(blank=True, default=datetime.datetime(2025, 4, 2, 9, 34, 15, 292546)),
        ),
        migrations.AlterField(
            model_name='orderstatus',
            name='updated_at',
            field=models.DateTimeField(blank=True, default=datetime.datetime(2025, 4, 2, 9, 34, 15, 294546)),
        ),
    ]
