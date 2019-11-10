<?php
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');
$annotations = file_get_contents('./annotation.json', true);
$annotations = json_decode($annotations);
if (!$annotations) {
    $annotations = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $annotation = json_decode(file_get_contents("php://input"), true);
        if (!$annotation['id']) {
            $annotation['id'] = rand();
        }
        $annotations[] = $annotation;
        file_put_contents('./annotation.json', json_encode($annotations));
    } catch (Exception $e) {
        var_dump($e);
    }

    echo json_encode(['status' => 'success', 'id' => $annotation['id']]);
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $annotation = json_decode(file_get_contents("php://input"), true);
    $annotationNew = [];

    foreach ($annotations as $key => $val) {
        if ($annotation['id'] !== $val->id) {
            $annotationNew[] = $val;
        }
    }
    file_put_contents('./annotation.json', json_encode($annotationNew));
    echo json_encode(['status' => 'success']);
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $annotation = json_decode(file_get_contents("php://input"), true);
    $annotationNew = [];

    foreach ($annotations as $key => $val) {
        if ($annotation['id'] === $val->id) {
            $annotationNew[] = $annotation;
        } else {
            $annotationNew[] = $val;
        }
    }
    file_put_contents('./annotation.json', json_encode($annotationNew));
    echo json_encode(['status' => 'success']);
} else {
    $page = $_GET['page'];
    $new = [];
    foreach ($annotations as $a) {
        if ($a->page == $page) {
            $new[] = $a;
        }

    }
    echo json_encode(['total' => count($new), 'rows' => $new]);
}