<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Determine the action
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

switch ($action) {
    case 'get':
        getTodos($mysqli, $user_id);
        break;
    case 'add':
        addTodo($mysqli, $user_id);
        break;
    case 'update':
        updateTodo($mysqli, $user_id);
        break;
    case 'delete':
        deleteTodo($mysqli, $user_id);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        break;
}

// Function to retrieve todos
function getTodos($mysqli, $user_id) {
    $stmt = $mysqli->prepare("SELECT id, todo, is_completed, priority FROM todos WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $todos = [];
    while ($row = $result->fetch_assoc()) {
        // Convert 'is_completed' to boolean
        $row['is_completed'] = (bool)$row['is_completed'];
        $todos[] = $row;
    }
    $stmt->close();
    echo json_encode(['status' => 'success', 'todos' => $todos]);
}

// Function to add a new todo
function addTodo($mysqli, $user_id) {
    $todo_text = isset($_POST['todo']) ? trim($_POST['todo']) : '';
    $priority = isset($_POST['priority']) ? $_POST['priority'] : 'white';

    if ($todo_text === '') {
        echo json_encode(['status' => 'error', 'message' => 'Todo text cannot be empty']);
        return;
    }

    $stmt = $mysqli->prepare("INSERT INTO todos (user_id, todo, priority) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $todo_text, $priority);
    if ($stmt->execute()) {
        $todo_id = $stmt->insert_id;
        echo json_encode(['status' => 'success', 'todo' => [
            'id' => $todo_id,
            'todo' => $todo_text,
            'is_completed' => false,
            'priority' => $priority
        ]]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add todo']);
    }
    $stmt->close();
}

// Function to update an existing todo
function updateTodo($mysqli, $user_id) {
    $todo_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
    $todo_text = isset($_POST['todo']) ? trim($_POST['todo']) : '';
    $is_completed = isset($_POST['is_completed']) ? ($_POST['is_completed'] === 'true' || $_POST['is_completed'] === '1' ? 1 : 0) : 0;
    $priority = isset($_POST['priority']) ? $_POST['priority'] : 'white';

    if ($todo_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid todo ID']);
        return;
    }

    $stmt = $mysqli->prepare("UPDATE todos SET todo = ?, is_completed = ?, priority = ? WHERE id = ? AND user_id = ?");
    $stmt->bind_param("sissi", $todo_text, $is_completed, $priority, $todo_id, $user_id);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update todo']);
    }
    $stmt->close();
}

// Function to delete a todo
function deleteTodo($mysqli, $user_id) {
    $todo_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;

    if ($todo_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid todo ID']);
        return;
    }

    $stmt = $mysqli->prepare("DELETE FROM todos WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $todo_id, $user_id);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete todo']);
    }
    $stmt->close();
}
?>
