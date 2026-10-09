#example 1 - request construction
import httpx

request = httpx.Request("GET", "http://localhost:8000/workshops",
                        params={"q": "Python", "offset": 0, "limit": 10})

print(request.method)
print(request.url.path) #/workshops Printed from request.url.path. It shows the URL endpoint path after http://localhost:8000.
print(request.url.params["limit"])

#example 2 - JSON response
response = httpx.Response(201, json={"id": "w1", "title": "Python", "capacity": 20})
print(response.status_code)
print(response.json()["id"])

#example 3 - async waiting
import asyncio #Preventing the server from freezing or crashing during high traffic is one of the main reasons async is used in web frameworks like FastAPI.

async def demo():
    await asyncio.sleep(0)
    return "Ready"

print(asyncio.run(demo()))