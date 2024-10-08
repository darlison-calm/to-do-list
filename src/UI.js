import PubSub from "./utils/pubsub"
import { EVENTS } from "./utils/constants";
import { addDomElement } from "./utils/addDomElement";
import { format} from "date-fns";
import { ptBR } from "date-fns/locale";
import { taskManager, Task } from "./models/task-factory";
import { projectsManager } from "./models/project";
import { editTask } from "./application";
import { saveTaskState } from "./utils/storageManager";
import { deleteProject } from "./application";


export function displayProjectList(projects) {
  const projectsContainer = document.getElementById("projects-container");
  projectsContainer.innerHTML = ''
  
  const projectsToDisplay = projects.slice(1)
  
  projectsToDisplay.forEach(pro => {
    const projectItem = addDomElement({
      tag: 'button',
      textContent: pro,
      className: 'btn-projects',
      attr: {
        'data-index': pro,
        'title': pro
      }
    });

    projectItem.addEventListener('click', (e) => {
      manageActiveBtnStyle(e.target)
      const projectName = e.target.getAttribute('data-index')
      projectsManager.setCurrentProject(projectName)
      displayTasks(taskManager.getTasksByProjectId(projectsManager.getCurrentProject()))
    })
  
    projectsContainer.append(projectItem);
  });
}

function displayTask(task, tasksContainer) {
  const priorityClass = priorityStyle(task.priority)

  const itemTask = addDomElement({
    tag: 'li',
    className: 'list-group-item',
  })

  const checkbox = addDomElement({
    tag: 'input',
    className: 'input-checkbox',
    attr: {
      type: 'checkbox',
      name: 'task-status'
    }
  })
  
  checkbox.addEventListener('change', function() {
    updateTaskCompleteStyle(this.checked, task, title, btnEditIcon, priority, date, description);
    PubSub.publish(EVENTS.TASK_LIST_UPDATE, taskManager.getTasksByProjectId(projectsManager.getCurrentProject()))
  })
  
  const taskDeatils = addDomElement({
    tag: 'div',
    className: 'task-details',
  })

  const title = addDomElement({
    tag: 'h6',
    className: task.complete ? 'completed' : '',
    textContent: task.title
  })

  const description = addDomElement({
    tag: 'p',
    className: task.complete ? ['task-description', 'completed'] : 'task-description',
    textContent: task.description, 
  })

  const taskButtons = addDomElement({
    tag: 'div'
  })

  const btnDelete = addDomElement({
    tag: 'button',
    className: 'btn-delete-task',
    attr: {
      'title': 'Delete Task'
    }
  });
 
  const btnDeleteIcon = addDomElement({
    tag: 'i',
    className: ["fa-solid", "fa-trash", "fa-lg","trash-project"],
    attr: {
      'data-id': task.id
    }
  });

  btnDelete.appendChild(btnDeleteIcon);  

  btnDelete.addEventListener('click', (e) => {
    const index = Number(e.target.dataset.id)
    PubSub.publish(EVENTS.TASK_DELETED, index)
  })

  const btnEdit = addDomElement({
    tag : 'button',
    className: 'btn-edit-task',
    attr : {
      'title' : 'Edit task'
    }
  })

  const btnEditIcon = addDomElement({
    tag: 'i',
    className : task.complete ? ['fa-solid', 'fa-pen-to-square', 'fa-lg', 'completed'] : ['fa-solid', 'fa-pen-to-square', 'fa-lg'],
    attr : {
      'data-id' : task.id
    }
  })

  btnEdit.addEventListener('click', (e) => {
    const taskId = e.target.dataset.id
    handleTaskEditClick(taskManager.getTaskById(taskId), taskId)
  })
  
  btnEdit.appendChild(btnEditIcon);

  const priority = addDomElement({
    tag: 'p',
    className: task.complete ? ['task-priority', 'completed-date-priority', priorityClass] : ['task-priority', priorityClass],
    textContent: `Prioridade: ${task.priority}`
  })

  let dateString = new Date(task.dueDate)
  dateString = new Date(dateString.getTime() - dateString.getTimezoneOffset() * -60000 )
  
  const date = addDomElement({
    tag: 'p',
    className: task.complete ? ['task-due-date', 'completed-date-priority'] : 'task-priority',
    textContent: `Data de vencimento: ${format(dateString, 'MMMM d, yyyy', {locale: ptBR})}`
  })

  const divFlex = addDomElement({
    tag: 'div',
    className: 'd-flex-1'
  }) 

  const divFlexSecond = addDomElement({
    tag: 'div',
    className: 'd-flex'
  })
  
  checkbox.checked = task.complete

  itemTask.appendChild(checkbox)

  taskButtons.appendChild(btnEdit)
  taskButtons.appendChild(btnDelete)
  
  divFlex.appendChild(title)
  divFlex.appendChild(taskButtons)

  divFlexSecond.appendChild(date)
  divFlexSecond.appendChild(priority)
  
  taskDeatils.appendChild(divFlex)
  taskDeatils.appendChild(description)
  taskDeatils.appendChild(divFlexSecond)
  
  itemTask.appendChild(taskDeatils)
  tasksContainer.appendChild(itemTask)
}

export function displayTasks(tasks) {
  const list = document.querySelector('#task-list');
  list.innerHTML = '' 
  const container = document.querySelector('.title-delete-project')
  container.innerHTML = ""
  
  const projectTitle = addDomElement({
    tag: 'p'
  })

  const project =  projectsManager.getCurrentProject();
  projectTitle.textContent = project
  container.appendChild(projectTitle)  
  
  if (project !== 'Semana' && project !== 'Hoje' && project !== 'Inbox') {
    const deleteProjectBtn = displayDeleteProjectBtn(project);
    container.appendChild(deleteProjectBtn);
    
    deleteProjectBtn.addEventListener('click', (e) => {
      const projectId = e.target.getAttribute('data-id');
      deleteProject(projectId);
    });
  }

  tasks.forEach(task => displayTask(task, list))
}

function displayDeleteProjectBtn(project) {
  const btnDelete = addDomElement({
      tag: 'i',
      className: ["fa-solid", "fa-trash", 'fa-lg'],
      attr: {
       'data-id': project
      }
    })
  return btnDelete
}

export function manageActiveBtnStyle(button) {
  document.querySelectorAll('.button-nav').forEach(btn => btn.classList.remove('button-active'));
  document.querySelectorAll('.btn-projects').forEach(btn => btn.classList.remove('button-active'));
  button.classList.add('button-active')
}

export function populateSelectProject(container) {
  const select = document.getElementById(container);
  select.innerHTML = ''

  const items = projectsManager.getProjects()
  items.forEach(item => {
    const option = addDomElement({
      tag : 'option',
      textContent: item,
      attr: {
        value: item
      }
    })
    select.appendChild(option)
  })
}

function updateTaskCompleteStyle(isChecked, task, ...elements) {
  task.complete = isChecked
  saveTaskState()
  elements.forEach(e => {
    if (isChecked) {
      e.classList.add('completed')
    } else {
      e.classList.remove('completed')
    }
  })
}

function handleTaskEditClick(task, taskId) {
  const updateTaskModal = document.querySelector('#update-task-dialog') 
  let updateTaskForm = document.getElementById('update-task-form')
  
  populateSelectProject('update-task-project')
  
  populateForm(updateTaskForm, {
    '#update-task-title' : task.title,
    '#update-task-description' : task.description,
    '#update-task-due-date' : task.dueDate,
    '#update-task-priority' : task.priority,
    '#update-task-project' : task.projectId,
  })
  updateTaskModal.showModal();
  
  const updateFormHandler = e => {
    e.preventDefault()
    let title = document.querySelector('#update-task-title').value
    let description = document.querySelector('#update-task-description').value
    let date = document.querySelector('#update-task-due-date').value
    let priority = document.querySelector('#update-task-priority').value
    let project = document.querySelector('#update-task-project').value
    
    const newTask = new Task(title, date, priority, description, project)

    editTask(newTask, taskId)
    updateTaskModal.close()
  }
 
  updateTaskForm.removeEventListener('submit' , updateFormHandler)
  updateTaskForm.addEventListener('submit', updateFormHandler)
  
  const cancelHandler = () => {
    updateTaskModal.close()
  }

  const cancelButton = updateTaskForm.querySelector('#cancel-task-update')
  const cancelXbtn = document.getElementById('cancel-edit-x')
  cancelButton.removeEventListener('click', cancelHandler)
  cancelXbtn.removeEventListener('click', cancelHandler)
  cancelButton.addEventListener('click', cancelHandler)
  cancelXbtn.addEventListener('click', cancelHandler)
}

function populateForm (form, fieldValues) {
  Object.entries(fieldValues).forEach(([key, value]) => {
    form.querySelector(key).value = value
  })
}

function priorityStyle(priority) {
  const styles = {
    'HIGH' : 'high-priority-task',
    'ALTA' : 'high-priority-task',
    'MEDIUM' : 'medium-priority-task',
    'MÉDIA' : 'medium-priority-task',
    'LOW' : 'low-priority-task',
    'BAIXA' : 'low-priority-task'
  }
  return styles[priority]
}

export function closeNav() {
  toggleClasses('add', 'add')
}

export function openNav() {
  toggleClasses('remove', 'remove')
}

function toggleClasses(sidebarClassAction, tasksViewClassAction) {
  const sidebar = document.querySelector(".sidebar");
  const tasksView = document.querySelector(".tasks-container");

  sidebar.classList[sidebarClassAction]("toogle-sidebar");
  tasksView.classList[tasksViewClassAction]("task-view-focus");
}


