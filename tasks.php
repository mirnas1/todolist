<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

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
        getTasks($mysqli, $user_id);
        break;
    case 'add':
        addTask($mysqli, $user_id);
        break;
    case 'update':
        updateTask($mysqli, $user_id);
        break;
    case 'delete':
        deleteTask($mysqli, $user_id);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        break;
}

// Function to retrieve tasks
function getTasks($mysqli, $user_id) {
    $stmt = $mysqli->prepare("SELECT id, task_text, is_completed, priority FROM tasks WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    $stmt->close();
    echo json_encode(['status' => 'success', 'tasks' => $tasks]);
}

// Function to add a new task
function addTask($mysqli, $user_id) {
    $task_text = isset($_POST['task_text']) ? trim($_POST['task_text']) : '';
    $priority = isset($_POST['priority']) ? $_POST['priority'] : 'white';

    if ($task_text === '') {
        echo json_encode(['status' => 'error', 'message' => 'Task text cannot be empty']);
        return;
    }

    $stmt = $mysqli->prepare("INSERT INTO tasks (user_id, task_text, priority) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $task_text, $priority);
    if ($stmt->execute()) {
        $task_id = $stmt->insert_id;
        echo json_encode(['status' => 'success', 'task' => [
            'id' => $task_id,
            'task_text' => $task_text,
            'is_completed' => false,
            'priority' => $priority
        ]]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add task']);
    }
    $stmt->close();
}

// Function to update an existing task
function updateTask($mysqli, $user_id) {
    $task_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
    $task_text = isset($_POST['task_text']) ? trim($_POST['task_text']) : '';
    $is_completed = isset($_POST['is_completed']) ? ($_POST['is_completed'] === 'true' ? 1 : 0) : 0;
    $priority = isset($_POST['priority']) ? $_POST['priority'] : 'white';

    if ($task_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid task ID']);
        return;
    }

    $stmt = $mysqli->prepare("UPDATE tasks SET task_text = ?, is_completed = ?, priority = ? WHERE id = ? AND user_id = ?");
    $stmt->bind_param("sissi", $task_text, $is_completed, $priority, $task_id, $user_id);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update task']);
    }
    $stmt->close();
}

// Function to delete a task
function deleteTask($mysqli, $user_id) {
    $task_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;

    if ($task_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid task ID']);
        return;
    }

    $stmt = $mysqli->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $task_id, $user_id);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete task']);
    }
    $stmt->close();
}
?>
