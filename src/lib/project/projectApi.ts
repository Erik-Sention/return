import { database } from '@/lib/firebase/config';
import { ref, set, get, push, remove, update } from 'firebase/database';

export interface RoiProject {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// Definiera en generisk typ för formulärdata
export type FormData = Record<string, unknown>;

// Hämta alla projekt för en användare
export async function getProjects(userId: string): Promise<RoiProject[]> {
  try {
    const projectsRef = ref(database, `users/${userId}/projects`);
    const snapshot = await get(projectsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const projectsData = snapshot.val();
    return Object.values(projectsData);
  } catch (error) {
    console.error('Fel vid hämtning av projekt:', error);
    return [];
  }
}

// Hämta ett specifikt projekt
export async function getProject(userId: string, projectId: string): Promise<RoiProject | null> {
  try {
    const projectRef = ref(database, `users/${userId}/projects/${projectId}`);
    const snapshot = await get(projectRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val();
  } catch (error) {
    console.error('Fel vid hämtning av projekt:', error);
    return null;
  }
}

// Skapa ett nytt projekt
export async function createProject(userId: string, projectData: { name: string; description?: string }): Promise<RoiProject> {
  const projectsRef = ref(database, `users/${userId}/projects`);
  const newProjectRef = push(projectsRef);
  const projectId = newProjectRef.key;
  
  if (!projectId) {
    throw new Error('Kunde inte generera ett projekt-ID');
  }
  
  const timestamp = Date.now();
  const project: RoiProject = {
    id: projectId,
    name: projectData.name,
    description: projectData.description || '',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  await set(newProjectRef, project);
  return project;
}

// Uppdatera ett projekt
export async function updateProject(
  userId: string, 
  projectId: string, 
  projectData: Partial<Pick<RoiProject, 'name' | 'description'>>
): Promise<void> {
  const projectRef = ref(database, `users/${userId}/projects/${projectId}`);
  
  const updates = {
    ...projectData,
    updatedAt: Date.now()
  };
  
  await update(projectRef, updates);
}

// Ta bort ett projekt
export async function deleteProject(userId: string, projectId: string): Promise<void> {
  // Ta bort projektet
  const projectRef = ref(database, `users/${userId}/projects/${projectId}`);
  await remove(projectRef);
  
  // Ta även bort alla formulärdata kopplade till projektet
  const formsRef = ref(database, `users/${userId}/projectForms/${projectId}`);
  await remove(formsRef);
}

// Kopiera data från användarens standardformulär till ett specifikt projekt
export async function initializeProjectFromDefault(userId: string, projectId: string): Promise<void> {
  try {
    // Hämta standardformulärdata
    const formsRef = ref(database, `users/${userId}/forms`);
    const snapshot = await get(formsRef);
    
    if (snapshot.exists()) {
      const defaultForms = snapshot.val();
      
      // Skapa samma struktur för projektet
      const projectFormsRef = ref(database, `users/${userId}/projectForms/${projectId}`);
      await set(projectFormsRef, defaultForms);
    }
  } catch (error) {
    console.error('Fel vid initialisering av projektdata:', error);
    throw error;
  }
}

// Hjälpfunktion för att hämta data från ett projektformulär
export async function getProjectFormData(userId: string, projectId: string, formName: string): Promise<FormData | null> {
  try {
    const formRef = ref(database, `users/${userId}/projectForms/${projectId}/${formName}`);
    const snapshot = await get(formRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val();
  } catch (error) {
    console.error(`Fel vid hämtning av formulär ${formName} för projekt ${projectId}:`, error);
    return null;
  }
}

// Hjälpfunktion för att spara data till ett projektformulär
export async function saveProjectFormData(
  userId: string, 
  projectId: string, 
  formName: string, 
  formData: FormData
): Promise<void> {
  const formRef = ref(database, `users/${userId}/projectForms/${projectId}/${formName}`);
  await set(formRef, formData);
  
  // Uppdatera projektets updatedAt
  const projectRef = ref(database, `users/${userId}/projects/${projectId}`);
  await update(projectRef, { updatedAt: Date.now() });
} 