from django.db import models
from datetime import datetime

class Category(models.Model):
    name = models.CharField(max_length=100, blank=False, null=False, unique=True)

    def __str__(self):
        return self.name


class Material(models.Model):
    name = models.CharField(max_length=100, blank=False, null=False, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255, blank=False, null=False)
    description = models.TextField(null=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, null=False, related_name="products")
    materials = models.ManyToManyField(Material, blank=True)
    status = models.BooleanField(default=True, null=False, blank=False)

    def __str__(self):
        return self.name


class Batch(models.Model):
    batch_number = models.CharField(max_length=100, blank=False, null=False, unique=False)
    origin = models.CharField(max_length=100, blank=False, null=False)
    item_quantity = models.IntegerField(blank=False, null=False)
    imported_at = models.DateField(blank=False, null=False, default=datetime.now())

    def __str__(self):
        return self.batch_number


# Phân loại sản phẩm (màu sắc, chất liệu,...)
class Variant(models.Model):

    name = models.CharField(max_length=255, blank=False, null=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=False)

    def __str__(self):
        return self.name
    


class ItemDimension(models.Model):
    
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, null=False)
    name = models.CharField(max_length=255, blank=False, null=False)
    length = models.FloatField(null=False, blank=False)
    width = models.FloatField(null=False, blank=False)
    height = models.FloatField(null=False, blank=False)
    weights = models.FloatField(null=False, blank=False)
    quantity = models.IntegerField(null=False, blank=False)
    

class BatchVariant(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=False)
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, null=False)
    stock = models.IntegerField(blank=False, null=False)


class Image(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=False)
    image_file = models.ImageField(upload_to='products', max_length=255)

    def __str__(self):
        return self.name


class Price(models.Model):

    price = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)
    start_date = models.DateTimeField(blank=False, null=False, default=datetime.now())
    end_date = models.DateTimeField(blank=True, null=True)
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, null=False)

    def __str__(self):
        return super().__str__()