"""
Large banner plugin tests
"""
import re

from cms.api import add_plugin
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer
from django.db import IntegrityError
from django.test import TestCase
from django.test.client import RequestFactory

from .cms_plugins import LargeBannerPlugin
from .factories import LargeBannerFactory


class LargeBannerTests(TestCase):
    """Large banner plugin tests case"""

    def test_large_banner_title_required(self):
        """
        A "title" is required when instantiating a large banner.
        """
        with self.assertRaises(IntegrityError) as cm:
            LargeBannerFactory(title=None)
        self.assertIn(
            'null value in column "title" violates not-null constraint',
            str(cm.exception),
        )

    def test_large_banner_logo_required(self):
        """
        A "logo" is required when instantiating a large banner.
        """
        with self.assertRaises(IntegrityError) as cm:
            LargeBannerFactory(logo=None)
        self.assertIn(
            'null value in column "logo_id" violates not-null', str(cm.exception)
        )

    # pylint: disable=deprecated-method,no-member
    # Due to a conflict between Django 1.11 and pylint with the assertRegex method that is
    # *not* deprecated but is marked so by pylint
    def test_large_banner_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.

        In particular, images should be cropped and big images should be included in
        4 sizes for responsiveness using the srcset attribute.
        """
        placeholder = Placeholder.objects.create(slot="test")

        # Create random values for parameters with a factory
        large_banner = LargeBannerFactory()
        fields_list = ["title", "background_image", "logo", "logo_alt_text"]

        model_instance = add_plugin(
            placeholder,
            LargeBannerPlugin,
            "en",
            **{field: getattr(large_banner, field) for field in fields_list}
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, None)

        # Check if "instance" is in context
        self.assertIn("instance", context)

        # Check if parameters, generated by the factory, are correctly set in "instance" of context
        self.assertEqual(context["instance"].title, large_banner.title)
        self.assertEqual(
            context["instance"].background_image, large_banner.background_image
        )
        self.assertEqual(context["instance"].logo, large_banner.logo)
        self.assertEqual(context["instance"].logo_alt_text, large_banner.logo_alt_text)

        # Get the generated html
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check that all expected elements are in the html
        self.assertIn("<h1>{:s}</h1>".format(large_banner.title), html)
        background_image_base = large_banner.background_image.url.replace("/media", "")
        self.assertIn('<div class="homepage-header-image">', html)
        rexp_background = re.compile(
            'src="/media/(.)*{:s}__1900x450_q85_crop-%2C0'.format(background_image_base)
        )
        self.assertRegex(html, rexp_background)
        self.assertIn(
            "{:s}__2495x550_q85_crop-%2C0".format(background_image_base), html
        )
        self.assertIn(
            "{:s}__2495x550_q85_crop-%2C0".format(background_image_base), html
        )
        self.assertIn(
            "{:s}__1900x450_q85_crop-%2C0".format(background_image_base), html
        )
        self.assertIn(
            "{:s}__1280x400_q85_crop-%2C0".format(background_image_base), html
        )
        self.assertIn("{:s}__768x450_q85_crop-%2C0".format(background_image_base), html)
        logo_base = large_banner.logo.url.replace("/media", "")
        rexp_logo = re.compile(
            'src="/media/(.)*{:s}__593x237_q85_crop'.format(logo_base)
        )
        self.assertRegex(html, rexp_logo)
        self.assertIn("{:s}__593x237_q85_crop".format(logo_base), html)
        self.assertIn('alt="{:s}"'.format(large_banner.logo_alt_text), html)

    def test_large_banner_no_background_image(self):
        """
        Instanciating this plugin with an instance but no background image should render
        a default image in the html.
        The default image is defined as background image in the CSS.
        """
        placeholder = Placeholder.objects.create(slot="test")

        # Create random values for parameters with a factory
        large_banner = LargeBannerFactory(background_image=None)
        fields_list = ["title", "background_image", "logo", "logo_alt_text"]

        model_instance = add_plugin(
            placeholder,
            LargeBannerPlugin,
            "en",
            **{field: getattr(large_banner, field) for field in fields_list}
        )

        # Get the generated html
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check that all expected elements are in the html
        self.assertIn('<div class="homepage-header">', html)
        self.assertFalse('class="content-image"' in html)

    def test_large_banner_no_logo_alt_text(self):
        """
        Instanciating this plugin with an instance but no alt text for the logo should render
        an empty alt attribute in the html (best practice for SEO as opposed to no alt at all).
        """
        placeholder = Placeholder.objects.create(slot="test")

        # Create random values for parameters with a factory
        large_banner = LargeBannerFactory(logo_alt_text=None)
        fields_list = ["title", "background_image", "logo", "logo_alt_text"]

        model_instance = add_plugin(
            placeholder,
            LargeBannerPlugin,
            "en",
            **{field: getattr(large_banner, field) for field in fields_list}
        )

        # Get the generated html
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check that all expected elements are in the html
        self.assertFalse('<img class="logo-fun" alt=""/>' in html)

    def test_large_banner_comment_in_template(self):
        """
        Django comments in templates should not appear in rendered html
        """
        placeholder = Placeholder.objects.create(slot="test")

        # Create random values for parameters with a factory
        large_banner = LargeBannerFactory()
        fields_list = ["title", "background_image", "logo", "logo_alt_text"]

        model_instance = add_plugin(
            placeholder,
            LargeBannerPlugin,
            "en",
            **{field: getattr(large_banner, field) for field in fields_list}
        )

        # Get the generated html
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        self.assertFalse("{% comment" in html)
        self.assertFalse("{#" in html)
