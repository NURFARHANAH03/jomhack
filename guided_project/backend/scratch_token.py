"""Get a login token for a test user, to try protected routes in Swagger.

Run from backend/:   python scratch_token.py
The token works for about 1 hour. Treat it like a password: never share or commit it.
Delete this file before you deploy.
"""
import getpass
import json
import urllib.error
import urllib.request

from kokoronal.config import settings

anon_key = input("Supabase anon / publishable key: ").strip()
email = input("Test user email: ").strip()
password = getpass.getpass("Password (hidden while typing): ")

request = urllib.request.Request(
    f"{settings.supabase_url}/auth/v1/token?grant_type=password",
    data=json.dumps({"email": email, "password": password}).encode(),
    headers={"apikey": anon_key, "Content-Type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(request) as response:
        data = json.load(response)
except urllib.error.HTTPError as err:
    print("Login failed:", err.code, err.read().decode())
    raise SystemExit(1)

print("\nuser id:", data["user"]["id"])
print("\naccess_token:\n")
print(data["access_token"])