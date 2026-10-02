"""Sincroniza predicciones MLB/NFL con la API PHP local de MiApp.

Ejemplo:
  set ORACLE_USERNAME=admin
  set ORACLE_PASSWORD=password
  python sync_oracle.py --nfl-totals nfl_totales.csv --nfl-props nfl_props.csv

El script no entrena modelos. Convierte las salidas ya generadas por los
modelos al contrato JSON de predictions.php y las guarda en MySQL mediante PHP.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request
from collections import OrderedDict
from datetime import datetime
from pathlib import Path
from typing import Any


def number(value: Any) -> float | None:
    if value is None or str(value).strip() in {"", "nan", "None"}:
        return None
    return float(value)


def integer(value: Any) -> int | None:
    numeric = number(value)
    return None if numeric is None else int(numeric)


def probability(value: Any) -> float | None:
    numeric = number(value)
    if numeric is None:
        return None
    return numeric / 100 if numeric > 1 else numeric


def as_datetime(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if len(text) == 10:
        return f"{text} 12:00:00"
    return text.replace("T", " ")[:19]


def request_json(url: str, method: str, payload: dict[str, Any], token: str | None = None) -> dict[str, Any]:
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API {error.code}: {detail}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"No fue posible conectar con {url}: {error.reason}") from error


def login(base_url: str, username: str, password: str) -> str:
    response = request_json(
        f"{base_url.rstrip('/')}/login.php",
        "POST",
        {"username": username, "password": password},
    )
    token = response.get("token")
    if not token:
        raise RuntimeError(response.get("message", "La API no devolvio un token."))
    return str(token)


def read_csv(path: str) -> list[dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def teams_from_game_id(game_id: str) -> tuple[str, str]:
    parts = game_id.split("_")
    if len(parts) >= 4:
        return parts[-2], parts[-1]
    return "AWAY", "HOME"


def game_container(
    games: OrderedDict[str, dict[str, Any]],
    *,
    game_id: str,
    sport: str,
    season: int,
    week: int | None,
    game_date: str,
    away: str,
    home: str,
) -> dict[str, Any]:
    key = f"{sport}:{game_id}"
    if key not in games:
        games[key] = {
            "externalGameId": game_id,
            "sport": sport,
            "season": season,
            "week": week,
            "gameDate": game_date,
            "awayTeam": away,
            "homeTeam": home,
            "status": "scheduled",
            "predictions": [],
        }
    return games[key]


def nfl_totals(path: str, games: OrderedDict[str, dict[str, Any]]) -> None:
    skipped = 0
    for row in read_csv(path):
        game_id = row["game_id"]
        game = game_container(
            games,
            game_id=game_id,
            sport="NFL",
            season=int(row["season"]),
            week=integer(row.get("week")),
            game_date=as_datetime(f"{row.get('gameday', '')} {row.get('gametime', '12:00')}"),
            away=row.get("away_team", "AWAY"),
            home=row.get("home_team", "HOME"),
        )
        game["venue"] = row.get("stadium") or None
        prediction = {
                "marketType": "GAME_TOTAL",
                "line": number(row.get("total_line")),
                "predictedValue": number(row.get("pred_total")),
                "selection": row.get("pick", "PASS"),
                "probability": probability(row.get("prob_pick")),
                "overProbability": probability(row.get("prob_over")),
                "underProbability": probability(row.get("prob_under")),
                "confidence": probability(row.get("prob_pick")),
                "edge": number(row.get("edge")),
                "odds": number(row.get("odds_pick")),
                "expectedValue": number(row.get("ev")),
                "pickStatus": row.get("estado", "NO PICK"),
                "calibrationMethod": "Calibracion OOS",
                "modelVersion": "NFL_TOTALS_2026",
                "notes": " | ".join(
                    value for value in [row.get("away_key_injuries"), row.get("home_key_injuries")] if value
                ) or None,
                "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        if prediction["line"] is None or prediction["probability"] is None or not prediction["selection"]:
            skipped += 1
            continue
        game["predictions"].append(prediction)
    if skipped:
        print(f"NFL totales: {skipped} filas incompletas omitidas.")


def nfl_props(path: str, games: OrderedDict[str, dict[str, Any]]) -> None:
    skipped = 0
    for row in read_csv(path):
        game_id = row["game_id"]
        away, home = teams_from_game_id(game_id)
        game = game_container(
            games,
            game_id=game_id,
            sport="NFL",
            season=int(row["season"]),
            week=integer(row.get("week")),
            game_date=as_datetime(row.get("gameday")),
            away=away,
            home=home,
        )
        prediction = {
                "marketType": row.get("tipo_prop", "PLAYER_PROP"),
                "participantName": row.get("player_name") or None,
                "line": number(row.get("linea")),
                "predictedValue": number(row.get("proyeccion")),
                "selection": row.get("seleccion", "PASS"),
                "probability": probability(row.get("probabilidad_pick")),
                "overProbability": probability(row.get("probabilidad_over")),
                "underProbability": probability(row.get("probabilidad_under")),
                "confidence": probability(row.get("probabilidad_pick")),
                "edge": number(row.get("edge")),
                "odds": number(row.get("cuota_pick")),
                "expectedValue": number(row.get("ev_estimado")),
                "pickStatus": row.get("estado_pick", "NO PICK"),
                "calibrationMethod": "Props calibrados",
                "modelVersion": "NFL_PROPS_2026",
                "injuryStatus": row.get("player_injury_status") or None,
                "notes": row.get("contexto_lesiones") or None,
                "generatedAt": as_datetime(row.get("timestamp_captura")),
            }
        if prediction["line"] is None or prediction["probability"] is None or not prediction["selection"]:
            skipped += 1
            continue
        game["predictions"].append(prediction)
    if skipped:
        print(f"NFL props: {skipped} filas incompletas omitidas.")


def mlb_csv(path: str, games: OrderedDict[str, dict[str, Any]]) -> None:
    """Importa la salida F5 normalizada.

    Columnas esperadas:
      game_id, game_date, season, away_team, home_team, line,
      predicted_value, selection, probability_pick, probability_over,
      probability_under, edge, odds, expected_value, pick_status,
      calibration_method, model_version, generated_at
    """
    skipped = 0
    for row in read_csv(path):
        game_id = row["game_id"]
        game = game_container(
            games,
            game_id=game_id,
            sport="MLB",
            season=int(row.get("season") or datetime.now().year),
            week=None,
            game_date=as_datetime(row.get("game_date")),
            away=row.get("away_team", "AWAY"),
            home=row.get("home_team", "HOME"),
        )
        prediction = {
                "marketType": "F5_TOTAL",
                "line": number(row.get("line")),
                "predictedValue": number(row.get("predicted_value")),
                "selection": row.get("selection", "PASS"),
                "probability": probability(row.get("probability_pick")),
                "overProbability": probability(row.get("probability_over")),
                "underProbability": probability(row.get("probability_under")),
                "confidence": probability(row.get("probability_pick")),
                "edge": number(row.get("edge")),
                "odds": number(row.get("odds")),
                "expectedValue": number(row.get("expected_value")),
                "pickStatus": row.get("pick_status", "NO PICK"),
                "calibrationMethod": row.get("calibration_method") or None,
                "modelVersion": row.get("model_version") or "MLB_F5_V8_1",
                "generatedAt": as_datetime(row.get("generated_at")),
            }
        if prediction["line"] is None or prediction["probability"] is None or not prediction["selection"]:
            skipped += 1
            continue
        game["predictions"].append(prediction)
    if skipped:
        print(f"MLB F5: {skipped} filas incompletas omitidas.")


def mlb_json(path: str, games: OrderedDict[str, dict[str, Any]]) -> None:
    content = json.loads(Path(path).read_text(encoding="utf-8"))
    source_games = content.get("games", content) if isinstance(content, dict) else content
    if not isinstance(source_games, list):
        raise ValueError("El JSON MLB debe contener un arreglo games.")
    for game in source_games:
        normalized = dict(game)
        normalized["sport"] = "MLB"
        games[f"MLB:{normalized['externalGameId']}"] = normalized


def post_sport(base_url: str, token: str, sport: str, games: list[dict[str, Any]]) -> None:
    if not games:
        return
    predictions = sum(len(game.get("predictions", [])) for game in games)
    versions = sorted(
        {
            str(prediction.get("modelVersion", "unknown"))
            for game in games
            for prediction in game.get("predictions", [])
        }
    )
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = {
        "run": {
            "sport": sport,
            "modelVersion": "+".join(versions) or "unknown",
            "status": "completed",
            "startedAt": now,
            "finishedAt": now,
        },
        "games": games,
    }
    response = request_json(f"{base_url.rstrip('/')}/predictions.php", "POST", payload, token)
    print(
        f"{sport}: {response.get('gamesProcessed', len(games))} juegos y "
        f"{response.get('predictionsProcessed', predictions)} predicciones sincronizadas."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Sincroniza el Oraculo con XAMPP.")
    parser.add_argument("--base-url", default=os.getenv("ORACLE_API_URL", "http://localhost/miapp-api"))
    parser.add_argument("--username", default=os.getenv("ORACLE_USERNAME"))
    parser.add_argument("--password", default=os.getenv("ORACLE_PASSWORD"))
    parser.add_argument("--mlb-csv")
    parser.add_argument("--mlb-json")
    parser.add_argument("--nfl-totals")
    parser.add_argument("--nfl-props")
    args = parser.parse_args()

    if not args.username or not args.password:
        parser.error("Define ORACLE_USERNAME y ORACLE_PASSWORD o usa --username y --password.")
    if not any([args.mlb_csv, args.mlb_json, args.nfl_totals, args.nfl_props]):
        parser.error("Indica al menos un archivo de predicciones.")

    games: OrderedDict[str, dict[str, Any]] = OrderedDict()
    if args.mlb_csv:
        mlb_csv(args.mlb_csv, games)
    if args.mlb_json:
        mlb_json(args.mlb_json, games)
    if args.nfl_totals:
        nfl_totals(args.nfl_totals, games)
    if args.nfl_props:
        nfl_props(args.nfl_props, games)

    token = login(args.base_url, args.username, args.password)
    for sport in ("MLB", "NFL"):
        selected = [game for game in games.values() if game.get("sport") == sport]
        post_sport(args.base_url, token, sport, selected)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, KeyError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
