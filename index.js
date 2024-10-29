document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.getElementById('task-input');
  const todoList = document.getElementById('todo-list');
  const completedCountElem = document.getElementById('completed-count');
  const clearCompletedBtn = document.getElementById('clear-completed');
  let completedCount = 0;

  // Load tasks from server when the page loads
  loadTasks();

  // Event listener for adding a new task
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && taskInput.value.trim() !== '') {
      addTaskToServer(taskInput.value.trim(), 'white'); // Default priority is 'white'
      taskInput.value = '';
    }
  });

  // Function to load tasks from the server
  function loadTasks() {
    fetch('tasks.php?action=get', {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          data.tasks.forEach((task) => {
            addTaskToUI(task);
            if (task.is_completed) {
              completedCount++;
            }
          });
          updateCompletedCount();
        } else {
          console.error('Error fetching tasks:', data.message);
        }
      })
      .catch((error) => console.error('Error fetching tasks:', error));
  }

  // Function to add a task to the server
  function addTaskToServer(taskText, priority) {
    fetch('tasks.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=add&task_text=${encodeURIComponent(taskText)}&priority=${encodeURIComponent(priority)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          addTaskToUI(data.task);
        } else {
          alert('Error adding task: ' + data.message);
        }
      })
      .catch((error) => console.error('Error adding task:', error));
  }

  // Function to add a task to the UI
  function addTaskToUI(task) {
    const listItem = document.createElement('li');
    const moveIcon = document.createElement('span');
    const taskSpan = document.createElement('span');
    const priorityIndicator = document.createElement('span');
    const optionsBtn = document.createElement('button');

    listItem.className = 'todo-item';
    listItem.setAttribute('data-id', task.id);
    moveIcon.className = 'move-icon';
    taskSpan.className = 'task-text';
    optionsBtn.className = 'options-button';
    priorityIndicator.className = 'priority-indicator';

    moveIcon.innerHTML = '&#9776;';
    taskSpan.textContent = task.task_text;
    optionsBtn.textContent = '\u22EE';

    priorityIndicator.style.backgroundColor = task.priority;

    listItem.appendChild(moveIcon);
    listItem.appendChild(taskSpan);
    listItem.appendChild(priorityIndicator);
    listItem.appendChild(optionsBtn);

    listItem.setAttribute('draggable', !task.is_completed);

    if (task.is_completed) {
      listItem.classList.add('completed');
      moveIcon.style.display = 'none';
    }

    // Event listeners
    taskSpan.addEventListener('click', () => toggleComplete(listItem));
    optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOptionsMenu(listItem, taskSpan, priorityIndicator, e.pageX, e.pageY);
    });

    // Drag and drop functionality
    if (!task.is_completed) {
      addDragAndDrop(listItem);
    }

    // Append to the correct position
    insertTaskAtCorrectPosition(listItem);

    // Update completed count
    if (task.is_completed) {
      completedCount++;
      updateCompletedCount();
    }
  }

  // Function to toggle task completion
  function toggleComplete(listItem) {
    const taskId = listItem.getAttribute('data-id');
    const isCompleted = listItem.classList.toggle('completed');
    const moveIcon = listItem.querySelector('.move-icon');

    if (isCompleted) {
      listItem.removeAttribute('draggable');
      moveIcon.style.display = 'none';
      completedCount++;
      insertCompletedTaskAtCorrectPosition(listItem);
    } else {
      listItem.setAttribute('draggable', true);
      moveIcon.style.display = 'inline';
      completedCount--;
      insertTaskAtCorrectPosition(listItem);
    }
    updateCompletedCount();

    // Update task status on the server
    const taskText = listItem.querySelector('.task-text').textContent;
    const priority = listItem.querySelector('.priority-indicator').style.backgroundColor;
    updateTaskOnServer(taskId, taskText, isCompleted, priority);
  }

  // Function to update task on the server
  function updateTaskOnServer(taskId, taskText, isCompleted, priority) {
    fetch('tasks.php', {
      method: 'POST', // Changed to POST
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=update&task_id=${encodeURIComponent(taskId)}&task_text=${encodeURIComponent(taskText)}&is_completed=${isCompleted}&priority=${encodeURIComponent(priority)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== 'success') {
          alert('Error updating task: ' + data.message);
        }
      })
      .catch((error) => console.error('Error updating task:', error));
  }
  function deleteTaskFromServer(taskId) {
    fetch('tasks.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=delete&task_id=${encodeURIComponent(taskId)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          // Task successfully deleted from server
        } else {
          alert('Error deleting task: ' + data.message);
        }
      })
      .catch((error) => console.error('Error deleting task:', error));
  }

  // Function to show the options menu for a task
  function showOptionsMenu(listItem, taskSpan, priorityIndicator, x, y) {
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
        const taskId = listItem.getAttribute('data-id');
        const taskText = taskSpan.textContent;
        const isCompleted = listItem.classList.contains('completed');
        updateTaskOnServer(taskId, taskText, isCompleted, option.color);
        menu.remove();
      });
      menu.appendChild(priorityBtn);
    });

    // Edit task
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Task';
    editBtn.addEventListener('click', () => {
      const newText = prompt('Edit task:', taskSpan.textContent);
      if (newText !== null && newText.trim() !== '') {
        taskSpan.textContent = newText.trim();
        const taskId = listItem.getAttribute('data-id');
        const isCompleted = listItem.classList.contains('completed');
        const priority = priorityIndicator.style.backgroundColor;
        updateTaskOnServer(taskId, newText.trim(), isCompleted, priority);
      }
      menu.remove();
    });
    menu.appendChild(editBtn);

    // Delete task
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Task';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this task?')) {
        const taskId = listItem.getAttribute('data-id');
        if (listItem.classList.contains('completed')) {
          completedCount--;
          updateCompletedCount();
        }
        listItem.remove();
        deleteTaskFromServer(taskId);
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

  // Function to clear all completed tasks
  clearCompletedBtn.addEventListener('click', () => {
    const completedTasks = todoList.querySelectorAll('.todo-item.completed');
    completedTasks.forEach((task) => {
      const taskId = task.getAttribute('data-id');
      task.remove();
      deleteTaskFromServer(taskId);
    });
    completedCount = 0;
    updateCompletedCount();
  });

  // Function to insert task at the correct position
  function insertTaskAtCorrectPosition(listItem) {
    const completedTasks = todoList.querySelectorAll('.todo-item.completed');
    if (completedTasks.length > 0) {
      // Insert before the first completed task
      todoList.insertBefore(listItem, completedTasks[0]);
    } else {
      // No completed tasks, append at the end
      todoList.appendChild(listItem);
    }
  }

  // Function to insert completed task at the bottom
  function insertCompletedTaskAtCorrectPosition(listItem) {
    todoList.appendChild(listItem);
  }

  // Function to update the completed tasks count
  function updateCompletedCount() {
    completedCountElem.textContent = completedCount;
  }
});
