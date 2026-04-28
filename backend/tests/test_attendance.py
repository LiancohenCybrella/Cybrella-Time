def _auth(client) -> tuple[str, dict]:
    payload = {
        "email": "alice@cybrella.io",
        "password": "supersecret123",
        "full_name": "Alice",
        "employment_type": "full_time",
    }
    body = client.post("/auth/register", json=payload).json()
    return body["access_token"], {"Authorization": f"Bearer {body['access_token']}"}


def test_create_work_record(client) -> None:
    _, headers = _auth(client)
    resp = client.post(
        "/attendance",
        json={
            "date": "2026-04-15",
            "check_in": "09:00:00",
            "check_out": "17:30:00",
            "day_type": "work",
            "note": "regular day",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "draft"
    assert body["total_hours"] == 8.5


def test_work_requires_times(client) -> None:
    _, headers = _auth(client)
    resp = client.post(
        "/attendance",
        json={"date": "2026-04-15", "day_type": "work"},
        headers=headers,
    )
    assert resp.status_code == 422


def test_vacation_no_times(client) -> None:
    _, headers = _auth(client)
    resp = client.post(
        "/attendance",
        json={"date": "2026-04-16", "day_type": "vacation"},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["total_hours"] is None


def test_duplicate_date_conflict(client) -> None:
    _, headers = _auth(client)
    base = {
        "date": "2026-04-17",
        "check_in": "09:00:00",
        "check_out": "17:00:00",
        "day_type": "work",
    }
    client.post("/attendance", json=base, headers=headers)
    resp = client.post("/attendance", json=base, headers=headers)
    assert resp.status_code == 409


def test_my_month_summary(client) -> None:
    _, headers = _auth(client)
    client.post(
        "/attendance",
        json={
            "date": "2026-04-15",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=headers,
    )
    client.post(
        "/attendance",
        json={"date": "2026-04-16", "day_type": "vacation"},
        headers=headers,
    )
    resp = client.get("/attendance/my?month=2026-04", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["records"]) == 2
    assert body["summary"]["work_days"] == 1
    assert body["summary"]["vacation_days"] == 1
    assert body["summary"]["total_hours"] == 8.0


def test_submit_month(client) -> None:
    _, headers = _auth(client)
    client.post(
        "/attendance",
        json={
            "date": "2026-04-15",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=headers,
    )
    resp = client.post("/attendance/month/2026-04/submit", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["approval_status"] == "submitted"
    assert body["records"][0]["status"] == "submitted"


def test_update_and_delete(client) -> None:
    _, headers = _auth(client)
    create = client.post(
        "/attendance",
        json={
            "date": "2026-04-20",
            "check_in": "09:00:00",
            "check_out": "17:00:00",
            "day_type": "work",
        },
        headers=headers,
    ).json()
    rid = create["id"]
    upd = client.put(
        f"/attendance/{rid}",
        json={"check_out": "18:00:00"},
        headers=headers,
    )
    assert upd.status_code == 200
    assert upd.json()["total_hours"] == 9.0

    dele = client.delete(f"/attendance/{rid}", headers=headers)
    assert dele.status_code == 200
