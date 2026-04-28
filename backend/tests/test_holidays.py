def _admin(client) -> dict:
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


def _user(client) -> dict:
    body = client.post(
        "/auth/register",
        json={
            "email": "u1@cybrella.io",
            "password": "userpass1",
            "full_name": "User One",
            "employment_type": "full_time",
        },
    ).json()
    return {"Authorization": f"Bearer {body['access_token']}"}


def test_user_can_only_read(client) -> None:
    user = _user(client)
    resp = client.post(
        "/admin/holidays",
        json={"date": "2026-04-15", "title": "Test"},
        headers=user,
    )
    assert resp.status_code == 403


def test_admin_crud(client) -> None:
    admin = _admin(client)
    user = _user(client)

    create = client.post(
        "/admin/holidays",
        json={"date": "2026-04-15", "title": "Independence Day"},
        headers=admin,
    )
    assert create.status_code == 201
    hid = create.json()["id"]

    listed = client.get("/holidays?month=2026-04", headers=user)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["title"] == "Independence Day"

    upd = client.put(
        f"/admin/holidays/{hid}", json={"title": "IDay"}, headers=admin
    )
    assert upd.status_code == 200
    assert upd.json()["title"] == "IDay"

    dele = client.delete(f"/admin/holidays/{hid}", headers=admin)
    assert dele.status_code == 200
    assert client.get("/holidays?month=2026-04", headers=user).json() == []
