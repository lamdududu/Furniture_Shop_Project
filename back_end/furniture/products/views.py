import json
import os
from datetime import datetime
from django.utils.timezone import make_aware
from django.core.files.storage import default_storage
from django.conf import settings
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware
from django.db import transaction
from django.db.models import Max, Q, F, Sum, OuterRef, Subquery
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import viewsets, status, serializers
from furniture.permissions import StandardActionPermission, IsAdmin
from furniture.paginations import CustomPagination
from discounts.models import Discount
from .models import Category, Batch, Product, Price, Material, Image, Variant, BatchVariant, ItemDimension
from .serializers import CategorySerializer, MaterialSerializer, BatchSerializer, ProductSerializer
from .serializers import PriceSerializer, ImageSerializer, VariantSerializer, ItemDimensionSerializer
from .serializers import BatchVariantSerializer, ProductInfoSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [StandardActionPermission]
    pagination_class = None


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('name')
    serializer_class = MaterialSerializer
    permission_classes = [StandardActionPermission]
    pagination_class = None


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().order_by('-imported_at')
    serializer_class = BatchSerializer
    pagination_class = CustomPagination
    permission_classes = [StandardActionPermission]



class BatchDetailViewSet(viewsets.ViewSet):

    permission_classes = [StandardActionPermission]

    def retrieve(self, request, pk=None):
        print(self.allowed_methods)
        if pk is not None:
            batch = Batch.objects.get(id=pk)
            batch_serializer = BatchSerializer(batch)

            if batch_serializer is None:
                print('batch not found')

            stock_data = BatchVariant.objects.filter(batch=pk)

            if stock_data.exists():
                stock_serializer = BatchVariantSerializer(stock_data, many=True)
                variant = stock_data.first().variant

                return Response({
                        'batch': batch_serializer.data,
                        'stock': stock_serializer.data,
                        'product': {
                            'id': variant.product.id,
                            'name': variant.product.name,
                        },
                    }, status=status.HTTP_200_OK)
            else:
                print("Stock data does not exist")

        print("Not BatchID: " + pk)

        return Response({'error': 'Variant ID not provided'}, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        
        batch_serializer = BatchSerializer(data=request.data.get('batch'))

        if len(request.data.get('stocks')) < 1:
            print("Stock data does not exist")
            return Response({'error': 'Stock data does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not batch_serializer.is_valid():
            print('Batch is not valid: ', batch_serializer.errors)
            return Response(batch_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():

                batch = batch_serializer.save()

                # batch_data = BatchSerializer(data=batch)
                
                item_quantity = 0

                for stock in request.data.get('stocks'):

                    # if not batch_data.is_valid():
                    #     print('Stock is not valid: ', stock_serializer.errors)
                    #     raise serializers.ValidationError({'error': stock_serializer.errors})
                    
                    # stock['batch'] = batch_data.data
                    stock['batch_id'] = batch.id
                    stock_serializer = BatchVariantSerializer(data=stock)

                    if not stock_serializer.is_valid():
                        print('Stock is not valid: ', stock_serializer.errors)
                        raise serializers.ValidationError({'error': stock_serializer.errors})
                    
                    stock_serializer.save()

                    item_quantity += stock['stock']

                    if item_quantity > batch.item_quantity:
                        raise serializers.ValidationError({'error': 'Item quantity cannot exceed batch item quantity'})
            
            return Response({
                'id': batch.id,
                'batch_number': batch.batch_number
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            print('Error occurred: ', e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, *args, **kwargs):

        batch_data = request.data.get('batch')
        batch_instance = Batch.objects.get(id=batch_data['id'])
        batch_serializer = BatchSerializer(instance=batch_instance, data=batch_data)

        if not batch_serializer.is_valid():
            print('Batch is not valid: ', batch_serializer.errors)
            return Response(batch_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        stock_data = request.data.get('stocks')

        if len(stock_data) < 1:
            print("Stock data does not exist")
            return Response({'error': 'Stock data does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():

                # Do đã truyền instance vào serializer nên không cần gọi trực tiếp .update()
                # Nếu không truyền tham số instance: `batch_serializer.update(instance, data)`
                batch_serializer.save()
                
                item_quantity = 0

                for stock in stock_data:

                    stock_instance = BatchVariant.objects.filter(variant=stock['variant'], batch=stock['batch_id']).first()
                            
                    if stock_instance is not None:
                        stock_serializer = BatchVariantSerializer(instance=stock_instance, data=stock) #, context={'request': request, 'instance': stock_instance}s
                        
                        if not stock_serializer.is_valid():
                            print('Stock is not valid', stock_serializer.errors)
                            return Response(stock_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                        
                        stock_serializer.save()

                        item_quantity += stock['stock']
                   
                    else:
                        stock_serializer = BatchVariantSerializer(data=stock)
                        
                        if not stock_serializer.is_valid():
                            print('Stock is not valid', stock_serializer.errors)
                            return Response(stock_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                        stock_serializer.save()

                        item_quantity += stock['stock']
                
                if item_quantity > batch_data['item_quantity']:
                    raise serializers.ValidationError({'error': 'Item quantity cannot exceed batch item quantity'})

            return Response({
                'id': batch_data['id'],
                'batch_number': batch_data['batch_number'],
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print('Error occurred during transaction: ', e)
            return Response({'error': 'Error occurred during transaction'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ImageViewSet(viewsets.ModelViewSet):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [StandardActionPermission]
    pagination_class = None


class VariantViewSet(viewsets.ModelViewSet):
    queryset = Variant.objects.select_related('product')
    serializer_class = VariantSerializer
    permission_classes = [StandardActionPermission]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        'product'
    ]

    pagination_class = None


    def create(self, request, *args, **kwargs):

        variant = request.data.get('variant')
        items = request.data.get('items', [])

        try:
            with transaction.atomic():
                variant_serializer = VariantSerializer(data=variant)
                if not variant_serializer.is_valid():
                    print('Variant is not valid: ', variant_serializer.errors)
                    raise serializers.ValidationError({"error": "Variant is not valid"})
                
                variant = variant_serializer.save()

                for item in items:
                    item['variant'] = variant.id
                    item_serializer = ItemDimensionSerializer(data=item)
                    if not item_serializer.is_valid():
                        print('Item is not valid: ', item_serializer.errors)
                        raise serializers.ValidationError({"error": "Item is not valid"})
                
                    item_serializer.save(variant=variant)

            return Response({
                'id': variant.id,
                'name': variant.name
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            print('Error occurred during transaction: ', e)
            return Response({'error': 'Error occurred during transaction'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VariantDetailViewSet(viewsets.ViewSet):
    permission_classes = [StandardActionPermission]

    def retrieve(self, request, pk=None):
        variant_id = pk

        if variant_id is not None:
            price_data = Price.objects.filter(variant=variant_id)
            stock_data = BatchVariant.objects.filter(variant=variant_id)
            variant_data = Variant.objects.get(id=variant_id)
            items = ItemDimension.objects.filter(variant=variant_id)

            price = PriceSerializer(price_data, many=True)
            stock = BatchVariantSerializer(stock_data, many=True)

            items = ItemDimensionSerializer(items, many=True)

            return Response({
                'id': variant_data.id,
                'name': variant_data.name,
                'prices': price.data,
                'stocks': stock.data,
                'items': items.data,
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Variant ID not provided'}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):

        try:
            variant = Variant.objects.get(id=pk)
        except Variant.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VariantSerializer(variant, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ItemDimensionViewSet(viewsets.ModelViewSet):
    queryset = ItemDimension.objects.all()
    serializer_class = ItemDimensionSerializer
    permission_classes = [StandardActionPermission]
    pagination_class = None

    # filter_backends = [DjangoFilterBackend]
    # filterset_fields = {
    #     'variant': ['exact']
    # }


    def create(self, request, *args, **kwargs):
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return super().update(request, *args, **kwargs)
    

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')
    serializer_class = ProductSerializer
    permission_classes = [StandardActionPermission]
    pagination_class = CustomPagination

    filter_backends = [DjangoFilterBackend]
    # filterset_fields = {
    #     'category__name': ['exact', 'icontains'],
    #     'tags__name': ['exact', 'icontains'],
    #     'name': ['exact', 'icontains'],
    # }
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id', 'category', 'name', 'materials', 'status']



    def paginate_queryset(self, queryset):
        
        # Nếu có tham số "no_pagination" thì không phân trang
        if self.request.query_params.get('no_pagination', 'false').lower() == 'true':
            return None  # Không phân trang

        return super().paginate_queryset(queryset)


    def list(self, request, *args, **kwargs):

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        # Nếu không phân trang, trả về toàn bộ danh sách sản phẩm
        # Hỗ trợ cho select trong front-end
        if page is None:
            serializers = self.get_serializer(queryset, many=True)
            return Response(serializers.data)

        # Trả về danh sách phân trang
        serializers = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializers.data)


    def create(self, request, *args, **kwargs):

        print('Dữ liệu PUT: ', request.data)

        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            print('Serializer error:', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        print('Dữ liệu PUT: ', request.data)

        # partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data) #, partial=partial

        if not serializer.is_valid():
            print('Serializer error:', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return super().update(request, *args, **kwargs)


    


class PriceViewSet(viewsets.ModelViewSet):
    queryset = Price.objects.all().order_by('-start_date')
    serializer_class = PriceSerializer
    pagination_class = CustomPagination
    permission_classes = [StandardActionPermission]

    def create(self, request, *args, **kwargs):

        data = request.data.copy()
        conflict_id = data.pop('conflict_id', False)

        try:
            with transaction.atomic():
                if conflict_id:
                    try:
                        price = Price.objects.get(id=conflict_id)
                        end_date = {'end_date': parse_datetime(data.get('start_date'))}
                        price_serializer = PriceSerializer(price, data=end_date, partial=True)

                        if not price_serializer.is_valid():
                            print('End date is not valid')
                            return Response(price_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                        price_serializer.save()

                    except Price.DoesNotExist:
                        return Response({'error': 'Price does not exist'}, status=status.HTTP_404_NOT_FOUND)

                serializer = self.get_serializer(data=data)

                if not serializer.is_valid():
                    print('Serializer error:', serializer.errors)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                return super().create(request, *args, **kwargs)

        except serializers.ValidationError as e:
            print('Validation error:', e)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):

        # Tạm thời data chỉ bao gồm giá bán mới
        data = request.data.copy()

        # Tạm thời chưa hoàn thiện để thay đổi ngày
        # conflict_id = data.pop('conflict_id', False)

        try:
            with transaction.atomic():
                # Cập nhật dữ liệu cho instance hiện tại
                instance = self.get_object()
                serializer = self.get_serializer(instance, data=data, partial=True)

                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                serializer.save()

                return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailViewSet(viewsets.ViewSet):

    permission_classes = [StandardActionPermission]
    parser_classes=[MultiPartParser, FormParser, JSONParser]

    def retrieve(self, request, pk=None):

        product = Product.objects.get(id=pk)
        product_serializer = ProductSerializer(product)

        if product_serializer is None:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        image = Image.objects.filter(product=pk)
        image_serializer = ImageSerializer(image, context={'request': request}, many=True)

        return Response({
            'product': product_serializer.data,
            'images': image_serializer.data,
        }, status=status.HTTP_200_OK)


    def create(self, request, *args, **kwargs):

        print("request: ", request.content_type)

        print('Dữ liệu POST: ', request.data)

        product_data = json.loads(request.data.get('product'))
        variant_data = json.loads(request.data.get('variants', '[]'))
        image_data = request.FILES.getlist('images')
        
        if(len(variant_data) == 0):
            print("No variants found")
            return Response({'error': 'No variants found'}, status=status.HTTP_400_BAD_REQUEST)
        
        if(len(image_data) == 0):
            print("No images found")
            return Response({'error': 'No images found'}, status=status.HTTP_400_BAD_REQUEST)

        product_serializer = ProductSerializer(data=product_data)
        if not product_serializer.is_valid():
            print('Product serializer error:', product_serializer.errors)
            return Response(product_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        image_save = []

        try:
            with transaction.atomic():
                product = product_serializer.save()
                
                for variant in variant_data:
                    
                    items = variant.pop('items', [])

                    variant['product_id'] = product.id
                    variant_serializer = VariantSerializer(data=variant)
                    
                    if not variant_serializer.is_valid():
                        print('Variant serializer error:', variant_serializer.error)
                        raise serializers.ValidationError(variant_serializer.error)
                    
                    new_variant = variant_serializer.save()

                    for item in items:
                        item['variant'] = new_variant.id
                        item_serializer = ItemDimensionSerializer(data=item)

                        if not item_serializer.is_valid():
                            print('Item serializer error:', item_serializer.error)
                            raise serializers.ValidationError(item_serializer.error)
                        
                        item_serializer.save()

                for image in image_data:

                    # image['product'] = product.id
                    image_dict = {
                        'product': product.id,
                        'image_file': image
                    }
                    image_serializer = ImageSerializer(data=image_dict)

                    if not image_serializer.is_valid():
                        print('Image serializer error:', image_serializer.errors)
                        raise serializers.ValidationError(image_serializer.errors)
                
                    try:
                        saved_image = image_serializer.save()
                        image_save.append(saved_image.image_file.name)
                    except Exception as e:
                        print('Error occurred while saving image: ', e)
                        raise serializers.ValidationError('Error occurred while saving image')

            return Response({
                'id': product.id,
                'name': product.name,
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:

            if len(image_save) > 0:
                media_path = os.path.join(settings.MEDIA_ROOT, 'products')
                for image in image_save:
                    try:
                        if default_storage.exists(os.path.join(media_path, image)):
                            default_storage.delete(os.path.join(media_path, image))
                    except Exception as e:
                        print('Error occurred while deleting image: ', e)

            print('Error occurred during transaction: ', e)
            return Response({'error': 'Error occurred during transaction'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        
        product_data = Product.objects.get(id=pk)
        product_serializer = ProductSerializer(product_data, data=json.loads(request.data.get('product')))

        if not product_serializer.is_valid():
            print('Product serializer error:', product_serializer.errors)
            return Response(product_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        image_save = []

        image_data = Image.objects.filter(product_id=pk)
        new_image_data = request.FILES.getlist('images')

        min_length = min(len(image_data), len(new_image_data))

        try:
            with transaction.atomic():

                product = product_serializer.save()

                if len(new_image_data) > 0:
                    print("Image")
                    if len(new_image_data) > len(image_data):
                        for i in range(min_length, len(new_image_data)):
                            image_dict = {
                                'product': product.id,
                                'image_file': new_image_data[i]
                            }
                            
                            image_serializer = ImageSerializer(data=image_dict)
                            if not image_serializer.is_valid():
                                print('Image serializer error:', image_serializer.errors)
                                raise serializers.ValidationError(image_serializer.errors)
                            
                            image = image_serializer.save()
                            image_save.append(image.image_file.name)


                        for i in range(min_length):
                            image = {
                                'product': pk,
                                'image_file': new_image_data[i]
                            }

                            image_serializer = ImageSerializer(instance=image_data[i], data=image)

                            if not image_serializer.is_valid():
                                print('Image serializer error:', image_serializer.errors)
                                raise serializers.ValidationError(image_serializer.errors)

                            image_serializer.save()

                        
                        if len(image_data) > len(new_image_data):
                            for i in range(min_length, len(image_data)):
                                image_data[i].image_file.delete(save=False)
                                image_data[i].delete()
                
            return Response({
                'id': product_data.id,
                'name': product_data.name,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            print('Error occurred during transaction: ', e)
            return Response({'error': 'Error occurred during transaction'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductInfoReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Product.objects.all().order_by('-id')       
    pagination_class = CustomPagination
    serializer_class = ProductInfoSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'name': ['icontains'],
        'category__name': ['icontains'],
    }

    def list(self, request):
        try:
            today = make_aware(datetime.now())

            # Subquery lấy min price hợp lệ
            min_price_subquery = Price.objects.filter(
                variant__product=OuterRef('id'),
                start_date__lte=today
            ).filter(
                Q(end_date__gt=today) | Q(end_date__isnull=True)
            ).order_by('price').values('price')[:1]     # lấy giá nhỏ nhất
            
            # Subquery lấy max discount hợp lệ
            max_discount_subquery = Discount.objects.filter(
                product=OuterRef('id'),
                promotion__start_date__lte=today,
                promotion__end_date__gte=today
            ).order_by().values('percentage')[:1]

            # if request.query_params.get('category__name') is not None or request.query_params.get('name') is not None:  
            filtered_products = self.filter_queryset(self.get_queryset())

            products = filtered_products.filter(
                status=True
            ).annotate(
                min_price=Subquery(min_price_subquery),
                discount_percentage=Subquery(max_discount_subquery),
                first_image=Subquery(Image.objects.filter(product=OuterRef('id')).order_by('id').values('image_file')[:1])  # Lấy ảnh đầu tiên
            ).order_by('-id')

            # Áp dụng phân trang trước khi xử lý dữ liệu
            # Nếu không có sẽ gây lỗi khi phân trang (dữ liệu không được tải đầy đủ)
            paginated_products = self.paginate_queryset(products)
            if paginated_products is None:
                return Response([], status=status.HTTP_200_OK)

            # Tính toán sale_price sau khi lấy từ DB
            products_list = []
            for product in paginated_products:
                min_price = product.min_price
                discount = product.discount_percentage
                sale_price = min_price * (1-discount) if min_price and discount else None

                image_url = request.build_absolute_uri(settings.MEDIA_URL + product.first_image) if product.first_image else None


                products_list.append({
                    'id': product.id,
                    'name': product.name,
                    'price': min_price or 0,
                    'sale_price': sale_price,
                    'discount_percentage': discount,
                    'image': image_url,
                })

            # Trả về response có phân trang
            # Nếu không sẽ chỉ có danh sách sản phẩm, không đúng định dạng mặc định của phân trang DRF            
            return self.get_paginated_response(products_list)

        except Exception as e:
            print('Error occurred while getting variants: ', e) 
            return Response({'error': 'Error occurred while getting variants'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None):
        
        try:
            product = Product.objects.get(pk=pk)

            # kiểm tra sản phẩm có còn kinh doanh hay không
            if not product.status:
                return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

            today = make_aware(datetime.now())

            price_subquery = Price.objects.filter(
                    variant_id = OuterRef('variant_id'),
                    start_date__lte = today         # less than or equal (lấy các price có start_date <= today)
                ).filter(
                    Q(end_date__gt = today) |       # less than (loại b�� các price hết hạn end_date <= today)
                    Q(end_date__isnull = True)
                ).order_by('-start_date').values('price')[:1]
            # có thể bỏ qua order_by vì không có nhiều giá có hiệu lực cùng lúc
            # order_by và values đang kết hợp để lấy giá có hiệu lực mới nhất (có thể bỏ qua)

            variants = (
                BatchVariant.objects.filter(
                    variant__product = product,
                ).values('variant')         # group by variant
                .annotate(
                    id = F('variant'),
                    name = F('variant__name'),
                    stock = Sum('stock'),
                    price = Subquery(price_subquery)        # gán giá trị Subquery cho price
                )
                .values('id', 'name', 'stock', 'price')
            )

            variant_ids = [variant['id'] for variant in variants]

            dimensions = ItemDimension.objects.filter(
                variant__in=variant_ids
            ).values('variant', 'name', 'length', 'height', 'width', 'weights', 'quantity')

            for variant in variants:
                variant['dimensions'] = list(dimensions.filter(variant=variant['id']))

            discount = (
                Discount.objects.filter(
                    product=product.id,
                    promotion__start_date__lte = today,
                    promotion__end_date__gte = today
                )
            ).aggregate(max_discount=Max('percentage'))['max_discount']

            return Response({
                'product': ProductSerializer(product).data,
                'variants': list(variants),
                'discount_percentage': discount,
                'images': ImageSerializer(product.image_set.all(), many=True).data,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print('Error occurred while getting product or variants: ', e)
            return Response({'error': 'Error occurred while getting product or variants'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class CheckProductNameViewSet(APIView):

    permissions_classes=[IsAdmin]

    def post(self, request):

        product_name = request.data.get('name')

        if Product.objects.filter(name__iexact=product_name).exists():
            return Response({'exists': True}, status=status.HTTP_200_OK)
        
        else:
            return Response({'exists': False}, status=status.HTTP_200_OK)
        

class CheckBatchNumberViewSet(APIView):
    
    permissions_classes=[IsAdmin]

    def post(self, request):
        batch_number = request.data.get('batch_number')

        if Batch.objects.filter(batch_number__iexact=batch_number).exists():
            return Response({'exists': True}, status=status.HTTP_200_OK)
        
        else:
            return Response({'exists': False}, status=status.HTTP_200_OK)
        

class CheckDateTimePriceViewSet(APIView):

    permissions_classes=[IsAdmin]

    def post(self, request):
        
        # Chuyển đổi chuỗi ISO 8601 từ api về dạng datetime
        start_date = parse_datetime(request.data.get('start_date'))

        # # Nếu USE_TZ = true, thì chuyển đổi datetime thành timezone-aware
        # if start_date is not None and settings.USE_TZ:
        #     start_date = make_aware(start_date)

        variant = request.data.get('variant')

        price_data = Price.objects.filter(variant=variant)

        if not price_data:
            return Response({'conflicts': False}, status=status.HTTP_200_OK)
        
        for price in price_data:
            if price.end_date > start_date:
                return Response({   
                        'conflicts': True,
                        'id': price.id,
                        'price': price.price,
                        'end_date': price.end_date,
                    }, 
                status=status.HTTP_200_OK)
            
        return Response({'conflicts': False}, status=status.HTTP_200_OK)


class BatchVariantViewSet(viewsets.ModelViewSet):
    queryset = BatchVariant.objects.all()
    serializer_class = BatchVariantSerializer
    permission_classes = [StandardActionPermission]


class SearchingViewSet(APIView):
    
    pagination_class = CustomPagination

    def get(self, request):
        
        # Tạo một instance cho lớp phân trang
        # vì APIView không tự động tạo ra phương thức phân trang, mà `pagination_class` chỉ là một thuộc tính
        paginator = self.pagination_class()


        # Dùng `request.GET` để lấy query params (không dùng `request.data` cho GET)
        product_info = request.GET.get('query')       # `strip()` xoá khoảng trắng thừa
        batch_info = request.GET.get('batch_info')


        # dùng `request.user.is_authenticated` thay cho `request.user is not None`
        # vì trong Django, request.user luôn tồn tại
        # nếu chưa đăng nhập thì request.user vẫn là một Anonymous object
        # nên nếu kiểm tra None sẽ không chính xác
        is_admin = request.user.is_staff if request.user.is_authenticated else False

        if product_info:
            
            # dùng `distinct` để bỏ bản ghi bị trùng lặp
            # `.prefetch_related('image_set')` không được sử dụng vì sẽ trả về nhiều dòng trùng nhau nếu sản phẩm có nhiều ảnh
            # điều này khiến `distinct` không phân biệt được trùng lặp (vì có trường `image` có giá trị khác nhau)    
            product_list = Product.objects.filter(
                Q(name__icontains=product_info) |
                Q(category__name__icontains=product_info) |
                Q(materials__name__icontains=product_info)
            ).filter(
                Q(status=True) if not is_admin else Q()
            ).annotate(                     
                first_image=Subquery(
                    Image.objects.filter(product=OuterRef('id')).order_by('id').values('image_file')[:1]
                )
            ).order_by('-id').values('id', 'status', 'name', 'category__name', 'first_image').distinct() 

                                        
            paginated_products = paginator.paginate_queryset(product_list, request)

            return paginator.get_paginated_response(paginated_products)

        if is_admin and batch_info:
    
            batch_list = Batch.objects.filter(
                Q(batch_number__icontains=batch_info) |
                Q(batchvariant__variant__product__name__icontains=batch_info) |
                Q(batchvariant__variant__name__icontains=batch_info) |
                Q(origin__icontains=batch_info)
            ).order_by('-id').values('id', 'batch_number', 'item_quantity', 'origin', 'imported_at').distinct()

            paginated_batches = paginator.paginate_queryset(batch_list, request)
            
            return paginator.get_paginated_response(paginated_batches)
            
        return Response({"message": "Nothing found"}, status=status.HTTP_404_NOT_FOUND)
    
