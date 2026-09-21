import requests

print("1. Logging in...")
auth_url = "http://localhost:8080/api/v1/auth/login"
try:
    res = requests.post(auth_url, json={"email": "test@test.com", "password": "password"})
    if res.status_code != 200:
        print("Registering instead...")
        requests.post("http://localhost:8080/api/v1/auth/register", json={"email": "test@test.com", "username": "test", "password": "password"})
        res = requests.post(auth_url, json={"email": "test@test.com", "password": "password"})
    token = res.json().get("token")
except Exception as e:
    print(f"Auth failed: {e}")
    exit(1)

print("2. Getting presigned URL...")
try:
    res = requests.get(
        "http://localhost:8080/api/v1/issues/storage/presigned-url?filename=test.jpg",
        headers={"Authorization": f"Bearer {token}"}
    )
    res.raise_for_status()
    url = res.json().get("presignedUrl")
    print(f"URL: {url}")
except Exception as e:
    print(f"Failed to get URL: {e}")
    exit(1)

print("\n3. Uploading to S3...")
try:
    put_res = requests.put(
        url, 
        data=b"hello world", 
        headers={"Content-Type": "image/jpeg"}
    )
    print(f"Status Code: {put_res.status_code}")
    print(f"Response: {put_res.text}")
except Exception as e:
    print(f"Failed to upload: {e}")
