import PubSub from "./utils/pubsub";
import { EVENTS } from "./utils/constants";
import { projectsManager } from "./models/project";
export const projectForm = {

  setupAddProjectEventListener() {
    const projectModal = document.getElementById('project-dialog')
    const addProjectBtn = document.getElementById('add-project')
    const form = document.getElementById('project-form')
    const errorElement = document.getElementById('error')
    const cancelXbtn = document.getElementById('cancel-project')

    addProjectBtn.addEventListener('click' , () => projectModal.showModal())

    form.querySelector('#cancel').addEventListener('click', () => {
      projectModal.close();
      errorElement.innerHTML = ''
      form.reset()
    })

    cancelXbtn.addEventListener('click', () => {
      projectModal.close();
      errorElement.innerHTML = ''
      form.reset()
    })
    
    form.addEventListener('submit', (ev) => {
      const title = document.querySelector('#project-name').value   
      if (isProjectAlreadyAdded(title)) {
        ev.preventDefault()
        errorElement.textContent = 'Projeto já existe'
        return
      }

      ev.preventDefault()
      this.add(title)
      projectModal.close()
      form.reset()
      errorElement.textContent = ''
    })
  },

  add(title) {
    PubSub.publish(EVENTS.PROJECT_ADDED, title)
  }
}

function isProjectAlreadyAdded(value) {
  const projects = projectsManager.getProjects()
  return projects.some(pro => pro === value)
}