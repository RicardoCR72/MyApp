<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

$corsOrigin = getenv('MIAPP_CORS_ORIGIN') ?: '*';
header('Access-Control-Allow-Origin: ' . $corsOrigin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if (($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_PRIVATE_NETWORK'] ?? '') === 'true') {
    header('Access-Control-Allow-Private-Network: true');
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function apiRespond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

require_once __DIR__ . '/config/auth.php';

function jsonBody(): array
{
    $body = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($body) || json_last_error() !== JSON_ERROR_NONE) {
        apiRespond(400, ['success' => false, 'message' => 'El cuerpo debe contener JSON valido.']);
    }
    return $body;
}

function nullableNumber(mixed $value): ?float
{
    if ($value === null || $value === '') return null;
    if (!is_numeric($value)) {
        apiRespond(422, ['success' => false, 'message' => 'Se recibio un valor numerico invalido.']);
    }
    return (float) $value;
}

function normalizedProbability(mixed $value, string $field): ?float
{
    $number = nullableNumber($value);
    if ($number === null) return null;
    if ($number > 1 && $number <= 100) $number /= 100;
    if ($number < 0 || $number > 1) {
        apiRespond(422, ['success' => false, 'message' => "$field debe estar entre 0 y 1, o entre 0 y 100."]);
    }
    return $number;
}

function predictionRow(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'externalGameId' => $row['external_game_id'],
        'sport' => $row['sport'],
        'season' => (int) $row['season'],
        'week' => $row['week'] === null ? null : (int) $row['week'],
        'gameDate' => date(DATE_ATOM, strtotime($row['game_date'])),
        'awayTeam' => $row['away_team'],
        'homeTeam' => $row['home_team'],
        'gameStatus' => $row['game_status'],
        'venue' => $row['venue'],
        'marketType' => $row['market_type'],
        'participantName' => $row['participant_name'],
        'line' => (float) $row['line_value'],
        'predictedValue' => $row['predicted_value'] === null ? null : (float) $row['predicted_value'],
        'selection' => $row['selection'],
        'probability' => (float) $row['probability'],
        'overProbability' => $row['over_probability'] === null ? null : (float) $row['over_probability'],
        'underProbability' => $row['under_probability'] === null ? null : (float) $row['under_probability'],
        'confidence' => $row['confidence'] === null ? null : (float) $row['confidence'],
        'edge' => $row['edge_value'] === null ? null : (float) $row['edge_value'],
        'odds' => $row['odds_value'] === null ? null : (float) $row['odds_value'],
        'expectedValue' => $row['expected_value'] === null ? null : (float) $row['expected_value'],
        'pickStatus' => $row['pick_status'],
        'calibrationMethod' => $row['calibration_method'],
        'modelVersion' => $row['model_version'],
        'injuryStatus' => $row['injury_status'],
        'notes' => $row['notes'],
        'generatedAt' => date(DATE_ATOM, strtotime($row['generated_at'])),
    ];
}

function getPredictions(PDO $database): never
{
    $sport = strtoupper(trim((string) ($_GET['sport'] ?? 'MLB')));
    if (!in_array($sport, ['MLB', 'NFL'], true)) {
        apiRespond(422, ['success' => false, 'message' => 'sport debe ser MLB o NFL.']);
    }

    $where = ['g.sport = :sport'];
    $parameters = ['sport' => $sport];

    if (isset($_GET['date']) && trim((string) $_GET['date']) !== '') {
        $where[] = 'DATE(g.game_date) = :game_date';
        $parameters['game_date'] = trim((string) $_GET['date']);
    }
    if (isset($_GET['week']) && $_GET['week'] !== '') {
        $where[] = 'g.week = :week';
        $parameters['week'] = (int) $_GET['week'];
    }
    if (isset($_GET['marketType']) && trim((string) $_GET['marketType']) !== '') {
        $where[] = 'p.market_type = :market_type';
        $parameters['market_type'] = trim((string) $_GET['marketType']);
    }
    if (isset($_GET['pickStatus']) && trim((string) $_GET['pickStatus']) !== '') {
        $where[] = 'p.pick_status = :pick_status';
        $parameters['pick_status'] = trim((string) $_GET['pickStatus']);
    }

    $limit = max(1, min(250, (int) ($_GET['limit'] ?? 100)));
    $sql = 'SELECT p.*, g.external_game_id, g.sport, g.season, g.week,
                   g.game_date, g.away_team, g.home_team,
                   g.status AS game_status, g.venue
            FROM predictions AS p
            INNER JOIN sports_games AS g ON g.id = p.game_id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY g.game_date ASC, p.market_type ASC, p.line_value ASC
            LIMIT ' . $limit;

    $statement = $database->prepare($sql);
    $statement->execute($parameters);
    $rows = array_map('predictionRow', $statement->fetchAll());

    apiRespond(200, [
        'success' => true,
        'sport' => $sport,
        'count' => count($rows),
        'data' => $rows,
    ]);
}

function upsertRun(PDO $database, array $run, int $games, int $predictions): ?int
{
    if ($run === []) return null;
    $sport = strtoupper(trim((string) ($run['sport'] ?? '')));
    $version = trim((string) ($run['modelVersion'] ?? ''));
    if (!in_array($sport, ['MLB', 'NFL'], true) || $version === '') {
        apiRespond(422, ['success' => false, 'message' => 'run requiere sport y modelVersion validos.']);
    }

    $statement = $database->prepare(
        'INSERT INTO model_runs
           (sport, model_version, status, started_at, finished_at,
            games_processed, predictions_created, error_message)
         VALUES
           (:sport, :model_version, :status, :started_at, :finished_at,
            :games_processed, :predictions_created, :error_message)'
    );
    $statement->execute([
        'sport' => $sport,
        'model_version' => $version,
        'status' => $run['status'] ?? 'completed',
        'started_at' => $run['startedAt'] ?? date('Y-m-d H:i:s'),
        'finished_at' => $run['finishedAt'] ?? date('Y-m-d H:i:s'),
        'games_processed' => $games,
        'predictions_created' => $predictions,
        'error_message' => $run['errorMessage'] ?? null,
    ]);
    return (int) $database->lastInsertId();
}

function upsertGame(PDO $database, array $game): int
{
    $sport = strtoupper(trim((string) ($game['sport'] ?? '')));
    $externalId = trim((string) ($game['externalGameId'] ?? ''));
    $away = trim((string) ($game['awayTeam'] ?? ''));
    $home = trim((string) ($game['homeTeam'] ?? ''));
    if (!in_array($sport, ['MLB', 'NFL'], true) || $externalId === '' || $away === '' || $home === '') {
        apiRespond(422, ['success' => false, 'message' => 'Cada juego requiere sport, externalGameId, awayTeam y homeTeam.']);
    }

    $statement = $database->prepare(
        'INSERT INTO sports_games
           (external_game_id, sport, season, week, game_date, away_team, home_team, status, venue)
         VALUES
           (:external_game_id, :sport, :season, :week, :game_date, :away_team, :home_team, :status, :venue)
         ON DUPLICATE KEY UPDATE
           season = VALUES(season), week = VALUES(week), game_date = VALUES(game_date),
           away_team = VALUES(away_team), home_team = VALUES(home_team),
           status = VALUES(status), venue = VALUES(venue)'
    );
    $statement->execute([
        'external_game_id' => $externalId,
        'sport' => $sport,
        'season' => (int) ($game['season'] ?? date('Y')),
        'week' => $game['week'] ?? null,
        'game_date' => $game['gameDate'] ?? date('Y-m-d H:i:s'),
        'away_team' => $away,
        'home_team' => $home,
        'status' => $game['status'] ?? 'scheduled',
        'venue' => $game['venue'] ?? null,
    ]);

    $lookup = $database->prepare(
        'SELECT id FROM sports_games WHERE sport = :sport AND external_game_id = :external_game_id LIMIT 1'
    );
    $lookup->execute(['sport' => $sport, 'external_game_id' => $externalId]);
    return (int) $lookup->fetchColumn();
}

function upsertPrediction(PDO $database, int $gameId, ?int $runId, array $game, array $prediction): void
{
    $market = trim((string) ($prediction['marketType'] ?? ''));
    $selection = strtoupper(trim((string) ($prediction['selection'] ?? '')));
    $line = nullableNumber($prediction['line'] ?? null);
    $probability = normalizedProbability($prediction['probability'] ?? null, 'probability');
    if ($market === '' || $selection === '' || $line === null || $probability === null) {
        apiRespond(422, ['success' => false, 'message' => 'Cada prediccion requiere marketType, line, selection y probability.']);
    }

    $participant = trim((string) ($prediction['participantName'] ?? ''));
    $participantKey = $participant === '' ? 'GAME' : $participant;
    $key = trim((string) ($prediction['sourcePredictionKey'] ?? ''));
    if ($key === '') {
        $key = implode(':', [
            strtoupper((string) $game['sport']),
            (string) $game['externalGameId'],
            $market,
            $participantKey,
            (string) $line,
        ]);
    }

    $statement = $database->prepare(
        'INSERT INTO predictions
           (game_id, model_run_id, source_prediction_key, market_type, participant_name,
            line_value, predicted_value, selection, probability, over_probability,
            under_probability, confidence, edge_value, odds_value, expected_value,
            pick_status, calibration_method, model_version, injury_status, notes, generated_at)
         VALUES
           (:game_id, :model_run_id, :source_prediction_key, :market_type, :participant_name,
            :line_value, :predicted_value, :selection, :probability, :over_probability,
            :under_probability, :confidence, :edge_value, :odds_value, :expected_value,
            :pick_status, :calibration_method, :model_version, :injury_status, :notes, :generated_at)
         ON DUPLICATE KEY UPDATE
            model_run_id = VALUES(model_run_id), predicted_value = VALUES(predicted_value),
            selection = VALUES(selection), probability = VALUES(probability),
            over_probability = VALUES(over_probability), under_probability = VALUES(under_probability),
            confidence = VALUES(confidence), edge_value = VALUES(edge_value),
            odds_value = VALUES(odds_value), expected_value = VALUES(expected_value),
            pick_status = VALUES(pick_status), calibration_method = VALUES(calibration_method),
            model_version = VALUES(model_version), injury_status = VALUES(injury_status),
            notes = VALUES(notes), generated_at = VALUES(generated_at)'
    );
    $statement->execute([
        'game_id' => $gameId,
        'model_run_id' => $runId,
        'source_prediction_key' => $key,
        'market_type' => $market,
        'participant_name' => $participant === '' ? null : $participant,
        'line_value' => $line,
        'predicted_value' => nullableNumber($prediction['predictedValue'] ?? null),
        'selection' => $selection,
        'probability' => $probability,
        'over_probability' => normalizedProbability($prediction['overProbability'] ?? null, 'overProbability'),
        'under_probability' => normalizedProbability($prediction['underProbability'] ?? null, 'underProbability'),
        'confidence' => normalizedProbability($prediction['confidence'] ?? $probability, 'confidence'),
        'edge_value' => nullableNumber($prediction['edge'] ?? null),
        'odds_value' => nullableNumber($prediction['odds'] ?? null),
        'expected_value' => nullableNumber($prediction['expectedValue'] ?? null),
        'pick_status' => $prediction['pickStatus'] ?? 'NO PICK',
        'calibration_method' => $prediction['calibrationMethod'] ?? null,
        'model_version' => $prediction['modelVersion'] ?? ($game['modelVersion'] ?? 'unknown'),
        'injury_status' => $prediction['injuryStatus'] ?? null,
        'notes' => $prediction['notes'] ?? null,
        'generated_at' => $prediction['generatedAt'] ?? date('Y-m-d H:i:s'),
    ]);
}

try {
    $database = databaseConnection();

    if ($method === 'GET') {
        apiAuthenticatedUser($database);
        getPredictions($database);
    }

    if ($method === 'POST') {
        apiAuthenticatedUser($database, true);
        $body = jsonBody();
        $games = $body['games'] ?? [];
        if (!is_array($games) || $games === []) {
            apiRespond(422, ['success' => false, 'message' => 'Se requiere un arreglo games con predicciones.']);
        }

        $predictionCount = 0;
        foreach ($games as $game) {
            $predictionCount += is_array($game['predictions'] ?? null) ? count($game['predictions']) : 0;
        }

        $database->beginTransaction();
        $runId = upsertRun($database, is_array($body['run'] ?? null) ? $body['run'] : [], count($games), $predictionCount);
        foreach ($games as $game) {
            if (!is_array($game)) continue;
            $gameId = upsertGame($database, $game);
            foreach (($game['predictions'] ?? []) as $prediction) {
                if (is_array($prediction)) upsertPrediction($database, $gameId, $runId, $game, $prediction);
            }
        }
        $database->commit();

        apiRespond(201, [
            'success' => true,
            'message' => 'Predicciones importadas correctamente.',
            'gamesProcessed' => count($games),
            'predictionsProcessed' => $predictionCount,
            'modelRunId' => $runId,
        ]);
    }

    header('Allow: GET, POST, OPTIONS');
    apiRespond(405, ['success' => false, 'message' => 'Metodo HTTP no permitido.']);
} catch (Throwable $error) {
    if (isset($database) && $database instanceof PDO && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log($error->getMessage());
    apiRespond(500, ['success' => false, 'message' => 'No fue posible procesar las predicciones.']);
}
