document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.getElementById('task-input');
  const todoList = document.getElementById('todo-list');
  const completedCountElem = document.getElementById('completed-count');
  const clearCompletedBtn = document.getElementById('clear-completed');
  let completedCount = 0;

  const username = "Wingus"; //placeholder name for now
  document.getElementById("intro-hi").innerHTML = username + "'s To-Do List";

  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && taskInput.value.trim() !== '') {
      addTask(taskInput.value.trim());
      taskInput.value = '';
    }
  });


  function addTask(taskText) {
    const listItem = document.createElement('li');
    const moveIcon = document.createElement('span');
    const taskSpan = document.createElement('span');
    const optionsBtn = document.createElement('button');
    const priorityIndicator = document.createElement('span'); // New element

    listItem.className = 'todo-item';
    moveIcon.className = 'move-icon';
    taskSpan.className = 'task-text';
    optionsBtn.className = 'options-button';
    priorityIndicator.className = 'priority-indicator'; // Assign class

    moveIcon.innerHTML = '&#9776;'; 
    taskSpan.textContent = taskText;
    optionsBtn.textContent = '\u22EE'; 

    priorityIndicator.style.backgroundColor = 'white';

    listItem.appendChild(moveIcon);
    listItem.appendChild(taskSpan);
    listItem.appendChild(priorityIndicator); // Add priority indicator
    listItem.appendChild(optionsBtn);

    listItem.setAttribute('draggable', true);

    // Insert the new task at the correct position
    insertTaskAtCorrectPosition(listItem);
    

    // Event listeners
    taskSpan.addEventListener('click', () => toggleComplete(listItem));
    optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOptionsMenu(listItem, taskSpan, priorityIndicator, e.pageX, e.pageY);
    });

    // Drag and drop functionality
    addDragAndDrop(listItem);
  }

  // Insert the new task after the last uncompleted task
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

  // Toggle task completion
  function toggleComplete(listItem) {
    listItem.classList.toggle('completed');
    const moveIcon = listItem.querySelector('.move-icon');

    if (listItem.classList.contains('completed')) {
      // Remove draggable attribute and hide move icon
      listItem.removeAttribute('draggable');
      moveIcon.style.display = 'none';

      completedCount++;

      // Move the completed task to after the last uncompleted task
      insertCompletedTaskAtCorrectPosition(listItem);
    } else {
      // Re-add draggable attribute and show move icon
      listItem.setAttribute('draggable', true);
      moveIcon.style.display = 'inline';

      completedCount--;

      // Move the uncompleted task back to the correct position
      insertTaskAtCorrectPosition(listItem);
    }
    updateCompletedCount();
  }

  // Insert the completed task at the correct position (after uncompleted tasks)
  function insertCompletedTaskAtCorrectPosition(listItem) {
    todoList.appendChild(listItem);
  }

  // Update completed tasks count
  function updateCompletedCount() {
    completedCountElem.textContent = completedCount;
  }

  // Clear completed tasks
  clearCompletedBtn.addEventListener('click', () => {
    const completedTasks = todoList.querySelectorAll('.todo-item.completed');
    completedTasks.forEach((task) => task.remove());
    completedCount = 0;
    updateCompletedCount();
  });

  // Show options menu
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
        menu.remove();
      });
      menu.appendChild(priorityBtn);
    });

    // Edit task
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Task';
    editBtn.addEventListener('click', () => {
      const newText = prompt('Edit task:', taskSpan.textContent);
      if (newText !== null) {
        taskSpan.textContent = newText.trim();
      }
      menu.remove();
    });
    menu.appendChild(editBtn);

    // Delete task
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Task';
    deleteBtn.addEventListener('click', () => {
      if (listItem.classList.contains('completed')) {
        completedCount--;
        updateCompletedCount();
      }
      listItem.remove();
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

  // Add drag and drop functionality
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
      const afterElement = getDragAfterElement(todoList, e.clientY);
      if (afterElement == null) {
        todoList.appendChild(draggingItem);
      } else {
        todoList.insertBefore(draggingItem, afterElement);
      }
    });
  }

  // Helper function to get the element after which to insert the dragged item
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

  


});
