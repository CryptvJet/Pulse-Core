<?php
require_once 'db_config.php';

header('Content-Type: text/html; charset=utf-8');
$hash = isset($_GET['hash']) ? $_GET['hash'] : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Nova Detail</title>
<style>
    body { font-family: monospace; white-space: pre-wrap; }
</style>
</head>
<body>
<pre>
<?php
if ($hash === '') {
    echo "No hash provided.";
    echo "</pre></body></html>";
    exit;
}
try {
    $stmt = $pdo->prepare("SELECT * FROM nova_events WHERE nova_hash = :hash LIMIT 1");
    $stmt->execute([':hash' => $hash]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo "Nova not found.";
    } else {
        foreach ($row as $field => $val) {
            $safeVal = htmlspecialchars($val === null ? 'NULL' : $val);
            echo ucfirst(str_replace('_', ' ', $field)) . ': ' . $safeVal . "\n";
        }
        echo str_repeat('-', 40) . "\n";
        if ($row['parent_hash']) {
            echo "Parent: <a href=\"nova-detail.php?hash=" . urlencode($row['parent_hash']) . "\">" . htmlspecialchars($row['parent_hash']) . "</a>\n";
        }
        $childStmt = $pdo->prepare("SELECT timestamp, nova_hash FROM nova_events WHERE parent_hash = :hash ORDER BY timestamp ASC");
        $childStmt->execute([':hash' => $hash]);
        $children = $childStmt->fetchAll(PDO::FETCH_ASSOC);
        if ($children) {
            echo "\nChildren:\n";
            foreach ($children as $child) {
                $ts = htmlspecialchars($child['timestamp']);
                $ch = htmlspecialchars($child['nova_hash']);
                $link = "<a href=\"nova-detail.php?hash=" . urlencode($child['nova_hash']) . "\">$ch</a>";
                echo "  $ts - $link\n";
            }
        }
    }
} catch (Exception $e) {
    echo "Error retrieving nova details.";
}
?>
</pre>
</body>
</html>
