<?php
session_start();
require_once 'config.php';

$errors = array();
$success = '';
$activeForm = 'loginForm'; // Default active form

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $action = $_POST['action'];
    $username = htmlspecialchars(trim($_POST['username']));
    $password = htmlspecialchars(trim($_POST['password']));

    if ($action == 'register') {
        $email = htmlspecialchars(trim($_POST['email']));
        
        if (empty($username) || empty($password) || empty($email)) {
            $errors[] = "All fields are required.";
            $activeForm = 'registerForm';
        } else {
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $mysqli->prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $username, $hashed_password, $email);
            if ($stmt->execute()) {
                $success = "Registration successful. Please log in.";
                $activeForm = 'loginForm'; // Switch to login form
            } else {
                $errors[] = "Username or email already exists.";
                $activeForm = 'registerForm';
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
                header("Location: index.php");
                exit;
            } else {
                $errors[] = "Invalid username or password.";
                $activeForm = 'loginForm';
            }
        } else {
            $errors[] = "Invalid username or password.";
            $activeForm = 'loginForm';
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
        <!-- Dynamic Heading -->
        <?php if ($activeForm == 'loginForm') : ?>
            <h1>Welcome Back!</h1>
        <?php else : ?>
            <h1>Welcome!</h1>
        <?php endif; ?>

        <!-- Display Errors or Success Messages -->
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
            <!-- Registration Form -->
            <form id="registerForm" class="form-section <?php echo ($activeForm == 'registerForm') ? 'active' : ''; ?>" method="post" action="auth.php">
                <input class="login-input" type="text" name="username" placeholder="Username" required/>
                <input class="login-input" type="password" name="password" placeholder="Password" required/>
                <input class="login-input" type="email" name="email" placeholder="Email Address" required/>
                <input type="hidden" name="action" value="register"/>
                <button type="submit">Register</button>
                <p class="message">Already registered? <a href="#" onclick="toggleForm('loginForm', 'registerForm')">Sign In</a></p>
            </form>

            <!-- Login Form -->
            <form id="loginForm" class="form-section <?php echo ($activeForm == 'loginForm') ? 'active' : ''; ?>" method="post" action="auth.php">
                <input class="login-input" type="text" name="username" placeholder="Username" required/>
                <input class="login-input" type="password" name="password" placeholder="Password" required/>
                <input type="hidden" name="action" value="login"/>
                <button type="submit">Login</button>
                <p class="message">Not registered? <a href="#" onclick="toggleForm('registerForm', 'loginForm')">Create an account</a></p>
            </form>
        </div>
    </div>

    <!-- JavaScript to Toggle Forms and Headings -->
    <script>
    function toggleForm(showFormId, hideFormId) {
        document.getElementById(showFormId).classList.add('active');
        document.getElementById(hideFormId).classList.remove('active');

        // Change heading based on active form
        var heading = document.querySelector('.todo-app h1');
        if (showFormId === 'loginForm') {
            heading.textContent = 'Welcome Back!';
        } else {
            heading.textContent = 'Welcome!';
        }
    }
    </script>
</body>
</html>
