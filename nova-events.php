<?php
require_once 'db_config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$after = isset($_GET['after']) ? intval($_GET['after']) : 0;

try {
    $stmt = $pdo->prepare(
        "SELECT id, timestamp, user_agent, genesis_mode, complexity,
                pulse_energy, tension, center_row, center_col, pulse_length,
                neighbor_threshold, collapse_threshold, fold_threshold,
                potential_threshold, potential_decay, phase_mode, field_mapping,
                nova_hash
         FROM nova_events
         WHERE id > :after
         ORDER BY id ASC"
    );
    $stmt->bindValue(':after', $after, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
