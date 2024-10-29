<?php
session_start();
require_once 'config.php';

$errors = array();
$success = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $action = $_POST['action'];
    $username = htmlspecialchars(trim($_POST['username']));
    $password = htmlspecialchars(trim($_POST['password']));

    if ($action == 'register') {
        $email = htmlspecialchars(trim($_POST['email']));
        
        if (empty($username) || empty($password) || empty($email)) {
            $errors[] = "All fields are required.";
        } else {
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $mysqli->prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $username, $hashed_password, $email);
            if ($stmt->execute()) {
                $success = "Registration successful. Please log in.";
            } else {
                $errors[] = "Username or email already exists.";
            }
            $stmt->close();
        }
    } elseif ($action == 'login') {
        $stmt = $mysqli->prepare("SELECT id, password FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();
        
        if ($stmt->num_rows == 1) {
            $stmt->bind_result($id, $hashed_password);
            $stmt->fetch();
            if (password_verify($password, $hashed_password)) {
                $_SESSION['user_id'] = $id;
                header("Location: index.html");
                exit;
            } else {
                $errors[] = "Invalid username or password.";
            }
        } else {
            $errors[] = "Invalid username or password.";
        }
        $stmt->close();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ToDo List</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="todo-app">
        <h1>Welcome Back!</h1>
        <?php if ($errors) : ?>
            <div class="error">
                <?php foreach ($errors as $error) : ?>
                    <p><?php echo $error; ?></p>
                <?php endforeach; ?>
            </div>
        <?php elseif ($success) : ?>
            <div class="success"><p><?php echo $success; ?></p></div>
        <?php endif; ?>
        <div class="input-container">
            <form class="form-section">
                <input id="register"  class="login-input" type="text" placeholder="username" required/>
                <input id="register" class="login-input" type="password" placeholder="password" required/>
                <input id="register" class="login-input" type="text" placeholder="email address" required/>
                <button id="register">Register</button>
                <p id="register" class="message">Already registered? <a href="#" onclick="toggleForm('loginForm', 'registerForm')">Sign In</a></p>
              </form>
              <form class="form-section">
                <input id="login" class="login-input" type="text" placeholder="username" required/>
                <input id="login" class="login-input" type="password" placeholder="password" required/>
                <button id="login">Login</button>
                <p id="login" class="message">Not registered? <a href="#" onclick="toggleForm('registerForm', 'loginForm')">Create an account</a></p>
              </form>
        </div>
    </div>
    <script src="index.js"></script>
</body>
</html>