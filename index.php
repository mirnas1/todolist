<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: auth.php");
    exit;
}
require_once 'config.php';

$userId = $_SESSION['user_id'];
$stmt = $mysqli->prepare("SELECT username FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$stmt->bind_result($username);
$stmt->fetch();
$stmt->close();
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ToDo List</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <div class="logout-container">
        <a href="logout.php">Logout</a>
    </div>

    <div class="todo-app">
    <h1><?php echo htmlspecialchars($username); ?>'s To-Do List</h1>
        <div class="input-container">
            <input type="text" id="task-input" placeholder="Add a new task..." autocomplete="off">
        </div>
        <ul id="todo-list"></ul>
        <div class="completed-section">
            <span>Completed: <span id="completed-count">0</span></span>
            <button id="clear-completed">Clear Completed Tasks</button>
        </div>
    </div>
    <script src="index.js"></script>
</body>
</html>
