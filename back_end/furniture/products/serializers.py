from rest_framework import serializers
from django.utils.timezone import make_aware, now
from django.core.exceptions import ValidationError
from django.db.models.functions import Lower
from django.db import transaction, models
from datetime import datetime, date
import os
from django.conf import settings
import uuid
from .models import Category, Batch, Product, Variant
from .models import BatchVariant, Image, Material, Price, ItemDimension


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'    

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Category name is required.")
    
        if Category.objects.filter(name__iexact=value).exists():        
            raise serializers.ValidationError("Category with the same name already exists.")
        return value


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Material name is required.")
        if Material.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Material with the same name already exists.")
        return value


class ImageSerializer(serializers.ModelSerializer):

    image_file = serializers.ImageField(use_url=True)

    class Meta:
        model = Image
        fields = '__all__'

    def validate_image_file(self, value):
        image_file = value

        file_extension = os.path.splitext(image_file.name)[1]
        image_file.name = f"{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:4]}{file_extension}"

        if not image_file:
            raise serializers.ValidationError("Image file is required.")

        if len(os.path.join(settings.MEDIA_ROOT, f"products/{image_file.name}")) > 100:
            raise serializers.ValidationError("Image file size is too large.")
        
        print('Image file: ', len(os.path.join(settings.MEDIA_ROOT, f"products/{image_file.name}")), ' - ', os.path.join(settings.MEDIA_ROOT, f"products/{image_file.name}"))

        return image_file
        

    def update(self, instance, validated_data):

        new_image = validated_data.get('image_file', instance.image_file)

        old_image = instance.image_file
        
        with transaction.atomic():
            try:
                # Cập nhật ảnh mới vào sản phẩm
                instance.image_file = new_image
                instance.product = validated_data.get('product', instance.product)
                instance.save()

                # Xóa toàn bộ ảnh cũ (trong DB và thư mục media)
                if old_image:
                    old_image.delete(save=False)

            except Exception:
                print('Error updating image file: ', old_image)
                raise serializers.ValidationError("An error occurred while updating the image file.")

        return instance


class ProductSerializer(serializers.ModelSerializer):

    category = CategorySerializer(read_only=True)
    materials = MaterialSerializer(read_only=True, many=True)

    material_ids = serializers.PrimaryKeyRelatedField(queryset=Material.objects.all(), many=True, source='materials', write_only=True, required=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=True)

    description = models.TextField(default=None)

    class Meta:
        model = Product
        fields = ['id', 'name',
                  'category', 'description', 'status', 'materials',
                  'category_id', 'material_ids']
    

    def validate_name(self, value):

        if not value:
            raise serializers.ValidationError("Product name cannot be empty.")

        # Kiểm tra hành động
        request = self.context.get('request')

        # Nếu là 'POST' cần kiểm tra sự tồn tại của name
        if request and request.method == 'POST':
            if Product.objects.filter(name=value).exists():
                raise serializers.ValidationError("Product with the same name already exists.")
        
        return value
    
    def validate_material_ids(self, value):

        if value == []:
            raise serializers.ValidationError("Product must have at least one ingredient.")
        
        return value

    def create(self, validated_data):

        print("Validated data: ", validated_data)

        category = validated_data.get('category')
        status = validated_data.get('status', True)
        description = validated_data.get('description', None)

        try:
            with transaction.atomic():

                try:
                    product = Product.objects.create(
                        name = validated_data.get('name'),
                        category = category,
                        description = description,
                        status = status
                    )
                except Exception as error:
                    raise serializers.ValidationError("An error occurred while creating the product." + str(error))

                if 'materials' in validated_data:
                    try:
                        materials = validated_data.get('materials')
                        product.materials.set(materials)                                   
                    except Exception as error:
                        raise serializers.ValidationError("An error occurred while creating the ingredients." + str(error))

            return product
        
        except Exception as error:
            raise serializers.ValidationError("An error occurred while creating the product." + str(error))

    
    def update(self, instance, validated_data):

        print("Validated data: ", validated_data)

        try:
            with transaction.atomic():
                instance.name = validated_data.get('name', instance.name)     
                instance.description = validated_data.get('description', instance.description)
                instance.category = validated_data.get('category', instance.category)
                instance.status = validated_data.get('status', instance.status)

                try:
                    if 'materials' in validated_data:
                        materials = validated_data.get('materials')
                        instance.materials.set(materials)

                    instance.save()
                except Exception as e:
                    raise serializers.ValidationError("Lỗi cập nhật từ server." + str(e))

            return instance
            
        except Exception as error:
            raise serializers.ValidationError("Lỗi cập nhật từ server." + error)
            
        



class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'

    def validate_batch_number(self, value):

        if not value:
            raise serializers.ValidationError("Batch number is required.")

        if self.instance:
            if self.instance.batch_number == value:
                return value

        if Batch.objects.filter(batch_number=value).exists():
            print("Batch instance:", self.instance)
            raise serializers.ValidationError("Batch with the same batch number already exists.")
        
        return value
    
    def validate_origin(self, value):

        if not value:
            raise serializers.ValidationError("Origin is required.")
        
        return value
    
    def validate_item_quantity(self, value):

        if not value:
            raise serializers.ValidationError("Item quantity is required.")

        if value < 1:
            print("Item quantity must be a positive integer.")
            raise serializers.ValidationError("Item quantity must be a positive integer.")

        return value

    def validate_imported_at(self, value):
        if value is None:
            raise serializers.ValidationError("Import date is required.")
        
        if value > date.today():
            print("Import date must be a date in the past.")
            raise serializers.ValidationError("Import date must be a date in the past.")

        return value
    

class VariantSerializer(serializers.ModelSerializer):
    
    product = serializers.SerializerMethodField(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True, required=True)

    class Meta:
        model = Variant
        fields = [
            'id', 'name', 'product',
            'product_id',
        ]
    
    def validate_name(self, value):

        if not value:
            raise serializers.ValidationError("Variant name is required.")
        
        return value

    def get_product(self, obj):
        return {
            'id': obj.product.id,
            'name': obj.product.name
        }    


class ItemDimensionSerializer(serializers.ModelSerializer):

    variant = serializers.PrimaryKeyRelatedField(queryset=Variant.objects.all(), write_only=True, required=True)

    class Meta:
        model = ItemDimension
        fields = '__all__'

    def validate_width(self, value):
        if not value:
            raise serializers.ValidationError("Width is required.")
        
        if value < 0:
            raise serializers.ValidationError("Width must be a non-negative number.")
        
        return value
    
    def validate_height(self, value):
        if not value:
            raise serializers.ValidationError("Height is required.")
        
        if value < 0:
            raise serializers.ValidationError("Height must be a non-negative number.")
        
        return value
    
    def validate_length(self, value):
        if not value:
            raise serializers.ValidationError("Length is required.")
        
        if value < 0:
            raise serializers.ValidationError("Length must be a non-negative number.")
        
        return value
    
    def validate_weights(self, value):
        if not value:
            raise serializers.ValidationError("Weight is required.")
        
        if value < 0:
            raise serializers.ValidationError("Weight must be a non-negative number.")
        
        return value
    
    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Name is required.")
        
        return value
    
    def validate_quantity(self, value):
        if not value:
            raise serializers.ValidationError("Quantity is required.")
        
        if value < 1:
            raise serializers.ValidationError("Quantity must be a positive integer.")
        
        return value

    

class PriceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Price
        fields = '__all__'

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError("Start date is required.")
        
        return value
    
    # def validate_end_date(self, value):
        
    #     if value is not None and (value < make_aware(datetime.now())):
    #         raise serializers.ValidationError("End date cannot be in the past.")
        
    #     return value
        
    def validate_price(self, value):

        if not value:
            raise serializers.ValidationError("Price is required.")

        if value < 0:
            raise serializers.ValidationError("Price must be a non-negative number.")
        
        return value
        




class BatchVariantSerializer(serializers.ModelSerializer):

    # variant = VariantSerializer()
    batch = BatchSerializer(read_only=True) #

    batch_id = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), write_only=True, source='batch', required=True)

    variant = serializers.PrimaryKeyRelatedField(queryset=Variant.objects.all(), required=True)

    class Meta:
        model = BatchVariant
        fields = ['id', 'batch', 'stock', 'batch_id', 'variant']

    
    def validate(self, data):

        if self.instance:
            if self.instance.variant == data.get('variant') and self.instance.batch == data.get('batch'):
                return data
        
        if BatchVariant.objects.filter(variant=data.get('variant'), batch=data.get('batch')).exists():
            print("Stock instance: ", self.instance)
            print("Data:", data)
            raise serializers.ValidationError('Variant already exists in this batch')
        
        return data

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock must be a non-negative integer.")

        return value
    
    def create(self, validate_data):
        print("Stock is valid: ", validate_data)

        variant = validate_data.get('variant')
        batch = validate_data.get('batch')
        stock = validate_data.get('stock')

        batch = BatchVariant.objects.create(variant=variant, batch=batch, stock=stock)

        return batch

    def update(self, instance, validate_data):
        print("Stock is valid: ", validate_data)

        instance.stock = validate_data.get('stock', instance.stock)

        instance.save()

        return instance
    

    @staticmethod
    def get_oldest_batch(variant):          # @staticmethod không nhận tham số self
                                            # vì không liên quan đến instance (khi sử dụng gọi trực tiếp trên class)
        try:
            # lọc lô hàng cũ nhất
            batch = BatchVariant.objects.filter(
                variant_id=variant,   
                stock__gt=0                 # lọc các lô còn hàng tồn kho
            ).order_by('batch__imported_at').first()  # sắp xếp theo thứ tự tăng dần, lấy lô hàng có ngày nhập cũ nhất

            return batch
        
        except Exception as e:
            print(f"Error fetching nearest expiry batch: {e}")
            return None


class ProductInfoSerializer(serializers.ModelSerializer):

    image = ImageSerializer(many=True, read_only=True)
    variants = VariantSerializer(many=True, read_only=True)
    # prices = PriceSerializer(many=True, source='variant_set.price_set', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'variants', 'images'] 



