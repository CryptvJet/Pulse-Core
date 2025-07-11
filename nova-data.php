<?php
require_once 'db_config.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Nova Event Log</title>
<style>
    body { font-family: monospace; white-space: pre-wrap; }
</style>
</head>
<body>
<?php
try {
    $stmt = $pdo->prepare(
        "SELECT timestamp, user_agent, genesis_mode, frame_duration, complexity,
                pulse_energy, tension, center_row, center_col, pulse_length,
                neighbor_threshold, collapse_threshold, fold_threshold,
                potential_threshold, potential_decay, phase_mode, field_mapping,
                nova_hash
         FROM nova_events
         ORDER BY timestamp DESC
         LIMIT 100"
    );
    $stmt->execute();

    $idx = 1;
    function showField($val) {
        if ($val === null || $val === '' || $val == 0) {
            return 'Missing';
        }
        return htmlspecialchars($val);
    }

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        printf("%03d - %s \xF0\x9F\x94\x91 Nova Hash: %s\n",
            $idx,
            htmlspecialchars($row['timestamp']),
            showField($row['nova_hash']));
        echo ' UA: ' . showField($row['user_agent']) . "\n";
        echo ' Genesis Mode: ' . showField($row['genesis_mode']) . "\n";
        echo ' Frame Duration: ' . (int)$row['frame_duration'] . ' ms'
            . ' | Complexity: ' . (int)$row['complexity']
            . ' | Energy: ' . (float)$row['pulse_energy']
            . ' | Tension: ' . (int)$row['tension'] . "\n";
        echo ' Center: (' . (int)$row['center_row'] . ', ' . (int)$row['center_col'] . ")\n";
        echo ' Pulse Length: ' . (int)$row['pulse_length']
            . ' | Neighbor Threshold: ' . (int)$row['neighbor_threshold']
            . ' | Collapse Threshold: ' . showField($row['collapse_threshold']) . "\n";
        echo ' Fold Threshold: ' . showField($row['fold_threshold'])
            . ' | Potential Threshold: ' . showField($row['potential_threshold'])
            . ' | Potential Decay: ' . showField($row['potential_decay']) . "\n";
        echo ' Phase Mode: ' . showField($row['phase_mode'])
            . ' | Field Mapping: ' . showField($row['field_mapping']) . "\n";
        echo str_repeat('-', 40) . "\n";
        $idx++;
    }
} catch (Exception $e) {
    echo "Error retrieving nova data.";
}
?>
</body>
</html>
