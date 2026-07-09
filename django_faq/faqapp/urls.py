# -*- coding: utf-8 -*-
from django.urls import path
from .views import GenerateFAQsView, ChatView

urlpatterns = [
    path('generate/', GenerateFAQsView.as_view(), name='faq-generate'),
    path('chat/', ChatView.as_view(), name='faq-chat'),
]
