// script.js
class Project {
  constructor(id, name, status, description) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.description = description;
  }

  static async fetchAll() {
    try {
      const response = await fetch('https://686bf76614219674dcc6c504.mockapi.io/projects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map(project => new Project(project.id, project.name, project.status, project.description));
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      return []; // Retorna um array vazio em caso de erro
    }
  }

  static async create(project) {
    try {
      const response = await fetch('https://686bf76614219674dcc6c504.mockapi.io/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newProject = await response.json();
      return new Project(newProject.id, newProject.name, newProject.status, newProject.description);
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      throw error; 
    }
  }

  static async update(id, updatedProject) {
    try {
      const response = await fetch(`https://686bf76614219674dcc6c504.mockapi.io/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const project = await response.json();
      return new Project(project.id, project.name, project.status, project.description);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const response = await fetch(`https://686bf76614219674dcc6c504.mockapi.io/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
      throw error;
    }
  }
}

// Variável global para armazenar todos os projetos
let allProjects = [];

class ProjectController {
  static async loadProjects() {
    try {
      allProjects = await Project.fetchAll();
      View.displayProjects(allProjects);
    } catch (error) {
      console.error("Não foi possível carregar os projetos:", error);
    }
  }

  static async addProject(event) {
    event.preventDefault(); 

    const id = document.getElementById('editingProjectId').value;
    const name = document.getElementById('projectName').value;
    const status = document.getElementById('projectStatus').value;
    const description = document.getElementById('projectDescription').value;

    if (!name || !status || !description) {
      alert("Por favor, preencha todos os campos do projeto.");
      return;
    }

    try {
      if (id) { 
        const updatedProject = await Project.update(id, { name, status, description });
        const index = allProjects.findIndex(p => p.id === id);
        if (index !== -1) {
          allProjects[index] = updatedProject;
          View.updateProjectInView(id, updatedProject);
        }
      } else { 
        const newProjectData = { name, status, description };
        const createdProject = await Project.create(newProjectData);
        allProjects.push(createdProject);
        View.displayNewProject(createdProject); // Chama displayNewProject para adicionar o novo card
      }
      View.clearForm();
      View.toggleModal(); 
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Ocorreu um erro ao salvar o projeto. Tente novamente.");
    }
  }

  static async deleteProject(id) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) {
        return; 
    }
    try {
      await Project.delete(id);
      allProjects = allProjects.filter(p => p.id !== id);
      View.removeProjectFromView(id);
    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
      alert("Ocorreu um erro ao deletar o projeto. Tente novamente.");
    }
  }

  static editProject(id) {
    const project = allProjects.find(p => p.id === id);
    if (project) {
      document.getElementById('modalTitle').textContent = 'Editar Projeto'; 
      document.getElementById('editingProjectId').value = project.id;
      document.getElementById('projectName').value = project.name;
      document.getElementById('projectStatus').value = project.status;
      document.getElementById('projectDescription').value = project.description;
      View.toggleModal(); 
    }
  }
}

class View {
  static displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = ''; 
    if (projects.length === 0) {
      projectsList.innerHTML = '<p class="no-projects">Nenhum projeto encontrado. Adicione um novo!</p>';
      return;
    }
    projects.forEach(project => View.displayNewProject(project));
  }

  static displayNewProject(project) {
    const projectsList = document.getElementById('projectsList');
    const projectDiv = document.createElement('div');
    projectDiv.classList.add('project-card', project.status.toLowerCase().replace(/\s/g, '-'));
    projectDiv.dataset.id = project.id; 

    // Conteúdo HTML do cartão
    projectDiv.innerHTML = `
      <h3>${project.name}</h3>
      <p>Status: ${project.status}</p>
      <p>${project.description}</p>
      <div class="project-actions">
        <button class="edit-btn">Editar</button>
        <button class="delete-btn">Excluir</button>
      </div>
    `;

    // ANEXAR OS LISTENERS AQUI (APÓS O ELEMENTO SER CRIADO E SEUS FILHOS TAMBÉM)
    const editButton = projectDiv.querySelector('.edit-btn');
    const deleteButton = projectDiv.querySelector('.delete-btn');

    editButton.addEventListener('click', () => {
      ProjectController.editProject(project.id);
    });

    deleteButton.addEventListener('click', () => {
      ProjectController.deleteProject(project.id);
    });

    projectsList.appendChild(projectDiv);
  }

  static updateProjectInView(id, updatedProject) {
    const projectDiv = document.querySelector(`.project-card[data-id='${id}']`);
    if (projectDiv) {
      // Atualiza o conteúdo textual
      projectDiv.querySelector('h3').textContent = updatedProject.name;
      projectDiv.querySelector('p:nth-of-type(1)').textContent = `Status: ${updatedProject.status}`;
      projectDiv.querySelector('p:nth-of-type(2)').textContent = updatedProject.description;
      
      // Atualiza as classes de status
      projectDiv.className = 'project-card'; // Reseta as classes existentes
      projectDiv.classList.add(updatedProject.status.toLowerCase().replace(/\s/g, '-'));
    }
  }

  static removeProjectFromView(id) {
    const projectDiv = document.querySelector(`.project-card[data-id='${id}']`);
    if (projectDiv) {
        projectDiv.remove();
    }
  }

  static clearForm() {
    document.getElementById('editingProjectId').value = '';
    document.getElementById('projectName').value = '';
    document.getElementById('projectStatus').value = 'Em andamento'; 
    document.getElementById('projectDescription').value = '';
    document.getElementById('modalTitle').textContent = 'Adicionar Novo Projeto'; 
  }

  static toggleModal() {
    const modal = document.getElementById('projectModal');
    const overlay = document.getElementById('modalOverlay');

    modal.classList.toggle('hidden');
    overlay.classList.toggle('hidden');

    if (!modal.classList.contains('hidden')) {
        setTimeout(() => { 
            modal.classList.add('fade-in');
            overlay.classList.add('fade-in');
        }, 10); 
    } else {
        modal.classList.remove('fade-in');
        overlay.classList.remove('fade-in');
    }
  }

  static filterProjects() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    
    let filtered = allProjects.filter(p =>
      p.name.toLowerCase().includes(search) && (status === '' || p.status === status)
    );
    View.displayProjects(filtered);
  }

  static sortProjects() {
    const sortBy = document.getElementById('sortBy').value;
    let sorted = [...allProjects]; 

    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'status') {
      const statusOrder = { 'Em andamento': 1, 'Atrasado': 2, 'Concluído': 3 };
      sorted.sort((a, b) => {
        if (statusOrder[a.status] && statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.status.localeCompare(b.status); 
      });
    }
    View.displayProjects(sorted);
  }
}

// Event Listeners - Garantindo que tudo seja executado após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded. Initializing app...'); 

  ProjectController.loadProjects();

  document.getElementById('addProjectBtn').addEventListener('click', () => {
    console.log('Add Project button clicked. Opening modal...'); 
    View.clearForm(); 
    View.toggleModal(); 
  });

  document.getElementById('cancelBtn').addEventListener('click', View.toggleModal);

  document.getElementById('projectForm').addEventListener('submit', ProjectController.addProject);

  document.getElementById('fetchProjectsBtn').addEventListener('click', ProjectController.loadProjects);

  document.getElementById('searchInput').addEventListener('input', View.filterProjects);
  document.getElementById('filterStatus').addEventListener('change', View.filterProjects);
  document.getElementById('sortBy').addEventListener('change', View.sortProjects);
});
