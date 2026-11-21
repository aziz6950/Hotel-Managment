from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class AuthAPITests(APITestCase):
    def register(self, username='newguest', password='Hotel@12345'):
        return self.client.post('/api/auth/register/', {
            'username': username, 'email': 'n@test.com',
            'password': password, 'phone': '01700000000',
        }, format='json')

    def login(self, username='newguest', password='Hotel@12345'):
        return self.client.post('/api/auth/login/', {
            'username': username, 'password': password,
        }, format='json')

    def test_register_creates_guest_profile(self):
        res = self.register()
        self.assertEqual(res.status_code, 201)
        user = User.objects.get(username='newguest')
        self.assertEqual(user.profile.role, 'guest')

    def test_weak_password_rejected(self):
        res = self.register(password='123')
        self.assertEqual(res.status_code, 400)

    def test_duplicate_username_rejected(self):
        self.register()
        res = self.register()
        self.assertEqual(res.status_code, 400)

    def test_login_returns_tokens_and_role(self):
        self.register()
        res = self.login()
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['role'], 'guest')

    def test_wrong_password_rejected(self):
        self.register()
        res = self.login(password='WrongPass@1')
        self.assertEqual(res.status_code, 401)

    def test_me_requires_token(self):
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 401)

    def test_me_with_token(self):
        self.register()
        token = self.login().data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['username'], 'newguest')
