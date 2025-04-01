from django.db import models

class Cart(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, null=False)
    total_items = models.IntegerField(null=True, blank=True)

    @classmethod
    def get_user_cart(cls, user):
        cart, created = cls.objects.get_or_create(user=user)
        return cart.id

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, null=False)
    variant = models.ForeignKey('products.Variant', on_delete=models.CASCADE, null=False)
    quantity = models.PositiveIntegerField(default=1, null=False, blank=False)