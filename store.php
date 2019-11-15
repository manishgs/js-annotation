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

        $comments = [];
        foreach ($annotation['comments'] as $comment) {
            if ($comment && isset($comment['text'])) {
                $comments[] = $comment;
            }
        }
        $annotation['comments'] = $comments;
        $annotations[] = $annotation;
        file_put_contents('./annotation.json', json_encode($annotations));
    } catch (Exception $e) {
        var_dump($e);
    }

    echo json_encode(['status' => 'success', 'id' => $annotation['id']]);
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($_GET['annotations'] === 'all') {
        file_put_contents('./annotation.json', json_encode([]));
        echo json_encode(['status' => 'success']);
    } else {
        $annotation = json_decode(file_get_contents("php://input"), true);
        $annotationNew = [];

        foreach ($annotations as $key => $val) {
            if ($annotation['id'] !== $val->id) {
                $annotationNew[] = $val;
            }
        }
        file_put_contents('./annotation.json', json_encode($annotationNew));
        echo json_encode(['status' => 'success']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $annotation = json_decode(file_get_contents("php://input"), true);
    $annotationNew = [];

    foreach ($annotations as $key => $val) {
        if ($annotation['id'] === $val->id) {
            $comments = [];
            foreach ($annotation['comments'] as $comment) {
                if ($comment && isset($comment['text'])) {
                    $comments[] = $comment;
                }
            }
            $annotation['comments'] = $comments;

            $annotationNew[] = $annotation;
        } else {
            $annotationNew[] = $val;
        }
    }
    file_put_contents('./annotation.json', json_encode($annotationNew));
    echo json_encode(['status' => 'success']);
} else {
    $page = $_GET['page'];
    $q = $_GET['search'];
    $new = [];
    foreach ($annotations as $a) {

        if ($a->page == $page) {
            $new[] = $a;
        }
        $found = false;
        foreach ($a->comments as &$comment) {
            $comment->added_by = 'Admin';

            if (strstr(strtolower($comment->text), strtolower($q))) {
                $found = true;
            }
        }
        if ($found) {
            $new[] = $a;
        }
    }
    echo json_encode(['total' => count($new), 'rows' => $new]);
}