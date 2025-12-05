import os
import sys
from fastapi.testclient import TestClient

# Ensure project root (where main.py lives) is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from main import app  # noqa: E402

client = TestClient(app)


def test_root():
    """Basic health check on root endpoint."""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "status" in data
    assert "K&R Pricing API" in data["status"]


def test_customers_endpoint():
    """Ensure /customers returns a list of customers."""
    resp = client.get("/customers")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "id" in first
    assert isinstance(first["id"], str)


def test_items_endpoint():
    """Ensure /items returns a list of items (SKUs)."""
    resp = client.get("/items")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "sku" in first
    assert isinstance(first["sku"], str)


def test_quote_basic_stock_line():
    """
    Full integration test:
    - pick first customer
    - pick first SKU
    - send a simple stock quote
    - verify pricing fields exist and look sane
    """
    # Get a customer
    cust_resp = client.get("/customers")
    assert cust_resp.status_code == 200
    customers = cust_resp.json()
    assert customers, "No customers returned from /customers"
    customer_id = customers[0]["id"]

    # Get an item
    item_resp = client.get("/items")
    assert item_resp.status_code == 200
    items = item_resp.json()
    assert items, "No items returned from /items"
    sku = items[0]["sku"]

    payload = {
        "customer_id": customer_id,
        "include_freight": True,
        "lines": [
            {
                "type": "stock",
                "sku": sku,
                "quantity": 5,
            }
        ],
    }

    quote_resp = client.post("/quote", json=payload)
    assert quote_resp.status_code == 200

    quote = quote_resp.json()
    # Basic shape checks
    assert quote["customer_id"] == customer_id
    assert isinstance(quote["include_freight"], bool)
    assert isinstance(quote["quote_total"], (int, float))

    lines = quote["lines"]
    assert isinstance(lines, list)
    assert len(lines) == 1

    line = lines[0]
    for key in [
        "type",
        "quantity",
        "weight_per_unit",
        "base_cost_per_unit",
        "sell_price_per_unit",
        "extended_sell_price",
        "total_column",
    ]:
        assert key in line, f"Missing key on line: {key}"

    assert line["quantity"] == 5
    assert line["sell_price_per_unit"] > 0
    assert line["extended_sell_price"] > 0
    assert line["total_column"] >= 1


def test_quote_history_endpoints():
    """
    Ensure that quotes are logged and retrievable via /quotes and /quotes/{id}.
    """
    # First, create a quote to ensure at least one exists
    cust_resp = client.get("/customers")
    assert cust_resp.status_code == 200
    customers = cust_resp.json()
    assert customers
    customer_id = customers[0]["id"]

    item_resp = client.get("/items")
    assert item_resp.status_code == 200
    items = item_resp.json()
    assert items
    sku = items[0]["sku"]

    payload = {
        "customer_id": customer_id,
        "include_freight": False,
        "lines": [
            {
                "type": "stock",
                "sku": sku,
                "quantity": 3,
            }
        ],
    }

    quote_resp = client.post("/quote", json=payload)
    assert quote_resp.status_code == 200

    # Now check /quotes
    list_resp = client.get("/quotes")
    assert list_resp.status_code == 200
    quotes = list_resp.json()
    assert isinstance(quotes, list)
    assert len(quotes) > 0

    last = quotes[-1]
    assert "id" in last
    assert "quote_total" in last
    assert "customer_id" in last
    assert "num_lines" in last

    quote_id = last["id"]

    # Fetch single quote
    single_resp = client.get(f"/quotes/{quote_id}")
    assert single_resp.status_code == 200
    full = single_resp.json()

    assert full["id"] == quote_id
    assert full["customer_id"] == customer_id
    assert isinstance(full["lines"], list)
    assert len(full["lines"]) >= 1

    # Round-trip consistency on quote_total
    assert abs(full["quote_total"] - last["quote_total"]) < 1e-6
