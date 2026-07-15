import csv
import base64
import hashlib
import hmac
import io
import json
import os
import secrets
import time
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Literal
from urllib.parse import quote

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


def load_local_env() -> None:
    candidates = [
        Path.cwd() / ".env.local",
        Path(__file__).resolve().parent.parent / ".env.local",
    ]
    for env_path in candidates:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

app = FastAPI(title="B2B Inventory Allocation API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BuyerCreate(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=6, max_length=128)
    role: Literal["buyer", "admin"] = "buyer"


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=1, max_length=128)


class AuctionCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=80)
    product_name: str = Field(min_length=1, max_length=160)
    product_image: str | None = None
    inventory: int = Field(gt=0)
    start_time: datetime
    end_time: datetime
    status: Literal["draft", "active", "closed"] = "draft"


class AuctionUpdate(BaseModel):
    sku: str | None = None
    product_name: str | None = None
    product_image: str | None = None
    inventory: int | None = Field(default=None, gt=0)
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: Literal["draft", "active", "closed"] | None = None


class BidIn(BaseModel):
    premium: Decimal = Field(ge=0, le=999)
    quantity: int = Field(gt=0)


def require_env() -> None:
    missing = [
        key
        for key, value in {
            "SUPABASE_URL": SUPABASE_URL,
            "SUPABASE_ANON_KEY": SUPABASE_ANON_KEY,
            "SUPABASE_SERVICE_ROLE_KEY": SUPABASE_SERVICE_ROLE_KEY,
        }.items()
        if not value
    ]
    if missing:
        raise HTTPException(500, f"Missing environment variables: {', '.join(missing)}")


def service_headers(prefer: str | None = None) -> dict[str, str]:
    require_env()
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


async def rest(method: str, path: str, json: Any | None = None, prefer: str | None = None) -> Any:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.request(
            method,
            f"{SUPABASE_URL}/rest/v1/{path}",
            headers=service_headers(prefer),
            json=json,
        )
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, resp.text)
    if not resp.content:
        return None
    return resp.json()


def eq(field: str, value: str) -> str:
    return f"{field}=eq.{quote(str(value), safe='')}"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def auth_secret() -> bytes:
    secret = os.getenv("APP_SECRET") or SUPABASE_SERVICE_ROLE_KEY
    if not secret:
        raise HTTPException(500, "Missing APP_SECRET or SUPABASE_SERVICE_ROLE_KEY")
    return secret.encode("utf-8")


def hash_password(password: str) -> str:
    salt = secrets.token_urlsafe(18)
    iterations = 260000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${b64url(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations, salt, digest = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
        return hmac.compare_digest(b64url(candidate), digest)
    except ValueError:
        return False


def issue_token(user_id: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": user_id, "exp": int(time.time()) + 60 * 60 * 24 * 7}
    signing_input = f"{b64url(json.dumps(header, separators=(',', ':')).encode())}.{b64url(json.dumps(payload, separators=(',', ':')).encode())}"
    signature = hmac.new(auth_secret(), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{b64url(signature)}"


def verify_token(token: str) -> str:
    try:
        header, payload, signature = token.split(".", 2)
        signing_input = f"{header}.{payload}"
        expected = hmac.new(auth_secret(), signing_input.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(b64url(expected), signature):
            raise HTTPException(401, "Invalid token")
        data = json.loads(b64url_decode(payload))
        if int(data.get("exp", 0)) < int(time.time()):
            raise HTTPException(401, "Session expired")
        return str(data["sub"])
    except (KeyError, ValueError, json.JSONDecodeError):
        raise HTTPException(401, "Invalid token")


async def current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    require_env()
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")

    user_id = verify_token(authorization.split(" ", 1)[1])
    buyers = await rest("GET", f"buyers?{eq('id', user_id)}&limit=1")
    if not buyers:
        raise HTTPException(401, "User not found")
    user = buyers[0]
    user.pop("password_hash", None)
    return user


async def admin_user(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def normalize_decimal(value: Any) -> float:
    return float(value or 0)


def mask_username(username: str | None) -> str:
    if not username:
        return ""
    if len(username) == 1:
        return username
    return f"{'*' * (len(username) - 1)}{username[-1]}"


async def auction_summary(auction: dict[str, Any], buyer_id: str | None = None) -> dict[str, Any]:
    bids = await rest("GET", f"bids?{eq('auction_id', auction['id'])}")
    my_bid = next((bid for bid in bids if buyer_id and bid["buyer_id"] == buyer_id), None)
    return {
        **auction,
        "highest_premium": max([normalize_decimal(b["premium"]) for b in bids], default=0),
        "total_demand": sum(int(b["quantity"]) for b in bids),
        "bid_count": len(bids),
        "my_bid": my_bid,
    }


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"ok": "true"}


@app.post("/api/auth/register")
async def register(payload: RegisterIn) -> dict[str, Any]:
    username = payload.username.strip()
    existing = await rest("GET", f"buyers?{eq('username', username)}&limit=1")
    if existing:
        raise HTTPException(409, "Username already exists")
    count_rows = await rest("GET", "buyers?select=id")
    role = "admin" if not count_rows else "buyer"
    result = await rest(
        "POST",
        "buyers",
        {"username": username, "password_hash": hash_password(payload.password), "role": role},
        "return=representation",
    )
    user = result[0]
    user.pop("password_hash", None)
    return {"token": issue_token(user["id"]), "user": user}


@app.post("/api/auth/login")
async def login(payload: LoginIn) -> dict[str, Any]:
    rows = await rest("GET", f"buyers?{eq('username', payload.username.strip())}&limit=1")
    if not rows or not verify_password(payload.password, rows[0].get("password_hash", "")):
        raise HTTPException(401, "Invalid username or password")
    user = rows[0]
    user.pop("password_hash", None)
    return {"token": issue_token(user["id"]), "user": user}


@app.get("/api/me")
async def me(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return user


@app.get("/api/auctions")
async def auctions(user: dict[str, Any] = Depends(current_user)) -> list[dict[str, Any]]:
    if user.get("role") == "admin":
        rows = await rest("GET", "auctions?order=start_time.desc")
    else:
        rows = await rest("GET", "auctions?status=eq.active&order=end_time.asc")
    return [await auction_summary(row, user["id"]) for row in rows]


@app.get("/api/auctions/{auction_id}")
async def auction_detail(auction_id: str, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    rows = await rest("GET", f"auctions?{eq('id', auction_id)}&limit=1")
    if not rows:
        raise HTTPException(404, "Auction not found")
    auction = await auction_summary(rows[0], user["id"])
    bids = await rest(
        "GET",
        f"bids?{eq('auction_id', auction_id)}&select=*,buyers(username)&order=premium.desc,updated_at.asc",
    )
    leaderboard = []
    for bid in bids:
        buyer = bid.get("buyers") or {}
        username = buyer.get("username")
        row = {
            "id": bid["id"],
            "username": username if user.get("role") == "admin" else mask_username(username),
            "premium": normalize_decimal(bid["premium"]),
            "quantity": bid["quantity"],
            "updated_at": bid["updated_at"],
            "is_mine": bid["buyer_id"] == user["id"],
        }
        if user.get("role") == "admin":
            row["buyer_id"] = bid["buyer_id"]
        leaderboard.append(row)
    return {"auction": auction, "leaderboard": leaderboard}


@app.post("/api/auctions/{auction_id}/bid")
async def upsert_bid(auction_id: str, payload: BidIn, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    rows = await rest("GET", f"auctions?{eq('id', auction_id)}&limit=1")
    if not rows:
        raise HTTPException(404, "Auction not found")
    auction = rows[0]
    start = datetime.fromisoformat(auction["start_time"].replace("Z", "+00:00"))
    end = datetime.fromisoformat(auction["end_time"].replace("Z", "+00:00"))
    if auction["status"] != "active" or now_utc() < start or now_utc() > end:
        raise HTTPException(400, "Auction is not open for bidding")

    existing = await rest("GET", f"bids?{eq('auction_id', auction_id)}&{eq('buyer_id', user['id'])}&limit=1")
    data = {
        "auction_id": auction_id,
        "buyer_id": user["id"],
        "premium": str(payload.premium),
        "quantity": payload.quantity,
        "updated_at": now_utc().isoformat(),
    }
    if existing:
        result = await rest("PATCH", f"bids?{eq('id', existing[0]['id'])}", data, "return=representation")
    else:
        result = await rest("POST", "bids", data, "return=representation")
    return result[0]


@app.get("/api/admin/buyers")
async def list_buyers(_: dict[str, Any] = Depends(admin_user)) -> list[dict[str, Any]]:
    rows = await rest("GET", "buyers?order=created_at.desc")
    for row in rows:
        row.pop("password_hash", None)
    return rows


@app.post("/api/admin/buyers")
async def create_buyer(payload: BuyerCreate, _: dict[str, Any] = Depends(admin_user)) -> dict[str, Any]:
    username = payload.username.strip()
    existing = await rest("GET", f"buyers?{eq('username', username)}&limit=1")
    if existing:
        raise HTTPException(409, "Username already exists")
    result = await rest(
        "POST",
        "buyers",
        {
            "username": username,
            "password_hash": hash_password(payload.password),
            "role": payload.role,
        },
        "return=representation",
    )
    user = result[0]
    user.pop("password_hash", None)
    return user


@app.post("/api/admin/auctions")
async def create_auction(payload: AuctionCreate, _: dict[str, Any] = Depends(admin_user)) -> dict[str, Any]:
    result = await rest("POST", "auctions", payload.model_dump(mode="json"), "return=representation")
    return result[0]


@app.patch("/api/admin/auctions/{auction_id}")
async def update_auction(auction_id: str, payload: AuctionUpdate, _: dict[str, Any] = Depends(admin_user)) -> dict[str, Any]:
    data = {key: value for key, value in payload.model_dump(mode="json").items() if value is not None}
    result = await rest("PATCH", f"auctions?{eq('id', auction_id)}", data, "return=representation")
    if not result:
        raise HTTPException(404, "Auction not found")
    return result[0]


@app.post("/api/admin/auctions/{auction_id}/close")
async def close_auction(auction_id: str, _: dict[str, Any] = Depends(admin_user)) -> dict[str, Any]:
    result = await rest("PATCH", f"auctions?{eq('id', auction_id)}", {"status": "closed"}, "return=representation")
    if not result:
        raise HTTPException(404, "Auction not found")
    return result[0]


@app.post("/api/admin/auctions/{auction_id}/allocate")
async def allocate(auction_id: str, _: dict[str, Any] = Depends(admin_user)) -> list[dict[str, Any]]:
    auctions = await rest("GET", f"auctions?{eq('id', auction_id)}&limit=1")
    if not auctions:
        raise HTTPException(404, "Auction not found")
    inventory = int(auctions[0]["inventory"])
    bids = await rest(
        "GET",
        f"bids?{eq('auction_id', auction_id)}&select=*,buyers(username)&order=premium.desc,updated_at.asc",
    )
    await rest("DELETE", f"allocations?{eq('auction_id', auction_id)}")
    rows = []
    remaining = inventory
    for bid in bids:
        allocated = min(int(bid["quantity"]), remaining)
        remaining -= allocated
        rows.append(
            {
                "auction_id": auction_id,
                "bid_id": bid["id"],
                "buyer_id": bid["buyer_id"],
                "allocated_quantity": allocated,
            }
        )
    if rows:
        await rest("POST", "allocations", rows, "return=minimal")
    return [
        {
            **row,
            "username": (bid.get("buyers") or {}).get("username"),
            "premium": normalize_decimal(bid["premium"]),
            "requested_quantity": bid["quantity"],
        }
        for row, bid in zip(rows, bids)
    ]


@app.get("/api/admin/auctions/{auction_id}/export.csv")
async def export_csv(auction_id: str, _: dict[str, Any] = Depends(admin_user)) -> Response:
    detail = await auction_detail(auction_id, {"id": "", "role": "admin"})
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Username", "Premium", "Requested Quantity", "Updated At"])
    for row in detail["leaderboard"]:
        writer.writerow([row.get("username"), row["premium"], row["quantity"], row["updated_at"]])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="auction-{auction_id}.csv"'},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.index:app", host="127.0.0.1", port=8000, reload=True)
