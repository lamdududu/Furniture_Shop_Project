from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MaterialViewSet, BatchViewSet, ProductViewSet, PriceViewSet
from .views import ImageViewSet, VariantViewSet, ProductDetailViewSet, VariantDetailViewSet, BatchDetailViewSet
from .views import CheckProductNameViewSet, CheckBatchNumberViewSet, CheckDateTimePriceViewSet, SearchingViewSet
from .views import ProductInfoReadOnlyViewSet, BatchVariantViewSet, ItemDimensionViewSet

router = DefaultRouter() #trailing_slash=False
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'images', ImageViewSet, basename='image')
router.register(r'variants', VariantViewSet, basename='classification')
router.register(r'prices', PriceViewSet, basename='price')
router.register(r'product_info', ProductInfoReadOnlyViewSet, basename='product_info')
router.register(r'batch_detail', BatchDetailViewSet, basename='batch_detail')
router.register(r'product_detail', ProductDetailViewSet, basename='product_detail')
router.register(r'variant_detail', VariantDetailViewSet, basename='variant_detail')
router.register(r'batch_variants', BatchVariantViewSet, basename='batch_variants')
router.register(r'item_detail', ItemDimensionViewSet, basename='item_detail')

urlpatterns = [

    # kiểm tra tên product có tồn tại 
    path('check_product_name/', CheckProductNameViewSet.as_view(), name='check_product_name'),

    # kiểm tra số lô batch có tồn tại
    path('check_batch_number/', CheckBatchNumberViewSet.as_view(), name='check_batch_number'),

    # kiểm tra xung đột thời gian giá bán hiệu lực
    path('check_date_time_price/', CheckDateTimePriceViewSet.as_view(), name='check_date_time_price'),

    # tìm kiếm sản phẩm theo tên, loại, văn hóa, số lô, khoảng giá
    path('searching/', SearchingViewSet.as_view(), name='search'),
]  + router.urls
