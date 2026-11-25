from fastapi.testclient import TestClient
from app.main import app,chunk_text
client=TestClient(app)
def test_health(): assert client.get("/health").json()["status"]=="ok"
def test_chunking():
    chunks=chunk_text("one two three four five",3,1)
    assert chunks==["one two three","three four five"]
def test_mock_model():
    r=client.post("/generate",json={"prompt":"hello","provider":"mock"})
    assert r.status_code==200 and "MOCK" in r.json()["output"]
def test_reject_binary_extension():
    r=client.post("/ingest",files={"file":("bad.exe",b"hello","application/octet-stream")})
    assert r.status_code==415
