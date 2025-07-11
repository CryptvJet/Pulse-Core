<?php
require_once 'db_config.php';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function fieldOrMissing(array $row, string $key) {
    return (isset($row[$key]) && $row[$key] !== null && $row[$key] !== '') ? $row[$key] : 'Missing';
}

try {
    $stmt = $pdo->query("SELECT * FROM nova_events ORDER BY timestamp DESC LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        printf("%s – %s Nova Hash: %s UA: %s\n",
            fieldOrMissing($row, 'id'),
            fieldOrMissing($row, 'timestamp'),
            fieldOrMissing($row, 'nova_hash'),
            fieldOrMissing($row, 'user_agent')
        );
        echo 'Genesis Mode: ' . fieldOrMissing($row, 'genesis_mode') . "\n";
        echo 'Complexity: ' . fieldOrMissing($row, 'complexity')
            . ' | Energy: ' . fieldOrMissing($row, 'pulse_energy')
            . ' | Tension: ' . fieldOrMissing($row, 'tension') . "\n";
        echo 'Center: (' . fieldOrMissing($row, 'center_row') . ', ' . fieldOrMissing($row, 'center_col') . ")\n";
        echo 'Pulse Length: ' . fieldOrMissing($row, 'pulse_length')
            . ' | Neighbor Threshold: ' . fieldOrMissing($row, 'neighbor_threshold')
            . ' | Collapse Threshold: ' . fieldOrMissing($row, 'collapse_threshold') . "\n";
        echo 'Fold Threshold: ' . fieldOrMissing($row, 'fold_threshold')
            . ' | Potential Threshold: ' . fieldOrMissing($row, 'potential_threshold')
            . ' | Potential Decay: ' . fieldOrMissing($row, 'potential_decay') . "\n";
        echo 'Phase Mode: ' . fieldOrMissing($row, 'phase_mode')
            . ' | Field Mapping: ' . fieldOrMissing($row, 'field_mapping') . "\n";
        echo str_repeat('-', 53) . "\n";
    }
} catch (Exception $e) {
    echo "Error retrieving nova data.";
}

