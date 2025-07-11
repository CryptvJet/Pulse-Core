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
    #eventLog { margin-bottom: 1em; }
</style>
</head>
<body>
<pre id="eventLog">
<?php
try {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = 100;
    $offset = ($page - 1) * $limit;
    $stmt = $pdo->prepare(
        "SELECT id, timestamp, user_agent, genesis_mode, frame_duration, complexity,
                pulse_energy, tension, center_row, center_col, pulse_length,
                neighbor_threshold, collapse_threshold, fold_threshold,
                potential_threshold, potential_decay, phase_mode, field_mapping,
                nova_hash
         FROM nova_events
         ORDER BY timestamp DESC
         LIMIT :limit OFFSET :offset"
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Determine global index for the first row on this page
    $countStmt = $pdo->query('SELECT COUNT(*) FROM nova_events');
    $totalCount = (int)$countStmt->fetchColumn();
    $idx = $totalCount - $offset;
    function showField($val) {
        if ($val === null || $val === '' || $val == 0) {
            return 'Missing';
        }
        return htmlspecialchars($val);
    }

    foreach ($rows as $row) {
        $num = str_pad($idx, strlen((string)$totalCount), '0', STR_PAD_LEFT);
        printf("%s - %s \xF0\x9F\x94\x91 Nova Hash: %s\n",
            $num,
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
        $idx--;
    }

    echo "</pre>";
    echo "<div style=\"margin-top:10px\">";
    if ($page > 1) {
        $prev = $page - 1;
        echo "<a href=\"?page=$prev\">&laquo; Previous 100</a> ";
    }
    if (count($rows) === $limit) {
        $next = $page + 1;
        echo "<a href=\"?page=$next\">Next 100 &raquo;</a>";
    }
    echo "</div>";
    $latestId = count($rows) ? (int)$rows[0]['id'] : 0;
    $nextIndex = $idx;
    echo "<script>\n";
    echo "let latestId = $latestId;\n";
    echo "let nextIndex = $nextIndex;\n";
    ?>
    function showField(val) {
        if (val === null || val === '' || val == 0) return 'Missing';
        return val;
    }
    function formatEntry(row) {
        let text = '';
        text += String(nextIndex).padStart(3, '0') + ' - ' + row.timestamp + ' \uD83D\uDD11 Nova Hash: ' + showField(row.nova_hash) + '\n';
        text += ' UA: ' + showField(row.user_agent) + '\n';
        text += ' Genesis Mode: ' + showField(row.genesis_mode) + '\n';
        text += ' Frame Duration: ' + parseInt(row.frame_duration) + ' ms' +
            ' | Complexity: ' + parseInt(row.complexity) +
            ' | Energy: ' + parseFloat(row.pulse_energy) +
            ' | Tension: ' + parseInt(row.tension) + '\n';
        text += ' Center: (' + parseInt(row.center_row) + ', ' + parseInt(row.center_col) + ')\n';
        text += ' Pulse Length: ' + parseInt(row.pulse_length) +
            ' | Neighbor Threshold: ' + parseInt(row.neighbor_threshold) +
            ' | Collapse Threshold: ' + showField(row.collapse_threshold) + '\n';
        text += ' Fold Threshold: ' + showField(row.fold_threshold) +
            ' | Potential Threshold: ' + showField(row.potential_threshold) +
            ' | Potential Decay: ' + showField(row.potential_decay) + '\n';
        text += ' Phase Mode: ' + showField(row.phase_mode) +
            ' | Field Mapping: ' + showField(row.field_mapping) + '\n';
        text += '-'.repeat(40) + '\n';
        nextIndex++;
        return text;
    }
    function fetchUpdates() {
        fetch('nova-events.php?after=' + latestId)
            .then(r => r.json())
            .then(rows => {
                rows.forEach(row => {
                    const pre = document.getElementById('eventLog');
                    pre.textContent = formatEntry(row) + pre.textContent;
                    latestId = row.id;
                });
            })
            .catch(err => console.error('update error', err));
    }
    setInterval(fetchUpdates, 5000);
    </script>
    <?php
} catch (Exception $e) {
    echo "Error retrieving nova data.";
}
?>
</body>
</html>
