<?php

header('Content-Type: application/json; charset=utf-8');

$db = new SQLite3('scores.db');

if (isset($_POST['name']) && isset($_POST['score']) && isset($_POST['date'])) {
    $st = $db->prepare('INSERT INTO scores (name, score, date) values ("' . $_POST['name'] . '",' . $_POST['score'] . ',' . $_POST['date'] . ');');
    $st->execute();
    echo '{"sent":"' . $_POST['name'] . '"}';
} else {
    $data = array();
    $queryText = 'SELECT * FROM scores group by name, score order by score desc LIMIT 10';
    if (isset($_GET['date'])) {
        $queryText = 'SELECT * FROM scores where date > ' . $_GET['date'] . ' group by name, score order by score desc LIMIT 10';
    }
    $results = $db->query($queryText);
    $i = 1;
    while ($row = $results->fetchArray()) {
        $entry = array();
        $entry[$row['name']] = $row['score'];
        $data[$i++] = $entry;
    }

    $json = json_encode($data);
    echo $json;
}

$db->close();

?>