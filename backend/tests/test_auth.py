def _register_payload(email: str = "alice@cybrella.io") -> dict:
    return {
        "email": email,
        "password": "supersecret123",
        "full_name": "Alice Cybrella",
        "employment_type": "full_time",
    }


def test_register_rejects_email_not_on_allow_list(client) -> None:
    resp = client.post(
        "/auth/register", json=_register_payload(email="stranger@gmail.com")
    )
    assert resp.status_code == 403
    assert "allowed" in resp.json()["error"].lower()


def test_register_creates_user_and_returns_token(client) -> None:
    resp = client.post("/auth/register", json=_register_payload())
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "alice@cybrella.io"
    assert body["user"]["role"] == "user"
    assert "access_token" in body


def test_register_initial_admin_promoted(client) -> None:
    resp = client.post(
        "/auth/register", json=_register_payload(email="lianc@cybrella.io")
    )
    assert resp.status_code == 201
    assert resp.json()["user"]["role"] == "admin"


def test_register_duplicate_email_conflict(client) -> None:
    client.post("/auth/register", json=_register_payload())
    resp = client.post("/auth/register", json=_register_payload())
    assert resp.status_code == 409


def test_login_success(client) -> None:
    client.post("/auth/register", json=_register_payload())
    resp = client.post(
        "/auth/login",
        json={"email": "alice@cybrella.io", "password": "supersecret123"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_invalid_credentials(client) -> None:
    client.post("/auth/register", json=_register_payload())
    resp = client.post(
        "/auth/login",
        json={"email": "alice@cybrella.io", "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_me_requires_auth(client) -> None:
    assert client.get("/auth/me").status_code == 401


def test_me_returns_user(client) -> None:
    reg = client.post("/auth/register", json=_register_payload()).json()
    token = reg["access_token"]
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "alice@cybrella.io"


def test_change_password_flow(client) -> None:
    reg = client.post("/auth/register", json=_register_payload()).json()
    token = reg["access_token"]
    resp = client.put(
        "/users/me/change-password",
        json={"current_password": "supersecret123", "new_password": "newsecret456"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    login = client.post(
        "/auth/login",
        json={"email": "alice@cybrella.io", "password": "newsecret456"},
    )
    assert login.status_code == 200


def test_forgot_password_always_200(client) -> None:
    resp = client.post(
        "/auth/forgot-password", json={"email": "ghost@cybrella.io"}
    )
    assert resp.status_code == 200
