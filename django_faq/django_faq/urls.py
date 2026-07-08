# -*- coding: utf-8 -*-
from django.urls import path, include

urlpatterns = [
    path('faqs/', include('faqapp.urls')),
]
