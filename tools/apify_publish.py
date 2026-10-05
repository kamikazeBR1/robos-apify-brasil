#!/usr/bin/env python3
"""Define o preço por evento (tools/pricing.json) e publica os Actors na Apify Store.

Uso: python3 tools/apify_publish.py [--check]   (--check só testa se a conta já pode cobrar)
Sai com código 2 se a Apify ainda exigir os dados de recebimento do dono da conta.
"""
import json, os, sys, pathlib, requests

API = "https://api.apify.com/v2"
S = requests.Session()
if os.environ.get("APIFY_TOKEN"):
    S.headers["Authorization"] = f"Bearer {os.environ['APIFY_TOKEN']}"
PRICING = json.loads((pathlib.Path(__file__).parent / "pricing.json").read_text())


def put(actor, body):
    return S.put(f"{API}/acts/{actor}", json=body, timeout=60)


def main():
    me = S.get(f"{API}/users/me", timeout=60).json()["data"]["username"]
    check = "--check" in sys.argv
    for name, events in PRICING.items():
        actor = f"{me}~{name}"
        r = put(actor, {"pricingInfos": [{"pricingModel": "PAY_PER_EVENT", "pricingPerEvent": {"actorChargeEvents": events}}]})
        if r.status_code >= 400:
            if "payout" in r.text:
                print("Faltam os dados de recebimento na Apify:", r.json()["error"]["message"])
                sys.exit(2)
            sys.exit(f"{name}: {r.status_code} {r.text[:500]}")
        print(name, "preço definido")
        if check:
            return
        r = put(actor, {"isPublic": True})
        print(name, "publicado" if r.ok else f"falhou ao publicar: {r.status_code} {r.text[:500]}")
        if not r.ok:
            sys.exit(3)


if __name__ == "__main__":
    main()
