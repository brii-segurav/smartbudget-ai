from datetime import date, datetime, timedelta
from typing import Literal
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from email.message import EmailMessage
from urllib.parse import urlencode
import hashlib
import smtplib
import ssl
import json
import sqlite3
import os
import secrets
import warnings
import jwt
from pwdlib import PasswordHash
from openai import OpenAI, OpenAIError

app = FastAPI()

# Configuración estricta de CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
origins.extend(
    origin.strip()
    for origin in os.environ.get("SMARTBUDGET_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar Base de Datos SQLite
DB_NAME = os.environ.get("SMARTBUDGET_DB_PATH", "smartbudget.db")
JWT_SECRET_KEY = os.environ.get("SMARTBUDGET_SECRET_KEY")
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = secrets.token_urlsafe(48)
    warnings.warn(
        "SMARTBUDGET_SECRET_KEY is not set; sessions will expire when the server restarts.",
        RuntimeWarning,
    )

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)
ACCESS_TOKEN_LIFETIME = timedelta(hours=12)

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            gender TEXT NOT NULL DEFAULT 'neutral',
            language TEXT NOT NULL DEFAULT 'es',
            currency_code TEXT NOT NULL DEFAULT 'USD',
            custom_symbol TEXT,
            token_version INTEGER NOT NULL DEFAULT 0
        )
    ''')
    user_columns = {row[1] for row in cursor.execute("PRAGMA table_info(users)").fetchall()}
    if "token_version" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            token_hash TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used_at TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            user_id INTEGER REFERENCES users(id)
        )
    ''')
    transaction_columns = {
        row[1] for row in cursor.execute("PRAGMA table_info(transactions)").fetchall()
    }
    if "date" not in transaction_columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN date TEXT NOT NULL DEFAULT ''")
    if "user_id" not in transaction_columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id)")

    budget_table = cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='budgets'"
    ).fetchone()
    if budget_table:
        budget_columns = {
            row[1] for row in cursor.execute("PRAGMA table_info(budgets)").fetchall()
        }
        if "user_id" not in budget_columns:
            legacy_table = cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='budgets_legacy'"
            ).fetchone()
            if legacy_table:
                raise RuntimeError("Both legacy and user-scoped budgets tables exist")
            cursor.execute("ALTER TABLE budgets RENAME TO budgets_legacy")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budgets (
            user_id INTEGER NOT NULL REFERENCES users(id),
            category TEXT NOT NULL,
            monthly_limit REAL NOT NULL CHECK (monthly_limit > 0),
            PRIMARY KEY (user_id, category)
        )
    ''')
    cursor.execute("CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id)")
    conn.commit()
    conn.close()

init_db()

# Modelos Pydantic
class TransactionCreate(BaseModel):
    description: str
    amount: float
    category: str
    type: str
    date: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    description: str
    amount: float
    category: str
    type: str
    date: str

class BudgetCreate(BaseModel):
    category: str = Field(min_length=1)
    monthly_limit: float = Field(gt=0)

class BudgetStatusResponse(BaseModel):
    category: str
    monthly_limit: float
    spent: float
    percentage: float

class UserRegistration(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    gender: Literal["male", "female", "neutral"] = "neutral"
    language: Literal["es", "en"] = "es"
    currency_code: str = Field(default="USD", min_length=3, max_length=8)
    custom_symbol: Optional[str] = None

    @field_validator("first_name", "last_name", "phone")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> str:
        return str(value).strip().lower()

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> str:
        return str(value).strip().lower()

class PasswordResetRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> str:
        return str(value).strip().lower()

class PasswordResetCompletion(BaseModel):
    token: str = Field(min_length=32, max_length=128)
    password: str = Field(min_length=8, max_length=128)

class AIInsightsRequest(BaseModel):
    lang: Literal["es", "en"] = "es"

class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    lang: Literal["es", "en"] = "es"
    history: List[ChatTurn] = Field(default_factory=list, max_length=12)

class UserProfileUpdate(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    gender: Literal["male", "female", "neutral"]
    language: Literal["es", "en"]
    currency_code: str = Field(min_length=3, max_length=8)
    custom_symbol: Optional[str] = None

    @field_validator("first_name", "last_name", "phone")
    @classmethod
    def strip_profile_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_profile_email(cls, value: object) -> str:
        return str(value).strip().lower()

def profile_from_row(row: tuple) -> dict:
    keys = ("id", "first_name", "last_name", "email", "phone", "gender", "language", "currency_code", "custom_symbol")
    return dict(zip(keys, row))

def issue_access_token(user_id: int, token_version: int = 0) -> str:
    now = datetime.utcnow()
    return jwt.encode(
        {"sub": str(user_id), "ver": token_version, "iat": now, "exp": now + ACCESS_TOKEN_LIFETIME},
        JWT_SECRET_KEY,
        algorithm="HS256",
    )

def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> int:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired session", headers={"WWW-Authenticate": "Bearer"})

    conn = sqlite3.connect(DB_NAME)
    try:
        user = conn.execute("SELECT token_version FROM users WHERE id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    if not user or payload.get("ver") != user[0]:
        raise HTTPException(status_code=401, detail="Account no longer exists", headers={"WWW-Authenticate": "Bearer"})
    return user_id

@app.post("/api/auth/register", status_code=201)
def register_user(user: UserRegistration):
    conn = sqlite3.connect(DB_NAME)
    try:
        existing_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        cursor = conn.execute(
            """
            INSERT INTO users
                (first_name, last_name, email, phone, password_hash, gender, language, currency_code, custom_symbol)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user.first_name,
                user.last_name,
                user.email,
                user.phone,
                password_hash.hash(user.password),
                user.gender,
                user.language,
                user.currency_code,
                user.custom_symbol,
            ),
        )
        user_id = cursor.lastrowid
        if existing_users == 0:
            conn.execute("UPDATE transactions SET user_id = ? WHERE user_id IS NULL", (user_id,))
            legacy_budgets = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='budgets_legacy'"
            ).fetchone()
            if legacy_budgets:
                conn.execute(
                    """
                    INSERT INTO budgets (user_id, category, monthly_limit)
                    SELECT ?, category, monthly_limit FROM budgets_legacy
                    """,
                    (user_id,),
                )
                conn.execute("DROP TABLE budgets_legacy")
        conn.commit()
        profile = conn.execute(
            "SELECT id, first_name, last_name, email, phone, gender, language, currency_code, custom_symbol FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    except sqlite3.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    except sqlite3.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Could not create account: {e}")
    finally:
        conn.close()
    return {"access_token": issue_access_token(user_id), "token_type": "bearer", "user": profile_from_row(profile)}

@app.post("/api/auth/login")
def login_user(credentials: UserLogin):
    email = str(credentials.email).strip().lower()
    entered_password = credentials.password
    conn = sqlite3.connect(DB_NAME)
    try:
        row = conn.execute(
            "SELECT id, password_hash, first_name, last_name, email, phone, gender, language, currency_code, custom_symbol, token_version FROM users WHERE email = ? COLLATE NOCASE",
            (email,),
        ).fetchone()
    finally:
        conn.close()
    if not row or not password_hash.verify(entered_password, row[1]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    profile = (row[0], *row[2:])
    return {"access_token": issue_access_token(row[0], row[10]), "token_type": "bearer", "user": profile_from_row(profile)}

def deliver_password_reset(email: str, token: str) -> bool:
    frontend_url = os.environ.get("SMARTBUDGET_FRONTEND_URL", "http://localhost:5173/dashboard")
    reset_url = f"{frontend_url}?{urlencode({'reset_token': token})}"
    smtp_host = os.environ.get("SMARTBUDGET_SMTP_HOST")
    email_mode = os.environ.get("SMARTBUDGET_EMAIL_MODE", "disabled").lower()

    if not smtp_host:
        if email_mode == "console" and os.environ.get("SMARTBUDGET_ENV", "development") != "production":
            print(f"Development password reset link: {reset_url}")
            return True
        return False

    message = EmailMessage()
    message["Subject"] = "Reset your SmartBudget password"
    message["From"] = os.environ.get("SMARTBUDGET_SMTP_FROM", os.environ.get("SMARTBUDGET_SMTP_USERNAME", ""))
    message["To"] = email
    message.set_content(
        "We received a request to reset your SmartBudget password. "
        f"Open this one-time link within 30 minutes: {reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )

    try:
        with smtplib.SMTP(smtp_host, int(os.environ.get("SMARTBUDGET_SMTP_PORT", "587")), timeout=10) as server:
            server.ehlo()
            if os.environ.get("SMARTBUDGET_SMTP_STARTTLS", "true").lower() == "true":
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            username = os.environ.get("SMARTBUDGET_SMTP_USERNAME")
            password = os.environ.get("SMARTBUDGET_SMTP_PASSWORD")
            if username and password:
                server.login(username, password)
            server.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError) as error:
        print(f"Password reset email delivery failed: {error}")
        return False

@app.post("/api/auth/forgot-password")
def request_password_reset(request: PasswordResetRequest):
    generic_response = {"message": "If an account exists for this email, a reset link will be sent."}
    now = datetime.utcnow()
    conn = sqlite3.connect(DB_NAME)
    try:
        row = conn.execute("SELECT id FROM users WHERE email = ? COLLATE NOCASE", (str(request.email),)).fetchone()
        if not row:
            return generic_response

        user_id = row[0]
        cutoff = (now - timedelta(hours=1)).isoformat()
        recent_requests = conn.execute(
            "SELECT COUNT(*) FROM password_reset_tokens WHERE user_id = ? AND created_at >= ?",
            (user_id, cutoff),
        ).fetchone()[0]
        if recent_requests >= 3:
            return generic_response

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        conn.execute(
            "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
            (now.isoformat(), user_id),
        )
        conn.execute(
            "INSERT INTO password_reset_tokens (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token_hash, user_id, now.isoformat(), (now + timedelta(minutes=30)).isoformat()),
        )
        conn.commit()
    except sqlite3.Error as error:
        conn.rollback()
        print(f"Could not create password reset token: {error}")
        return generic_response
    finally:
        conn.close()

    if not deliver_password_reset(str(request.email), token):
        conn = sqlite3.connect(DB_NAME)
        try:
            conn.execute("DELETE FROM password_reset_tokens WHERE token_hash = ?", (token_hash,))
            conn.commit()
        finally:
            conn.close()
        print("Password reset requested, but email delivery is not configured.")
    return generic_response

@app.post("/api/auth/reset-password")
def reset_password(request: PasswordResetCompletion):
    token_hash = hashlib.sha256(request.token.encode("utf-8")).hexdigest()
    now = datetime.utcnow()
    new_password_hash = password_hash.hash(request.password)
    conn = sqlite3.connect(DB_NAME)
    try:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute(
            "SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?",
            (token_hash,),
        ).fetchone()
        if not row or row[2] is not None or datetime.fromisoformat(row[1]) <= now:
            conn.rollback()
            raise HTTPException(status_code=400, detail="Reset link is invalid or expired")
        user_id = row[0]
        conn.execute(
            "UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?",
            (new_password_hash, user_id),
        )
        conn.execute("UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL", (now.isoformat(), user_id))
        conn.commit()
    except sqlite3.Error as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Could not reset password: {error}")
    finally:
        conn.close()
    return {"message": "Password updated. Sign in with your new password."}

@app.get("/api/auth/me")
def get_profile(user_id: int = Depends(get_current_user_id)):
    conn = sqlite3.connect(DB_NAME)
    try:
        row = conn.execute(
            "SELECT id, first_name, last_name, email, phone, gender, language, currency_code, custom_symbol FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    finally:
        conn.close()
    return profile_from_row(row)

@app.put("/api/auth/profile")
def update_profile(profile: UserProfileUpdate, user_id: int = Depends(get_current_user_id)):
    conn = sqlite3.connect(DB_NAME)
    try:
        conn.execute(
            """
            UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?,
                             language = ?, currency_code = ?, custom_symbol = ?
            WHERE id = ?
            """,
            (
                profile.first_name,
                profile.last_name,
                profile.email,
                profile.phone,
                profile.gender,
                profile.language,
                profile.currency_code,
                profile.custom_symbol,
                user_id,
            ),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, first_name, last_name, email, phone, gender, language, currency_code, custom_symbol FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    except sqlite3.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Could not update profile: {e}")
    finally:
        conn.close()
    return profile_from_row(row)

@app.get("/api/transactions", response_model=List[TransactionResponse])
def get_transactions(user_id: int = Depends(get_current_user_id)):
    try:
        conn = sqlite3.connect(DB_NAME)
        try:
            rows = conn.execute(
                "SELECT id, description, amount, category, type, date FROM transactions WHERE user_id = ? ORDER BY id DESC",
                (user_id,),
            ).fetchall()
        finally:
            conn.close()
        result = []
        for row in rows:
            result.append({
                "id": row[0],
                "description": row[1],
                "amount": row[2],
                "category": row[3],
                "type": row[4],
                "date": row[5]
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch transactions: {e}")

@app.post("/api/transactions", response_model=TransactionResponse)
def create_transaction(tx: TransactionCreate, user_id: int = Depends(get_current_user_id)):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        date_str = tx.date if tx.date else "2026-09-28"
        cursor.execute(
            "INSERT INTO transactions (description, amount, category, type, date, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            (tx.description, tx.amount, tx.category, tx.type, date_str, user_id)
        )
        conn.commit()
        tx_id = cursor.lastrowid
        conn.close()
        return {
            "id": tx_id,
            "description": tx.description,
            "amount": tx.amount,
            "category": tx.category,
            "type": tx.type,
            "date": date_str
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/transactions/{tx_id}")
def delete_transaction(tx_id: int, user_id: int = Depends(get_current_user_id)):
    try:
        conn = sqlite3.connect(DB_NAME)
        try:
            cursor = conn.execute(
                "DELETE FROM transactions WHERE id = ? AND user_id = ?",
                (tx_id, user_id),
            )
            conn.commit()
            deleted = cursor.rowcount > 0
        finally:
            conn.close()
        if not deleted:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted successfully"}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/budgets", response_model=List[BudgetStatusResponse])
def get_budgets(month: Optional[str] = None, user_id: int = Depends(get_current_user_id)):
    period = month or date.today().strftime("%Y-%m")
    try:
        datetime.strptime(period, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="month must use YYYY-MM format")

    year, month_number = (int(part) for part in period.split("-"))
    next_month = date(year + (month_number == 12), month_number % 12 + 1, 1)
    start_date = f"{period}-01"
    end_date = next_month.isoformat()

    try:
        conn = sqlite3.connect(DB_NAME)
        try:
            rows = conn.execute(
                """
                SELECT b.category, b.monthly_limit,
                       COALESCE(SUM(t.amount), 0) AS spent
                FROM budgets b
                LEFT JOIN transactions t
                                    ON t.user_id = b.user_id AND t.category = b.category
                 AND t.type = 'expense'
                 AND t.date >= ? AND t.date < ?
                                WHERE b.user_id = ?
                GROUP BY b.category, b.monthly_limit
                ORDER BY b.category
                """,
                (start_date, end_date, user_id),
            ).fetchall()
        finally:
            conn.close()
        return [
            {
                "category": category,
                "monthly_limit": monthly_limit,
                "spent": spent,
                "percentage": spent / monthly_limit * 100,
            }
            for category, monthly_limit, spent in rows
        ]
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Could not load budgets: {e}")

@app.post("/api/budgets", response_model=BudgetCreate)
def save_budget(budget: BudgetCreate, user_id: int = Depends(get_current_user_id)):
    category = budget.category.strip()
    if not category:
        raise HTTPException(status_code=422, detail="category cannot be blank")
    try:
        conn = sqlite3.connect(DB_NAME)
        try:
            conn.execute(
                """
                INSERT INTO budgets (user_id, category, monthly_limit) VALUES (?, ?, ?)
                ON CONFLICT(user_id, category) DO UPDATE SET monthly_limit = excluded.monthly_limit
                """,
                (user_id, category, budget.monthly_limit),
            )
            conn.commit()
        finally:
            conn.close()
        return {"category": category, "monthly_limit": budget.monthly_limit}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Could not save budget: {e}")

@app.delete("/api/budgets/{category}")
def delete_budget(category: str, user_id: int = Depends(get_current_user_id)):
    try:
        conn = sqlite3.connect(DB_NAME)
        try:
            cursor = conn.execute("DELETE FROM budgets WHERE category = ? AND user_id = ?", (category, user_id))
            conn.commit()
            deleted = cursor.rowcount > 0
        finally:
            conn.close()
        if not deleted:
            raise HTTPException(status_code=404, detail="Budget not found")
        return {"message": "Budget deleted successfully"}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Could not delete budget: {e}")

def get_ai_financial_summary(user_id: int) -> dict:
    today = date.today().replace(day=1)
    start_month_index = today.year * 12 + today.month - 1 - 5
    first_month = date(start_month_index // 12, start_month_index % 12 + 1, 1)
    next_month = date(today.year + (today.month == 12), today.month % 12 + 1, 1)
    conn = sqlite3.connect(DB_NAME)
    try:
        monthly_totals = conn.execute(
            """
            SELECT substr(date, 1, 7), type, SUM(amount)
            FROM transactions
            WHERE user_id = ? AND date >= ? AND date < ?
            GROUP BY substr(date, 1, 7), type
            ORDER BY substr(date, 1, 7)
            """,
            (user_id, first_month.isoformat(), next_month.isoformat()),
        ).fetchall()
        category_totals = conn.execute(
            """
            SELECT category, SUM(amount)
            FROM transactions
            WHERE user_id = ? AND type = 'expense' AND date >= ? AND date < ?
            GROUP BY category ORDER BY SUM(amount) DESC
            """,
            (user_id, today.isoformat(), next_month.isoformat()),
        ).fetchall()
        budgets = conn.execute(
            "SELECT category, monthly_limit FROM budgets WHERE user_id = ? ORDER BY category",
            (user_id,),
        ).fetchall()
    finally:
        conn.close()

    return {
        "period": {"from": first_month.isoformat(), "to": today.isoformat()},
        "monthly_totals": [
            {"month": month, "type": transaction_type, "total": round(total, 2)}
            for month, transaction_type, total in monthly_totals
        ],
        "current_month_expenses_by_category": [
            {"category": category, "total": round(total, 2)}
            for category, total in category_totals
        ],
        "monthly_budgets": [
            {"category": category, "limit": round(limit, 2)}
            for category, limit in budgets
        ],
    }

def get_openai_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI is not configured. Set OPENAI_API_KEY on the backend.")
    return OpenAI(api_key=api_key)

@app.post("/api/ai-insights")
def create_ai_insights(
    request: AIInsightsRequest,
    user_id: int = Depends(get_current_user_id),
):
    summary = get_ai_financial_summary(user_id)
    language = "Spanish" if request.lang == "es" else "English"
    try:
        completion = get_openai_client().chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a personal budgeting assistant. Give cautious, practical observations, "
                        "not investment, tax, or legal advice. Use only the supplied aggregate financial data. "
                        f"Respond in {language} as JSON with integer health_score (0-100), short status, "
                        "and 2-4 concise recommendations (array of strings)."
                    ),
                },
                {"role": "user", "content": str(summary)},
            ],
            timeout=20,
        )
        content = completion.choices[0].message.content or "{}"
        result = json.loads(content)
        score = max(0, min(100, int(result["health_score"])))
        status = str(result["status"])[:120]
        recommendations = [str(item)[:300] for item in result["recommendations"][:4]]
        if len(recommendations) < 2:
            raise ValueError("Expected at least two recommendations")
        return {"health_score": score, "status": status, "recommendations": recommendations}
    except HTTPException:
        raise
    except (OpenAIError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        print(f"AI insight generation failed: {error}")
        raise HTTPException(status_code=502, detail="Could not generate financial insights right now")

@app.post("/api/chat")
def chat_with_budget_assistant(
    request: ChatRequest,
    user_id: int = Depends(get_current_user_id),
):
    summary = get_ai_financial_summary(user_id)
    language = "Spanish" if request.lang == "es" else "English"
    messages = [
        {
            "role": "system",
            "content": (
                "You are SmartBudget, a concise personal-budgeting assistant. "
                "Answer only in the user's selected language. Use the supplied aggregates for account-specific answers; "
                "never claim access to individual transaction descriptions. Do not give investment, tax, or legal advice. "
                f"Selected language: {language}. This user's aggregate financial data: {summary}"
            ),
        },
    ]
    messages.extend({"role": turn.role, "content": turn.content} for turn in request.history[-10:])
    messages.append({"role": "user", "content": request.message})

    try:
        completion = get_openai_client().chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=messages,
            max_tokens=500,
            timeout=20,
        )
        response = completion.choices[0].message.content
        if not response:
            raise ValueError("The model returned an empty response")
        return {"reply": response[:3000]}
    except HTTPException:
        raise
    except (OpenAIError, ValueError) as error:
        print(f"Budget chat failed: {error}")
        raise HTTPException(status_code=502, detail="The assistant is unavailable right now")