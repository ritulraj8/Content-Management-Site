# -*- coding: utf-8 -*-
from django.urls import path
from .views import GenerateFAQsView

urlpatterns = [
    path('generate/', GenerateFAQsView.as_view(), name='faq-generate'),
]
