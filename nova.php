<?php
// PulseCore backend logging endpoint
// Accepts POST requests with JSON body and logs nova events
require_once 'db_config.php';

function log_debug($msg) {
    file_put_contents(__DIR__ . '/nova_debug.log', $msg . PHP_EOL, FILE_APPEND);
}

function validateRequest($data, $requiredFields) {
    $errors = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            if ($field === 'parent_hash') {
                continue;
            }
            $errors[] = "Missing field: $field";
        }
    }
    if (isset($data['nova_centers']) && !is_array($data['nova_centers'])) {
        $errors[] = 'Invalid nova_centers';
    }
    return $errors;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

$input = file_get_contents('php://input');
log_debug('Payload: ' . $input);
$data = json_decode($input, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$requiredFields = [
    'timestamp',
    'user_agent',
    'complexity',
    'pulse_energy',
    'tension',
    'nova_centers',
    'genesis_mode',
    'pulse_length',
    'neighbor_threshold',
    'collapse_threshold',
    'fold_threshold',
    'potential_threshold',
    'potential_decay',
    'phase_mode',
    'field_mapping',
    'parent_hash'
];

$errors = validateRequest($data, $requiredFields);
if ($errors) {
    log_debug('Validation error: ' . implode('; ', $errors));
    http_response_code(400);
    echo json_encode(['error' => $errors[0]]);
    exit;
}

try {
    // $pdo is provided by db_config.php
    // Create table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS nova_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME,
        time_of_day VARCHAR(8),
        user_agent TEXT,
        complexity INT,
        pulse_energy FLOAT,
        tension INT,
        center_row INT,
        center_col INT,
        genesis_mode VARCHAR(32),
        pulse_length INT,
        neighbor_threshold INT,
        collapse_threshold FLOAT,
        fold_threshold INT,
        potential_threshold FLOAT,
        potential_decay FLOAT,
        phase_mode VARCHAR(50),
        field_mapping VARCHAR(50),
        nova_hash VARCHAR(16),
        parent_hash VARCHAR(10)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    log_debug('Preparing insert statement');
    $stmt = $pdo->prepare("INSERT INTO nova_events (
        timestamp, time_of_day, user_agent, complexity, pulse_energy,
        tension, center_row, center_col, genesis_mode, pulse_length,
        neighbor_threshold, collapse_threshold, fold_threshold,
        potential_threshold, potential_decay, phase_mode, field_mapping,
        nova_hash, parent_hash
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

    $dt = new DateTime($data['timestamp']);
    $dt->setTimezone(new DateTimeZone('UTC'));
    $timestamp = $dt->format('Y-m-d H:i:s');
    $timeOfDay = $dt->format('H:i:s');

    $inserted = 0;
    $hashes = [];
    foreach ($data['nova_centers'] as $center) {
        if (!is_array($center) || count($center) != 2) {
            continue;
        }
        [$row, $col] = $center;
        $eventData = $data;
        $eventData['center_row'] = (int)$row;
        $eventData['center_col'] = (int)$col;
        $novaHash = substr(md5(json_encode($eventData)), 0, 8);
        $success = $stmt->execute([
            $timestamp,
            $timeOfDay,
            $data['user_agent'],
            (int)$data['complexity'],
            (float)$data['pulse_energy'],
            (int)$data['tension'],
            (int)$row,
            (int)$col,
            $data['genesis_mode'],
            (int)$data['pulse_length'],
            (int)$data['neighbor_threshold'],
            (float)$data['collapse_threshold'],
            (int)$data['fold_threshold'],
            (float)$data['potential_threshold'],
            (float)$data['potential_decay'],
            $data['phase_mode'],
            $data['field_mapping'],
            $novaHash,
            $data['parent_hash']
        ]);
        if (!$success) {
            log_debug('Insert failed: ' . json_encode($stmt->errorInfo()));
        } else {
            log_debug('Inserted hash: ' . $novaHash);
        }
        $inserted++;
        $hashes[] = $novaHash;
    }

    echo json_encode(['status' => 'success', 'inserted' => $inserted, 'hashes' => $hashes]);
} catch (Exception $e) {
    log_debug('Exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

?>
