// index.js

document.addEventListener('DOMContentLoaded', () => {
  const todoInput = document.getElementById('task-input'); // Updated variable name
  const todoList = document.getElementById('todo-list');
  const completedCountElem = document.getElementById('completed-count');
  const clearCompletedBtn = document.getElementById('clear-completed');
  let completedCount = 0;

  // Load todos from server when the page loads
  loadTodos();

  // Event listener for adding a new todo
  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && todoInput.value.trim() !== '') {
      addTodoToServer(todoInput.value.trim(), 'white'); // Default priority is 'white'
      todoInput.value = '';
    }
  });

  // Function to load todos from the server
  function loadTodos() {
    fetch('todos.php?action=get', {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          data.todos.forEach((todo) => {
            addTodoToUI(todo);
            if (todo.is_completed) {
              completedCount++;
            }
          });
          updateCompletedCount();
        } else {
          console.error('Error fetching todos:', data.message);
        }
      })
      .catch((error) => console.error('Error fetching todos:', error));
  }

  // Function to add a todo to the server
  function addTodoToServer(todoText, priority) {
    fetch('todos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=add&todo=${encodeURIComponent(todoText)}&priority=${encodeURIComponent(priority)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          addTodoToUI(data.todo);
        } else {
          alert('Error adding todo: ' + data.message);
        }
      })
      .catch((error) => console.error('Error adding todo:', error));
  }

  // Function to add a todo to the UI
  function addTodoToUI(todo) {
    const listItem = document.createElement('li');
    const moveIcon = document.createElement('span');
    const todoSpan = document.createElement('span');
    const priorityIndicator = document.createElement('span');
    const optionsBtn = document.createElement('button');

    listItem.className = 'todo-item';
    listItem.setAttribute('data-id', todo.id);
    moveIcon.className = 'move-icon';
    todoSpan.className = 'todo-text';
    optionsBtn.className = 'options-button';
    priorityIndicator.className = 'priority-indicator';

    moveIcon.innerHTML = '&#9776;';
    todoSpan.textContent = todo.todo;
    optionsBtn.textContent = '\u22EE';

    priorityIndicator.style.backgroundColor = todo.priority;

    listItem.appendChild(moveIcon);
    listItem.appendChild(todoSpan);
    listItem.appendChild(priorityIndicator);
    listItem.appendChild(optionsBtn);

    listItem.setAttribute('draggable', !todo.is_completed);

    if (todo.is_completed) {
      listItem.classList.add('completed');
      moveIcon.style.display = 'none';
    }

    // Event listeners
    todoSpan.addEventListener('click', () => toggleComplete(listItem));
    optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOptionsMenu(listItem, todoSpan, priorityIndicator, e.pageX, e.pageY);
    });

    // Drag and drop functionality
    if (!todo.is_completed) {
      addDragAndDrop(listItem);
    }

    // Append to the correct position
    insertTodoAtCorrectPosition(listItem);

    // Update completed count
    if (todo.is_completed) {
      completedCount++;
      updateCompletedCount();
    }
  }

  // Function to toggle todo completion
  function toggleComplete(listItem) {
    const todoId = listItem.getAttribute('data-id');
    const isCompleted = listItem.classList.toggle('completed');
    const moveIcon = listItem.querySelector('.move-icon');

    if (isCompleted) {
      listItem.removeAttribute('draggable');
      moveIcon.style.display = 'none';
      completedCount++;
      insertCompletedTodoAtCorrectPosition(listItem);
    } else {
      listItem.setAttribute('draggable', true);
      moveIcon.style.display = 'inline';
      completedCount--;
      insertTodoAtCorrectPosition(listItem);
    }
    updateCompletedCount();

    // Update todo status on the server
    const todoText = listItem.querySelector('.todo-text').textContent;
    const priority = listItem.querySelector('.priority-indicator').style.backgroundColor;
    updateTodoOnServer(todoId, todoText, isCompleted, priority);
  }

  // Function to update todo on the server
  function updateTodoOnServer(todoId, todoText, isCompleted, priority) {
    fetch('todos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=update&task_id=${encodeURIComponent(todoId)}&todo=${encodeURIComponent(todoText)}&is_completed=${isCompleted}&priority=${encodeURIComponent(priority)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== 'success') {
          alert('Error updating todo: ' + data.message);
        }
      })
      .catch((error) => console.error('Error updating todo:', error));
  }

  // Function to delete a todo from the server
  function deleteTodoFromServer(todoId) {
    fetch('todos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=delete&task_id=${encodeURIComponent(todoId)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          // Todo successfully deleted from server
        } else {
          alert('Error deleting todo: ' + data.message);
        }
      })
      .catch((error) => console.error('Error deleting todo:', error));
  }

  // Function to show the options menu for a todo
  function showOptionsMenu(listItem, todoSpan, priorityIndicator, x, y) {
    // Remove existing menu if any
    const existingMenu = document.querySelector('.options-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.classList.add('options-menu');

    // Priority options
    const priorityOptions = [
      { label: 'Set White', color: 'white' },
      { label: 'Set Orange', color: 'orange' },
      { label: 'Set Red', color: 'red' },
    ];

    priorityOptions.forEach((option) => {
      const priorityBtn = document.createElement('button');
      priorityBtn.textContent = option.label;
      priorityBtn.addEventListener('click', () => {
        priorityIndicator.style.backgroundColor = option.color;
        const todoId = listItem.getAttribute('data-id');
        const todoText = todoSpan.textContent;
        const isCompleted = listItem.classList.contains('completed');
        updateTodoOnServer(todoId, todoText, isCompleted, option.color);
        menu.remove();
      });
      menu.appendChild(priorityBtn);
    });

    // Edit todo
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Todo';
    editBtn.addEventListener('click', () => {
      const newText = prompt('Edit todo:', todoSpan.textContent);
      if (newText !== null && newText.trim() !== '') {
        todoSpan.textContent = newText.trim();
        const todoId = listItem.getAttribute('data-id');
        const isCompleted = listItem.classList.contains('completed');
        const priority = priorityIndicator.style.backgroundColor;
        updateTodoOnServer(todoId, newText.trim(), isCompleted, priority);
      }
      menu.remove();
    });
    menu.appendChild(editBtn);

    // Delete todo
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Todo';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this todo?')) {
        const todoId = listItem.getAttribute('data-id');
        if (listItem.classList.contains('completed')) {
          completedCount--;
          updateCompletedCount();
        }
        listItem.remove();
        deleteTodoFromServer(todoId);
      }
      menu.remove();
    });
    menu.appendChild(deleteBtn);

    // Position menu
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    document.body.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener(
      'click',
      function onDocumentClick(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', onDocumentClick);
        }
      },
      { capture: true }
    );
  }

  // Function to add drag and drop functionality
  function addDragAndDrop(listItem) {
    listItem.addEventListener('dragstart', () => {
      listItem.classList.add('dragging');
    });

    listItem.addEventListener('dragend', () => {
      listItem.classList.remove('dragging');
    });

    todoList.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingItem = document.querySelector('.dragging');
      if (!draggingItem) return;
      const afterElement = getDragAfterElement(todoList, e.clientY);
      if (afterElement == null) {
        todoList.appendChild(draggingItem);
      } else {
        todoList.insertBefore(draggingItem, afterElement);
      }
      // Optionally, update the order in the database if needed
    });
  }

  // Helper function to determine where to place the dragged item
  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll('.todo-item:not(.dragging):not(.completed)'),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  // Function to clear all completed todos
  clearCompletedBtn.addEventListener('click', () => {
    const completedTodos = todoList.querySelectorAll('.todo-item.completed');
    completedTodos.forEach((todo) => {
      const todoId = todo.getAttribute('data-id');
      todo.remove();
      deleteTodoFromServer(todoId);
    });
    completedCount = 0;
    updateCompletedCount();
  });

  // Function to insert todo at the correct position
  function insertTodoAtCorrectPosition(listItem) {
    const completedTodos = todoList.querySelectorAll('.todo-item.completed');
    if (completedTodos.length > 0) {
      // Insert before the first completed todo
      todoList.insertBefore(listItem, completedTodos[0]);
    } else {
      // No completed todos, append at the end
      todoList.appendChild(listItem);
    }
  }

  // Function to insert completed todo at the bottom
  function insertCompletedTodoAtCorrectPosition(listItem) {
    todoList.appendChild(listItem);
  }

  // Function to update the completed todos count
  function updateCompletedCount() {
    completedCountElem.textContent = completedCount;
  }
});
