def _admin_auth(client) -> dict:
    body = client.post(
        "/auth/register",
        json={
            "email": "lianc@cybrella.io",
            "password": "adminpass1",
            "full_name": "Lian C",
            "employment_type": "full_time",
        },
    ).json()
    return {"Authorization": f"Bearer {body['access_token']}"}


def _user_auth(client, email: str = "bob@cybrella.io") -> tuple[int, dict]:
    body = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "userpass1",
            "full_name": "Bob C",
            "employment_type": "full_time",
        },
    ).json()
    return body["user"]["id"], {"Authorization": f"Bearer {body['access_token']}"}


def test_admin_lists_users(client) -> None:
    admin = _admin_auth(client)
    _user_auth(client)
    resp = client.get("/admin/users", headers=admin)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_non_admin_blocked(client) -> None:
    _, headers = _user_auth(client)
    resp = client.get("/admin/users", headers=headers)
    assert resp.status_code == 403


def test_approve_locks_month(client) -> None:
    admin = _admin_auth(client)
    user_id, user_headers = _user_auth(client)
    client.post(
        "/attendance",
        json={
            "date": "2026-04-15",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=user_headers,
    )
    client.post("/attendance/month/2026-04/submit", headers=user_headers)

    resp = client.post(
        f"/admin/attendance/month/{user_id}/2026-04/approve", headers=admin
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "approved"
    assert body["locked"] is True

    blocked = client.post(
        "/attendance",
        json={
            "date": "2026-04-16",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=user_headers,
    )
    assert blocked.status_code == 403


def test_unlock_allows_edits(client) -> None:
    admin = _admin_auth(client)
    user_id, user_headers = _user_auth(client)
    client.post(
        "/attendance",
        json={
            "date": "2026-04-15",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=user_headers,
    )
    client.post("/attendance/month/2026-04/submit", headers=user_headers)
    client.post(f"/admin/attendance/month/{user_id}/2026-04/approve", headers=admin)
    client.post(f"/admin/attendance/month/{user_id}/2026-04/unlock", headers=admin)

    resp = client.post(
        "/attendance",
        json={
            "date": "2026-04-17",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=user_headers,
    )
    assert resp.status_code == 201


def test_export_returns_xlsx(client) -> None:
    admin = _admin_auth(client)
    _, user_headers = _user_auth(client)
    client.post(
        "/attendance",
        json={
            "date": "2026-04-15",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=user_headers,
    )
    resp = client.get("/admin/attendance/export?month=2026-04", headers=admin)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert resp.content[:2] == b"PK"  # xlsx is a zip
