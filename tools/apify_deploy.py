#!/usr/bin/env python3
"""Publica um Actor de actors/<nome> na conta Apify via API REST, compila e (opcional) roda um teste.

O token NUNCA fica aqui: ele vem de APIFY_TOKEN ou é injetado pelo proxy do ambiente.
Uso: python3 tools/apify_deploy.py actors/<nome> [--run input.json] [--memory 512]
"""
import json, os, sys, time, pathlib, argparse
import requests

API = "https://api.apify.com/v2"
S = requests.Session()
if os.environ.get("APIFY_TOKEN"):
    S.headers["Authorization"] = f"Bearer {os.environ['APIFY_TOKEN']}"

SKIP = {"node_modules", "storage", ".git", "test", "apify_storage"}


def call(method, path, **kw):
    r = S.request(method, API + path, timeout=120, **kw)
    if r.status_code >= 400:
        sys.exit(f"{method} {path} -> {r.status_code}: {r.text[:800]}")
    return r.json().get("data") if r.text else None


def source_files(root):
    files = []
    for p in sorted(root.rglob("*")):
        rel = p.relative_to(root)
        if p.is_dir() or any(part in SKIP for part in rel.parts):
            continue
        files.append({"name": str(rel), "format": "TEXT", "content": p.read_text()})
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("actor_dir")
    ap.add_argument("--run", help="arquivo JSON de input para um teste")
    ap.add_argument("--memory", type=int, default=512)
    ap.add_argument("--no-build", action="store_true")
    a = ap.parse_args()
    root = pathlib.Path(a.actor_dir)
    meta = json.loads((root / ".actor/actor.json").read_text())
    name = meta["name"]
    me = call("GET", "/users/me")
    actor_id = f"{me['username']}~{name}"
    version = {
        "versionNumber": meta.get("version", "0.1"),
        "sourceType": "SOURCE_FILES",
        "buildTag": "latest",
        "sourceFiles": source_files(root),
    }
    body = {"name": name, "title": meta.get("title"), "description": meta.get("description"),
            "categories": meta.get("categories"), "versions": [version],
            "defaultRunOptions": {"build": "latest", "timeoutSecs": 3600, "memoryMbytes": a.memory}}
    r = S.get(f"{API}/acts/{actor_id}", timeout=60)
    if r.status_code == 404:
        act = call("POST", "/acts", json=body)
        print("Criado", act["id"])
    else:
        act = call("PUT", f"/acts/{actor_id}", json=body)
        print("Atualizado", act["id"])
    if not a.no_build:
        b = call("POST", f"/acts/{act['id']}/builds?version={version['versionNumber']}&tag=latest&waitForFinish=60")
        while b["status"] in ("READY", "RUNNING"):
            time.sleep(5)
            b = call("GET", f"/actor-builds/{b['id']}")
        print("Build", b["status"], b.get("buildNumber"))
        if b["status"] != "SUCCEEDED":
            log = S.get(f"{API}/logs/{b['id']}", timeout=60).text
            sys.exit(log[-4000:])
    if a.run:
        inp = json.loads(pathlib.Path(a.run).read_text())
        run = call("POST", f"/acts/{act['id']}/runs?memory={a.memory}&waitForFinish=60", json=inp)
        while run["status"] in ("READY", "RUNNING"):
            time.sleep(5)
            run = call("GET", f"/actor-runs/{run['id']}")
        print("Run", run["status"], run["id"], "usd", run.get("usageTotalUsd"))
        print(S.get(f"{API}/logs/{run['id']}", timeout=60).text[-3000:])
        items = S.get(f"{API}/datasets/{run['defaultDatasetId']}/items?limit=3&clean=1", timeout=60).json()
        print(json.dumps(items, ensure_ascii=False, indent=1)[:4000])


if __name__ == "__main__":
    main()
