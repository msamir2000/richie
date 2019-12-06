# Generated by Django 2.1.12 on 2019-09-30 20:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("courses", "0006_add_program")]

    operations = [
        migrations.AddField(
            model_name="organizationpluginmodel",
            name="variant",
            field=models.CharField(
                blank=True,
                choices=[(None, "Default")],
                help_text="Optional glimpse form factor for custom look.",
                max_length=50,
                null=True,
                verbose_name="variant",
            ),
        )
    ]