import os
from decimal import Decimal
from typing import Any

import requests
from fastapi import Request
from fastapi_amis_admin.admin import admin
from fastapi_amis_admin.admin.settings import Settings
from fastapi_amis_admin.admin.site import AdminSite
from fastapi_amis_admin.amis import PageSchema
from fastapi_amis_admin.amis.components import Form
from fastapi_amis_admin.crud.schema import BaseApiOut
from models import Course, Grade, Update, User
from pydantic import BaseModel
from sqlalchemy import table
from sqlmodel import Field, SQLModel

try:
    db_url = os.getenv("DB_URL", "")
    site = AdminSite(
        settings=Settings(
            language="zh_CN",
            database_url=db_url,
        )
    )

    models: list[SQLModel] = [User, Grade, Update]

    # for model in models:
    #     # continue
    #     cls = type(
    #         f"{model.__name__}",
    #         (admin.ModelAdmin,),
    #         {"page_schema": model.__name__, "model": model},
    #     )

    #     site.register_admin(cls)

    @site.register_admin
    class UserAdmin(admin.ModelAdmin):
        page_schema = PageSchema(label="User", icon="fa-solid fa-user")  # type: ignore
        model = User

    @site.register_admin
    class CourseAdmin(admin.ModelAdmin):
        pk_name = "id1"
        page_schema = PageSchema(label="Course", icon="fa-solid fa-book-bookmark")  # type: ignore
        model = Course

    @site.register_admin
    class GradeAdmin(admin.ModelAdmin):
        page_schema = PageSchema(label="Grade", icon="fa-solid fa-list")  # type: ignore
        model = Grade

    @site.register_admin
    class BackupAdmin(admin.LinkAdmin):
        link = f'{os.getenv("APP_URL", "")}/backup'
        page_schema = PageSchema(label="Backup", icon="fa-solid fa-download")  # type: ignore

    if api_key := os.getenv("APP_ANALYTICS_KEY"):
        user_id = requests.get(f"https://www.apianalytics-server.com/api/user-id/{api_key}").text
        user_id = user_id[1:-1].replace("-", "")  # get rid of quote
        url = f"https://www.apianalytics.dev/dashboard/{user_id}"

        @site.register_admin
        class AnalyticsAdmin(admin.LinkAdmin):
            link = url
            page_schema = PageSchema(label="Analytics", icon="fa-solid fa-chart-simple")  # type: ignore

except Exception as e:
    print(e)
    site = None
