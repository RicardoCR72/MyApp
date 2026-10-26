import csv
import json
from pathlib import Path

data_dir = Path("c:/MiApp/src/assets/data")
nfl_csv = data_dir / "nfl_totales.csv"

preds = []
id_counter = 1

# Process NFL Totales from real CSV
if nfl_csv.exists():
    with open(nfl_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            away = row.get("away_team", "").strip()
            home = row.get("home_team", "").strip()
            if not away or not home:
                continue

            try:
                line = float(row.get("total_line") or 45.0)
            except ValueError:
                line = 45.0

            try:
                pred_total = float(row.get("pred_total") or line)
            except ValueError:
                pred_total = line

            try:
                edge = float(row.get("edge") or 0.0)
            except ValueError:
                edge = 0.0

            pick = row.get("pick", "OVER").strip().upper()
            if pick not in ("OVER", "UNDER"):
                pick = "OVER" if pred_total > line else "UNDER"

            try:
                prob_pick = float(row.get("prob_pick") or 0.52)
            except ValueError:
                prob_pick = 0.52

            try:
                prob_over = float(row.get("prob_over") or 0.50)
            except ValueError:
                prob_over = 0.50

            try:
                prob_under = float(row.get("prob_under") or 0.50)
            except ValueError:
                prob_under = 0.50

            try:
                ev = float(row.get("ev") or 0.0)
            except ValueError:
                ev = 0.0

            try:
                odds = int(float(row.get("odds_pick") or -110))
            except ValueError:
                odds = -110

            estado = row.get("estado", "PICK").strip().upper()
            if not estado:
                estado = "PICK"

            p = {
                "id": id_counter,
                "externalGameId": row.get("game_id") or f"nfl_{id_counter}",
                "sport": "NFL",
                "season": int(row.get("season") or 2026),
                "week": int(row.get("week") or 3),
                "gameDate": f"{row.get('gameday', '2026-09-27')} {row.get('gametime', '13:00')}:00",
                "awayTeam": away,
                "homeTeam": home,
                "gameStatus": "FINALIZADO",
                "venue": row.get("stadium") or "Estadio NFL",
                "marketType": "GAME_TOTAL",
                "participantName": None,
                "line": line,
                "predictedValue": round(pred_total, 2),
                "selection": pick,
                "probability": round(prob_pick, 3),
                "overProbability": round(prob_over, 3),
                "underProbability": round(prob_under, 3),
                "confidence": round(prob_pick * 100, 1),
                "edge": round(edge, 2),
                "odds": odds,
                "expectedValue": round(ev, 3),
                "pickStatus": estado,
                "calibrationMethod": "Ensemble XGBoost + ESPN",
                "modelVersion": "NFL_TOTALS_V3",
                "injuryStatus": row.get("home_injury_severity") or "Normal",
                "notes": (row.get("home_prop_injury_note") or "Líneas de DraftKings vs Proyección IA").strip(),
                "generatedAt": "2026-09-27 10:00:00"
            }
            preds.append(p)
            id_counter += 1

# Process MLB Predictions
mlb_samples = [
    {
        "externalGameId": "mlb-2026-001",
        "sport": "MLB",
        "season": 2026,
        "week": None,
        "gameDate": "2026-10-03 18:05:00",
        "awayTeam": "LAD",
        "homeTeam": "SD",
        "gameStatus": "FINALIZADO",
        "venue": "Petco Park",
        "marketType": "F5_TOTAL",
        "participantName": None,
        "line": 4.5,
        "predictedValue": 4.21,
        "selection": "UNDER",
        "probability": 0.548,
        "overProbability": 0.452,
        "underProbability": 0.548,
        "confidence": 54.8,
        "edge": -0.29,
        "odds": -108,
        "expectedValue": 0.055,
        "pickStatus": "PICK",
        "calibrationMethod": "Beta binomial",
        "modelVersion": "MLB_F5_V8_1",
        "injuryStatus": "Sin bajas",
        "notes": "DraftKings O/U 4.5 F5 vs pitcheo abridor proyectado.",
        "generatedAt": "2026-10-03 10:00:00"
    },
    {
        "externalGameId": "mlb-2026-002",
        "sport": "MLB",
        "season": 2026,
        "week": None,
        "gameDate": "2026-10-03 19:10:00",
        "awayTeam": "NYY",
        "homeTeam": "BOS",
        "gameStatus": "FINALIZADO",
        "venue": "Fenway Park",
        "marketType": "GAME_TOTAL",
        "participantName": None,
        "line": 8.5,
        "predictedValue": 9.40,
        "selection": "OVER",
        "probability": 0.615,
        "overProbability": 0.615,
        "underProbability": 0.385,
        "confidence": 61.5,
        "edge": 0.90,
        "odds": -115,
        "expectedValue": 0.178,
        "pickStatus": "PICK",
        "calibrationMethod": "Residual empírico",
        "modelVersion": "MLB_TOTALS_V5",
        "injuryStatus": "Normal",
        "notes": "Condiciones climáticas y desgaste de bullpen favorecen Over.",
        "generatedAt": "2026-10-03 11:30:00"
    },
    {
        "externalGameId": "mlb-2026-003",
        "sport": "MLB",
        "season": 2026,
        "week": None,
        "gameDate": "2026-10-04 15:05:00",
        "awayTeam": "HOU",
        "homeTeam": "TEX",
        "gameStatus": "FINALIZADO",
        "venue": "Globe Life Field",
        "marketType": "MONEYLINE",
        "participantName": None,
        "line": -135.0,
        "predictedValue": -160.0,
        "selection": "HOU",
        "probability": 0.582,
        "overProbability": 0.582,
        "underProbability": 0.418,
        "confidence": 58.2,
        "edge": 0.12,
        "odds": -135,
        "expectedValue": 0.089,
        "pickStatus": "PICK",
        "calibrationMethod": "Logit ESPN BPI",
        "modelVersion": "MLB_ML_V4",
        "injuryStatus": "Normal",
        "notes": "Ventaja en pitcheo abridor y diferencial de wOBA acumulado.",
        "generatedAt": "2026-10-04 09:15:00"
    },
    {
        "externalGameId": "mlb-2026-004",
        "sport": "MLB",
        "season": 2026,
        "week": None,
        "gameDate": "2026-10-04 16:10:00",
        "awayTeam": "ATL",
        "homeTeam": "PHI",
        "gameStatus": "FINALIZADO",
        "venue": "Citizens Bank Park",
        "marketType": "F5_TOTAL",
        "participantName": None,
        "line": 4.0,
        "predictedValue": 3.45,
        "selection": "UNDER",
        "probability": 0.565,
        "overProbability": 0.435,
        "underProbability": 0.565,
        "confidence": 56.5,
        "edge": -0.55,
        "odds": -105,
        "expectedValue": 0.098,
        "pickStatus": "PICK",
        "calibrationMethod": "Platt Scaling",
        "modelVersion": "MLB_F5_V8_1",
        "injuryStatus": "Normal",
        "notes": "Duelo de abridores élite con ERA proyectada sub 2.50.",
        "generatedAt": "2026-10-04 10:45:00"
    },
    {
        "externalGameId": "mlb-2026-005",
        "sport": "MLB",
        "season": 2026,
        "week": None,
        "gameDate": "2026-10-04 20:00:00",
        "awayTeam": "LAA",
        "homeTeam": "SEA",
        "gameStatus": "FINALIZADO",
        "venue": "T-Mobile Park",
        "marketType": "GAME_TOTAL",
        "participantName": None,
        "line": 8.5,
        "predictedValue": 7.89,
        "selection": "UNDER",
        "probability": 0.609,
        "overProbability": 0.391,
        "underProbability": 0.609,
        "confidence": 60.9,
        "edge": -0.61,
        "odds": -110,
        "expectedValue": 0.162,
        "pickStatus": "PICK",
        "calibrationMethod": "Pitcheo Ridge",
        "modelVersion": "MLB_TOTALS_V5",
        "injuryStatus": "Normal",
        "notes": "Proyección Ridge basada en efectividad de pitcheo y parque favorable al lanzador.",
        "generatedAt": "2026-10-04 12:00:00"
    }
]

for item in mlb_samples:
    item["id"] = id_counter
    preds.append(item)
    id_counter += 1

out_file = data_dir / "predictions_data.json"
result = {
    "NFL": [p for p in preds if p["sport"] == "NFL"],
    "MLB": [p for p in preds if p["sport"] == "MLB"]
}

with open(out_file, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f"Éxito: Generado {out_file} con {len(result['NFL'])} partidos NFL y {len(result['MLB'])} partidos MLB.")
