from __future__ import annotations

from pathlib import Path


def _load_env_file(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    env_path = root / ".env.frontend"
    if not env_path.exists():
        raise SystemExit("Missing .env.frontend. Create it with WIDI_API_URL=<backend url>.")

    env = _load_env_file(env_path)
    api_url = env.get("WIDI_API_URL", "").strip()
    if not api_url:
        raise SystemExit("WIDI_API_URL is required in .env.frontend.")

    target = root / "frontend" / "static" / "env.js"
    target.write_text(
        f'window.__WIDI_ENV__ = {{\n  API_URL: "{api_url}",\n}};\n',
        encoding="utf-8",
    )
    print(f"Wrote {target}")


if __name__ == "__main__":
    main()
